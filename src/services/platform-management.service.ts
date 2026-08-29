import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ServiceInstance, Framework, Deployment, Library } from '../models/service-mesh.model.js';
import { ComponentConfig } from '../models/component-config.js';
import { PagedResponse } from '../models/paged-response.model.js';

export interface Server {
    id: number;
    hostname: string;
    ipAddress: string;
    serverTypeId: number;
    environmentTypeId: number;
    operatingSystemId: number;
    cpuCores?: number;
    memory?: string;
    disk?: string;
    status?: string;
    region?: string;
    cloudProvider?: string;
    description?: string;
    activeFlag?: boolean;
}

export interface ServicePayload {
    name: string;
    description?: string;
    frameworkId: number;
    serviceTypeId: number;
    defaultPort?: number;
    apiBasePath?: string;
    repositoryUrl?: string;
    version?: string;
    status?: string;
    componentOverrideId?: number;
    parentServiceId?: number;
    systemId?: string;
}

export interface FrameworkPayload {
    name: string;
    description?: string;
    vendorId?: number;
    categoryId: number;
    languageId: number;
    currentVersion?: string;
    ltsVersion?: string;
    url?: string;
}

export interface DeploymentPayload {
    serviceId: number;
    environmentId: number;
    serverId: number;
    version?: string;
    status?: string;
    port?: number;
    contextPath?: string;
    healthCheckUrl?: string;
}

export interface LibraryPayload {
    name: string;
    description?: string;
    categoryId?: number;
    languageId?: number;
    currentVersion?: string;
    packageName?: string;
    packageManager?: string;
    url?: string;
    repositoryUrl?: string;
    license?: string;
}

export interface SystemItem {
    id: number;
    name: string;
    description?: string;
    type?: string;
    serviceCount?: number;
}

export interface SystemPayload {
    name: string;
    description?: string;
    type?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PlatformManagementService {
    private http = inject(HttpClient);

    // Loading states
    loading = signal(false);
    error = signal<string | null>(null);

    // Services CRUD
    async getServices(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<ServiceInstance>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/services?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<ServiceInstance>>(url));
        } catch (e) {
            this.error.set('Failed to fetch services');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async createService(baseUrl: string, service: ServicePayload): Promise<ServiceInstance> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/services`;
            return await firstValueFrom(this.http.post<ServiceInstance>(url, service));
        } catch (e) {
            this.error.set('Failed to create service');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateService(baseUrl: string, id: number, service: ServicePayload): Promise<ServiceInstance> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/services/${id}`;
            return await firstValueFrom(this.http.put<ServiceInstance>(url, service));
        } catch (e) {
            this.error.set('Failed to update service');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteService(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/services/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete service');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    // Frameworks CRUD
    async getFrameworks(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<Framework>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/frameworks?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<Framework>>(url));
        } catch (e) {
            this.error.set('Failed to fetch frameworks');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async createFramework(baseUrl: string, framework: FrameworkPayload): Promise<Framework> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/frameworks`;
            return await firstValueFrom(this.http.post<Framework>(url, framework));
        } catch (e) {
            this.error.set('Failed to create framework');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateFramework(baseUrl: string, id: number, framework: FrameworkPayload): Promise<Framework> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/frameworks/${id}`;
            return await firstValueFrom(this.http.put<Framework>(url, framework));
        } catch (e) {
            this.error.set('Failed to update framework');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteFramework(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/frameworks/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete framework');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    // Deployments CRUD
    async getDeployments(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<Deployment>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/deployments?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<Deployment>>(url));
        } catch (e) {
            this.error.set('Failed to fetch deployments');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async createDeployment(baseUrl: string, deployment: DeploymentPayload): Promise<Deployment> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/deployments`;
            return await firstValueFrom(this.http.post<Deployment>(url, deployment));
        } catch (e) {
            this.error.set('Failed to create deployment');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateDeployment(baseUrl: string, id: number, deployment: DeploymentPayload): Promise<Deployment> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/deployments/${id}`;
            return await firstValueFrom(this.http.put<Deployment>(url, deployment));
        } catch (e) {
            this.error.set('Failed to update deployment');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteDeployment(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/deployments/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete deployment');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    // Servers CRUD
    async getServers(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<Server>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/servers?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<Server>>(url));
        } catch (e) {
            this.error.set('Failed to fetch servers');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async createServer(baseUrl: string, server: Partial<Server>): Promise<Server> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/servers`;
            return await firstValueFrom(this.http.post<Server>(url, server));
        } catch (e) {
            this.error.set('Failed to create server');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateServer(baseUrl: string, id: number, server: Partial<Server>): Promise<Server> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/servers/${id}`;
            return await firstValueFrom(this.http.put<Server>(url, server));
        } catch (e) {
            this.error.set('Failed to update server');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteServer(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/servers/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete server');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    // Lookup
    async getLookup(baseUrl: string, type: string, page: number = 0, size: number = 100, typeFilter?: string): Promise<PagedResponse<LookupItem>> {
        const endpoint = this.getLookupEndpoint(type);
        try {
            let url = `${baseUrl}/api/v1/${endpoint}?page=${page}&size=${size}`;
            if (typeFilter) {
                url += `&type=${encodeURIComponent(typeFilter)}`;
            }
            return await firstValueFrom(this.http.get<PagedResponse<LookupItem>>(url));
        } catch (e) {
            console.error(`Failed to fetch lookup ${type}`, e);
            throw e;
        }
    }

    // Generic Lookup CRUD
    async createLookup(baseUrl: string, type: string, item: Partial<LookupItem>): Promise<LookupItem> {
        const endpoint = this.getLookupEndpoint(type);
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/${endpoint}`;
            return await firstValueFrom(this.http.post<LookupItem>(url, item));
        } catch (e) {
            this.error.set(`Failed to create ${type}`);
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateLookup(baseUrl: string, type: string, id: number, item: Partial<LookupItem>): Promise<LookupItem> {
        const endpoint = this.getLookupEndpoint(type);
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/${endpoint}/${id}`;
            return await firstValueFrom(this.http.put<LookupItem>(url, item));
        } catch (e) {
            this.error.set(`Failed to update ${type}`);
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteLookup(baseUrl: string, type: string, id: number): Promise<void> {
        const endpoint = this.getLookupEndpoint(type);
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/${endpoint}/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set(`Failed to delete ${type}`);
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    private getLookupEndpoint(type: string): string {
        switch (type) {
            case 'service-types': return 'service-types';
            case 'server-types': return 'server-types';
            case 'framework-categories': return 'framework-categories';
            case 'framework-types': return 'framework-categories';
            case 'framework-languages': return 'framework-languages';
            case 'library-categories': return 'library-categories';
            case 'library-types': return 'library-categories';
            case 'system-types': return 'registry/systems/types';
            case 'operating-systems': return 'operating-systems';
            case 'environments': return 'environments';
            default: return type;
        }
    }

    // Libraries CRUD
    async getLibraries(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<Library>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/libraries?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<Library>>(url));
        } catch (e) {
            this.error.set('Failed to fetch libraries');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async getLibraryById(baseUrl: string, id: number): Promise<Library> {
        try {
            const url = `${baseUrl}/api/v1/libraries/${id}`;
            return await firstValueFrom(this.http.get<Library>(url));
        } catch (e) {
            this.error.set('Failed to fetch library');
            throw e;
        }
    }

    async createLibrary(baseUrl: string, library: LibraryPayload): Promise<Library> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/libraries`;
            return await firstValueFrom(this.http.post<Library>(url, library));
        } catch (e) {
            this.error.set('Failed to create library');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async updateLibrary(baseUrl: string, id: number, library: LibraryPayload): Promise<Library> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/libraries/${id}`;
            return await firstValueFrom(this.http.put<Library>(url, library));
        } catch (e) {
            this.error.set('Failed to update library');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteLibrary(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/libraries/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete library');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    // Visual Components CRUD
    async getVisualComponents(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<ComponentConfig>> {
        try {
            const url = `${baseUrl}/api/v1/visual-components?page=${page}&size=${size}`;
            return await firstValueFrom(this.http.get<PagedResponse<ComponentConfig>>(url));
        } catch (e) {
            console.error('Failed to fetch visual components', e);
            return { data: [], meta: { page: 0, per_page: 100, total: 0, last_page: 0 } };
        }
    }

    async createVisualComponent(baseUrl: string, component: Partial<ComponentConfig>): Promise<ComponentConfig> {
        this.loading.set(true);
        try {
            const url = `${baseUrl}/api/v1/visual-components`;
            return await firstValueFrom(this.http.post<ComponentConfig>(url, component));
        } finally {
            this.loading.set(false);
        }
    }

    async updateVisualComponent(baseUrl: string, id: string, component: Partial<ComponentConfig>): Promise<ComponentConfig> {
        this.loading.set(true);
        try {
            const url = `${baseUrl}/api/v1/visual-components/${id}`;
            return await firstValueFrom(this.http.put<ComponentConfig>(url, component));
        } finally {
            this.loading.set(false);
        }
    }

    // Systems CRUD
    async getSystems(baseUrl: string, page: number = 0, size: number = 100): Promise<PagedResponse<SystemItem>> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/registry/systems?page=${page}&size=${size}`;
            const response: any = await firstValueFrom(this.http.get<any>(url));

            // Backend returns a plain array (List<Systems>), not a PagedResponse.
            // Normalize: if it's an array, wrap it into PagedResponse format.
            if (Array.isArray(response)) {
                // Map nested systemType object → flat type string
                const items: SystemItem[] = response.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    type: s.systemType?.name,
                    serviceCount: 0,
                }));
                return {
                    data: items,
                    meta: {
                        page: 0,
                        per_page: size,
                        total: items.length,
                        last_page: 1,
                    },
                };
            }

            // Already a paged response — map systemType to type on each item
            if (response.data && Array.isArray(response.data)) {
                const items: SystemItem[] = response.data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    type: s.systemType?.name ?? s.type,
                    serviceCount: s.serviceCount ?? 0,
                }));
                return {
                    data: items,
                    meta: response.meta,
                };
            }

            throw new Error('Unexpected response format from systems endpoint');
        } catch (e) {
            this.error.set('Failed to fetch systems');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async createSystem(baseUrl: string, system: SystemPayload): Promise<SystemItem> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/registry/systems`;
            return await firstValueFrom(this.http.post<SystemItem>(url, system));
        } catch (e) {
            this.error.set('Failed to create system');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async deleteSystem(baseUrl: string, id: number): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const url = `${baseUrl}/api/v1/registry/systems/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } catch (e) {
            this.error.set('Failed to delete system');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async associateServiceWithSystem(baseUrl: string, systemName: string, serviceName: string): Promise<void> {
        try {
            const url = `${baseUrl}/api/v1/registry/systems/${encodeURIComponent(systemName)}/services/${encodeURIComponent(serviceName)}`;
            await firstValueFrom(this.http.post(url, null));
        } catch (e) {
            console.warn('Failed to associate service with system', e);
            throw e;
        }
    }

    async deleteVisualComponent(baseUrl: string, id: string): Promise<void> {
        this.loading.set(true);
        try {
            const url = `${baseUrl}/api/v1/visual-components/${id}`;
            await firstValueFrom(this.http.delete<void>(url));
        } finally {
            this.loading.set(false);
        }
    }
}

/** Canonical lookup endpoint string constants — single source of truth. */
export const LOOKUP_SERVICE_TYPES = 'service-types';
export const LOOKUP_SERVER_TYPES = 'server-types';
export const LOOKUP_FRAMEWORK_CATEGORIES = 'framework-categories';
export const LOOKUP_FRAMEWORK_LANGUAGES = 'framework-languages';
export const LOOKUP_LIBRARY_CATEGORIES = 'library-categories';
export const LOOKUP_ENVIRONMENTS = 'environments';
export const LOOKUP_OPERATING_SYSTEMS = 'operating-systems';

/**
 * Map of DB discriminator values → endpoint type strings used for API routing.
 */
export const TYPE_ENDPOINT_MAP: Record<string, string> = {
    framework_type: 'framework-categories',
    server_type: 'server-types',
    library_type: 'library-categories',
    environment_type: 'environments',
    service_type: 'service-types',
    service_config_type: 'service-config-types',
    system_type: 'system-types',
    operating_systems: 'operating-systems',
};

/**
 * Human-readable labels for each type discriminator.
 */
export const TYPE_LABELS: Record<string, string> = {
    all: 'All',
    framework_type: 'Framework',
    server_type: 'Server',
    library_type: 'Library',
    environment_type: 'Environment',
    service_type: 'Service',
    service_config_type: 'Config',
    system_type: 'System',
    operating_systems: 'OS',
};

/**
 * Display ordering for category types.
 */
export const TYPE_ORDER = ['framework_type', 'server_type', 'library_type', 'environment_type', 'service_type', 'service_config_type', 'system_type', 'operating_systems'];

/** Ordered list of types for the filter toolbar (excludes service_config_type). */
export const FILTER_TYPES = [
    'all',
    'framework_type',
    'server_type',
    'library_type',
    'environment_type',
    'service_type',
    'system_type',
    'operating_systems',
];

/**
 * Map a category discriminator (e.g. 'framework_type') to its icon name for tree display.
 */
export const CATEGORY_ICONS: Record<string, string> = {
    framework_type: 'category',
    server_type: 'storage',
    library_type: 'local_library',
    environment_type: 'environment',
    service_type: 'dns',
    system_type: 'dns',
    operating_systems: 'os',
};

/**
 * Map a category discriminator (e.g. 'framework_type') to its API endpoint string.
 */
export function getCategoryEndpointType(dbType: string): string {
    return TYPE_ENDPOINT_MAP[dbType] || dbType;
}

export interface LookupItem {
    id: number;
    name: string;
    description?: string;
    version?: string;
    ltsFlag?: boolean;
    activeFlag?: boolean;
    defaultComponentId?: number | null;
    defaultComponent?: ComponentConfig;
    /** Discriminator from the registry.categories view (e.g. 'framework_type', 'server_type'). */
    type?: string;
    /** Architecture field (operating_systems). */
    architecture?: string;
    /** Family field (operating_systems). */
    family?: string;
}
