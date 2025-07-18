import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectCard from '../ProjectCard';
import { ProjectNode } from '../../../../shared/types';

const mockProject: ProjectNode = {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project description',
    taskIds: ['task-1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lamportTs: 5
};

const mockProps = {
    project: mockProject,
    isSelected: false,
    isLoading: false,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('ProjectCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render project card with correct information', () => {
        renderWithTheme(<ProjectCard {...mockProps} />);

        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('1 tasks')).toBeInTheDocument();
        expect(screen.getByText('A test project description')).toBeInTheDocument();
    });

    test('should call onSelect when card is clicked', () => {
        renderWithTheme(<ProjectCard {...mockProps} />);

        const card = screen.getByText('Test Project').closest('div');
        fireEvent.click(card!);

        expect(mockProps.onSelect).toHaveBeenCalledWith(mockProject);
    });

    test('should call onEdit when edit button is clicked', () => {
        renderWithTheme(<ProjectCard {...mockProps} />);

        const editButton = screen.getByTestId('EditIcon').closest('button');
        fireEvent.click(editButton!);

        expect(mockProps.onEdit).toHaveBeenCalledWith(mockProject);
    });

    test('should call onDelete when delete button is clicked', () => {
        renderWithTheme(<ProjectCard {...mockProps} />);

        const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
        fireEvent.click(deleteButton!);

        expect(mockProps.onDelete).toHaveBeenCalledWith('test-project-1');
    });

    test('should show loading state when isLoading is true', () => {
        renderWithTheme(<ProjectCard {...mockProps} isLoading={true} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });
}); 