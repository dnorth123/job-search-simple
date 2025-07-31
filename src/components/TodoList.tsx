import React from 'react';
import type { Todo, TodoPriority, TodoCategory } from '../jobTypes';
import { TodoCard } from './TodoCard';

interface TodoListProps {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  isLoading?: boolean;
  showCompleted?: boolean;
  priorityFilter?: TodoPriority | 'All';
  categoryFilter?: TodoCategory | 'All';
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onEdit,
  onToggle,
  onDelete,
  isLoading = false,
  showCompleted = false,
  priorityFilter = 'All',
  categoryFilter = 'All'
}) => {
  const filteredTodos = todos.filter(todo => {
    // Filter by completion status
    if (!showCompleted && todo.completed) {
      return false;
    }
    
    // Filter by priority
    if (priorityFilter !== 'All' && todo.priority !== priorityFilter) {
      return false;
    }
    
    // Filter by category
    if (categoryFilter !== 'All' && todo.category !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // Sort by priority first (High > Medium > Low)
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // Then sort by due date (earliest first, null dates last)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    
    // Finally sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="todo-cards-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedTodos.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-neutral-500 mb-4">
            {todos.length === 0 ? 'No todos yet' : 'No todos match your filters'}
          </div>
          {todos.length === 0 && (
            <div className="text-sm text-neutral-600">
              Create your first todo to get started with task management
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="todo-cards-grid">
      {sortedTodos.map(todo => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};