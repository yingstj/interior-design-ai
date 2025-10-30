import React, { useState, useEffect } from 'react';
import { getAllProjects, deleteProjectFromList, duplicateProject } from '../services/projectService';
import type { Project } from '../types';

interface ProjectListProps {
  currentProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ currentProjectId, onSelectProject, onCreateNew, onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = getAllProjects();
    // Sort by last modified (most recent first)
    const sorted = allProjects.sort((a, b) => b.lastModified - a.lastModified);
    setProjects(sorted);
  };

  const handleDelete = (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      deleteProjectFromList(projectId);
      loadProjects();
      
      // If deleting current project, create a new one
      if (projectId === currentProjectId) {
        onCreateNew();
      }
    }
  };

  const handleDuplicate = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated = duplicateProject(projectId);
    if (duplicated) {
      loadProjects();
      onSelectProject(duplicated);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Create New Button */}
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full mb-4 p-4 border-2 border-dashed border-teal-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 text-teal-700 font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Project
          </button>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No projects yet</p>
              <p className="text-sm mt-2">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project);
                    onClose();
                  }}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    project.id === currentProjectId
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {/* Current Badge */}
                  {project.id === currentProjectId && (
                    <div className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded">
                      CURRENT
                    </div>
                  )}

                  {/* Project Info */}
                  <h3 className="font-bold text-lg text-gray-900 mb-2 pr-20">{project.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>Room: {project.room.width}' x {project.room.height}'</p>
                    <p>Furniture: {project.placedFurniture.length} items</p>
                    <p>Style: {project.stylePreference}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(project.lastModified)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => handleDuplicate(project.id, e)}
                      className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      title="Duplicate project"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, project.name, e)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                      title="Delete project"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectList;

