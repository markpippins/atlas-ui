/**
 * T25 3.2 (R-A-2026-08-15-008) — shared endpoint resolution for nexus-console.
 *
 * Resolution precedence (mirrors wind-ui 2.4, the ratified reference):
 *   localStorage (explicit user override) > runtime lookup (terrain
 *   /api/v1/lookup/{unit}) > $<UNIT>_TARGET env > legacy localhost literal.
 *
 * The env/legacy value is returned synchronously so callers always have a
 * URL; the lookup refines it once it returns (3s timeout, silent on failure).
 */

declare const process: any;

declare const importMetaEnv: Record<string, string> | undefined;

function readMetaEnv(name: string): string | undefined {
  try {
    return (import.meta as any)?.env?.[`VITE_${name}`];
  } catch {
    return undefined;
  }
}

const LOOKUP_URL =
  readMetaEnv('LOOKUP_URL') ||
  (typeof process !== 'undefined' && process.env?.LOOKUP_URL) ||
  'http://localhost:8084';

export function readEnv(name: string): string | undefined {
  const viaMeta = readMetaEnv(name);
  if (viaMeta) return viaMeta;
  try {
    if (typeof process !== 'undefined' && process.env) {
      const viaProcess = process.env[name];
      if (viaProcess) return viaProcess;
    }
  } catch { /* process unavailable at runtime */ }
  return undefined;
}

function localStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Resolve a unit's base URL synchronously from override/env/legacy, and
 * return a refine() that replaces it with the terrain runtime lookup when
 * it resolves. Callers that hold the URL in a mutable field should call
 * refine() and apply the result unless the user set an explicit override.
 */
export function resolveEndpoint(
  unit: string,
  envVar: string,
  legacyDefault: string,
): { initial: string; refine: () => Promise<string | null> } {
  const overrideKey = `nexus_${unit}_base_url`;
  const override = localStorageGet(overrideKey);
  const initial = override || readEnv(envVar) || legacyDefault;

  const refine = async (): Promise<string | null> => {
    if (localStorageGet(overrideKey)) {
      return null; // explicit user override wins; do not refine
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(`${LOOKUP_URL}/api/v1/lookup/${encodeURIComponent(unit)}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) return null;
      const d = await res.json();
      const eps = d.endpoints || [];
      const e = eps.find((x: any) => x.instance === d.preferred) || eps[0];
      if (!e || !e.port) return null;
      return `${e.scheme || 'http'}://${e.ip || e.host}:${e.port}`;
    } catch {
      return null; // lookup down -> env/legacy fallback stays
    } finally {
      clearTimeout(t);
    }
  };

  return { initial, refine };
}

/** Legacy default for the service-registry catalog (:8085). */
export const SERVICE_REGISTRY_UNIT = 'service-registry';
export const SERVICE_REGISTRY_ENV = 'SERVICE_REGISTRY_TARGET';
export const SERVICE_REGISTRY_LEGACY = 'http://localhost:8085';

/** Legacy default for nebula-srv (:3101). */
export const NEBULA_SRV_UNIT = 'nebula-srv';
export const NEBULA_SRV_ENV = 'NEBULA_SRV_TARGET';
export const NEBULA_SRV_LEGACY = 'http://localhost:3101';

/** Legacy default for terrain/topology (:8084). */
export const TERRAIN_UNIT = 'terrain';
export const TERRAIN_ENV = 'TERRAIN_TARGET';
export const TERRAIN_LEGACY = 'http://localhost:8084';
