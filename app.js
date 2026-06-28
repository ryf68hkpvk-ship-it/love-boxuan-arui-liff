const LIFF_ID = '2010440942-oo64INdp';

const API_URL = 'https://script.google.com/macros/s/AKfycbwQmpo3c5YLG0nyhjS5CrCq8iQBQHya0V2j8q3hsf2dmp-lc3P822CoVEBcnCpgLk-4/exec';

let userId = '';
let selectedTaskDate = formatDate(new Date());

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));

  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);

  if (pageId === 'homePage') {
    loadDashboard();
  }

  if (pageId === 'todoPage') {
    renderDateSwitcher();
    loadTasksByDate();
  }
}

async function apiPost(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return await res.json();
}

async function init() {
  try {
    await liff.init({
      liffId: LIFF_ID
    });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    userId = profile.userId;

    setDefaultDates();
    renderDateSwitcher();
    await loadDashboard();

  } catch (err) {
    alert('LIFF 初始化失敗：' + err.message);
  }
}

function setDefaultDates() {
  const today = formatDate(new Date());

  const dateInput = document.getElementById('date');
  const todoDateInput = document.getElementById('todoDate');

  if (dateInput && !dateInput.value) dateInput.value = today;
  if (todoDateInput && !todoDateInput.value) todoDateInput.value = today;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}

function getShortDateLabel(dateText) {
  const d = new Date(dateText);
  const today = formatDate(new Date());

  if (dateText === today) return '今天';

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function setTodoCategory(category) {
  const el = document.getElementById('todoCategory');
  if (el) el.value = category;
}

function renderDateSwitcher() {
  const el = document.getElementById('taskDateSwitcher');
  if (!el) return;

  const today = new Date();
  let html = '';

  for (let i = -2; i <= 2; i++) {
    const date = addDays(today, i);
    const dateText = formatDate(date);
    const label = getShortDateLabel(dateText);

    html += `
      <button
        class="${dateText === selectedTaskDate ? 'active' : ''}"
        onclick="selectTaskDate('${dateText}')">
        ${label}
      </button>
    `;
  }

  el.innerHTML = html;
}

async function selectTaskDate(dateText) {
  selectedTaskDate = dateText;

  const todoDateInput = document.getElementById('todoDate');
  if (todoDateInput) todoDateInput.value = dateText;

  renderDateSwitcher();
  await loadTasksByDate();
}

async function loadDashboard() {
  if (!userId) return;

  const data = await apiPost({
    action: 'getDashboard',
    userId: userId
  });

  renderReport(data.report);
  renderTodayReminders(data.reminders || []);
  renderHomeTasks(data.todos || []);
}

function renderReport(report) {
  const el = document.getElementById('reportStatus');
  if (!el) return;

  if (!report) {
    el.innerHTML = `
      <div class="listItem">
        ⚠️ 今日尚未報備出門
        <span>未完成</span>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="listItem">
      ✅ 今日已報備
      <span class="done">已完成</span>
    </div>
    <div class="miniInfo">
      目的地：${report.destination || '未填寫'}<br>
      預計回家：${report.returnTime || '未填寫'}<br>
      報備時間：${report.time || ''}
    </div>
  `;
}

function renderTodayReminders(items) {
  const homeEl = document.getElementById('todayReminders');
  const fullEl = document.getElementById('todayRemindersFull');

  const fullHtml = !items.length
    ? `<div class="emptyText">今天尚無行程提醒</div>`
    : items.map(item => `
        <div class="listItem">
          <div><b>${item.time}</b> ${item.task}</div>
          <span>${item.status || '未完成'}</span>
        </div>
      `).join('');

  const homeHtml = !items.length
    ? `<div class="emptyText">今天尚無行程提醒</div>`
    : items.slice(0, 3).map(item => `
        <div class="listItem">
          <div><b>${item.time}</b> ${item.task}</div>
          <span>${item.status || '未完成'}</span>
        </div>
      `).join('');

  if (homeEl) homeEl.innerHTML = homeHtml;
  if (fullEl) fullEl.innerHTML = fullHtml;
}

function renderHomeTasks(items) {
  const boxuanEl = document.getElementById('homeBoxuanTasks');
  const xuanruiEl = document.getElementById('homeXuanruiTasks');

  const active = items.filter(item => item.status !== '已完成');
  const boxuan = active.filter(item => item.category === '柏萱交代');
  const xuanrui = active.filter(item => item.category === '軒睿筆記');

  if (boxuanEl) {
    boxuanEl.innerHTML = boxuan.length
      ? boxuan.slice(0, 3).map(item => `
          <div class="listItem">
            <div>□ ${item.task}</div>
            <span>${item.level || '一般'}</span>
          </div>
        `).join('')
      : `<div class="emptyText">今天沒有柏萱交代</div>`;
  }

  if (xuanruiEl) {
    xuanruiEl.innerHTML = xuanrui.length
      ? xuanrui.slice(0, 3).map(item => `
          <div class="listItem">
            <div>□ ${item.task}</div>
            <span>${item.level || '一般'}</span>
          </div>
        `).join('')
      : `<div class="emptyText">今天沒有軒睿筆記</div>`;
  }
}

async function loadTasksByDate() {
  if (!userId) return;

  const data = await apiPost({
    action: 'getTasksByDate',
    userId: userId,
    date: selectedTaskDate
  });

  renderTaskPage(data.items || []);
}

function renderTaskPage(items) {
  const boxuanEl = document.getElementById('boxuanTaskList');
  const noteEl = document.getElementById('xuanruiTaskList');
  const completedEl = document.getElementById('completedTaskList');

  if (!boxuanEl || !noteEl || !completedEl) return;

  const active = items.filter(item => item.status !== '已完成');
  const completed = items.filter(item => item.status === '已完成');

  const boxuan = active.filter(item => item.category === '柏萱交代');
  const note = active.filter(item => item.category === '軒睿筆記');

  boxuanEl.innerHTML = boxuan.length
    ? boxuan.map(renderTaskItem).join('')
    : `<div class="emptyText">這天沒有柏萱交代</div>`;

  noteEl.innerHTML = note.length
    ? note.map(renderTaskItem).join('')
    : `<div class="emptyText">這天沒有軒睿筆記</div>`;

  completedEl.innerHTML = completed.length
    ? completed.map(item => `
        <div class="taskItem">
          <div class="taskCheck">✓</div>
          <div class="taskBody">
            <div class="taskTitle">${item.task}</div>
            <div class="taskMeta">${item.category || ''}｜已完成</div>
          </div>
        </div>
      `).join('')
    : `<div class="emptyText">尚無已完成事項</div>`;
}

function renderTaskItem(item) {
  return `
    <div class="taskItem">
      <button class="taskCheck" onclick="completeTask('${item.id}')">✓</button>
      <div class="taskBody">
        <div class="taskTitle">${item.task}</div>
        <div class="taskMeta">${item.level || '一般'}｜${item.source || '手動新增'}</div>
        <span class="taskTag">${item.category}</span>
      </div>
    </div>
  `;
}

async function completeTask(id) {
  await apiPost({
    action: 'completeTask',
    id: id
  });

  await loadTasksByDate();
  await loadDashboard();
}

async function createReminder() {
  const task = document.getElementById('task').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const addToTask = document.getElementById('addReminderToTask').checked;

  if (!task || !date || !time) {
    alert('請填寫事項、日期、時間');
    return;
  }

  if (!userId) {
    alert('尚未取得 LINE 使用者資料，請重新開啟頁面');
    return;
  }

  await apiPost({
    action: 'addReminder',
    userId: userId,
    task: task,
    remindTime: date + ' ' + time,
    addToTask: addToTask,
    taskDate: date,
    taskCategory: '軒睿筆記'
  });

  alert('❤️ 提醒已建立');

  document.getElementById('task').value = '';
  document.getElementById('time').value = '';
  document.getElementById('addReminderToTask').checked = false;

  await loadDashboard();
  showPage('homePage');
}

async function createTodo() {
  const task = document.getElementById('todoTask').value.trim();
  const level = document.getElementById('todoLevel').value;
  const category = document.getElementById('todoCategory').value;
  const date = document.getElementById('todoDate').value || selectedTaskDate;

  if (!task) {
    alert('請填寫任務內容');
    return;
  }

  await apiPost({
    action: 'addTodo',
    userId: userId,
    task: task,
    level: level,
    category: category,
    date: date
  });

  alert('✅ 任務已新增');

  document.getElementById('todoTask').value = '';
  document.getElementById('todoDate').value = date;

  selectedTaskDate = date;
  renderDateSwitcher();

  await loadTasksByDate();
  await loadDashboard();
}

async function createReport() {
  const destination = document.getElementById('destination').value.trim();
  const returnTime = document.getElementById('returnTime').value;
  const note = document.getElementById('reportNote').value.trim();

  if (!destination) {
    alert('請填寫目的地');
    return;
  }

  await apiPost({
    action: 'addReport',
    userId: userId,
    destination: destination,
    returnTime: returnTime,
    note: note
  });

  alert('✅ 今日出門資訊已記錄');

  document.getElementById('destination').value = '';
  document.getElementById('returnTime').value = '';
  document.getElementById('reportNote').value = '';

  await loadDashboard();
  showPage('homePage');
}

init();
