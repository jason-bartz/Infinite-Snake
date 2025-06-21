// Elements Browser Admin Panel
// Prevent double loading
if (window.elementsJsLoaded) {
    console.log('elements.js already loaded, skipping...');
    throw new Error('elements.js already loaded');
}
window.elementsJsLoaded = true;

// These will be shared with admin.js
let elementsList = [];
let filteredElements = [];
let currentPage = 1;
let currentLetter = 'all';
let searchQuery = '';
let tierFilter = '';

const ELEMENTS_PER_PAGE = 100;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Check if this is a duplicate initialization
    if (window.elementsGridInitialized) {
        console.log('elements.js: Elements grid already initialized');
        return;
    }
    
    // Wait for admin.js to load first if it exists
    if (document.querySelector('script[src="admin.js"]')) {
        // Give admin.js time to load data
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if admin.js has loaded combinations
        if (window.combinations && Object.keys(window.combinations).length > 0) {
            console.log('elements.js: Using data loaded by admin.js');
            // Just set up the UI without reloading data
            elementsList = Object.values(elements);
            elementsList.sort((a, b) => a.name.localeCompare(b.name));
            document.getElementById('total-elements').textContent = elementsList.length;
            setupEventListeners();
            initAlphabetNav();
            filterAndDisplay();
            window.elementsGridInitialized = true;
            return;
        }
    }
    
    console.log('Initializing elements browser...');
    window.elementsGridInitialized = true;
    
    await loadData();
    setupEventListeners();
    initAlphabetNav();
    filterAndDisplay();
});

// Load data
async function loadData() {
    try {
        // Clear elementsList to prevent duplicates
        elementsList = [];
        
        // Check if elements are already loaded from admin.js
        if (typeof elements !== 'undefined' && Object.keys(elements).length > 0) {
            // Elements already loaded, just populate elementsList
            elementsList = Object.values(elements);
            console.log(`Using ${elementsList.length} elements from admin.js`);
        } else {
            // Load elements if not already loaded
            const elementsResponse = await fetch('/elements/data/elements.json');
            const elementsData = await elementsResponse.json();
            
            // Initialize elements object if it doesn't exist
            if (typeof elements === 'undefined') {
                window.elements = {};
            }
            
            // Convert array format to object and list
            elementsData.forEach(elem => {
                const element = {
                    id: elem.i,
                    name: elem.n,
                    tier: elem.t,
                    emojiIndex: elem.e
                };
                elements[elem.i] = element;
                elementsList.push(element);
            });
        }
        
        // Sort elements by name
        elementsList.sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Loaded ${elementsList.length} elements`);
        
        // Load emojis if not already loaded
        if (typeof emojis === 'undefined' || Object.keys(emojis).length === 0) {
            try {
                if (typeof emojis === 'undefined') {
                    window.emojis = {};
                }
                const emojiResponse = await fetch('/elements/data/emojis.json');
                emojis = await emojiResponse.json();
                console.log(`Loaded ${Object.keys(emojis).length} emojis`);
            } catch (err) {
                console.warn('Failed to load emojis:', err);
            }
        }
        
        // Update stats
        document.getElementById('total-elements').textContent = elementsList.length;
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load elements data', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Only set up elements.js specific search if we're not on a page with admin.js search
    const searchInput = document.getElementById('search');
    if (searchInput && !searchInput.hasAttribute('data-admin-search')) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = e.target.value.trim().toLowerCase();
                currentPage = 1;
                filterAndDisplay();
            }, 300);
        });
    }
    
    // Tier filter
    const tierFilter = document.getElementById('tier-filter');
    if (tierFilter) {
        tierFilter.addEventListener('change', function(e) {
            window.tierFilter = e.target.value;
            currentPage = 1;
            filterAndDisplay();
        });
    }
}

// Initialize alphabet navigation
function initAlphabetNav() {
    const nav = document.getElementById('alphabet-nav');
    
    // Add A-Z buttons
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.dataset.letter = letter;
        btn.textContent = letter;
        btn.addEventListener('click', () => selectLetter(letter));
        nav.appendChild(btn);
    }
    
    // Add number button for elements starting with numbers
    const numBtn = document.createElement('button');
    numBtn.className = 'letter-btn';
    numBtn.dataset.letter = '0-9';
    numBtn.textContent = '0-9';
    numBtn.addEventListener('click', () => selectLetter('0-9'));
    nav.appendChild(numBtn);
}

// Select letter filter
function selectLetter(letter) {
    currentLetter = letter;
    currentPage = 1;
    
    // Update active button
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.letter === letter);
    });
    
    // Update current filter display
    document.getElementById('current-letter').textContent = letter === 'all' ? 'All' : letter;
    
    filterAndDisplay();
}

// Filter and display elements
function filterAndDisplay() {
    // Apply filters
    filteredElements = elementsList.filter(elem => {
        // Letter filter
        if (currentLetter !== 'all') {
            const firstChar = elem.name.charAt(0).toUpperCase();
            if (currentLetter === '0-9') {
                if (!/\d/.test(firstChar)) return false;
            } else {
                if (firstChar !== currentLetter) return false;
            }
        }
        
        // Search filter
        if (searchQuery) {
            const matchesName = elem.name.toLowerCase().includes(searchQuery);
            const matchesId = elem.id.toString().includes(searchQuery);
            if (!matchesName && !matchesId) return false;
        }
        
        // Tier filter
        if (tierFilter !== '' && elem.tier !== parseInt(tierFilter)) {
            return false;
        }
        
        return true;
    });
    
    // Update filtered count
    document.getElementById('filtered-elements').textContent = filteredElements.length;
    
    // Display current page
    displayPage();
}

// Display current page of elements
function displayPage() {
    const grid = document.getElementById('elements-grid');
    const totalPages = Math.ceil(filteredElements.length / ELEMENTS_PER_PAGE);
    
    // Ensure current page is valid
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    // Calculate slice indices
    const startIndex = (currentPage - 1) * ELEMENTS_PER_PAGE;
    const endIndex = startIndex + ELEMENTS_PER_PAGE;
    const pageElements = filteredElements.slice(startIndex, endIndex);
    
    // Clear grid
    grid.innerHTML = '';
    
    if (pageElements.length === 0) {
        grid.innerHTML = '<div class="loading">No elements found</div>';
        updatePagination(0);
        return;
    }
    
    // Display elements
    pageElements.forEach(elem => {
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
        
        const card = document.createElement('div');
        card.className = 'element-card';
        card.onclick = () => {
            // Hide the grid and show search results
            document.getElementById('elements-grid').style.display = 'none';
            document.getElementById('pagination').style.display = 'none';
            // Show element details in results div
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
    
    // Update pagination
    updatePagination(totalPages);
}

// Update pagination controls
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

// Go to specific page
window.goToPage = function(page) {
    const totalPages = Math.ceil(filteredElements.length / ELEMENTS_PER_PAGE);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    currentPage = page;
    displayPage();
    
    // Scroll to top
    window.scrollTo(0, 0);
};

// Show message
function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type} active`;
    
    setTimeout(() => {
        msg.classList.remove('active');
    }, 3000);
}

