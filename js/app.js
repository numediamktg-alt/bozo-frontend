/**
 * Bozo on the Bus - Frontend JavaScript
 */

// Configuration
// AFTER DEPLOY: Update this URL!
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : 'https://bozo-oracle-production.up.railway.app'; 

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function getReading(question, email = null) {
    const response = await fetch(`${API_BASE}/api/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, email })
    });
    if (!response.ok) throw new Error('Failed to get reading');
    return response.json();
}

async function getConditions() {
    const response = await fetch(`${API_BASE}/api/conditions`);
    if (!response.ok) throw new Error('Failed to get conditions');
    return response.json();
}

async function createCheckout(email) {
    const response = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to create checkout');
    return response.json();
}

async function createPortal(email) {
    const response = await fetch(`${API_BASE}/api/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Failed to create portal');
    return response.json();
}

/**
 * Safe status check (Replaces getUser for subscription checks)
 */
async function getUserStatus(email) {
    const response = await fetch(`${API_BASE}/api/user_status/${encodeURIComponent(email)}`);
    if (!response.ok) {
        if (response.status === 404) return { is_active: false, has_birth_data: false };
        throw new Error('Failed to get status');
    }
    return response.json();
}

async function updateUser(data) {
    const response = await fetch(`${API_BASE}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update user');
    }
    return response.json();
}

// ============================================================================
// PAGE LOGIC
// ============================================================================

function initAskPage() {
    const form = document.getElementById('ask-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = form.querySelector('textarea[name="question"]').value.trim();
        if (!question) return;
        
        showLoading(document.getElementById('reading-result'));
        try {
            const reading = await getReading(question);
            renderReading(document.getElementById('reading-result'), reading);
        } catch (error) {
            showError(document.getElementById('reading-result'), 'The bus hit a bump. Please try again.');
        }
    });
}

function initBusPage() {
    const email = localStorage.getItem('bozo_email');
    if (!email) {
        showLoginForm();
        return;
    }
    checkSubscription(email);
}

/**
 * Uses getUserStatus (Safe) instead of getUser (Protected)
 */
async function checkSubscription(email) {
    const container = document.getElementById('bus-content');
    try {
        const status = await getUserStatus(email);
        
        if (!status.is_active) {
            showSubscribePrompt(container);
            return;
        }
        
        if (!status.has_birth_data) {
            showBirthDataForm(container, email);
            return;
        }
        
        showSubscriberDashboard(container, email);
        
    } catch (error) {
        showError(container, 'Could not verify subscription. Please try again.');
        console.error(error);
    }
}

function showLoginForm() {
    const container = document.getElementById('bus-content');
    container.innerHTML = `
        <div style="max-width: 400px; margin: 0 auto;">
            <h2 style="text-align: center; margin-bottom: 24px;">Welcome Back</h2>
            <form id="login-form">
                <div class="form-group"><label>Email</label><input type="email" id="email" required placeholder="Enter your email"></div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Continue</button>
            </form>
            <p style="text-align: center; margin-top: 24px;"><a href="#" id="subscribe-link">Get on the bus</a></p>
        </div>`;
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        localStorage.setItem('bozo_email', email);
        checkSubscription(email);
    });
    document.getElementById('subscribe-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSubscribePrompt(container);
    });
}

function showSubscribePrompt(container) {
    container.innerHTML = `
        <div style="text-align: center; max-width: 500px; margin: 0 auto;">
            <h2>Get On The Bus</h2>
            <p style="font-size: 1.2rem; margin: 24px 0;">One Alexander Hamilton per month.</p>
            <form id="checkout-form">
                <div class="form-group"><input type="email" name="email" required placeholder="Enter your email" value="${localStorage.getItem('bozo_email') || ''}"></div>
                <button type="submit" class="btn btn-primary">Subscribe - $10/month</button>
            </form>
        </div>`;
    
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[name="email"]').value.trim();
        try {
            const { checkout_url } = await createCheckout(email);
            localStorage.setItem('bozo_email', email);
            window.location.href = checkout_url;
        } catch (error) {
            alert('Could not create checkout.');
        }
    });
}

function showBirthDataForm(container, email) {
    container.innerHTML = `
        <div style="max-width: 500px; margin: 0 auto;">
            <h2 style="text-align: center;">Set Your Frequency</h2>
            <form id="birth-form">
                <div class="form-group"><label>Name</label><input type="text" name="name" placeholder="How should the Driver address you?"></div>
                <div class="form-row">
                    <div class="form-group"><label>Year</label><input type="number" name="birth_year" required placeholder="1975"></div>
                    <div class="form-group"><label>Month</label><input type="number" name="birth_month" required placeholder="5"></div>
                    <div class="form-group"><label>Day</label><input type="number" name="birth_day" required placeholder="15"></div>
                </div>
                <div class="form-group"><label>Time (Local)</label><input type="time" name="birth_time" required></div>
                <div class="form-group"><label>Location</label><input type="text" name="birth_location" placeholder="City, State" required></div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">Save & Get Reading</button>
            </form>
        </div>`;

    document.getElementById('birth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const [h, m] = form.birth_time.value.split(':').map(Number);
        try {
            await updateUser({
                email,
                name: form.name.value,
                birth_year: parseInt(form.birth_year.value),
                birth_month: parseInt(form.birth_month.value),
                birth_day: parseInt(form.birth_day.value),
                birth_hour: h + m/60,
                birth_latitude: 40.7128, 
                birth_longitude: -74.0060
            });
            showSubscriberDashboard(container, email);
        } catch (error) {
            alert('Error saving data.');
        }
    });
}

function showSubscriberDashboard(container, email) {
    container.innerHTML = `
        <div>
            <h2 style="text-align: center;">Welcome Aboard</h2>
            <p style="text-align: center; color: rgba(255,255,255,0.7); margin-bottom: 40px;">${email}</p>
            <form id="reading-form">
                <div class="form-group"><textarea id="question" placeholder="Ask the Driver anything..." rows="4"></textarea></div>
                <button type="submit" class="btn btn-primary">Get My Reading</button>
            </form>
            <div id="reading-result" style="margin-top: 32px;"></div>
            <div style="margin-top: 48px; text-align: center;"><a href="#" id="manage-sub">Manage Subscription</a> | <a href="#" id="logout">Log Out</a></div>
        </div>`;
    
    document.getElementById('reading-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const q = document.getElementById('question').value.trim();
        if (!q) return;
        showLoading(document.getElementById('reading-result'));
        try {
            const reading = await getReading(q, email);
            renderReading(document.getElementById('reading-result'), reading);
        } catch (e) { showError(document.getElementById('reading-result'), 'Error getting reading.'); }
    });

    document.getElementById('manage-sub').addEventListener('click', async (e) => {
        e.preventDefault();
        try { const { portal_url } = await createPortal(email); window.location.href = portal_url; } catch (e) { alert('Error opening portal'); }
    });

    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('bozo_email');
        window.location.reload();
    });

    loadConditions();
}

function showLoading(container) {
    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div><p>Consulting the oracle...</p></div>`;
}

function showError(container, message) {
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

function renderReading(container, reading) {
    let html = `
        <div class="oracle-card">
            <div class="quote">${reading.quote}</div>
            <div class="meta">Written ${reading.quote_date} <span class="resonance">${Math.round(reading.similarity * 100)}% resonance</span></div>`;
    
    if (reading.interpretation && reading.interpretation.trim()) {
        html += `<div class="interpretation">${reading.interpretation.replace(/\n/g, '<br>')}</div>`;
    }
    html += '</div>';
    if (reading.conditions) html += renderConditions(reading.conditions);
    container.innerHTML = html;
}

function renderConditions(conditions) {
    return `
        <div class="conditions-card">
            <h3>Today's Transmission Conditions</h3>
            <div class="conditions-grid">
                <div class="condition-item"><div class="label">H5</div><div class="value">${conditions.h5_gain.toFixed(2)}x</div><div class="sublabel">Creative Intelligence</div></div>
                <div class="condition-item"><div class="label">H7</div><div class="value">${conditions.h7_gain.toFixed(2)}x</div><div class="sublabel">Consecration</div></div>
                <div class="condition-item"><div class="label">H10</div><div class="value">${conditions.h10_gain.toFixed(2)}x</div><div class="sublabel">Mastery</div></div>
                <div class="condition-item"><div class="label">Mode</div><div class="value">${conditions.conditions_label}</div><div class="sublabel">${conditions.operating_mode}</div></div>
            </div>
        </div>`;
}

async function loadConditions() {
    try {
        const c = await getConditions();
        const el = document.getElementById('reading-result');
        if (el && el.innerHTML === '') el.innerHTML = renderConditions(c);
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ask-form')) initAskPage();
    if (document.getElementById('bus-content')) initBusPage();
});
