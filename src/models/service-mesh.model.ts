/**
 * Service Mesh Models
 * 
 * Comprehensive interfaces for service mesh visualization and management.
 * Based on the Host Server API data model.
 */

// ============================================================================
// Framework Models
// ============================================================================

export type FrameworkType =
  | 'Java Spring'
  | 'Java Quarkus'
  | 'Java Micronaut'
  | 'Java Helidon'
  | 'Node NestJS'
  | 'Node AdonisJS'
  | 'Node Moleculer'
  | 'Node Express'
  | 'Python Django'
  | 'Python Flask'
  | 'Python FastAPI'
  | 'ASP.NET'
  | 'Go Gin'
  | 'Go Fiber'
  | 'Rust Actix'
  | 'Other';

export interface FrameworkLanguage {
  id: string;
  name: string;
  description?: string;
}

export interface FrameworkTypeEntity {
  id: string;
  name: string; // This corresponds to the FrameworkType (string union) values potentially
  description?: string;
}

export interface ServiceTypeEntity {
  id: string;
  name: string; // This corresponds to ServiceType (string union) values potentially
  description?: string;
  defaultComponentId?: number;
  /** Nested object from backend (defaultComponentId is @Transient, never in JSON). */
  defaultComponent?: { id: number | string };
}

export interface Framework {
  id: string;
  name: string;
  description?: string;
  category: FrameworkTypeEntity;
  language: FrameworkLanguage;
  currentVersion?: string;
  ltsVersion?: string;
  url?: string;
  // Keep legacy fields optional to avoid breaking other parts potentially
  latestVersion?: string;
  documentationUrl?: string;
  supportsBrokerPattern?: boolean;
}

// ============================================================================
// Service Models
// ============================================================================

export type ServiceType =
  | 'REST API'
  | 'GraphQL API'
  | 'gRPC Service'
  | 'Message Queue'
  | 'Database'
  | 'Cache'
  | 'Gateway'
  | 'Proxy'
  | 'Web App'
  | 'Background Job';

export type ServiceStatus = 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED' | 'PLANNED';

export interface ServiceInstance {
  id: string;
  name: string;
  description?: string;
  framework: Framework;
  type: ServiceTypeEntity;
  defaultPort: number;
  healthCheckPath?: string;
  apiBasePath?: string;
  status: ServiceStatus;
  version?: string;
  repositoryUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  componentOverrideId?: number;
  parentServiceId?: number;
  // componentOverride?: VisualComponent; // If we want the full object
}

/**
 * Represents a service hosted/embedded within a parent gateway service.
 * These are services that run inside the same JVM as the gateway.
 */
export interface HostedService {
  serviceName: string;
  operations: string[];
  framework?: string;
  status?: string;
  type?: 'embedded' | 'standalone';
  endpoint?: string;
  healthCheck?: string;
}

/**
 * Extended service interface that includes hosted/embedded services.
 * Used for displaying the service mesh hierarchy.
 */
export interface ServiceWithHosted {
  id: number;
  name: string;
  description?: string;
  status: string;
  endpoint?: string;
  defaultPort?: number;
  version?: string;
  framework?: string;
  operations?: string;
  lastHeartbeat?: string;
  hostedServices?: HostedService[];
}

// ============================================================================
// Host Models
// ============================================================================

export type ServerType = 'Physical' | 'Virtual' | 'Container' | 'Cloud';

export type EnvironmentType = 'Development' | 'Staging' | 'Production' | 'Test';

export type ServerStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';

// ============================================================================
// Deployment Models
// ============================================================================

export type DeploymentStatus =
  | 'RUNNING'
  | 'STOPPED'
  | 'STARTING'
  | 'STOPPING'
  | 'FAILED'
  | 'UNKNOWN';

export type HealthStatus = 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED' | 'UNKNOWN';

export interface Deployment {
  id: string;
  service: ServiceInstance;
  server: any;
  port: number;
  version: string;
  status: DeploymentStatus;
  environment: EnvironmentType;
  healthCheckUrl?: string;
  healthStatus: HealthStatus;
  deploymentPath?: string;
  startedAt?: string;
  lastHealthCheck?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Configuration Models
// ============================================================================

export type ConfigEnvironment = 'All' | 'Development' | 'Staging' | 'Production' | 'Test';

export type ConfigType =
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'JSON'
  | 'URL'
  | 'DATABASE_URL'
  | 'API_KEY';

export interface ServiceConfiguration {
  id: string;
  service: { id: string };
  configKey: string;
  configValue: string;
  environment: ConfigEnvironment;
  type: ConfigType;
  isSecret: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Dependency Models
// ============================================================================

export interface ServiceDependency {
  sourceServiceId: string;
  targetServiceId: string;
  sourceService: ServiceInstance;
  targetService: ServiceInstance;
  dependencyType?: 'REQUIRED' | 'OPTIONAL';
}

// ============================================================================
// Library Models (Compile-Time Dependencies)
// ============================================================================

export interface LibraryType {
  id: number;
  name: string;
  description?: string;
  activeFlag?: boolean;
}

export interface Library {
  id: number;
  name: string;
  description?: string;
  category?: LibraryType;
  language?: FrameworkLanguage;
  currentVersion?: string;
  packageName?: string;
  packageManager?: string;
  url?: string;
  repositoryUrl?: string;
  license?: string;
  activeFlag?: boolean;
}

export type DependencyScope = 'COMPILE' | 'RUNTIME' | 'TEST' | 'PROVIDED' | 'OPTIONAL';

export interface ServiceLibrary {
  id: number;
  serviceId: number;
  libraryId: number;
  service?: ServiceInstance;
  library?: Library;
  version: string;
  versionConstraint?: string;
  scope?: DependencyScope;
  isDirect?: boolean;
  isDevDependency?: boolean;
  notes?: string;
  activeFlag?: boolean;
}

// ============================================================================
// Metrics & Monitoring Models
// ============================================================================

export interface ServiceMetrics {
  serviceId: string;
  timestamp: Date;
  requestsPerSecond?: number;
  averageResponseTimeMs?: number;
  errorRate?: number;
  activeConnections?: number;
  memoryUsageMb?: number;
  cpuUsagePercent?: number;
}

export interface ServiceUpdate {
  type: 'STATUS_CHANGE' | 'HEALTH_CHANGE' | 'DEPLOYMENT_CHANGE' | 'CONFIG_CHANGE';
  hostProfileId: string;
  serviceId: string;
  deploymentId?: string;
  previousValue?: string;
  newValue: string;
  timestamp: Date;
  metrics?: ServiceMetrics;
}

// ============================================================================
// View Models (for UI components)
// ============================================================================

export interface ServiceMeshSummary {
  totalServices: number;
  activeServices: number;
  healthyDeployments: number;
  unhealthyDeployments: number;
  totalHosts: number;
  activeHosts: number;
  frameworkBreakdown: { framework: string; count: number }[];
  environmentBreakdown: { environment: EnvironmentType; count: number }[];
}

export interface FrameworkGroup {
  framework: Framework;
  services: ServiceInstance[];
  deployments: Deployment[];
  healthySummary: { healthy: number; unhealthy: number; unknown: number };
}

export interface ServiceTreeNode {
  id: string;
  name: string;
  type: 'framework' | 'service' | 'deployment' | 'server';
  icon: string;
  status?: HealthStatus | DeploymentStatus | ServiceStatus | ServerStatus;
  children?: ServiceTreeNode[];
  metadata: Record<string, unknown>;
  isExpanded?: boolean;
}

// ============================================================================
// Operation Models
// ============================================================================

export type ServiceOperation =
  | 'start'
  | 'stop'
  | 'restart'
  | 'health-check'
  | 'view-logs'
  | 'view-config';

export interface OperationRequest {
  deploymentId: string;
  operation: ServiceOperation;
  params?: Record<string, unknown>;
}

export interface OperationResult {
  success: boolean;
  operation: ServiceOperation;
  deploymentId: string;
  message?: string;
  data?: unknown;
  timestamp: Date;
}

// ============================================================================
// Graph Visualization Models (for D3.js)
// ============================================================================

export interface GraphNode {
  id: string;
  name: string;
  type: 'service' | 'server' | 'framework';
  status: HealthStatus;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: GraphNode | string;
  target: GraphNode | string;
  type: 'dependency' | 'deployment';
}

export interface ServiceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================================
// Utility Types
// ============================================================================

export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'HEALTHY': return 'var(--color-success, #22c55e)';
    case 'UNHEALTHY': return 'var(--color-error, #ef4444)';
    case 'DEGRADED': return 'var(--color-warning, #f59e0b)';
    case 'UNKNOWN': return 'var(--color-muted, #6b7280)';
  }
}

export function getDeploymentStatusColor(status: DeploymentStatus): string {
  switch (status) {
    case 'RUNNING': return 'var(--color-success, #22c55e)';
    case 'STOPPED': return 'var(--color-muted, #6b7280)';
    case 'STARTING':
    case 'STOPPING': return 'var(--color-warning, #f59e0b)';
    case 'FAILED': return 'var(--color-error, #ef4444)';
    case 'UNKNOWN': return 'var(--color-muted, #6b7280)';
  }
}

export function getFrameworkIcon(category: FrameworkType | string): string {
  switch (category) {
    case 'Java Spring':
    case 'Java Quarkus':
    case 'Java Micronaut':
    case 'Java Helidon':
      return 'coffee';
    case 'Node NestJS':
    case 'Node AdonisJS':
    case 'Node Moleculer':
    case 'Node Express':
      return 'hexagon';
    case 'Python Django':
    case 'Python Flask':
    case 'Python FastAPI':
      return 'code';
    case 'ASP.NET':
      return 'window';
    case 'Go Gin':
    case 'Go Fiber':
      return 'zap';
    case 'Rust Actix':
      return 'settings';
    default:
      return 'box';
  }
}
