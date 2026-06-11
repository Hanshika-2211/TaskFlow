const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name email department designation isTeamLead');
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

// @desc    Create a new team participant
// @route   POST /api/users
// @access  Private
const createUser = async (req, res) => {
  try {
    const { name, email, department, designation, isTeamLead } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Please provide name and email for the participant' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A team member with this email already exists' });
    }

    // Set default password so members can log in immediately
    const password = 'password123';

    const user = await User.create({
      name,
      email,
      password,
      department: department || '',
      designation: designation || '',
      isTeamLead: !!isTeamLead,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      isTeamLead: user.isTeamLead,
    });
  } catch (error) {
    console.error('Create participant error:', error);
    res.status(500).json({ message: 'Server error creating participant', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
};
