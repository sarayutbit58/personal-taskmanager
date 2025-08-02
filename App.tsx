import React, { useState, useEffect } from 'react';
import { Project, Task, TaskStatus, TaskPriority, AppState, Comment, ActivityLog } from './types';
import useLocalStorage, { useUndoableState } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Modal from './components/Modal';
import ProjectForm from './components/ProjectForm';
import TaskForm from './components/TaskForm';

type ModalState = 
  | { type: 'CLOSED' }
  | { type: 'CREATE_PROJECT' }
  | { type: 'EDIT_PROJECT', project: Project }
  | { type: 'CREATE_TASK', projectId: string, parentId?: string | null }
  | { type: 'EDIT_TASK', task: Task }
  | { type: 'CONFIRM_DELETE_PROJECT', project: Project }
  | { type: 'CONFIRM_BULK_DELETE', projectIds: string[] };

const App: React.FC = () => {
    const [persistedState, setPersistedState] = useLocalStorage<AppState>('focusflow_data', { projects: [], tasks: [], comments: {}, activityLog: {} });
    const { state, setState, undo, redo, canUndo, canRedo, resetState } = useUndoableState<AppState>(persistedState);
    
    const [modalState, setModalState] = useState<ModalState>({ type: 'CLOSED' });
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        const oldState = persistedState as any;
        const needsMigration = !oldState.comments || !oldState.activityLog || oldState.projects.some((p: Project) => p.color === undefined) || oldState.tasks.some((t: Task) => t.startDate === undefined);

        if (needsMigration) {
            const migratedState: AppState = {
                projects: (oldState.projects || []).map((p: any) => ({
                    ...p,
                    priority: p.priority || TaskPriority.Medium,
                    isArchived: p.isArchived || false,
                    color: p.color || '#334155',
                    members: p.members || [],
                    goals: p.goals || [],
                    links: p.links || [],
                })),
                tasks: (oldState.tasks || []).map((t: any) => ({
                    ...t,
                    startDate: t.startDate || t.createdAt,
                })),
                comments: oldState.comments || {},
                activityLog: oldState.activityLog || {},
            };
            setPersistedState(migratedState);
            resetState(migratedState);
        }
    }, []);

    useEffect(() => {
        if (JSON.stringify(state) !== JSON.stringify(persistedState)) {
            setPersistedState(state);
        }
    }, [state, setPersistedState, persistedState]);

    const createActivityLog = (projectId: string, action: string): ActivityLog => ({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: "You", // Simulated user
        action,
    });
    
    // Project Handlers
    const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'order' | 'isArchived'>) => {
        setState(current => {
            if (modalState.type === 'EDIT_PROJECT') {
                const updatedProject = { ...modalState.project, ...projectData };
                const log = createActivityLog(updatedProject.id, `edited project details for "${updatedProject.name}".`);
                return {
                    ...current,
                    projects: current.projects.map(p => p.id === modalState.project.id ? updatedProject : p),
                    activityLog: { ...current.activityLog, [updatedProject.id]: [...(current.activityLog[updatedProject.id] || []), log] }
                };
            } else {
                const newProject: Project = {
                    id: `proj_${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    order: (current.projects.reduce((max, p) => Math.max(p.order, max), -1) + 1),
                    isArchived: false,
                    ...projectData
                };
                const log = createActivityLog(newProject.id, `created project "${newProject.name}".`);
                return { 
                    ...current, 
                    projects: [...current.projects, newProject],
                    activityLog: { ...current.activityLog, [newProject.id]: [log] }
                };
            }
        });
        setModalState({ type: 'CLOSED' });
    };

    const requestDeleteProject = (project: Project) => setModalState({ type: 'CONFIRM_DELETE_PROJECT', project });

    const confirmDeleteProject = () => {
        if (modalState.type !== 'CONFIRM_DELETE_PROJECT') return;
        const { id, name } = modalState.project;
        setState(current => {
            const newLog = { ...current.activityLog };
            delete newLog[id];
            const newComments = { ...current.comments };
            delete newComments[id];
            return {
                projects: current.projects.filter(p => p.id !== id),
                tasks: current.tasks.filter(t => t.projectId !== id),
                comments: newComments,
                activityLog: newLog,
            };
        });
        setModalState({ type: 'CLOSED' });
    };

    const handleToggleArchive = (projectId: string) => {
        setState(current => {
            const project = current.projects.find(p => p.id === projectId);
            if (!project) return current;
            const isArchiving = !project.isArchived;
            const log = createActivityLog(projectId, isArchiving ? `archived project "${project.name}".` : `restored project "${project.name}".`);
            return {
                ...current,
                projects: current.projects.map(p => p.id === projectId ? { ...p, isArchived: isArchiving } : p),
                activityLog: { ...current.activityLog, [projectId]: [...(current.activityLog[projectId] || []), log] }
            };
        });
    };
    
    // Task Handlers
    const handleSaveTask = (
      taskData: Omit<Task, 'id' | 'projectId' | 'parentId' | 'isFocused' | 'createdAt' | 'order'>,
      newProjectId: string,
      newParentId: string | null
    ) => {
      setState(current => {
        let logAction: string;
        let finalTasks: Task[];
        let finalActivityLog = { ...current.activityLog };
        
        if (modalState.type === 'EDIT_TASK') {
          const originalTask = modalState.task;
          logAction = `edited task "${taskData.title}".`;
    
          const hasMoved = originalTask.projectId !== newProjectId || originalTask.parentId !== newParentId;
          const taskWithData = { ...originalTask, ...taskData };
    
          if (hasMoved) {
            const tempTask = { ...taskWithData, projectId: newProjectId, parentId: newParentId };
            const otherTasks = current.tasks.filter(t => t.id !== originalTask.id);
            
            const oldSiblings = otherTasks
              .filter(t => t.projectId === originalTask.projectId && t.parentId === originalTask.parentId)
              .sort((a, b) => a.order - b.order)
              .map((t, index) => ({ ...t, order: index }));
            const oldSiblingMap = new Map(oldSiblings.map(t => [t.id, t]));
            
            const newSiblings = otherTasks.filter(t => t.projectId === newProjectId && t.parentId === newParentId);
            const taskWithNewOrder = { ...tempTask, order: newSiblings.length };

            finalTasks = otherTasks.map(t => oldSiblingMap.get(t.id) || t);
            finalTasks.push(taskWithNewOrder);

            if (originalTask.projectId !== newProjectId) {
                const logMove = createActivityLog(newProjectId, `moved task "${taskData.title}" into this project.`);
                finalActivityLog[newProjectId] = [...(finalActivityLog[newProjectId] || []), logMove];
            }
          } else {
            finalTasks = current.tasks.map(t => t.id === originalTask.id ? taskWithData : t);
          }
           
          const logEdit = createActivityLog(originalTask.projectId, logAction);
          finalActivityLog[originalTask.projectId] = [...(finalActivityLog[originalTask.projectId] || []), logEdit];

          return { ...current, tasks: finalTasks, activityLog: finalActivityLog };

        } else if (modalState.type === 'CREATE_TASK') {
          logAction = `created task "${taskData.title}".`;
          const siblingTasks = current.tasks.filter(t => t.projectId === newProjectId && t.parentId === newParentId);
          const newTask: Task = {
            id: `task_${Date.now()}`,
            projectId: newProjectId,
            parentId: newParentId,
            isFocused: false,
            createdAt: new Date().toISOString(),
            order: (siblingTasks.reduce((max, t) => Math.max(t.order, max), -1) + 1),
            ...taskData,
          };
          finalTasks = [...current.tasks, newTask];
          const log = createActivityLog(newProjectId, logAction);
          finalActivityLog[newProjectId] = [...(finalActivityLog[newProjectId] || []), log];
          return { ...current, tasks: finalTasks, activityLog: finalActivityLog };
        } else {
          return current;
        }
      });
      setModalState({ type: 'CLOSED' });
    };

    const handleDeleteTask = (taskId: string) => {
        setState(current => {
            const taskToDelete = current.tasks.find(t => t.id === taskId);
            if (!taskToDelete) return current;

            const tasksToDelete = new Set<string>([taskId]);
            let search = true;
            while(search) {
                const currentSize = tasksToDelete.size;
                current.tasks.forEach(task => {
                    if (task.parentId && tasksToDelete.has(task.parentId)) tasksToDelete.add(task.id);
                });
                search = tasksToDelete.size > currentSize;
            }
            
            const log = createActivityLog(taskToDelete.projectId, `deleted task "${taskToDelete.title}".`);
            return {
                ...current,
                tasks: current.tasks.filter(t => !tasksToDelete.has(t.id)),
                activityLog: { ...current.activityLog, [taskToDelete.projectId]: [...(current.activityLog[taskToDelete.projectId] || []), log] }
            };
        });
    };

    const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task || task.status === status) return;
        setState(current => {
            const log = createActivityLog(task.projectId, `changed status of task "${task.title}" to ${status}.`);
            return {
                ...current,
                tasks: current.tasks.map(t => t.id === taskId ? { ...t, status } : t),
                activityLog: { ...current.activityLog, [task.projectId]: [...(current.activityLog[task.projectId] || []), log] }
            };
        });
    };

    const handleReorder = <T extends {id: string, order: number}>(draggedId: string, targetId: string, list: T[], position: 'top' | 'bottom' = 'top'): T[] => {
        const draggedItem = list.find(p => p.id === draggedId);
        if (!draggedItem) return list;

        const reorderedList = list
            .filter(p => p.id !== draggedId)
            .sort((a, b) => a.order - b.order);

        let targetIndex = reorderedList.findIndex(p => p.id === targetId);
        if (targetIndex === -1) return list;
        
        if (position === 'bottom') {
            targetIndex++;
        }
        
        reorderedList.splice(targetIndex, 0, draggedItem);
        
        return reorderedList.map((item, index) => ({...item, order: index}));
    };
    
    const handleReorderProjects = (draggedId: string, targetId: string) => setState(current => ({ ...current, projects: handleReorder(draggedId, targetId, current.projects)}));
    
    // New Feature Handlers
    const handleAddComment = (projectId: string, content: string) => {
        setState(current => {
            const newComment: Comment = {
                id: `comm_${Date.now()}`,
                projectId,
                authorName: "You",
                authorAvatarUrl: "https://i.pravatar.cc/40?u=current_user",
                content,
                createdAt: new Date().toISOString(),
            };
            const log = createActivityLog(projectId, `added a comment.`);
            return {
                ...current,
                comments: { ...current.comments, [projectId]: [...(current.comments[projectId] || []), newComment] },
                activityLog: { ...current.activityLog, [projectId]: [...(current.activityLog[projectId] || []), log] }
            };
        });
    };
    
    const handleBulkDelete = (projectIds: string[]) => setModalState({ type: 'CONFIRM_BULK_DELETE', projectIds });
    const confirmBulkDelete = () => {
        if(modalState.type !== 'CONFIRM_BULK_DELETE') return;
        const idsToDelete = new Set(modalState.projectIds);
        setState(current => ({
            projects: current.projects.filter(p => !idsToDelete.has(p.id)),
            tasks: current.tasks.filter(t => !idsToDelete.has(t.projectId)),
            comments: Object.fromEntries(Object.entries(current.comments).filter(([pid]) => !idsToDelete.has(pid))),
            activityLog: Object.fromEntries(Object.entries(current.activityLog).filter(([pid]) => !idsToDelete.has(pid))),
        }));
        setModalState({ type: 'CLOSED' });
    };

    const handleBulkArchive = (projectIds: string[]) => {
         setState(current => {
            const idsToArchive = new Set(projectIds);
            let updatedActivity = { ...current.activityLog };
            const updatedProjects = current.projects.map(p => {
                if(idsToArchive.has(p.id)) {
                    const log = createActivityLog(p.id, `archived project "${p.name}".`);
                    updatedActivity[p.id] = [...(updatedActivity[p.id] || []), log];
                    return { ...p, isArchived: true };
                }
                return p;
            });
            return { ...current, projects: updatedProjects, activityLog: updatedActivity };
        });
    };
    
    // Import/Export and Modal Rendering
    const handleImportData = (data: AppState) => {
        const migratedData: AppState = { // Ensure imported data fits the newest schema
            projects: (data.projects || []).map((p: any) => ({
                priority: TaskPriority.Medium, isArchived: false, color: '#334155', members: [], goals: [], links: [], ...p,
            })),
            tasks: (data.tasks || []).map((t: any) => ({
                ...t,
                startDate: t.startDate || t.createdAt,
            })),
            comments: data.comments || {},
            activityLog: data.activityLog || {},
        };
        resetState(migratedData);
    };

    const renderModalContent = () => {
        switch (modalState.type) {
            case 'CREATE_PROJECT': return <ProjectForm onSave={handleSaveProject} />;
            case 'EDIT_PROJECT': return <ProjectForm onSave={handleSaveProject} projectToEdit={modalState.project} />;
            case 'CREATE_TASK':
            case 'EDIT_TASK':
                const isEdit = modalState.type === 'EDIT_TASK';
                return <TaskForm 
                    onSave={handleSaveTask} 
                    taskToEdit={isEdit ? modalState.task : undefined}
                    allProjects={state.projects}
                    allTasks={state.tasks}
                    contextProjectId={isEdit ? undefined : modalState.projectId}
                    contextParentId={isEdit ? undefined : modalState.parentId}
                />;
            case 'CONFIRM_DELETE_PROJECT': return (
                <div>
                    <p className="text-on-surface-secondary mb-6">Delete "<strong>{modalState.project.name}</strong>"? This also deletes all its tasks and cannot be undone.</p>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setModalState({ type: 'CLOSED' })} className="bg-secondary hover:bg-slate-600 font-bold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">Delete</button>
                    </div>
                </div>
            );
            case 'CONFIRM_BULK_DELETE': return (
                 <div>
                    <p className="text-on-surface-secondary mb-6">Delete <strong>{modalState.projectIds.length}</strong> project(s)? This is permanent and cannot be undone.</p>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setModalState({ type: 'CLOSED' })} className="bg-secondary hover:bg-slate-600 font-bold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">Delete</button>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    const getModalTitle = () => {
        switch (modalState.type) {
            case 'CREATE_PROJECT': return 'Create New Project';
            case 'EDIT_PROJECT': return 'Edit Project';
            case 'CREATE_TASK': return modalState.parentId ? 'Create New Sub-task' : 'Create New Task';
            case 'EDIT_TASK': return 'Edit Task';
            case 'CONFIRM_DELETE_PROJECT': return 'Delete Project';
            case 'CONFIRM_BULK_DELETE': return 'Bulk Delete Projects';
            default: return '';
        }
    }

    return (
        <div className="min-h-screen bg-background font-sans">
            <Header 
                projects={state.projects} tasks={state.tasks} onImport={handleImportData} 
                onAddNewProject={() => setModalState({ type: 'CREATE_PROJECT' })} 
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
            />
            <Dashboard
                appState={state}
                searchQuery={searchQuery}
                onEditProject={(project) => setModalState({ type: 'EDIT_PROJECT', project })}
                onDeleteProject={requestDeleteProject}
                onToggleArchive={handleToggleArchive}
                onAddTask={(projectId) => setModalState({ type: 'CREATE_TASK', projectId })}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onEditTask={(task) => setModalState({ type: 'EDIT_TASK', task })}
                onToggleTaskFocus={(taskId) => setState(current => ({ ...current, tasks: current.tasks.map(t => t.id === taskId ? { ...t, isFocused: !t.isFocused } : t)}))}
                onAddSubTask={(parentTask) => setModalState({ type: 'CREATE_TASK', projectId: parentTask.projectId, parentId: parentTask.id })}
                onReorderProject={handleReorderProjects}
                onAddComment={handleAddComment}
                onBulkDelete={handleBulkDelete}
                onBulkArchive={handleBulkArchive}
            />
            <Modal isOpen={modalState.type !== 'CLOSED'} onClose={() => setModalState({ type: 'CLOSED' })} title={getModalTitle()}>
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default App;