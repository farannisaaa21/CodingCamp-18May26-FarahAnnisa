# Implementation Plan: Todo List Life Dashboard

## Overview

Build a client-side single-page productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The implementation follows an MVC pattern within a single JS file, with no build tools or external frameworks. Tasks are ordered to establish the file structure and data layer first, then build each panel incrementally, and finally wire everything together.

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` with the full page layout: four panel sections (`#greeting-panel`, `#focus-timer`, `#todo-list`, `#quick-links`)
  - Add all required DOM element IDs: `#clock`, `#date-display`, `#greeting`, `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#todo-input`, `#btn-add-task`, `#task-list`, `#link-label-input`, `#link-url-input`, `#btn-add-link`, `#links-container`
  - Create `css/style.css` with a consistent visual hierarchy: typography scale, color scheme with readable contrast, and clear panel separation
  - Create `js/app.js` as an empty file with top-level namespace comments for `Storage_Manager` and `UI_Controller`
  - Link `css/style.css` and `js/app.js` from `index.html`
  - Create `tests/unit.html` and `tests/unit.js` as empty scaffolds
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.4, 10.5_

- [ ] 2. Implement Storage_Manager
  - [ ] 2.1 Implement `Storage_Manager` with `loadTasks`, `loadLinks`, `saveTasks`, `saveLinks`
    - Define `TASKS_KEY = 'dashboard_tasks'` and `LINKS_KEY = 'dashboard_links'`
    - `loadTasks()` and `loadLinks()` wrap `JSON.parse` in `try/catch`; return `[]` on any error (null, malformed JSON)
    - `saveTasks(tasks)` and `saveLinks(links)` wrap `localStorage.setItem` in `try/catch`; catch `QuotaExceededError` and surface a non-blocking status message without throwing
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.2 Write property test for Storage_Manager serialisation round-trip
    - **Property 10: Storage serialisation round-trip**
    - **Validates: Requirements 9.2, 9.3**
    - In `tests/unit.js`, load fast-check via CDN in `tests/unit.html` and assert that `saveTasks` then `loadTasks` produces a deeply equal array for any array of Task objects

  - [ ]* 2.3 Write property test for malformed storage graceful fallback
    - **Property 11: Malformed storage graceful fallback**
    - **Validates: Requirements 9.4**
    - Assert that `loadTasks()` and `loadLinks()` return `[]` and do not throw when localStorage contains `null`, `undefined`, or arbitrary non-JSON strings

- [ ] 3. Implement Greeting Panel
  - [ ] 3.1 Implement `UI_Controller.updateGreeting` and `UI_Controller.initGreeting`
    - Extract a pure `getGreeting(hour, minute)` helper that returns exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, `"Good Night"` based on the time ranges in Requirements 2.3–2.6
    - `updateGreeting()` reads `new Date()`, formats HH:MM:SS for `#clock`, formats the full date string (e.g., "Monday, 26 May 2025") for `#date-display`, and sets `#greeting` via `getGreeting`
    - `initGreeting()` calls `updateGreeting()` immediately, then starts `setInterval(updateGreeting, 1000)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write property test for greeting message correctness
    - **Property 1: Greeting message correctness**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
    - For any `(hour, minute)` pair in valid ranges, assert `getGreeting(hour, minute)` returns the correct message and is always one of the four valid strings

- [x] 4. Implement Focus Timer
  - [x] 4.1 Implement timer state and `tickTimer`, `startTimer`, `stopTimer`, `resetTimer`
    - Declare module-level `remainingSeconds = 1500`, `isRunning = false`, `intervalId = null`
    - Extract a pure `formatTimer(seconds)` helper that returns a zero-padded MM:SS string
    - `tickTimer()`: decrement `remainingSeconds` by 1, update `#timer-display`; if `remainingSeconds === 0`, stop the interval and trigger end-of-session signal (visual flash or `alert`)
    - `startTimer()`: no-op if `isRunning === true`; otherwise set `isRunning = true`, start `setInterval(tickTimer, 1000)`, store in `intervalId`
    - `stopTimer()`: clear `intervalId`, set `isRunning = false`, `intervalId = null`
    - `resetTimer()`: call `stopTimer()`, set `remainingSeconds = 1500`, update `#timer-display`
    - `initTimer()`: set initial display to `25:00`, attach click handlers to `#btn-start`, `#btn-stop`, `#btn-reset`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.2 Write property test for timer countdown monotonicity
    - **Property 12: Timer countdown monotonicity**
    - **Validates: Requirements 3.3, 3.7**
    - For any `remainingSeconds` in `[1, 1500]`, assert that one `tickTimer` call decrements by exactly 1 and `formatTimer` produces the correct MM:SS string

  - [ ]* 4.3 Write property test for timer stop idempotence
    - **Property 13: Timer stop idempotence**
    - **Validates: Requirements 3.4**
    - Assert that calling `stopTimer()` twice in any timer state always results in `isRunning === false` and `intervalId === null` without error

  - [ ]* 4.4 Write property test for timer reset invariant
    - **Property 14: Timer reset invariant**
    - **Validates: Requirements 3.5**
    - For any timer state, assert that `resetTimer()` always sets `remainingSeconds = 1500`, `isRunning = false`, `intervalId = null`

- [ ] 5. Checkpoint — Ensure all tests pass
  - Run `tests/unit.html` in a browser and confirm all Storage_Manager, Greeting, and Timer tests pass. Ask the user if any questions arise before continuing.

- [ ] 6. Implement To-Do List data operations
  - [ ] 6.1 Implement pure array helpers: `addTaskToArray`, `toggleTaskInArray`, `deleteTaskFromArray`, `editTaskInArray`
    - `addTaskToArray(tasks, text)`: trim text; if empty after trim, return unchanged array; otherwise push `{ id: crypto.randomUUID(), text: trimmed, completed: false }`
    - `toggleTaskInArray(tasks, id)`: find task by id, flip `completed`
    - `deleteTaskFromArray(tasks, id)`: return new array excluding the task with matching id
    - `editTaskInArray(tasks, id, newText)`: trim newText; if empty, leave unchanged; otherwise update only `text` field, preserving `id` and `completed`
    - _Requirements: 4.2, 4.3, 5.3, 5.4, 6.2, 6.3, 6.6_

  - [ ]* 6.2 Write property test for task addition round-trip
    - **Property 2: Task addition round-trip**
    - **Validates: Requirements 4.2, 4.5, 9.2, 9.3**
    - For any non-empty, non-whitespace string, assert `addTaskToArray` adds exactly one task with matching trimmed text and `completed: false`, and that serialising/deserialising preserves it

  - [ ]* 6.3 Write property test for whitespace task rejection
    - **Property 3: Whitespace task rejection**
    - **Validates: Requirements 4.3**
    - For any string composed entirely of whitespace characters, assert `addTaskToArray` leaves the array unchanged

  - [ ]* 6.4 Write property test for task completion toggle round-trip
    - **Property 4: Task completion toggle round-trip**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - For any task, assert that toggling twice returns `completed` to its original value

  - [ ]* 6.5 Write property test for task deletion removes exactly one entry
    - **Property 5: Task deletion removes exactly one entry**
    - **Validates: Requirements 6.6, 6.7**
    - For any non-empty task array, assert `deleteTaskFromArray` reduces length by exactly 1 and removes only the targeted task

  - [ ]* 6.6 Write property test for edit preserves identity, updates text
    - **Property 6: Edit preserves identity, updates text**
    - **Validates: Requirements 5.3, 5.5**
    - For any task and non-empty newText, assert `editTaskInArray` updates only `text`, leaving `id` and `completed` unchanged

  - [ ]* 6.7 Write property test for whitespace edit rejection
    - **Property 7: Whitespace edit rejection**
    - **Validates: Requirements 5.4**
    - For any task, assert that calling `editTaskInArray` with empty or whitespace-only text leaves the task's `text` field unchanged

- [x] 7. Implement To-Do List UI
  - [x] 7.1 Implement `UI_Controller.renderTasks` and `UI_Controller.initTodoList`
    - `renderTasks(tasks)`: clear `#task-list`, then for each task render a `<li>` containing a checkbox (checked if `completed`), a `<span>` with task text (strikethrough style if completed), an edit `<button>`, and a delete `<button>`; attach inline event handlers for toggle, edit, and delete
    - Edit mode: clicking edit replaces the `<span>` with a pre-filled `<input>` and a confirm button; on confirm, call `editTaskInArray`, `Storage_Manager.saveTasks`, `renderTasks`
    - `addTask(text)`: call `addTaskToArray`, `Storage_Manager.saveTasks`, `renderTasks`
    - `deleteTask(id)`: call `deleteTaskFromArray`, `Storage_Manager.saveTasks`, `renderTasks`
    - `toggleTask(id)`: call `toggleTaskInArray`, `Storage_Manager.saveTasks`, `renderTasks`
    - `initTodoList()`: load tasks from `Storage_Manager.loadTasks()`, call `renderTasks`, attach submit handler to `#btn-add-task` and Enter key on `#todo-input`; reject empty/whitespace input silently
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.3_

- [ ] 8. Implement Quick Links data operations and UI
  - [x] 8.1 Implement pure array helpers: `addLinkToArray`, `deleteLinkFromArray`
    - `addLinkToArray(links, label, url)`: trim both; if either is empty after trim, return unchanged array; otherwise push `{ id: crypto.randomUUID(), label: trimmed, url: trimmed }`
    - `deleteLinkFromArray(links, id)`: return new array excluding the link with matching id
    - _Requirements: 7.2, 7.3, 8.2_

  - [ ]* 8.2 Write property test for link addition round-trip
    - **Property 8: Link addition round-trip**
    - **Validates: Requirements 7.2, 7.6, 9.2, 9.3**
    - For any non-empty label and non-empty URL, assert `addLinkToArray` adds exactly one link with matching trimmed values

  - [ ]* 8.3 Write property test for link deletion removes exactly one entry
    - **Property 9: Link deletion removes exactly one entry**
    - **Validates: Requirements 8.2, 8.3**
    - For any non-empty links array, assert `deleteLinkFromArray` reduces length by exactly 1 and removes only the targeted link

  - [ ] 8.4 Implement `UI_Controller.renderLinks` and `UI_Controller.initQuickLinks`
    - `renderLinks(links)`: clear `#links-container`, then for each link render a `<button>` that opens `link.url` in a new tab (`window.open(url, '_blank')`), and a delete `<button>`; attach delete handler
    - `addLink(label, url)`: call `addLinkToArray`, `Storage_Manager.saveLinks`, `renderLinks`
    - `deleteLink(id)`: call `deleteLinkFromArray`, `Storage_Manager.saveLinks`, `renderLinks`
    - `initQuickLinks()`: load links from `Storage_Manager.loadLinks()`, call `renderLinks`, attach submit handler to `#btn-add-link`; reject empty label or URL silently
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 10.3_

- [ ] 9. Wire everything together and apply final styling
  - [ ] 9.1 Add `DOMContentLoaded` bootstrap in `js/app.js`
    - Call `UI_Controller.initGreeting()`, `UI_Controller.initTimer()`, `UI_Controller.initTodoList()`, `UI_Controller.initQuickLinks()` inside a single `document.addEventListener('DOMContentLoaded', ...)` handler
    - Verify all four panels initialise without console errors on page load
    - _Requirements: 1.4, 4.4, 7.5_

  - [ ] 9.2 Finalize CSS for layout, visual hierarchy, and performance
    - Apply panel separation, typographic scale, and contrast-compliant color scheme in `css/style.css`
    - Ensure the page renders all components and loads stored data within 2 seconds with no network requests after initial load
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Run `tests/unit.html` in a browser and confirm all unit and property tests pass. Verify the page loads correctly in Chrome, Firefox, Edge, and Safari. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Pure array helpers (tasks 6.1, 8.1) are intentionally separated from UI methods (tasks 7.1, 8.4) to make them independently testable without a DOM
- Property tests use fast-check loaded via CDN `<script>` tag in `tests/unit.html` — no build step required
- The production `index.html` must NOT reference any test files
- All DOM queries should use `getElementById`/`querySelector` with `console.error` + early return on missing elements

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "7.1"] },
    { "id": 5, "tasks": ["8.1", "8.4"] },
    { "id": 6, "tasks": ["8.2", "8.3", "9.1"] },
    { "id": 7, "tasks": ["9.2"] }
  ]
}
```
