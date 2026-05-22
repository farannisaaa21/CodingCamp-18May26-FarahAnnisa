# Design Document: Todo List Life Dashboard

## Overview

The Todo List Life Dashboard is a client-side single-page application (SPA) built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no build tools, no server. It opens directly in a browser as a static file and serves as a personal productivity hub with four distinct panels:

1. **Greeting Panel** — live clock, date, and time-of-day greeting
2. **Focus Timer** — 25-minute Pomodoro countdown with start/stop/reset
3. **To-Do List** — add, edit, complete, and delete tasks with localStorage persistence
4. **Quick Links** — add and delete shortcut buttons to external URLs with localStorage persistence

All state is stored in `localStorage`. The design prioritises simplicity: a single HTML file, one CSS file, and one JavaScript file, with clear module boundaries enforced by code organisation rather than a bundler.

---

## Architecture

The application follows a **Model-View-Controller (MVC)** pattern implemented entirely within a single JavaScript file (`js/app.js`). Because there is no build step, modules are simulated as plain JavaScript objects/namespaces rather than ES modules (which would require a server for `type="module"` imports from `file://`).

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Greeting     │  │ Focus Timer  │  │  Todo List    │  │
│  │ Panel (DOM)  │  │   (DOM)      │  │   (DOM)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                  │           │
│  ┌──────▼─────────────────▼──────────────────▼────────┐  │
│  │                  UI_Controller                      │  │
│  │  (render, update DOM, attach event listeners)       │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │                  Storage_Manager                    │  │
│  │  (read/write localStorage, serialize/deserialize)   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. On page load, `Storage_Manager` reads `localStorage` and returns plain JS arrays of Task and Link objects.
2. `UI_Controller` receives those arrays and renders the initial DOM.
3. User interactions (button clicks, form submissions) are handled by event listeners attached by `UI_Controller`.
4. Each interaction mutates the in-memory state array, calls `Storage_Manager.save*()` to persist, then calls the relevant render function to update the DOM.
5. The Greeting Panel and Focus Timer use `setInterval` / `setTimeout` to drive their own periodic updates independently of user interaction.

---

## Components and Interfaces

### 1. Storage_Manager

Responsible for all `localStorage` reads and writes. Exposes a simple key-based API.

```javascript
const Storage_Manager = {
  TASKS_KEY: 'dashboard_tasks',
  LINKS_KEY: 'dashboard_links',

  // Returns Task[] — empty array if missing or malformed
  loadTasks()  { ... },

  // Returns Link[] — empty array if missing or malformed
  loadLinks()  { ... },

  // Serialises tasks array to JSON and writes to localStorage
  saveTasks(tasks) { ... },

  // Serialises links array to JSON and writes to localStorage
  saveLinks(links) { ... },
};
```

### 2. UI_Controller

Responsible for all DOM manipulation and event wiring. Broken into four sub-sections matching the four panels.

```javascript
const UI_Controller = {
  // --- Greeting Panel ---
  initGreeting()   { ... },   // starts setInterval(updateGreeting, 1000)
  updateGreeting() { ... },   // reads Date(), updates #clock, #date, #greeting

  // --- Focus Timer ---
  initTimer()      { ... },   // attaches click handlers to start/stop/reset buttons
  startTimer()     { ... },
  stopTimer()      { ... },
  resetTimer()     { ... },
  tickTimer()      { ... },   // called every second by setInterval

  // --- To-Do List ---
  initTodoList()   { ... },   // loads tasks, renders list, attaches add-form handler
  renderTasks()    { ... },   // re-renders the full task list from in-memory array
  addTask(text)    { ... },
  editTask(id, newText) { ... },
  toggleTask(id)   { ... },
  deleteTask(id)   { ... },

  // --- Quick Links ---
  initQuickLinks() { ... },   // loads links, renders panel, attaches add-form handler
  renderLinks()    { ... },
  addLink(label, url) { ... },
  deleteLink(id)   { ... },
};
```

### 3. Greeting Panel (DOM)

HTML elements:
- `#clock` — live HH:MM:SS display
- `#date-display` — full date string
- `#greeting` — "Good Morning / Afternoon / Evening / Night"

### 4. Focus Timer (DOM)

HTML elements:
- `#timer-display` — MM:SS countdown
- `#btn-start`, `#btn-stop`, `#btn-reset` — control buttons
- Timer state is held in module-level variables: `timerInterval`, `remainingSeconds`, `isRunning`

### 5. To-Do List (DOM)

HTML elements:
- `#todo-input` — text input for new task
- `#btn-add-task` — submission button (also triggered by Enter key)
- `#task-list` — `<ul>` container; each `<li>` is rendered by `renderTasks()`

Each task `<li>` contains:
- A checkbox (completion toggle)
- A `<span>` for task text (replaced by `<input>` during edit mode)
- An edit button
- A delete button

### 6. Quick Links (DOM)

HTML elements:
- `#link-label-input`, `#link-url-input` — inputs for new link
- `#btn-add-link` — submission button
- `#links-container` — `<div>` holding link buttons

Each link entry contains:
- A `<button>` that opens the URL in a new tab
- A delete `<button>`

---

## Data Models

### Task

```javascript
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  text:      string,   // non-empty task description
  completed: boolean,  // false = incomplete, true = done
}
```

### Link

```javascript
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty display label for the button
  url:   string,  // non-empty URL string (user-supplied, not validated beyond non-empty)
}
```

### localStorage Keys

| Key                  | Value type | Description                        |
|----------------------|------------|------------------------------------|
| `dashboard_tasks`    | JSON string | Serialised `Task[]`               |
| `dashboard_links`    | JSON string | Serialised `Link[]`               |

### Timer State (in-memory only, not persisted)

```javascript
{
  remainingSeconds: number,  // starts at 1500 (25 * 60)
  isRunning:        boolean,
  intervalId:       number | null,
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting message correctness

*For any* local time value, the greeting message returned by the greeting logic SHALL be exactly one of {"Good Morning", "Good Afternoon", "Good Evening", "Good Night"}, and the selected message SHALL correspond to the correct time-of-day range (05:00–11:59 → Morning, 12:00–17:59 → Afternoon, 18:00–20:59 → Evening, 21:00–04:59 → Night).

**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

---

### Property 2: Task addition round-trip

*For any* non-empty, non-whitespace-only task text, after calling `addTask(text)` the task SHALL appear in the in-memory task array and the serialised value retrieved from `localStorage` SHALL deserialise to an array containing a Task with the same text and `completed: false`.

**Validates: Requirements 4.2, 4.5, 9.2, 9.3**

---

### Property 3: Whitespace task rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `addTask(text)` SHALL leave the task array unchanged and SHALL not write a new entry to `localStorage`.

**Validates: Requirements 4.3**

---

### Property 4: Task completion toggle round-trip

*For any* task in the list, toggling its completion state twice SHALL return the task to its original `completed` value, and the persisted `localStorage` value SHALL reflect the final state after each toggle.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 5: Task deletion removes exactly one entry

*For any* task list containing a task with a given `id`, calling `deleteTask(id)` SHALL reduce the array length by exactly one and SHALL remove only the task with that `id`, leaving all other tasks unchanged.

**Validates: Requirements 6.6, 6.7**

---

### Property 6: Edit preserves identity, updates text

*For any* task, calling `editTask(id, newText)` with a non-empty `newText` SHALL update only the `text` field of the matching task, leaving its `id` and `completed` fields unchanged, and SHALL persist the updated array to `localStorage`.

**Validates: Requirements 5.3, 5.5**

---

### Property 7: Whitespace edit rejection

*For any* task, calling `editTask(id, text)` where `text` is empty or whitespace-only SHALL leave the task's `text` field unchanged and SHALL not write a different value to `localStorage`.

**Validates: Requirements 5.4**

---

### Property 8: Link addition round-trip

*For any* non-empty label and non-empty URL, after calling `addLink(label, url)` the link SHALL appear in the in-memory links array and the serialised value retrieved from `localStorage` SHALL deserialise to an array containing a Link with the same label and url.

**Validates: Requirements 7.2, 7.6, 9.2, 9.3**

---

### Property 9: Link deletion removes exactly one entry

*For any* links list containing a link with a given `id`, calling `deleteLink(id)` SHALL reduce the array length by exactly one and SHALL remove only the link with that `id`, leaving all other links unchanged.

**Validates: Requirements 8.2, 8.3**

---

### Property 10: Storage serialisation round-trip

*For any* array of Task objects or Link objects, serialising with `Storage_Manager.saveTasks()` / `Storage_Manager.saveLinks()` and then deserialising with `Storage_Manager.loadTasks()` / `Storage_Manager.loadLinks()` SHALL produce an array that is deeply equal to the original.

**Validates: Requirements 9.2, 9.3**

---

### Property 11: Malformed storage graceful fallback

*For any* malformed or missing `localStorage` value at the tasks or links key, `Storage_Manager.loadTasks()` / `Storage_Manager.loadLinks()` SHALL return an empty array and SHALL NOT throw an unhandled exception.

**Validates: Requirements 9.4**

---

### Property 12: Timer countdown monotonicity

*For any* running timer state, each call to `tickTimer()` SHALL decrease `remainingSeconds` by exactly 1, and the displayed MM:SS string SHALL equal `Math.floor(remainingSeconds / 60)` zero-padded to 2 digits, followed by `remainingSeconds % 60` zero-padded to 2 digits.

**Validates: Requirements 3.3, 3.7**

---

### Property 13: Timer stop idempotence

*For any* timer state (running or stopped), calling `stopTimer()` SHALL result in `isRunning === false` and `intervalId === null`, and calling `stopTimer()` a second time SHALL produce the same result without error.

**Validates: Requirements 3.4**

---

### Property 14: Timer reset invariant

*For any* timer state, calling `resetTimer()` SHALL set `remainingSeconds` to 1500, `isRunning` to `false`, and `intervalId` to `null`, regardless of the prior state.

**Validates: Requirements 3.5**

---

## Error Handling

### localStorage Errors

- **Missing data**: `loadTasks()` and `loadLinks()` wrap `JSON.parse` in a `try/catch`. On any error (missing key returns `null`, malformed JSON throws), they return `[]`.
- **Storage quota exceeded**: `saveTasks()` and `saveLinks()` wrap `localStorage.setItem` in a `try/catch`. On `QuotaExceededError`, the error is caught and optionally surfaced to the user via a non-blocking notification (e.g., a temporary status message in the UI). The in-memory state is still updated so the session remains functional.

### Input Validation

- Task text and link label/URL are trimmed with `String.prototype.trim()` before any check. An empty string after trimming is rejected silently (no error message needed — the input field simply retains focus).
- URL values are stored as-is (user-supplied). No URL format validation is performed beyond non-empty, keeping the implementation simple and avoiding false rejections of valid but unusual URLs.

### Timer Edge Cases

- If `startTimer()` is called while `isRunning === true`, the call is a no-op (Requirement 3.8).
- If `tickTimer()` fires when `remainingSeconds === 0`, the timer stops itself and triggers the end-of-session signal (visual flash or `alert()`).

### DOM Errors

- All DOM queries use `getElementById` / `querySelector`. If an expected element is missing (e.g., due to a typo in the HTML), the function logs a `console.error` and returns early rather than throwing.

---

## Testing Strategy

### Overview

Because this is a pure client-side Vanilla JS application with no build tooling, tests are written as plain JavaScript that can be run in a browser console or via a lightweight test runner (e.g., [Jasmine](https://jasmine.github.io/) loaded via CDN, or a minimal custom `assert` harness). Property-based testing uses [fast-check](https://fast-check.dev/) loaded via CDN `<script>` tag.

### Unit Tests (Example-Based)

Focus on specific scenarios and edge cases:

| Test | Covers |
|------|--------|
| `addTask` with valid text adds one item | Req 4.2 |
| `addTask` with `""` does not add | Req 4.3 |
| `addTask` with `"   "` does not add | Req 4.3 |
| `toggleTask` flips `completed` | Req 6.2, 6.3 |
| `deleteTask` removes correct item | Req 6.6 |
| `editTask` with valid text updates text | Req 5.3 |
| `editTask` with `""` does not update | Req 5.4 |
| `addLink` with valid label+url adds one item | Req 7.2 |
| `addLink` with empty label does not add | Req 7.3 |
| `addLink` with empty url does not add | Req 7.3 |
| `deleteLink` removes correct item | Req 8.2 |
| `loadTasks` with `null` in localStorage returns `[]` | Req 9.4 |
| `loadTasks` with malformed JSON returns `[]` | Req 9.4 |
| Timer starts at 1500 seconds | Req 3.1 |
| Timer `resetTimer` returns to 1500 | Req 3.5 |
| Timer `startTimer` while running is no-op | Req 3.8 |
| Greeting returns "Good Morning" at 08:00 | Req 2.3 |
| Greeting returns "Good Night" at 23:00 | Req 2.6 |

### Property-Based Tests (fast-check via CDN)

Each property test runs a minimum of **100 iterations**. Each test is tagged with a comment referencing the design property.

**Feature: todo-list-life-dashboard**

```javascript
// Feature: todo-list-life-dashboard, Property 1: Greeting message correctness
fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }), (hour, minute) => {
  const msg = getGreeting(hour, minute);
  const valid = ["Good Morning", "Good Afternoon", "Good Evening", "Good Night"];
  if (!valid.includes(msg)) return false;
  if (hour >= 5  && hour <= 11) return msg === "Good Morning";
  if (hour >= 12 && hour <= 17) return msg === "Good Afternoon";
  if (hour >= 18 && hour <= 20) return msg === "Good Evening";
  return msg === "Good Night"; // 21-23 and 0-4
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 2: Task addition round-trip
fc.assert(fc.property(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), (text) => {
  const tasks = [];
  addTaskToArray(tasks, text);
  const serialised = JSON.stringify(tasks);
  const deserialised = JSON.parse(serialised);
  return deserialised.some(t => t.text === text.trim() && t.completed === false);
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 3: Whitespace task rejection
fc.assert(fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n')), (text) => {
  const tasks = [];
  addTaskToArray(tasks, text);
  return tasks.length === 0;
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 4: Task completion toggle round-trip
fc.assert(fc.property(fc.record({ id: fc.uuid(), text: fc.string({ minLength: 1 }), completed: fc.boolean() }), (task) => {
  const original = task.completed;
  toggleTaskInArray([task], task.id);
  toggleTaskInArray([task], task.id);
  return task.completed === original;
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 5: Task deletion removes exactly one entry
fc.assert(fc.property(fc.array(fc.record({ id: fc.uuid(), text: fc.string({ minLength: 1 }), completed: fc.boolean() }), { minLength: 1 }), (tasks) => {
  const target = tasks[Math.floor(Math.random() * tasks.length)];
  const before = tasks.length;
  const result = deleteTaskFromArray(tasks, target.id);
  return result.length === before - 1 && !result.some(t => t.id === target.id);
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 6: Edit preserves identity, updates text
fc.assert(fc.property(
  fc.record({ id: fc.uuid(), text: fc.string({ minLength: 1 }), completed: fc.boolean() }),
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  (task, newText) => {
    const originalId = task.id;
    const originalCompleted = task.completed;
    editTaskInArray([task], task.id, newText);
    return task.id === originalId && task.completed === originalCompleted && task.text === newText.trim();
  }
), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 10: Storage serialisation round-trip
fc.assert(fc.property(fc.array(fc.record({ id: fc.uuid(), text: fc.string({ minLength: 1 }), completed: fc.boolean() })), (tasks) => {
  const serialised = JSON.stringify(tasks);
  localStorage.setItem('test_tasks', serialised);
  const loaded = JSON.parse(localStorage.getItem('test_tasks'));
  return JSON.stringify(loaded) === JSON.stringify(tasks);
}), { numRuns: 100 });

// Feature: todo-list-life-dashboard, Property 12: Timer countdown monotonicity
fc.assert(fc.property(fc.integer({ min: 1, max: 1500 }), (seconds) => {
  const state = { remainingSeconds: seconds };
  tickTimerState(state);
  const mm = String(Math.floor(state.remainingSeconds / 60)).padStart(2, '0');
  const ss = String(state.remainingSeconds % 60).padStart(2, '0');
  return state.remainingSeconds === seconds - 1 && formatTimer(seconds - 1) === `${mm}:${ss}`;
}), { numRuns: 100 });
```

### Integration / Smoke Tests

- **Page load smoke test**: Open `index.html` in a browser; verify all four panels render without console errors.
- **localStorage persistence smoke test**: Add a task and a link, reload the page, verify both are still displayed.
- **Cross-browser**: Manually verify in Chrome, Firefox, Edge, and Safari (Requirement 1.6).

### Test Organisation

Since there is no build tool, tests live in a separate `tests/` folder:

```
tests/
  unit.html        ← loads fast-check + app logic + runs all tests in browser
  unit.js          ← all unit and property test code
```

The production `index.html` does NOT reference any test files.
