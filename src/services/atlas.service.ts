import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GraphView } from '../models/graph-view.model.js';

const ATLAS_URL = 'http://localhost:8090';

@Injectable({ providedIn: 'root' })
export class AtlasService {
    private http = inject(HttpClient);

    /** Reactive list of all saved graph views. */
    readonly views = signal<GraphView[]>([]);

    /** Currently selected view ID. */
    readonly selectedViewId = signal<number | null>(null);

    /** Set to a view ID when the user wants to load a view. Consumer resets to null. */
    readonly loadRequested = signal<number | null>(null);

    /** Set to a name when the user wants to save the current view. Consumer resets to null. */
    readonly saveRequested = signal<string | null>(null);

    async refresh(): Promise<GraphView[]> {
        const list = await firstValueFrom(
            this.http.get<GraphView[]>(`${ATLAS_URL}/api/v1/graph-views?size=200`)
        );
        this.views.set(list);
        return list;
    }

    async getById(id: number): Promise<GraphView> {
        return await firstValueFrom(
            this.http.get<GraphView>(`${ATLAS_URL}/api/v1/graph-views/${id}`)
        );
    }

    async create(view: GraphView): Promise<GraphView> {
        const created = await firstValueFrom(
            this.http.post<GraphView>(`${ATLAS_URL}/api/v1/graph-views`, view)
        );
        await this.refresh();
        this.selectedViewId.set(created.id ?? null);
        return created;
    }

    async update(id: number, view: GraphView): Promise<GraphView> {
        const updated = await firstValueFrom(
            this.http.put<GraphView>(`${ATLAS_URL}/api/v1/graph-views/${id}`, view)
        );
        await this.refresh();
        return updated;
    }

    async delete(id: number): Promise<void> {
        await firstValueFrom(
            this.http.delete<void>(`${ATLAS_URL}/api/v1/graph-views/${id}`)
        );
        await this.refresh();
        if (this.selectedViewId() === id) {
            this.selectedViewId.set(null);
        }
    }

    async setDefault(id: number): Promise<GraphView> {
        const result = await firstValueFrom(
            this.http.put<GraphView>(`${ATLAS_URL}/api/v1/graph-views/${id}/set-default`, {})
        );
        await this.refresh();
        return result;
    }
}
