import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectsSection from '../ProjectsSection';
import { ProjectNode } from '../../../../shared/types';

const mockProjects: ProjectNode[] = [
    {
        id: 'project-1',
        name: 'Project 1',
        description: 'First project',
        taskIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lamportTs: 5
    },
    {
        id: 'project-2',
        name: 'Project 2',
        description: 'Second project',
        taskIds: ['task-1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lamportTs: 15
    }
];

const mockProps = {
    projects: mockProjects,
    selectedProject: null,
    loading: false,
    loadingProjects: new Set<string>(),
    onProjectSelect: jest.fn(),
    onProjectEdit: jest.fn(),
    onProjectDelete: jest.fn(),
    onProjectCreate: jest.fn()
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('ProjectsSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render projects section with project cards', () => {
        renderWithTheme(<ProjectsSection {...mockProps} />);

        expect(screen.getByText('Project 1')).toBeInTheDocument();
        expect(screen.getByText('Project 2')).toBeInTheDocument();
        expect(screen.getByText('New Project')).toBeInTheDocument();
        expect(screen.getByText('0 tasks')).toBeInTheDocument();
        expect(screen.getByText('1 tasks')).toBeInTheDocument();
    });

    test('should call onProjectCreate when create button is clicked', () => {
        renderWithTheme(<ProjectsSection {...mockProps} />);

        const createButton = screen.getByText('New Project');
        fireEvent.click(createButton);

        expect(mockProps.onProjectCreate).toHaveBeenCalled();
    });

    test('should render empty state when no projects exist', () => {
        renderWithTheme(<ProjectsSection {...mockProps} projects={[]} />);

        expect(screen.getByText('New Project')).toBeInTheDocument();
        expect(screen.getByText('No projects yet. Create your first project!')).toBeInTheDocument();
    });
}); 