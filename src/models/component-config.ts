
export type NodeType = string; // Relaxed from union type to string to support dynamic types

export interface ComponentConfig {
    id: string; // ID (number as string from backend) or uuid
    type: string; // Slug
    name: string; // Label
    description?: string;

    // 3D Properties
    geometry: string;
    defaultColor: number;
    scale: number;

    // UI Properties
    iconClass: string;
    colorClass: string;

    // Logic / Metadata
    defaultNamePrefix?: string;
    allowedConnections?: string[] | 'all';
    category?: string;

    isSystem?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Map backend 'name' to frontend 'label' for compatibility if needed, 
// or just refactor usage. I'll refactor usage to 'name' where possible.
// For now, let's keep it compatible with existing code by aliasing or just changing the code.
// The existing code uses 'label'. The backend uses 'name'.
// I will map 'name' to 'label' in the service or just update the interface to match backend 'name'
// and fix the build errors.


// Initial System Components (Deprecated - verify against backend)
export const INITIAL_REGISTRY: ComponentConfig[] = [
    // --- API Services ---
    {
        id: 'sys-rest',
        type: 'rest-api',
        name: 'REST API Service',
        geometry: 'dodecahedron',
        defaultColor: 0x6366f1, // Indigo 500
        scale: 2,
        iconClass: 'rounded-md',
        colorClass: 'bg-indigo-500',
        isSystem: true
    },
    {
        id: 'sys-graphql',
        type: 'graphql-api',
        name: 'GraphQL API',
        geometry: 'icosahedron',
        defaultColor: 0xe11d48, // Rose 600
        scale: 2,
        iconClass: 'rounded-full',
        colorClass: 'bg-rose-600',
        isSystem: true
    },
    {
        id: 'sys-grpc',
        type: 'grpc-service',
        name: 'gRPC Service',
        geometry: 'box',
        defaultColor: 0x0d9488, // Teal 600
        scale: 1.5,
        iconClass: 'rounded-sm',
        colorClass: 'bg-teal-600',
        isSystem: true
    },
    {
        id: 'sys-mcp',
        type: 'mcp-server',
        name: 'MCP Server',
        geometry: 'cone',
        defaultColor: 0x00bc44, // Green 500
        scale: 2,
        iconClass: 'rounded-full',
        colorClass: 'bg-green-500',
        isSystem: true
    },
    {
        id: 'sys-job',
        type: 'background-job',
        name: 'Background Job',
        geometry: 'octahedron',
        defaultColor: 0xeab308, // Yellow 500
        scale: 1.3,
        iconClass: 'rotate-45',
        colorClass: 'bg-yellow-500',
        isSystem: true
    },

    // --- Infrastructure ---
    {
        id: 'sys-gateway',
        type: 'gateway',
        name: 'API Gateway',
        geometry: 'octahedron',
        defaultColor: 0xa855f7, // Purple 500
        scale: 2.5,
        iconClass: 'rotate-45',
        colorClass: 'bg-purple-500',
        isSystem: true
    },
    {
        id: 'sys-proxy',
        type: 'proxy',
        name: 'Reverse Proxy',
        geometry: 'torus',
        defaultColor: 0x10b981, // Emerald 500
        scale: 2,
        iconClass: 'rounded-full ring-4 ring-emerald-500',
        colorClass: 'bg-transparent',
        isSystem: true
    },
    {
        id: 'sys-queue',
        type: 'message-queue',
        name: 'Message Queue',
        geometry: 'torus',
        defaultColor: 0xf97316, // Orange 500
        scale: 2,
        iconClass: 'rounded-full ring-2',
        colorClass: 'bg-orange-500',
        isSystem: true
    },
    {
        id: 'sys-jms',
        type: 'jms-queue',
        name: 'JMS Queue',
        geometry: 'torus',
        defaultColor: 0xf59e0b, // Amber 500
        scale: 2,
        iconClass: 'rounded-full ring-2 border-dashed',
        colorClass: 'bg-amber-500',
        isSystem: true
    },

    // --- Storage ---
    {
        id: 'sys-db',
        type: 'database',
        name: 'Database',
        geometry: 'cylinder',
        defaultColor: 0x334155, // Slate 700
        scale: 2,
        iconClass: 'rounded-b-md rounded-t-md',
        colorClass: 'bg-slate-700 h-5',
        isSystem: true
    },
    {
        id: 'sys-cache',
        type: 'cache',
        name: 'Cache Service',
        geometry: 'box',
        defaultColor: 0xdc2626, // Red 600
        scale: 1.2,
        iconClass: 'rounded-sm',
        colorClass: 'bg-red-600',
        isSystem: true
    },

    // --- Clients ---
    {
        id: 'sys-webapp',
        type: 'web-app',
        name: 'Web Application',
        geometry: 'sphere',
        defaultColor: 0x2563eb, // Blue 600
        scale: 1.5,
        iconClass: 'rounded-full',
        colorClass: 'bg-blue-600',
        isSystem: true
    },
];

// Deprecated: Use ComponentRegistryService instead
export const COMPONENT_REGISTRY = INITIAL_REGISTRY;
export const getComponentConfig = (type: NodeType) => INITIAL_REGISTRY.find(c => c.type === type)!;
