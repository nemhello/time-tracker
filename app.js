// State management
let activeEntry = null;
let timerInterval = null;
let entries = [];
let selectedCategory = null;
let selectedLocation = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if CATEGORIES loaded
    if (typeof CATEGORIES === 'undefined') {
        console.error('CRITICAL: CATEGORIES not loaded!');
        alert('ERROR: Location data failed to load. Please refresh the page.');
        return;
    }
    console.log('✓ CATEGORIES loaded:', Object.keys(CATEGORIES).length, 'categories');
    
    // Force back button hidden on init
    setTimeout(() => {
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.classList.add('hidden');
            console.log('✓ Back button hidden');
        }
        
        // Ensure search results are hidden on init
        const searchResults = document.getElementById('globalSearchResults');
        if (searchResults) {
            searchResults.classList.add('hidden');
            searchResults.innerHTML = '';
            console.log('✓ Search results cleared');
        }
    }, 100);
    
    loadEntries();
    renderCategories();
    renderEntries();
    updateCurrentDate();
    setupEventListeners();
    checkActiveEntry();
});

function setupEventListeners() {
    // Global search
    document.getElementById('globalSearchBox').addEventListener('input', (e) => {
        handleGlobalSearch(e.target.value);
    });
    
    // Clear search button
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Navigation buttons
    document.getElementById('backBtn').addEventListener('click', backToCategories);
    document.getElementById('backFromDetailsBtn').addEventListener('click', backFromDetails);
    
    // Timer buttons
    document.getElementById('emailStartBtn').addEventListener('click', emailDispatchStart);
    document.getElementById('startTimerBtn').addEventListener('click', confirmStartTimer);
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportEntries);
}

// Global Search
function handleGlobalSearch(searchTerm) {
    const results = document.getElementById('globalSearchResults');
    const categoryList = document.getElementById('categoryList');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    console.log('=== SEARCH CALLED ===');
    console.log('1. Search term:', searchTerm);
    console.log('2. Results div:', results ? 'EXISTS' : 'NULL');
    console.log('3. Results classes:', results ? results.className : 'N/A');
    
    // Clear search
    if (!searchTerm || searchTerm.trim() === '') {
        console.log('4. Empty search - hiding results');
        results.classList.add('hidden');
        results.innerHTML = '';
        categoryList.style.display = 'grid';
        clearBtn.classList.add('hidden');
        return;
    }
    
    // Show results area
    console.log('4. Non-empty search - showing results area');
    categoryList.style.display = 'none';
    results.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    console.log('5. Results classes after unhide:', results.className);
    
    // Check if CATEGORIES exists
    if (typeof CATEGORIES === 'undefined') {
        console.error('6. ERROR: CATEGORIES undefined');
        results.innerHTML = '<div class="no-entries" style="color: red; padding: 20px;">ERROR: Location data not loaded. Please refresh the page.</div>';
        return;
    }
    
    if (typeof CATEGORIES !== 'object' || CATEGORIES === null) {
        console.error('6. ERROR: CATEGORIES invalid type:', typeof CATEGORIES);
        results.innerHTML = '<div class="no-entries" style="color: red; padding: 20px;">ERROR: Location data is invalid.</div>';
        return;
    }
    
    console.log('6. CATEGORIES OK - starting search');
    
    // Search all categories
    const allMatches = [];
    const term = searchTerm.toLowerCase().trim();
    
    try {
        for (const [categoryName, locations] of Object.entries(CATEGORIES)) {
            if (!Array.isArray(locations)) {
                console.warn(`Category "${categoryName}" is not an array`);
                continue;
            }
            
            const matches = locations.filter(loc => {
                if (!loc || !loc.name || !loc.chargeCode) {
                    return false;
                }
                return loc.name.toLowerCase().includes(term) ||
                       loc.chargeCode.toLowerCase().includes(term);
            });
            
            if (matches.length > 0) {
                console.log(`   - "${categoryName}": ${matches.length} matches`);
            }
            
            matches.forEach(loc => {
                allMatches.push({
                    name: loc.name,
                    chargeCode: loc.chargeCode,
                    address: loc.address || '',
                    category: categoryName
                });
            });
        }
    } catch (error) {
        console.error('7. SEARCH ERROR:', error);
        results.innerHTML = '<div class="no-entries" style="color: red; padding: 20px;">ERROR: Search failed - ' + error.message + '</div>';
        return;
    }
    
    console.log('7. Total matches found:', allMatches.length);
    
    // Show results
    if (allMatches.length === 0) {
        console.log('8. No matches - setting "not found" message');
        results.innerHTML = '<div class="no-entries" style="padding: 40px 20px; text-align: center; color: #6b7280; background: white; border-radius: 12px; margin: 20px;">No locations found for "<strong>' + escapeHtml(searchTerm) + '</strong>"<br><br>Try searching by location name or charge code</div>';
        console.log('9. Message set, innerHTML length:', results.innerHTML.length);
        return;
    }
    
    // Render results
    console.log('8. Rendering', allMatches.length, 'results');
    try {
        const html = allMatches.map(loc => {
            const safeName = escapeHtml(loc.name);
            const safeCode = escapeHtml(loc.chargeCode);
            const safeAddress = escapeHtml(loc.address);
            const safeCategory = escapeHtml(loc.category);
            
            return `
                <div class="location-item" onclick="showLocationDetails('${safeName}', '${safeCode}', '${safeAddress}', '${safeCategory}')">
                    <div class="loc-name">${loc.name}</div>
                    <div class="loc-code">${loc.chargeCode}</div>
                    <div class="loc-category">${loc.category}</div>
                </div>
            `;
        }).join('');
        
        results.innerHTML = html;
        console.log('9. HTML set, length:', html.length);
        console.log('10. Results innerHTML now:', results.innerHTML.length, 'characters');
        console.log('11. SEARCH COMPLETE');
    } catch (error) {
        console.error('9. RENDER ERROR:', error);
        results.innerHTML = '<div class="no-entries" style="color: red; padding: 20px;">ERROR: Could not display results - ' + error.message + '</div>';
    }
}

function clearSearch() {
    document.getElementById('globalSearchBox').value = '';
    document.getElementById('globalSearchResults').innerHTML = '';
    document.getElementById('globalSearchResults').classList.add('hidden');
    document.getElementById('categoryList').style.display = 'grid';
    document.getElementById('clearSearchBtn').classList.add('hidden');
}

// Category Management
function renderCategories() {
    const list = document.getElementById('categoryList');
    const categories = Object.keys(CATEGORIES);
    
    list.innerHTML = categories.map(category => {
        const count = CATEGORIES[category].length;
        return `
            <div class="category-item" onclick="selectCategory('${escapeHtml(category)}')">
                <div class="category-name">${category}</div>
                <div class="category-count">${count} location${count !== 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

function selectCategory(category) {
    selectedCategory = category;
    document.getElementById('globalSearchSection').classList.add('hidden');
    document.getElementById('categorySelection').classList.add('hidden');
    document.getElementById('locationSelection').classList.remove('hidden');
    renderLocationList();
}

function backToCategories() {
    selectedCategory = null;
    document.getElementById('globalSearchBox').value = '';
    document.getElementById('globalSearchResults').innerHTML = '';
    document.getElementById('globalSearchResults').classList.add('hidden');
    document.getElementById('categoryList').style.display = 'grid';
    document.getElementById('locationSelection').classList.add('hidden');
    document.getElementById('globalSearchSection').classList.remove('hidden');
    document.getElementById('categorySelection').classList.remove('hidden');
}

// Location List
function renderLocationList() {
    const list = document.getElementById('locationList');
    
    if (!selectedCategory) {
        list.innerHTML = '';
        return;
    }
    
    const locations = CATEGORIES[selectedCategory] || [];
    
    if (locations.length === 0) {
        list.innerHTML = '<div class="no-entries">No locations in this category</div>';
        return;
    }
    
    list.innerHTML = locations.map(loc => `
        <div class="location-item" onclick="showLocationDetails('${escapeHtml(loc.name)}', '${escapeHtml(loc.chargeCode)}', '${escapeHtml(loc.address || '')}', '${escapeHtml(selectedCategory)}')">
            <div class="loc-name">${loc.name}</div>
            <div class="loc-code">${loc.chargeCode}</div>
            ${loc.address && loc.address.trim() !== '' ? `<div class="loc-address">${loc.address}</div>` : ''}
        </div>
    `).join('');
}

// Location Details
function showLocationDetails(locationName, chargeCode, address, category) {
    selectedLocation = {
        name: locationName,
        chargeCode: chargeCode,
        address: address,
        category: category
    };
    
    document.getElementById('detailsLocation').textContent = locationName;
    document.getElementById('detailsChargeCode').textContent = chargeCode;
    
    const addressEl = document.getElementById('detailsAddress');
    if (address && address.trim() !== '') {
        addressEl.innerHTML = `<a href="http://maps.apple.com/?q=${encodeURIComponent(address)}" target="_blank">📍 ${address}</a>`;
        addressEl.style.display = 'block';
    } else {
        addressEl.style.display = 'none';
    }
    
    // Hide other views
    document.getElementById('globalSearchSection').classList.add('hidden');
    document.getElementById('categorySelection').classList.add('hidden');
    document.getElementById('locationSelection').classList.add('hidden');
    document.getElementById('locationDetails').classList.remove('hidden');
}

function backFromDetails() {
    document.getElementById('locationDetails').classList.add('hidden');
    
    if (selectedCategory) {
        document.getElementById('locationSelection').classList.remove('hidden');
    } else {
        document.getElementById('globalSearchSection').classList.remove('hidden');
        document.getElementById('categorySelection').classList.remove('hidden');
    }
}

// Email Functions
function emailDispatchStart() {
    if (!selectedLocation) return;
    
    const subject = encodeURIComponent(selectedLocation.chargeCode);
    const body = encodeURIComponent(`Please open a ticket to start work at ${selectedLocation.name}`);
    const mailto = `mailto:dispatch@motorolasolutions.com?subject=${subject}&body=${body}`;
    
    window.location.href = mailto;
}

function emailDispatchStop() {
    if (!activeEntry) return;
    
    const subject = encodeURIComponent(activeEntry.chargeCode);
    const body = encodeURIComponent(`All work at ${activeEntry.location} is finished, please close this ticket.`);
    const mailto = `mailto:dispatch@motorolasolutions.com?subject=${subject}&body=${body}`;
    
    window.location.href = mailto;
}

// Timer Functions
function confirmStartTimer() {
    if (!selectedLocation) return;
    startTimer(selectedLocation.name, selectedLocation.chargeCode, selectedLocation.address);
}

function startTimer(locationName, chargeCode, address = '') {
    if (activeEntry) {
        alert('Stop current timer first');
        return;
    }
    
    const now = new Date();
    activeEntry = {
        id: Date.now(),
        location: locationName,
        chargeCode: chargeCode,
        address: address,
        startTime: now.toISOString(),
        endTime: null,
        notes: ''
    };
    
    saveActiveEntry();
    showActiveTimer();
    startTimerDisplay();
    
    // Clear and focus notes field
    document.getElementById('notesField').value = '';
}

function stopTimer() {
    if (!activeEntry) return;
    
    // First send the closing email
    emailDispatchStop();
    
    // Then stop the timer after a brief delay to allow email to open
    setTimeout(() => {
        activeEntry.endTime = new Date().toISOString();
        activeEntry.notes = document.getElementById('notesField').value.trim();
        entries.push(activeEntry);
        saveEntries();
        
        activeEntry = null;
        localStorage.removeItem('activeEntry');
        
        hideActiveTimer();
        stopTimerDisplay();
        renderEntries();
    }, 100);
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
    
    // Setup address link for Apple Maps - only if address exists
    const addressEl = document.getElementById('activeAddress');
    if (activeEntry.address && activeEntry.address.trim() !== '') {
        addressEl.textContent = '📍 ' + activeEntry.address;
        addressEl.href = 'http://maps.apple.com/?q=' + encodeURIComponent(activeEntry.address);
        addressEl.style.display = 'block';
    } else {
        addressEl.style.display = 'none';
    }
    
    // Restore notes if resuming timer
    document.getElementById('notesField').value = activeEntry.notes || '';
    
    document.getElementById('activeTimer').classList.remove('hidden');
    document.getElementById('globalSearchSection').classList.add('hidden');
    document.getElementById('categorySelection').classList.add('hidden');
    document.getElementById('locationSelection').classList.add('hidden');
    document.getElementById('locationDetails').classList.add('hidden');
}

function hideActiveTimer() {
    document.getElementById('activeTimer').classList.add('hidden');
    document.getElementById('globalSearchSection').classList.remove('hidden');
    document.getElementById('categorySelection').classList.remove('hidden');
    document.getElementById('locationSelection').classList.add('hidden');
    document.getElementById('locationDetails').classList.add('hidden');
    selectedCategory = null;
    selectedLocation = null;
    document.getElementById('globalSearchBox').value = '';
}

// Entry Management
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
                    ${entry.notes ? `<div class="entry-notes"><strong>Notes:</strong> ${entry.notes}</div>` : ''}
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
        
        text += `Location: ${entry.location}\n`;
        text += `Start: ${formatTime(start)}\n`;
        text += `Stop: ${formatTime(end)}\n`;
        if (entry.notes) {
            text += `Notes: ${entry.notes}\n`;
        }
        text += `\n`;
    });
    
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
        
        // Auto-save notes as user types
        document.getElementById('notesField').addEventListener('input', (e) => {
            if (activeEntry) {
                activeEntry.notes = e.target.value;
                saveActiveEntry();
            }
        });
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
