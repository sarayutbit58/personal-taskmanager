import React, { useState, useMemo } from 'react';
import { Project, Task, TaskStatus, TaskPriority, AppState, Comment, ActivityLog } from '../types';
import ProjectCard from './ProjectCard';
import { StarIcon, TagIcon, ArchiveBoxIcon, CheckCircleIcon, TrashIcon } from './IconComponents';

interface DashboardProps {
    appState: AppState;
    searchQuery: string;
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
    onBulkDelete: (projectIds: string[]) => void;
    onBulkArchive: (projectIds: string[]) => void;
}

type FilterStatus = TaskStatus | 'All' | 'Focused';

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { appState, searchQuery, onBulkDelete, onBulkArchive, ...restHandlers } = props;
    const { projects, tasks, comments, activityLog } = appState;

    const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
    const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        projects.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        tasks.forEach(t => t.tags.forEach(t => tagSet.add(t)));
        return ['All', ...Array.from(tagSet).sort()];
    }, [projects, tasks]);
    
    const filteredData = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const finalProjects = projects.filter(project => {
            if (project.isArchived !== showArchived) return false;
            
            const projectMatchesSearch = !lowerCaseQuery || project.name.toLowerCase().includes(lowerCaseQuery) || project.description.toLowerCase().includes(lowerCaseQuery);
            const projectMatchesPriority = priorityFilter === 'All' || project.priority === priorityFilter;
            const projectMatchesTag = tagFilter === 'All' || project.tags.includes(tagFilter);

            if (projectMatchesSearch && projectMatchesPriority && projectMatchesTag) {
                if (statusFilter === 'All') return true;
            }
            
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const hasMatchingTask = projectTasks.some(task => {
                const statusMatch = statusFilter === 'All' || (statusFilter === 'Focused' ? task.isFocused : task.status === statusFilter);
                const priorityMatch = priorityFilter === 'All' || task.priority === priorityFilter;
                const tagMatch = tagFilter === 'All' || task.tags.includes(tagFilter) || project.tags.includes(tagFilter);
                const searchMatch = !lowerCaseQuery || task.title.toLowerCase().includes(lowerCaseQuery);
                return statusMatch && priorityMatch && tagMatch && searchMatch;
            });

            return hasMatchingTask;
        });

        const finalProjectIds = new Set(finalProjects.map(p => p.id));
        const finalTasks = tasks.filter(task => finalProjectIds.has(task.projectId));
        
        return { projects: finalProjects, tasks: finalTasks };

    }, [searchQuery, projects, tasks, statusFilter, priorityFilter, tagFilter, showArchived]);

    const tasksByProject = useMemo(() => {
        return filteredData.tasks.reduce((acc, task) => {
            if (!acc[task.projectId]) acc[task.projectId] = [];
            acc[task.projectId].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [filteredData.tasks]);
    
    const priorityOrder: Record<TaskPriority, number> = { [TaskPriority.High]: 3, [TaskPriority.Medium]: 2, [TaskPriority.Low]: 1 };

    const handleToggleSelect = (projectId: string) => {
        setSelectedProjects(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
    };

    const handleSelectAll = () => {
        if (selectedProjects.length === filteredData.projects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredData.projects.map(p => p.id));
        }
    }

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">Projects Dashboard</h2>
                <div className="flex flex-wrap items-center justify-center gap-2 bg-surface p-1 rounded-lg">
                    {([ 'All', TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Done, 'Focused'] as FilterStatus[]).map(option => (
                        <button key={option} onClick={() => setStatusFilter(option)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === option ? 'bg-primary text-white' : 'text-on-surface-secondary hover:bg-secondary'}`}>
                           {option === 'Focused' ? <StarIcon className="w-5 h-5 inline-block" /> : option}
                        </button>
                    ))}
                </div>
            </div>
             <div className="mb-6 flex flex-wrap items-center gap-4">
                <span className="font-semibold text-on-surface-secondary">Filter by:</span>
                <div className="flex items-center bg-surface p-1 rounded-lg">
                    <span className="text-sm font-semibold text-on-surface-secondary pl-2 pr-1">Priority</span>
                    {(['All', TaskPriority.High, TaskPriority.Medium, TaskPriority.Low] as (TaskPriority | 'All')[]).map(option => (
                        <button key={option} onClick={() => setPriorityFilter(option)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${priorityFilter === option ? 'bg-primary text-white' : 'text-on-surface-secondary hover:bg-secondary'}`}>{option}</button>
                    ))}
                </div>
                <div className="flex items-center bg-surface p-1 rounded-lg">
                    <TagIcon className="w-4 h-4 ml-2 mr-1 text-on-surface-secondary"/>
                    <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-on-surface-secondary focus:outline-none">
                        {allTags.map(tag => <option key={tag} value={tag} className="bg-secondary text-on-surface">{tag}</option>)}
                    </select>
                </div>
                 <div className="flex items-center bg-surface p-1 rounded-lg ml-auto">
                    <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${showArchived ? 'bg-primary text-white' : 'text-on-surface-secondary hover:bg-secondary'}`}>
                        <ArchiveBoxIcon className="w-4 h-4"/>
                        {showArchived ? 'Viewing Archived' : 'View Archived'}
                    </button>
                </div>
            </div>

            {selectedProjects.length > 0 && (
                <div className="sticky top-20 z-30 bg-surface/95 backdrop-blur-sm rounded-lg p-3 mb-4 flex justify-between items-center ring-1 ring-primary/50 shadow-lg">
                    <span className="font-semibold">{selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onBulkArchive(selectedProjects)} className="flex items-center gap-2 bg-secondary hover:bg-slate-600 text-on-surface font-semibold py-2 px-3 rounded-lg transition-colors">
                            <ArchiveBoxIcon className="w-5 h-5"/> Archive
                        </button>
                         <button onClick={() => onBulkDelete(selectedProjects)} className="flex items-center gap-2 bg-red-800/50 hover:bg-red-800/80 text-red-300 font-semibold py-2 px-3 rounded-lg transition-colors">
                            <TrashIcon className="w-5 h-5"/> Delete
                        </button>
                    </div>
                </div>
            )}

            {filteredData.projects.length > 0 ? (
                <div className="space-y-8">
                     <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm text-on-surface-secondary hover:text-primary transition-colors">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>{selectedProjects.length === filteredData.projects.length ? 'Deselect All' : 'Select All'}</span>
                     </button>
                    {filteredData.projects
                        .sort((a,b) => (priorityOrder[b.priority] - priorityOrder[a.priority]) || a.order - b.order)
                        .map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            tasks={tasksByProject[project.id] || []}
                            comments={comments[project.id] || []}
                            activityLog={activityLog[project.id]?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || []}
                            isSelected={selectedProjects.includes(project.id)}
                            onToggleSelect={handleToggleSelect}
                            onToggleArchive={restHandlers.onToggleArchive}
                            onAddComment={restHandlers.onAddComment}
                            {...restHandlers}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-surface rounded-lg">
                    <h3 className="text-xl font-semibold">No Projects Found</h3>
                    <p className="text-on-surface-secondary mt-2">
                        {projects.length === 0 
                            ? "Get started by creating a new project!" 
                            : showArchived ? "There are no archived projects." : "No projects match the current search or filters."}
                    </p>
                </div>
            )}
        </main>
    );
};

export default Dashboard;