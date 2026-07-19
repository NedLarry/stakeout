import { Injectable } from '@angular/core';

const DEFAULT_TTL_MS = 30 * 60_000; // 30 minutes

interface CacheEnvelope<T> {
  value: T;
  expiresAt: number;
}

/**
 * Thin localStorage wrapper that expires entries after a TTL. Used to persist
 * a signed-up user's own activity across reloads without a real backend —
 * data quietly disappears 30 minutes after the last write.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const envelope = JSON.parse(raw) as CacheEnvelope<T>;
      if (Date.now() >= envelope.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return envelope.value;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  set<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
    const envelope: CacheEnvelope<T> = { value, expiresAt: Date.now() + ttlMs };
    localStorage.setItem(key, JSON.stringify(envelope));
  }

  clear(key: string): void {
    localStorage.removeItem(key);
  }
}
