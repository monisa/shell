# MFE Theme Contract

This document defines the theming contract between the Octa Shell and Micro Front-Ends (MFEs).

## Core Principles

1. **MFEs must NOT load `theme.json` directly**
2. **MFEs must ONLY use CSS variables for theming**
3. **Shadow DOM must correctly receive CSS variables via the shell**
4. **Each MFE must include a fallback theme file for local development**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         OCTA SHELL                               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │ ThemeService│───▶│ CSS Variables│───▶│ ShadowDomTheme    │   │
│  │ loads JSON  │    │ on :root     │    │ Service           │   │
│  └─────────────┘    └──────────────┘    └─────────┬─────────┘   │
│                                                    │             │
│  ┌─────────────────────────────────────────────────▼───────────┐│
│  │                    OctaFormWrapper                          ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ MFE Web Component (Shadow DOM)                      │   ││
│  │  │ ┌─────────────────────────────────────────────────┐ │   ││
│  │  │ │ <style> :host { --octa-colors-primary: ... }    │ │   ││
│  │  │ │ /* Injected by ShadowDomThemeService */         │ │   ││
│  │  │ └─────────────────────────────────────────────────┘ │   ││
│  │  │ Uses: var(--octa-colors-primary)                    │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## CSS Variable Naming Convention

All theme variables use the `--octa-` prefix:

```css
--octa-{category}-{token}
--octa-{category}-{group}-{token}
```

### Categories

| Category | Example | Description |
|----------|---------|-------------|
| `colors` | `--octa-colors-primary` | Color palette |
| `typography` | `--octa-typography-font-size-base` | Fonts & text |
| `spacing` | `--octa-spacing-md` | Margins & padding |
| `radius` | `--octa-radius-md` | Border radius |
| `shadow` | `--octa-shadow-md` | Box shadows |
| `components` | `--octa-components-button-bg` | Component-specific |

---

## Available CSS Variables

### Colors

```css
/* Background & Surface */
--octa-colors-background
--octa-colors-surface
--octa-colors-surface-muted

/* Text */
--octa-colors-on-surface
--octa-colors-on-surface-muted

/* Brand */
--octa-colors-primary
--octa-colors-primary-hover
--octa-colors-primary-light
--octa-colors-secondary
--octa-colors-accent

/* Semantic */
--octa-colors-success
--octa-colors-warning
--octa-colors-danger
--octa-colors-info

/* Borders */
--octa-colors-outline
--octa-colors-border
```

### Typography

```css
--octa-typography-font-family-base
--octa-typography-font-family-headings
--octa-typography-font-family-mono

--octa-typography-font-size-xs    /* 12px */
--octa-typography-font-size-sm    /* 14px */
--octa-typography-font-size-base  /* 16px */
--octa-typography-font-size-lg    /* 18px */
--octa-typography-font-size-xl    /* 20px */
--octa-typography-font-size-2xl   /* 24px */
--octa-typography-font-size-3xl   /* 30px */

--octa-typography-font-weight-normal   /* 400 */
--octa-typography-font-weight-medium   /* 500 */
--octa-typography-font-weight-semibold /* 600 */
--octa-typography-font-weight-bold     /* 700 */

--octa-typography-line-height-tight    /* 1.25 */
--octa-typography-line-height-base     /* 1.5 */
--octa-typography-line-height-relaxed  /* 1.75 */
```

### Spacing

```css
--octa-spacing-xs   /* 4px */
--octa-spacing-sm   /* 8px */
--octa-spacing-md   /* 16px */
--octa-spacing-lg   /* 24px */
--octa-spacing-xl   /* 32px */
--octa-spacing-2xl  /* 48px */
--octa-spacing-3xl  /* 64px */
```

### Border Radius

```css
--octa-radius-none  /* 0 */
--octa-radius-sm    /* 4px */
--octa-radius-md    /* 8px */
--octa-radius-lg    /* 12px */
--octa-radius-xl    /* 16px */
--octa-radius-full  /* 9999px */
```

### Shadows

```css
--octa-shadow-sm
--octa-shadow-md
--octa-shadow-lg
--octa-shadow-xl
```

### Component Tokens

```css
/* Buttons */
--octa-button-primary-bg
--octa-button-primary-text
--octa-button-primary-hover
--octa-button-secondary-bg
--octa-button-secondary-text
--octa-button-secondary-border

/* Inputs */
--octa-input-bg
--octa-input-border
--octa-input-text
--octa-input-placeholder
--octa-input-focus-border
--octa-input-error-border

/* Cards */
--octa-card-bg
--octa-card-border
--octa-card-shadow

/* Tables */
--octa-table-header-bg
--octa-table-row-hover
--octa-table-border
```

---

## MFE Implementation Guide

### Step 1: Include Fallback CSS

For local development (when running outside the shell), import the fallback CSS:

```css
/* styles.css or styles.scss in your MFE */
@import 'path/to/mfe-theme-fallback.css';
```

Or copy `src/assets/mfe-theme-fallback.css` to your MFE project.

### Step 2: Use CSS Variables in Components

```scss
// ❌ DON'T: Hardcode colors
.button {
  background: #2563eb;
  color: white;
}

// ✅ DO: Use CSS variables
.button {
  background: var(--octa-colors-primary);
  color: var(--octa-button-primary-text, white);
}
```

### Step 3: Handle Dark Mode (Optional)

The shell sets `data-theme="dark"` on the body. Use `:host-context` for Shadow DOM:

```scss
.card {
  background: var(--octa-colors-surface);
  color: var(--octa-colors-on-surface);
}

// Additional dark mode overrides if needed
:host-context([data-theme="dark"]) .card {
  // Custom dark mode styles
}
```

### Step 4: Never Load Theme JSON

```typescript
// ❌ DON'T: Load theme directly
this.http.get('assets/themes/default_light.json')
  .subscribe(theme => this.applyTheme(theme));

// ✅ DO: Just use CSS variables - shell handles everything
```

---

## How Shadow DOM Receives Variables

The shell's `ShadowDomThemeService` automatically:

1. Collects all `--octa-*` variables from `:root`
2. Injects them into Shadow DOM via a `<style>` element
3. Updates them when theme changes (e.g., light → dark toggle)

```typescript
// This happens automatically in OctaFormWrapperComponent
// MFE developers don't need to do anything special
```

---

## Testing Your MFE Theme Integration

### Local Development (Standalone)

1. Import `mfe-theme-fallback.css`
2. Run your MFE independently
3. You should see the fallback theme applied

### In Shell (Integration)

1. Build your MFE
2. Load it in the shell
3. Toggle theme (light/dark)
4. Verify colors update instantly

### Browser DevTools Check

1. Open DevTools → Elements
2. Select your MFE's Shadow DOM
3. Look for `<style id="octa-theme-variables">` at the top
4. Verify CSS variables are present

---

## Troubleshooting

### Variables not applying in Shadow DOM

- Ensure MFE is loaded via `OctaFormWrapperComponent`
- Check if Shadow DOM exists (some components use Light DOM)
- Verify the `<style id="octa-theme-variables">` element exists

### Theme not updating on toggle

- Shell's `ShadowDomThemeService` should refresh automatically
- Check browser console for errors
- Verify MFE is using CSS variables, not hardcoded values

### Fallback not working in standalone

- Verify `mfe-theme-fallback.css` is imported
- Check CSS import path is correct
- Ensure no CSS specificity conflicts

---

## Example: Angular MFE Component

```typescript
@Component({
  selector: 'my-mfe-component',
  encapsulation: ViewEncapsulation.ShadowDom,
  styles: [`
    :host {
      display: block;
      font-family: var(--octa-typography-font-family-base);
    }
    
    .card {
      background: var(--octa-colors-surface);
      border: 1px solid var(--octa-colors-outline);
      border-radius: var(--octa-radius-md);
      padding: var(--octa-spacing-md);
    }
    
    .title {
      color: var(--octa-colors-on-surface);
      font-size: var(--octa-typography-font-size-lg);
      font-weight: var(--octa-typography-font-weight-semibold);
    }
    
    .button {
      background: var(--octa-colors-primary);
      color: white;
      border: none;
      border-radius: var(--octa-radius-sm);
      padding: var(--octa-spacing-sm) var(--octa-spacing-md);
      cursor: pointer;
      transition: background var(--octa-transition-fast);
    }
    
    .button:hover {
      background: var(--octa-colors-primary-hover);
    }
  `],
  template: `
    <div class="card">
      <h2 class="title">My MFE Component</h2>
      <button class="button">Action</button>
    </div>
  `
})
export class MyMfeComponent {}
```

---

## Summary

| Rule | Description |
|------|-------------|
| ❌ No theme.json | MFEs don't load theme files |
| ✅ CSS Variables | Use `var(--octa-*)` everywhere |
| ✅ Fallback CSS | Include for standalone development |
| ✅ Shadow DOM | Shell injects variables automatically |
| ✅ Instant Updates | Theme changes reflect immediately |

