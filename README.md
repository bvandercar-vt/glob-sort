# glob-sort

A flexible file globbing utility that sorts results by numeric prefixes and custom ordering keywords/rules. While it can be used for any file organization needs, it is particularly useful for ordering test specs (i.e. passing sorted spec files to Cypress configuration to control test execution order).

If no rules are matched, sorts alphabetically (normal file system order).

## Features

- **Numeric prefix sorting**: Automatically sorts folders and files with numeric prefixes (e.g., `01-`, `02-`)
- **Custom sort order**: Define your own ordering rules using strings or regex patterns
- **Alphabetical fallback**: Falls back to alphabetical sorting when no other rules apply
- **Path-aware**: Sorts intelligently at each folder level in the path hierarchy
- **TypeScript support**: Fully typed with TypeScript

## Installation

```bash
npm install glob-sort
```

**Note**: Requires Node.js 22+ (uses native `fs.promises.glob`)

## Usage

```ts
import { sortedGlob } from 'glob-sort'

const specs = await sortedGlob('cypress/tests/**/*.spec*', {
  sortOrder: [
    // run in this order (anything not matching will come after, alphabetically)
    'setup',
    /new(?!-special)/i, // i.e. "new.spec" before "new-special.spec"
    'new',
    'edit',
    /^delete.*/i,        // starts with
    /^(?!.*history)/i,   // does not contain (place these last, in each folder)
    'view',
  ],
})
```

### Usage in Cypress config

```ts
import { defineConfig } from 'cypress'
import { sortedGlob } from 'glob-sort'

export default defineConfig({
  e2e: {
    specPattern: await sortedGlob('cypress/tests/**/*.spec*', {
        sortOrder: ['setup', 'new', 'edit', /^delete.*/, 'view'],
      })
    ...
  },
})
```

## How it works

The sorting algorithm applies three levels of ordering at each folder depth:

1. **Numeric prefix priority**: Folders/files starting with numbers (e.g., `01-`, `02-`) are sorted numerically
2. **Custom sort order**: Matches against your `sortOrder` array (strings use case-insensitive inclusion, regex uses pattern matching)
3. **Alphabetical fallback**: When no other rules apply, sorts alphabetically

### Example

_Function config:_

```ts
const specs = await sortedGlob('cypress/tests/**/*.spec*', {
  sortOrder: [
    'setup',
    'booking',
    'entree',
    'appetizer',
    'user',
    /^(?!.*history)/i,   // does not contain (place these last, in each folder)
    /new(?!-?special)/i, // "new" before "new-special"
    'new',
    'edit',
    'view',
    'print',
  ],
})
```

<table>
<tr>
<th width="50%">Before (File System Order, Alphabetical)</th>
<th width="50%">After (Custom Sort)</th>
</tr>
<tr>
<td>

```
01-widget-cards/
    booking-calendar.spec.ts
    entrees.spec.ts
    setup.spec.ts
    upcoming-bookings.spec.tsx
02-table-pages/
    01-entree-dinner/
        entree-dinner-table.spec.ts
        entree-flavors-table.spec.tsx
    02-booking/
        bookings-history-table.spec.ts
        bookings-table.spec.tsx
    customers-table.spec.ts
    entree-lunch-table.spec.ts
    users-table.spec.ts
03-view-pages/
    print-booking.spec.ts
    print-entree-dinner.spec.ts
    setup.spec.ts
    view-appetizer-count.spec.ts
    view-appetizer-supplier.spec.ts
    view-booking.spec.ts
    view-entree-dinner.spec.ts
    view-entree-lunch.spec.ts
    view-user.spec.ts
04-forms/
    booking-form/
        clone-booking.spec.ts
        edit-booking.spec.ts
        new-booking.spec.ts
        new-special-booking.spec.ts
        setup.spec.ts
    entree-dinner/
        edit-entree-dinner.spec.ts
        new-entree-dinner.spec.ts
    entree-lunch/
        edit-entree-lunch.spec.ts
        new-entree-lunch.spec.ts
    user/
        edit-user.spec.ts
    cake-frosting-input.spec.ts
    cake-order-input.spec.ts
misc-components/
    booking-status.spec.ts
    layout.spec.ts
    site-info-button.spec.ts
    user-info-button.spec.ts
```

</td>
<td>

```diff
01-widget-cards/
+-  setup.spec.tsx
+-  booking-calendar.spec.ts
+-  upcoming-bookings.spec.tsx
+-  entrees.spec.ts
02-table-pages/
    01-entree-dinner/
        entree-dinner-table.spec.ts
        entree-flavors-table.spec.tsx
    02-booking/
+-      bookings-table.spec.tsx
+-      bookings-history-table.spec.ts
+-  entree-lunch-table.spec.ts
+-  users-table.spec.ts
+-  customers-table.spec.ts
03-view-pages/
+-  setup.spec.tsx
+-  view-booking.spec.ts
+-  print-booking.spec.ts
+-  view-entree-dinner.spec.ts
+-  view-entree-lunch.spec.ts
+-  print-entree-dinner.spec.ts
+-  view-appetizer-count.spec.ts
+-  view-appetizer-supplier.spec.ts
    view-user.spec.ts
04-forms/
    booking-form/
+-      setup.spec.tsx
+-      new-booking.spec.ts
+-      new-special-booking.spec.ts
+-      edit-booking.spec.ts
+-      clone-booking.spec.ts
    entree-dinner/
+-      new-entree-dinner.spec.ts
+-      edit-entree-dinner.spec.ts
    entree-lunch/
+-      new-entree-lunch.spec.ts
+-      edit-entree-lunch.spec.ts
    user/
        edit-user.spec.ts
    cake-frosting-input.spec.ts
    cake-order-input.spec.ts
misc-components/
    booking-status.spec.ts
+-  user-info-button.spec.ts
+-  layout.spec.ts
+-  site-info-button.spec.ts
```

</td>
</tr><tr>
<th colspan="2">Actual output of the function<br/><i>Can be passed directly to Cypress specPattern config, or other test environment config</i></th>
</tr>
<tr>
<td colspan="2">

```
01-widget-cards/setup.spec.ts
01-widget-cards/booking-calendar.spec.ts
01-widget-cards/upcoming-bookings.spec.tsx
01-widget-cards/entrees.spec.ts
02-table-pages/01-entree-dinner/entree-dinner-table.spec.ts
02-table-pages/01-entree-dinner/entree-flavors-table.spec.tsx
02-table-pages/02-booking/bookings-table.spec.tsx
02-table-pages/02-booking/bookings-history-table.spec.ts
02-table-pages/entree-lunch-table.spec.ts
02-table-pages/users-table.spec.ts
02-table-pages/customers-table.spec.ts
03-view-pages/setup.spec.ts
03-view-pages/view-booking.spec.ts
03-view-pages/print-booking.spec.ts
03-view-pages/view-entree-dinner.spec.ts
03-view-pages/view-entree-lunch.spec.ts
03-view-pages/print-entree-dinner.spec.ts
03-view-pages/view-appetizer-count.spec.ts
03-view-pages/view-appetizer-supplier.spec.ts
03-view-pages/view-user.spec.ts
04-forms/booking-form/setup.spec.ts
04-forms/booking-form/new-booking.spec.ts
04-forms/booking-form/new-special-booking.spec.ts
04-forms/booking-form/edit-booking.spec.ts
04-forms/booking-form/clone-booking.spec.ts
04-forms/entree-dinner/new-entree-dinner.spec.ts
04-forms/entree-dinner/edit-entree-dinner.spec.ts
04-forms/entree-lunch/new-entree-lunch.spec.ts
04-forms/entree-lunch/edit-entree-lunch.spec.ts
04-forms/user/edit-user.spec.ts
04-forms/cake-frosting-input.spec.ts
04-forms/cake-order-input.spec.ts
misc-components/booking-status.spec.ts
misc-components/user-info-button.spec.ts
misc-components/layout.spec.ts
misc-components/site-info-button.spec.ts
```

</td>
</tr>
</table>

## API

### `sortedGlob(pattern, options?)`

Returns a Promise that resolves to an array of sorted file paths.

#### Parameters

- **`pattern`** (string): Glob pattern to match files (e.g., `'cypress/tests**/*.spec.ts*'`)
- **`options`** (object, optional): Extends all [Node.js glob options](https://nodejs.org/api/fs.html#fspromisesglobpattern-options) with:
  - **`sortOrder`** (Array<string | RegExp>, optional): Custom ordering rules. Strings match case-insensitively via inclusion; RegExp patterns test against path segments.

#### Returns

`Promise<string[]>`: Array of sorted file paths

## License

MIT
