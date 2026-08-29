# Angular Nexus - Tree Management API Requirements

## Overview

Transform Angular Nexus from a traditional file explorer into a **universal hierarchical data browser** that maintains the familiar file explorer UI while enabling management of the entire Atomic Platform ecosystem through tree-based operations.

## Core Concept

**Preserve the file explorer metaphor** while abstracting the underlying operations through a **Tree Management API** that can represent any hierarchical data structure and execute context-appropriate operations.

## Architecture

### Current State
```
File Explorer UI ←→ File Operations (limited to file CRUD)
```

### Target State
```
File Explorer UI ←→ Tree Management API ←→ Multiple Backend Providers
                                        ├── Host Server REST API
                                        ├── Service Broker API
                                        ├── File System Operations
                                        ├── Search Results
                                        └── User Management
```

## Primary Integration Points

### 1. Host Server REST API Integration
- **Base URL**: `http://localhost:8085/api`
- **Purpose**: Service discovery, management, and monitoring
- **Authentication**: Token-based (if implemented)

### 2. Service Broker API Integration
- **Base URL**: `http://localhost:8080/api/broker`
- **Purpose**: Execute operations on registered services
- **Format**: ServiceRequest/ServiceResponse pattern

## Tree Structure Requirements

### Root Node: Host Server
The host-server becomes the root of the tree, replacing localStorage "server profiles":

```
🏠 Atomic Platform (host-server:8085)
├── 📊 Services
│   ├── 🟢 broker-gateway (Spring Boot, 8080)
│   │   ├── 📈 Health Status
│   │   ├── 📋 Operations: [submitRequest, routeRequest]
│   │   └── 🔧 Actions: [restart, view-logs, check-health]
│   ├── 🟢 broker-gateway-quarkus (Quarkus, 8090)
│   │   ├── 📈 Health Status
│   │   ├── 📋 Operations: [submitRequest, routeRequest]
│   │   └── 🔧 Actions: [restart, view-logs, check-health]
│   ├── 🟢 moleculer-search (Node.js, 4050)
│   │   ├── 📈 Health Status
│   │   ├── 📋 Operations: [simpleSearch]
│   │   └── 🔧 Actions: [restart, view-logs]
│   └── 🔴 fs-crawler-adapter (Python, 8001)
│       ├── ❌ Health Status: Offline
│       ├── 📋 Operations: [startScan, searchFiles, getDuplicates]
│       └── 🔧 Actions: [restart, check-connection]
├── 👥 Users
│   ├── 👤 alice
│   │   ├── 📁 Files
│   │   ├── 💾 Quota: 2.3GB / 5GB
│   │   └── 🔧 Actions: [view-files, manage-quota, send-message]
│   └── 👤 bob
│       ├── 📁 Files
│       ├── 💾 Quota: 890MB / 5GB
│       └── 🔧 Actions: [view-files, manage-quota, send-message]
├── 🔍 Search & Discovery
│   ├── 📁 Recent Searches
│   ├── 📁 Saved Queries
│   ├── 📁 Duplicate Files
│   └── 📁 Large Files (>100MB)
├── 📁 File Systems
│   ├── 📁 file-system-server-1 (localhost:4040)
│   │   ├── 📁 users/
│   │   ├── 📁 shared/
│   │   └── 🔧 Actions: [browse, upload, create-folder]
│   └── 📁 file-system-server-2 (localhost:4041)
│       ├── 📁 users/
│       └── 📁 archive/
└── ⚙️ Platform Management
    ├── 📊 System Health
    ├── 📈 Metrics Dashboard
    ├── 📋 Service Logs
    └── 🔧 Bulk Operations
```

## API Requirements

### 1. Tree Management Interface

```typescript
interface TreeManager {
  // Tree Structure
  getChildren(nodeId: string): Promise<TreeNode[]>;
  getParent(nodeId: string): Promise<TreeNode | null>;
  getNodePath(nodeId: string): Promise<TreeNode[]>;
  
  // Tree Operations
  createNode(parentId: string, node: CreateNodeRequest): Promise<TreeNode>;
  deleteNode(nodeId: string): Promise<void>;
  moveNode(nodeId: string, newParentId: string): Promise<void>;
  renameNode(nodeId: string, newName: string): Promise<TreeNode>;
  
  // Tree Synchronization
  watchNode(nodeId: string, callback: (changes: TreeChange[]) => void): Subscription;
  refreshSubtree(nodeId: string): Promise<void>;
  refreshAll(): Promise<void>;
  
  // Context Operations
  getAvailableOperations(nodeId: string): Promise<string[]>;
  executeOperation(nodeId: string, operation: string, params: any): Promise<any>;
  
  // Search & Discovery
  searchNodes(query: string, filters?: SearchFilters): Promise<TreeNode[]>;
  findNodesByType(nodeType: string): Promise<TreeNode[]>;
}
```

### 2. Tree Node Model

```typescript
interface TreeNode {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  type: NodeType;                // Node type for icon/behavior
  parentId?: string;             // Parent node ID
  icon: string;                  // Icon identifier
  status?: NodeStatus;           // Health/availability status
  metadata: Record<string, any>; // Type-specific data
  operations: string[];          // Available operations
  hasChildren: boolean;          // Lazy loading indicator
  isExpanded?: boolean;          // UI state
  lastUpdated: Date;             // Cache invalidation
}

enum NodeType {
  ROOT = 'root',
  SERVICE = 'service',
  USER = 'user',
  FILE = 'file',
  FOLDER = 'folder',
  SEARCH_RESULT = 'search-result',
  VIRTUAL_FOLDER = 'virtual-folder',
  HEALTH_CHECK = 'health-check',
  LOG_ENTRY = 'log-entry'
}

enum NodeStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}
```

### 3. Provider Architecture

```typescript
interface TreeProvider {
  readonly providerType: string;
  canHandle(nodeId: string): boolean;
  getChildren(nodeId: string): Promise<TreeNode[]>;
  executeOperation(nodeId: string, operation: string, params: any): Promise<any>;
  getAvailableOperations(nodeId: string): Promise<string[]>;
  watchChanges(nodeId: string, callback: (changes: TreeChange[]) => void): Subscription;
}

// Specific Providers
class HostServerProvider implements TreeProvider {
  // Handles service discovery, health checks, service management
}

class ServiceBrokerProvider implements TreeProvider {
  // Handles service operations via broker API
}

class FileSystemProvider implements TreeProvider {
  // Handles traditional file operations
}

class SearchProvider implements TreeProvider {
  // Handles search results and queries
}

class UserProvider implements TreeProvider {
  // Handles user management operations
}
```

## Feature Requirements

### 1. Host Server Integration

#### Service Discovery
- **Endpoint**: `GET /api/registry/services`
- **Purpose**: Populate Services tree branch
- **Refresh**: Every 30 seconds or on-demand
- **Display**: Service name, framework, port, status

#### Service Health Monitoring
- **Endpoint**: `GET /api/registry/services/{id}`
- **Purpose**: Show real-time service health
- **Visual**: Color-coded status indicators
- **Actions**: Restart, view logs, check dependencies

#### Service Backend Connections
- **Endpoint**: `GET /api/backends/deployment/{id}`
- **Purpose**: Show service dependencies
- **Display**: Backend connections, roles (PRIMARY, BACKUP)
- **Actions**: Add backend, remove backend, change priority

### 2. Service Broker Integration

#### Operation Execution
- **Endpoint**: `POST /api/broker/submitRequest`
- **Purpose**: Execute operations on registered services
- **Format**: 
  ```json
  {
    "service": "serviceName",
    "operation": "operationName",
    "params": { ... }
  }
  ```

#### Dynamic Operation Discovery
- Query available operations from service registry
- Context-sensitive right-click menus
- Parameter input forms for complex operations

### 3. Enhanced File Operations

#### Multi-Backend File Access
- Access files through different file-system-server instances
- Show backend connections and health
- Failover to backup backends automatically

#### Advanced Search Integration
- **Service**: fs-crawler-adapter
- **Operations**: searchFiles, getDuplicates, getStatistics
- **Display**: Search results as virtual folders
- **Actions**: Open file, show duplicates, delete duplicates

### 4. User Management Integration

#### User Discovery
- **Endpoint**: `GET /api/users` (via broker)
- **Purpose**: Show platform users
- **Display**: User profiles, quotas, file counts
- **Actions**: View files, manage permissions, send messages

#### User File Spaces
- **Service**: file-service
- **Operations**: listFiles, createFolder, uploadFile
- **Context**: User-specific file operations
- **Security**: Token-based access control

### 5. Real-Time Updates

#### WebSocket Integration
- Connect to host-server WebSocket endpoint
- Receive real-time service status updates
- Update tree nodes without full refresh
- Show notifications for service changes

#### Polling Fallback
- 30-second polling for service health
- 5-minute polling for service list
- Configurable refresh intervals
- Manual refresh capability

## UI/UX Requirements

### 1. Tree Component Enhancements

#### Context Menus
- **Service Nodes**: Restart, View Logs, Check Health, Manage Backends
- **User Nodes**: View Files, Manage Quota, Send Message
- **File Nodes**: Open, Download, Delete, Show Properties
- **Search Nodes**: Refine Search, Save Query, Export Results

#### Status Indicators
- **Color Coding**: Green (healthy), Yellow (degraded), Red (offline)
- **Icons**: Service type icons, status overlays
- **Tooltips**: Detailed status information
- **Animations**: Loading states, refresh indicators

#### Drag & Drop Operations
- Move files between backends
- Assign users to services
- Reorder service priorities
- Create service dependencies

### 2. Configuration Management

#### Connection Settings
- Host server URL configuration
- Authentication token management
- Timeout and retry settings
- Offline mode capabilities

#### Profile Migration
- Import existing localStorage server profiles
- Convert to host-server based configuration
- Backup/restore settings
- Multi-environment support

### 3. Search & Discovery

#### Global Search
- Search across all tree providers
- Filter by node type, status, metadata
- Save and recall search queries
- Export search results

#### Quick Actions
- Keyboard shortcuts for common operations
- Command palette for service operations
- Bulk operations on multiple nodes
- Undo/redo for destructive operations

## Technical Implementation

### 1. Service Layer Architecture

```typescript
// Core Services
@Injectable() TreeManagerService
@Injectable() HostServerApiService
@Injectable() ServiceBrokerApiService
@Injectable() WebSocketService

// Provider Services
@Injectable() HostServerProvider
@Injectable() ServiceBrokerProvider
@Injectable() FileSystemProvider
@Injectable() SearchProvider
@Injectable() UserProvider

// UI Services
@Injectable() TreeStateService
@Injectable() ContextMenuService
@Injectable() NotificationService
```

### 2. State Management

#### Tree State
- Current expanded nodes
- Selected nodes
- Loading states
- Error states
- Cache management

#### Connection State
- Host server connection status
- Authentication state
- Service availability
- WebSocket connection status

### 3. Error Handling

#### Connection Failures
- Graceful degradation when host-server unavailable
- Retry mechanisms with exponential backoff
- Offline mode with cached data
- User-friendly error messages

#### Operation Failures
- Service-specific error handling
- Rollback mechanisms for failed operations
- Detailed error logging
- Recovery suggestions

## Migration Strategy

### Phase 1: Core Infrastructure
1. Implement TreeManager interface
2. Create HostServerProvider
3. Basic service discovery and display
4. Replace localStorage profiles with host-server root

### Phase 2: Service Integration
1. Add ServiceBrokerProvider
2. Implement operation execution
3. Add context menus for services
4. Real-time status updates

### Phase 3: Enhanced Features
1. Add SearchProvider and UserProvider
2. Implement advanced search capabilities
3. Add file system integration
4. Backend connection management

### Phase 4: Polish & Optimization
1. Performance optimizations
2. Advanced UI features
3. Comprehensive error handling
4. Documentation and testing

## Success Criteria

### Functional Requirements
- ✅ Host server appears as root node
- ✅ All registered services visible in tree
- ✅ Real-time service status updates
- ✅ Context-appropriate operations available
- ✅ Service operations execute successfully
- ✅ File operations work through service broker
- ✅ Search results display as virtual folders
- ✅ User management integrated

### Performance Requirements
- Tree loads within 2 seconds
- Service status updates within 5 seconds
- Operations complete within 10 seconds
- UI remains responsive during operations
- Memory usage under 100MB

### Usability Requirements
- Familiar file explorer experience maintained
- Context menus intuitive and discoverable
- Status indicators clear and informative
- Error messages actionable
- Keyboard shortcuts available

## Future Enhancements

### Advanced Features
- Service dependency visualization
- Performance metrics dashboard
- Automated service health monitoring
- Service deployment management
- Configuration management interface

### Integration Opportunities
- CI/CD pipeline integration
- Monitoring system integration
- Log aggregation and analysis
- Backup and disaster recovery
- Multi-tenant support

## Conclusion

This transformation will evolve Angular Nexus from a simple file explorer into a **comprehensive platform management console** while preserving the familiar and beloved file explorer interface. Users will gain powerful service management capabilities without losing the intuitive navigation experience they expect.