import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, Project } from '../types';

interface TaskFormProps {
  onSave: (
    taskData: Omit<Task, 'id' | 'projectId' | 'parentId' | 'isFocused' | 'createdAt' | 'order'>,
    newProjectId: string,
    newParentId: string | null
  ) => void;
  taskToEdit?: Task | null;
  allProjects: Project[];
  allTasks: Task[];
  contextProjectId?: string;
  contextParentId?: string | null;
}

const getDescendants = (taskId: string, tasks: Task[]): Set<string> => {
    const descendants = new Set<string>();
    const queue = [taskId];
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const children = tasks.filter(t => t.parentId === currentId);
        for (const child of children) {
            if (!descendants.has(child.id)) {
                descendants.add(child.id);
                queue.push(child.id);
            }
        }
    }
    return descendants;
};


const TaskForm: React.FC<TaskFormProps> = ({ onSave, taskToEdit, allProjects, allTasks, contextProjectId, contextParentId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tags, setTags] = useState('');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newParentId, setNewParentId] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setStartDate(taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '');
      setTags(taskToEdit.tags.join(', '));
      setNewProjectId(taskToEdit.projectId);
      setNewParentId(taskToEdit.parentId);
    } else {
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.ToDo);
      setPriority(TaskPriority.Medium);
      setStartDate('');
      setDueDate('');
      setTags('');
      setNewProjectId(contextProjectId || '');
      setNewParentId(contextParentId || null);
    }
  }, [taskToEdit, contextProjectId, contextParentId]);

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
    }, newProjectId, newParentId);
  };

  const possibleParentTasks = useMemo(() => {
    if (!taskToEdit) return [];
    const descendants = getDescendants(taskToEdit.id, allTasks);
    return allTasks.filter(t => 
        t.projectId === newProjectId && // Must be in the selected project
        t.id !== taskToEdit.id &&      // Cannot be itself
        !descendants.has(t.id)         // Cannot be a descendant
    );
  }, [taskToEdit, newProjectId, allTasks]);

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
          <div className="relative">
             <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-secondary border border-slate-600 rounded-md pl-3 pr-8 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-on-surface-secondary mb-1">Due Date</label>
           <div className="relative">
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-secondary border border-slate-600 rounded-md pl-3 pr-8 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
            />
          </div>
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

      {taskToEdit && (
        <div className="space-y-4 pt-4 border-t border-slate-700/60">
            <h3 className="text-lg font-semibold text-on-surface">Move Task</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="moveToProject" className="block text-sm font-medium text-on-surface-secondary mb-1">To Project</label>
                    <select
                        id="moveToProject"
                        value={newProjectId}
                        onChange={(e) => {
                            setNewProjectId(e.target.value);
                            setNewParentId(null); // Reset parent when project changes
                        }}
                        className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="moveUnderTask" className="block text-sm font-medium text-on-surface-secondary mb-1">Under Task</label>
                    <select
                        id="moveUnderTask"
                        value={newParentId || ''}
                        onChange={(e) => setNewParentId(e.target.value || null)}
                        className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="">-- None (Top-level task) --</option>
                        {possibleParentTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
            </div>
        </div>
      )}


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