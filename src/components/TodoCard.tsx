import React from 'react';
import type { Todo, TodoPriority, TodoCategory } from '../jobTypes';

interface TodoCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  isLoading?: boolean;
}

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  High: 'text-red-600 bg-red-50 border-red-200',
  Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  Low: 'text-green-600 bg-green-50 border-green-200'
};

const CATEGORY_COLORS: Record<TodoCategory, string> = {
  'Follow-up': 'text-blue-600 bg-blue-50 border-blue-200',
  'Preparation': 'text-purple-600 bg-purple-50 border-purple-200',
  'Networking': 'text-indigo-600 bg-indigo-50 border-indigo-200',
  'Administrative': 'text-gray-600 bg-gray-50 border-gray-200',
  'Career Development': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Other': 'text-neutral-600 bg-neutral-50 border-neutral-200'
};

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onEdit,
  onToggle,
  onDelete,
  isLoading = false
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate: string) => {
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'due-today';
    if (daysUntil <= 3) return 'due-soon';
    return 'due-later';
  };

  const getDueDateColor = (dueDate: string) => {
    const status = getDueDateStatus(dueDate);
    switch (status) {
      case 'overdue': return 'text-red-600';
      case 'due-today': return 'text-orange-600';
      case 'due-soon': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div 
      className={`todo-card ${isLoading ? 'loading' : ''} ${todo.completed ? 'completed' : ''}`}
      data-priority={todo.priority}
      data-category={todo.category}
    >
      {/* Header with Priority and Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {/* Checkbox */}
            <button
              onClick={() => onToggle(todo)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                todo.completed 
                  ? 'bg-executive border-executive' 
                  : 'border-neutral-300 hover:border-executive'
              }`}
              disabled={isLoading}
            >
              {todo.completed && (
                <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Title */}
            <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
              {todo.title}
            </h3>
          </div>
          
          {/* Priority and Category Badges */}
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[todo.priority]}`}>
              {todo.priority}
            </span>
            {todo.category && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[todo.category]}`}>
                {todo.category}
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(todo)}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
            disabled={isLoading}
            title="Edit todo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(todo)}
            className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            disabled={isLoading}
            title="Delete todo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {todo.description && (
        <div className="mb-4">
          <p className={`text-sm ${todo.completed ? 'text-neutral-500' : 'text-neutral-700'}`}>
            {todo.description}
          </p>
        </div>
      )}

      {/* Due Date */}
      {todo.due_date && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm font-medium ${getDueDateColor(todo.due_date)}`}>
              Due: {formatDate(todo.due_date)}
              {getDueDateStatus(todo.due_date) === 'overdue' && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Overdue
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Linked Job */}
      {todo.linked_job && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
            </svg>
            <span className="text-sm text-neutral-600">
              Linked to: {todo.linked_job.position} at {todo.linked_job.company?.name || 'Unknown Company'}
            </span>
          </div>
        </div>
      )}

      {/* Created Date */}
      <div className="text-xs text-neutral-500">
        Created: {formatDate(todo.created_at)}
      </div>
    </div>
  );
};