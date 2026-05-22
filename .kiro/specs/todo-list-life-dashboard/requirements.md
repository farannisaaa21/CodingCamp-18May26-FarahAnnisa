# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side web application that serves as a personal productivity hub. It combines a real-time greeting with the current date and time, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel — all in a single, minimal HTML/CSS/Vanilla JavaScript page. All data is stored in the browser's Local Storage, requiring no backend server or build tooling. The app can be used as a standalone web page or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Panel**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The countdown timer component that implements a 25-minute work session.
- **Todo_List**: The UI component that manages the collection of user tasks.
- **Task**: A single to-do item that has a text description and a completion state.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-access entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Storage_Manager**: The JavaScript module responsible for reading and writing data to Local Storage.
- **UI_Controller**: The JavaScript module responsible for rendering and updating the DOM.

---

## Requirements

### Requirement 1: Project Structure and Technology Stack

**User Story:** As a developer, I want the project to follow a strict single-file-per-folder structure using only HTML, CSS, and Vanilla JavaScript, so that the codebase stays clean, portable, and free of build tooling.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using exactly one HTML file, one CSS file located inside a `css/` folder, and one JavaScript file located inside a `js/` folder.
2. THE Dashboard SHALL use only Vanilla JavaScript with no external frameworks, libraries, or package managers.
3. THE Dashboard SHALL require no backend server to function.
4. THE Dashboard SHALL function correctly as a standalone web page opened directly in a browser.
5. WHERE the app is packaged as a browser extension, THE Dashboard SHALL function correctly without modification to its core HTML, CSS, or JavaScript files.
6. THE Dashboard SHALL be compatible with the current stable versions of Chrome, Firefox, Edge, and Safari.

---

### Requirement 2: Greeting Panel

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I feel welcomed and immediately oriented to the current moment.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current time in HH:MM:SS format, updated every second.
2. THE Greeting_Panel SHALL display the current full date, including the day of the week, day number, month name, and year (e.g., "Monday, 26 May 2025").
3. WHEN the current local time is between 05:00 and 11:59, THE Greeting_Panel SHALL display the message "Good Morning".
4. WHEN the current local time is between 12:00 and 17:59, THE Greeting_Panel SHALL display the message "Good Afternoon".
5. WHEN the current local time is between 18:00 and 20:59, THE Greeting_Panel SHALL display the message "Good Evening".
6. WHEN the current local time is between 21:00 and 04:59, THE Greeting_Panel SHALL display the message "Good Night".
7. THE Greeting_Panel SHALL update the displayed time, date, and greeting without requiring a page reload.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display a countdown starting at 25 minutes and 00 seconds (25:00) when the page first loads.
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual or audible signal to notify the user that the session has ended.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format.
8. IF the user activates the start control while the timer is already running, THEN THE Focus_Timer SHALL ignore the duplicate activation and continue the current countdown without resetting.

---

### Requirement 4: To-Do List — Adding and Displaying Tasks

**User Story:** As a user, I want to add tasks to my to-do list and see them displayed, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an input field and a submission control for entering new task text.
2. WHEN the user submits a non-empty task text, THE Todo_List SHALL add the new Task to the list and display it immediately.
3. IF the user attempts to submit an empty or whitespace-only task text, THEN THE Todo_List SHALL not add a Task and SHALL clear or retain the input field without adding a blank entry.
4. THE Todo_List SHALL display all stored Tasks on page load by reading from Local Storage via the Storage_Manager.
5. THE Storage_Manager SHALL save the complete list of Tasks to Local Storage each time a Task is added, edited, marked as done, or deleted.

---

### Requirement 5: To-Do List — Editing Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions without deleting and re-adding them.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an edit control for each displayed Task.
2. WHEN the user activates the edit control for a Task, THE UI_Controller SHALL replace the Task's display text with an editable input field pre-filled with the current task text.
3. WHEN the user confirms the edit, THE Todo_List SHALL update the Task's text to the new value and return to the display state.
4. IF the user confirms an edit with empty or whitespace-only text, THEN THE Todo_List SHALL not save the change and SHALL retain the original task text.
5. WHEN a Task's text is updated, THE Storage_Manager SHALL persist the updated Task list to Local Storage.

---

### Requirement 6: To-Do List — Completing and Deleting Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and clean task list.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle control (e.g., a checkbox) for each displayed Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE UI_Controller SHALL visually distinguish the Task as completed (e.g., strikethrough text or muted color).
3. WHEN the user activates the completion toggle for a completed Task, THE UI_Controller SHALL restore the Task to the incomplete visual state.
4. WHEN a Task's completion state changes, THE Storage_Manager SHALL persist the updated Task list to Local Storage.
5. THE Todo_List SHALL provide a delete control for each displayed Task.
6. WHEN the user activates the delete control for a Task, THE Todo_List SHALL remove the Task from the list and update the display immediately.
7. WHEN a Task is deleted, THE Storage_Manager SHALL persist the updated Task list to Local Storage.

---

### Requirement 7: Quick Links — Adding and Displaying Links

**User Story:** As a user, I want to add shortcut buttons for my favorite websites, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links component SHALL provide input fields for a link label and a URL, and a submission control for adding a new Link.
2. WHEN the user submits a non-empty label and a non-empty URL, THE Quick_Links component SHALL add the new Link and display it as a clickable button immediately.
3. IF the user attempts to submit a Link with an empty label or an empty URL, THEN THE Quick_Links component SHALL not add the Link.
4. WHEN a Link button is activated, THE Dashboard SHALL open the associated URL in a new browser tab.
5. THE Quick_Links component SHALL display all stored Links on page load by reading from Local Storage via the Storage_Manager.
6. THE Storage_Manager SHALL save the complete list of Links to Local Storage each time a Link is added or deleted.

---

### Requirement 8: Quick Links — Deleting Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the links panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links component SHALL provide a delete control for each displayed Link.
2. WHEN the user activates the delete control for a Link, THE Quick_Links component SHALL remove the Link from the panel and update the display immediately.
3. WHEN a Link is deleted, THE Storage_Manager SHALL persist the updated Link list to Local Storage.

---

### Requirement 9: Data Persistence and Storage

**User Story:** As a user, I want my tasks and quick links to be saved automatically so that my data is still there when I reopen the dashboard.

#### Acceptance Criteria

1. THE Storage_Manager SHALL use the browser's `localStorage` API as the sole persistence mechanism.
2. THE Storage_Manager SHALL serialize Task and Link data as JSON strings before writing to Local Storage.
3. THE Storage_Manager SHALL deserialize JSON strings from Local Storage into Task and Link objects when the Dashboard loads.
4. IF Local Storage data for Tasks or Links is missing or malformed, THEN THE Storage_Manager SHALL initialize the respective collection as an empty array and SHALL not throw an unhandled error.
5. THE Dashboard SHALL store all user data client-side only, with no data transmitted to any external server.

---

### Requirement 10: Visual Design and Performance

**User Story:** As a user, I want the dashboard to load quickly and have a clean, readable interface, so that it is pleasant and efficient to use every day.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a consistent visual hierarchy using a single CSS file, with clear typographic distinction between headings, labels, and body text.
2. THE Dashboard SHALL render all UI components and load all stored data within 2 seconds on a modern desktop browser with no network requests required after initial page load.
3. THE UI_Controller SHALL reflect any user interaction (add, edit, complete, delete, timer tick) in the DOM within 100 milliseconds of the triggering event.
4. THE Dashboard SHALL use a color scheme and font sizes that maintain readable contrast ratios suitable for everyday use.
5. THE Dashboard SHALL present a layout that is visually organized, with each major component (Greeting_Panel, Focus_Timer, Todo_List, Quick_Links) clearly separated and identifiable.
