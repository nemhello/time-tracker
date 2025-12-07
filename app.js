// State management
let activeEntry = null;
let timerInterval = null;
let entries = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    renderLocationList();
    renderEntries();
    updateCurrentDate();
    setupEventListeners();
    checkActiveEntry();
});

function setupEventListeners() {
    document.getElementById('searchBox').addEventListener('input', (e) => {
        renderLocationList(e.target.value);
    });
    
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    document.getElementById('exportBtn').addEventListener('click', exportEntries);
}

function renderLocationList(searchTerm = '') {
    const list = document.getElementById('locationList');
    const filtered = LOCATIONS.filter(loc => 
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.chargeCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    list.innerHTML = filtered.map(loc => `
        <div class="location-item" onclick="startTimer('${loc.name}', '${loc.chargeCode}')">
            <div class="loc-name">${loc.name}</div>
            <div class="loc-code">${loc.chargeCode}</div>
        </div>
    `).join('');
}

function startTimer(locationName, chargeCode) {
    if (activeEntry) {
        alert('Stop current timer first');
        return;
    }
    
    const now = new Date();
    activeEntry = {
        id: Date.now(),
        location: locationName,
        chargeCode: chargeCode,
        startTime: now.toISOString(),
        endTime: null
    };
    
    saveActiveEntry();
    showActiveTimer();
    startTimerDisplay();
}

function stopTimer() {
    if (!activeEntry) return;
    
    activeEntry.endTime = new Date().toISOString();
    entries.push(activeEntry);
    saveEntries();
    
    activeEntry = null;
    localStorage.removeItem('activeEntry');
    
    hideActiveTimer();
    stopTimerDisplay();
    renderEntries();
}

function startTimerDisplay() {
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}

function stopTimerDisplay() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    if (!activeEntry) return;
    
    const start = new Date(activeEntry.startTime);
    const now = new Date();
    const diff = now - start;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('timerDisplay').textContent = 
        `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function showActiveTimer() {
    document.getElementById('activeLocation').textContent = activeEntry.location;
    document.getElementById('activeChargeCode').textContent = activeEntry.chargeCode;
    document.getElementById('activeTimer').classList.remove('hidden');
    document.getElementById('locationSelection').classList.add('hidden');
}

function hideActiveTimer() {
    document.getElementById('activeTimer').classList.add('hidden');
    document.getElementById('locationSelection').classList.remove('hidden');
}

function renderEntries() {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(e => 
        new Date(e.startTime).toDateString() === today
    );
    
    const list = document.getElementById('entriesList');
    
    if (todayEntries.length === 0) {
        list.innerHTML = '<div class="no-entries">No entries today</div>';
        document.getElementById('totalHours').textContent = '';
        return;
    }
    
    list.innerHTML = todayEntries.map(entry => {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        const duration = formatDuration(end - start);
        
        return `
            <div class="entry-card">
                <div class="entry-header">
                    <div>
                        <div class="entry-location">${entry.location}</div>
                        <div class="entry-code">${entry.chargeCode}</div>
                    </div>
                    <button onclick="deleteEntry(${entry.id})" class="btn-delete">✕</button>
                </div>
                <div class="entry-times">
                    <div>
                        <strong>Start:</strong> ${formatTime(start)}
                        <button onclick="editTime(${entry.id}, 'start')" class="btn-edit">✎</button>
                    </div>
                    <div>
                        <strong>End:</strong> ${formatTime(end)}
                        <button onclick="editTime(${entry.id}, 'end')" class="btn-edit">✎</button>
                    </div>
                    <div><strong>Duration:</strong> ${duration}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Calculate total hours
    const totalMs = todayEntries.reduce((sum, e) => {
        return sum + (new Date(e.endTime) - new Date(e.startTime));
    }, 0);
    
    document.getElementById('totalHours').innerHTML = 
        `<strong>Total Today: ${formatDuration(totalMs)}</strong>`;
}

function deleteEntry(id) {
    if (!confirm('Delete this entry?')) return;
    entries = entries.filter(e => e.id !== id);
    saveEntries();
    renderEntries();
}

function editTime(id, type) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    const currentTime = new Date(type === 'start' ? entry.startTime : entry.endTime);
    const timeStr = prompt(
        `Edit ${type} time (HH:MM format, 24hr):`,
        formatTime(currentTime)
    );
    
    if (!timeStr) return;
    
    const [hours, minutes] = timeStr.split(':').map(n => parseInt(n));
    if (isNaN(hours) || isNaN(minutes)) {
        alert('Invalid time format');
        return;
    }
    
    const newDate = new Date(currentTime);
    newDate.setHours(hours, minutes, 0, 0);
    
    if (type === 'start') {
        entry.startTime = newDate.toISOString();
    } else {
        entry.endTime = newDate.toISOString();
    }
    
    saveEntries();
    renderEntries();
}

function exportEntries() {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(e => 
        new Date(e.startTime).toDateString() === today
    );
    
    if (todayEntries.length === 0) {
        alert('No entries to export');
        return;
    }
    
    let text = `TIME CARD - ${today}\n\n`;
    
    todayEntries.forEach(entry => {
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        const duration = formatDuration(end - start);
        
        text += `Location: ${entry.location}\n`;
        text += `Charge Code: ${entry.chargeCode}\n`;
        text += `Start: ${formatTime(start)}\n`;
        text += `End: ${formatTime(end)}\n`;
        text += `Duration: ${duration}\n\n`;
    });
    
    const totalMs = todayEntries.reduce((sum, e) => 
        sum + (new Date(e.endTime) - new Date(e.startTime)), 0
    );
    text += `TOTAL: ${formatDuration(totalMs)}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(() => {
        // Fallback - show in alert
        alert(text);
    });
}

// Storage functions
function saveEntries() {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
}

function loadEntries() {
    const stored = localStorage.getItem('timeEntries');
    entries = stored ? JSON.parse(stored) : [];
}

function saveActiveEntry() {
    localStorage.setItem('activeEntry', JSON.stringify(activeEntry));
}

function checkActiveEntry() {
    const stored = localStorage.getItem('activeEntry');
    if (stored) {
        activeEntry = JSON.parse(stored);
        showActiveTimer();
        startTimerDisplay();
    }
}

// Utility functions
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

function pad(num) {
    return String(num).padStart(2, '0');
}

function updateCurrentDate() {
    const date = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('currentDate').textContent = date;
}
