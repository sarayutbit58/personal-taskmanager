import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { EditIcon, TrashIcon, StarIcon, PlusIcon, ChevronDownIcon, LockClosedIcon, ArrowUpIcon, ArrowDownIcon, CalendarDaysIcon, TagIcon } from './IconComponents';

interface TaskItemProps {
  task: Task;
  allProjectTasks: Task[];
  level: number;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onToggleFocus: (taskId: string) => void;
  onAddSubTask: (parentTask: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.ToDo]: 'bg-slate-500',
  [TaskStatus.InProgress]: 'bg-blue-500',
  [TaskStatus.Done]: 'bg-green-600',
};

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
    [TaskPriority.High]: <ArrowUpIcon className="w-4 h-4 text-red-500" />,
    [TaskPriority.Medium]: <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-[2px] bg-yellow-500"></div></div>,
    [TaskPriority.Low]: <ArrowDownIcon className="w-4 h-4 text-green-500" />,
}

const TaskItem: React.FC<TaskItemProps> = ({ task, allProjectTasks, level, onUpdateStatus, onDelete, onEdit, onToggleFocus, onAddSubTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(task.id, e.target.value as TaskStatus);
  };

  const subTasks = allProjectTasks.filter(t => t.parentId === task.id)
    .sort((a,b) => a.order - b.order);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.Done;

  return (
    <React.Fragment>
      <div 
        id={`task-${task.id}`}
        className={`group relative bg-secondary rounded-lg flex items-start justify-between transition-all duration-300 ${task.isFocused ? 'shadow-glow ring-2 ring-primary' : ''} hover:bg-slate-600`}
        style={{ 
            paddingLeft: `${level * 20 + 8}px`,
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px'
        }}
      >
        <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 flex items-center">
            {subTasks.length > 0 ? (
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-on-surface-secondary hover:text-on-surface rounded-full">
                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
            ) : <div className="w-7"></div>}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: '28px' }}>
          <button onClick={() => onToggleFocus(task.id)} className={`transition-colors ${task.isFocused ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-300'}`}>
            <StarIcon filled={task.isFocused} className="w-5 h-5" />
          </button>
          <div title={task.priority}>{priorityIcons[task.priority]}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-on-surface font-medium truncate`}>{task.title}</p>
            <div className="flex items-center gap-x-3 gap-y-1 text-xs text-on-surface-secondary flex-wrap mt-1">
              {task.dueDate && <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}><CalendarDaysIcon className="w-3 h-3" /><span>{new Date(task.dueDate).toLocaleDateString()}</span></div>}
              {task.tags.length > 0 && <div className="flex items-center gap-1"><TagIcon className="w-3 h-3" /><span>{task.tags.join(', ')}</span></div>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 pl-2">
          <div className="relative">
            <select
              value={task.status}
              onChange={handleStatusChange}
              className={`appearance-none bg-slate-700 border border-slate-600 rounded-md py-1 pl-3 pr-8 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none`}
            >
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className={`absolute top-1/2 right-3 -translate-y-1/2 w-2 h-2 rounded-full ${statusColors[task.status]}`}></div>
          </div>
          <div className="flex items-center gap-0 sm:gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button onClick={() => onAddSubTask(task)} className="p-1 sm:p-2 text-on-surface-secondary hover:text-primary rounded-full transition-colors" aria-label="Add sub-task">
                <PlusIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => onEdit(task)} className="p-1 sm:p-2 text-on-surface-secondary hover:text-primary rounded-full transition-colors" aria-label="Edit task">
                <EditIcon className="w-5 h-5"/>
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 sm:p-2 text-on-surface-secondary hover:text-red-500 rounded-full transition-colors" aria-label="Delete task">
                <TrashIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
      {isExpanded && subTasks.length > 0 && (
         <div className="mt-2 space-y-2">
            {subTasks.map(subTask => (
                <TaskItem
                    key={subTask.id}
                    task={subTask}
                    allProjectTasks={allProjectTasks}
                    level={level + 1}
                    onUpdateStatus={onUpdateStatus}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggleFocus={onToggleFocus}
                    onAddSubTask={onAddSubTask}
                />
            ))}
        </div>
      )}
    </React.Fragment>
  );
};

export default TaskItem;