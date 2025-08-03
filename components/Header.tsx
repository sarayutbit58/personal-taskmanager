
import React, { useRef } from 'react';
import { Project, Task } from '../types';
import { UploadIcon, DownloadIcon, StarIcon, FloppyDiskIcon } from './IconComponents';
import useLocalStorage from '../hooks/useLocalStorage';
import SaveStatusIndicator, { SaveStatus } from './SaveStatusIndicator';

interface HeaderProps {
  projects: Project[];
  tasks: Task[];
  onImport: (data: { projects: Project[]; tasks: Task[] }) => void;
  onAddNewProject: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onManualSave: () => void;
  saveStatus: SaveStatus;
}

const Header: React.FC<HeaderProps> = ({ projects, tasks, onImport, onAddNewProject, searchQuery, setSearchQuery, undo, redo, canUndo, canRedo, onManualSave, saveStatus }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useLocalStorage<string | null>('focusflow_last_backup', null);

  const handleExport = () => {
    const data = {
      projects,
      tasks,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setLastBackup(new Date().toISOString());
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not a string");
        
        const data = JSON.parse(text);
        if (Array.isArray(data.projects) && Array.isArray(data.tasks)) {
           if (window.confirm("Are you sure you want to import this data? This will overwrite your current projects and tasks and clear your undo history.")) {
                onImport(data);
                alert("Data imported successfully!");
           }
        } else {
          throw new Error("Invalid file format.");
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        alert(`Failed to import data. Please check the file format. Error: ${(error as Error).message}`);
      } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-surface/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <StarIcon className="h-8 w-8 text-primary" filled={true}/>
            <h1 className="text-3xl font-bold text-on-surface hidden md:block">FocusFlow</h1>
          </div>
          
          <div className="flex-1 min-w-0 max-w-xl">
             <input
                type="search"
                placeholder="Search tasks and projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border border-slate-600 rounded-lg px-4 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
             />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={undo} disabled={!canUndo} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
            </button>
            <button onClick={redo} disabled={!canRedo} className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" /></svg>
            </button>

            <div className="h-6 border-l border-slate-600 mx-1"></div>
            
            <SaveStatusIndicator status={saveStatus} />

            <button
              onClick={onManualSave}
              title="Save progress"
              disabled={saveStatus === 'saved'}
              className="flex items-center gap-2 bg-secondary hover:bg-slate-600 text-on-surface font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FloppyDiskIcon className="w-5 h-5"/>
              <span className="hidden lg:inline">Save</span>
            </button>

            <div className="group relative">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-secondary hover:bg-slate-600 text-on-surface font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  <DownloadIcon className="w-5 h-5"/>
                  <span className="hidden lg:inline">Export</span>
                </button>
                 {lastBackup && <div className="hidden group-hover:block absolute top-full right-0 mt-2 text-xs bg-slate-600 text-on-surface-secondary px-2 py-1 rounded-md whitespace-nowrap">
                    Last backup: {new Date(lastBackup).toLocaleString()}
                </div>}
            </div>
            
            <button
                onClick={handleImportClick}
                className="flex items-center gap-2 bg-secondary hover:bg-slate-600 text-on-surface font-semibold py-2 px-3 rounded-lg transition-colors"
            >
                <UploadIcon className="w-5 h-5"/>
                <span className="hidden lg:inline">Import</span>
            </button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            
             <button
              onClick={onAddNewProject}
              className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">New</span>
              <span className="sm:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;