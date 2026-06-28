const LIFF_ID = '2010440942-oo64INdp';

const API_URL = 'https://script.google.com/macros/s/AKfycbx4FFCc0WxU13uAgNz_jNArKM_EQ0hFCyuCADCzLVyiJS3oeFMk0IscqEY4BSvKwnx4/exec';

let userId = '';
let selectedScheduleDate = formatDate(new Date());
let selectedTaskDate = formatDate(new Date());

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);

  if (pageId === 'homePage') loadDashboard();
  if (pageId === 'calendarPage') {
    renderScheduleDateSwitcher();
    loadSchedulesByDate();
  }
  if (pageId === 'todoPage') {
    renderTaskDateSwitcher();
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
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    userId = profile.userId;

    setDefaultDates();
    renderScheduleDateSwitcher();
    renderTaskDateSwitcher();
    await loadDashboard();

  } catch (err) {
    alert('LIFF 初始化失敗：' + err.message);
  }
}

function setDefaultDates() {
  const today = formatDate(new Date());

  const scheduleDate = document.getElementById('scheduleDate');
  const todoDate = document.getElementById('todoDate');

  if (scheduleDate) scheduleDate.value = today;
  if (todoDate) todoDate.value = today;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function shortDateLabel(dateText) {
  const today = formatDate(new Date());
  const d = new Date(dateText);

  if (dateText === today) return '今天';

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function renderScheduleDateSwitcher() {
  const el = document.getElementById('scheduleDateSwitcher');
  if (!el) return;

  const today = new Date();
  let html = '';

  for (let i = -2; i <= 2; i++) {
    const date = addDays(today, i);
    const dateText = formatDate(date);

    html += `
      <button
        class="${dateText === selectedScheduleDate ? 'active' : ''}"
        onclick="selectScheduleDate('${dateText}')">
        ${shortDateLabel(dateText)}
      </button>
    `;
  }

  el.innerHTML = html;
}

function renderTaskDateSwitcher() {
  const el = document.getElementById('taskDateSwitcher');
  if (!el) return;

  const today = new Date();
  let html = '';

  for (let i = -2; i <= 2; i++) {
    const date = addDays(today, i);
    const dateText = formatDate(date);

    html += `
      <button
        class="${dateText === selectedTaskDate ? 'active' : ''}"
        onclick="selectTaskDate('${dateText}')">
        ${shortDateLabel(dateText)}
      </button>
    `;
  }

  el.innerHTML = html;
}

async function selectScheduleDate(dateText) {
  selectedScheduleDate = dateText;

  const input = document.getElementById('scheduleDate');
  if (input) input.value = dateText;

  renderScheduleDateSwitcher();
  await loadSchedulesByDate();
}

async function selectTaskDate(dateText) {
  selectedTaskDate = dateText;

  const input = document.getElementById('todoDate');
  if (input) input.value = dateText;

  renderTaskDateSwitcher();
  await loadTasksByDate();
}

function setTodoCategory(category) {
  const el = document.getElementById('todoCategory');
  if (el) el.value = category;
}

async function loadDashboard() {
  if (!userId) return;

  const result = await apiPost({
    action: 'getDashboard',
    userId
  });

  if (!result.ok) {
    alert(result.message || '讀取首頁失敗');
    return;
  }

  const data = result.data || {};

  renderReport(data.report);
  renderHomeSchedules(data.schedules || []);
  renderHomeTasks(data.tasks || []);
  renderProgress(data.schedules || [], data.tasks || []);
}

function renderReport(report) {
  const el = document.getElementById('reportStatus');
  if (!el) return;

  if (!report) {
    el.innerHTML = `
      <div class="listItem">
        <div>⚠️ 今日尚未報備出門</div>
        <span>未完成</span>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="listItem">
      <div>✅ 今日已報備</div>
      <span class="done">已完成</span>
    </div>
    <div class="miniInfo">
      報備時間：${report.time || '未填寫'}<br>
      目的地：${report.destination || '未填寫'}<br>
      預計回家：${report.returnTime || '未填寫'}<br>
      備註：${report.note || '無'}
    </div>
  `;
}

function renderHomeSchedules(items) {
  const el = document.getElementById('todaySchedules');
  const count = document.getElementById('homeScheduleCount');

  if (count) {
    count.textContent = items.filter(item => item.status !== '已完成').length;
  }

  if (!el) return;

  const active = items.filter(item => item.status !== '已完成');

  if (!active.length) {
    el.innerHTML = `<div class="emptyText">今天沒有行程</div>`;
    return;
  }

  el.innerHTML = active.slice(0, 4).map(item => `
    <div class="scheduleItem">
      <div class="scheduleTime">${item.time || '--:--'}</div>
      <div class="scheduleBody">
        <div class="scheduleTitle">${item.title}</div>
        <div class="scheduleMeta">${item.status || '未完成'}</div>
      </div>
    </div>
  `).join('');
}

function renderHomeTasks(items) {
  const boxuanEl = document.getElementById('homeBoxuanTasks');
  const xuanruiEl = document.getElementById('homeXuanruiTasks');
  const boxuanCount = document.getElementById('homeBoxuanCount');
  const xuanruiCount = document.getElementById('homeXuanruiCount');

  const active = items.filter(item => item.status !== '已完成');

  const boxuan = active.filter(item => item.category === '柏萱交代');
  const xuanrui = active.filter(item => item.category === '軒睿筆記');

  if (boxuanCount) boxuanCount.textContent = boxuan.length;
  if (xuanruiCount) xuanruiCount.textContent = xuanrui.length;

  if (boxuanEl) {
    boxuanEl.innerHTML = boxuan.length
      ? boxuan.slice(0, 4).map(item => `
          <div class="listItem">
            <div>□ ${item.title}</div>
            <span>${item.level || '一般'}</span>
          </div>
        `).join('')
      : `<div class="emptyText">今天沒有柏萱交代</div>`;
  }

  if (xuanruiEl) {
    xuanruiEl.innerHTML = xuanrui.length
      ? xuanrui.slice(0, 4).map(item => `
          <div class="listItem">
            <div>□ ${item.title}</div>
            <span>${item.level || '一般'}</span>
          </div>
        `).join('')
      : `<div class="emptyText">今天沒有軒睿筆記</div>`;
  }
}

function renderProgress(schedules, tasks) {
  const el = document.getElementById('todayProgress');
  if (!el) return;

  const all = [...schedules, ...tasks];
  const total = all.length;
  const done = all.filter(item => item.status === '已完成').length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  el.innerHTML = `
    <div class="progressBox">
      <div class="progressText">
        今日完成：${done} / ${total}（${percent}%）
      </div>
      <div class="progressBar">
        <div class="progressFill" style="width:${percent}%"></div>
      </div>
    </div>
  `;
}

async function loadSchedulesByDate() {
  if (!userId) return;

  const result = await apiPost({
    action: 'getSchedulesByDate',
    userId,
    date: selectedScheduleDate
  });

  renderScheduleList(result.items || []);
}

function renderScheduleList(items) {
  const el = document.getElementById('scheduleList');
  const count = document.getElementById('schedulePageCount');

  if (count) count.textContent = items.length;

  if (!el) return;

  if (!items.length) {
    el.innerHTML = `<div class="emptyText">這天沒有行程</div>`;
    return;
  }

  el.innerHTML = items.map(item => `
    <div class="scheduleItem">
      <div class="scheduleTime">${item.time || '--:--'}</div>
      <div class="scheduleBody">
        <div class="scheduleTitle">${item.title}</div>
        <div class="scheduleMeta">${item.status || '未完成'}</div>
        <div class="itemActions">
          ${item.status !== '已完成'
            ? `<button onclick="completeSchedule('${item.id}')">完成</button>`
            : ''
          }
          <button class="dangerBtn" onclick="deleteSchedule('${item.id}')">刪除</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function createSchedule() {
  const title = document.getElementById('scheduleTitle').value.trim();
  const date = document.getElementById('scheduleDate').value;
  const time = document.getElementById('scheduleTime').value;
  const note = document.getElementById('scheduleNote').value.trim();
  const addToTask = document.getElementById('scheduleAddToTask').checked;

  if (!title || !date || !time) {
    alert('請填寫行程、日期、時間');
    return;
  }

  const result = await apiPost({
    action: 'addSchedule',
    userId,
    title,
    date,
    time,
    note,
    addToTask
  });

  if (!result.ok) {
    alert(result.message || '建立行程失敗');
    return;
  }

  document.getElementById('scheduleTitle').value = '';
  document.getElementById('scheduleTime').value = '';
  document.getElementById('scheduleNote').value = '';
  document.getElementById('scheduleAddToTask').checked = false;

  selectedScheduleDate = date;
  selectedTaskDate = date;

  renderScheduleDateSwitcher();
  renderTaskDateSwitcher();

  await loadSchedulesByDate();
  await loadDashboard();

  alert('📅 行程已建立');
}

async function completeSchedule(id) {
  await apiPost({
    action: 'completeSchedule',
    id
  });

  await loadSchedulesByDate();
  await loadDashboard();
}

async function deleteSchedule(id) {
  if (!confirm('確定要刪除這筆行程嗎？')) return;

  await apiPost({
    action: 'deleteSchedule',
    id
  });

  await loadSchedulesByDate();
  await loadDashboard();
}

async function loadTasksByDate() {
  if (!userId) return;

  const result = await apiPost({
    action: 'getTasksByDate',
    userId,
    date: selectedTaskDate
  });

  renderTaskList(result.items || []);
}

function renderTaskList(items) {
  const boxuanEl = document.getElementById('boxuanTaskList');
  const xuanruiEl = document.getElementById('xuanruiTaskList');
  const completedEl = document.getElementById('completedTaskList');

  const boxuanCount = document.getElementById('boxuanTaskCount');
  const xuanruiCount = document.getElementById('xuanruiTaskCount');

  const active = items.filter(item => item.status !== '已完成');
  const completed = items.filter(item => item.status === '已完成');

  const boxuan = active.filter(item => item.category === '柏萱交代');
  const xuanrui = active.filter(item => item.category === '軒睿筆記');

  if (boxuanCount) boxuanCount.textContent = boxuan.length;
  if (xuanruiCount) xuanruiCount.textContent = xuanrui.length;

  if (boxuanEl) {
    boxuanEl.innerHTML = boxuan.length
      ? boxuan.map(renderTaskItem).join('')
      : `<div class="emptyText">這天沒有柏萱交代</div>`;
  }

  if (xuanruiEl) {
    xuanruiEl.innerHTML = xuanrui.length
      ? xuanrui.map(renderTaskItem).join('')
      : `<div class="emptyText">這天沒有軒睿筆記</div>`;
  }

  if (completedEl) {
    completedEl.innerHTML = completed.length
      ? completed.map(item => `
        <div class="taskItem">
          <div class="taskCheck">✓</div>
          <div class="taskBody">
            <div class="taskTitle">${item.title}</div>
            <div class="taskMeta">${item.category}｜${item.level || '一般'}｜已完成</div>
          </div>
        </div>
      `).join('')
      : `<div class="emptyText">尚無已完成事項</div>`;
  }
}

function renderTaskItem(item) {
  return `
    <div class="taskItem">
      <button class="taskCheck" onclick="completeTask('${item.id}')">✓</button>
      <div class="taskBody">
        <div class="taskTitle">${item.title}</div>
        <div class="taskMeta">${item.level || '一般'}｜${item.source || '手動新增'}</div>
        <span class="taskTag">${item.category}</span>

        <div class="itemActions">
          <button onclick="completeTask('${item.id}')">完成</button>
          <button class="dangerBtn" onclick="deleteTask('${item.id}')">刪除</button>
        </div>
      </div>
    </div>
  `;
}

async function createTask() {
  const title = document.getElementById('todoTask').value.trim();
  const date = document.getElementById('todoDate').value || selectedTaskDate;
  const category = document.getElementById('todoCategory').value;
  const level = document.getElementById('todoLevel').value;

  if (!title) {
    alert('請填寫任務內容');
    return;
  }

  const result = await apiPost({
    action: 'addTask',
    userId,
    title,
    date,
    category,
    level
  });

  if (!result.ok) {
    alert(result.message || '新增任務失敗');
    return;
  }

  document.getElementById('todoTask').value = '';
  selectedTaskDate = date;

  renderTaskDateSwitcher();

  await loadTasksByDate();
  await loadDashboard();

  alert('✅ 任務已新增');
}

async function completeTask(id) {
  await apiPost({
    action: 'completeTask',
    id
  });

  await loadTasksByDate();
  await loadDashboard();
}

async function deleteTask(id) {
  if (!confirm('確定要刪除這筆任務嗎？')) return;

  await apiPost({
    action: 'deleteTask',
    id
  });

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

  const result = await apiPost({
    action: 'addReport',
    userId,
    destination,
    returnTime,
    note
  });

  if (!result.ok) {
    alert(result.message || '報備失敗');
    return;
  }

  document.getElementById('destination').value = '';
  document.getElementById('returnTime').value = '';
  document.getElementById('reportNote').value = '';

  await loadDashboard();
  showPage('homePage');

  alert('🚗 今日出門資訊已記錄');
}

init();
