import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, LogOut, Search, RefreshCw, AlertCircle, Loader2, 
  ChevronDown, Calendar, Folder, Bell, Clock, Settings, Info,
  PlusSquare, Trash2, Edit2, Check, ArrowLeft, ArrowRight, User, ShieldAlert, X, Users, UserPlus
} from 'lucide-react';
import { taskService, userService } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & Dropdown states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Add Member form states
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDept, setMemberDept] = useState('');
  const [memberDesig, setMemberDesig] = useState('');
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState('');
  
  // Advanced Features Filters
  const [workspaceType, setWorkspaceType] = useState('team'); // 'team' or 'personal'
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('theme') || 'dual');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarYearNav, setCalendarYearNav] = useState(new Date().getFullYear());
  
  // Filtering & View states
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

  const navigate = useNavigate();
  const notifRef = useRef(null);
  const calendarRef = useRef(null);

  // Color theme cycle helper for cards
  const colorThemes = ['card-coral', 'card-purple', 'card-cyan', 'card-green', 'card-yellow'];

  // Helper to get initials for assignee avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle outside clicks to close notifications/calendar dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme effect: Apply body class on theme change
  useEffect(() => {
    document.body.className = activeTheme === 'dual' ? '' : 'theme-' + activeTheme;
    localStorage.setItem('theme', activeTheme);
  }, [activeTheme]);

  // Load user data, tasks, and users
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
    } catch (err) {
      console.error('Error parsing user data:', err);
      handleLogout();
      return;
    }

    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksData, usersData] = await Promise.all([
        taskService.getAll(),
        userService.getAll()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to connect to backend server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.body.className = ''; // reset theme on logout
    navigate('/login');
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (taskData) => {
    try {
      if (selectedTask) {
        // Update existing task
        const updatedTask = await taskService.update(selectedTask._id, taskData);
        setTasks(tasks.map(t => t._id === selectedTask._id ? updatedTask : t));
      } else {
        // Create new task
        const newTask = await taskService.create(taskData);
        setTasks([newTask, ...tasks]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Submit form error:', err);
      alert(err.response?.data?.message || 'Error processing request.');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.delete(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error('Delete task error:', err);
      alert('Failed to delete task.');
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setMemberError('');
    if (!memberName || !memberEmail) {
      setMemberError('Name and Email are required.');
      return;
    }
    setMemberSubmitting(true);
    try {
      const newMember = await userService.create({
        name: memberName,
        email: memberEmail,
        department: memberDept,
        designation: memberDesig
      });
      setUsers([...users, newMember]);
      
      setMemberName('');
      setMemberEmail('');
      setMemberDept('');
      setMemberDesig('');
      setIsMemberModalOpen(false);
      alert('Team member added successfully!');
    } catch (err) {
      console.error('Add team member error:', err);
      setMemberError(err.response?.data?.message || 'Failed to add team member.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updatedTask = await taskService.update(id, { status: newStatus });
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
    } catch (err) {
      console.error('Status transition error:', err);
      alert('Failed to update task status.');
    }
  };

  // --- Theme change handler ---
  const changeTheme = (themeName) => {
    setActiveTheme(themeName);
    setIsThemeModalOpen(false);
  };

  // --- Calendar calculations ---
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthSelect = (monthIdx) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(monthIdx);
    newDate.setFullYear(calendarYearNav);
    setCalendarDate(newDate);
    setIsCalendarOpen(false);
  };

  const currentMonthYearString = `${monthsList[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;

  // Filter: Match selected calendar month/year scope
  const isTaskInSelectedMonth = (task) => {
    const tDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    return tDate.getMonth() === calendarDate.getMonth() && tDate.getFullYear() === calendarDate.getFullYear();
  };

  // --- Personal vs Team filter mapping ---
  const workspaceTasks = workspaceType === 'personal' && currentUser
    ? tasks.filter(t => t.assignedTo?._id === currentUser.id)
    : tasks;

  // Search filtering
  const filteredTasks = workspaceTasks.filter(task => {
    const titleMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const isSearchMatch = titleMatch || descMatch;
    
    return isSearchMatch && isTaskInSelectedMonth(task);
  });

  // Categorize for Kanban
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const progressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  // Sidebar Tasks: Urgent (Non-completed) Tasks for the sidebar (Calendar month scope does not hide these so you don't miss them!)
  const urgentTasks = workspaceTasks.filter(t => t.status !== 'done');

  // --- Deadline Notifications and Urgency Alerts compiles ---
  const compileDeadlineAlerts = () => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only process incomplete tasks
    tasks.forEach(t => {
      if (t.status === 'done' || !t.dueDate) return;

      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isMyTask = t.assignedTo?._id === currentUser?.id;

      if (diffDays < 0) {
        alerts.push({
          id: t._id,
          title: t.title,
          type: 'overdue',
          isMine: isMyTask,
          prio: t.priority,
          dateText: `Overdue: ${due.toLocaleDateString()}`
        });
      } else if (diffDays === 0) {
        alerts.push({
          id: t._id,
          title: t.title,
          type: 'due-today',
          isMine: isMyTask,
          prio: t.priority,
          dateText: 'Due Today!'
        });
      } else if (diffDays > 0 && diffDays <= 2) {
        alerts.push({
          id: t._id,
          title: t.title,
          type: 'due-soon',
          isMine: isMyTask,
          prio: t.priority,
          dateText: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`
        });
      }
    });

    // Sort alerts: Overdue first, then Due Today, then Due Soon
    const priorityOrder = { 'overdue': 0, 'due-today': 1, 'due-soon': 2 };
    return alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
  };

  const deadlineAlerts = compileDeadlineAlerts();

  // --- Dynamic Stats Calculations ---
  // In personal mode, stats reflect only the user's assigned tasks
  const statsPool = workspaceTasks;
  const totalCount = statsPool.length;
  const doneCount = statsPool.filter(t => t.status === 'done').length;
  const progressCount = statsPool.filter(t => t.status === 'in-progress').length;
  const todoCount = statsPool.filter(t => t.status === 'todo').length;

  const donePercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const unfulfilledPercent = 100 - donePercent;

  // Semicircular gauge calculations
  const gaugeCircumference = 125.65;
  const strokeDashoffset = gaugeCircumference - (donePercent / 100) * gaugeCircumference;

  // Workload bar chart values
  const userActivities = users.slice(0, 5).map(u => {
    const count = tasks.filter(t => t.assignedTo?._id === u._id).length;
    return { name: u.name, count };
  });

  const unassignedCount = tasks.filter(t => !t.assignedTo).length;
  if (unassignedCount > 0 || userActivities.length === 0) {
    userActivities.push({ name: 'Unassigned', count: unassignedCount });
  }
  const maxWorkload = Math.max(...userActivities.map(ua => ua.count), 1);

  return (
    <div className="dashboard-grid">
      {/* LEFT SECTION */}
      <main className="main-section">
        
        {/* 1. Light Workspace Panel */}
        <section className="workspace-panel">
          <header className="workspace-header">
            {/* Calendar Selector Dropdown Wrapper */}
            <div className="month-selector" style={{ position: 'relative' }} ref={calendarRef}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <span>{currentMonthYearString}</span>
                <ChevronDown size={20} />
              </div>

              {isCalendarOpen && (
                <div className="calendar-dropdown">
                  <div className="calendar-dropdown-header">
                    <button 
                      type="button"
                      className="calendar-nav-btn" 
                      onClick={() => setCalendarYearNav(calendarYearNav - 1)}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span>{calendarYearNav}</span>
                    <button 
                      type="button"
                      className="calendar-nav-btn" 
                      onClick={() => setCalendarYearNav(calendarYearNav + 1)}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="calendar-grid">
                    {monthsList.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`calendar-month-item ${calendarDate.getMonth() === idx && calendarDate.getFullYear() === calendarYearNav ? 'active' : ''}`}
                        onClick={() => handleMonthSelect(idx)}
                      >
                        {m.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="workspace-controls">
              {/* Personal vs Team Workspace selector toggle */}
              <div className="space-toggle-container">
                <button
                  type="button"
                  className={`space-btn ${workspaceType === 'team' ? 'active' : ''}`}
                  onClick={() => setWorkspaceType('team')}
                >
                  <Users size={13} />
                  Team
                </button>
                <button
                  type="button"
                  className={`space-btn ${workspaceType === 'personal' ? 'active' : ''}`}
                  onClick={() => setWorkspaceType('personal')}
                >
                  <User size={13} />
                  Personal
                </button>
              </div>

              {/* View layout tabs switcher */}
              <div className="view-tabs">
                <button 
                  className={`tab-btn ${viewMode === 'card' ? 'active' : ''}`}
                  onClick={() => setViewMode('card')}
                >
                  Card
                </button>
                <button 
                  className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>

              {/* Search bar */}
              <div className="workspace-search-wrapper">
                <Search className="workspace-search-icon" />
                <input
                  type="text"
                  className="workspace-search-input"
                  placeholder="Search event, tasks, meeting..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </header>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '200px' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary)' }} />
              <p style={{ color: 'var(--text-light-secondary)', fontSize: '0.9rem' }}>Loading board tasks...</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '200px' }}>
              <div className="auth-error" style={{ border: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.04)', color: '#b91c1c' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <button className="btn-create" onClick={fetchInitialData}>
                <RefreshCw size={12} /> Reconnect
              </button>
            </div>
          ) : viewMode === 'card' ? (
            /* Board View Mode (Columns) */
            <div className="light-board-grid">
              
              {/* To Do Column */}
              <div className="light-board-column">
                <div className="light-column-header">
                  <span>To Do</span>
                  <span className="light-column-count">{todoTasks.length}</span>
                </div>
                <div className="light-cards-container">
                  {todoTasks.length > 0 ? (
                    todoTasks.map((task, idx) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        themeClass={colorThemes[idx % colorThemes.length]}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state-text">No tasks for this month</p>
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="light-board-column">
                <div className="light-column-header">
                  <span>In Progress</span>
                  <span className="light-column-count">{progressTasks.length}</span>
                </div>
                <div className="light-cards-container">
                  {progressTasks.length > 0 ? (
                    progressTasks.map((task, idx) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        themeClass={colorThemes[(idx + 1) % colorThemes.length]}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state-text">No active items this month</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Done Column */}
              <div className="light-board-column">
                <div className="light-column-header">
                  <span>Done</span>
                  <span className="light-column-count">{doneTasks.length}</span>
                </div>
                <div className="light-cards-container">
                  {doneTasks.length > 0 ? (
                    doneTasks.map((task, idx) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        themeClass={colorThemes[(idx + 3) % colorThemes.length]}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state-text">No finished items this month</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Table View Mode */
            <div className="table-view-container">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>Task Description</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(t => (
                      <tr key={t._id}>
                        <td>
                          <div style={{ fontWeight: 800 }}>{t.title}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>{t.description || 'No description'}</div>
                        </td>
                        <td>
                          <span className={`priority-badge prio-${t.priority || 'medium'}`}>
                            {t.priority || 'medium'}
                          </span>
                        </td>
                        <td>
                          {t.dueDate ? (
                            <span style={{ fontWeight: 700 }}>{new Date(t.dueDate).toLocaleDateString()}</span>
                          ) : (
                            <span style={{ opacity: 0.5 }}>No deadline</span>
                          )}
                        </td>
                        <td>
                          {t.assignedTo ? (
                            <span style={{ fontWeight: 700 }}>{t.assignedTo.name || 'Member'}</span>
                          ) : (
                            <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`table-status-badge ${t.status}`}>
                            {t.status === 'in-progress' ? 'In Progress' : t.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="vibrant-action-btn"
                              title="Edit details"
                              onClick={() => handleEditTask(t)}
                              style={{ color: 'inherit' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="vibrant-action-btn"
                              title="Delete task"
                              onClick={() => handleDeleteTask(t._id)}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                        No records match filter parameters for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 2. Dark Analytics Panel */}
        <section className="analytics-panel">
          
          {/* Card A: Task Statistics (Semicircular Gauge) */}
          <div className="stat-card">
            <div className="stat-card-title">
              <span>{workspaceType === 'personal' ? 'My Statistics' : 'Task Statistics'}</span>
              <span className="stat-card-time">All Time</span>
            </div>
            
            <div className="gauge-wrapper">
              <svg className="gauge-svg" viewBox="0 0 100 50">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                  strokeDasharray="125.65 251.3"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeDasharray="125.65 251.3"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="gauge-center-text">
                <span className="gauge-percentage">{donePercent}%</span>
                <span className="gauge-label">Done</span>
              </div>
            </div>

            <div className="stat-gauge-labels">
              <div className="stat-label-item">
                <span className="stat-label-num">{donePercent}%</span>
                <span className="stat-label-txt">Completed</span>
              </div>
              <div className="stat-label-item" style={{ textAlign: 'right' }}>
                <span className="stat-label-num">{unfulfilledPercent}%</span>
                <span className="stat-label-txt">Remaining</span>
              </div>
            </div>
          </div>

          {/* Card B: Task Type (Bubble overlap layout) */}
          <div className="stat-card">
            <div className="stat-card-title">
              <span>{workspaceType === 'personal' ? 'My Status' : 'Task Status'}</span>
              <span className="stat-card-time">Work Split</span>
            </div>

            <div className="bubble-cluster">
              <div className="cluster-circle circle-todo">
                <span className="circle-val">{todoCount}</span>
                <span className="circle-lbl">Todo</span>
              </div>
              <div className="cluster-circle circle-done">
                <span className="circle-val">{doneCount}</span>
                <span className="circle-lbl">Done</span>
              </div>
              <div className="cluster-circle circle-progress">
                <span className="circle-val">{progressCount}</span>
                <span className="circle-lbl">Active</span>
              </div>
            </div>

            <div className="stat-footer-text">
              <div className="stat-footer-item">
                <span>{todoCount}</span> Todo
              </div>
              <div className="stat-footer-item">
                <span>{progressCount}</span> Active
              </div>
              <div className="stat-footer-item">
                <span>{doneCount}</span> Done
              </div>
            </div>
          </div>

          {/* Card C: Workload Activity Bar Chart */}
          <div className="stat-card">
            <div className="stat-card-title">
              <span>Team Workload</span>
              <span className="stat-card-time">Tasks Count</span>
            </div>

            <div className="bar-chart-container">
              <div className="chart-bars">
                {userActivities.map((ua, index) => {
                  const fillHeight = Math.round((ua.count / maxWorkload) * 65) + 5;
                  return (
                    <div className="bar-col" key={index}>
                      <div 
                        className="bar-pill" 
                        data-count={ua.count}
                        style={{ height: `${fillHeight}px` }}
                      />
                      <span className="bar-col-label" title={ua.name}>
                        {getInitials(ua.name)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span>Members workload</span>
              <span>Max: {maxWorkload}</span>
            </div>
          </div>

        </section>
      </main>

      {/* RIGHT SIDEBAR PANEL (Urgent Tasks) */}
      <aside className="sidebar-panel">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Urgent Tasks</h2>
          <div className="sidebar-team">
            {workspaceType === 'personal' ? 'My Incomplete Backlog' : 'Team Incomplete Backlog'} ({urgentTasks.length})
          </div>
        </div>

        <div className="sidebar-task-list">
          {urgentTasks.length > 0 ? (
            urgentTasks.map((t, idx) => {
              const theme = colorThemes[idx % colorThemes.length];
              return (
                <div 
                  key={t._id} 
                  className={`urgent-task-card ${theme}`}
                  onClick={() => handleEditTask(t)}
                >
                  <div className="urgent-card-time" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t.status === 'in-progress' ? 'Active now' : 'Incoming'}</span>
                    {t.priority && <span style={{ fontWeight: 800 }}>{t.priority.toUpperCase()}</span>}
                  </div>
                  <h3 className="urgent-card-title">{t.title}</h3>
                  
                  <div className="urgent-card-meta">
                    <span className="urgent-card-status">
                      {t.status === 'in-progress' ? 'In Progress' : 'To Do'}
                    </span>
                    <div className="urgent-card-members">
                      {t.assignedTo ? (
                        <div className="urgent-card-avatar" title={t.assignedTo.name || 'Member'}>
                          {getInitials(t.assignedTo.name)}
                        </div>
                      ) : (
                        <div className="urgent-card-avatar">?</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p className="empty-state-text" style={{ color: 'var(--text-dark-secondary)' }}>All caught up!</p>
            </div>
          )}
        </div>
      </aside>

      {/* FAR-RIGHT YELLOW TOOLBAR PANEL */}
      <aside className="toolbar-panel">
        <div className="toolbar-top">
          {currentUser && (
            <div 
              className="toolbar-avatar" 
              title="View Profile Details" 
              onClick={() => setIsProfileModalOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              {getInitials(currentUser.name)}
            </div>
          )}

          {/* Quick Create Task Trigger */}
          <button 
            className="toolbar-add-btn" 
            title="Create New Task" 
            onClick={handleCreateTask}
          >
            <Plus size={18} />
          </button>

          {/* Nav Icons */}
          <div className="toolbar-icons">
            {/* Deadline Notification Trigger Bell with Badge */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <Bell 
                className="toolbar-icon" 
                title="Deadline & Urgency Alerts" 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              />
              {deadlineAlerts.length > 0 && (
                <span className="notif-badge">{deadlineAlerts.length}</span>
              )}

              {/* Floating Notifications Dropdown list */}
              {isNotifOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Deadlines & Alerts</h3>
                    <span className="notification-count-tag">{deadlineAlerts.length} Pending</span>
                  </div>
                  <div className="notification-body">
                    {deadlineAlerts.length > 0 ? (
                      deadlineAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className="notification-item"
                          onClick={() => {
                            const task = tasks.find(t => t._id === alert.id);
                            if (task) handleEditTask(task);
                            setIsNotifOpen(false);
                          }}
                        >
                          <div className="notification-item-meta">
                            <span className={`notif-prio-tag ${alert.prio}`}>{alert.prio}</span>
                            <span className={`notif-alert-date ${alert.type}`}>{alert.dateText}</span>
                          </div>
                          <div className="notification-title">{alert.title}</div>
                          {alert.isMine && (
                            <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>
                              Assigned to you
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">
                        <ShieldAlert size={24} />
                        <span>No urgent deadline alerts at this time.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <UserPlus 
              className="toolbar-icon" 
              title="Add Team Member" 
              onClick={() => setIsMemberModalOpen(true)} 
            />
            <Folder className="toolbar-icon" title="Projects Workspace" />
            {/* Settings Icon opens Theme Selector Modal */}
            <Settings 
              className="toolbar-icon" 
              title="Theme Settings" 
              onClick={() => setIsThemeModalOpen(true)}
            />
          </div>
        </div>

        <div className="toolbar-bottom">
          <button 
            className="btn-toolbar-logout" 
            title="Logout Session" 
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Dynamic Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        users={users}
        taskToEdit={selectedTask}
      />

      {/* Theme Selection Dialog Modal */}
      {isThemeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsThemeModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Workspace Settings</h2>
              <button className="btn-close" onClick={() => setIsThemeModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.75rem' }}>Select Theme Preference</label>
                <div className="theme-selector-grid">
                  <div 
                    className={`theme-selector-item ${activeTheme === 'dual' ? 'active' : ''}`}
                    onClick={() => changeTheme('dual')}
                  >
                    <div className="theme-preview-dot dual" />
                    <span>Split Dual</span>
                  </div>
                  <div 
                    className={`theme-selector-item ${activeTheme === 'light' ? 'active' : ''}`}
                    onClick={() => changeTheme('light')}
                  >
                    <div className="theme-preview-dot light" />
                    <span>Full Light</span>
                  </div>
                  <div 
                    className={`theme-selector-item ${activeTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => changeTheme('dark')}
                  >
                    <div className="theme-preview-dot dark" />
                    <span>Full Dark</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsThemeModalOpen(false)}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Member Modal Dialog */}
      {isMemberModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMemberModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Team Participant</h2>
              <button type="button" className="btn-close" onClick={() => setIsMemberModalOpen(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleAddMemberSubmit}>
              <div className="modal-body">
                {memberError && (
                  <div className="auth-error" style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem' }}>
                    <AlertCircle size={16} />
                    <span>{memberError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="memberName">Participant Name *</label>
                  <input
                    type="text"
                    id="memberName"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                    disabled={memberSubmitting}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="memberEmail">Email Address *</label>
                  <input
                    type="email"
                    id="memberEmail"
                    className="form-input"
                    placeholder="e.g. john@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    disabled={memberSubmitting}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="memberDept">Department</label>
                  <input
                    type="text"
                    id="memberDept"
                    className="form-input"
                    placeholder="e.g. Engineering"
                    value={memberDept}
                    onChange={(e) => setMemberDept(e.target.value)}
                    disabled={memberSubmitting}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="memberDesig">Designation</label>
                  <input
                    type="text"
                    id="memberDesig"
                    className="form-input"
                    placeholder="e.g. Frontend Engineer"
                    value={memberDesig}
                    onChange={(e) => setMemberDesig(e.target.value)}
                    disabled={memberSubmitting}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsMemberModalOpen(false)}
                  disabled={memberSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-create"
                  disabled={memberSubmitting}
                >
                  {memberSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Modal Dialog */}
      {isProfileModalOpen && currentUser && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h2 className="modal-title">My Profile</h2>
              <button type="button" className="btn-close" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1rem 2rem 2rem 2rem', textAlign: 'center' }}>
              {/* Large Avatar */}
              <div 
                className="toolbar-avatar" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  fontSize: '2rem', 
                  borderRadius: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'var(--primary)',
                  color: 'white',
                  boxShadow: '0 8px 24px var(--primary-glow)',
                  fontWeight: 800,
                  margin: '0.5rem 0'
                }}
              >
                {getInitials(currentUser.name)}
              </div>
              
              {/* Profile details stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{currentUser.name}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dark-secondary)', fontWeight: 600 }}>{currentUser.email}</p>
              </div>

              {/* Department & Designation Cards */}
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.department || 'Not Specified'}</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dark-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{currentUser.designation || 'Not Specified'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
              <button 
                type="button" 
                className="btn-create" 
                style={{ width: '100%' }}
                onClick={() => setIsProfileModalOpen(false)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
