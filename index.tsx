// Polyfill: crypto.randomUUID() is not available in all browsers.
// Several vendor libraries (MCP SDK, Hono, etc.) call it directly.
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function() {
    // Fallback UUID v4 generator (RFC 4122)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { AppComponent } from './src/app.component.js';
import { IS_DEBUG_MODE } from './src/services/app-config.js';

// We assume the build process exposes DEBUG from .env as process.env.DEBUG

declare const process: any;
const isDebugMode = false;

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    { provide: IS_DEBUG_MODE, useValue: isDebugMode },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.