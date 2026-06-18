const API_URL = 'https://script.google.com/macros/s/AKfycbycW_xKCct94r2mQFw5rz4A_Isi209uY_m6WLsxTQyOKXEGT_X_dR0KJPHpKKp7QzSZ/exec';

async function createReminder(){

  const task = document.getElementById('task').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  const remindTime = `${date} ${time}`;

  const res = await fetch(API_URL,{
    method:'POST',
    headers:{
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      action:'addReminder',
      task,
      remindTime
    })
  });

  alert('❤️ 提醒已建立');
}
