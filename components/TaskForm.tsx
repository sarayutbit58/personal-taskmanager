import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Project } from '../types';

interface TaskFormProps {
  onSave: (task: Omit<Task, 'id' | 'projectId' | 'parentId' | 'isFocused' | 'createdAt' | 'order'>) => void;
  taskToEdit?: Task | null;
  projectTasks: Task[];
}

const TaskForm: React.FC<TaskFormProps> = ({ onSave, taskToEdit, projectTasks }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tags, setTags] = useState('');
  const [dependencies, setDependencies] = useState<string[]>([]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setStartDate(taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '');
      setTags(taskToEdit.tags.join(', '));
      setDependencies(taskToEdit.dependencies);
    } else {
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.ToDo);
      setPriority(TaskPriority.Medium);
      setStartDate('');
      setDueDate('');
      setTags('');
      setDependencies([]);
    }
  }, [taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Task title cannot be empty.");
      return;
    }
    onSave({ 
      title, 
      description, 
      status, 
      priority, 
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      dependencies
    });
  };

  const availableDependencies = projectTasks.filter(t => t.id !== taskToEdit?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="taskTitle" className="block text-sm font-medium text-on-surface-secondary mb-1">Task Title</label>
        <input
          id="taskTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Design the landing page"
          className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="taskDescription" className="block text-sm font-medium text-on-surface-secondary mb-1">Description</label>
        <textarea
          id="taskDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details about the task"
          rows={3}
          className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="taskStatus" className="block text-sm font-medium text-on-surface-secondary mb-1">Status</label>
            <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
            >
            {Object.values(TaskStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
            ))}
            </select>
        </div>
        <div>
            <label htmlFor="taskPriority" className="block text-sm font-medium text-on-surface-secondary mb-1">Priority</label>
            <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
            >
            {Object.values(TaskPriority).map((p) => (
                <option key={p} value={p}>{p}</option>
            ))}
            </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-on-surface-secondary mb-1">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-on-surface-secondary mb-1">Due Date</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>
       <div>
        <label htmlFor="taskTags" className="block text-sm font-medium text-on-surface-secondary mb-1">Tags</label>
        <input
          id="taskTags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., frontend, urgent"
          className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <p className="text-xs text-on-surface-secondary mt-1">Comma-separated values.</p>
      </div>
       <div>
        <label htmlFor="dependencies" className="block text-sm font-medium text-on-surface-secondary mb-1">Blocked By</label>
        <select
            id="dependencies"
            multiple
            value={dependencies}
            onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full h-32 bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
        >
            {availableDependencies.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
            ))}
        </select>
        <p className="text-xs text-on-surface-secondary mt-1">Hold Ctrl/Cmd to select multiple tasks.</p>
       </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          {taskToEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;