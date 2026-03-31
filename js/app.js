// =============================================
// UNI VERSE — app.js
// Multi-user password auth via localStorage
// =============================================

// Global variable to track logged-in user
let currentUser = null;

// ── HELPERS ──────────────────────────────────

// Raw access for global settings (like users list and current session)
function saveGlobal(key, data) { 
  localStorage.setItem(key, JSON.stringify(data)); 
}

function loadGlobal(key) { 
  const val = localStorage.getItem(key); 
  return val ? JSON.parse(val) : null; 
}

// User-scoped data saving (automatically prefixes keys with username)
function save(key, data) {
  if (!currentUser) return;
  localStorage.setItem(`${currentUser}_${key}`, JSON.stringify(data));
}

function load(key) {
  if (!currentUser) return null;
  const val = localStorage.getItem(`${currentUser}_${key}`);
  return val ? JSON.parse(val) : null;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── LOGIN / LOGOUT ────────────────────────────

function doSignUp() {
  const name = document.getElementById('login-name').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!name || !pass) { alert('Please enter both name and password!'); return; }

  const users = loadGlobal('uv_users') || {};
  if (users[name]) {
    alert('User already exists! Please click Login instead.');
    return;
  }

  // Save credentials (Note: stored in plain text for educational simplicity)
  users[name] = pass;
  saveGlobal('uv_users', users);
  
  loginUser(name);
}

function doLogin() {
  const name = document.getElementById('login-name').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!name || !pass) { alert('Please enter both name and password!'); return; }

  const users = loadGlobal('uv_users') || {};
  if (!users[name]) { 
    alert('User not found. Please click Sign Up first!'); 
    return; 
  }
  
  if (users[name] !== pass) { 
    alert('Incorrect password!'); 
    return; 
  }

  loginUser(name);
}

function loginUser(name) {
  currentUser = name;
  saveGlobal('uv_current_user', name);

  // Clear inputs for next time
  document.getElementById('login-name').value = '';
  document.getElementById('login-pass').value = '';

  startApp(name);
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('uv_current_user');
  
  // Hide UI and return to login screen
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
  
  // Reset navigation to default for next login
  showPage('dashboard', document.querySelector('.nav-link'));
}

function startApp(name) {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.getElementById('welcome-name').textContent = name;
  document.getElementById('sidebar-user').textContent = '👤 ' + name;
  
  // Render all module data specific to THIS user
  renderAttendance();
  renderExpenses();
  renderTasks();
  renderMoods();

  // Reset/Show Budget UI based on the new user's saved data
  if (getBudget() > 0) {
    document.getElementById('budget-display').style.display = 'flex';
    document.getElementById('expense-form').style.display = 'flex';
    document.getElementById('expense-table').style.display = 'table';
  } else {
    document.getElementById('budget-display').style.display = 'none';
    document.getElementById('expense-form').style.display = 'none';
    document.getElementById('expense-table').style.display = 'none';
  }

  refreshDashboard();
}

// ── PAGE NAVIGATION ───────────────────────────

function showPage(pageId, linkEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  if (linkEl) linkEl.classList.add('active');
  if (pageId === 'dashboard') refreshDashboard();
}

// ── ATTENDANCE ────────────────────────────────

function getSubjects() { return load('uv_subjects') || []; }

function addSubject() {
  const name     = document.getElementById('subj-name').value.trim();
  const attended = parseInt(document.getElementById('subj-attended').value);
  const total    = parseInt(document.getElementById('subj-total').value);

  if (!name)              { alert('Enter subject name.'); return; }
  if (isNaN(attended))   { alert('Enter classes attended.'); return; }
  if (isNaN(total) || total < 1) { alert('Enter valid total classes.'); return; }
  if (attended > total)  { alert('Attended cannot exceed total.'); return; }

  const subjects = getSubjects();
  subjects.push({ id: Date.now(), name, attended, total });
  save('uv_subjects', subjects);

  document.getElementById('subj-name').value = '';
  document.getElementById('subj-attended').value = '';
  document.getElementById('subj-total').value = '';

  renderAttendance();
}

function deleteSubject(id) {
  const subjects = getSubjects().filter(s => s.id !== id);
  save('uv_subjects', subjects);
  renderAttendance();
}

function renderAttendance() {
  const subjects = getSubjects();
  const tbody = document.getElementById('attendance-body');
  tbody.innerHTML = '';

  let totalAttended = 0, totalClasses = 0;

  subjects.forEach(s => {
    const pct = Math.round((s.attended / s.total) * 100);
    totalAttended += s.attended;
    totalClasses  += s.total;

    let statusClass = 'ok', statusText = '✅ Good';
    if (pct < 75 && pct >= 65) { statusClass = 'warn'; statusText = '⚠️ Warning'; }
    if (pct < 65)               { statusClass = 'bad';  statusText = '❌ Low'; }

    tbody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.attended}</td>
        <td>${s.total}</td>
        <td>${pct}%</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td><button class="del-btn" onclick="deleteSubject(${s.id})">Delete</button></td>
      </tr>`;
  });

  const overall = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  document.getElementById('overall-attendance').textContent = totalClasses > 0 ? overall + '%' : 'N/A';
}

// ── EXPENSES ──────────────────────────────────

function getExpenses() { return load('uv_expenses') || []; }
function getBudget()   { return load('uv_budget') || 0; }

function setBudget() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (isNaN(val) || val <= 0) { alert('Enter a valid budget amount.'); return; }
  save('uv_budget', val);
  document.getElementById('budget-input').value = '';
  document.getElementById('budget-display').style.display = 'flex';
  document.getElementById('expense-form').style.display = 'flex';
  document.getElementById('expense-table').style.display = 'table';
  renderExpenses();
}

function addExpense() {
  const name   = document.getElementById('exp-name').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  if (!name)           { alert('Enter expense description.'); return; }
  if (isNaN(amount) || amount <= 0) { alert('Enter valid amount.'); return; }

  const expenses = getExpenses();
  expenses.push({ id: Date.now(), name, amount });
  save('uv_expenses', expenses);
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-amount').value = '';
  renderExpenses();
}

function deleteExpense(id) {
  const expenses = getExpenses().filter(e => e.id !== id);
  save('uv_expenses', expenses);
  renderExpenses();
}

function renderExpenses() {
  const budget   = getBudget();
  const expenses = getExpenses();
  const spent    = expenses.reduce((sum, e) => sum + e.amount, 0);
  const left     = budget - spent;

  document.getElementById('budget-total').textContent = budget.toFixed(2);
  document.getElementById('budget-spent').textContent = spent.toFixed(2);
  document.getElementById('budget-left').textContent  = left.toFixed(2);

  const tbody = document.getElementById('expense-body');
  tbody.innerHTML = '';
  expenses.forEach(e => {
    tbody.innerHTML += `
      <tr>
        <td>${e.name}</td>
        <td>₹${e.amount.toFixed(2)}</td>
        <td><button class="del-btn" onclick="deleteExpense(${e.id})">Delete</button></td>
      </tr>`;
  });
}

// ── TASKS ─────────────────────────────────────

function getTasks() { return load('uv_tasks') || []; }

function addTask() {
  const name = document.getElementById('task-name').value.trim();
  const due  = document.getElementById('task-due').value;
  if (!name) { alert('Enter a task name.'); return; }

  const tasks = getTasks();
  tasks.push({ id: Date.now(), name, due, done: false });
  save('uv_tasks', tasks);
  document.getElementById('task-name').value = '';
  document.getElementById('task-due').value  = '';
  renderTasks();
}

function toggleTask(id) {
  const tasks = getTasks().map(t => {
    if (t.id === id) t.done = !t.done;
    return t;
  });
  save('uv_tasks', tasks);
  renderTasks();
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  save('uv_tasks', tasks);
  renderTasks();
}

function renderTasks() {
  const tasks = getTasks();
  const list  = document.getElementById('task-list');
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = '<p class="no-data">No tasks yet. Add one above!</p>';
    return;
  }

  tasks.forEach(t => {
    const dueText = t.due ? ` — Due: ${t.due}` : '';
    list.innerHTML += `
      <div class="task-item ${t.done ? 'done' : ''}">
        <input type="checkbox" class="task-cb" ${t.done ? 'checked' : ''}
          onchange="toggleTask(${t.id})" />
        <span class="task-text">${t.name}</span>
        <span class="task-due">${dueText}</span>
        <button class="del-btn" onclick="deleteTask(${t.id})">Delete</button>
      </div>`;
  });
}

// ── MOOD ──────────────────────────────────────

function getMoods() { return load('uv_moods') || []; }

function logMood(mood, btn) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const moods = getMoods();
  moods.unshift({ date: today(), mood }); 
  if (moods.length > 30) moods.pop();    
  save('uv_moods', moods);
  renderMoods();
}

function renderMoods() {
  const moods = getMoods();
  const list  = document.getElementById('mood-list');
  list.innerHTML = '';

  if (moods.length === 0) {
    list.innerHTML = '<li class="no-data">No entries yet.</li>';
  } else {
    moods.forEach(m => {
      list.innerHTML += `<li><span>${m.mood}</span><span>${m.date}</span></li>`;
    });
  }

  const lowMoods = ['😞 Low', '😩 Terrible'];
  const recent = moods.slice(0, 3);
  const burnout = recent.length === 3 && recent.every(m => lowMoods.includes(m.mood));
  document.getElementById('burnout-box').style.display = burnout ? 'block' : 'none';
}

// ── DASHBOARD ─────────────────────────────────

function refreshDashboard() {
  const subjects = getSubjects();
  let totalA = 0, totalC = 0;
  subjects.forEach(s => { totalA += s.attended; totalC += s.total; });
  const attPct = totalC > 0 ? Math.round((totalA / totalC) * 100) + '%' : 'N/A';
  document.getElementById('dash-attendance').textContent = attPct;

  const budget  = getBudget();
  const spent   = getExpenses().reduce((s, e) => s + e.amount, 0);
  document.getElementById('dash-budget').textContent = budget > 0 ? '₹' + (budget - spent).toFixed(0) : 'Not Set';

  const tasks    = getTasks();
  const doneCnt  = tasks.filter(t => t.done).length;
  document.getElementById('dash-tasks').textContent = tasks.length > 0 ? `${doneCnt}/${tasks.length}` : '0/0';

  const moods = getMoods();
  document.getElementById('dash-mood').textContent = moods.length > 0 ? moods[0].mood : 'Not Logged';

  const alertsList = document.getElementById('alerts-list');
  const alerts = [];

  if (totalC > 0 && Math.round((totalA / totalC) * 100) < 75) {
    alerts.push({ type: 'warn', msg: '📅 Your overall attendance is below 75%! Attend more classes.' });
  }
  subjects.forEach(s => {
    const pct = Math.round((s.attended / s.total) * 100);
    if (pct < 75) {
      alerts.push({ type: 'warn', msg: `📅 "${s.name}" attendance is ${pct}% — below 75%.` });
    }
  });

  if (budget > 0 && spent > budget) {
    alerts.push({ type: 'warn', msg: '💰 You have exceeded your monthly budget!' });
  } else if (budget > 0 && (budget - spent) < budget * 0.1) {
    alerts.push({ type: 'warn', msg: '💰 Less than 10% of your budget remains.' });
  }

  const lowMoods = ['😞 Low', '😩 Terrible'];
  const recent   = moods.slice(0, 3);
  if (recent.length === 3 && recent.every(m => lowMoods.includes(m.mood))) {
    alerts.push({ type: 'warn', msg: '🧠 Burnout risk detected! You\'ve been feeling low. Take a break.' });
  }

  if (alerts.length === 0) {
    alertsList.innerHTML = '<p class="no-alert">No alerts right now. Keep it up! 🎉</p>';
  } else {
    alertsList.innerHTML = alerts.map(a => `<div class="alert-item">${a.msg}</div>`).join('');
  }
}

// ── INIT ──────────────────────────────────────
window.onload = function () {
  const user = loadGlobal('uv_current_user');
  
  // If someone was already logged in during a previous session, restore them
  if (user) {
    loginUser(user);
  }
};
