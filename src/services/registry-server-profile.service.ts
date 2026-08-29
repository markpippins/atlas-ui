import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegistryServerProfile } from '../models/registry-server-profile.model.js';
import { PagedResponse } from '../models/paged-response.model.js';
import { TERRAIN_UNIT, TERRAIN_ENV, TERRAIN_LEGACY, SERVICE_REGISTRY_UNIT, SERVICE_REGISTRY_ENV, SERVICE_REGISTRY_LEGACY, resolveEndpoint } from './endpoint-resolver.js';

// T25 3.2 (R-A-2026-08-15-008): runtime lookup > env > legacy localhost.
const topology = resolveEndpoint(TERRAIN_UNIT, TERRAIN_ENV, TERRAIN_LEGACY);
const registry = resolveEndpoint(SERVICE_REGISTRY_UNIT, SERVICE_REGISTRY_ENV, SERVICE_REGISTRY_LEGACY);

@Injectable({
    providedIn: 'root'
})
export class RegistryServerProfileService {
    private http = inject(HttpClient);

    /** Maps frontend profile id (string) → backend numeric id (Long) */
    private backendIdMap = new Map<string, number>();

    /** Terrain/topology base URL — env/legacy initially, refined by lookup. */
    private topologyBaseUrl: string = topology.initial;

    /** Registry base URL used for the default profile — refined by lookup. */
    private registryDefaultUrl: string = registry.initial;

    private get PROFILES_API(): string {
        return `${this.topologyBaseUrl}/api/v1/registry-server-profiles`;
    }

    readonly profiles = signal<RegistryServerProfile[]>([{
        id: 'default-local-host',
        name: 'Local Host',
        registryServerUrl: this.registryDefaultUrl,
        imageUrl: '',
        description: 'Default local registry server',
        isActive: true // Default profile is active by default
    }]);

    /**
     * Computed signal that returns the currently active registry server profile.
     * Falls back to the first profile if none is explicitly marked as active.
     */
    readonly activeProfile = computed<RegistryServerProfile | null>(() => {
        const allProfiles = this.profiles();
        // First, try to find an explicitly active profile
        const active = allProfiles.find(p => p.isActive === true);
        if (active) {
            return active;
        }
        // Fallback: return the first profile if available
        return allProfiles.length > 0 ? allProfiles[0] : null;
    });

    /**
     * Computed signal that returns the active profile's base URL.
     * Useful for services that need just the URL.
     */
    readonly activeBaseUrl = computed<string | null>(() => {
        const profile = this.activeProfile();
        if (!profile) return null;

        let url = profile.registryServerUrl;
        if (!url.startsWith('http')) {
            url = `http://${url}`;
        }
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        return url;
    });

    constructor() {
        // Load profiles immediately with env/legacy defaults, then let the
        // runtime lookup refine terrain + registry URLs when it returns.
        void this.loadProfiles();
        void Promise.all([topology.refine(), registry.refine()]).then(([t, r]) => {
            if (t) this.topologyBaseUrl = t;
            if (r) this.registryDefaultUrl = r;
            void this.loadProfiles();
        }).catch(() => { /* keep env/legacy defaults */ });
    }

    async loadProfiles(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.get<PagedResponse<any>>(this.PROFILES_API)
            );
            const apiProfiles = response.data || [];
            if (apiProfiles.length > 0) {
                // Map API response to frontend model and store backend id mapping
                const mapped = apiProfiles.map((item: any) => {
                    this.backendIdMap.set(item.profileId, item.id);
                    return {
                        id: item.profileId,
                        name: item.name,
                        registryServerUrl: item.registryServerUrl || '',
                        imageUrl: item.imageUrl || '',
                        isActive: item.isActive === true,
                        description: item.description || ''
                    } as RegistryServerProfile;
                });

                // Ensure at least one profile is active
                const hasActive = mapped.some(p => p.isActive === true);
                if (!hasActive && mapped.length > 0) {
                    mapped[0].isActive = true;
                }
                this.profiles.set(mapped);
                console.log('[RegistryServerProfileService] Loaded profiles from API', mapped);
                console.log('[RegistryServerProfileService] Active profile:', mapped.find(p => p.isActive)?.name);
            } else {
                console.log('[RegistryServerProfileService] Using default profile');
            }
        } catch (e) {
            console.warn('[RegistryServerProfileService] Failed to load profiles from API, using default', e);
        }
    }

    /**
     * Set a specific profile as the active one.
     * This will deactivate all other profiles and activate the specified one.
     */
    async setActiveProfile(profileId: string): Promise<void> {
        const updatedProfiles = this.profiles().map(p => ({
            ...p,
            isActive: p.id === profileId
        }));

        // Update all profiles via the API
        for (const profile of updatedProfiles) {
            const backendId = this.backendIdMap.get(profile.id);
            if (backendId) {
                try {
                    await firstValueFrom(
                        this.http.put(`${this.PROFILES_API}/${backendId}`, {
                            profileId: profile.id,
                            name: profile.name,
                            registryServerUrl: profile.registryServerUrl,
                            imageUrl: profile.imageUrl,
                            isActive: profile.isActive,
                            description: profile.description
                        })
                    );
                } catch (e) {
                    console.warn(`[RegistryServerProfileService] Failed to update profile ${profile.id}`, e);
                }
            }
        }

        this.profiles.set(updatedProfiles);
        console.log('[RegistryServerProfileService] Set active profile:', profileId);
    }

    async saveProfile(profile: RegistryServerProfile): Promise<void> {
        const existing = this.profiles().find(p => p.id === profile.id);
        const backendId = this.backendIdMap.get(profile.id);

        if (existing && backendId) {
            // Update existing profile
            try {
                await firstValueFrom(
                    this.http.put(`${this.PROFILES_API}/${backendId}`, {
                        profileId: profile.id,
                        name: profile.name,
                        registryServerUrl: profile.registryServerUrl,
                        imageUrl: profile.imageUrl,
                        isActive: profile.isActive ?? false,
                        description: profile.description || ''
                    })
                );
                this.profiles.update(current =>
                    current.map(p => p.id === profile.id ? profile : p)
                );
            } catch (e) {
                console.error(`[RegistryServerProfileService] Failed to update profile ${profile.id}`, e);
                throw e;
            }
        } else {
            // Create new profile
            if (this.profiles().length === 0) {
                profile.isActive = true;
            }
            try {
                const created = await firstValueFrom(
                    this.http.post<any>(this.PROFILES_API, {
                        profileId: profile.id,
                        name: profile.name,
                        registryServerUrl: profile.registryServerUrl,
                        imageUrl: profile.imageUrl,
                        isActive: profile.isActive ?? false,
                        description: profile.description || ''
                    })
                );
                // Store backend id mapping from response
                this.backendIdMap.set(created.profileId, created.id);
                this.profiles.update(current => [...current, profile]);
            } catch (e) {
                console.error(`[RegistryServerProfileService] Failed to create profile ${profile.id}`, e);
                throw e;
            }
        }
    }

    async deleteProfile(profileId: string): Promise<void> {
        const profileToDelete = this.profiles().find(p => p.id === profileId);
        const wasActive = profileToDelete?.isActive === true;
        const backendId = this.backendIdMap.get(profileId);

        if (backendId) {
            try {
                await firstValueFrom(
                    this.http.delete(`${this.PROFILES_API}/${backendId}`)
                );
            } catch (e) {
                console.error(`[RegistryServerProfileService] Failed to delete profile ${profileId}`, e);
                throw e;
            }
        }

        this.backendIdMap.delete(profileId);
        this.profiles.update(current => current.filter(p => p.id !== profileId));

        // If we deleted the active profile, make the first remaining profile active
        if (wasActive) {
            const remaining = this.profiles();
            if (remaining.length > 0) {
                await this.setActiveProfile(remaining[0].id);
            }
        }
    }
}
