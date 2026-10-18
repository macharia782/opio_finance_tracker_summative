# Opio Finance Tracker
A responsive and accessible application to help students track their daily expenses, monitor budget allocations, and perform live transaction analysis using regular expressions.

## Project Links
- **GitHub Pages Live App**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
- **Wireframe Design Assets (Google Drive)**: `https://drive.google.com/file/d/1yh6BJuxJ2skHHgGI5suQrBxHHFJwvNH4/view?usp=sharing`
- **Unlisted Demo Video**: `https://drive.google.com/file/d/1yh6BJuxJ2skHHgGI5suQrBxHHFJwvNH4/view?usp=sharing`

---

## 1. Selected Theme
- **Theme**: Student Finance Tracker
- **Target Use Case**: Campus expense logging, category breakdown, budget warning targets, and multi-currency updates (RWF, KES, UGX).

---

## 2. JSON Data Model
Each transaction record processed within the application enforces the following JSON structure:

```json
{
  "id": "rec_0001",
  "description": "Lunch at main cafeteria",
  "amount": 2500.00,
  "category": "Food",
  "date": "2025-09-25",
  "createdAt": "2025-09-25T12:30:00.000Z",
  "updatedAt": "2025-09-25T12:30:00.000Z"
}
```

### Storage Configuration Schema:
```json
{
  "records": [],
  "budgetCap": 300000,
  "rates": {
    "KES": 0.11,
    "UGX": 2.85
  }
}
```

---

## 3. Accessibility (a11y) Strategy
- **Landmark Elements**: Built entirely using standard HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<footer>`).
- **Skip Link Navigation**: Includes a high-contrast `.skip-link` at the top of the body to bypass top navigation.
- **Form Association**: Every `<input>` and `<select>` is bound directly to a `<label>` using matching `for`/`id` pairs.
- **Screen Reader Announcements**: Uses dedicated hidden status containers with `role="status"` (`aria-live="polite"`) and `role="alert"` (`aria-live="assertive"`) to announce errors, dynamic searches, and budget overages.
- **Keyboard Usability**: High-visibility focus indicators (`*:focus-visible`) are enforced across interactive controls.

---

## 4. Planned Regex Validation Rules & Catalog
1. **Description Field (No Pad / Single Space)**: `/^\S(?:.*\S)?$/`
   - *Valid*: `"Cafeteria Lunch"` | *Invalid*: `" Lunch "`
2. **Numeric Amount Field (Positive Cash Format)**: `/^(0|[1-9]\d*)(\.\d{1,2})?$/`
   - *Valid*: `"12.50"`, `"2500"` | *Invalid*: `"-5.00"`, `"12.500"`
3. **Calendar Date Field (YYYY-MM-DD)**: `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`
   - *Valid*: `"2025-09-29"` | *Invalid*: `"2025/09/29"`, `"2025-02-31"`
4. **Category Name Field (Letters/Spaces/Hyphens)**: `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`
   - *Valid*: `"Food"`, `"Tuition-Fees"` | *Invalid*: `"Fees123"`
5. **Advanced Rule - Duplicate Word Prevention**: `/\b(\w+)\s+\1\b/`
   - *Valid*: `"Chemistry Books"` | *Invalid*: `"Books Books"`

---

## 5. Keyboard Map
| Key / Combination | Target Action |
| :--- | :--- |
| `Tab` | Shift focus sequentially across all interactive controls |
| `Shift + Tab` | Move focus backwards to previous UI element |
| `Enter` / `Space` | Activate buttons, forms, and custom file triggers |
| `Esc` | Clear inline error hints or active input focus |

---

## 6. How to Run Validation Unit Tests
1. Clone this repository locally.
2. Open `tests.html` directly in any web browser.
3. Review the execution pass/fail logs on the screen, generated via `validators.js`.