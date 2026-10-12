const message = document.querySelector('#message');
const userTable = document.querySelector('#users-table');

function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? 'error' : 'success';
}

async function postJSON(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return {ok: response.ok, body: await response.json()};
}


document.querySelector('#register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const {ok, body} = await postJSON('/api/register', data);
    if (ok) {
        showMessage(`สร้างผู้ใช้ ${body.username} สำเร็จ`);
        form.reset();
        loadUsers();
    } else {
        showMessage(body.error, true);
    }
});


document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const {ok, body} = await postJSON('/api/login', data);
    if (ok) {
        showMessage(`เข้าสู่ระบบสำเร็จ: ${body.user.name} (${body.user.username})`);
    } else {
        showMessage(body.error, true);
    }
});

async function loadUsers() {
    const res = await fetch('/api/users');
    const users = await res.json();
    userTable.innerHTML = '';
    for (const user of users){
        const tr = document.createElement('tr');
        for (const value of [user.username, user.name, user.email, user.role]){
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        }
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'ลบ';
        deleteBtn.addEventListener('click', () => deleteUser(user.username));
        const td = document.createElement('td');
        td.appendChild(deleteBtn);
        tr.appendChild(td);
        userTable.appendChild(tr);
    }
    
}

async function deleteUser(username) {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${username}?`)) {
        return;
    }
    const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
    if (res.ok) {
        showMessage(`ลบผู้ใช้ ${username} สำเร็จ`);
        loadUsers();
    }
}

loadUsers();