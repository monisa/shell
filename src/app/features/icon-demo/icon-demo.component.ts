import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../core/services/icon.service';

/**
 * Icon Demo Component
 * 
 * Demonstrates how MFEs can access icons from the shell
 * WITHOUT having local icon assets.
 * 
 * The icons are loaded from theme.json and exposed as CSS variables.
 */
@Component({
  selector: 'app-icon-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="icon-demo">
      <h1>🎨 Icon Demo - MFE Access Without Local Assets</h1>
      
      <section class="demo-section">
        <h2>Method 1: CSS Variables (Recommended)</h2>
        <p>Icons accessed via <code>var(--octa-icons-*)</code> CSS variables:</p>
        
        <div class="icon-grid">
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-dashboard)"></span>
            <code>dashboard</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-settings)"></span>
            <code>settings</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-users)"></span>
            <code>users</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-edit)"></span>
            <code>edit</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-trash)"></span>
            <code>trash</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask" style="--icon: var(--octa-icons-search)"></span>
            <code>search</code>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>Method 2: With Custom Colors</h2>
        <p>Using CSS mask allows color customization:</p>
        
        <div class="icon-grid">
          <div class="icon-item">
            <span class="icon icon--mask icon--primary" style="--icon: var(--octa-icons-check)"></span>
            <code>Primary</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask icon--success" style="--icon: var(--octa-icons-check)"></span>
            <code>Success</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask icon--danger" style="--icon: var(--octa-icons-close)"></span>
            <code>Danger</code>
          </div>
          <div class="icon-item">
            <span class="icon icon--mask icon--warning" style="--icon: var(--octa-icons-notifications)"></span>
            <code>Warning</code>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>Method 3: IconService (Angular)</h2>
        <p>Programmatic access via IconService:</p>
        
        <div class="icon-grid">
          @for (name of availableIcons(); track name) {
            <div class="icon-item">
              <span 
                class="icon icon--mask" 
                [style.--icon]="iconService.getCssVar(name)"
              ></span>
              <code>{{ name }}</code>
            </div>
          }
        </div>
      </section>

      <section class="demo-section">
        <h2>Method 4: Button Examples</h2>
        
        <div class="button-examples">
          <button class="btn btn--primary">
            <span class="btn__icon" style="--icon: var(--octa-icons-plus)"></span>
            Add Item
          </button>
          
          <button class="btn btn--secondary">
            <span class="btn__icon" style="--icon: var(--octa-icons-edit)"></span>
            Edit
          </button>
          
          <button class="btn btn--danger">
            <span class="btn__icon" style="--icon: var(--octa-icons-trash)"></span>
            Delete
          </button>
          
          <button class="btn btn--icon-only" title="Search">
            <span class="btn__icon" style="--icon: var(--octa-icons-search)"></span>
          </button>
        </div>
      </section>

      <section class="demo-section">
        <h2>CSS Code Example</h2>
        <pre><code>{{ cssExample }}</code></pre>
      </section>
    </div>
  `,
  styles: [`
    .icon-demo {
      padding: var(--octa-spacing-lg);
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      color: var(--octa-colors-on-surface);
      margin-bottom: var(--octa-spacing-xl);
    }

    h2 {
      color: var(--octa-colors-on-surface);
      font-size: var(--octa-typography-font-size-lg);
      margin-bottom: var(--octa-spacing-sm);
    }

    p {
      color: var(--octa-colors-on-surface-muted);
      margin-bottom: var(--octa-spacing-md);
    }

    code {
      background: var(--octa-colors-surface-muted);
      padding: 2px 6px;
      border-radius: var(--octa-radius-sm);
      font-family: var(--octa-typography-font-family-mono, monospace);
      font-size: 13px;
    }

    pre {
      background: var(--octa-colors-surface-muted);
      padding: var(--octa-spacing-md);
      border-radius: var(--octa-radius-md);
      overflow-x: auto;
    }

    pre code {
      background: none;
      padding: 0;
    }

    .demo-section {
      background: var(--octa-colors-surface);
      border: 1px solid var(--octa-colors-outline);
      border-radius: var(--octa-radius-md);
      padding: var(--octa-spacing-lg);
      margin-bottom: var(--octa-spacing-lg);
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--octa-spacing-md);
    }

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--octa-spacing-xs);
      padding: var(--octa-spacing-sm);
      border-radius: var(--octa-radius-sm);
      transition: background 0.2s;
    }

    .icon-item:hover {
      background: var(--octa-colors-surface-muted);
    }

    /* Icon styles - THIS IS WHAT MFEs COPY */
    .icon {
      width: 32px;
      height: 32px;
      display: inline-block;
    }

    .icon--mask {
      background-color: var(--octa-colors-on-surface);
      -webkit-mask-image: var(--icon);
      mask-image: var(--icon);
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }

    .icon--primary { background-color: var(--octa-colors-primary); }
    .icon--success { background-color: var(--octa-colors-success); }
    .icon--danger { background-color: var(--octa-colors-danger); }
    .icon--warning { background-color: #f59e0b; }

    /* Button examples */
    .button-examples {
      display: flex;
      gap: var(--octa-spacing-md);
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--octa-spacing-sm);
      padding: var(--octa-spacing-sm) var(--octa-spacing-md);
      border: none;
      border-radius: var(--octa-radius-sm);
      font-size: var(--octa-typography-font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn__icon {
      width: 16px;
      height: 16px;
      display: inline-block;
      background-color: currentColor;
      -webkit-mask-image: var(--icon);
      mask-image: var(--icon);
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
    }

    .btn--primary {
      background: var(--octa-colors-primary);
      color: white;
    }
    .btn--primary:hover { opacity: 0.9; }

    .btn--secondary {
      background: var(--octa-colors-surface);
      color: var(--octa-colors-on-surface);
      border: 1px solid var(--octa-colors-outline);
    }
    .btn--secondary:hover { background: var(--octa-colors-surface-muted); }

    .btn--danger {
      background: var(--octa-colors-danger);
      color: white;
    }

    .btn--icon-only {
      padding: var(--octa-spacing-sm);
      background: var(--octa-colors-surface);
      border: 1px solid var(--octa-colors-outline);
      color: var(--octa-colors-on-surface);
    }
    .btn--icon-only .btn__icon { width: 20px; height: 20px; }
  `]
})
export class IconDemoComponent {
  readonly iconService = inject(IconService);
  readonly availableIcons = this.iconService.availableIcons;

  readonly cssExample = `/* MFE Icon Usage - No local assets needed! */
Method 1: Pure CSS (No Angular Required)
/* MFE can use icons via CSS variables */
.my-icon {
  width: 24px;
  height: 24px;
  display: inline-block;
  /* CSS mask allows color control */
  background-color: currentColor;
  -webkit-mask-image: var(--octa-icons-dashboard);
  mask-image: var(--octa-icons-dashboard);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
/* With custom color */
.my-icon--primary {
  background-color: var(--octa-colors-primary);
}


Method 2: Using SCSS Mixin
Import mfe-icon-utils.scss in your MFE:
/* MFE can use icons via CSS variables */
.my-icon {
  width: 24px;
  height: 24px;
  display: inline-block; /* CSS mask allows color control */
  background-color: currentColor;
  -webkit-mask-image: var(--octa-icons-dashboard);
  mask-image: var(--octa-icons-dashboard);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
} /* With custom color */
.my-icon--primary {
  background-color: var(--octa-colors-primary);
}


Method 3: HTML Inline (Quick)
@import 'path/to/mfe-icon-utils.scss';
// Use the mixin.my-button-icon {  @include octa-icon('edit', 20px, var(--octa-colors-primary));}
// Or utility classes
 <span class="octa-icon-dashboard"></span>

Method 4: Angular IconService
<!-- Using CSS custom property -->
<span class="icon"
 style="width: 24px;height: 24px;display: inline-block;background-color: currentColor;
 -webkit-mask-image: var(--octa-icons-edit);mask-image: var(--octa-icons-edit);mask-size: contain;"></span>
How It Works
import { IconService } from '@core/services/icon.service';
@Component({  
template: '<span class="icon" [style.--icon]="iconService.getCssVar('dashboard')"    ></span>'})
export class MyMfeComponent {  
	iconService = inject(IconService);
}`;
}

