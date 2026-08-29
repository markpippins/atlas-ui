/** Graph View — a saved camera + node position preset. */
export interface GraphView {
    id?: number;
    name: string;
    description?: string;
    // Camera 1 (primary)
    cameraPositionX: number;
    cameraPositionY: number;
    cameraPositionZ: number;
    cameraTargetX: number;
    cameraTargetY: number;
    cameraTargetZ: number;
    // Camera 2 (secondary viewpoint)
    camera2PositionX: number;
    camera2PositionY: number;
    camera2PositionZ: number;
    camera2TargetX: number;
    camera2TargetY: number;
    camera2TargetZ: number;
    isDefault?: boolean;
    /** Connections persisted as a relational array. */
    connections?: ConnectionData[];
    positions?: GraphViewPosition[];
    createdAt?: string;
    updatedAt?: string;
}

/** A single node's position within a graph view. */
export interface GraphViewPosition {
    id?: number;
    nodeId: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    label?: string;
    description?: string;
    color?: string;
}

/** A connection between two nodes within a graph view. */
export interface ConnectionData {
    sourceNodeId: string;
    targetNodeId: string;
    direction: 'OUTBOUND' | 'BIDIRECTIONAL';
}
