// server/index.ts  (ESM with TypeScript)
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    TaskNode,
    ProjectNode,
    EventNode,
    ID,
    CreateProjectRequest,
    UpdateProjectRequest,
    CreateTaskRequest,
    UpdateTaskRequest
} from '../shared/types.js';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

/* __dirname/__filename helpers for ESM */
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Add CORS middleware
app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Add JSON parsing middleware
app.use(express.json());

// In-memory storage (in production, this would be a database)
let projects: ProjectNode[] = [
    {
        id: 'project-1',
        name: 'Example Project',
        description: 'This is an example project',
        tasks: [
            {
                id: 'task-1',
                projectId: 'project-1',
                title: 'Example Task',
                status: 'pending',
                configuration: {
                    priority: 1,
                    description: 'This is an example task'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Helper function to generate IDs
const generateId = (): ID => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// API endpoints
app.get('/api/health', (_, res: Response) => {
    res.json({ status: 'ok', message: 'TypeScript server running' });
});

app.get('/api/client-info', (_, res: Response) => {
    res.json({
        clientId: process.env.REACT_APP_CLIENT_ID || 'client-1',
        port: process.env.REACT_APP_PORT || '8080'
    });
});

// Get all projects
app.get('/api/projects', (_, res: Response) => {
    res.json(projects);
});

// Get a single project
app.get('/api/projects/:id', (req: Request, res: Response) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
});

// Create a new project
app.post('/api/projects', (req: Request, res: Response) => {
    const { name, description }: CreateProjectRequest = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const newProject: ProjectNode = {
        id: generateId(),
        name,
        description,
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    res.status(201).json(newProject);
});

// Update a project
app.put('/api/projects/:id', (req: Request, res: Response) => {
    const { name, description }: UpdateProjectRequest = req.body;
    const projectIndex = projects.findIndex(p => p.id === req.params.id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = {
        ...projects[projectIndex],
        ...(name && { name }),
        ...(description && { description }),
        updatedAt: new Date().toISOString()
    };

    projects[projectIndex] = updatedProject;
    res.json(updatedProject);
});

// Delete a project
app.delete('/api/projects/:id', (req: Request, res: Response) => {
    const projectIndex = projects.findIndex(p => p.id === req.params.id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    projects.splice(projectIndex, 1);
    res.status(204).send();
});

// Get all tasks for a project
app.get('/api/projects/:projectId/tasks', (req: Request, res: Response) => {
    const project = projects.find(p => p.id === req.params.projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.tasks);
});

// Create a new task
app.post('/api/projects/:projectId/tasks', (req: Request, res: Response) => {
    const projectIndex = projects.findIndex(p => p.id === req.params.projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const { title, description, priority = 1, dueDate }: CreateTaskRequest = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    const newTask: TaskNode = {
        id: generateId(),
        projectId: req.params.projectId,
        title,
        status: 'pending',
        configuration: {
            priority,
            description,
            dueDate
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    projects[projectIndex].tasks.push(newTask);
    projects[projectIndex].updatedAt = new Date().toISOString();

    res.status(201).json(newTask);
});

// Update a task
app.put('/api/projects/:projectId/tasks/:taskId', (req: Request, res: Response) => {
    const projectIndex = projects.findIndex(p => p.id === req.params.projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === req.params.taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, status, priority, dueDate }: UpdateTaskRequest = req.body;

    const updatedTask = {
        ...projects[projectIndex].tasks[taskIndex],
        ...(title && { title }),
        ...(description && { configuration: { ...projects[projectIndex].tasks[taskIndex].configuration, description } }),
        ...(status && { status }),
        ...(priority && { configuration: { ...projects[projectIndex].tasks[taskIndex].configuration, priority } }),
        ...(dueDate && { configuration: { ...projects[projectIndex].tasks[taskIndex].configuration, dueDate } }),
        updatedAt: new Date().toISOString()
    };

    projects[projectIndex].tasks[taskIndex] = updatedTask;
    projects[projectIndex].updatedAt = new Date().toISOString();

    res.json(updatedTask);
});

// Delete a task
app.delete('/api/projects/:projectId/tasks/:taskId', (req: Request, res: Response) => {
    const projectIndex = projects.findIndex(p => p.id === req.params.projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const taskIndex = projects[projectIndex].tasks.findIndex(t => t.id === req.params.taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    projects[projectIndex].tasks.splice(taskIndex, 1);
    projects[projectIndex].updatedAt = new Date().toISOString();

    res.status(204).send();
});

// Legacy endpoints for backward compatibility
app.get('/api/tasks', (_, res: Response) => {
    const allTasks = projects.flatMap(p => p.tasks);
    res.json(allTasks);
});

// In production, serve the built React app
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'build')));
    app.get('/*', (_: Request, res: Response) =>
        res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
    );
} else {
    // In development, only serve API routes, let React dev server handle UI
    app.get('/*', (_: Request, res: Response) => {
        res.status(404).json({ error: 'API endpoint not found' });
    });
}

/* 3️⃣  Start the server */
app.listen(PORT, () =>
    console.log(`✓ TypeScript ESM server running on http://localhost:${PORT}`)
); 