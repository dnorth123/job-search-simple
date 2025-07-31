import React from 'react';
import type { TodoPriority, TodoCategory } from '../jobTypes';

interface TodoFiltersProps {
  showCompleted: boolean;
  priorityFilter: TodoPriority | 'All';
  categoryFilter: TodoCategory | 'All';
  onShowCompletedChange: (show: boolean) => void;
  onPriorityFilterChange: (priority: TodoPriority | 'All') => void;
  onCategoryFilterChange: (category: TodoCategory | 'All') => void;
  onAddTodo: () => void;
  isLoading?: boolean;
}

const PRIORITY_OPTIONS: (TodoPriority | 'All')[] = ['All', 'High', 'Medium', 'Low'];
const CATEGORY_OPTIONS: (TodoCategory | 'All')[] = ['All', 'Follow-up', 'Preparation', 'Networking', 'Administrative', 'Career Development', 'Other'];

export const TodoFilters: React.FC<TodoFiltersProps> = ({
  showCompleted,
  priorityFilter,
  categoryFilter,
  onShowCompletedChange,
  onPriorityFilterChange,
  onCategoryFilterChange,
  onAddTodo,
  isLoading = false
}) => {
  return (
    <div className="card mb-6">
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as TodoPriority | 'All')}
              className="form-select"
              disabled={isLoading}
            >
              {PRIORITY_OPTIONS.map(priority => (
                <option key={priority} value={priority}>
                  {priority === 'All' ? 'All Priorities' : priority}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value as TodoCategory | 'All')}
              className="form-select"
              disabled={isLoading}
            >
              {CATEGORY_OPTIONS.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Show Completed Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => onShowCompletedChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-neutral-700">Show Completed</span>
            </label>
          </div>

          {/* Spacer */}
          <div></div>

          {/* Add Todo Button */}
          <div className="flex items-end justify-end">
            <button
              onClick={onAddTodo}
              className="btn btn-strategic px-6"
              disabled={isLoading}
            >
              <span className="hidden sm:inline">+ Add Todo</span>
              <span className="sm:hidden">+ Todo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};