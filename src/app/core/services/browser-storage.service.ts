import { Injectable } from '@angular/core';

const isBrowser = typeof window !== 'undefined';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
  getItem<T = unknown>(key: string): T | null {
    if (!isBrowser) {
      return null;
    }

    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  setItem<T = unknown>(key: string, value: T): void {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // noop - storage might be unavailable
    }
  }

  removeItem(key: string): void {
    if (!isBrowser) {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // noop
    }
  }
}
