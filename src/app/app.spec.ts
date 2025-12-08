import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ShellConfig } from './core/models/shell-config.model';
import { ShellConfigService } from './core/services/shell-config.service';
import { ThemeService } from './core/services/theme.service';
import { AppComponent } from './app';

class ShellConfigServiceStub {
  configSignal = signal<ShellConfig | null>(null);
}

class ThemeServiceStub {
  currentMode = signal<'light' | 'dark'>('light');
  logos = signal({});
  getLogoUrl(): string | undefined {
    return undefined;
  }
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        { provide: ShellConfigService, useClass: ShellConfigServiceStub },
        { provide: ThemeService, useClass: ThemeServiceStub }
      ]
    }).compileComponents();
  });

  it('should create the shell component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
