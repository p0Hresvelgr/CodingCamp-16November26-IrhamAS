# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a self-contained single-page productivity dashboard using HTML, CSS, and Vanilla JavaScript. The implementation is organised into 11 task groups progressing from project scaffold through theming, each widget module, integration, and final polish. All groups can be executed sequentially by a single developer; there is no test runner to configure.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5", "6", "7", "8", "9"] },
    { "wave": 6, "tasks": ["10"] },
    { "wave": 7, "tasks": ["11"] }
  ]
}
```

Tasks 5, 6, 7+8, and 9 are independent of each other and can be developed in any order after task 4 is complete.

## Relevant Files

- `index.html` — Page shell, semantic markup, widget containers
- `css/style.css` — Layout grid, CSS custom properties for theming, component styles
- `js/app.js` — All JavaScript logic (all modules in one file)

## Tasks

- [x] 1. Project scaffold

- [x] 1.1 Create `index.html` with the page shell: `<!DOCTYPE html>`, `<html lang="en" data-theme="light">`, `<head>` with charset/viewport/title, `<link>` to `css/style.css`, and `<script defer src="js/app.js">`. Add five empty `<section>` containers with IDs: `greeting`, `timer`, `todos`, `links`, `theme-toggle-container`.
- [x] 1.2 Create `css/style.css` as an empty file with a top comment block listing all sections to be filled: Reset, Custom Properties, Layout, Greeting, Timer, Todos, Links, Theme Toggle, Utility, Dark Mode.
- [x] 1.3 Create `js/app.js` as an empty file with a top comment block listing all modules: Greeting, Timer, Todos, Links, Theme, Init.

- [x] 2. CSS custom properties and reset
  - [x] 2.1 In `css/style.css`, define `:root` with light-mode CSS custom properties: `--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--border`, `--radius`, `--shadow`. Define `[data-theme="dark"]` overrides for all tokens. Apply a minimal CSS reset (`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`).

- [x] 3. Responsive grid layout
  - [x] 3.1 In `css/style.css`, style `body` to use `var(--bg)` background, a system font stack, and a CSS grid with two columns on screens ≥ 900 px wide. Below 900 px collapse to one column. Set a max-width of 1200 px centred with auto margins and 1 rem padding.
  - [x] 3.2 Style the base `.widget` class: `background: var(--surface)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`, 1.5 rem padding.

- [x] 4. Theme module
  - [x] 4.1 In `js/app.js`, implement `getTheme()`: read `localStorage.getItem('theme')`; if `'light'` or `'dark'`, return it; otherwise return `'dark'` if `window.matchMedia('(prefers-color-scheme: dark)').matches`, else `'light'`.
  - [x] 4.2 Implement `applyTheme(theme)`: set `document.documentElement.dataset.theme = theme` and call `localStorage.setItem('theme', theme)`. Update the toggle button icon (☀️ for dark, 🌙 for light).
  - [x] 4.3 Implement `toggleTheme()`: call `applyTheme(getTheme() === 'dark' ? 'light' : 'dark')`.
  - [x] 4.4 In `index.html`, add the theme toggle `<button id="theme-btn">` inside `<header>`. In `css/style.css`, style the header with flex layout (title left, button right) and add a 300 ms transition on the icon.

- [x] 5. Greeting widget
  - [x] 5.1 In `index.html`, inside `#greeting`, add: an `<h2 id="greeting-text">`, a `<p id="datetime">`, and a hidden `<input id="name-input">` for inline editing.
  - [x] 5.2 In `js/app.js`, implement `getUserName()`: return `localStorage.getItem('userName') || 'Friend'`. Implement `setUserName(name)`: trim, save to `localStorage`, call `renderGreeting()`.
  - [x] 5.3 Implement `getGreeting(hour)`: return `'Good morning'` for 5–11, `'Good afternoon'` for 12–17, `'Good evening'` for 18–21, `'Good night'` otherwise.
  - [x] 5.4 Implement `renderGreeting()`: compute greeting from `new Date()`, write to `#greeting-text` and `#datetime` using `textContent`.
  - [x] 5.5 Implement `startGreetingClock()`: call `renderGreeting()` immediately, then `setInterval(renderGreeting, 1000)`. Store the handle in a module-level variable.
  - [x] 5.6 Attach a click listener on `#greeting-text` to swap it for `#name-input`, populate the input with the current name, focus it. On `blur` or `keydown Enter` call `setUserName(input.value)` and swap back to `<h2>`.
  - [x] 5.7 In `css/style.css`, style `#greeting-text` with large font, and `#datetime` in a smaller muted colour.

- [x] 6. Focus timer — display and FSM
  - [x] 6.1 In `index.html`, inside `#timer`, add: an `<svg>` progress ring (circle with `stroke-dasharray` and `stroke-dashoffset`), a `<span id="timer-display">25:00</span>`, and three buttons: `#timer-start`, `#timer-stop`, `#timer-reset`.
  - [x] 6.2 In `js/app.js`, declare `timerState` object with fields: `status: 'idle'`, `remaining: 1500`, `duration: 1500`, `intervalId: null`.
  - [x] 6.3 Implement `formatTime(seconds)`: return `String(Math.floor(seconds/60)).padStart(2,'0') + ':' + String(seconds%60).padStart(2,'0')`.
  - [x] 6.4 Implement `updateTimerDisplay()`: write `formatTime(timerState.remaining)` to `#timer-display`; compute `stroke-dashoffset` as `circumference * (1 - timerState.remaining / timerState.duration)` and update the SVG circle.
  - [x] 6.5 Implement the full `timerDispatch(action)` FSM as specified in the design: idle+START → running, running+STOP → paused, running+RESET → idle, paused+START → running, paused+RESET → idle, done+RESET → idle. Call `updateTimerDisplay()` after each transition.
  - [x] 6.6 Implement `timerTick()`: decrement `timerState.remaining`, call `updateTimerDisplay()`, check if ≤ 0 — if so clear interval, set `status = 'done'`, call `notifySessionComplete()`.
  - [x] 6.7 Implement `notifySessionComplete()`: if `Notification.permission === 'granted'` dispatch `new Notification('Session complete!')`, else flash the timer widget border with a CSS class `flash` for 1 s.
  - [x] 6.8 Attach click listeners on the three timer buttons to call `timerDispatch('START')`, `timerDispatch('STOP')`, `timerDispatch('RESET')`. On first Start, request notification permission via `Notification.requestPermission()` if `Notification.permission === 'default'`.
  - [x] 6.9 In `css/style.css`, style the SVG ring, timer display (monospace font, large size), and button states (disabled look when action is unavailable).

- [x] 7. To-do list — core CRUD
  - [x] 7.1 In `index.html`, inside `#todos`, add: an `<input id="todo-input">` with placeholder "Add a task…", an `<button id="todo-add">Add</button>`, a `<span id="todo-count">`, a `<select id="todo-sort">` with options Default/A–Z/Done last, and a `<ul id="todo-list">`.
  - [x] 7.2 In `js/app.js`, declare module-level `let tasks = []`.
  - [x] 7.3 Implement `loadTasks()`: parse `localStorage.getItem('todos')`; return parsed array if valid, else `[]` (catch JSON.parse errors, log a console warning).
  - [x] 7.4 Implement `persistTasks()`: call `localStorage.setItem('todos', JSON.stringify(tasks))` inside a try/catch; on `QuotaExceededError` show a toast "Could not save — storage unavailable."
  - [x] 7.5 Implement `addTask(text)`: trim text; validate (non-empty, ≤ 200 chars) — show inline error on failure; create a `Task` object with `crypto.randomUUID()`, push to `tasks`, call `persistTasks()`, call `renderTasks()`, clear the input.
  - [x] 7.6 Implement `deleteTask(id)`: filter `tasks` to exclude the matching id, call `persistTasks()`, call `renderTasks()`.
  - [x] 7.7 Implement `toggleTask(id)`: find the task, flip `done`, set `doneAt` accordingly, call `persistTasks()`, call `renderTasks()`.
  - [x] 7.8 Implement `editTask(id, newText)`: trim and validate `newText`; if valid, update `task.text`, call `persistTasks()`, call `renderTasks()`.

- [x] 8. To-do list — render and sort
  - [x] 8.1 Implement `sortTasks(strategy)`: sort `tasks` in-place by `text.localeCompare` for `'alpha'`, by `Number(done)` for `'done-last'`, by `createdAt` for `'default'`. Call `renderTasks()`.
  - [x] 8.2 Implement `renderTasks()`: clear `#todo-list`; for each task build a `<li>` with: a checkbox `<input type="checkbox">`, a `<span class="task-text">` (textContent = task.text), a delete `<button>`. Set `data-id` on the `<li>`. Add class `done` to `<li>` if `task.done`. Update `#todo-count` with pending count.
  - [x] 8.3 Use event delegation on `#todo-list`: on checkbox change call `toggleTask(id)`, on delete button click call `deleteTask(id)`, on `dblclick` of `.task-text` make it `contenteditable`, on `blur`/Enter call `editTask(id, newText)` and remove `contenteditable`.
  - [x] 8.4 Attach listener on `#todo-add` click and `#todo-input` keydown Enter to call `addTask(input.value)`. Attach listener on `#todo-sort` change to call `sortTasks(select.value)`.
  - [ ] 8.5 In `css/style.css`, style task list items: flex row, checkbox left, text centre, delete button right. Apply strikethrough + muted opacity for `.done`. Add hover states and transition.

- [ ] 9. Quick links widget
  - [~] 9.1 In `index.html`, inside `#links`, add: an `<input id="link-label">` placeholder "Label", an `<input id="link-url">` placeholder "https://…", an `<button id="link-add">Add</button>`, and a `<div id="link-list">`.
  - [~] 9.2 In `js/app.js`, declare module-level `let links = []`.
  - [~] 9.3 Implement `loadLinks()` and `persistLinks()` mirroring the task equivalents (key `'links'`).
  - [~] 9.4 Implement `validateURL(raw)`: try `new URL(raw.includes('://') ? raw : 'https://' + raw)`; on throw return `{ valid: false, normalised: null }`; check protocol is `'http:'` or `'https:'`; return `{ valid: true, normalised: parsed.href }`.
  - [~] 9.5 Implement `addLink(label, url)`: trim and validate label (non-empty, ≤ 50 chars) and url (`validateURL`); show inline errors on failure; create a `Link` object, push to `links`, call `persistLinks()`, call `renderLinks()`.
  - [~] 9.6 Implement `deleteLink(id)`: filter `links`, call `persistLinks()`, call `renderLinks()`.
  - [~] 9.7 Implement `renderLinks()`: clear `#link-list`; for each link render a `<button class="link-btn">` (textContent = label, `data-url` = url, `data-id` = id) and a delete `<button class="link-del">`.
  - [~] 9.8 Use event delegation on `#link-list`: on `.link-btn` click call `window.open(btn.dataset.url, '_blank')`; on `.link-del` click call `deleteLink(id)`. Attach listener on `#link-add` click to call `addLink(labelInput.value, urlInput.value)` and clear inputs.
  - [~] 9.9 In `css/style.css`, style link buttons as pill-shaped with accent background, and arrange them in a flex-wrap row.

- [ ] 10. Initialisation and integration
  - [~] 10.1 In `js/app.js`, implement `initApp()`: call `applyTheme(getTheme())`, `tasks = loadTasks()`, `renderTasks()`, `links = loadLinks()`, `renderLinks()`, `startGreetingClock()`, `updateTimerDisplay()`.
  - [~] 10.2 Register `initApp` on `document.addEventListener('DOMContentLoaded', initApp)`.
  - [~] 10.3 Verify that `applyTheme` is called before any rendering call so the correct CSS tokens are active from the first paint.

- [ ] 11. Cross-cutting polish
  - [~] 11.1 Add a `showToast(message)` utility: inject a `<div class="toast">` into the DOM, animate it in (slide up), auto-remove after 3 s.
  - [~] 11.2 Add an `showInlineError(inputEl, message)` utility: set a sibling `<span class="error-msg">` textContent, add class `invalid` to the input; clear on next valid input event.
  - [~] 11.3 In `css/style.css`, style `.toast` (bottom-centre fixed, slide-up animation) and `.invalid` / `.error-msg` (red border, red small text).
  - [~] 11.4 Ensure all user-generated text is inserted via `textContent` (never `innerHTML`). Audit the codebase once all features are wired up.
  - [~] 11.5 Manual smoke test: load in Chrome and Firefox; verify all five widgets render; add/toggle/delete a task; add/open/delete a link; run timer to completion; switch theme; reload and confirm all data persists.

## Notes

- No external libraries, build tools, or test runners are needed. The page opens directly from the filesystem.
- `crypto.randomUUID()` is available in all target browsers (Chrome 92+, Firefox 90+, Safari 15.4+, Edge 92+). No polyfill required.
- The timer interval is intentionally 1 second rather than sub-second; `setInterval` drift over 25 minutes is negligible for a Pomodoro use case.
- All `localStorage` calls are wrapped in try/catch to handle Private Browsing mode (Safari) and storage-quota errors gracefully.
- Inline editing via `contenteditable` requires explicitly removing the attribute after the edit is confirmed to prevent accidental re-edits.
