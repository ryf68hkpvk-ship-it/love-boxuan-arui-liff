const LIFF_ID = '2010440942-oo64INdp';

const API_URL = 'https://script.google.com/macros/s/AKfycbw511Q6AhWsWa2sI1uMpNkwvmyAsN7PB3CoQDoJlqmv7mO5OYP6YWplfNTwnxvwOsPg/exec';

let userId = '';

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));

  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);

  if (pageId === 'homePage') {
    loadDashboard();
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

    await loadDashboard();

  } catch (err) {
    alert('LIFF 初始化失敗：' + err.message);
  }
}

async function loadDashboard() {
  if (!userId) return;

  const data = await apiPost({
    action: 'getDashboard',
    userId: userId
  });

  renderReport(data.report);
  renderTodayReminders(data.reminders || []);
  renderTodos(data.todos || []);
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
      預計回家：${report.returnTime || '未填寫'}
    </div>
  `;
}

function renderTodayReminders(items) {
  const el = document.getElementById('todayReminders');

  if (!el) return;

  if (!items.length) {
    el.innerHTML = `
      <div class="emptyText">
        今天尚無行程提醒
      </div>
    `;
    return;
  }

  el.innerHTML = items.slice(0, 3).map(item => `
    <div class="listItem">
      <div>
        <b>${item.time}</b> ${item.task}
      </div>
      <span>${item.status || '未完成'}</span>
    </div>
  `).join('');
}

function renderTodos(items) {
  const el = document.getElementById('todoList');

  if (!el) return;

  if (!items.length) {
    el.innerHTML = `
      <div class="emptyText">
        目前沒有柏萱交代事項
      </div>
    `;
    return;
  }

  el.innerHTML = items.slice(0, 5).map(item => `
    <div class="listItem">
      <div>□ ${item.task}</div>
      <span>${item.level || '一般'}</span>
    </div>
  `).join('');
}

async function createReminder() {
  const task = document.getElementById('task').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

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
    remindTime: date + ' ' + time
  });

  alert('❤️ 提醒已建立');

  document.getElementById('task').value = '';
  document.getElementById('date').value = '';
  document.getElementById('time').value = '';

  await loadDashboard();
  showPage('homePage');
}

async function createTodo() {
  const task = document.getElementById('todoTask').value.trim();
  const level = document.getElementById('todoLevel').value;

  if (!task) {
    alert('請填寫交代事項');
    return;
  }

  await apiPost({
    action: 'addTodo',
    userId: userId,
    task: task,
    level: level
  });

  alert('❤️ 交代事項已新增');

  document.getElementById('todoTask').value = '';
  await loadDashboard();
  showPage('homePage');
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
