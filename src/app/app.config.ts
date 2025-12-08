import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { ShellConfigService } from './core/services/shell-config.service';
import { ThemeService } from './core/services/theme.service';

export function initializeShell(
  configService: ShellConfigService,
  themeService: ThemeService
): () => Promise<void> {
  return async () => {
    const config = await configService.loadInitialConfig();
    await themeService.init(config);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeShell,
      deps: [ShellConfigService, ThemeService],
      multi: true
    }
  ]
};
