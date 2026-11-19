/**
 * app.js — To-Do List Life Dashboard
 *
 * Modules:
 *  - Greeting  : Time-based greeting, user name persistence, live clock
 *  - Timer     : Pomodoro focus timer with FSM, SVG progress ring, notifications
 *  - Todos     : Task CRUD, persistence, sorting, inline editing
 *  - Links     : Quick-link CRUD, URL validation, persistence
 *  - Theme     : Light/dark theme detection, toggle, localStorage persistence
 *  - Init      : DOMContentLoaded bootstrap, wires all modules together
 */

// =============================================================================
// Theme Module
// =============================================================================

/**
 * Returns the active theme.
 * Priority: localStorage value → OS preference → 'light' fallback.
 * @returns {'light'|'dark'}
 */
function getTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Applies the given theme to the document and persists it.
 * Sets data-theme on <html>, writes to localStorage, and updates the toggle button icon.
 * Icon is ☀️ when the active theme is dark (clicking will switch to light),
 * and 🌙 when the active theme is light (clicking will switch to dark).
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);

  const btn = document.getElementById("theme-btn");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

/**
 * Toggles between light and dark themes.
 * Reads the current active theme via getTheme() and applies the opposite.
 */
function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark");
}

// =============================================================================
// Greeting Module
// =============================================================================

/** Holds the setInterval handle for the greeting clock, or null if not started. */
let greetingIntervalId = null;

/**
 * Returns the stored user name, or 'Friend' if none is saved.
 * @returns {string}
 */
function getUserName() {
  return localStorage.getItem("userName") || "Friend";
}

/**
 * Trims the given name, persists it to localStorage, and re-renders the greeting.
 * If the trimmed name is empty the stored value is left unchanged.
 * @param {string} name
 */
function setUserName(name) {
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem("userName", trimmed);
  }
  renderGreeting();
}

/**
 * Returns a time-based greeting string for the given hour (0–23).
 *  - 'Good morning'   for hours 5–11
 *  - 'Good afternoon' for hours 12–17
 *  - 'Good evening'   for hours 18–21
 *  - 'Good night'     otherwise (22–23 and 0–4)
 * @param {number} hour - Integer hour in 24-hour format (0–23)
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return "Good morning";
  if (hour >= 12 && hour <= 17) return "Good afternoon";
  if (hour >= 18 && hour <= 21) return "Good evening";
  return "Good night";
}

/**
 * Renders the greeting and live clock into the DOM.
 * - Writes "<Greeting>, <Name> 👋" to #greeting-text using textContent.
 * - Writes "HH:MM:SS\nWeekday, DD Month YYYY" to #datetime using textContent.
 * Called once immediately and then every second by startGreetingClock().
 */
function renderGreeting() {
  const now = new Date();

  // Greeting text
  const greetingEl = document.getElementById("greeting-text");
  if (greetingEl) {
    greetingEl.textContent = `${getGreeting(now.getHours())}, ${getUserName()} 👋`;
  }

  // Date/time text
  const datetimeEl = document.getElementById("datetime");
  if (datetimeEl) {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const timeStr = `${hh}:${mm}:${ss}`;

    const weekday = weekdays[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const dateStr = `${weekday}, ${day} ${month} ${year}`;

    datetimeEl.textContent = `${timeStr}\n${dateStr}`;
  }
}

/**
 * Starts the live greeting clock.
 * Calls renderGreeting() immediately, then schedules it to run every second.
 * The interval handle is stored in greetingIntervalId.
 */
function startGreetingClock() {
  renderGreeting();
  greetingIntervalId = setInterval(renderGreeting, 1000);
}

/**
 * Sets up inline name editing on the greeting widget.
 * - Click on #greeting-text hides the <h2>, shows #name-input populated
 *   with the current user name, and focuses it.
 * - blur or keydown Enter on the input calls setUserName(input.value),
 *   hides the input, and shows the <h2> again.
 * Called from initApp() during page initialisation.
 */
function initGreetingEditing() {
  const greetingEl = document.getElementById("greeting-text");
  const nameInput = document.getElementById("name-input");

  if (!greetingEl || !nameInput) return;

  greetingEl.addEventListener("click", function () {
    nameInput.value = getUserName();
    greetingEl.style.display = "none";
    nameInput.style.display = "";
    nameInput.select();
  });

  function commitEdit() {
    setUserName(nameInput.value);
    nameInput.style.display = "none";
    greetingEl.style.display = "";
  }

  nameInput.addEventListener("blur", commitEdit);

  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      nameInput.blur(); // triggers the blur handler above
    }
  });
}

// =============================================================================
// Timer Module
// =============================================================================

/**
 * Module-level state for the Pomodoro focus timer.
 *  - status    : FSM state — 'idle' | 'running' | 'paused' | 'break'
 *  - remaining : Seconds left in the current session (default 25 min = 1500 s)
 *  - duration  : Total seconds for the current session (default 1500 s)
 *  - intervalId: Handle returned by setInterval, or null when the timer is stopped
 */
const timerState = {
  status: "idle",
  remaining: 1500,
  duration: 1500,
  intervalId: null,
};

/**
 * Formats a duration in seconds as a MM:SS string.
 * @param {number} seconds - Non-negative integer number of seconds
 * @returns {string} Zero-padded "MM:SS" representation
 */
function formatTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

/**
 * Updates the timer display and SVG progress ring to reflect the current timerState.
 * - Writes formatTime(timerState.remaining) to #timer-display via textContent.
 * - Computes stroke-dashoffset as circumference * (1 - remaining / duration),
 *   where circumference = 2 * Math.PI * 52 ≈ 326.73 (SVG circle r=52).
 *   At full time (remaining === duration) offset = 0 (complete ring visible).
 *   At zero time offset = circumference (ring fully consumed).
 * - Sets the stroke-dashoffset attribute on #timer-ring.
 */
function updateTimerDisplay() {
  const display = document.getElementById("timer-display");
  if (display) {
    display.textContent = formatTime(timerState.remaining);
  }

  const ring = document.getElementById("timer-ring");
  if (ring) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference * (1 - timerState.remaining / timerState.duration);
    ring.setAttribute("stroke-dashoffset", offset);
  }
}

/**
 * Dispatches an action through the timer FSM, mutating timerState and
 * refreshing the display after each valid transition.
 *
 * Valid transitions:
 *  idle    + START → running  (starts interval)
 *  running + STOP  → paused   (clears interval)
 *  running + RESET → idle     (clears interval, resets remaining)
 *  paused  + START → running  (restarts interval)
 *  paused  + RESET → idle     (resets remaining)
 *  done    + RESET → idle     (resets remaining)
 *
 * updateTimerDisplay() is always called after the switch block regardless
 * of whether a transition occurred.
 *
 * @param {'START'|'STOP'|'RESET'} action
 */
function timerDispatch(action) {
  switch (timerState.status) {
    case "idle":
      if (action === "START") {
        timerState.status = "running";
        timerState.intervalId = setInterval(timerTick, 1000);
      }
      break;

    case "running":
      if (action === "STOP") {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.status = "paused";
      } else if (action === "RESET") {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.remaining = timerState.duration;
        timerState.status = "idle";
      }
      break;

    case "paused":
      if (action === "START") {
        timerState.status = "running";
        timerState.intervalId = setInterval(timerTick, 1000);
      } else if (action === "RESET") {
        timerState.remaining = timerState.duration;
        timerState.status = "idle";
      }
      break;

    case "done":
      if (action === "RESET") {
        timerState.remaining = timerState.duration;
        timerState.status = "idle";
      }
      break;
  }

  updateTimerDisplay();
}

/**
 * Called by setInterval every second while the timer is running.
 * - Decrements timerState.remaining by 1.
 * - Calls updateTimerDisplay() to refresh the UI.
 * - If timerState.remaining drops to 0 or below:
 *     - Clears the interval and nulls timerState.intervalId.
 *     - Sets timerState.status to 'done'.
 *     - Calls notifySessionComplete() to alert the user.
 */
function timerTick() {
  timerState.remaining -= 1;
  updateTimerDisplay();

  if (timerState.remaining <= 0) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
    timerState.status = "done";
    notifySessionComplete();
  }
}

/**
 * Notifies the user that a focus session has ended.
 * - If the browser has granted notification permission, dispatches a native
 *   Notification with the title 'Session complete!'.
 * - Otherwise adds the CSS class `flash` to the #timer widget for 1 second,
 *   then removes it, producing a visible border-flash animation.
 */
function notifySessionComplete() {
  if (Notification.permission === "granted") {
    new Notification("Session complete!");
  } else {
    const timerWidget = document.getElementById("timer");
    if (timerWidget) {
      timerWidget.classList.add("flash");
      setTimeout(function () {
        timerWidget.classList.remove("flash");
      }, 1000);
    }
  }
}

/**
 * Attaches click listeners to the three timer buttons.
 * - #timer-start : If Notification.permission === 'default', calls
 *                  Notification.requestPermission() (fire-and-forget),
 *                  then calls timerDispatch('START').
 * - #timer-stop  : Calls timerDispatch('STOP').
 * - #timer-reset : Calls timerDispatch('RESET').
 * Called from initApp() during page initialisation.
 */
function initTimerControls() {
  const startBtn = document.getElementById("timer-start");
  const stopBtn = document.getElementById("timer-stop");
  const resetBtn = document.getElementById("timer-reset");

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      timerDispatch("START");
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", function () {
      timerDispatch("STOP");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      timerDispatch("RESET");
    });
  }
}

// =============================================================================
// Todos Module
// =============================================================================

/** In-memory array of task objects, kept in sync with localStorage. */
let tasks = [];

/**
 * Loads persisted tasks from localStorage.
 * - If 'todos' key is absent, returns [].
 * - Parses the JSON value; if the result is an array, returns it.
 * - On JSON.parse errors or non-array results, logs a console warning and returns [].
 * @returns {Array}
 */
function loadTasks() {
  const raw = localStorage.getItem("todos");
  if (raw === null) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    console.warn("loadTasks: stored value is not an array, resetting to [].");
    return [];
  } catch (e) {
    console.warn("loadTasks: failed to parse stored todos, resetting to [].", e);
    return [];
  }
}

/**
 * Persists the in-memory tasks array to localStorage.
 * - Serialises `tasks` with JSON.stringify and writes it under the 'todos' key.
 * - Catches storage errors (QuotaExceededError / code 22) and shows a toast
 *   notifying the user that the save failed.
 */
function persistTasks() {
  try {
    localStorage.setItem("todos", JSON.stringify(tasks));
  } catch (e) {
    if (e.name === "QuotaExceededError" || e.code === 22) {
      showToast("Could not save — storage unavailable.");
    }
  }
}

/**
 * Adds a new task to the task list.
 * - Trims the input text.
 * - Validates: non-empty and ≤ 200 characters.
 *   On failure calls showInlineError on #todo-input and returns early.
 * - Creates a Task object with a unique id (crypto.randomUUID()), the
 *   trimmed text, done: false, createdAt: Date.now(), and doneAt: null.
 * - Pushes the task to the module-level `tasks` array.
 * - Calls persistTasks() to sync to localStorage.
 * - Calls renderTasks() to refresh the UI.
 * - Clears the #todo-input value.
 * @param {string} text - Raw input string from the user
 */
function addTask(text) {
  const trimmed = text.trim();

  if (trimmed.length === 0 || trimmed.length > 200) {
    showInlineError(document.getElementById("todo-input"), "Task must be 1–200 characters.");
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: Date.now(),
    doneAt: null,
  };

  tasks.push(task);
  persistTasks();
  renderTasks();

  const input = document.getElementById("todo-input");
  if (input) {
    input.value = "";
  }
}

/**
 * Removes the task with the given id from the task list.
 * - Filters the module-level `tasks` array to exclude the task whose id matches.
 * - Calls persistTasks() to sync the updated array to localStorage.
 * - Calls renderTasks() to refresh the UI.
 * @param {string} id - The unique id of the task to delete
 */
function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  persistTasks();
  renderTasks();
}

/**
 * Toggles the done state of the task with the given id.
 * - Finds the task by id; if not found, returns early.
 * - Flips task.done to its opposite value.
 * - Sets task.doneAt to Date.now() when marking done, or null when unmarking.
 * - Calls persistTasks() to sync the change to localStorage.
 * - Calls renderTasks() to refresh the UI.
 * @param {string} id - The unique id of the task to toggle
 */
function toggleTask(id) {
  const task = tasks.find(function (t) {
    return t.id === id;
  });
  if (!task) return;

  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;

  persistTasks();
  renderTasks();
}

/**
 * Edits the text of the task with the given id.
 * - Trims newText; if the trimmed value is empty or exceeds 200 characters,
 *   silently discards the edit and returns early.
 * - Finds the task by id; if not found, returns early.
 * - Updates task.text to the trimmed value.
 * - Calls persistTasks() to sync the change to localStorage.
 * - Calls renderTasks() to refresh the UI.
 * @param {string} id      - The unique id of the task to edit
 * @param {string} newText - The replacement text supplied by the user
 */
function editTask(id, newText) {
  const trimmed = newText.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return;

  const task = tasks.find(function (t) {
    return t.id === id;
  });
  if (!task) return;

  task.text = trimmed;
  persistTasks();
  renderTasks();
}

/**
 * Sorts the in-memory tasks array in-place according to the given strategy,
 * then calls renderTasks() to refresh the UI.
 *
 * Strategies:
 *  - 'alpha'     : Alphabetical order by task text using localeCompare.
 *  - 'done-last' : Pending tasks first, completed tasks last
 *                  (sorts by Number(done): false → 0, true → 1).
 *  - 'default'   : Insertion order — sorts by createdAt timestamp ascending.
 *                  Any unrecognised strategy also falls through to this branch.
 *
 * @param {'alpha'|'done-last'|'default'} strategy
 */
function sortTasks(strategy) {
  if (strategy === "alpha") {
    tasks.sort(function (a, b) {
      return a.text.localeCompare(b.text);
    });
  } else if (strategy === "done-last") {
    tasks.sort(function (a, b) {
      return Number(a.done) - Number(b.done);
    });
  } else {
    // 'default' or any unrecognised value → sort by creation time
    tasks.sort(function (a, b) {
      return a.createdAt - b.createdAt;
    });
  }

  renderTasks();
}

/**
 * Renders the current tasks array into the DOM.
 *
 * - Clears #todo-list (via innerHTML = '' on the container, not on user data).
 * - For each task creates a <li data-id="…"> with:
 *     • <input type="checkbox" class="task-checkbox"> (checked if task.done)
 *     • <span class="task-text"> with textContent = task.text (XSS-safe)
 *     • <button class="task-delete"> with textContent = '×'
 * - Adds class 'done' to the <li> when task.done is true.
 * - Writes "<n> pending" to #todo-count, where n is the count of incomplete tasks.
 */
function renderTasks() {
  const todoList = document.getElementById("todo-list");
  if (todoList) {
    todoList.innerHTML = "";

    tasks.forEach(function (task) {
      const li = document.createElement("li");
      li.dataset.id = task.id;
      if (task.done) {
        li.classList.add("done");
      }

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.done;

      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      const btn = document.createElement("button");
      btn.className = "task-delete";
      btn.textContent = "×";

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(btn);
      todoList.appendChild(li);
    });
  }

  const todoCount = document.getElementById("todo-count");
  if (todoCount) {
    const pendingCount = tasks.filter(function (t) {
      return !t.done;
    }).length;
    todoCount.textContent = pendingCount + " pending";
  }
}

/**
 * Wires all interaction on #todo-list via event delegation.
 *
 * Four delegated listeners are attached to the single #todo-list <ul>:
 *
 * 1. 'change'  — checkbox toggled:
 *      Checks e.target has class 'task-checkbox'; reads id from the
 *      closest <li>'s dataset; calls toggleTask(id).
 *
 * 2. 'click'   — delete button pressed:
 *      Checks e.target has class 'task-delete'; reads id from the
 *      closest <li>'s dataset; calls deleteTask(id).
 *
 * 3. 'dblclick' — task text double-clicked for inline editing:
 *      Checks e.target has class 'task-text'; sets contentEditable = 'true'
 *      on the span and focuses it.
 *
 * 4. 'blur'    — editing span loses focus (fires via capture so it reaches
 *      the delegating parent):
 *      When the target has contentEditable === 'true', reads id from the
 *      closest <li>'s dataset; calls editTask(id, target.textContent);
 *      removes contentEditable from the span.
 *
 * 5. 'keydown' — Enter key while editing:
 *      Same guard as blur; calls target.blur() to trigger the blur handler
 *      above and commit the edit.
 *
 * Called from initApp() during page initialisation.
 */
function initTodoListEvents() {
  const todoList = document.getElementById("todo-list");
  if (!todoList) return;

  // 1. Checkbox change → toggle task
  todoList.addEventListener("change", function (e) {
    if (!e.target.classList.contains("task-checkbox")) return;
    const li = e.target.closest("li");
    if (!li) return;
    toggleTask(li.dataset.id);
  });

  // 2. Delete button click → delete task
  todoList.addEventListener("click", function (e) {
    if (!e.target.classList.contains("task-delete")) return;
    const li = e.target.closest("li");
    if (!li) return;
    deleteTask(li.dataset.id);
  });

  // 3. Double-click on task text → make it contenteditable
  todoList.addEventListener("dblclick", function (e) {
    if (!e.target.classList.contains("task-text")) return;
    e.target.contentEditable = "true";
    e.target.focus();
  });

  // 4. Blur on an editable span → commit edit (capture phase so the event
  //    reaches the parent even though blur doesn't bubble by default)
  todoList.addEventListener(
    "blur",
    function (e) {
      if (e.target.contentEditable !== "true") return;
      const li = e.target.closest("li");
      if (!li) return;
      editTask(li.dataset.id, e.target.textContent);
      e.target.removeAttribute("contenteditable");
    },
    true, // useCapture — blur does not bubble
  );

  // 5. Enter key while editing → blur to commit
  todoList.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (e.target.contentEditable !== "true") return;
    e.preventDefault(); // prevent inserting a newline
    e.target.blur();
  });
}

/**
 * Wires the task-input controls: add button, Enter key shortcut, and sort select.
 *
 * - #todo-add click    : reads #todo-input value and calls addTask(input.value).
 * - #todo-input keydown: if e.key === 'Enter', calls addTask(input.value).
 * - #todo-sort change  : calls sortTasks(e.target.value) with the selected strategy.
 *
 * Called from initApp() during page initialisation.
 */
function initTodoInputEvents() {
  const input = document.getElementById("todo-input");
  const addBtn = document.getElementById("todo-add");
  const sortSelect = document.getElementById("todo-sort");

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      if (input) addTask(input.value);
    });
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        addTask(input.value);
      }
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function (e) {
      sortTasks(e.target.value);
    });
  }
}
