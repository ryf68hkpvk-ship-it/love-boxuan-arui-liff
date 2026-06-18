const LIFF_ID = '2010440942-oo64INdp';

const API_URL = 'https://script.google.com/macros/s/AKfycbw511Q6AhWsWa2sI1uMpNkwvmyAsN7PB3CoQDoJlqmv7mO5OYP6YWplfNTwnxvwOsPg/exec';

let userId = '';

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

    console.log('LINE UserID:', userId);

  } catch (err) {
    alert('LIFF 初始化失敗：' + err.message);
  }
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

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'addReminder',
      userId: userId,
      task: task,
      remindTime: date + ' ' + time
    })
  });

  alert('❤️ 提醒已建立');

  document.getElementById('task').value = '';
  document.getElementById('date').value = '';
  document.getElementById('time').value = '';
}

init();
