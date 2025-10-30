import type { Project } from '../types';
import { PROJECT_STORAGE_KEY } from '../constants';

const PROJECTS_LIST_KEY = 'interior-design-ai-projects';
const CURRENT_PROJECT_ID_KEY = 'interior-design-ai-current-project-id';

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly isQuotaExceeded: boolean = false
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

const isQuotaExceededError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }
  return false;
};

// Legacy single project support
export const saveProject = (project: Project): void => {
  try {
    const projectWithTimestamp = {
      ...project,
      lastModified: Date.now(),
    };
    const jsonString = JSON.stringify(projectWithTimestamp);
    localStorage.setItem(PROJECT_STORAGE_KEY, jsonString);
    // Also save to multi-project storage
    saveProjectToList(projectWithTimestamp);
  } catch (error) {
    console.error("Failed to save project to local storage", error);
    
    if (isQuotaExceededError(error)) {
      throw new StorageError(
        'Storage quota exceeded. Please clear some browser data.',
        true
      );
    }
    
    throw new StorageError('Failed to save project. Please check your browser settings.');
  }
};

export const loadProject = (): Project | null => {
  try {
    const savedProjectJSON = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!savedProjectJSON) {
      return null;
    }
    
    const project = JSON.parse(savedProjectJSON) as Project;
    
    // Validate the loaded project has required fields
    if (!project.id || !project.room || !Array.isArray(project.placedFurniture)) {
      console.warn("Invalid project structure in storage, clearing corrupted data");
      localStorage.removeItem(PROJECT_STORAGE_KEY);
      return null;
    }
    
    return project;
  } catch (error) {
    console.error("Failed to load project from local storage", error);
    try {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    } catch (clearError) {
      console.error("Failed to clear corrupted data", clearError);
    }
    return null;
  }
};

export const clearProject = (): void => {
  try {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  } catch (error) {
      console.error("Failed to clear project from local storage", error);
  }
};

// Multi-project management
export const getAllProjects = (): Project[] => {
  try {
    const projectsJSON = localStorage.getItem(PROJECTS_LIST_KEY);
    if (projectsJSON) {
      return JSON.parse(projectsJSON) as Project[];
    }
    return [];
  } catch (error) {
    console.error("Failed to load projects list", error);
    return [];
  }
};

export const saveProjectToList = (project: Project): void => {
  try {
    const projects = getAllProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    const projectWithTimestamp = {
      ...project,
      lastModified: Date.now(),
    };
    
    if (existingIndex >= 0) {
      projects[existingIndex] = projectWithTimestamp;
    } else {
      projects.push(projectWithTimestamp);
    }
    
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projects));
    setCurrentProjectId(project.id);
  } catch (error) {
    console.error("Failed to save project to list", error);
  }
};

export const deleteProjectFromList = (projectId: string): void => {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(filtered));
    
    // If deleting current project, clear the current ID
    if (getCurrentProjectId() === projectId) {
      localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
    }
  } catch (error) {
    console.error("Failed to delete project", error);
  }
};

export const getProjectById = (projectId: string): Project | null => {
  const projects = getAllProjects();
  return projects.find(p => p.id === projectId) || null;
};

export const duplicateProject = (projectId: string): Project | null => {
  try {
    const original = getProjectById(projectId);
    if (!original) return null;
    
    const duplicate: Project = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      lastModified: Date.now(),
    };
    
    saveProjectToList(duplicate);
    return duplicate;
  } catch (error) {
    console.error("Failed to duplicate project", error);
    return null;
  }
};

export const getCurrentProjectId = (): string | null => {
  return localStorage.getItem(CURRENT_PROJECT_ID_KEY);
};

export const setCurrentProjectId = (projectId: string): void => {
  localStorage.setItem(CURRENT_PROJECT_ID_KEY, projectId);
};

export const loadCurrentProject = (): Project | null => {
  const currentId = getCurrentProjectId();
  if (currentId) {
    return getProjectById(currentId);
  }
  
  // Fallback to legacy single project
  return loadProject();
};
