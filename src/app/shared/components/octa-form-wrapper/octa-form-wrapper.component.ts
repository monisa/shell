import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebComponentLoaderService } from '../../../core/services/webcomponent-loader.service';
import { ShadowDomThemeService } from '../../../core/services/shadow-dom-theme.service';

export interface WebComponentEventPayload {
  name: string;
  detail: unknown;
}

/**
 * OctaFormWrapperComponent
 * 
 * A wrapper component for loading and managing form-based web components (MFEs).
 * 
 * Features:
 * - Dynamically loads form-builder, form-submission, or form-preview web components
 * - Injects shell CSS variables into Shadow DOM for consistent theming
 * - Handles event forwarding from web component to Angular
 * - Manages web component lifecycle
 * 
 * IMPORTANT: MFEs must NOT load theme.json directly.
 * They receive theme via CSS variables injected by this wrapper.
 */
@Component({
  selector: 'octa-form-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './octa-form-wrapper.component.html',
  styleUrls: ['./octa-form-wrapper.component.scss']
})
export class OctaFormWrapperComponent implements AfterViewInit, OnDestroy, OnChanges {
  // Common inputs
  @Input() tagName = 'octa-form-submission-webcomponent';
  @Input() formData: unknown;
  @Input() edit = false;
  @Input() triggerFormSave: string | null = 'submit';
  @Input() submissionId = '';
  @Input() listenEvents: string[] = ['submitForm'];

  // Builder-specific inputs
  @Input() formId = '';
  @Input() showModifyInfo = false;
  @Input() createDuplicate = false;
  @Input() enableTranslation = false;
  @Input() allowTitleEdit = false;
  @Input() saveLabel = '';

  @Output() webComponentEvent = new EventEmitter<WebComponentEventPayload>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  private readonly renderer = inject(Renderer2);
  private readonly loader = inject(WebComponentLoaderService);
  private readonly shadowDomTheme = inject(ShadowDomThemeService);

  private elementRef: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private readonly handlers = new Map<string, EventListener>();

  async ngAfterViewInit(): Promise<void> {
    await this.loadAppropriateBundle();
    this.renderElement();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.elementRef) return;

    if (changes['formData'] || changes['edit'] || changes['triggerFormSave'] || changes['submissionId']) {
      this.updateProps();
    }
    if (changes['listenEvents']) {
      this.updateEventListeners();
    }
    if (changes['tagName'] && !changes['tagName'].isFirstChange()) {
      this.recreate();
    }
  }

  ngOnDestroy(): void {
    this.removeElement();
  }

  private async loadAppropriateBundle(): Promise<void> {
    const tag = (this.tagName || '').toLowerCase();
    if (tag.includes('builder')) {
      await this.loader.loadFormBuilder();
    } else if (tag.includes('preview')) {
      await this.loader.loadFormPreview();
    } else {
      await this.loader.loadFormSubmission();
    }
  }

  private renderElement(): void {
    if (!this.tagName) return;

    this.elementRef = this.renderer.createElement(this.tagName);
    this.updateProps();
    this.addEventListeners();
    this.renderer.appendChild(this.host.nativeElement, this.elementRef);

    // Inject CSS variables into Shadow DOM after element is mounted
    this.injectThemeIntoShadowDom();
  }

  /**
   * Inject shell CSS variables into the web component's Shadow DOM.
   * This ensures MFEs receive theme styling without loading theme.json.
   */
  private injectThemeIntoShadowDom(): void {
    if (!this.elementRef) return;

    // Wait for the custom element to be defined and render its shadow DOM
    requestAnimationFrame(() => {
      this.shadowRoot = this.elementRef?.shadowRoot ?? null;
      
      if (this.shadowRoot) {
        this.shadowDomTheme.injectIntoShadowRoot(this.shadowRoot);
      } else {
        // Some web components create shadow DOM asynchronously
        this.shadowDomTheme.injectIntoElement(this.elementRef!);
      }
    });
  }

  private recreate(): void {
    this.removeElement();
    this.loadAppropriateBundle().then(() => this.renderElement());
  }

  private updateProps(): void {
    if (!this.elementRef) return;

    const el = this.elementRef as HTMLElement & Record<string, unknown>;

    // Form data (both camelCase and lowercase for compatibility)
    const formDataStr = typeof this.formData === 'string'
      ? this.formData
      : JSON.stringify(this.formData ?? {});

    el['formData'] = formDataStr;
    el['formdata'] = formDataStr;
    el.setAttribute('formdata', formDataStr);

    // Common properties
    el['edit'] = this.edit;
    el['triggerFormSave'] = this.triggerFormSave;
    el['submissionid'] = this.submissionId;

    // Builder-specific properties
    el['formId'] = this.formId;
    el['showModifyInfo'] = this.showModifyInfo;
    el['createDuplicate'] = this.createDuplicate;
    el['enableTranslation'] = this.enableTranslation;
    el['allowTitleEdit'] = this.allowTitleEdit;
    el['saveLabel'] = this.saveLabel;
  }

  private addEventListeners(): void {
    if (!this.elementRef) return;

    (this.listenEvents || []).forEach(eventName => {
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        this.webComponentEvent.emit({
          name: eventName,
          detail: customEvent.detail
        });
      };
      this.handlers.set(eventName, handler);
      this.elementRef!.addEventListener(eventName, handler);
    });
  }

  private updateEventListeners(): void {
    if (!this.elementRef) return;

    // Remove old listeners
    this.handlers.forEach((handler, eventName) => {
      this.elementRef!.removeEventListener(eventName, handler);
    });
    this.handlers.clear();

    // Add new listeners
    this.addEventListeners();
  }

  private removeElement(): void {
    if (!this.elementRef) return;

    // Untrack shadow root from theme service
    if (this.shadowRoot) {
      this.shadowDomTheme.untrack(this.shadowRoot);
      this.shadowRoot = null;
    }

    this.handlers.forEach((handler, eventName) => {
      this.elementRef!.removeEventListener(eventName, handler);
    });
    this.handlers.clear();

    this.renderer.removeChild(this.host.nativeElement, this.elementRef);
    this.elementRef = null;
  }
}
