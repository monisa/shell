import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { ShellConfig, ShellMenuItem, ShellMfeDefinition } from '../models/shell-config.model';
import { BrowserStorageService } from './browser-storage.service';
import { LoggerService } from './logger.service';

const STORAGE_KEY = 'octa.shell.currentTenant';

@Injectable({ providedIn: 'root' })
export class ShellConfigService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BrowserStorageService);
  private readonly logger = inject(LoggerService);

  private readonly configSubject = new BehaviorSubject<ShellConfig | null>(null);
  readonly config$ = this.configSubject.asObservable();
  readonly configSignal = signal<ShellConfig | null>(null);

  readonly menu = computed<ShellMenuItem[]>(() => this.configSignal()?.menu ?? []);
  readonly mfeRegistry = computed<ShellMfeDefinition[]>(() => this.configSignal()?.mfeRegistry ?? []);

  async loadInitialConfig(): Promise<ShellConfig> {
    const tenant = this.resolveTenant();
    const config = await this.fetchConfig(tenant).catch(async (err) => {
      this.logger.error(`Failed to load config for tenant "${tenant}"`, err);
      return this.fetchConfig('default');
    });

    this.setConfig(config);
    return config;
  }

  async switchTenant(tenant: string): Promise<ShellConfig> {
    const config = await this.fetchConfig(tenant).catch((err) => {
      this.logger.error(`Failed to load config for tenant "${tenant}"`, err);
      throw err;
    });

    this.setConfig(config);
    return config;
  }

  getMenu(): ShellMenuItem[] {
    return this.menu();
  }

  findMfe(id: string): ShellMfeDefinition | undefined {
    return this.mfeRegistry().find((item) => item.id === id);
  }

  private async fetchConfig(tenant: string): Promise<ShellConfig> {
    const url = `assets/config/${tenant}.config.json`;
    return await firstValueFrom(this.http.get<ShellConfig>(url));
  }

  private resolveTenant(): string {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('tenant');
      if (fromUrl) {
        this.storage.setItem(STORAGE_KEY, fromUrl);
        return fromUrl;
      }
    }

    return this.storage.getItem<string>(STORAGE_KEY) ?? 'client';
  }

  private setConfig(config: ShellConfig): void {
    this.configSubject.next(config);
    this.configSignal.set(config);
    this.storage.setItem(STORAGE_KEY, config.tenant);
    if (config.defaultTheme?.defaultMode) {
      this.storage.setItem(`${STORAGE_KEY}.mode`, config.defaultTheme.defaultMode);
    }
    this.logger.info(`Loaded shell config for tenant "${config.tenant}"`);
  }
}
