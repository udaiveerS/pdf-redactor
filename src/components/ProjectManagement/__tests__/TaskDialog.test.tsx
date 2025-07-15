import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TaskDialog from '../TaskDialog';
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
    open: true,
    projectId: 'test-project-1',
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    loading: false
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('TaskDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render dialog with form fields when creating new task', () => {
        renderWithTheme(<TaskDialog {...mockProps} />);

        expect(screen.getByLabelText('Task Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    });

    test('should render dialog with pre-filled data when editing task', () => {
        renderWithTheme(<TaskDialog {...mockProps} task={mockTask} />);

        expect(screen.getByLabelText('Task Title')).toHaveValue('Test Task');
        expect(screen.getByLabelText('Description')).toHaveValue('A test task description');

        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBeGreaterThanOrEqual(2);

        fireEvent.mouseDown(comboboxes[0]);
        const completedOption = screen.getByText('Completed');
        fireEvent.click(completedOption);

        fireEvent.mouseDown(comboboxes[1]);
        const highOption = screen.getByText('High');
        fireEvent.click(highOption);

        fireEvent.click(screen.getByRole('button', { name: /Update/i }));

        expect(mockProps.onSubmit).toHaveBeenCalledWith({
            title: 'Test Task',
            status: 'completed',
            configuration: {
                priority: 3,
                description: 'A test task description',
                dueDate: '2024-12-31'
            },
            lamportTs: 15
        });
    });

    test('should validate required fields', async () => {
        renderWithTheme(<TaskDialog {...mockProps} />);

        fireEvent.change(screen.getByLabelText('Task Title'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Create/i }));

        await waitFor(() => {
            const createButton = screen.getByRole('button', { name: /Create/i });
            expect(createButton).toBeDisabled();
        });
    });
}); 