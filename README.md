# Project Colab - Real-time Collaborative Project Management

A real-time collaborative project management application built with React, Node.js, and WebSockets. The system uses Lamport timestamps and append-only events to maintain consistency across multiple clients, ensuring all users see the same state regardless of network delays or connection issues.

## How to Run

### Multi-Client Setup (Recommended)

Launch multiple clients with a single backend:

```bash
# Launch 3 clients (default) starting from port 8081
./run-multi-client.sh

# Launch 5 clients starting from port 8081
./run-multi-client.sh 5

# Launch 3 clients starting from port 8090
./run-multi-client.sh 3 8090
```

This will:
- Start 1 backend server on port 8080
- Launch N React clients on ports 8081, 8082, 8083, etc.
- Each client connects to the same backend via WebSocket
- All clients share the same state through real-time synchronization

**Prerequisites:**
- Docker daemon must be running
- Ports 8080 through 8080+N must be available
- The script will check for port conflicts before starting

## Data Model

The application uses a shared type system for consistent data structures:

```typescript
// Core entity types
export type EntityType = 'task' | 'project';
export type EventAction = 'create' | 'update' | 'delete';

// Event structure for append-only log
export interface EventNode {
    id: string;
    lamportTs: number;        // Lamport timestamp for ordering
    timestamp: string;         // ISO timestamp
    action: EventAction;       // CRUD operation
    nodeType: EntityType;      // Entity type
    nodeId: string;           // Target entity ID
    data: ProjectNode | TaskNode; // Entity data
}

// Project entity
export interface ProjectNode {
    id: string;
    name: string;
    description: string;
    taskIds: ID[];            // References to tasks
    createdAt: string;
    updatedAt: string;
    lamportTs?: number;
}

// Task entity
export interface TaskNode {
    id: string;
    projectId: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    configuration: {
        priority: number;
        description?: string;
        dueDate?: string;
    };
    createdAt: string;
    updatedAt: string;
    lamportTs?: number;
}
```

## Backend Architecture

### Append-Only Events & Total Order

The backend maintains an append-only event log where each event is immutable and contains a Lamport timestamp. This ensures:

- **Causality preservation**: Events are ordered by Lamport timestamps
- **Conflict resolution**: Last-Write-Wins (LWW) with UUID tiebreakers
- **Event replay**: Clients can reconstruct state from the event log

```typescript
// Server maintains global Lamport counter
private lamportCounter = 0;

// Each event gets a unique UUID
const event: EventNode = {
    id: uuidv4(),
    lamportTs: this.lamportCounter++,
    timestamp: new Date().toISOString(),
    action,
    nodeType,
    nodeId,
    data
};
```

### Client Synchronization

When a client connects, it sends its last known Lamport timestamp. The server responds with all events that occurred after that timestamp:

```typescript
// Client handshake
const handshake: HandshakeMessage = {
    type: 'handshake',
    clientId: 'client-1',
    lastKnownLamportTs: 5
};

// Server sends missing events
const eventsSince = this.getEventsSince(handshake.lastKnownLamportTs);
eventsSince.forEach(event => ws.send(JSON.stringify(event)));
```

### Event Fanout

All events are broadcast to all connected clients in real-time:

```typescript
private broadcastEvent(event: EventNode): void {
    this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
        }
    });
}
```

### WebSocket Communication

The backend uses WebSockets for real-time bidirectional communication:

- **Connection**: Clients establish WebSocket connections on `/ws`
- **Handshake**: Initial sync to bring clients up to date
- **Event streaming**: Real-time event broadcasting
- **Error handling**: Graceful disconnection and reconnection support

## Frontend Architecture

### React State Management

The frontend uses a reducer pattern with Map-based state for efficient updates:

```typescript
// State structure
interface State {
    projects: Map<string, ProjectNode>;
    tasks: Map<string, TaskNode>;
}

// Reducer handles all state updates
const mapReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'CREATE_PROJECT':
        case 'UPDATE_PROJECT':
        case 'DELETE_PROJECT':
        // ... handle project operations
        case 'CREATE_TASK':
        case 'UPDATE_TASK':
        case 'DELETE_TASK':
        // ... handle task operations
    }
};
```

### WebSocket Integration

The `useWebSocket` hook manages the WebSocket connection and event queue:

```typescript
export const useWebSocket = (url: string) => {
    const [eventQueue, setEventQueue] = useState<EventNode[]>([]);
    const lamportCounter = useRef<number>(0);
    
    // Send events to server
    const sendEvent = (action: EventAction, nodeType: EntityType, nodeId: string, data: any) => {
        const event: EventNode = {
            id: uuidv4(),
            lamportTs: ++lamportCounter.current,
            timestamp: new Date().toISOString(),
            action,
            nodeType,
            nodeId,
            data
        };
        ws.current.send(JSON.stringify(event));
    };
    
    return { eventQueue, sendEvent, clearEventQueue };
};
```

### Lamport Timestamp Handling

Each client maintains its own Lamport counter and updates it based on server events:

```typescript
// Update counter when receiving server events
if (eventData.lamportTs > lamportCounter.current) {
    lamportCounter.current = eventData.lamportTs;
}

// Increment counter when sending events
lamportCounter.current += 1;
```

### Client ID & Port Display

The UI dynamically shows the client ID (from WebSocket handshake) and port (from browser URL):

```typescript
// Client ID from WebSocket handshake
const clientId = window.__COLAB_CLIENT_ID || 'Unknown';

// Port from browser location
const port = window.location.port || '80';
```



## Testing

Run all test cases with the following commands:

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
npm test

# Run tests with coverage
cd server && npm run test:coverage
```

The test suite covers:
- WebSocket event handling
- Client synchronization
- Event broadcasting
- Lamport timestamp ordering
- React component behavior
- State management logic

## Trade‑offs & Current Limitations

* **In‑memory append‑only log (MVP)** – simplifies the demo and keeps the code easy to read, but a node crash loses history. In production this swaps to Postgres/WAL or Kafka.
* **Last‑Write‑Wins (Lamport + UUID tie‑break)** – good enough for project/task CRUD; richer fields (rich‑text notes) would require CRDT or OT to avoid data loss on concurrent edits.
* **Maps in React state (immutable copies)** – keeps the reducer 100 % "React‑style" and DevTools‑friendly, at the cost of cloning each map per event. If throughput ever bottlenecks, migrate to `useRef` + batched renders or Immer for structural sharing.
* **WebSocket echo = ACK** – simpler than a dedicated ACK/NACK envelope, but one lost packet can delay retries until the reconnect heartbeat.
* **Single‑node WS capacity** – on a 4 vCPU / 8 GB host, a single Node.js process handles roughly **30 k–60 k idle WebSocket clients** (≈ 8 kB per socket) or ~40 k msg/s before CPU/NIC saturation; horizontal scaling is required beyond that.
* **No per‑entity ACL/auth yet** – assumes all connected clients may see all projects. A channel‑level ACL would be layered in front of the fan‑out bus.

---

## Scaling Strategy

| Layer | Short‑term ✅ (today's code) | Long‑term ➡️ (next stage) |
|-------|-----------------------------|---------------------------|
| **Event store** | In‑memory array | **Postgres append‑only table** or **Kafka topic**. Batch inserts; WAL replication for HA. Hourly snapshots to S3/GCS so new pods replay only delta events. |
| **WebSocket tier** | Single Node pod | Multiple stateless WS pods behind an L4/L7 load‑balancer. **Sticky sessions** or **Redis pub/sub** so any pod can deliver any event. Autoscale via HPA/KEDA on active‑connection count. |
| **Partitioning** | All teams on one shard | **Consistent hashing on `teamId`** → `(hash(teamId) mod N)`. Adding a shard moves only ≈1/N of keys, preserving Lamport order per team without cross‑shard coordination. |
| **Hot‑failover** | Manual restart | Each WS pod streams its live events to Redis; on pod crash, surviving pods refill any dropped client from the durable log. |
| **Client resilience** | Local `lamportTs`, retry on socket close | Outbox with exponential back‑off + per‑event ACK timeout. Local Storage snapshot (`projects`, `tasks`, `lastTs`) used in handshake: `HELLO { lastSeenTs }`. |
| **Observability** | Console logs | Prometheus / Grafana dashboards: p50/p95/p99 event‑commit latency, fan‑out lag, reconnect rate. Structured logs ship to Loki/ELK for replay debugging. |

**Key win of consistent hashing:** all events for one team/project land on a single shard → total‑order guarantee without distributed locking, while capacity scales linearly.

*Future work:* adopt CRDT patches for text fields and integrate row‑level ACL.
