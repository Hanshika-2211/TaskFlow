import React from 'react';
import { Trash2, Edit2, ArrowLeft, ArrowRight, Check, Calendar } from 'lucide-react';

const TaskCard = ({ task, themeClass = 'card-default', onDelete, onEdit, onStatusChange }) => {
  const { _id, title, description, status, assignedTo, dueDate, priority } = task;

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

  // Helper to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to calculate deadline status & class
  const getDueDateInfo = () => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === 'done') {
      return {
        className: 'due-safe',
        text: `Due: ${formatDate(dueDate)}`,
      };
    }

    if (diffDays < 0) {
      return {
        className: 'due-overdue',
        text: `Overdue: ${formatDate(dueDate)}`,
      };
    } else if (diffDays === 0) {
      return {
        className: 'due-today',
        text: 'Due Today',
      };
    } else if (diffDays > 0 && diffDays <= 2) {
      return {
        className: 'due-soon',
        text: `Due in ${diffDays}d`,
      };
    } else {
      return {
        className: 'due-safe',
        text: `Due: ${formatDate(dueDate)}`,
      };
    }
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <div className={`vibrant-card ${themeClass}`}>
      <div className="vibrant-card-header">
        <h3 className="vibrant-card-title">{title}</h3>
        <div className="vibrant-card-actions">
          <button
            className="vibrant-action-btn"
            title="Edit Task"
            onClick={() => onEdit(task)}
          >
            <Edit2 size={12} />
          </button>
          <button
            className="vibrant-action-btn"
            title="Delete Task"
            onClick={() => onDelete(_id)}
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {description && <p className="vibrant-card-desc">{description}</p>}

      {/* Priority Indicator and Deadline Alerts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
        <span className={`priority-badge prio-${priority || 'medium'}`}>
          {priority || 'medium'}
        </span>
        {dueDateInfo && (
          <span className={`card-due-date ${dueDateInfo.className}`}>
            <Calendar size={11} />
            {dueDateInfo.text}
          </span>
        )}
      </div>

      <div className="vibrant-card-meta">
        <div className="vibrant-card-assignee">
          {assignedTo ? (
            <>
              <div className="vibrant-avatar" title={assignedTo.email}>
                {getInitials(assignedTo.name)}
              </div>
              <span className="vibrant-assignee-name" title={assignedTo.email}>
                {assignedTo.name ? assignedTo.name.split(' ')[0] : 'Member'}
              </span>
            </>
          ) : (
            <>
              <div className="vibrant-avatar" style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.06)' }}>
                U
              </div>
              <span className="vibrant-assignee-name" style={{ fontStyle: 'italic', opacity: 0.6 }}>Unassigned</span>
            </>
          )}
        </div>

        {/* Quick status navigation buttons */}
        <div className="vibrant-status-nav">
          {status === 'in-progress' && (
            <button
              className="vibrant-nav-btn"
              title="Move to Todo"
              onClick={() => onStatusChange(_id, 'todo')}
            >
              <ArrowLeft size={11} /> Todo
            </button>
          )}

          {status === 'todo' && (
            <button
              className="vibrant-nav-btn"
              title="Move to In Progress"
              onClick={() => onStatusChange(_id, 'in-progress')}
            >
              Start <ArrowRight size={11} />
            </button>
          )}

          {status === 'in-progress' && (
            <button
              className="vibrant-nav-btn"
              title="Move to Done"
              onClick={() => onStatusChange(_id, 'done')}
            >
              Done <Check size={11} />
            </button>
          )}

          {status === 'done' && (
            <button
              className="vibrant-nav-btn"
              title="Reopen Task"
              onClick={() => onStatusChange(_id, 'in-progress')}
            >
              <ArrowLeft size={11} /> Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
