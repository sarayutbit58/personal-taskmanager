
import React, { useState } from 'react';
import { Chart } from "react-google-charts";
import { Project, Task, TaskStatus, TaskPriority, Comment, ActivityLog } from '../types';
import TaskItem from './TaskItem';
import { EditIcon, TrashIcon, PlusIcon, ChevronDownIcon, TagIcon, ArrowUpIcon, ArrowDownIcon, ArchiveBoxIcon, UserGroupIcon, LinkIcon, ChatBubbleLeftRightIcon, TrophyIcon, ClipboardDocumentListIcon, CheckboxIcon, ChartBarIcon } from './IconComponents';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  comments: Comment[];
  activityLog: ActivityLog[];
  isSelected: boolean;
  onToggleSelect: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onToggleArchive: (projectId: string) => void;
  onAddTask: (projectId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onToggleTaskFocus: (taskId: string) => void;
  onAddSubTask: (parentTask: Task) => void;
  onReorderTasks: (draggedId: string, targetId: string) => void;
  onReorderProject: (draggedId: string, targetId: string) => void;
  onAddComment: (projectId: string, content: string) => void;
}

type Tab = 'Tasks' | 'Timeline' | 'Goals' | 'Comments' | 'Links' | 'Members' | 'Activity';

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
    [TaskPriority.High]: <ArrowUpIcon className="w-4 h-4 text-red-400" />,
    [TaskPriority.Medium]: <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-[2px] bg-yellow-400"></div></div>,
    [TaskPriority.Low]: <ArrowDownIcon className="w-4 h-4 text-green-400" />,
}

const TabButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-secondary hover:bg-secondary hover:text-on-surface'}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const GanttLegend: React.FC = () => (
    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-xs text-on-surface-secondary mt-4 px-2">
        <div className="flex items-center gap-2">
            <div className="w-10 h-3 bg-slate-600 rounded-sm">
                <div className="w-1/2 h-full bg-slate-400 rounded-sm"></div>
            </div>
            <span>Task Progress</span>
        </div>
         <div className="flex items-center gap-2">
            <svg width="24" height="12" viewBox="0 0 24 12" className="overflow-visible">
                <path d="M2,6 L18,6" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
                <path d="M18,6 L13,3" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
                <path d="M18,6 L13,9" stroke="#0ea5e9" strokeWidth="2" fill="none"/>
            </svg>
            <span>Dependency</span>
        </div>
    </div>
);


const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const { 
    project, tasks, comments, activityLog, isSelected, onToggleSelect, onEditProject, onDeleteProject, onToggleArchive, onAddTask,
    onUpdateTaskStatus, onDeleteTask, onEditTask, onToggleTaskFocus, onAddSubTask, onReorderTasks, onReorderProject, onAddComment
  } = props;

  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Tasks');
  const [newComment, setNewComment] = useState('');

  const topLevelTasks = tasks.filter(task => !task.parentId).sort((a,b) => a.order - b.order);
  const doneTasksCount = tasks.filter(t => t.status === TaskStatus.Done).length;
  const progress = tasks.length > 0 ? Math.round((doneTasksCount / tasks.length) * 100) : 0;
  const priorityOrder: Record<TaskPriority, number> = { [TaskPriority.High]: 3, [TaskPriority.Medium]: 2, [TaskPriority.Low]: 1 };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };
  const handleDragEnd = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const draggedId = e.dataTransfer.getData('projectId');
    if (draggedId && draggedId !== project.id) onReorderProject(draggedId, project.id);
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
        onAddComment(project.id, newComment.trim());
        setNewComment('');
    }
  }
  
  const generateTooltipHtml = (task: Task, allTasks: Task[]): string => {
    const deps = task.dependencies
        .map(depId => allTasks.find(t => t.id === depId)?.title)
        .filter(Boolean);

    const startDate = task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A';

    return `
        <div style="padding: 12px; background-color: #0f172a; color: #e2e8f0; border-radius: 8px; border: 1px solid #334155; font-family: sans-serif; font-size: 14px; min-width: 280px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${project.color}; border-bottom: 1px solid #334155; padding-bottom: 8px;">${task.title}</div>
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 4px;">
                <strong style="color: #94a3b8;">Status:</strong> <span>${task.status}</span>
                <strong style="color: #94a3b8;">Priority:</strong> <span>${task.priority}</span>
                <strong style="color: #94a3b8;">Dates:</strong> <span>${startDate} - ${dueDate}</span>
            </div>
            ${deps.length > 0 ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #334155;"><strong>Blocked By:</strong><ul style="margin: 4px 0 0 0; padding-left: 20px;">${deps.map(d => `<li>${d}</li>`).join('')}</ul></div>` : ''}
        </div>
    `;
  };

  const renderTabContent = () => {
      switch(activeTab) {
          case 'Tasks':
            return (
              <div className="space-y-2">
                {tasks.length > 0 ? (
                  topLevelTasks
                    .sort((a,b) => (b.isFocused ? 1 : 0) - (a.isFocused ? 1 : 0) || priorityOrder[b.priority] - priorityOrder[a.priority] || a.order - b.order) 
                    .map(task => (
                      <TaskItem 
                        key={task.id} task={task} allProjectTasks={tasks} level={0}
                        onUpdateStatus={onUpdateTaskStatus} onDelete={onDeleteTask} onEdit={onEditTask}
                        onToggleFocus={onToggleTaskFocus} onAddSubTask={onAddSubTask} onDrop={onReorderTasks}
                      />
                    ))
                ) : (
                  <div className="text-center py-6 text-on-surface-secondary">
                    <p>No tasks yet. Add one to get started!</p>
                  </div>
                )}
              </div>
            );
          case 'Timeline':
              const chartTasks = tasks
                  .filter(task => task.startDate && task.dueDate)
                  .map(task => {
                      let percentComplete = 0;
                      if (task.status === TaskStatus.InProgress) percentComplete = 50;
                      else if (task.status === TaskStatus.Done) percentComplete = 100;
                      
                      const dependencies = task.dependencies.length > 0 ? task.dependencies.join(',') : null;

                      return [
                          task.id,
                          task.title,
                          null, // Resource column for grouping - not used
                          new Date(task.startDate!),
                          new Date(task.dueDate!),
                          null, // Duration is auto-calculated
                          percentComplete,
                          dependencies,
                          generateTooltipHtml(task, tasks)
                      ];
                  });

              if (chartTasks.length === 0) {
                  return <div className="text-center py-6 text-on-surface-secondary">No tasks with start and due dates to display on the timeline.</div>;
              }

              const dataColumns = [
                  { type: 'string', label: 'Task ID' },
                  { type: 'string', label: 'Task Name' },
                  { type: 'string', label: 'Resource' },
                  { type: 'date', label: 'Start Date' },
                  { type: 'date', label: 'End Date' },
                  { type: 'number', label: 'Duration' },
                  { type: 'number', label: 'Percent Complete' },
                  { type: 'string', label: 'Dependencies' },
                  { type: 'string', role: 'tooltip', p: { html: true } }
              ];
              
              const data = [dataColumns, ...chartTasks];
              
              const options = {
                  height: chartTasks.length * 44 + 50,
                  tooltip: { isHtml: true, trigger: 'focus' },
                  gantt: {
                      trackHeight: 44,
                      barHeight: 24,
                      criticalPathEnabled: false,
                      arrow: {
                          angle: 100,
                          width: 2,
                          color: '#0ea5e9', // sky-500
                          radius: 0,
                      },
                      palette: [
                        { "color": project.color, "dark": project.color, "light": project.color }
                      ],
                      innerGridHorizLine: { stroke: '#334155', strokeWidth: 1 },
                      innerGridTrack: { fill: '#1e293b' },
                      innerGridDarkTrack: { fill: '#172031' },
                      labelStyle: {
                        fontName: 'sans-serif',
                        fontSize: 14,
                        color: '#e2e8f0', // on-surface
                      }
                  },
                   backgroundColor: '#1e293b', // surface
              };
              
              return (
                  <div>
                      <Chart
                          chartType="Gantt"
                          width="100%"
                          height="100%"
                          data={data}
                          options={options}
                          loader={<div className="text-on-surface-secondary">Loading Chart...</div>}
                      />
                      <GanttLegend />
                  </div>
              );
          case 'Goals':
             return project.goals.length > 0 ? (
                <div className="space-y-3">
                    {project.goals.map(goal => {
                        const goalProgress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
                        return (
                            <div key={goal.id}>
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold text-on-surface">{goal.title}</span>
                                    <span className="text-on-surface-secondary">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{width: `${goalProgress}%`}}></div></div>
                            </div>
                        )
                    })}
                </div>
            ) : <div className="text-center py-6 text-on-surface-secondary">No goals defined for this project.</div>;
          case 'Comments':
            return (
                <div className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
                        {comments.length > 0 ? comments.map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <img src={comment.authorAvatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full bg-secondary"/>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-semibold text-sm text-on-surface">{comment.authorName}</span>
                                        <span className="text-xs text-on-surface-secondary">{new Date(comment.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-on-surface-secondary">{comment.content}</p>
                                </div>
                            </div>
                        )) : <div className="text-center py-6 text-on-surface-secondary">No comments yet.</div>}
                    </div>
                     <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-secondary border border-slate-600 rounded-md px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                        <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-3 rounded-md transition-colors">Send</button>
                    </form>
                </div>
            );
           case 'Links':
            return project.links.length > 0 ? (
                <ul className="space-y-2 list-disc list-inside">
                    {project.links.map(link => (
                        <li key={link.id} className="text-sm">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link.title}</a>
                        </li>
                    ))}
                </ul>
            ) : <div className="text-center py-6 text-on-surface-secondary">No links attached to this project.</div>;
        case 'Members':
             return project.members.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {project.members.map(member => (
                        <div key={member.id} className="flex items-center gap-2">
                            <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full bg-secondary"/>
                            <div>
                                <p className="font-semibold text-on-surface">{member.name}</p>
                                <p className="text-sm text-on-surface-secondary">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <div className="text-center py-6 text-on-surface-secondary">No members assigned to this project.</div>;
        case 'Activity':
            return (
                 <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                    {activityLog.length > 0 ? activityLog.map(log => (
                        <div key={log.id} className="text-sm">
                            <p className="text-on-surface">{log.action}</p>
                            <p className="text-xs text-on-surface-secondary">{new Date(log.timestamp).toLocaleString()} by {log.author}</p>
                        </div>
                    )) : <div className="text-center py-6 text-on-surface-secondary">No activity recorded for this project yet.</div>}
                </div>
            );
      }
  }

  return (
    <div 
      draggable 
      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} onDragOver={handleDragOver}
      className={`bg-surface rounded-xl shadow-lg w-full overflow-hidden transition-all duration-300 ring-2 ring-transparent ${isDragging ? 'opacity-50 border-dashed border-2 border-primary' : ''} ${isSelected ? '!ring-primary' : ''}`}
      style={{'--project-color': project.color} as React.CSSProperties}
    >
      <div className={`group p-4 flex justify-between items-center cursor-pointer border-l-4 border-[var(--project-color)]`} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
            <button onClick={(e) => { e.stopPropagation(); onToggleSelect(project.id); }} className="p-1 text-on-surface-secondary hover:text-primary transition-colors">
                <CheckboxIcon checked={isSelected} className={`w-6 h-6 ${isSelected ? 'text-primary' : ''}`} />
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span title={project.priority}>{priorityIcons[project.priority]}</span>
                    <h3 className="text-xl font-bold text-on-surface truncate">{project.name}</h3>
                </div>
                <p className="text-sm text-on-surface-secondary mt-1 truncate">{project.description}</p>
            </div>
        </div>
        <div className="flex items-center gap-1 pl-4">
          <button onClick={(e) => { e.stopPropagation(); onToggleArchive(project.id); }} className="p-2 text-on-surface-secondary hover:text-primary rounded-full transition-colors" title={project.isArchived ? 'Restore' : 'Archive'}>
            <ArchiveBoxIcon className="w-5 h-5"/>
          </button>
           <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} className="p-2 text-on-surface-secondary hover:text-primary rounded-full transition-colors" title="Edit">
            <EditIcon className="w-5 h-5"/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project); }} className="p-2 text-on-surface-secondary hover:text-red-500 rounded-full transition-colors" title="Delete">
            <TrashIcon className="w-5 h-5"/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAddTask(project.id); }} className="bg-primary hover:bg-primary-focus text-white rounded-full p-2 ml-2 transition-colors" title="Add Task">
            <PlusIcon className="w-5 h-5"/>
          </button>
          <ChevronDownIcon className={`w-6 h-6 text-on-surface-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
       <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pt-2 pb-4">
           <div className="w-full bg-secondary rounded-full h-1 mb-4">
                <div className="h-1 rounded-full" style={{width: `${progress}%`, transition: 'width 0.5s ease-in-out', backgroundColor: 'var(--project-color)'}}></div>
            </div>
            <div className="flex flex-wrap gap-x-1 gap-y-2 border-b border-slate-700 pb-3 mb-4">
                <TabButton icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} label="Tasks" isActive={activeTab==='Tasks'} onClick={()=>setActiveTab('Tasks')} />
                <TabButton icon={<ChartBarIcon className="w-5 h-5" />} label="Timeline" isActive={activeTab==='Timeline'} onClick={()=>setActiveTab('Timeline')} />
                <TabButton icon={<TrophyIcon className="w-5 h-5"/>} label="Goals" isActive={activeTab==='Goals'} onClick={()=>setActiveTab('Goals')} />
                <TabButton icon={<ChatBubbleLeftRightIcon className="w-5 h-5"/>} label="Comments" isActive={activeTab==='Comments'} onClick={()=>setActiveTab('Comments')} />
                <TabButton icon={<LinkIcon className="w-5 h-5"/>} label="Links" isActive={activeTab==='Links'} onClick={()=>setActiveTab('Links')} />
                <TabButton icon={<UserGroupIcon className="w-5 h-5"/>} label="Members" isActive={activeTab==='Members'} onClick={()=>setActiveTab('Members')} />
                <TabButton icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} label="Activity" isActive={activeTab==='Activity'} onClick={()=>setActiveTab('Activity')} />
            </div>
            <div className="px-2 py-1">
                {renderTabContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
