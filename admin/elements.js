// Elements Browser Admin Panel
if (window.elementsJsLoaded) {
    throw new Error('elements.js already loaded');
}
window.elementsJsLoaded = true;

let elementsList = [];
let filteredElements = [];
let currentPage = 1;
let currentLetter = 'all';
let searchQuery = '';
let tierFilter = '';

const ELEMENTS_PER_PAGE = 100;

// Navigation state preservation - make it global so admin.js can access it
window.navigationState = {
    scrollPosition: 0,
    currentPage: 1,
    currentLetter: 'all',
    searchQuery: '',
    tierFilter: ''
};

document.addEventListener('DOMContentLoaded', async function() {
    if (window.elementsGridInitialized) {
        return;
    }
    
    if (document.querySelector('script[src="admin.js"]')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.combinations && Object.keys(window.combinations).length > 0) {
            elementsList = Object.values(window.elements);
            elementsList.sort((a, b) => a.name.localeCompare(b.name));
            document.getElementById('total-elements').textContent = elementsList.length;
            setupEventListeners();
            initAlphabetNav();
            filterAndDisplay();
            window.elementsGridInitialized = true;
            return;
        }
    }
    
    window.elementsGridInitialized = true;
    
    await loadData();
    setupEventListeners();
    initAlphabetNav();
    filterAndDisplay();
});

async function loadData() {
    try {
        elementsList = [];
        
        if (typeof window.elements !== 'undefined' && Object.keys(window.elements).length > 0) {
            elementsList = Object.values(window.elements);
        } else {
            const elementsResponse = await fetch('/elements/data/elements.json');
            const elementsData = await elementsResponse.json();
            
            if (typeof elements === 'undefined') {
                window.elements = {};
            }
            
            elementsData.forEach(elem => {
                const element = {
                    id: elem.i,
                    name: elem.n,
                    tier: elem.t,
                    emojiIndex: elem.e
                };
                window.elements[elem.i] = element;
                elementsList.push(element);
            });
        }
        
        elementsList.sort((a, b) => a.name.localeCompare(b.name));
        
        
        if (typeof window.emojis === 'undefined' || Object.keys(window.emojis).length === 0) {
            try {
                if (typeof emojis === 'undefined') {
                    window.emojis = {};
                }
                const timestamp = Date.now();
                const emojiResponse = await fetch(`/elements/data/emojis.json?t=${timestamp}&cb=${Math.random()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                window.emojis = await emojiResponse.json();
                console.log('[Elements Cache Debug] Loaded', Object.keys(window.emojis).length, 'emoji mappings');
            } catch (err) {
                console.warn('Failed to load emojis:', err);
            }
        }
        
        document.getElementById('total-elements').textContent = elementsList.length;
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load elements data', 'error');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search');
    if (searchInput && !searchInput.hasAttribute('data-admin-search')) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const value = e.target.value.trim();
                // Don't lowercase if it's an emoji
                searchQuery = /\p{Emoji}/u.test(value) ? value : value.toLowerCase();
                currentPage = 1;
                filterAndDisplay();
            }, 300);
        });
    }
    
    const tierFilter = document.getElementById('tier-filter');
    if (tierFilter) {
        tierFilter.addEventListener('change', function(e) {
            window.tierFilter = e.target.value;
            currentPage = 1;
            filterAndDisplay();
        });
    }
}

function initAlphabetNav() {
    const nav = document.getElementById('alphabet-nav');
    
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.dataset.letter = letter;
        btn.textContent = letter;
        btn.addEventListener('click', () => selectLetter(letter));
        nav.appendChild(btn);
    }
    
    const numBtn = document.createElement('button');
    numBtn.className = 'letter-btn';
    numBtn.dataset.letter = '0-9';
    numBtn.textContent = '0-9';
    numBtn.addEventListener('click', () => selectLetter('0-9'));
    nav.appendChild(numBtn);
}

function selectLetter(letter) {
    currentLetter = letter;
    currentPage = 1;
    
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.letter === letter);
    });
    
    document.getElementById('current-letter').textContent = letter === 'all' ? 'All' : letter;
    
    filterAndDisplay();
}

function filterAndDisplay() {
    filteredElements = elementsList.filter(elem => {
        if (currentLetter !== 'all') {
            const firstChar = elem.name.charAt(0).toUpperCase();
            if (currentLetter === '0-9') {
                if (!/\d/.test(firstChar)) return false;
            } else {
                if (firstChar !== currentLetter) return false;
            }
        }
        
        if (searchQuery) {
            // Check if search query is an emoji
            const isEmoji = /\p{Emoji}/u.test(searchQuery);
            if (isEmoji) {
                const elemEmoji = emojis[elem.id] || emojis[elem.emojiIndex];
                if (elemEmoji !== searchQuery) return false;
            } else {
                const matchesName = elem.name.toLowerCase().includes(searchQuery);
                const matchesId = elem.id.toString().includes(searchQuery);
                if (!matchesName && !matchesId) return false;
            }
        }
        
        if (tierFilter !== '' && elem.tier !== parseInt(tierFilter)) {
            return false;
        }
        
        return true;
    });
    
    document.getElementById('filtered-elements').textContent = filteredElements.length;
    
    displayPage();
}

function displayPage() {
    const grid = document.getElementById('elements-grid');
    const totalPages = Math.ceil(filteredElements.length / ELEMENTS_PER_PAGE);
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * ELEMENTS_PER_PAGE;
    const endIndex = startIndex + ELEMENTS_PER_PAGE;
    const pageElements = filteredElements.slice(startIndex, endIndex);
    
    grid.innerHTML = '';
    
    if (pageElements.length === 0) {
        grid.innerHTML = '<div class="loading">No elements found</div>';
        updatePagination(0);
        return;
    }
    
    pageElements.forEach(elem => {
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
        
        const card = document.createElement('div');
        card.className = 'element-card';
        card.onclick = () => {
            // Save current navigation state
            window.navigationState.scrollPosition = window.scrollY;
            window.navigationState.currentPage = currentPage;
            window.navigationState.currentLetter = currentLetter;
            window.navigationState.searchQuery = searchQuery;
            window.navigationState.tierFilter = tierFilter;
            
            document.getElementById('elements-grid').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
            if (typeof showElement === 'function') {
                showElement(elem.id);
            }
        };
        
        card.innerHTML = `
            <div class="element-emoji">${emoji}</div>
            <div class="element-name">${elem.name}</div>
            <div class="element-info">
                ID: ${elem.id} | Tier: ${elem.tier || 'N/A'}
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    updatePagination(totalPages);
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    pagination.innerHTML = `
        <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>First</button>
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        
        <div class="page-info">
            Page <input type="number" id="page-input" value="${currentPage}" min="1" max="${totalPages}" 
                onchange="goToPage(parseInt(this.value))"> of ${totalPages}
        </div>
        
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Last</button>
    `;
}

window.goToPage = function(page) {
    const totalPages = Math.ceil(filteredElements.length / ELEMENTS_PER_PAGE);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    currentPage = page;
    displayPage();
    
    window.scrollTo(0, 0);
};

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type} active`;
    
    setTimeout(() => {
        msg.classList.remove('active');
    }, 3000);
}

// Emoji filter functionality
let selectedEmoji = null;

function showEmojiFilter() {
    const modal = document.getElementById('emoji-filter-modal');
    const emojiGrid = document.getElementById('emoji-grid');
    
    // Count emoji usage
    const emojiUsage = {};
    elementsList.forEach(elem => {
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex];
        if (emoji) {
            emojiUsage[emoji] = (emojiUsage[emoji] || 0) + 1;
        }
    });
    
    // Sort emojis by usage count
    const sortedEmojis = Object.entries(emojiUsage)
        .sort((a, b) => b[1] - a[1]); // Show all emojis
    
    // Create emoji grid
    emojiGrid.innerHTML = sortedEmojis.map(([emoji, count]) => `
        <div class="emoji-item ${selectedEmoji === emoji ? 'selected' : ''}" onclick="selectEmoji('${emoji}')">
            <div class="emoji-char">${emoji}</div>
            <div class="emoji-count">${count}</div>
        </div>
    `).join('');
    
    modal.classList.add('active');
}

function closeEmojiFilter() {
    const modal = document.getElementById('emoji-filter-modal');
    modal.classList.remove('active');
}

function selectEmoji(emoji) {
    if (selectedEmoji === emoji) {
        selectedEmoji = null;
    } else {
        selectedEmoji = emoji;
    }
    
    // Update search input
    const searchInput = document.getElementById('search');
    searchInput.value = selectedEmoji || '';
    
    // Trigger search
    searchQuery = selectedEmoji || '';
    currentPage = 1;
    filterAndDisplay();
    
    // Update visual selection
    document.querySelectorAll('.emoji-item').forEach(item => {
        const itemEmoji = item.querySelector('.emoji-char').textContent;
        item.classList.toggle('selected', itemEmoji === selectedEmoji);
    });
}

function clearEmojiFilter() {
    selectedEmoji = null;
    const searchInput = document.getElementById('search');
    searchInput.value = '';
    searchQuery = '';
    currentPage = 1;
    filterAndDisplay();
    closeEmojiFilter();
}

// Make functions global
window.showEmojiFilter = showEmojiFilter;
window.closeEmojiFilter = closeEmojiFilter;
window.selectEmoji = selectEmoji;
window.clearEmojiFilter = clearEmojiFilter;

