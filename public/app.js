const API_BASE = '/api';
let currentUser = null;
let isRegister = false;

// DOM Elements
const authView = document.getElementById('auth-view');
const studentView = document.getElementById('student-view');
const adminView = document.getElementById('admin-view');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const navActions = document.getElementById('nav-actions');

// Toggle between Login and Register
toggleAuth.addEventListener('click', () => {
    isRegister = !isRegister;
    document.getElementById('auth-title').innerText = isRegister ? 'Create Account' : 'Welcome Back';
    document.getElementById('register-fields').style.display = isRegister ? 'block' : 'none';
    authBtn.innerText = isRegister ? 'Register' : 'Login';
    toggleAuth.innerText = isRegister ? 'Already have an account? Login' : "Don't have an account? Register";
});

// Auth Logic
authBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const endpoint = isRegister ? '/register' : '/login';
    const body = isRegister ? { username, password, role } : { username, password };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (data.user) {
            currentUser = data.user;
            showDashboard();
        } else if (data.userId) {
            alert('Registration successful! Please login.');
            toggleAuth.click();
        } else {
            alert('Error: ' + (data.error || 'Invalid credentials'));
        }
    } catch (err) {
        alert('Server Error: Make sure your Node.js server is running!');
    }
});

function showDashboard() {
    authView.style.display = 'none';
    navActions.innerHTML = `<span style="margin-right: 15px; color: var(--text-muted)">Welcome, ${currentUser.username}</span>
                             <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.8rem;" onclick="logout()">Logout</button>`;
    
    if (currentUser.role === 'admin') {
        adminView.style.display = 'block';
        loadAdminApplications();
    } else {
        studentView.style.display = 'grid';
        loadMyApplications();
    }
}

function logout() {
    currentUser = null;
    location.reload();
}

// Student Logic
async function submitApplication() {
    const studentName = document.getElementById('student_name').value;
    const collegeId = document.getElementById('college_id').value;
    const route = document.getElementById('route').value;
    const fee = 450.00;

    const res = await fetch(`${API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, studentName, collegeId, route, fee })
    });
    const data = await res.json();
    if (data.applicationId) {
        alert('Application submitted successfully!');
        loadMyApplications();
    }
}

async function loadMyApplications() {
    const res = await fetch(`${API_BASE}/applications/${currentUser.id}`);
    const apps = await res.json();
    const container = document.getElementById('my-apps');
    container.innerHTML = apps.map(app => `
        <div class="glass" style="padding: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="color: var(--primary)">${app.route}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted)">ID: ${app.college_id} | Status: <span style="color: ${getStatusColor(app.status)}">${app.status.toUpperCase()}</span></p>
            </div>
            ${app.status === 'approved' ? `<button class="btn" style="background: rgba(255,255,255,0.1)" onclick='viewPass(${JSON.stringify(app)})'>View Pass</button>` : ''}
        </div>
    `).join('');
}

// Admin Logic
async function loadAdminApplications() {
    const res = await fetch(`${API_BASE}/admin/applications`);
    const apps = await res.json();
    const container = document.getElementById('admin-apps');
    container.innerHTML = apps.map(app => `
        <div class="glass" style="padding: 24px;">
            <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 5px;">${app.student_name}</h4>
                <p style="color: var(--text-muted); font-size: 0.8rem;">Route: ${app.route}</p>
                <p style="color: var(--text-muted); font-size: 0.8rem;">Status: <span style="color: ${getStatusColor(app.status)}">${app.status.toUpperCase()}</span></p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" style="flex: 1; padding: 10px; font-size: 0.8rem; background: var(--success);" onclick="updateStatus(${app.id}, 'approved')">Approve</button>
                <button class="btn btn-primary" style="flex: 1; padding: 10px; font-size: 0.8rem; background: var(--danger);" onclick="updateStatus(${app.id}, 'rejected')">Reject</button>
            </div>
        </div>
    `).join('');
}

async function updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/admin/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    const data = await res.json();
    alert(data.message);
    loadAdminApplications();
}

// Helpers
function getStatusColor(status) {
    if (status === 'approved') return 'var(--success)';
    if (status === 'rejected') return 'var(--danger)';
    return 'var(--warning)';
}

function viewPass(app) {
    const content = `
        <div style="background: white; color: black; padding: 20px; border-radius: 12px; border: 4px solid var(--primary);">
            <div style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                <h2 style="color: var(--primary); margin: 0;">MADURAI BUS PASS</h2>
                <p style="font-size: 0.8rem; color: #666;">TNSTC - Madurai Division | Academic Year 2026</p>
            </div>
            <div style="text-align: left;">
                <p><strong>NAME:</strong> ${app.student_name}</p>
                <p><strong>COLLEGE ID:</strong> ${app.college_id}</p>
                <p><strong>ROUTE:</strong> ${app.route}</p>
                <p><strong>FEE PAID:</strong> ₹${app.fee}.00</p>
            </div>
            <div style="margin-top: 20px; padding: 10px; background: #f8fafc; font-weight: bold; letter-spacing: 2px;">
                MDU-TN-${app.id}-${Math.floor(Math.random()*999)}
            </div>
        </div>
    `;
    document.getElementById('pass-content').innerHTML = content;
    document.getElementById('pass-modal').style.display = 'block';
}

function closePass() {
    document.getElementById('pass-modal').style.display = 'none';
}
