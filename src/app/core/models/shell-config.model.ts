import { ThemeMode } from './theme.model';

export interface ShellMenuItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: string;
  children?: ShellMenuItem[];
  external?: boolean;
  mfeId?: string;
}

export interface ShellNotification {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface ShellMfeDefinition {
  id: string;
  displayName: string;
  type: 'web-component' | 'module-federation';
  tagName?: string;
  route?: string;
  remoteEntry?: string;
  moduleName?: string;
  exposedModule?: string;
  elementName?: string;
  manifestUrl?: string;
  description?: string;
  allowDevelopers?: boolean;
  localDev?: {
    remoteEntry?: string;
  };
  fallbackTag?: string;
}

export interface ShellThemeConfig {
  defaultMode: ThemeMode;
  cacheVersion: string;
  lightThemeUrl: string;
  darkThemeUrl: string;
  fallbackLightThemeUrl: string;
  fallbackDarkThemeUrl: string;
}

export interface ShellBrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: string;
  logoUrl: string;
}

export interface ShellLayoutOptions {
  sidebar: 'left' | 'right';
  sidebarWidth: string;
  footerText?: string;
  showNotifications: boolean;
}

export interface ShellConfig {
  tenant: string;
  appName: string;
  logoAlt?: string;
  description?: string;
  configVersion: string;
  layout: ShellLayoutOptions;
  defaultTheme: ShellThemeConfig;
  branding?: ShellBrandingConfig;
  menu: ShellMenuItem[];
  mfeRegistry: ShellMfeDefinition[];
  notifications?: ShellNotification[];
  developer?: {
    fallbackTheme: ThemeMode;
    dummyUser: {
      name: string;
      title: string;
      avatarUrl?: string;
    };
  };
}
