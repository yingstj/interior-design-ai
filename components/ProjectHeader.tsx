import { useState, useEffect } from 'react';

interface ProjectHeaderProps {
  projectName: string;
  onRename: (newName: string) => void;
  onSave: () => void;
  onNew: () => void;
  lastSaved: number | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onShowProjects: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projectName, onRename, onSave, onNew, lastSaved, onUndo, onRedo, canUndo, canRedo, onShowProjects }) => {
  const [name, setName] = useState(projectName);

  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name.trim() && name !== projectName) {
      onRename(name.trim());
    } else {
        setName(projectName); // revert if empty or unchanged
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const formatSaveTime = () => {
    if (!lastSaved) return 'Not saved yet';
    return `Last saved: ${new Date(lastSaved).toLocaleTimeString()}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Interior Design</span> AI
          </h1>
          <div className="hidden sm:block h-8 w-px bg-gray-300 mx-2"></div>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="text-lg sm:text-xl font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-teal-500 outline-none px-2 py-1 transition-all duration-200 w-full sm:w-64"
            aria-label="Project Name"
          />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1 mr-2 border-r border-gray-300 pr-3">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
        <span className="hidden md:flex text-sm text-gray-500 whitespace-nowrap items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatSaveTime()}
        </span>
        <button onClick={onShowProjects} className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1 sm:gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">Projects</span>
        </button>
        <button onClick={onSave} className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-sm hover:shadow-md transition-all duration-200">
          <span className="hidden sm:inline">Save Project</span>
          <span className="sm:hidden">Save</span>
        </button>
        <button onClick={onNew} className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm hover:shadow-md transition-all duration-200">
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </div>
  );
};

export default ProjectHeader;
