// Admin Panel JavaScript - Fixed version with correct paths and detailed logging
let allElements = {};
let allCombinations = {};
let currentTab = 'database';
let currentPage = 1;
const elementsPerPage = 12; // Reduced for better performance

// Performance tracking
const perfLog = [];
function logPerf(stage, startTime) {
    const duration = Date.now() - startTime;
    const entry = `${stage}: ${duration}ms`;
    perfLog.push(entry);
    console.log(`[PERF] ${entry}`);
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    const initStart = Date.now();
    console.log('[INIT] DOMContentLoaded fired, initializing admin panel...');
    
    try {
        // Add loading indicator
        const container = document.querySelector('.container');
        if (container) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'init-loading';
            loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a1a; padding: 30px; border-radius: 8px; z-index: 9999;';
            loadingDiv.innerHTML = '<h2 style="color: #4ecdc4;">Loading Admin Panel...</h2><div id="loading-status" style="margin-top: 10px; color: #888;"></div>';
            document.body.appendChild(loadingDiv);
        }
        
        const updateLoadingStatus = (msg) => {
            const statusEl = document.getElementById('loading-status');
            if (statusEl) statusEl.textContent = msg;
            console.log(`[LOADING] ${msg}`);
        };
        
        // Load element data
        updateLoadingStatus('Loading element data...');
        const elemStart = Date.now();
        await loadElementData();
        logPerf('Element data loaded', elemStart);
        
        // Load combination data
        updateLoadingStatus('Loading combination data...');
        const comboStart = Date.now();
        await loadCombinationData();
        logPerf('Combination data loaded', comboStart);
        
        // Initial render
        updateLoadingStatus('Rendering interface...');
        const renderStart = Date.now();
        renderDatabaseEmpty();
        renderStats();
        logPerf('Initial render complete', renderStart);
        
        // Remove loading indicator
        const loadingDiv = document.getElementById('init-loading');
        if (loadingDiv) loadingDiv.remove();
        
        logPerf('Total initialization', initStart);
        console.log('[INIT] Admin panel initialization complete');
        console.log('[PERF] Performance summary:', perfLog);
        
    } catch (error) {
        console.error('[INIT] Error during initialization:', error);
        showMessage('Error initializing admin panel: ' + error.message, 'error');
        
        // Remove loading indicator on error
        const loadingDiv = document.getElementById('init-loading');
        if (loadingDiv) loadingDiv.remove();
    }
});

// Tab switching
function switchTab(tabName) {
    console.log(`[TAB] Switching to ${tabName}`);
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentTab = tabName;
    
    // Render appropriate content
    const renderStart = Date.now();
    switch(tabName) {
        case 'database':
            renderDatabase();
            break;
        case 'combinations':
            renderCombinations();
            break;
        case 'trees':
            // Tree view handled separately
            break;
        case 'stats':
            renderStats();
            break;
    }
    logPerf(`Rendered ${tabName} tab`, renderStart);
}

// Load element data from game files
async function loadElementData() {
    console.log('[LOAD] Starting loadElementData...');
    try {
        // FIXED: Use correct paths without "elements-new" subdirectory
        const files = [
            '/elements/elements-core.json',
            '/elements/elements-life.json',
            '/elements/elements-civilization.json',
            '/elements/elements-modern.json',
            '/elements/elements-fictional.json',
            '/elements/elements-humorous-fusions.json'
        ];
        
        console.log('[LOAD] Loading element files:', files);
        
        let totalElementsLoaded = 0;
        
        for (const file of files) {
            try {
                const fileStart = Date.now();
                console.log(`[LOAD] Fetching ${file}...`);
                
                const response = await fetch(file);
                console.log(`[LOAD] Response status for ${file}:`, response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                let fileElementCount = 0;
                
                // Handle both array format and object format
                if (Array.isArray(data)) {
                    fileElementCount = data.length;
                    console.log(`[LOAD] Processing ${fileElementCount} elements from ${file} (array format)`);
                    
                    // Convert array format to object format with safety checks
                    data.forEach((elem, index) => {
                        if (!elem || typeof elem !== 'object') {
                            console.warn(`[LOAD] Invalid element at index ${index} in ${file}:`, elem);
                            return;
                        }
                        
                        const id = elem.i;
                        if (!id) {
                            console.warn(`[LOAD] Element missing ID at index ${index} in ${file}:`, elem);
                            return;
                        }
                        
                        allElements[id] = {
                            name: elem.n || 'Unknown',
                            tier: elem.t || 1,
                            emoji: elem.e || '❓',
                            flags: elem.f || []
                        };
                    });
                } else if (typeof data === 'object') {
                    fileElementCount = Object.keys(data).length;
                    console.log(`[LOAD] Processing ${fileElementCount} elements from ${file} (object format)`);
                    
                    // Validate and merge object format
                    Object.entries(data).forEach(([id, elem]) => {
                        if (!elem || typeof elem !== 'object') {
                            console.warn(`[LOAD] Invalid element for ID ${id} in ${file}:`, elem);
                            return;
                        }
                        
                        allElements[id] = {
                            name: elem.name || elem.n || 'Unknown',
                            tier: elem.tier || elem.t || 1,
                            emoji: elem.emoji || elem.e || '❓',
                            flags: elem.flags || elem.f || []
                        };
                    });
                } else {
                    console.error(`[LOAD] Invalid data format in ${file}:`, typeof data);
                }
                
                totalElementsLoaded += fileElementCount;
                logPerf(`Loaded ${file} (${fileElementCount} elements)`, fileStart);
                
            } catch (err) {
                console.error(`[LOAD] Could not load ${file}:`, err);
                // Continue loading other files even if one fails
            }
        }
        
        console.log(`[LOAD] Total unique elements loaded: ${Object.keys(allElements).length} (processed ${totalElementsLoaded} total)`);
        
        // Load emojis using dynamic import - FIXED path
        try {
            console.log('[LOAD] Loading emojis...');
            const emojiStart = Date.now();
            const emojiModule = await import('/elements/emojis.js');
            
            if (emojiModule.EMOJI_MAP) {
                window.elementEmojis = emojiModule.EMOJI_MAP;
                console.log(`[LOAD] Emojis loaded successfully (${Object.keys(emojiModule.EMOJI_MAP).length} entries)`);
            } else {
                console.warn('[LOAD] EMOJI_MAP not found in emoji module');
            }
            
            logPerf('Emoji loading', emojiStart);
        } catch (err) {
            console.error('[LOAD] Could not load emojis:', err);
            // Initialize empty emoji map as fallback
            window.elementEmojis = {};
        }
        
    } catch (error) {
        console.error('[LOAD] Error loading element data:', error);
        showMessage('Error loading element data: ' + error.message, 'error');
        throw error; // Re-throw to handle in initialization
    }
}

// Load combination data
async function loadCombinationData() {
    console.log('[LOAD] Starting loadCombinationData...');
    try {
        // FIXED: Use correct path
        const file = '/elements/combinations.json';
        const comboStart = Date.now();
        
        console.log(`[LOAD] Fetching ${file}...`);
        const response = await fetch(file);
        console.log(`[LOAD] Response status for combinations:`, response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const rawComboCount = Object.keys(data).length;
        console.log(`[LOAD] Processing ${rawComboCount} combinations`);
        
        // Clear existing combinations
        allCombinations = {};
        let processedCount = 0;
        let invalidCount = 0;
        
        // Convert the object format to our expected format with validation
        Object.entries(data).forEach(([key, result]) => {
            try {
                // Validate key format
                if (!key.includes('+')) {
                    console.warn(`[LOAD] Invalid combination key format: ${key}`);
                    invalidCount++;
                    return;
                }
                
                const [elem1Str, elem2Str] = key.split('+');
                const elem1 = parseInt(elem1Str);
                const elem2 = parseInt(elem2Str);
                
                // Validate element IDs
                if (isNaN(elem1) || isNaN(elem2)) {
                    console.warn(`[LOAD] Invalid element IDs in combination: ${key}`);
                    invalidCount++;
                    return;
                }
                
                const combo = {
                    element1: elem1,
                    element2: elem2,
                    result: parseInt(result)
                };
                
                // Store both directions for easier lookup
                const comboKey = `${elem1}_${elem2}`;
                const reverseKey = `${elem2}_${elem1}`;
                allCombinations[comboKey] = combo;
                allCombinations[reverseKey] = combo;
                processedCount += 2;
                
            } catch (err) {
                console.error(`[LOAD] Error processing combination ${key}:`, err);
                invalidCount++;
            }
        });
        
        console.log(`[LOAD] Combination processing complete:`, {
            raw: rawComboCount,
            processed: processedCount,
            invalid: invalidCount,
            stored: Object.keys(allCombinations).length
        });
        
        logPerf('Combination data processing', comboStart);
        
    } catch (error) {
        console.error('[LOAD] Error loading combination data:', error);
        showMessage('Error loading combination data: ' + error.message, 'error');
        throw error; // Re-throw to handle in initialization
    }
}

// Render empty database view
function renderDatabaseEmpty() {
    console.log('[RENDER] Rendering empty database view');
    const grid = document.getElementById('element-grid');
    if (!grid) {
        console.error('[RENDER] Element grid not found!');
        return;
    }
    
    grid.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #888;">
            <h2 style="color: #4ecdc4; margin-bottom: 20px;">🔍 Search Elements</h2>
            <p style="font-size: 18px; margin-bottom: 10px;">Enter an element name or ID in the search box above</p>
            <p style="font-size: 16px;">Or use the tier filter and checkboxes to browse specific categories</p>
            <p style="font-size: 14px; margin-top: 20px; color: #4ecdc4;">Total elements loaded: ${Object.keys(allElements).length}</p>
        </div>
    `;
    
    // Update tier filter
    updateTierFilter();
    
    // Clear pagination
    const pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';
}

// Render database view
function renderDatabase() {
    console.log('[RENDER] Starting database render');
    const renderStart = Date.now();
    
    const grid = document.getElementById('element-grid');
    
    if (!grid) {
        console.error('[RENDER] Element grid not found');
        return;
    }
    
    // Check if we have loaded elements
    if (Object.keys(allElements).length === 0) {
        grid.innerHTML = '<div class="loading">No elements loaded yet. Please refresh the page or check the console for errors.</div>';
        return;
    }
    
    // Check if there are any search criteria
    const searchTerm = document.getElementById('element-search')?.value || '';
    const tierFilter = document.getElementById('tier-filter')?.value || '';
    const showOrphans = document.getElementById('show-orphans')?.checked || false;
    const showNoRecipe = document.getElementById('show-no-recipe')?.checked || false;
    
    if (!searchTerm && !tierFilter && !showOrphans && !showNoRecipe) {
        renderDatabaseEmpty();
        return;
    }
    
    // Require at least 2 characters for search
    if (searchTerm && searchTerm.length < 2) {
        grid.innerHTML = '<div style="text-align: center; padding: 50px; color: #888;">Please enter at least 2 characters to search</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    const filterStart = Date.now();
    const filtered = filterElementsData();
    console.log(`[RENDER] Filtered ${filtered.length} elements in ${Date.now() - filterStart}ms`);
    
    const paged = paginate(filtered, currentPage, elementsPerPage);
    
    // Update tier filter if needed
    updateTierFilter();
    
    // Render elements
    grid.innerHTML = '';
    
    if (paged.items.length === 0) {
        grid.innerHTML = '<div class="loading">No elements match your filters.</div>';
        return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const cardStart = Date.now();
    
    paged.items.forEach(([id, element]) => {
        const cardHTML = createElementCard(id, element);
        if (cardHTML) {
            const temp = document.createElement('div');
            temp.innerHTML = cardHTML;
            fragment.appendChild(temp.firstChild);
        }
    });
    
    grid.appendChild(fragment);
    console.log(`[RENDER] Created ${paged.items.length} cards in ${Date.now() - cardStart}ms`);
    
    // Render pagination
    renderPagination(paged.totalPages);
    
    logPerf('Database render', renderStart);
}

// Create element card HTML
function createElementCard(id, element) {
    if (!element) {
        console.error(`[RENDER] Element not found for ID: ${id}`);
        return '';
    }
    
    const emoji = window.elementEmojis?.[id] || element.emoji || '❓';
    const combinations = findCombinationsForElement(id);
    
    return `
        <div class="element-card" data-id="${id}">
            <div class="element-header">
                <div class="element-emoji" onclick="copyEmoji('${emoji}')">${emoji}</div>
                <div class="element-info">
                    <div class="element-id">ID: ${id}</div>
                    <div class="element-name">${element.name}</div>
                    <div class="element-tier tier-${element.tier || 0}">Tier ${element.tier || 0}</div>
                </div>
            </div>
            ${combinations.length > 0 ? `
                <div class="combinations-list">
                    <strong>Recipes (${combinations.length}):</strong>
                    ${combinations.slice(0, 3).map(combo => `
                        <div class="combination-item">
                            ${getElementDisplay(combo.element1)} + ${getElementDisplay(combo.element2)} → ${getElementDisplay(combo.result)}
                        </div>
                    `).join('')}
                    ${combinations.length > 3 ? `<div style="color: #888;">... and ${combinations.length - 3} more</div>` : ''}
                </div>
            ` : '<div class="combinations-list" style="color: #888;">No recipes found</div>'}
            <div style="margin-top: 15px;">
                <button onclick="editElement('${id}')">✏️ Edit</button>
                <button class="danger" onclick="deleteElement('${id}')">🗑️ Delete</button>
            </div>
        </div>
    `;
}

// Get element display (emoji + name)
function getElementDisplay(elementId) {
    const element = allElements[elementId];
    if (!element) return `Unknown (${elementId})`;
    const emoji = window.elementEmojis?.[elementId] || element.emoji || '❓';
    return `${emoji} ${element.name}`;
}

// Find combinations that create or use an element
function findCombinationsForElement(elementId) {
    const combinations = [];
    const seen = new Set();
    const elementIdNum = parseInt(elementId);
    
    Object.values(allCombinations).forEach(combo => {
        if (combo.result === elementIdNum) {
            // Create a unique key for this combination
            const key = [combo.element1, combo.element2].sort().join('_');
            
            // Avoid duplicates
            if (!seen.has(key)) {
                seen.add(key);
                combinations.push(combo);
            }
        }
    });
    
    return combinations;
}

// Filter elements based on search and filters
function filterElementsData() {
    const searchTerm = document.getElementById('element-search')?.value.toLowerCase() || '';
    const tierFilter = document.getElementById('tier-filter')?.value || '';
    const showOrphans = document.getElementById('show-orphans')?.checked || false;
    const showNoRecipe = document.getElementById('show-no-recipe')?.checked || false;
    
    return Object.entries(allElements).filter(([id, element]) => {
        // Search filter
        if (searchTerm && !element.name.toLowerCase().includes(searchTerm) && !id.includes(searchTerm)) {
            return false;
        }
        
        // Tier filter
        if (tierFilter && element.tier != tierFilter) {
            return false;
        }
        
        // Orphan filter (elements not used in any combination)
        if (showOrphans) {
            const usedInCombos = Object.values(allCombinations).some(combo => 
                combo.element1 == id || combo.element2 == id
            );
            if (usedInCombos) return false;
        }
        
        // No recipe filter
        if (showNoRecipe) {
            const hasRecipe = findCombinationsForElement(id).length > 0;
            if (hasRecipe) return false;
        }
        
        return true;
    });
}

// Update tier filter options
function updateTierFilter() {
    const filter = document.getElementById('tier-filter');
    if (!filter || filter.options.length > 1) return;
    
    const tiers = new Set();
    Object.values(allElements).forEach(element => {
        tiers.add(element.tier || 1);
    });
    
    Array.from(tiers).sort((a, b) => a - b).forEach(tier => {
        const option = document.createElement('option');
        option.value = tier;
        option.textContent = `Tier ${tier}`;
        filter.appendChild(option);
    });
}

// Pagination
function paginate(items, page, perPage) {
    const totalPages = Math.ceil(items.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    
    return {
        items: items.slice(start, end),
        totalPages,
        currentPage: page,
        totalItems: items.length
    };
}

// Render pagination controls
function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        container.innerHTML += `<button class="page-button" onclick="changePage(${currentPage - 1})">← Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            container.innerHTML += `<button class="page-button ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            container.innerHTML += `<span style="padding: 0 10px;">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        container.innerHTML += `<button class="page-button" onclick="changePage(${currentPage + 1})">Next →</button>`;
    }
}

// Change page
function changePage(page) {
    console.log(`[PAGE] Changing to page ${page}`);
    currentPage = page;
    renderDatabase();
}

// Filter elements
function filterElements() {
    console.log('[FILTER] Filter changed, resetting to page 1');
    currentPage = 1;
    renderDatabase();
}

// Refresh database
function refreshDatabase() {
    console.log('[REFRESH] Refreshing database...');
    showMessage('Refreshing database...', 'success');
    
    // Clear existing data
    allElements = {};
    allCombinations = {};
    
    // Reload everything
    Promise.all([loadElementData(), loadCombinationData()])
        .then(() => {
            renderDatabase();
            showMessage('Database refreshed successfully', 'success');
        })
        .catch(error => {
            console.error('[REFRESH] Error:', error);
            showMessage('Error refreshing database: ' + error.message, 'error');
        });
}

// Edit element
function editElement(elementId) {
    const element = allElements[elementId];
    if (!element) return;
    
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `Edit Element: ${element.name}`;
    
    modalBody.innerHTML = `
        <form onsubmit="saveElement(event, '${elementId}')">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">ID:</label>
                <input type="text" value="${elementId}" disabled style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Name:</label>
                <input type="text" id="edit-name" value="${element.name}" required style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Tier:</label>
                <input type="number" id="edit-tier" value="${element.tier || 1}" min="1" max="10" required style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Emoji:</label>
                <input type="text" id="edit-emoji" value="${window.elementEmojis?.[elementId] || element.emoji || ''}" style="width: 100%;">
            </div>
            
            <div style="margin-top: 20px; text-align: right;">
                <button type="button" onclick="closeModal()" style="margin-right: 10px;">Cancel</button>
                <button type="submit">Save Changes</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
}

// Save element changes
function saveElement(event, elementId) {
    event.preventDefault();
    
    const name = document.getElementById('edit-name').value;
    const tier = parseInt(document.getElementById('edit-tier').value);
    const emoji = document.getElementById('edit-emoji').value;
    
    // Update element
    allElements[elementId] = {
        ...allElements[elementId],
        name,
        tier
    };
    
    if (window.elementEmojis) {
        window.elementEmojis[elementId] = emoji;
    }
    
    closeModal();
    renderDatabase();
    showMessage(`Element "${name}" updated successfully`, 'success');
}

// Delete element
function deleteElement(elementId) {
    if (!confirm(`Are you sure you want to delete "${allElements[elementId].name}"? This will also remove all combinations using this element.`)) {
        return;
    }
    
    // Remove element
    delete allElements[elementId];
    
    // Remove related combinations
    Object.keys(allCombinations).forEach(key => {
        const combo = allCombinations[key];
        if (combo.element1 == elementId || combo.element2 == elementId || combo.result == elementId) {
            delete allCombinations[key];
        }
    });
    
    renderDatabase();
    showMessage('Element deleted successfully', 'success');
}

// Copy emoji to clipboard
function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji).then(() => {
        showMessage('Emoji copied to clipboard!', 'success');
    }).catch(err => {
        console.error('[COPY] Failed to copy emoji:', err);
        showMessage('Failed to copy emoji', 'error');
    });
}

// Close modal
function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// Show message
function showMessage(text, type = 'success') {
    console.log(`[MESSAGE] ${type}: ${text}`);
    const message = document.getElementById('message');
    if (!message) {
        console.warn('[MESSAGE] Message element not found');
        return;
    }
    
    message.textContent = text;
    message.className = `message ${type} active`;
    
    setTimeout(() => {
        message.classList.remove('active');
    }, 3000);
}

// Render combinations view
function renderCombinations() {
    console.log('[RENDER] Rendering combinations view');
    const renderStart = Date.now();
    
    const grid = document.getElementById('combinations-grid');
    if (!grid) {
        console.error('[RENDER] Combinations grid not found');
        return;
    }
    
    const searchTerm = document.getElementById('combo-search')?.value.toLowerCase() || '';
    
    grid.innerHTML = '';
    
    // Get unique combinations
    const uniqueCombos = [];
    const seen = new Set();
    
    Object.values(allCombinations).forEach(combo => {
        const key = [combo.element1, combo.element2].sort().join('_');
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCombos.push(combo);
        }
    });
    
    console.log(`[RENDER] Processing ${uniqueCombos.length} unique combinations`);
    
    // Filter and render with limit for performance
    let rendered = 0;
    const maxRender = 100; // Limit to prevent freezing
    
    for (const combo of uniqueCombos) {
        if (rendered >= maxRender) {
            grid.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #888;">Showing first ${maxRender} combinations. Use search to find specific ones.</div>`;
            break;
        }
        
        const elem1 = allElements[combo.element1];
        const elem2 = allElements[combo.element2];
        const result = allElements[combo.result];
        
        if (!elem1 || !elem2 || !result) continue;
        
        if (searchTerm) {
            const matchesSearch = 
                elem1.name.toLowerCase().includes(searchTerm) ||
                elem2.name.toLowerCase().includes(searchTerm) ||
                result.name.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) continue;
        }
        
        grid.innerHTML += `
            <div class="element-card">
                <div style="text-align: center; font-size: 20px; margin-bottom: 15px;">
                    ${getElementDisplay(combo.element1)} + ${getElementDisplay(combo.element2)}
                </div>
                <div style="text-align: center; font-size: 24px; margin: 20px 0;">
                    ↓
                </div>
                <div style="text-align: center; font-size: 24px; font-weight: bold;">
                    ${getElementDisplay(combo.result)}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="editCombination('${combo.element1}', '${combo.element2}')">✏️ Edit</button>
                    <button class="danger" onclick="deleteCombination('${combo.element1}', '${combo.element2}')">🗑️ Delete</button>
                </div>
            </div>
        `;
        
        rendered++;
    }
    
    if (rendered === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 50px; color: #888;">No combinations found matching your search.</div>';
    }
    
    logPerf(`Rendered ${rendered} combinations`, renderStart);
}

// Search combinations
function searchCombinations() {
    console.log('[SEARCH] Searching combinations');
    renderCombinations();
}

// Show all combinations
function showAllCombinations() {
    console.log('[SEARCH] Showing all combinations');
    document.getElementById('combo-search').value = '';
    renderCombinations();
}

// Generate discovery tree
function generateTree() {
    console.log('[TREE] Generating discovery tree');
    const searchInput = document.getElementById('tree-search').value;
    const container = document.getElementById('tree-container');
    
    if (!searchInput || searchInput.trim() === '') {
        container.innerHTML = '<p style="color: #888;">Enter an element name or ID to generate its discovery tree.</p>';
        return;
    }
    
    // Find element
    let targetId = null;
    const searchLower = searchInput.trim().toLowerCase();
    
    for (const [id, element] of Object.entries(allElements)) {
        if (id === searchInput || element.name.toLowerCase() === searchLower) {
            targetId = id;
            break;
        }
    }
    
    if (!targetId) {
        container.innerHTML = '<p style="color: #e74c3c;">Element not found.</p>';
        return;
    }
    
    // Build discovery tree with performance tracking
    const treeStart = Date.now();
    const tree = buildDiscoveryTree(targetId);
    const treeHTML = renderTree(tree);
    container.innerHTML = '<h3>Discovery Tree</h3>' + treeHTML;
    logPerf('Tree generation', treeStart);
}

// Build discovery tree recursively
function buildDiscoveryTree(elementId, visited = new Set(), depth = 0) {
    if (visited.has(elementId) || depth > 5) {
        return { id: elementId, circular: true, children: [] };
    }
    
    visited.add(elementId);
    
    const recipes = findCombinationsForElement(elementId);
    const children = [];
    
    // Limit recipes to prevent performance issues
    const maxRecipes = depth === 0 ? 10 : 3;
    recipes.slice(0, maxRecipes).forEach(recipe => {
        children.push({
            recipe,
            left: buildDiscoveryTree(recipe.element1.toString(), new Set(visited), depth + 1),
            right: buildDiscoveryTree(recipe.element2.toString(), new Set(visited), depth + 1)
        });
    });
    
    if (recipes.length > maxRecipes) {
        children.push({ truncated: true, count: recipes.length - maxRecipes });
    }
    
    return {
        id: elementId,
        children
    };
}

// Render tree HTML
function renderTree(node, level = 0) {
    const element = allElements[node.id];
    if (!element) return '';
    
    let html = `<div class="tree-container" style="margin-left: ${level * 30}px;">`;
    html += `<div class="tree-element">${getElementDisplay(node.id)}</div>`;
    
    if (node.circular) {
        html += '<span style="color: #888; margin-left: 10px;">(circular reference)</span>';
    }
    
    if (node.children.length > 0) {
        node.children.forEach(child => {
            if (child.truncated) {
                html += `<div style="color: #888; margin-left: 30px;">... and ${child.count} more recipes</div>`;
            } else {
                html += '<div class="tree-node">';
                html += '<div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">';
                html += renderTree(child.left, 0);
                html += '<span class="tree-operator">+</span>';
                html += renderTree(child.right, 0);
                html += '</div>';
                html += '</div>';
            }
        });
    }
    
    html += '</div>';
    return html;
}

// Render statistics
function renderStats() {
    console.log('[STATS] Rendering statistics');
    const statsStart = Date.now();
    
    const grid = document.getElementById('stats-grid');
    const detailed = document.getElementById('detailed-stats');
    
    if (!grid || !detailed) {
        console.error('[STATS] Stats containers not found');
        return;
    }
    
    // Calculate stats
    const totalElements = Object.keys(allElements).length;
    const totalCombinations = Object.keys(allCombinations).length / 2; // Divided by 2 because we store both directions
    
    const tierCounts = {};
    const orphanElements = [];
    const noRecipeElements = [];
    
    Object.entries(allElements).forEach(([id, element]) => {
        const tier = element.tier || 1;
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        
        // Check if orphan
        const usedInCombos = Object.values(allCombinations).some(combo => 
            combo.element1 == id || combo.element2 == id
        );
        if (!usedInCombos) {
            orphanElements.push({ id, element });
        }
        
        // Check if has recipe
        const hasRecipe = findCombinationsForElement(id).length > 0;
        if (!hasRecipe) {
            noRecipeElements.push({ id, element });
        }
    });
    
    // Render main stats
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalElements}</div>
            <div class="stat-label">Total Elements</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Math.floor(totalCombinations)}</div>
            <div class="stat-label">Total Combinations</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${orphanElements.length}</div>
            <div class="stat-label">Orphan Elements</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${noRecipeElements.length}</div>
            <div class="stat-label">Elements Without Recipes</div>
        </div>
    `;
    
    // Render detailed stats
    detailed.innerHTML = `
        <div class="tree-container">
            <h3>Elements by Tier</h3>
            ${Object.entries(tierCounts).sort(([a], [b]) => a - b).map(([tier, count]) => `
                <div style="margin: 10px 0;">
                    <strong>Tier ${tier}:</strong> ${count} elements
                    <div style="background: #333; height: 20px; margin-top: 5px; border-radius: 4px;">
                        <div style="background: #4ecdc4; height: 100%; width: ${(count / totalElements * 100).toFixed(1)}%; border-radius: 4px;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="tree-container" style="margin-top: 30px;">
            <h3>Orphan Elements (${orphanElements.length})</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${orphanElements.slice(0, 20).map(({ id, element }) => `
                    <div class="tree-element">${getElementDisplay(id)}</div>
                `).join('')}
                ${orphanElements.length > 20 ? `<div style="color: #888;">... and ${orphanElements.length - 20} more</div>` : ''}
            </div>
        </div>
        
        <div class="tree-container" style="margin-top: 30px;">
            <h3>Elements Without Recipes (${noRecipeElements.length})</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${noRecipeElements.slice(0, 20).map(({ id, element }) => `
                    <div class="tree-element">${getElementDisplay(id)}</div>
                `).join('')}
                ${noRecipeElements.length > 20 ? `<div style="color: #888;">... and ${noRecipeElements.length - 20} more</div>` : ''}
            </div>
        </div>
    `;
    
    logPerf('Stats calculation and render', statsStart);
}

// Additional combination functions
function editCombination(elem1, elem2) {
    showMessage('Edit combination feature coming soon!', 'success');
}

function deleteCombination(elem1, elem2) {
    if (!confirm('Are you sure you want to delete this combination?')) {
        return;
    }
    
    const key1 = `${elem1}_${elem2}`;
    const key2 = `${elem2}_${elem1}`;
    
    delete allCombinations[key1];
    delete allCombinations[key2];
    
    renderCombinations();
    showMessage('Combination deleted successfully', 'success');
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('[ERROR] Global error:', event.error);
    showMessage('An error occurred. Check console for details.', 'error');
});

// Performance monitoring
window.addEventListener('load', () => {
    console.log('[PERF] Page fully loaded');
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        console.log('[PERF] Page load metrics:', {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart
        });
    }
});