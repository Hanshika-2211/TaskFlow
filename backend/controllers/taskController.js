const Task = require('../models/Task');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const taskData = {
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
    };

    // Parse dueDate if provided
    if (dueDate && dueDate.trim() !== '') {
      taskData.dueDate = new Date(dueDate);
    }

    // Only assign user if a valid ID was provided
    if (assignedTo && assignedTo.trim() !== '') {
      taskData.assignedTo = assignedTo;
    }

    const task = await Task.create(taskData);
    
    // Populate assignee for the response
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task', error: error.message });
  }
};

// @desc    Get all tasks (with optional status filtering)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    // Retrieve tasks and populate assignee details
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks', error: error.message });
  }
};

// @desc    Update a task (status, title, description, assignee, dueDate, priority)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate, priority } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Apply updates if present
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    
    if (dueDate !== undefined) {
      if (dueDate === '' || dueDate === null) {
        task.dueDate = undefined;
      } else {
        task.dueDate = new Date(dueDate);
      }
    }
    
    if (assignedTo !== undefined) {
      if (assignedTo === '' || assignedTo === null) {
        task.assignedTo = undefined;
      } else {
        task.assignedTo = assignedTo;
      }
    }

    await task.save();

    // Populate for return
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');

    res.json(populatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task removed successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
