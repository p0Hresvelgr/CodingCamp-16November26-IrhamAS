/* ═══════════════════════════════════════════════════════════════════
   To-Do Life Dashboard  –  app.js
   All logic was written in response to failing tests in
   tests/app.test.html (TDD).
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   Storage key constants
───────────────────────────────────────────── */
const KEY_TASKS = 'dashboard_tasks';
const KEY_LINKS = 'dashboard_links';
const KEY_THEME = 'dashboard_theme';
const KEY_NAME  = 'dashboard_name';

/* ─────────────────────────────────────────────
   Pure helper – unique id
───────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ═══════════════════════════════════════════
   1. GREETING & CLOCK
   Tests: Greeting & Clock suite
═══════════════════════════════════════════ */

/**
 * Returns a time-based greeting string.
 * @param {number} hour – 0-23
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 16) return 'Good afternoon';
  if (hour >= 17 && hour <= 20) return 'Good evening';
  return 'Good night';
}

/**
 * Formats a Date to "HH:MM" (24-hour).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Formats a Date to a human-readable date string.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

/**
 * Retrieves the user's saved name.
 * @param {Storage} storage
 * @returns {string}
 */
function getUserName(storage) {
  return storage.getItem(KEY_NAME) || '';
}

/**
 * Persists the user's name.
 * @param {string}  name
 * @param {Storage} storage
 */
function saveUserName(name, storage) {
  storage.setItem(KEY_NAME, name);
}

/* ═══════════════════════════════════════════
   2. FOCUS TIMER
   Tests: Focus Timer suite
═══════════════════════════════════════════ */

/**
 * Creates a 25-minute countdown timer object.
 * @returns {{ start, stop, reset, isRunning, getRemaining }}
 */
function createTimer() {
  const DURATION = 25 * 60; // 1500 seconds
  let remaining = DURATION;
  let running   = false;
  let intervalId = null;

  return {
    getRemaining() { return remaining; },
    isRunning()    { return running; },

    start(onTick) {
      if (running) return;
      running = true;
      intervalId = setInterval(() => {
        if (remaining > 0) {
          remaining--;
          onTick(remaining);
        } else {
          running = false;
          clearInterval(intervalId);
          intervalId = null;
          onTick(remaining);
        }
      }, 1000);
    },

    stop() {
      if (!running) return;
      running = false;
      clearInterval(intervalId);
      intervalId = null;
    },

    reset() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      running   = false;
      remaining = DURATION;
    },
  };
}

/**
 * Formats remaining seconds to "MM:SS".
 * @param {number} seconds
 * @returns {string}
 */
function formatTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════
   3. TO-DO LIST
   Tests: To-Do List suite
═══════════════════════════════════════════ */

/**
 * Creates a new task object.
 * @param {string} text
 * @returns {{ id: string, text: string, done: boolean, createdAt: number }}
 */
function createTask(text) {
  return { id: uid(), text: text.trim(), done: false, createdAt: Date.now() };
}

/**
 * Appends a task to the list; ignores blank text.
 * @param {Array}  tasks
 * @param {string} text
 * @returns {Array}
 */
function addTask(tasks, text) {
  if (!text || !text.trim()) return [...tasks];
  return [...tasks, createTask(text)];
}

/**
 * Removes a task by id.
 * @param {Array}  tasks
 * @param {string} id
 * @returns {Array}
 */
function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

/**
 * Flips the done flag of a task.
 * @param {Array}  tasks
 * @param {string} id
 * @returns {Array}
 */
function toggleTask(tasks, id) {
  return tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

/**
 * Updates the text of a task; ignores blank replacement.
 * @param {Array}  tasks
 * @param {string} id
 * @param {string} newText
 * @returns {Array}
 */
function editTask(tasks, id, newText) {
  if (!newText || !newText.trim()) return [...tasks];
  return tasks.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
}

/**
 * Sorts tasks: undone first (by creation), done tasks last.
 * @param {Array} tasks
 * @returns {Array}
 */
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done === b.done) return a.createdAt - b.createdAt;
    return a.done ? 1 : -1;
  });
}

/**
 * Serialises tasks to storage.
 * @param {Array}   tasks
 * @param {Storage} storage
 */
function saveTasks(tasks, storage) {
  storage.setItem(KEY_TASKS, JSON.stringify(tasks));
}

/**
 * Deserialises tasks from storage.
 * @param {Storage} storage
 * @returns {Array}
 */
function loadTasks(storage) {
  const raw = storage.getItem(KEY_TASKS);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

/* ═══════════════════════════════════════════
   4. QUICK LINKS
   Tests: Quick Links suite
═══════════════════════════════════════════ */

/**
 * Creates a link object.
 * @param {string} label
 * @param {string} url
 * @returns {{ id: string, label: string, url: string }}
 */
function createLink(label, url) {
  return { id: uid(), label: label.trim(), url: url.trim() };
}

/**
 * Appends a link; rejects empty label or url.
 * @param {Array}  links
 * @param {string} label
 * @param {string} url
 * @returns {Array}
 */
function addLink(links, label, url) {
  if (!label || !label.trim()) return [...links];
  if (!url   || !url.trim())   return [...links];
  return [...links, createLink(label, url)];
}

/**
 * Removes a link by id.
 * @param {Array}  links
 * @param {string} id
 * @returns {Array}
 */
function deleteLink(links, id) {
  return links.filter(l => l.id !== id);
}

/**
 * Serialises links to storage.
 * @param {Array}   links
 * @param {Storage} storage
 */
function saveLinks(links, storage) {
  storage.setItem(KEY_LINKS, JSON.stringify(links));
}

/**
 * Deserialises links from storage.
 * @param {Storage} storage
 * @returns {Array}
 */
function loadLinks(storage) {
  const raw = storage.getItem(KEY_LINKS);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

/* ═══════════════════════════════════════════
   5. THEME
   Tests: Theme suite
═══════════════════════════════════════════ */

/**
 * Returns the stored theme or defaults to 'light'.
 * @param {Storage} storage
 * @returns {'light'|'dark'}
 */
function getTheme(storage) {
  return storage.getItem(KEY_THEME) || 'light';
}

/**
 * Persists the theme.
 * @param {string}  theme
 * @param {Storage} storage
 */
function saveTheme(theme, storage) {
  storage.setItem(KEY_THEME, theme);
}

/**
 * Returns the opposite theme.
 * @param {'light'|'dark'} current
 * @returns {'dark'|'light'}
 */
function toggleTheme(current) {
  return current === 'light' ? 'dark' : 'light';
}

/* ═══════════════════════════════════════════
   6. UI – DOM interactions
   (Runs only when document.body exists)
═══════════════════════════════════════════ */
if (typeof document !== 'undefined' && document.getElementById('app')) {
  initApp();
}

function initApp() {
  const storage = localStorage;

  /* ── State ─────────────────────────── */
  let tasks  = loadTasks(storage);
  let links  = loadLinks(storage);
  let theme  = getTheme(storage);
  let timer  = createTimer();
  let sorted = false; // toggle between sorted / insertion order

  /* ── DOM refs ──────────────────────── */
  const $ = id => document.getElementById(id);

  const greetingEl    = $('greeting');
  const clockEl       = $('clock');
  const dateEl        = $('date-display');
  const nameInput     = $('name-input');
  const nameDisplay   = $('name-display');
  const themeBtn      = $('theme-toggle');
  const timerDisplay  = $('timer-display');
  const timerStart    = $('timer-start');
  const timerStop     = $('timer-stop');
  const timerReset    = $('timer-reset');
  const taskInput     = $('task-input');
  const taskAddBtn    = $('task-add');
  const taskList      = $('task-list');
  const sortBtn       = $('sort-btn');
  const linkLabel     = $('link-label');
  const linkUrl       = $('link-url');
  const linkAddBtn    = $('link-add');
  const linksContainer= $('links-container');

  /* ── Clock ─────────────────────────── */
  function updateClock() {
    const now = new Date();
    clockEl.textContent    = formatTime(now);
    dateEl.textContent     = formatDate(now);
    const name = getUserName(storage);
    const greeting = getGreeting(now.getHours());
    greetingEl.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ── Name input ─────────────────────── */
  function refreshNameUI() {
    const name = getUserName(storage);
    nameInput.value = name;
  }
  refreshNameUI();

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      saveUserName(nameInput.value.trim(), storage);
      updateClock();
      nameInput.blur();
    }
  });
  nameInput.addEventListener('blur', () => {
    saveUserName(nameInput.value.trim(), storage);
    updateClock();
  });

  /* ── Theme ──────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeBtn.textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
  applyTheme(theme);

  themeBtn.addEventListener('click', () => {
    theme = toggleTheme(theme);
    saveTheme(theme, storage);
    applyTheme(theme);
  });

  /* ── Timer ──────────────────────────── */
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTimerDisplay(timer.getRemaining());
  }
  updateTimerDisplay();

  timerStart.addEventListener('click', () => {
    timer.start(remaining => {
      updateTimerDisplay();
      if (remaining === 0) {
        timerDisplay.classList.add('timer-done');
        setTimeout(() => timerDisplay.classList.remove('timer-done'), 1000);
      }
    });
    timerStart.disabled = true;
    timerStop.disabled  = false;
  });

  timerStop.addEventListener('click', () => {
    timer.stop();
    timerStart.disabled = false;
    timerStop.disabled  = true;
  });

  timerReset.addEventListener('click', () => {
    timer.reset();
    updateTimerDisplay();
    timerStart.disabled = false;
    timerStop.disabled  = true;
  });

  /* ── Tasks ──────────────────────────── */
  function renderTasks() {
    taskList.innerHTML = '';
    const list = sorted ? sortTasks(tasks) : tasks;
    list.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' task-done' : '');
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = task.done;
      checkbox.className = 'task-checkbox';
      checkbox.addEventListener('change', () => {
        tasks = toggleTask(tasks, task.id);
        saveTasks(tasks, storage);
        renderTasks();
      });

      const textSpan = document.createElement('span');
      textSpan.className   = 'task-text';
      textSpan.textContent = task.text;

      const editBtn = document.createElement('button');
      editBtn.className   = 'btn-icon';
      editBtn.textContent = '✏️';
      editBtn.title       = 'Edit task';
      editBtn.addEventListener('click', () => {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null) {
          tasks = editTask(tasks, task.id, newText);
          saveTasks(tasks, storage);
          renderTasks();
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className   = 'btn-icon btn-danger';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title       = 'Delete task';
      deleteBtn.addEventListener('click', () => {
        tasks = deleteTask(tasks, task.id);
        saveTasks(tasks, storage);
        renderTasks();
      });

      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });
  }
  renderTasks();

  function addTaskFromInput() {
    const text = taskInput.value;
    const before = tasks.length;
    tasks = addTask(tasks, text);
    if (tasks.length > before) {
      taskInput.value = '';
      saveTasks(tasks, storage);
      renderTasks();
    }
  }

  taskAddBtn.addEventListener('click', addTaskFromInput);
  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTaskFromInput();
  });

  sortBtn.addEventListener('click', () => {
    sorted = !sorted;
    sortBtn.textContent = sorted ? '↕ Unsort' : '↕ Sort';
    renderTasks();
  });

  /* ── Quick Links ────────────────────── */
  function renderLinks() {
    linksContainer.innerHTML = '';
    links.forEach(link => {
      const wrapper = document.createElement('div');
      wrapper.className = 'link-chip';

      const a = document.createElement('a');
      a.href      = link.url;
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      a.textContent = link.label;
      a.className   = 'link-anchor';

      const del = document.createElement('button');
      del.className   = 'btn-icon btn-danger link-del';
      del.textContent = '×';
      del.title       = 'Remove link';
      del.addEventListener('click', () => {
        links = deleteLink(links, link.id);
        saveLinks(links, storage);
        renderLinks();
      });

      wrapper.appendChild(a);
      wrapper.appendChild(del);
      linksContainer.appendChild(wrapper);
    });
  }
  renderLinks();

  linkAddBtn.addEventListener('click', () => {
    const before = links.length;
    links = addLink(links, linkLabel.value, linkUrl.value);
    if (links.length > before) {
      linkLabel.value = '';
      linkUrl.value   = '';
      saveLinks(links, storage);
      renderLinks();
    }
  });

  linkUrl.addEventListener('keydown', e => {
    if (e.key === 'Enter') linkAddBtn.click();
  });
}
