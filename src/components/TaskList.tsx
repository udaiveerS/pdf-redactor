import React, { useState, useEffect } from 'react';
import { 
    List, 
    ListItem, 
    Typography, 
    Paper,
    Chip,
    Box
} from '@mui/material';
import { TaskNode, ID } from '../../shared/types';

interface TaskListProps {
    projectId?: ID;
}

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
    const [tasks, setTasks] = useState<TaskNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data from API...');
                const tasksResponse = await fetch('/api/tasks');
                
                console.log('Tasks response status:', tasksResponse.status);
                
                if (!tasksResponse.ok) {
                    const errorText = await tasksResponse.text();
                    console.error('Tasks response text:', errorText);
                    throw new Error(`Tasks API error: ${tasksResponse.status}`);
                }
                
                const tasksData: TaskNode[] = await tasksResponse.json();
                
                console.log('Tasks data:', tasksData);
                
                setTasks(tasksData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredTasks = projectId 
        ? tasks.filter(task => task.projectId === projectId)
        : tasks;

    if (loading) {
        return <Typography>Loading tasks...</Typography>;
    }

    return (
        <Paper sx={{ p: 2, m: 2 }}>
            <Typography variant="h6" gutterBottom>
                Tasks {projectId && `for Project ${projectId}`}
            </Typography>
            <List>
                {filteredTasks.map((task: TaskNode) => (
                                        <ListItem key={task.id} divider>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body1" component="div">
                                {task.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="div">
                                {task.configuration.description}
                            </Typography>
                            <Chip 
                                label={`Priority: ${task.configuration.priority}`}
                                size="small"
                                color="primary"
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default TaskList; 