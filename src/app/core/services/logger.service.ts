import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(message: string, ...args: unknown[]): void {
    console.info(`[OctaShell] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[OctaShell] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[OctaShell] ${message}`, ...args);
  }
}
