import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TaskCard from '../TaskCard';
import { TaskNode } from '../../../../shared/types';

const mockTask: TaskNode = {
    id: 'test-task-1',
    projectId: 'test-project-1',
    title: 'Test Task',
    status: 'in_progress',
    configuration: {
        priority: 2,
        description: 'A test task description',
        dueDate: '2024-12-31'
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lamportTs: 15
};

const mockProps = {
    task: mockTask,
    isLoading: false,
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

describe('TaskCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render task card with correct information', () => {
        renderWithTheme(<TaskCard {...mockProps} />);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('A test task description')).toBeInTheDocument();
        expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    test('should call onEdit when edit button is clicked', () => {
        renderWithTheme(<TaskCard {...mockProps} />);

        const editButton = screen.getByTestId('EditIcon').closest('button');
        fireEvent.click(editButton!);

        expect(mockProps.onEdit).toHaveBeenCalledWith(mockTask);
    });

    test('should call onDelete when delete button is clicked', () => {
        renderWithTheme(<TaskCard {...mockProps} />);

        const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
        fireEvent.click(deleteButton!);

        expect(mockProps.onDelete).toHaveBeenCalledWith('test-task-1');
    });

    test('should show loading state when isLoading is true', () => {
        renderWithTheme(<TaskCard {...mockProps} isLoading={true} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });
}); 