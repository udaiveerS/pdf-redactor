import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TasksSection from '../TasksSection';
import { ProjectNode } from '../../../../shared/types';

const mockProject: ProjectNode = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project',
    tasks: [
        {
            id: 'task-1',
            projectId: 'project-1',
            title: 'Task 1',
            status: 'pending',
            configuration: { priority: 1, description: 'Task 1 description' },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            lamportTs: 10
        },
        {
            id: 'task-2',
            projectId: 'project-1',
            title: 'Task 2',
            status: 'completed',
            configuration: { priority: 2, description: 'Task 2 description' },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            lamportTs: 15
        }
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lamportTs: 5
};

const mockProps = {
    selectedProject: mockProject,
    loading: false,
    loadingTasks: new Set<string>(),
    onTaskEdit: jest.fn(),
    onTaskDelete: jest.fn(),
    onTaskCreate: jest.fn()
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('TasksSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render tasks section with task cards when project is selected', () => {
        renderWithTheme(<TasksSection {...mockProps} />);

        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        expect(screen.getByText('New Task')).toBeInTheDocument();
    });

    test('should call onTaskCreate when create button is clicked', () => {
        renderWithTheme(<TasksSection {...mockProps} />);

        const createButton = screen.getByText('New Task');
        fireEvent.click(createButton);

        expect(mockProps.onTaskCreate).toHaveBeenCalled();
    });

    test('should render empty state when no project is selected', () => {
        renderWithTheme(<TasksSection {...mockProps} selectedProject={null} />);

        expect(screen.getByText('Select a project to view tasks')).toBeInTheDocument();
    });

    test('should render empty state when project has no tasks', () => {
        const projectWithoutTasks = { ...mockProject, tasks: [] };
        renderWithTheme(<TasksSection {...mockProps} selectedProject={projectWithoutTasks} />);

        expect(screen.getByText('No tasks yet. Create your first task!')).toBeInTheDocument();
        expect(screen.getByText('New Task')).toBeInTheDocument();
    });
}); 