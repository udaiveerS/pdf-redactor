import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectDialog from '../ProjectDialog';
import { ProjectNode } from '../../../../shared/types';

const mockProject: ProjectNode = {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project description',
    taskIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lamportTs: 10
};

const mockProps = {
    open: true,
    lamportCounter: 42,
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

describe('ProjectDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render dialog with form fields when creating new project', () => {
        renderWithTheme(<ProjectDialog {...mockProps} />);

        expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    });

    test('should render dialog with pre-filled data when editing project', () => {
        renderWithTheme(<ProjectDialog {...mockProps} project={mockProject} />);

        expect(screen.getByLabelText('Project Name')).toHaveValue('Test Project');
        expect(screen.getByLabelText('Description')).toHaveValue('A test project description');
        expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
    });

    test('should call onSubmit with form data when form is submitted', async () => {
        renderWithTheme(<ProjectDialog {...mockProps} />);

        fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: 'New Name' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Description' } });
        fireEvent.click(screen.getByRole('button', { name: /Create/i }));

        await waitFor(() => {
            expect(mockProps.onSubmit).toHaveBeenCalledWith({
                name: 'New Name',
                description: 'New Description',
                lamportTs: expect.any(Number)
            });
        });
    });

    test('should validate required fields', async () => {
        renderWithTheme(<ProjectDialog {...mockProps} project={mockProject} />);

        fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Update/i }));

        await waitFor(() => {
            const updateButton = screen.getByRole('button', { name: /Update/i });
            expect(updateButton).toBeDisabled();
        });
    });
}); 