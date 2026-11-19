# Requirements Document

## Introduction

The To-Do List Life Dashboard is a self-contained, single-page web application delivered as a standalone HTML file. It gives users a personal productivity hub in the browser with zero installation, zero build steps, and zero external network dependencies after the initial load. All five feature areas — greeting, focus timer, to-do list, quick links, and theme — are persisted locally using the browser's LocalStorage API.

## Requirements

### 1. Greeting Widget

#### 1.1 Display current time and date

**User Story**: As a user, I want to see the current time and date so that I always know when I am without switching to another app.

**Acceptance Criteria**:

- The widget displays the current time in HH:MM:SS format, updated every second.
- The widget displays the current date formatted as "Weekday, DD Month YYYY" (e.g. "Wednesday, 19 November 2026").
- The time and date update in real time without requiring a page reload.

#### 1.2 Show time-of-day greeting

**User Story**: As a user, I want a contextual greeting so that the page feels personal and alive.

**Acceptance Criteria**:

- The greeting reads "Good morning" for hours 05–11 (inclusive).
- The greeting reads "Good afternoon" for hours 12–17 (inclusive).
- The greeting reads "Good evening" for hours 18–21 (inclusive).
- The greeting reads "Good night" for all other hours (22–04).
- The greeting updates immediately if the page is left open across a time boundary.

#### 1.3 Custom user name

**User Story**: As a user, I want to set my name so that the greeting addresses me personally.

**Acceptance Criteria**:

- The greeting displays the stored user name (e.g. "Good evening, Irham 👋").
- When no name is stored, the greeting defaults to "Friend".
- The user can click the displayed name to edit it inline.
- The updated name is saved to LocalStorage under key `userName` immediately on confirmation (Enter key or blur).
- The updated name persists after page reload.

### 2. Focus Timer

#### 2.1 25-minute Pomodoro countdown

**User Story**: As a user, I want a 25-minute countdown timer so that I can work in focused Pomodoro sessions.

**Acceptance Criteria**:

- The timer starts at exactly 25:00 (1500 seconds).
- Clicking **Start** begins the countdown; the display updates every second.
- Clicking **Stop** pauses the countdown at the current remaining time.
- Clicking **Start** again after Stop resumes from the paused position.
- Clicking **Reset** at any time returns the display to 25:00 and stops counting.
- The timer display format is MM:SS, zero-padded (e.g. "04:07").

#### 2.2 Session completion notification

**User Story**: As a user, I want to be notified when a session ends so that I know to take a break even if I am focused on another window.

**Acceptance Criteria**:

- When the countdown reaches 00:00, a browser `Notification` is dispatched with the message "Session complete!".
- If the user has not granted notification permission, the application requests permission on the first Start click.
- If permission is denied or unavailable, the timer card border flashes visually instead; no error is logged to the console.

#### 2.3 Progress ring

**User Story**: As a user, I want a visual progress indicator so that I can gauge remaining time at a glance without reading the digits.

**Acceptance Criteria**:

- An SVG progress ring surrounds the timer display.
- The ring depletes proportionally as time passes (full at 25:00, empty at 00:00).
- The ring animates smoothly with no visible jumps.

### 3. To-Do List

#### 3.1 Add tasks

**User Story**: As a user, I want to add tasks to my list so that I can track what needs to be done.

**Acceptance Criteria**:

- An input field and an **Add** button are present.
- Pressing **Enter** in the input field or clicking **Add** creates a new task.
- The task text is trimmed of leading/trailing whitespace before saving.
- An empty input (after trimming) or an input exceeding 200 characters is rejected with an inline validation message; no task is created.
- The input field is cleared after a successful add.
- New tasks appear at the bottom of the list by default.

#### 3.2 Mark tasks as done

**User Story**: As a user, I want to mark tasks as complete so that I can track my progress.

**Acceptance Criteria**:

- Each task has a checkbox or toggle control.
- Clicking the control toggles the task's `done` state.
- Completed tasks receive a visual distinction (strikethrough text and reduced opacity).
- The pending task count badge in the widget header reflects only incomplete tasks.
- Toggling a task updates LocalStorage immediately.

#### 3.3 Edit tasks

**User Story**: As a user, I want to correct or update task text so that my list stays accurate.

**Acceptance Criteria**:

- Double-clicking a task's text activates inline editing (`contenteditable`).
- Pressing **Enter** or clicking outside the task confirms the edit.
- The edited text is validated (non-empty, ≤ 200 chars) before saving; if invalid the edit is discarded silently.
- Confirmed edits are persisted to LocalStorage immediately.

#### 3.4 Delete tasks

**User Story**: As a user, I want to remove tasks I no longer need so that my list stays clean.

**Acceptance Criteria**:

- Each task has a delete button (×).
- Clicking it removes the task immediately from both the UI and LocalStorage.
- No confirmation dialog is required (deletion is instant).

#### 3.5 Sort tasks

**User Story**: As a user, I want to sort my task list so that I can view tasks in a preferred order.

**Acceptance Criteria**:

- A sort control offers three strategies: **Default** (creation order), **A–Z** (alphabetical), **Done last**.
- Selecting a strategy re-orders the visible list immediately.
- Sort order is applied to the in-memory list; the original `createdAt` order is preserved for the Default strategy.

#### 3.6 Persist tasks

**User Story**: As a user, I want my tasks to survive page reloads so that I never lose my list.

**Acceptance Criteria**:

- All tasks are saved to LocalStorage under key `todos` as a JSON array on every change (add, toggle, edit, delete).
- On page load, tasks are read from LocalStorage and rendered before the first paint.
- If LocalStorage is unavailable or the stored JSON is corrupt, the widget renders an empty list and logs a warning; no crash occurs.

### 4. Quick Links

#### 4.1 Add quick links

**User Story**: As a user, I want to save bookmark links so that I can open my favourite sites with one click.

**Acceptance Criteria**:

- An **Add Link** form accepts a label (display name) and a URL.
- Label must be 1–50 characters; URL must be a valid HTTP or HTTPS address.
- If the user omits the scheme (e.g. types `github.com`), the application prepends `https://` automatically.
- Invalid inputs surface inline error messages; no link is created.
- Confirmed links are saved to LocalStorage under key `links` immediately.

#### 4.2 Open quick links

**User Story**: As a user, I want to open a saved link in a new tab so that my dashboard remains open.

**Acceptance Criteria**:

- Each saved link renders as a clickable button showing the label.
- Clicking the button opens the URL in a new browser tab (`window.open(url, '_blank')`).
- Only `http:` and `https:` URLs are opened; any other scheme is blocked silently.

#### 4.3 Delete quick links

**User Story**: As a user, I want to remove links I no longer use so that my panel stays tidy.

**Acceptance Criteria**:

- Each link button has a delete control (×).
- Clicking it removes the link from LocalStorage and the UI immediately.

#### 4.4 Persist quick links

**User Story**: As a user, I want my links to survive page reloads so that I only need to add them once.

**Acceptance Criteria**:

- All links are saved to LocalStorage under key `links` on every change.
- On page load, links are read and rendered before first paint.
- Corrupt or missing data is handled gracefully (empty list, no crash).

### 5. Light/Dark Mode

#### 5.1 Toggle theme

**User Story**: As a user, I want to switch between light and dark mode so that I can match the page to my environment and preference.

**Acceptance Criteria**:

- A toggle button (sun/moon icon) is visible in the page header.
- Clicking it switches the page between light and dark themes.
- The transition is animated (CSS transition ≤ 300 ms) with no flash.

#### 5.2 Persist theme preference

**User Story**: As a user, I want my theme choice to be remembered so that I do not have to re-select it every visit.

**Acceptance Criteria**:

- The active theme is saved to LocalStorage under key `theme`.
- On page load, the stored theme is applied before first paint to prevent a flash of the wrong theme.
- If no theme is stored, the page defaults to the OS preference (`prefers-color-scheme`).

### 6. Layout and Responsiveness

#### 6.1 Responsive grid layout

**User Story**: As a user, I want the dashboard to look good on different screen sizes so that I can use it on any device.

**Acceptance Criteria**:

- All five widgets are laid out in a CSS grid.
- On screens ≥ 900 px wide the grid shows two or more columns.
- On screens < 900 px wide the grid collapses to a single column; all widgets remain fully usable.
- No horizontal scrollbar appears at any viewport width ≥ 320 px.

#### 6.2 File structure

**User Story**: As a developer, I want a clean, predictable file structure so that the project is easy to maintain.

**Acceptance Criteria**:

- The project contains exactly: `index.html`, `css/style.css`, `js/app.js`.
- No external CSS frameworks, JavaScript frameworks, or build tools are referenced.
- The page loads and functions fully from the local filesystem (`file://` protocol) in all supported browsers.

### 7. Performance

#### 7.1 Fast initial load

**User Story**: As a user, I want the page to load instantly so that the dashboard is immediately useful.

**Acceptance Criteria**:

- The page makes zero external network requests at runtime.
- All widgets are interactive within 500 ms of `DOMContentLoaded` on a modern machine.
- No visible layout shift occurs after the initial render.

### 8. Security

#### 8.1 XSS prevention

**User Story**: As a user, I want my data to be safe so that malicious task or link content cannot execute code.

**Acceptance Criteria**:

- All user-supplied strings (task text, link labels) are inserted into the DOM via `textContent` or element dataset attributes, never via `innerHTML`.
- No `eval()` or `Function()` constructor is used anywhere in the codebase.
- Link URLs are validated before any `window.open()` call; `javascript:`, `data:`, and `vbscript:` schemes are silently rejected.

## Glossary

| Term             | Definition                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Pomodoro**     | A 25-minute focused work session followed by a short break, from the Pomodoro Technique.                                 |
| **LocalStorage** | Browser Web Storage API that persists key/value string pairs across sessions with no expiry.                             |
| **Task**         | A to-do item with text, completion state, unique ID, and timestamps.                                                     |
| **Link**         | A user-defined bookmark with a display label and a validated HTTP/HTTPS URL.                                             |
| **FSM**          | Finite State Machine — a model with a fixed set of states and defined transitions between them, used here for the timer. |
| **XSS**          | Cross-Site Scripting — a class of injection attack where malicious scripts are inserted into a trusted page.             |
| **CSP**          | Content Security Policy — a browser security mechanism restricting what resources a page may load or execute.            |
| **data-theme**   | A custom HTML attribute applied to `<html>` to switch CSS custom-property colour tokens between light and dark.          |
