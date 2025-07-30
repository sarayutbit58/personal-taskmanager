import React, { useState, useEffect } from 'react';
import { Project, TaskPriority, ProjectRole, Member, Goal, Link } from '../types';

interface ProjectFormProps {
  onSave: (projectData: {
    name: string;
    description: string;
    priority: TaskPriority;
    tags: string[];
    color: string;
    members: Member[];
    goals: Goal[];
    links: Link[];
  }) => void;
  projectToEdit?: Project | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSave, projectToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [color, setColor] = useState('#334155'); // default slate-700
  const [members, setMembers] = useState(''); // "name (role), name2 (role)"
  const [goals, setGoals] = useState(''); // "title (current/target unit), ..."
  const [links, setLinks] = useState(''); // "title (url), ..."

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setTags(projectToEdit.tags.join(', '));
      setPriority(projectToEdit.priority || TaskPriority.Medium);
      setColor(projectToEdit.color || '#334155');
      setMembers(projectToEdit.members.map(m => `${m.name} (${m.role})`).join(', '));
      setGoals(projectToEdit.goals.map(g => `${g.title} (${g.currentValue}/${g.targetValue} ${g.unit})`).join(', '));
      setLinks(projectToEdit.links.map(l => `${l.title} (${l.url})`).join(', '));
    } else {
      setName('');
      setDescription('');
      setTags('');
      setPriority(TaskPriority.Medium);
      setColor('#334155');
      setMembers('');
      setGoals('');
      setLinks('');
    }
  }, [projectToEdit]);

  const parseMembers = (text: string): Member[] => {
    return text.split(',')
      .map((part, index) => {
        const match = part.trim().match(/^(.*)\s\((Owner|Collaborator|Viewer)\)$/i);
        if (match) {
          return {
            id: `mem_${Date.now()}_${index}`,
            name: match[1].trim(),
            role: match[2] as ProjectRole,
            avatarUrl: `https://i.pravatar.cc/40?u=${match[1].trim()}`
          };
        }
        return null;
      })
      .filter((m): m is Member => m !== null);
  };

  const parseGoals = (text: string): Goal[] => {
     return text.split(',').map((part, index) => {
        const match = part.trim().match(/^(.*?)\s\((\d+)\/(\d+)\s(.*)\)$/);
        if (match) {
            return {
                id: `goal_${Date.now()}_${index}`,
                title: match[1].trim(),
                currentValue: parseInt(match[2]),
                targetValue: parseInt(match[3]),
                unit: match[4].trim(),
            };
        }
        return null;
     }).filter((g): g is Goal => g !== null);
  };
  
  const parseLinks = (text: string): Link[] => {
      return text.split(',').map((part, index) => {
          const match = part.trim().match(/^(.*?)\s\((https?:\/\/[^\s]+)\)$/);
          if (match) {
              return {
                  id: `link_${Date.now()}_${index}`,
                  title: match[1].trim(),
                  url: match[2].trim()
              };
          }
          return null;
      }).filter((l): l is Link => l !== null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Project name cannot be empty.");
      return;
    }
    onSave({ 
      name, 
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      priority,
      color,
      members: parseMembers(members),
      goals: parseGoals(goals),
      links: parseLinks(links)
    });
  };
  
  const colors = ['#334155', '#be123c', '#be185d', '#9d174d', '#7e22ce', '#581c87', '#1d4ed8', '#1e3a8a', '#047857', '#14532d', '#a16207', '#78350f', '#7f1d1d'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-on-surface-secondary mb-1">Project Name</label>
          <input id="projectName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Website Redesign" className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
        </div>
         <div>
          <label htmlFor="projectPriority" className="block text-sm font-medium text-on-surface-secondary mb-1">Priority</label>
          <select id="projectPriority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none">
            {Object.values(TaskPriority).map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium text-on-surface-secondary mb-1">Description</label>
        <textarea id="projectDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the project" rows={2} className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
      </div>
       <div>
         <label htmlFor="projectColor" className="block text-sm font-medium text-on-surface-secondary mb-1">Project Color</label>
         <div className="flex flex-wrap gap-2">
            {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary' : ''}`} style={{ backgroundColor: c }} aria-label={`Select color ${c}`}/>
            ))}
         </div>
       </div>
      <div>
        <label htmlFor="projectTags" className="block text-sm font-medium text-on-surface-secondary mb-1">Tags</label>
        <input id="projectTags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="design, marketing, Q4" className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
        <p className="text-xs text-on-surface-secondary mt-1">Comma-separated values.</p>
      </div>
      <div>
        <label htmlFor="projectMembers" className="block text-sm font-medium text-on-surface-secondary mb-1">Members</label>
        <textarea id="projectMembers" value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Alice (Owner), Bob (Collaborator)" rows={2} className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
        <p className="text-xs text-on-surface-secondary mt-1">Format: Name (Role), Name (Role). Roles: Owner, Collaborator, Viewer.</p>
      </div>
       <div>
        <label htmlFor="projectGoals" className="block text-sm font-medium text-on-surface-secondary mb-1">Goals</label>
        <textarea id="projectGoals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="User Retention (75/90 %), Launch Features (2/5 tasks)" rows={2} className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
        <p className="text-xs text-on-surface-secondary mt-1">Format: Title (Current/Target Unit), ...</p>
      </div>
       <div>
        <label htmlFor="projectLinks" className="block text-sm font-medium text-on-surface-secondary mb-1">Links</label>
        <textarea id="projectLinks" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Figma Mockups (https://figma.com/...)" rows={2} className="w-full bg-secondary border border-slate-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
        <p className="text-xs text-on-surface-secondary mt-1">Format: Title (URL), ...</p>
      </div>
      <div className="flex justify-end pt-2 sticky bottom-0 bg-surface py-3">
        <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center">
          {projectToEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;