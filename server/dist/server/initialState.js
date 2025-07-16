import { v4 as uuidv4 } from 'uuid';
export class InitialStateManager {
    constructor() {
        this.lamportCounter = 0;
    }
    createInitialEvents() {
        const events = [];
        // Create first project
        this.lamportCounter++;
        const project1Id = uuidv4();
        const project1 = {
            id: project1Id,
            name: 'Example Project 1',
            description: 'This is the first example project to get you started',
            taskIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lamportTs: this.lamportCounter
        };
        // Create second project
        this.lamportCounter++;
        const project2Id = uuidv4();
        const project2 = {
            id: project2Id,
            name: 'Example Project 2',
            description: 'This is the second example project',
            taskIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lamportTs: this.lamportCounter
        };
        // Create task for first project
        this.lamportCounter++;
        const task1Id = uuidv4();
        const task1 = {
            id: task1Id,
            projectId: project1Id,
            title: 'Example Task 1',
            status: 'pending',
            configuration: {
                priority: 1,
                description: 'This is an example task for project 1',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lamportTs: this.lamportCounter
        };
        // Add task ID to first project
        project1.taskIds.push(task1Id);
        // Add first project event
        this.lamportCounter++;
        const project1Event = {
            id: uuidv4(),
            action: 'create',
            nodeType: 'project',
            nodeId: project1.id,
            data: project1,
            lamportTs: this.lamportCounter,
            timestamp: new Date().toISOString()
        };
        events.push(project1Event);
        // Add second project event
        this.lamportCounter++;
        const project2Event = {
            id: uuidv4(),
            action: 'create',
            nodeType: 'project',
            nodeId: project2.id,
            data: project2,
            lamportTs: this.lamportCounter,
            timestamp: new Date().toISOString()
        };
        events.push(project2Event);
        // Add task event
        this.lamportCounter++;
        const task1Event = {
            id: uuidv4(),
            action: 'create',
            nodeType: 'task',
            nodeId: task1.id,
            data: task1,
            lamportTs: this.lamportCounter,
            timestamp: new Date().toISOString()
        };
        events.push(task1Event);
        return events;
    }
    getInitialLamportCounter() {
        return this.lamportCounter;
    }
}
//# sourceMappingURL=initialState.js.map