import { ProjectNode, TaskNode } from '../../../shared/types';
import { ProjectWithTasks } from './reducers/types';

export interface ProjectCardProps {
    project: ProjectNode;
    isSelected: boolean;
    isLoading: boolean;
    onSelect: (project: ProjectNode) => void;
    onEdit: (project: ProjectNode) => void;
    onDelete: (projectId: string) => void;
}

export interface TaskCardProps {
    task: TaskNode;
    isLoading: boolean;
    onEdit: (task: TaskNode) => void;
    onDelete: (taskId: string) => void;
}

export interface ProjectDialogProps {
    open: boolean;
    project?: ProjectNode;
    lamportCounter: number;
    onClose: () => void;
    onSubmit: (project: Partial<ProjectNode>) => void;
    loading: boolean;
}

export interface TaskDialogProps {
    open: boolean;
    task?: TaskNode;
    projectId: string;
    lamportCounter: number;
    onClose: () => void;
    onSubmit: (task: Partial<TaskNode>) => void;
    loading: boolean;
}

export interface ProjectsSectionProps {
    projects: ProjectNode[];
    selectedProject: ProjectNode | null;
    loading: boolean;
    loadingProjects: Set<string>;
    onProjectSelect: (project: ProjectNode) => void;
    onProjectEdit: (project: ProjectNode) => void;
    onProjectDelete: (projectId: string) => void;
    onProjectCreate: () => void;
}

export interface TasksSectionProps {
    selectedProject: ProjectWithTasks | null;
    loading: boolean;
    loadingTasks: Set<string>;
    onTaskEdit: (task: TaskNode) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskCreate: () => void;
} 