You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

---

# Design system — Gyoza Maison

Use these tokens and component specs for every UI piece you build or edit. Never hardcode a raw hex value in a component's styles — always reference the CSS custom property. Add missing tokens to `src/styles/tokens.css` (or equivalent) rather than inventing new one-off colors.

## Design principles

- Deep charcoal background with a single warm coral accent used for primary actions, price, and the active nav state. Sage green is the only secondary accent — reserve it for a second call-to-action variant (e.g. vegetarian items), never mix it with coral on the same control.
- Fully rounded ("pill") shape for every clickable control (buttons, nav underline excluded). Cards use a softer 14px radius, never a pill.
- Generous negative space; avoid borders heavier than 1px or any drop shadow. Depth comes from subtle background/border-color shifts, not shadows.
- Every interactive element needs an explicit hover, active/pressed, focus-visible, and disabled state — see specs below. Do not ship a component without all four.

## Tokens

```css
:root {
  /* Surfaces */
  --bg-0: #0b0b0b; /* page background */
  --bg-1: #141414; /* card / nav surface */
  --border: #2a2a28; /* default hairline */
  --border-strong: #4a4a46; /* hover / emphasis border */

  /* Text */
  --text-primary: #f5f1ea;
  --text-secondary: #9c9a92;
  --text-muted: #6e6c66;
  --text-disabled: #4a4944;

  /* Accent — coral (primary actions, price, active nav, badge) */
  --coral: #e3a090;
  --coral-hover: #eab3a4;
  --coral-active: #c97f6b;
  --coral-on: #4a1f14; /* text/icon color ON coral fills */
  --coral-disabled-bg: #3c3530;
  --coral-disabled-fg: #726a63;

  /* Accent — sage (secondary actions, cool category tags) */
  --sage: #a9ad8c;
  --sage-hover: #bec2a4;
  --sage-active: #8f9374;
  --sage-on: #2a2c1e;
  --sage-disabled-bg: #34362c;
  --sage-disabled-fg: #6b6c60;

  /* Category tags */
  --tag-warm-bg: #d99c90;
  --tag-warm-on: #4a1f1a;
  --tag-stone-bg: #8b8a80;
  --tag-stone-on: #2b2a24;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-pill: 999px;

  /* Spacing (4px base unit) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 64px;

  /* Typography */
  --font-display: 'Poppins', 'Segoe UI', sans-serif;
  --font-body: 'Inter', 'Segoe UI', sans-serif;
}
```

## Typography scale

| Role               | Font             | Weight | Size    | Notes                                               |
| ------------------ | ---------------- | ------ | ------- | --------------------------------------------------- |
| H1 / hero          | `--font-display` | 600    | 44–56px | Coral span for the emphasized line                  |
| H2 / section title | `--font-display` | 600    | 32px    |                                                     |
| Card title         | `--font-body`    | 600    | 18px    |                                                     |
| Body               | `--font-body`    | 400    | 15–16px | `color: var(--text-secondary)` for descriptive copy |
| Nav / caption      | `--font-body`    | 500    | 13–14px |                                                     |
| Price              | `--font-body`    | 600    | 16px    | Always `color: var(--coral)`                        |

Sentence case everywhere in French UI copy (no Title Case, no all-caps except the small stamp badge).

## Components

For every component below, implement `:hover`, `:active`, `:focus-visible`, and a `[disabled]`/`.is-disabled` state — do not rely on browser defaults.

### Button — primary

Pill shape, coral fill, used for the single main CTA per view (e.g. "Commander").

| State         | Spec                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| Default       | `background: var(--coral); color: var(--coral-on);`                                           |
| Hover         | `background: var(--coral-hover);`                                                             |
| Active        | `background: var(--coral-active); transform: scale(0.97);`                                    |
| Focus-visible | `box-shadow: 0 0 0 2px var(--bg-0), 0 0 0 4px var(--coral);` no default outline               |
| Disabled      | `background: var(--coral-disabled-bg); color: var(--coral-disabled-fg); cursor: not-allowed;` |

### Button — secondary

Pill shape, transparent fill, outlined. Use for the alternate action next to a primary button.

| State         | Spec                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Default       | `background: transparent; border: 1px solid var(--border-strong); color: var(--text-primary);` |
| Hover         | `border-color: #6B6B65; background: #1D1D1B;`                                                  |
| Active        | `background: #242422; transform: scale(0.97);`                                                 |
| Focus-visible | `box-shadow: 0 0 0 2px var(--bg-0), 0 0 0 4px #6B6B65;`                                        |
| Disabled      | `color: var(--text-disabled); border-color: var(--border); cursor: not-allowed;`               |

At most one primary button per view — pair with `secondary`, never two primaries side by side.

### Button — icon (circular quick-add)

44px circle (28–34px in dense contexts like a product card footer). Comes in coral and sage variants — never mix both on the same list.

| State         | Spec                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default       | `background: var(--coral)` (or `--sage`); icon color `var(--coral-on)` / `var(--sage-on)`                                                             |
| Hover         | `background: var(--coral-hover)` / `var(--sage-hover)`                                                                                                |
| Active        | `background: var(--coral-active)` / `var(--sage-active)`; `transform: scale(0.92);` — pair with an "added" micro-feedback (e.g. brief checkmark swap) |
| Focus-visible | `box-shadow: 0 0 0 2px var(--bg-0), 0 0 0 4px var(--coral);`                                                                                          |
| Disabled      | Use the matching `*-disabled-bg`/`*-disabled-fg` pair; use for out-of-stock items                                                                     |

### Navigation link

Text link with a coral underline on the active route.

| State                  | Spec                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Default                | `color: var(--text-secondary);`                                                    |
| Hover                  | `color: var(--text-primary);`                                                      |
| Active (current route) | `color: var(--coral); border-bottom: 2px solid var(--coral);`                      |
| Disabled               | `color: var(--text-disabled); cursor: not-allowed;` — for routes not yet available |

### Card — product

Horizontal layout: vertical category tag strip + photo/name/description/price/add-button body. Border radius `--radius-md`, `1px solid var(--border)`.

| State                   | Spec                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Default                 | `border-color: var(--border);`                                                                                       |
| Hover                   | `border-color: var(--border-strong); transform: translateY(-2px);` transition both over 150ms                        |
| Out of stock / disabled | `opacity: 0.45;` disable pointer events on the whole card; the embedded add-button also shows its own disabled state |

### Category tag

Vertical strip on product cards, rotated label text. Two color pairs only — do not introduce new tag hues without adding them as tokens first.

- Warm (meat/seafood): `background: var(--tag-warm-bg); color: var(--tag-warm-on);`
- Stone (vegetarian): `background: var(--tag-stone-bg); color: var(--tag-stone-on);`

### Badge (trust stamp)

Scalloped circular badge, coral fill, used once per page as a trust mark over hero imagery — not a reusable list component.

`background: var(--coral); color: var(--coral-on);` — no interactive states (not clickable).

## Accessibility notes specific to this palette

- `--coral` on `--bg-0`/`--bg-1` and `--coral-on` on `--coral` both meet WCAG AA for the text sizes used (verify with any new size/weight combination before shipping).
- Never remove the `:focus-visible` box-shadow ring — it is the only focus indicator in this dark theme, there is no default browser outline visible against `--bg-0`.
- Disabled controls must still be reachable by assistive tech via `aria-disabled` where the interaction is conditionally available (e.g. "notify me" instead of a dead add-button), and must carry a visible `cursor: not-allowed`.
