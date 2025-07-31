import React, { useState, useEffect } from 'react';
import type { Todo, TodoPriority, TodoCategory, JobApplication } from '../jobTypes';

interface TodoFormProps {
  todo?: Todo | null;
  jobs?: JobApplication[];
  onSave: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRIORITY_OPTIONS: TodoPriority[] = ['High', 'Medium', 'Low'];
const CATEGORY_OPTIONS: TodoCategory[] = ['Follow-up', 'Preparation', 'Networking', 'Administrative', 'Career Development', 'Other'];

export const TodoForm: React.FC<TodoFormProps> = ({
  todo,
  jobs = [],
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [form, setForm] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    due_date: todo?.due_date ? todo.due_date.slice(0, 10) : '',
    priority: todo?.priority || 'Medium' as TodoPriority,
    category: todo?.category || 'Other' as TodoCategory,
    linked_job_id: todo?.linked_job_id || ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (todo) {
      setForm({
        title: todo.title,
        description: todo.description || '',
        due_date: todo.due_date ? todo.due_date.slice(0, 10) : '',
        priority: todo.priority,
        category: todo.category || 'Other',
        linked_job_id: todo.linked_job_id || ''
      });
    }
  }, [todo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!form.title.trim()) {
      newErrors.push('Title is required');
    }

    if (form.title.length > 255) {
      newErrors.push('Title must be less than 255 characters');
    }

    if (form.description && form.description.length > 1000) {
      newErrors.push('Description must be less than 1000 characters');
    }

    if (form.due_date) {
      const dueDate = new Date(form.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(dueDate.getTime())) {
        newErrors.push('Invalid due date');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'> = {
        user_id: '', // Will be set by the parent component
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due_date: form.due_date || undefined,
        priority: form.priority,
        category: form.category,
        completed: todo?.completed || false,
        linked_job_id: form.linked_job_id || undefined
      };

      await onSave(todoData);
    } catch (error) {
      console.error('Error saving todo:', error);
      setErrors(['Failed to save todo. Please try again.']);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="card-header sticky top-0 bg-white z-10 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {todo ? 'Edit Todo' : 'Add New Todo'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="card-body overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter todo title..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="form-input"
                placeholder="Enter description (optional)..."
                disabled={isLoading}
              />
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-neutral-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLoading}
                >
                  {PRIORITY_OPTIONS.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLoading}
                >
                  {CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-neutral-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {/* Linked Job */}
            {jobs.length > 0 && (
              <div>
                <label htmlFor="linked_job_id" className="block text-sm font-medium text-neutral-700 mb-2">
                  Link to Job Application (Optional)
                </label>
                <select
                  id="linked_job_id"
                  name="linked_job_id"
                  value={form.linked_job_id}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLoading}
                >
                  <option value="">No job linked</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.position} at {job.company?.name || 'Unknown Company'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  todo ? 'Update Todo' : 'Add Todo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};