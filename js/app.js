/* ============================================================
   Life Dashboard — app.js
   Architecture: MVC pattern using plain JS namespaces
   (No ES modules — file:// protocol compatibility)

   Features:
     - Greeting Panel with live clock, date, time-of-day greeting
     - Custom user name in greeting (persisted)
     - Light / Dark mode toggle (persisted)
     - Focus Timer (25-min default, configurable 1–180 min, persisted)
     - To-Do List with add / edit / complete / delete
     - Duplicate task prevention (case-insensitive)
     - Task sorting: date-added | alphabetical | completion-status (persisted)
     - Quick Links with add / delete
     - All data persisted in localStorage
   ============================================================ */

/* ------------------------------------------------------------
   Storage_Manager
   Responsible for all localStorage reads and writes.
   ------------------------------------------------------------ */

const Storage_Manager = {
  TASKS_KEY:    'dashboard_tasks',
  LINKS_KEY:    'dashboard_links',
  THEME_KEY:    'dashboard_theme',
  NAME_KEY:     'dashboard_user_name',
  DURATION_KEY: 'dashboard_timer_duration',
  SORT_KEY:     'dashboard_sort_order',

  /** Returns Task[] — empty array if missing or malformed */
  loadTasks: function () {
    try {
      var raw = localStorage.getItem(Storage_Manager.TASKS_KEY);
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  /** Returns Link[] — empty array if missing or malformed */
  loadLinks: function () {
    try {
      var raw = localStorage.getItem(Storage_Manager.LINKS_KEY);
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  /** Returns 'dark' or 'light' — defaults to 'dark' */
  loadTheme: function () {
    var val = localStorage.getItem(Storage_Manager.THEME_KEY);
    return (val === 'light' || val === 'dark') ? val : 'dark';
  },

  /** Returns trimmed user name string, or '' if absent */
  loadUserName: function () {
    var val = localStorage.getItem(Storage_Manager.NAME_KEY);
    return (val && typeof val === 'string') ? val.trim() : '';
  },

  /** Returns timer duration in minutes (integer 1–180), defaults to 25 */
  loadTimerDuration: function () {
    var raw = localStorage.getItem(Storage_Manager.DURATION_KEY);
    var n = parseInt(raw, 10);
    return (Number.isInteger(n) && n >= 1 && n <= 180) ? n : 25;
  },

  /** Returns sort order string, defaults to 'date-added' */
  loadSortOrder: function () {
    var val = localStorage.getItem(Storage_Manager.SORT_KEY);
    var valid = ['date-added', 'alphabetical', 'completion-status'];
    return valid.indexOf(val) !== -1 ? val : 'date-added';
  },

  /** Serialises tasks array to JSON and writes to localStorage */
  saveTasks: function (tasks) {
    try {
      localStorage.setItem(Storage_Manager.TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      Storage_Manager._quotaError();
    }
  },

  /** Serialises links array to JSON and writes to localStorage */
  saveLinks: function (links) {
    try {
      localStorage.setItem(Storage_Manager.LINKS_KEY, JSON.stringify(links));
    } catch (e) {
      Storage_Manager._quotaError();
    }
  },

  saveTheme: function (theme) {
    try { localStorage.setItem(Storage_Manager.THEME_KEY, theme); } catch (e) {}
  },

  saveUserName: function (name) {
    try { localStorage.setItem(Storage_Manager.NAME_KEY, name); } catch (e) {}
  },

  saveTimerDuration: function (minutes) {
    try { localStorage.setItem(Storage_Manager.DURATION_KEY, String(minutes)); } catch (e) {}
  },

  saveSortOrder: function (order) {
    try { localStorage.setItem(Storage_Manager.SORT_KEY, order); } catch (e) {}
  },

  /** Non-blocking quota-exceeded notification */
  _quotaError: function () {
    var existing = document.getElementById('storage-status');
    var msg = existing || document.createElement('div');
    msg.id = 'storage-status';
    msg.textContent = 'Storage full — latest changes may not be saved.';
    msg.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:#e94560;color:#fff;padding:0.5rem 1rem;border-radius:6px;font-size:0.875rem;z-index:9999;';
    if (!existing) document.body.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 4000);
  },
};

/* ------------------------------------------------------------
   Pure helper — getGreeting(hour, minute)
   Returns the correct time-of-day greeting string.
   Exposed for property-based testing.
   ------------------------------------------------------------ */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';
}

/* ------------------------------------------------------------
   Pure array helpers for To-Do List
   ------------------------------------------------------------ */

/**
 * addTaskToArray(tasks, text) — trims text; rejects empty.
 * Adds { id, text, completed: false, createdAt } and returns array.
 */
function addTaskToArray(tasks, text) {
  var trimmed = String(text).trim();
  if (trimmed === '') return tasks;
  tasks.push({
    id:        crypto.randomUUID(),
    text:      trimmed,
    completed: false,
    createdAt: Date.now(),
  });
  return tasks;
}

/**
 * isDuplicateTask(tasks, text, excludeId)
 * Returns true if any task (other than excludeId) has the same
 * normalised text (trimmed + lowercased).
 */
function isDuplicateTask(tasks, text, excludeId) {
  var normalised = String(text).trim().toLowerCase();
  if (normalised === '') return false;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === excludeId) continue;
    if (tasks[i].text.trim().toLowerCase() === normalised) return true;
  }
  return false;
}

function toggleTaskInArray(tasks, id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].completed = !tasks[i].completed;
      break;
    }
  }
  return tasks;
}

function deleteTaskFromArray(tasks, id) {
  return tasks.filter(function (t) { return t.id !== id; });
}

function editTaskInArray(tasks, id, newText) {
  var trimmed = String(newText).trim();
  if (trimmed === '') return tasks;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].text = trimmed;
      break;
    }
  }
  return tasks;
}

/**
 * sortTasks(tasks, order) — returns a sorted COPY, never mutates.
 */
function sortTasks(tasks, order) {
  var copy = tasks.slice();
  if (order === 'alphabetical') {
    copy.sort(function (a, b) {
      return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
    });
  } else if (order === 'completion-status') {
    copy.sort(function (a, b) {
      if (a.completed === b.completed) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      return a.completed ? 1 : -1; // incomplete first
    });
  } else {
    // date-added: oldest first
    copy.sort(function (a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }
  return copy;
}

/* ------------------------------------------------------------
   Pure array helpers for Quick Links
   ------------------------------------------------------------ */

function addLinkToArray(links, label, url) {
  var trimmedLabel = String(label).trim();
  var trimmedUrl   = String(url).trim();
  if (trimmedLabel === '' || trimmedUrl === '') return links;
  links.push({ id: crypto.randomUUID(), label: trimmedLabel, url: trimmedUrl });
  return links;
}

function deleteLinkFromArray(links, id) {
  return links.filter(function (l) { return l.id !== id; });
}

/* ------------------------------------------------------------
   Timer module-level state
   ------------------------------------------------------------ */
var remainingSeconds = 1500;   // default 25 * 60
var isRunning        = false;
var intervalId       = null;

/* ------------------------------------------------------------
   formatTimer(seconds) — pure helper
   ------------------------------------------------------------ */
function formatTimer(seconds) {
  var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  var ss = String(seconds % 60).padStart(2, '0');
  return mm + ':' + ss;
}

/* ------------------------------------------------------------
   Module-level state for tasks, links, sort order
   ------------------------------------------------------------ */
var tasks     = [];
var sortOrder = 'date-added';

/* ------------------------------------------------------------
   UI_Controller
   ------------------------------------------------------------ */

var UI_Controller = {

  /* ----------------------------------------------------------
     Theme
     ---------------------------------------------------------- */

  /** Apply theme to <html> element and update toggle button label */
  applyTheme: function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        btn.textContent = '☀️ Light';
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else {
        btn.textContent = '🌙 Dark';
        btn.setAttribute('aria-label', 'Switch to dark mode');
      }
    }
  },

  initTheme: function () {
    var theme = Storage_Manager.loadTheme();
    UI_Controller.applyTheme(theme);

    var btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = (current === 'dark') ? 'light' : 'dark';
        UI_Controller.applyTheme(next);
        Storage_Manager.saveTheme(next);
      });
    }
  },

  /* ----------------------------------------------------------
     Greeting Panel
     ---------------------------------------------------------- */

  /** Pure helper exposed for testing */
  getGreeting: getGreeting,

  updateGreeting: function () {
    var now  = new Date();
    var h    = now.getHours();
    var m    = now.getMinutes();
    var s    = now.getSeconds();

    // Clock — HH:MM:SS
    var clockEl = document.getElementById('clock');
    if (clockEl) {
      clockEl.textContent =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }

    // Date — e.g. "Monday, 26 May 2025"
    var dateEl = document.getElementById('date-display');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    }

    // Greeting with optional name
    var greetingEl = document.getElementById('greeting');
    if (greetingEl) {
      var base = getGreeting(h);
      var name = Storage_Manager.loadUserName();
      greetingEl.textContent = name ? (base + ', ' + name + '!') : base;
    }
  },

  initGreeting: function () {
    UI_Controller.updateGreeting();
    setInterval(UI_Controller.updateGreeting, 1000);

    // Pre-fill name input if a name is already saved
    var nameInput = document.getElementById('name-input');
    if (nameInput) {
      nameInput.value = Storage_Manager.loadUserName();
    }

    var saveBtn = document.getElementById('btn-save-name');

    function saveName() {
      if (!nameInput) return;
      var val = nameInput.value.trim();
      if (val === '') return; // whitespace-only — ignore silently
      Storage_Manager.saveUserName(val);
      UI_Controller.updateGreeting();
    }

    if (saveBtn) saveBtn.addEventListener('click', saveName);
    if (nameInput) {
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') saveName();
      });
    }
  },

  /* ----------------------------------------------------------
     Focus Timer
     ---------------------------------------------------------- */

  tickTimer: function () {
    remainingSeconds -= 1;
    var display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimer(remainingSeconds);
    if (remainingSeconds === 0) {
      UI_Controller.stopTimer();
      var timerSection = document.getElementById('focus-timer');
      if (timerSection) {
        timerSection.classList.add('timer-flash');
        setTimeout(function () { timerSection.classList.remove('timer-flash'); }, 1500);
      }
      alert('Focus session complete! Great work.');
    }
  },

  startTimer: function () {
    if (isRunning) return;
    isRunning  = true;
    intervalId = setInterval(UI_Controller.tickTimer, 1000);
  },

  stopTimer: function () {
    clearInterval(intervalId);
    isRunning  = false;
    intervalId = null;
  },

  resetTimer: function () {
    UI_Controller.stopTimer();
    var display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimer(remainingSeconds);
  },

  /** Set a new duration (minutes). Rejects if timer is running. */
  setDuration: function (minutes) {
    var errEl = document.getElementById('duration-error');
    function showErr(msg) { if (errEl) { errEl.textContent = msg; } }
    function clearErr()   { if (errEl) { errEl.textContent = ''; } }

    if (isRunning) {
      showErr('Stop or reset the timer before changing the duration.');
      return;
    }
    var n = parseInt(minutes, 10);
    if (!Number.isInteger(n) || n < 1 || n > 180) {
      showErr('Please enter a whole number between 1 and 180.');
      return;
    }
    clearErr();
    remainingSeconds = n * 60;
    Storage_Manager.saveTimerDuration(n);
    var display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimer(remainingSeconds);
  },

  initTimer: function () {
    // Load persisted duration
    var savedMinutes = Storage_Manager.loadTimerDuration();
    remainingSeconds = savedMinutes * 60;

    var display = document.getElementById('timer-display');
    if (display) display.textContent = formatTimer(remainingSeconds);

    var btnStart    = document.getElementById('btn-start');
    var btnStop     = document.getElementById('btn-stop');
    var btnReset    = document.getElementById('btn-reset');
    var btnSetDur   = document.getElementById('btn-set-duration');
    var durInput    = document.getElementById('duration-input');
    var errEl       = document.getElementById('duration-error');

    if (btnStart) btnStart.addEventListener('click', UI_Controller.startTimer);
    if (btnStop)  btnStop.addEventListener('click',  UI_Controller.stopTimer);
    if (btnReset) btnReset.addEventListener('click', UI_Controller.resetTimer);

    function handleSetDuration() {
      if (!durInput) return;
      UI_Controller.setDuration(durInput.value);
      durInput.value = '';
    }

    if (btnSetDur) btnSetDur.addEventListener('click', handleSetDuration);
    if (durInput) {
      durInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleSetDuration();
      });
      // Clear error when user starts typing
      durInput.addEventListener('input', function () {
        if (errEl) errEl.textContent = '';
      });
    }
  },

  /* ----------------------------------------------------------
     To-Do List
     ---------------------------------------------------------- */

  renderTasks: function (taskArray) {
    var list = document.getElementById('task-list');
    if (!list) { console.error('renderTasks: #task-list not found'); return; }

    // Apply current sort order for display (does NOT mutate taskArray)
    var displayed = sortTasks(taskArray, sortOrder);

    list.innerHTML = '';

    displayed.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item';

      // Checkbox
      var checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Mark task complete');
      checkbox.addEventListener('change', function () {
        UI_Controller.toggleTask(task.id);
      });

      // Text span
      var span = document.createElement('span');
      span.className   = 'task-text' + (task.completed ? ' completed' : '');
      span.textContent = task.text;

      // Action buttons
      var actions = document.createElement('div');
      actions.className = 'task-actions';

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className   = 'btn btn-ghost btn-icon';
      editBtn.addEventListener('click', function () {
        var editInput = document.createElement('input');
        editInput.type      = 'text';
        editInput.value     = task.text;
        editInput.className = 'text-input task-edit-input';
        editInput.setAttribute('aria-label', 'Edit task text');

        // Inline error for edit duplicates
        var editErr = document.createElement('span');
        editErr.className = 'edit-error-msg';

        var saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className   = 'btn btn-primary btn-icon';

        function saveEdit() {
          var newText = editInput.value;
          // Duplicate check — exclude the task being edited
          if (isDuplicateTask(tasks, newText, task.id)) {
            editErr.textContent = 'A task with that name already exists.';
            return;
          }
          editErr.textContent = '';
          editTaskInArray(tasks, task.id, newText);
          Storage_Manager.saveTasks(tasks);
          UI_Controller.renderTasks(tasks);
        }

        saveBtn.addEventListener('click', saveEdit);
        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') saveEdit();
        });
        editInput.addEventListener('input', function () {
          editErr.textContent = '';
        });

        li.replaceChild(editInput, span);
        li.insertBefore(editErr, actions);
        actions.replaceChild(saveBtn, editBtn);
        editInput.focus();
      });

      // Delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className   = 'btn btn-secondary btn-icon';
      deleteBtn.addEventListener('click', function () {
        UI_Controller.deleteTask(task.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(actions);
      list.appendChild(li);
    });
  },

  addTask: function (text) {
    addTaskToArray(tasks, text);
    Storage_Manager.saveTasks(tasks);
    UI_Controller.renderTasks(tasks);
  },

  deleteTask: function (id) {
    tasks = deleteTaskFromArray(tasks, id);
    Storage_Manager.saveTasks(tasks);
    UI_Controller.renderTasks(tasks);
  },

  toggleTask: function (id) {
    toggleTaskInArray(tasks, id);
    Storage_Manager.saveTasks(tasks);
    UI_Controller.renderTasks(tasks);
  },

  initTodoList: function () {
    // Load persisted sort order
    sortOrder = Storage_Manager.loadSortOrder();
    UI_Controller._updateSortButtons(sortOrder);

    tasks = Storage_Manager.loadTasks();
    UI_Controller.renderTasks(tasks);

    var input  = document.getElementById('todo-input');
    var addBtn = document.getElementById('btn-add-task');
    var errEl  = document.getElementById('task-error');

    function showTaskError(msg) { if (errEl) errEl.textContent = msg; }
    function clearTaskError()   { if (errEl) errEl.textContent = ''; }

    function handleAdd() {
      if (!input) return;
      var text = input.value.trim();
      if (text === '') return;

      // Duplicate check
      if (isDuplicateTask(tasks, text, null)) {
        showTaskError('That task already exists in your list.');
        return;
      }
      clearTaskError();
      UI_Controller.addTask(text);
      input.value = '';
    }

    if (addBtn) addBtn.addEventListener('click', handleAdd);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleAdd();
      });
      // Clear error when user modifies input
      input.addEventListener('input', clearTaskError);
    }

    // Sort buttons
    var sortBtns = document.querySelectorAll('.btn-sort');
    sortBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        sortOrder = btn.getAttribute('data-sort');
        Storage_Manager.saveSortOrder(sortOrder);
        UI_Controller._updateSortButtons(sortOrder);
        UI_Controller.renderTasks(tasks);
      });
    });
  },

  /** Highlight the active sort button */
  _updateSortButtons: function (activeOrder) {
    var sortBtns = document.querySelectorAll('.btn-sort');
    sortBtns.forEach(function (btn) {
      if (btn.getAttribute('data-sort') === activeOrder) {
        btn.classList.add('active-sort');
      } else {
        btn.classList.remove('active-sort');
      }
    });
  },

  /* ----------------------------------------------------------
     Quick Links
     ---------------------------------------------------------- */

  renderLinks: function (linksArray) {
    var container = document.getElementById('links-container');
    if (!container) { console.error('renderLinks: #links-container not found'); return; }

    container.innerHTML = '';

    linksArray.forEach(function (link) {
      var entry = document.createElement('div');
      entry.className = 'link-entry';

      var linkBtn = document.createElement('button');
      linkBtn.textContent = link.label;
      linkBtn.className   = 'link-btn';
      linkBtn.addEventListener('click', function () {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      });

      var delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className   = 'link-delete-btn';
      delBtn.setAttribute('aria-label', 'Delete link ' + link.label);
      delBtn.addEventListener('click', function () {
        UI_Controller.deleteLink(link.id);
      });

      entry.appendChild(linkBtn);
      entry.appendChild(delBtn);
      container.appendChild(entry);
    });
  },

  addLink: function (label, url) {
    var links = Storage_Manager.loadLinks();
    addLinkToArray(links, label, url);
    Storage_Manager.saveLinks(links);
    UI_Controller.renderLinks(links);
  },

  deleteLink: function (id) {
    var links = Storage_Manager.loadLinks();
    links = deleteLinkFromArray(links, id);
    Storage_Manager.saveLinks(links);
    UI_Controller.renderLinks(links);
  },

  initQuickLinks: function () {
    var links      = Storage_Manager.loadLinks();
    UI_Controller.renderLinks(links);

    var labelInput = document.getElementById('link-label-input');
    var urlInput   = document.getElementById('link-url-input');
    var addBtn     = document.getElementById('btn-add-link');

    function handleAddLink() {
      if (!labelInput || !urlInput) return;
      var label = labelInput.value.trim();
      var url   = urlInput.value.trim();
      if (label === '' || url === '') return;
      UI_Controller.addLink(label, url);
      labelInput.value = '';
      urlInput.value   = '';
    }

    if (addBtn) addBtn.addEventListener('click', handleAddLink);
    if (urlInput) {
      urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleAddLink();
      });
    }
  },

  /* ----------------------------------------------------------
     Expose pure helpers for property-based testing
     ---------------------------------------------------------- */
  formatTimer:         formatTimer,
  getGreeting:         getGreeting,
  addTaskToArray:      addTaskToArray,
  toggleTaskInArray:   toggleTaskInArray,
  deleteTaskFromArray: deleteTaskFromArray,
  editTaskInArray:     editTaskInArray,
  isDuplicateTask:     isDuplicateTask,
  sortTasks:           sortTasks,
  addLinkToArray:      addLinkToArray,
  deleteLinkFromArray: deleteLinkFromArray,

  tickTimerState: function (state) { state.remainingSeconds -= 1; },

  getTimerState:       function () { return { remainingSeconds: remainingSeconds, isRunning: isRunning, intervalId: intervalId }; },
  setRemainingSeconds: function (s) { remainingSeconds = s; },
  setIsRunning:        function (v) { isRunning = v; },
  setIntervalId:       function (v) { intervalId = v; },
};

/* ------------------------------------------------------------
   Bootstrap — run on DOMContentLoaded
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  UI_Controller.initTheme();
  UI_Controller.initGreeting();
  UI_Controller.initTimer();
  UI_Controller.initTodoList();
  UI_Controller.initQuickLinks();
});
