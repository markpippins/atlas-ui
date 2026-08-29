export interface RegistryServerProfile {
    id: string;
    name: string;
    registryServerUrl: string;
    imageUrl: string; // For status image/icon

    // Active profile flag - only one profile should be active at a time
    isActive?: boolean;

    description?: string;

    // Concept C fields (deployment target metadata — to be split to separate entity later)
    hostname?: string;
    ipAddress?: string;
    environment?: 'DEV' | 'QA' | 'PROD' | 'STAGING';
    operatingSystem?: string;
    cpuCores?: number;
    memoryMb?: number;
    diskGb?: number;
    region?: string;
    cloudProvider?: 'AWS' | 'GCP' | 'AZURE' | 'ON_PREM';
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}
