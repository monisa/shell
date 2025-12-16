# Icons Documentation

This document describes how icons are managed and accessed in the Octa Shell.

## Overview

Icons are loaded from `theme.json` and exposed as:
1. **CSS Variables** (`--octa-icons-{name}`)
2. **IconService** (for programmatic access)

Icons automatically change when tenant or theme changes.

---

## Icon Definition in theme.json

```json
{
  "icons": {
    "dashboard": {
      "type": "svg",
      "value": "assets/icons/common/dashboard.svg",
      "description": "Dashboard/home overview"
    },
    "settings": {
      "type": "svg", 
      "value": "assets/icons/tenant-specific/settings.svg"
    },
    "customIcon": {
      "type": "data-uri",
      "value": "data:image/svg+xml;base64,..."
    }
  }
}
```

### Asset Types

| Type | Description | Example |
|------|-------------|---------|
| `svg` | SVG file path | `assets/icons/common/edit.svg` |
| `png` | PNG file path | `assets/icons/logo.png` |
| `webp` | WebP file path | `assets/icons/logo.webp` |
| `data-uri` | Inline data URI | `data:image/svg+xml;base64,...` |
| `lottie` | Lottie animation | `assets/animations/loading.json` |

---

## Available Common Icons

The shell provides these common icons (in `assets/icons/common/`):

| Icon Name | CSS Variable | Description |
|-----------|--------------|-------------|
| dashboard | `--octa-icons-dashboard` | Dashboard/overview |
| home | `--octa-icons-home` | Home |
| settings | `--octa-icons-settings` | Settings/config |
| users | `--octa-icons-users` | User management |
| reports | `--octa-icons-reports` | Reports/docs |
| notifications | `--octa-icons-notifications` | Alerts |
| search | `--octa-icons-search` | Search |
| plus | `--octa-icons-plus` | Add/create |
| edit | `--octa-icons-edit` | Edit/modify |
| trash | `--octa-icons-trash` | Delete |
| check | `--octa-icons-check` | Confirm |
| close | `--octa-icons-close` | Close/cancel |
| chevronDown | `--octa-icons-chevron-down` | Expand |
| chevronRight | `--octa-icons-chevron-right` | Navigate |
| menu | `--octa-icons-menu` | Menu/hamburger |

---

## Using Icons in CSS

### Method 1: Background Image

```scss
.icon-dashboard {
  width: 24px;
  height: 24px;
  background-image: var(--octa-icons-dashboard);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
```

### Method 2: CSS Mask (Allows Color Change)

```scss
.icon-settings {
  width: 24px;
  height: 24px;
  background-color: var(--octa-colors-primary);
  -webkit-mask-image: var(--octa-icons-settings);
  mask-image: var(--octa-icons-settings);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
```

### Method 3: Reusable Icon Mixin

```scss
@mixin octa-icon($name, $size: 24px, $color: currentColor) {
  width: $size;
  height: $size;
  display: inline-block;
  background-color: $color;
  -webkit-mask-image: var(--octa-icons-#{$name});
  mask-image: var(--octa-icons-#{$name});
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}

// Usage
.btn-icon {
  @include octa-icon('edit', 20px, var(--octa-colors-primary));
}
```

---

## Using IconService (Angular)

### Inject the Service

```typescript
import { IconService } from '@core/services/icon.service';

@Component({...})
export class MyComponent {
  private iconService = inject(IconService);
}
```

### Get Icon URL

```typescript
const url = this.iconService.getUrl('dashboard');
// Returns: "assets/icons/common/dashboard.svg"
```

### Get CSS Variable Reference

```typescript
const cssVar = this.iconService.getCssVar('dashboard');
// Returns: "var(--octa-icons-dashboard)"
```

### Get Background Image CSS

```typescript
const bgImage = this.iconService.getBackgroundImage('dashboard');
// Returns: url("assets/icons/common/dashboard.svg")
```

### Get Style Object for Template

```typescript
// Component
iconStyle = this.iconService.getStyle('dashboard', { size: '24px' });

// Template
<div [ngStyle]="iconStyle"></div>
```

### Check Icon Availability

```typescript
if (this.iconService.hasIcon('customIcon')) {
  // Icon exists in theme
}
```

### Get All Available Icons

```typescript
readonly availableIcons = this.iconService.availableIcons;
// Signal<string[]> - reactive list of icon names
```

### Preload Icons (Performance)

```typescript
ngOnInit() {
  this.iconService.preloadIcons();
}
```

---

## Using Icons in MFEs

### Step 1: Import Fallback CSS

For local development, import the fallback CSS:

```css
@import 'path/to/mfe-theme-fallback.css';
```

### Step 2: Use CSS Variables

```scss
.my-mfe-button {
  &::before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 8px;
    background-color: currentColor;
    -webkit-mask-image: var(--octa-icons-plus);
    mask-image: var(--octa-icons-plus);
    -webkit-mask-size: contain;
    mask-size: contain;
  }
}
```

### Step 3: Icons Update Automatically

When tenant or theme changes:
1. Shell loads new `theme.json`
2. CSS variables on `:root` are updated
3. `ShadowDomThemeService` injects into Shadow DOM
4. MFE icons update instantly

---

## Tenant-Specific Icons

Tenants can override common icons or add custom ones:

```json
// khidmah.config.json → theme.json
{
  "icons": {
    "dashboard": {
      "type": "svg",
      "value": "assets/icons/khidmah/dashboard-custom.svg"
    },
    "facilities": {
      "type": "svg",
      "value": "assets/icons/khidmah/facilities.svg"
    }
  }
}
```

The shell automatically uses tenant-specific icons when available.

---

## Icon Design Guidelines

### SVG Best Practices

1. **Use `currentColor`** for stroke/fill to allow CSS coloring:
   ```xml
   <svg stroke="currentColor" fill="none">
   ```

2. **Standard viewBox**: Use `0 0 24 24` for consistency

3. **Optimize SVGs**: Remove metadata, use SVGO

4. **Keep paths simple**: Avoid complex filters/gradients

### File Organization

```
src/assets/icons/
├── common/           # Shared icons (all tenants)
│   ├── dashboard.svg
│   ├── settings.svg
│   └── ...
├── khidmah/          # Tenant-specific icons
│   └── facilities.svg
└── expocity/         # Another tenant
    └── attractions.svg
```

---

## API Reference

### IconService Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `hasIcon(name)` | `boolean` | Check if icon exists |
| `getAsset(name)` | `ThemeAsset \| undefined` | Get full asset object |
| `getUrl(name)` | `string \| undefined` | Get file path |
| `getCssVar(name)` | `string` | Get `var(--octa-icons-{name})` |
| `getCssVarName(name)` | `string` | Get `--octa-icons-{name}` |
| `getBackgroundImage(name)` | `string \| undefined` | Get `url("...")` |
| `getStyle(name, options?)` | `Record<string, string>` | Get ngStyle object |
| `getAllCssVariables()` | `string` | All CSS var declarations |
| `createImgElement(name)` | `HTMLImageElement \| null` | Create `<img>` element |
| `preloadIcons()` | `void` | Preload all icons |

### IconService Signals

| Signal | Type | Description |
|--------|------|-------------|
| `icons` | `Signal<Record<string, ThemeAsset>>` | All icons from theme |
| `availableIcons` | `Signal<string[]>` | List of icon names |

---

## Examples

### Button with Icon

```html
<button class="btn btn-primary">
  <span class="btn-icon" style="
    --icon: var(--octa-icons-plus);
    width: 16px;
    height: 16px;
    background-color: currentColor;
    -webkit-mask-image: var(--icon);
    mask-image: var(--icon);
    mask-size: contain;
  "></span>
  Add Item
</button>
```

### Icon Component (Angular)

```typescript
@Component({
  selector: 'octa-icon',
  template: `<span [ngStyle]="style"></span>`,
  styles: [`
    span {
      display: inline-block;
      background-color: currentColor;
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
    }
  `]
})
export class OctaIconComponent {
  @Input() name = '';
  @Input() size = '24px';
  
  private iconService = inject(IconService);
  
  get style() {
    return {
      width: this.size,
      height: this.size,
      '-webkit-mask-image': this.iconService.getCssVar(this.name),
      'mask-image': this.iconService.getCssVar(this.name)
    };
  }
}

// Usage: <octa-icon name="dashboard" size="20px"></octa-icon>
```

---

## Troubleshooting

### Icons Not Showing

1. Check browser DevTools → Elements → Styles
2. Verify `--octa-icons-{name}` CSS variable exists
3. Check console for 404 errors on icon files

### Icons Not Updating on Theme Change

1. Verify `ShadowDomThemeService` is injecting variables
2. Check if MFE is using CSS variables (not hardcoded paths)

### Icon Color Not Changing

1. Use CSS mask method instead of background-image
2. Ensure SVG uses `currentColor` for stroke/fill

