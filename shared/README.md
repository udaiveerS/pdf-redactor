# Shared Types

This directory contains TypeScript types that are shared between the frontend and backend.

## Usage

### Backend (Node.js/Express)
```typescript
import { TaskNode, ProjectNode, EventNode, ID } from '../shared/types.js';

// Use in API endpoints
app.get('/api/tasks', (_, res: Response) => {
    const tasks: TaskNode[] = [
        {
            id: 'task-1' as ID,
            projectId: 'project-1' as ID,
            title: 'Example Task',
            configuration: {
                priority: 1,
                description: 'This is an example task'
            },
            updatedAt: new Date().toISOString()
        }
    ];
    res.json(tasks);
});
```

### Frontend (React)
```typescript
import { TaskNode, ProjectNode, ID } from '../../shared/types';

const TaskList: React.FC<{ projectId?: ID }> = ({ projectId }) => {
    const [tasks, setTasks] = useState<TaskNode[]>([]);
    
    // Use shared types for API responses
    const fetchTasks = async () => {
        const response = await fetch('/api/tasks');
        const tasksData: TaskNode[] = await response.json();
        setTasks(tasksData);
    };
    
    return (
        // Component JSX
    );
};
```

## Type Definitions

### Core Types
- `ID`: String type for entity IDs
- `ISOTime`: String type for ISO timestamp strings
- `EntityType`: Union type for entity types ('task' | 'project')
- `EventAction`: Union type for event actions ('create' | 'update' | 'delete')

### Entity Interfaces
- `TaskNode`: Task entity with configuration and metadata
- `ProjectNode`: Project entity with associated task IDs
- `EventNode`: Event entity for tracking changes with Lamport clock

## Benefits

1. **Type Safety**: Ensures consistent data structures across frontend and backend
2. **Single Source of Truth**: Changes to types are reflected everywhere
3. **Better IDE Support**: Autocomplete and error checking for API responses
4. **Collaboration**: Multiple developers can work with the same data contracts

## Configuration

The shared types are included in both:
- Frontend: `tsconfig.json` includes `"shared"`
- Backend: `server/tsconfig.json` includes `"../shared/**/*.ts"`

This ensures TypeScript compilation works correctly for both environments. 