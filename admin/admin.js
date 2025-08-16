// Admin Panel - Element & Combination Management
if (typeof elements === 'undefined') {
    window.elements = {};
}
if (typeof combinations === 'undefined') {
    window.combinations = {};
}
if (typeof emojis === 'undefined') {
    window.emojis = {};
}
let currentElement = null;
let deletedElements = [];
let deletedCombinations = [];

window.adminDataLoading = true;

let currentCombinationsPage = 1;
const COMBINATIONS_PER_PAGE = 25;

document.addEventListener('DOMContentLoaded', async function() {
    
    window.adminDataLoading = true;
    await loadData();
    window.adminDataLoading = false;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const elementParam = urlParams.get('element');
    
    const searchInput = document.getElementById('search');
    if (searchInput) {
        // Remove any existing event listeners from elements.js
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.setAttribute('data-admin-search', 'true');
        let searchTimeout;
        
        newSearchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                hideResults();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchElement(query);
            }, 300);
        });
    }
    
    if (elementParam) {
        showElement(elementParam);
    } else if (searchParam) {
        const currentSearchInput = document.getElementById('search');
        if (currentSearchInput) {
            currentSearchInput.value = searchParam;
        }
        searchElement(searchParam);
    }
    
    loadCleanupStats();
});

async function loadData() {
    try {
        // Generate unique timestamp for cache busting
        const timestamp = Date.now();
        console.log('[Cache Debug] Loading data with timestamp:', timestamp);
        
        if (typeof combinations === 'undefined') {
            window.combinations = {};
        }
        try {
            const response = await fetch(`/elements/data/elements.json?t=${timestamp}&cb=${Math.random()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch elements: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            // Clear and rebuild elements object completely
            window.elements = {};
            
            data.forEach(elem => {
                elements[elem.i] = {
                    id: elem.i,
                    name: elem.n,
                    tier: elem.t,
                    emojiIndex: elem.e
                };
            });
            
            console.log('[Cache Debug] Loaded', Object.keys(elements).length, 'elements');
            
        } catch (err) {
            console.error('Failed to load elements:', err);
            throw err;
        }
        
        try {
            const comboResponse = await fetch(`/elements/data/combinations.json?t=${timestamp}&cb=${Math.random()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (!comboResponse.ok) {
                throw new Error(`Failed to fetch combinations: ${comboResponse.status} ${comboResponse.statusText}`);
            }
            
            const comboData = await comboResponse.json();
            
            window.combinations = {};
            
            let validCombos = 0;
            Object.entries(comboData).forEach(([key, result]) => {
                if (key && result !== undefined && result !== null) {
                    combinations[key] = result;
                    validCombos++;
                    
                    const parts = key.split('+');
                    if (parts.length === 2 && parts[0] && parts[1]) {
                        combinations[`${parts[1]}+${parts[0]}`] = result;
                        validCombos++;
                    }
                }
            });
            
            
        } catch (err) {
            console.error('Failed to load combinations:', err);
        }
        
        
        try {
            const emojiResponse = await fetch(`/elements/data/emojis.json?t=${timestamp}&cb=${Math.random()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (emojiResponse.ok) {
                window.emojis = await emojiResponse.json();
                console.log('[Cache Debug] Loaded', Object.keys(window.emojis).length, 'emoji mappings');
            }
        } catch (err) {
            console.warn('Failed to load emojis:', err);
        }
        
        try {
            const deletedElementsResponse = await fetch('/elements/deleted-elements.json');
            if (deletedElementsResponse.ok) {
                deletedElements = await deletedElementsResponse.json();
                deletedElements.forEach(id => {
                    delete elements[id];
                });
            }
        } catch (err) {
        }
        
        try {
            const deletedCombosResponse = await fetch('/elements/deleted-combinations.json');
            if (deletedCombosResponse.ok) {
                deletedCombinations = await deletedCombosResponse.json();
                deletedCombinations.forEach(combo => {
                    delete combinations[combo];
                    const parts = combo.split('+');
                    if (parts.length === 2 && parts[0] && parts[1]) {
                        delete combinations[`${parts[1]}+${parts[0]}`];
                    }
                });
            }
        } catch (err) {
        }
        
        
    } catch (error) {
        console.error('Error in loadData:', error);
        showMessage('Failed to load data: ' + error.message, 'error');
    }
}

/**
 * Force reload all data with cache busting
 */
async function forceReload() {
    console.log('[Cache Debug] Force reloading all data...');
    window.adminDataLoading = true;
    
    try {
        await loadData();
        console.log('[Cache Debug] Force reload completed successfully');
        
        // Update elements grid if elements.js is loaded
        if (typeof filterAndDisplay === 'function') {
            // Update the elements list and redisplay
            if (typeof elementsList !== 'undefined') {
                elementsList = Object.values(window.elements);
                elementsList.sort((a, b) => a.name.localeCompare(b.name));
                document.getElementById('total-elements').textContent = elementsList.length;
                filterAndDisplay();
            }
        }
    } catch (error) {
        console.error('[Cache Debug] Force reload failed:', error);
        showMessage('Failed to reload data: ' + error.message, 'error');
    } finally {
        window.adminDataLoading = false;
    }
}

/**
 * Search for elements by ID, name, or emoji
 */
async function searchElement(query) {
    const results = document.getElementById('results');
    if (!results) return;
    
    const grid = document.getElementById('elements-grid');
    const pagination = document.getElementById('pagination');
    if (grid) grid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    
    results.innerHTML = '<div class="loading">Searching...</div>';
    results.classList.add('active');
    
    // Force reload data first to ensure we have the latest elements
    await forceReload();
    
    // Check if query is an emoji
    const isEmoji = /\p{Emoji}/u.test(query);
    if (isEmoji) {
        searchByEmoji(query);
        return;
    }
    
    const queryLower = query.toLowerCase();
    const matches = [];
    
    // Search by ID or name
    for (const [id, elem] of Object.entries(window.elements)) {
        let score = 0;
        let matched = false;
        
        // Check if query matches ID (convert both to string for comparison)
        const idStr = id.toString();
        const queryStr = query.toString();
        if (idStr.includes(queryStr)) {
            matched = true;
            score = idStr === queryStr ? 100 : 50; // Exact ID match gets highest score
        }
        
        // Check if name matches (including numbers in names)
        const nameLower = elem.name.toLowerCase();
        // Also check original name for number matching
        const nameOriginal = elem.name;
        
        if (nameLower.includes(queryLower) || nameOriginal.includes(query)) {
            matched = true;
            // Exact name match
            if (nameLower === queryLower) {
                score = Math.max(score, 95);
            }
            // Name starts with query
            else if (nameLower.startsWith(queryLower) || nameOriginal.startsWith(query)) {
                score = Math.max(score, 80);
            }
            // Query is a word boundary match (e.g., "man" in "Iron Man", "1099" in "1099 Employee")
            else if (new RegExp(`\\b${queryLower}\\b`).test(nameLower) || new RegExp(`\\b${query}\\b`).test(nameOriginal)) {
                score = Math.max(score, 70);
            }
            // Name contains query
            else {
                score = Math.max(score, 50);
            }
        }
        
        if (matched) {
            matches.push({ id, ...elem, score });
        }
    }
    
    // Sort by score (highest first), then by name
    matches.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Always show results in grid, even for single or exact matches
    if (matches.length > 0) {
        showSearchResults(matches);
    } else {
        results.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">No elements found</div>';
    }
}

/**
 * Search for elements by emoji
 */
function searchByEmoji(emojiQuery) {
    const results = document.getElementById('results');
    const matches = [];
    
    // Search through all elements to find ones with matching emoji
    for (const [id, elem] of Object.entries(window.elements)) {
        const elemEmoji = emojis[elem.id] || emojis[elem.emojiIndex];
        if (elemEmoji === emojiQuery) {
            matches.push({ id, ...elem });
        }
    }
    
    if (matches.length === 0) {
        results.innerHTML = `<div style="text-align: center; padding: 20px; color: #888;">No elements found with emoji ${emojiQuery}</div>`;
    } else if (matches.length === 1) {
        showElement(matches[0].id);
    } else {
        showSearchResults(matches, `Elements with emoji ${emojiQuery}`);
    }
}

function showSearchResults(matches, title) {
    const results = document.getElementById('results');
    
    let html = `<div style="margin-bottom: 20px;"><strong>${title || 'Search Results:'}</strong></div>`;
    
    // Create a grid container for search results
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; padding: 20px 0;">';
    
    matches.slice(0, 100).forEach(elem => {
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
        html += `
            <div class="element-card" style="background: white; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;"
                 onclick="showElement('${elem.id}', false)"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
                <div style="font-weight: 500; font-size: 14px; margin-bottom: 5px;">${elem.name}</div>
                <div style="font-size: 12px; color: #666;">ID: ${elem.id} | Tier: ${elem.tier || 'N/A'}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (matches.length > 100) {
        html += `<div style="text-align: center; color: #888; margin-top: 10px;">... and ${matches.length - 100} more results</div>`;
    }
    
    results.innerHTML = html;
}

/**
 * Display element details with recipes and combinations
 */
function showElement(elementId, preservePage = false, cachedCreates = null) {
    elementId = String(elementId);
    
    const timestamp = Date.now();
    fetch(`/elements/data/elements.json?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    })
    .then(r => r.json())
    .then(elementsData => {
        window.elements = {};
        elementsData.forEach(elem => {
            window.elements[elem.i] = {
                id: elem.i,
                name: elem.n,
                tier: elem.t,
                emojiIndex: elem.e
            };
        });
        
        const elem = elements[elementId];
        if (!elem) {
            console.error('Element not found:', elementId);
            return;
        }
        
        currentElement = elem;
        
        Promise.all([
            fetch(`/elements/data/combinations.json?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            }).then(r => r.json()),
            fetch(`/elements/deleted-combinations.json?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            }).then(r => r.ok ? r.json() : [])
        ])
        .then(([combinationsData, deletedCombos]) => {
            
            const deletedSet = new Set(deletedCombos);
            deletedCombos.forEach(combo => {
                const [a, b] = combo.split('+');
                if (a && b) {
                    deletedSet.add(`${b}+${a}`);
                }
            });
            
            const recipes = [];
            const creates = [];
            
            Object.entries(combinationsData).forEach(([combo, result]) => {
                if (deletedSet.has(combo)) {
                    return;
                }
                
                if (String(result) === elementId) {
                    const [a, b] = combo.split('+');
                    recipes.push({ elem1: a, elem2: b });
                }
                
                const [a, b] = combo.split('+');
                if (String(a) === elementId || String(b) === elementId) {
                    creates.push({
                        otherElem: String(a) === elementId ? b : a,
                        result: result,
                        combo: combo
                    });
                }
            });
            
            displayElementDetails(elem, recipes, creates, elementId);
        })
        .catch(error => {
            console.error('Failed to load combinations:', error);
            alert('Failed to load combinations data');
        });
    })
    .catch(error => {
        console.error('Failed to load elements:', error);
        alert('Failed to load elements data');
    });
}

function displayElementDetails(elem, recipes, creates, elementId) {
    const results = document.getElementById('results');
    const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
    
    let html = `
        <button class="secondary" onclick="hideResults()" style="margin-bottom: 20px;">← Back to Elements</button>
        <div class="element-header">
            <h2>${emoji} ${elem.name}</h2>
            <div style="color: #666; display: flex; align-items: center; gap: 15px;">
                <span>ID: ${elem.id} | Tier: ${elem.tier || 'N/A'}</span>
                <button class="lookup-btn" onclick="lookupElement('${elem.name}')" style="padding: 4px 12px; font-size: 14px;">🔍 Lookup</button>
            </div>
        </div>
    `;
    
    html += `
        <div class="recipes" style="margin-top: 20px;">
            <h3>How to create ${elem.name}:</h3>
            <button class="add-btn" onclick="addNewRecipe('${elem.id}')">+ Add Recipe</button>
    `;
    
    if (recipes.length > 0) {
        recipes.forEach(recipe => {
            const elem1 = elements[recipe.elem1];
            const elem2 = elements[recipe.elem2];
            if (elem1 && elem2) {
                const emoji1 = emojis[elem1.id] || emojis[elem1.emojiIndex] || '❓';
                const emoji2 = emojis[elem2.id] || emojis[elem2.emojiIndex] || '❓';
                
                html += `
                    <div class="combo-item">
                        <div class="combo-formula">
                            <span>${emoji1} ${elem1.name} + ${emoji2} ${elem2.name}</span>
                        </div>
                        <div class="actions">
                            <button class="edit-btn" onclick="editRecipe('${recipe.elem1}', '${recipe.elem2}', '${elem.id}')">Edit</button>
                            <button class="remove-btn" onclick="deleteRecipe('${recipe.elem1}', '${recipe.elem2}', '${elem.id}')">Delete</button>
                        </div>
                    </div>
                `;
            }
        });
    } else {
        html += '<div style="color: #888; padding: 10px;">No recipes yet. Click "Add Recipe" to create one.</div>';
    }
    
    html += '</div>';
    
    if (creates.length > 0) {
        html += `
            <div class="combinations" style="margin-top: 20px;">
                <h3>${elem.name} combines with: (${creates.length} total)</h3>
        `;
        
        creates.forEach(item => {
            const otherElem = elements[item.otherElem];
            const resultElem = elements[item.result];
            if (otherElem && resultElem) {
                const otherEmoji = emojis[otherElem.id] || emojis[otherElem.emojiIndex] || '❓';
                const resultEmoji = emojis[resultElem.id] || emojis[resultElem.emojiIndex] || '❓';
                
                html += `
                    <div class="combo-item">
                        <div class="combo-formula">
                            <span>${emoji} + ${otherEmoji} ${otherElem.name}</span>
                            <span>→</span>
                            <span style="cursor: pointer;" onclick="showElement('${item.result}')">${resultEmoji} ${resultElem.name}</span>
                        </div>
                        <div class="actions">
                            <button class="remove-btn" onclick="deleteCombinationFromElement('${elementId}', '${item.otherElem}', '${item.result}')">Delete</button>
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    html += `
        <div class="edit-form">
            <h3>Edit Element</h3>
            <div class="form-group">
                <label>Emoji</label>
                <div class="emoji-picker">
                    <input type="text" id="edit-emoji" class="emoji-input" value="${emoji}">
                </div>
            </div>
            <button onclick="saveElement()">Save Changes</button>
            <button class="remove-btn" style="margin-left: 10px;" onclick="deleteElement('${elem.id}')">Delete Element</button>
        </div>
    `;
    
    results.innerHTML = html;
    results.classList.add('active');
}

function renderCombinationsList(creates, elementId, elementEmoji) {
    const totalPages = Math.ceil(creates.length / COMBINATIONS_PER_PAGE);
    const startIndex = (currentCombinationsPage - 1) * COMBINATIONS_PER_PAGE;
    const endIndex = startIndex + COMBINATIONS_PER_PAGE;
    const pageItems = creates.slice(startIndex, endIndex);
    
    let html = '';
    
    pageItems.forEach((item, index) => {
        const otherElem = elements[item.otherElem];
        const resultElem = elements[item.result];
        if (otherElem && resultElem) {
            const otherEmoji = emojis[otherElem.id] || emojis[otherElem.emojiIndex] || '❓';
            const resultEmoji = emojis[resultElem.id] || emojis[resultElem.emojiIndex] || '❓';
            
            html += `
                <div class="combo-item" id="combo-item-${startIndex + index}">
                    <div class="combo-formula">
                        <span>${elementEmoji} + ${otherEmoji} ${otherElem.name}</span>
                        <span>→</span>
                        <span style="cursor: pointer;" onclick="showElement('${item.result}', false)">${resultEmoji} ${resultElem.name}</span>
                    </div>
                    <div class="actions">
                        <button class="remove-btn" onclick="deleteCombination('${elementId}', '${item.otherElem}', '${item.result}', ${startIndex + index})">Delete</button>
                    </div>
                </div>
            `;
        }
    });
    
    if (totalPages > 1) {
        html += `
            <div class="pagination" style="margin-top: 20px; text-align: center;">
                <button 
                    ${currentCombinationsPage === 1 ? 'disabled' : ''} 
                    onclick="changeCombinationsPage(${currentCombinationsPage - 1}, '${elementId}')"
                    style="margin-right: 10px;"
                >
                    Previous
                </button>
                <span style="margin: 0 15px;">
                    Page ${currentCombinationsPage} of ${totalPages}
                </span>
                <button 
                    ${currentCombinationsPage === totalPages ? 'disabled' : ''} 
                    onclick="changeCombinationsPage(${currentCombinationsPage + 1}, '${elementId}')"
                    style="margin-left: 10px;"
                >
                    Next
                </button>
            </div>
        `;
    }
    
    return html;
}

window.changeCombinationsPage = function(page, elementId) {
    currentCombinationsPage = page;
    
    const combinationsListDiv = document.getElementById('combinations-list');
    let creates = null;
    if (combinationsListDiv && combinationsListDiv.dataset.creates) {
        try {
            creates = JSON.parse(combinationsListDiv.dataset.creates);
        } catch (e) {
            console.error('Failed to parse cached creates data:', e);
        }
    }
    
    if (creates && combinationsListDiv) {
        const elem = elements[elementId];
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
        combinationsListDiv.innerHTML = renderCombinationsList(creates, elementId, emoji);
    } else {
        showElement(elementId, true, creates);
    }
};

window.deleteCombinationFromElement = async function(elem1, elem2, result) {
    const resultElem = elements[result];
    const resultName = resultElem ? resultElem.name : `ID: ${result}`;
    
    if (!confirm(`Delete combination that creates "${resultName}"?`)) {
        return;
    }
    
    const originalValue1 = combinations[`${elem1}+${elem2}`];
    const originalValue2 = combinations[`${elem2}+${elem1}`];
    
    delete combinations[`${elem1}+${elem2}`];
    delete combinations[`${elem2}+${elem1}`];
    
    try {
        // Send deletion request
        const response = await fetch('/api/delete-combination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                element1: elem1,
                element2: elem2
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete combination');
        }
        
        // Add to local deleted combinations list for immediate filtering
        const normalizedCombo = parseInt(elem1) <= parseInt(elem2) ? `${elem1}+${elem2}` : `${elem2}+${elem1}`;
        if (!deletedCombinations.includes(normalizedCombo)) {
            deletedCombinations.push(normalizedCombo);
        }
        
        showMessage('Combination deleted successfully!', 'success');
        
        // Refresh the element view to update the list
        showElement(elem1); // Show the current element's page
    } catch (error) {
        combinations[`${elem1}+${elem2}`] = originalValue1;
        combinations[`${elem2}+${elem1}`] = originalValue2;
        
        showMessage('Failed to delete combination', 'error');
    }
};

// Enhanced delete combination function with inline support
window.deleteCombination = async function(elem1, elem2, result, itemIndex) {
    const resultElem = elements[result];
    const resultName = resultElem ? resultElem.name : `ID: ${result}`;
    
    if (!confirm(`Delete combination that creates "${resultName}"?`)) {
        return;
    }
    
    // Show loading state on the specific item
    const itemElement = document.getElementById(`combo-item-${itemIndex}`);
    if (itemElement) {
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none';
    }
    
    const originalValue1 = combinations[`${elem1}+${elem2}`];
    const originalValue2 = combinations[`${elem2}+${elem1}`];
    
    delete combinations[`${elem1}+${elem2}`];
    delete combinations[`${elem2}+${elem1}`];
    
    try {
        // Send deletion request
        const response = await fetch('/api/delete-combination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                element1: elem1,
                element2: elem2
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete combination');
        }
        
        // Add to local deleted combinations list for immediate filtering
        const normalizedCombo = parseInt(elem1) <= parseInt(elem2) ? `${elem1}+${elem2}` : `${elem2}+${elem1}`;
        if (!deletedCombinations.includes(normalizedCombo)) {
            deletedCombinations.push(normalizedCombo);
        }
        
        showMessage('Combination deleted successfully!', 'success');
        
        // Refresh the element view to update the list
        showElement(elem1); // Show the current element's page
    } catch (error) {
        combinations[`${elem1}+${elem2}`] = originalValue1;
        combinations[`${elem2}+${elem1}`] = originalValue2;
        
        // Restore item appearance
        if (itemElement) {
            itemElement.style.opacity = '1';
            itemElement.style.pointerEvents = 'auto';
        }
        
        showMessage('Failed to delete combination', 'error');
    }
};

window.editRecipe = function(elem1, elem2, result) {
    const results = document.getElementById('results');
    
    const e1 = elements[elem1];
    const e2 = elements[elem2];
    const res = elements[result];
    
    if (!e1 || !e2 || !res) return;
    
    const emoji1 = emojis[e1.id] || emojis[e1.emojiIndex] || '❓';
    const emoji2 = emojis[e2.id] || emojis[e2.emojiIndex] || '❓';
    const emojiRes = emojis[res.id] || emojis[res.emojiIndex] || '❓';
    
    let html = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
            <h3 style="color: #4ecdc4; margin-bottom: 20px;">Edit Recipe</h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 24px; margin-bottom: 20px;">
                    <span id="preview-elem1">${emoji1} ${e1.name}</span>
                    <span> + </span>
                    <span id="preview-elem2">${emoji2} ${e2.name}</span>
                    <span> → </span>
                    <span>${emojiRes} ${res.name}</span>
                </div>
            </div>
            
            <div class="form-group" style="position: relative;">
                <label>First Element - Search by name or ID</label>
                <input type="text" id="recipe-elem1" placeholder="Type to search..." autocomplete="off">
                <input type="hidden" id="recipe-elem1-id" value="${elem1}">
                <div id="search-results-1" style="display: none;"></div>
            </div>
            
            <div class="form-group" style="position: relative;">
                <label>Second Element - Search by name or ID</label>
                <input type="text" id="recipe-elem2" placeholder="Type to search..." autocomplete="off">
                <input type="hidden" id="recipe-elem2-id" value="${elem2}">
                <div id="search-results-2" style="display: none;"></div>
            </div>
            
            <button onclick="saveRecipe('${elem1}', '${elem2}', '${result}')">Save Recipe</button>
            <button class="secondary" onclick="showElement('${result}')">Cancel</button>
        </div>
    `;
    
    results.innerHTML = html;
    
    setupRecipeSearch('recipe-elem1', 'recipe-elem1-id', 'search-results-1', 'preview-elem1');
    setupRecipeSearch('recipe-elem2', 'recipe-elem2-id', 'search-results-2', 'preview-elem2');
};

function setupRecipeSearch(inputId, hiddenId, resultsId, previewId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const resultsDiv = document.getElementById(resultsId);
    const preview = previewId ? document.getElementById(previewId) : null;
    
    let searchTimeout;
    
    // Update the style of the results div to be a grid
    resultsDiv.style.cssText = `
        display: none;
        position: absolute;
        z-index: 1000;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 400px;
        overflow-y: auto;
        width: min(90vw, 800px);
        padding: 10px;
    `;
    
    input.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 1) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            const exactMatches = [];
            const startsWithMatches = [];
            const containsMatches = [];
            const queryLower = query.toLowerCase();
            
            for (const [id, elem] of Object.entries(window.elements)) {
                const nameLower = elem.name.toLowerCase();
                
                if (nameLower === queryLower || id.toString() === query) {
                    // Exact match - highest priority
                    exactMatches.push({ id, ...elem });
                } else if (nameLower.startsWith(queryLower)) {
                    // Starts with query - medium priority
                    startsWithMatches.push({ id, ...elem });
                } else if (nameLower.includes(queryLower) || id.toString().includes(query)) {
                    // Contains query - lowest priority
                    containsMatches.push({ id, ...elem });
                }
            }
            
            // Combine matches in priority order, limit to 120 total
            const matches = [
                ...exactMatches,
                ...startsWithMatches.slice(0, Math.max(0, 60 - exactMatches.length)),
                ...containsMatches.slice(0, Math.max(0, 120 - exactMatches.length - startsWithMatches.length))
            ];
            
            if (matches.length > 0) {
                let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">';
                matches.forEach((elem, index) => {
                    const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
                    const isExactMatch = index < exactMatches.length;
                    const borderColor = isExactMatch ? '#4ecdc4' : '#e0e0e0';
                    const borderWidth = isExactMatch ? '2px' : '1px';
                    
                    html += `
                        <div style="
                            padding: 10px;
                            cursor: pointer;
                            border: ${borderWidth} solid ${borderColor};
                            border-radius: 6px;
                            text-align: center;
                            transition: all 0.2s;
                            background: #f8f8f8;
                            ${isExactMatch ? 'box-shadow: 0 0 0 1px #4ecdc4 inset;' : ''}
                        " 
                        onmouseover="this.style.background='#f0f0f0'; this.style.borderColor='#4ecdc4'; this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.background='#f8f8f8'; this.style.borderColor='${borderColor}'; this.style.transform='scale(1)'"
                        onclick="selectRecipeElement('${inputId}', '${hiddenId}', '${previewId}', '${elem.id}', '${elem.name.replace(/'/g, "\\'")}', '${emoji}')">
                            <div style="font-size: 28px; margin-bottom: 5px;">${emoji}</div>
                            <div style="font-size: 12px; font-weight: 500; color: #333; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${elem.name}
                            </div>
                            <div style="font-size: 10px; color: #888;">ID: ${elem.id}</div>
                        </div>
                    `;
                });
                html += '</div>';
                resultsDiv.innerHTML = html;
                resultsDiv.style.display = 'block';
                
                // Position the grid below the input relative to the container
                const inputRect = input.getBoundingClientRect();
                const containerRect = input.closest('.form-group') || input.parentElement;
                if (containerRect) {
                    resultsDiv.style.position = 'absolute';
                    resultsDiv.style.top = (input.offsetTop + input.offsetHeight + 5) + 'px';
                    resultsDiv.style.left = '0';
                    resultsDiv.style.right = '0';
                } else {
                    resultsDiv.style.top = (inputRect.bottom + window.scrollY + 5) + 'px';
                    resultsDiv.style.left = inputRect.left + 'px';
                }
            } else {
                resultsDiv.innerHTML = '<div style="padding: 20px; color: #666; text-align: center; background: #f8f8f8; border-radius: 6px;">No elements found</div>';
                resultsDiv.style.display = 'block';
                
                // Position even when no results
                const inputRect = input.getBoundingClientRect();
                const containerRect = input.closest('.form-group') || input.parentElement;
                if (containerRect) {
                    resultsDiv.style.position = 'absolute';
                    resultsDiv.style.top = (input.offsetTop + input.offsetHeight + 5) + 'px';
                    resultsDiv.style.left = '0';
                    resultsDiv.style.right = '0';
                } else {
                    resultsDiv.style.top = (inputRect.bottom + window.scrollY + 5) + 'px';
                    resultsDiv.style.left = inputRect.left + 'px';
                }
            }
        }, 200);
    });
    
    // Add click outside handler only once
    if (!resultsDiv.hasAttribute('data-click-handler')) {
        resultsDiv.setAttribute('data-click-handler', 'true');
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    }
}

window.selectRecipeElement = function(inputId, hiddenId, previewId, elemId, elemName, emoji) {
    document.getElementById(inputId).value = elemName;
    document.getElementById(hiddenId).value = elemId;
    if (previewId && document.getElementById(previewId)) {
        document.getElementById(previewId).textContent = `${emoji} ${elemName}`;
    }
    // Find and hide all visible search results
    const allResults = document.querySelectorAll('[id*="search-results"], [id*="-results"]');
    allResults.forEach(div => {
        if (div.style.display !== 'none') {
            div.style.display = 'none';
        }
    });
};

window.saveRecipe = async function(oldElem1, oldElem2, result) {
    const newElem1 = document.getElementById('recipe-elem1-id').value;
    const newElem2 = document.getElementById('recipe-elem2-id').value;
    
    if (!newElem1 || !newElem2 || !elements[newElem1] || !elements[newElem2]) {
        showMessage('Please select valid elements from the search', 'error');
        return;
    }
    
    if ((newElem1 === oldElem1 && newElem2 === oldElem2) || (newElem1 === oldElem2 && newElem2 === oldElem1)) {
        showMessage('No changes made', 'success');
        showElement(result);
        return;
    }
    
    // Check if this combination is in the deleted list
    const normalizedCombo = parseInt(newElem1) <= parseInt(newElem2) ? `${newElem1}+${newElem2}` : `${newElem2}+${newElem1}`;
    const isDeleted = deletedCombinations.includes(normalizedCombo);
    
    const existingResult = combinations[`${newElem1}+${newElem2}`] || combinations[`${newElem2}+${newElem1}`];
    if (existingResult && existingResult != result) {
        const existingElement = elements[existingResult];
        const existingName = existingElement ? existingElement.name : `ID: ${existingResult}`;
        const existingEmoji = existingElement ? (emojis[existingElement.id] || emojis[existingElement.emojiIndex] || '❓') : '❓';
        
        if (!confirm(`⚠️ Warning: This combination already creates "${existingEmoji} ${existingName}".\n\nDo you want to change it to create "${elements[result].name}" instead?`)) {
            return;
        }
    }
    
    // Remove from deleted combinations list if it was previously deleted
    if (isDeleted) {
        const index = deletedCombinations.indexOf(normalizedCombo);
        if (index > -1) {
            deletedCombinations.splice(index, 1);
        }
    }
    
    delete combinations[`${oldElem1}+${oldElem2}`];
    delete combinations[`${oldElem2}+${oldElem1}`];
    
    combinations[`${newElem1}+${newElem2}`] = parseInt(result);
    combinations[`${newElem2}+${newElem1}`] = parseInt(result);
    
    const newCombos = {};
    newCombos[`${newElem1}+${newElem2}`] = parseInt(result);
    newCombos[`${newElem2}+${newElem1}`] = parseInt(result);
    
    const saved = await saveToServer(null, newCombos, null, isDeleted ? normalizedCombo : null);
    
    if (saved) {
        showMessage('Recipe updated and saved!', 'success');
        
        window.combinations[`${newElem1}+${newElem2}`] = parseInt(result);
        window.combinations[`${newElem2}+${newElem1}`] = parseInt(result);
        
        // Notify the game loader to update its cache
        if (window.elementLoader && typeof window.elementLoader.addCombination === 'function') {
            window.elementLoader.addCombination(newElem1, newElem2, parseInt(result));
        }
    } else {
        combinations[`${oldElem1}+${oldElem2}`] = parseInt(result);
        combinations[`${oldElem2}+${oldElem1}`] = parseInt(result);
        delete combinations[`${newElem1}+${newElem2}`];
        delete combinations[`${newElem2}+${newElem1}`];
    }
    
    setTimeout(() => {
        showElement(result);
    }, 1000);
};

window.saveElement = async function() {
    if (!currentElement) return;
    
    const newEmoji = document.getElementById('edit-emoji').value.trim();
    
    if (newEmoji) {
        // Update local emoji immediately
        window.emojis[currentElement.id] = newEmoji;
        
        const newEmojis = {};
        newEmojis[currentElement.id] = newEmoji;
        
        console.log('[Cache Debug] Saving emoji update for element', currentElement.id, ':', newEmoji);
        
        const saved = await saveToServer(null, null, newEmojis);
        
        if (saved) {
            showMessage('Element emoji updated and saved!', 'success');
            
            // Force a complete data reload to ensure persistence
            console.log('[Cache Debug] Forcing reload after emoji save...');
            await forceReload();
            
            // Re-show the element with fresh data
            setTimeout(() => {
                showElement(currentElement.id);
            }, 100);
        } else {
            // Revert local change if save failed
            delete window.emojis[currentElement.id];
            showMessage('Failed to save emoji update', 'error');
        }
    }
};

window.copyEmoji = function(emoji) {
    navigator.clipboard.writeText(emoji).then(() => {
        showMessage('Emoji copied!', 'success');
    }).catch(err => {
        showMessage('Failed to copy emoji', 'error');
    });
};

function hideResults() {
    const results = document.getElementById('results');
    if (results) {
        results.classList.remove('active');
        results.innerHTML = '';
    }
    
    const grid = document.getElementById('elements-grid');
    const pagination = document.getElementById('pagination');
    if (grid) grid.style.display = 'grid';
    if (pagination) pagination.style.display = 'flex';
    
    // Restore saved navigation state
    if (window.navigationState && window.navigationState.scrollPosition !== undefined) {
        // Restore variables
        if (typeof currentPage !== 'undefined') currentPage = window.navigationState.currentPage;
        if (typeof currentLetter !== 'undefined') currentLetter = window.navigationState.currentLetter;
        if (typeof searchQuery !== 'undefined') searchQuery = window.navigationState.searchQuery;
        if (typeof tierFilter !== 'undefined') tierFilter = window.navigationState.tierFilter;
        
        // Restore UI values
        const searchBox = document.getElementById('search-box');
        const tierFilterEl = document.getElementById('tier-filter');
        
        if (searchBox) searchBox.value = window.navigationState.searchQuery;
        if (tierFilterEl) tierFilterEl.value = window.navigationState.tierFilter;
        
        // Update letter filter buttons
        const letterBtns = document.querySelectorAll('.letter-btn');
        letterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.letter === window.navigationState.currentLetter) {
                btn.classList.add('active');
            }
        });
        
        // Re-apply filters and display
        if (typeof filterAndDisplay === 'function') {
            filterAndDisplay();
        }
        
        // Restore scroll position after a brief delay to ensure content is rendered
        setTimeout(() => {
            window.scrollTo(0, window.navigationState.scrollPosition);
        }, 50);
    }
}

function lookupElement(elementName) {
    // Encode the element name for use in URL
    const encodedName = encodeURIComponent(elementName);
    // Open DuckDuckGo search in a new tab
    window.open(`https://duckduckgo.com/?q=${encodedName}`, '_blank');
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.innerHTML = text.replace(/\n/g, '<br>');
    msg.className = `message ${type} active`;
    
    setTimeout(() => {
        msg.classList.remove('active');
    }, 4000);
}

// Make functions globally available
window.showElement = showElement;
window.forceReload = forceReload;

async function saveToServer(element, newCombinations, newEmojis, removeFromDeleted) {
    try {
        let response = await fetch('/api/save-element-main', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                element: element || null,
                combinations: newCombinations || null,
                emojis: newEmojis || null,
                removeFromDeleted: removeFromDeleted || null
            })
        });
        
        if (!response.ok && response.status === 404) {
            response = await fetch('/api/save-element', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    element: element || null,
                    combinations: newCombinations || null,
                    emojis: newEmojis || null,
                    removeFromDeleted: removeFromDeleted || null
                })
            });
        }
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        if (response.url.includes('/api/save-element')) {
            showMessage('Saved! (Server restart required for full functionality)', 'success');
        }
        
        return true;
    } catch (error) {
        showMessage('Failed to save to server - Please restart the server', 'error');
        return false;
    }
}

// Create new element form
window.showCreateForm = function() {
    const results = document.getElementById('results');
    if (!results) return;
    
    // Hide the elements grid
    const grid = document.getElementById('elements-grid');
    const pagination = document.getElementById('pagination');
    if (grid) grid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    
    // Generate next available ID
    const maxId = Math.max(...Object.keys(elements).map(Number), 0);
    const newId = maxId + 1;
    
    let html = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
            <h2 style="color: #4ecdc4; margin-bottom: 20px;">🆕 Create New Element</h2>
            
            <div class="form-group">
                <label>Element Name</label>
                <input type="text" id="new-name" placeholder="Enter element name..." required>
            </div>
            
            <div class="form-group">
                <label>Emoji</label>
                <div class="emoji-picker">
                    <input type="text" id="new-emoji" class="emoji-input" value="🆕" maxlength="2">
                </div>
            </div>
            
            <div class="form-group">
                <label>Tier</label>
                <select id="new-tier" style="width: 100%; padding: 12px; background: #1a1a1a; border: 2px solid #333; color: #e0e0e0; border-radius: 6px;">
                    <option value="0">Tier 0 - Basic elements (Fire, Water, Earth, Air)</option>
                    <option value="1">Tier 1 - Simple combinations (Steam, Mud, Lava)</option>
                    <option value="2">Tier 2 - Complex natural (Ocean, Mountain, Forest)</option>
                    <option value="3">Tier 3 - Life forms (Plant, Animal, Fish)</option>
                    <option value="4">Tier 4 - Advanced life (Human, Bird, Tree)</option>
                    <option value="5">Tier 5 - Civilization (House, Tool, Farm)</option>
                    <option value="6">Tier 6 - Technology (Computer, Car, Phone)</option>
                    <option value="7">Tier 7 - Modern concepts (Internet, AI, Space)</option>
                    <option value="8">Tier 8 - Abstract/Complex (Philosophy, Quantum)</option>
                    <option value="9">Tier 9 - Fictional/Fantasy (Dragon, Magic, Superhero)</option>
                    <option value="10">Tier 10 - Ultimate/Joke elements (Universe, Meme)</option>
                </select>
                <div style="margin-top: 5px; font-size: 12px; color: #888; line-height: 1.4;">
                    <strong>Tier Guide:</strong> Higher tiers require more discoveries. Select based on complexity and prerequisites.
                </div>
            </div>
            
            <div class="form-group" style="margin-top: 10px;">
                <label style="color: #888;">ID: ${newId} (auto-generated)</label>
                <input type="hidden" id="new-id" value="${newId}">
            </div>
            
            <div class="section-divider">
                <h3 style="color: #4ecdc4; margin-bottom: 15px;">How to create this element</h3>
                <button class="add-btn" onclick="addRecipeRow()">+ Add Recipe</button>
                <div id="recipe-rows"></div>
            </div>
            
            <div class="section-divider">
                <h3 style="color: #4ecdc4; margin-bottom: 15px;">This element creates</h3>
                <button class="add-btn" onclick="addCreatesRow()">+ Add Combination</button>
                <div id="creates-rows"></div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button onclick="saveNewElement()">💾 Save & View</button>
                <button onclick="saveAndCreateAnother()">💾 Save & New</button>
                <button class="secondary" onclick="hideResults()">Cancel</button>
            </div>
        </div>
    `;
    
    results.innerHTML = html;
    results.classList.add('active');
    
    // Focus on name input
    document.getElementById('new-name').focus();
};

// Recipe row counter
let recipeRowId = 0;
let createsRowId = 0;

// Add recipe row
window.addRecipeRow = function() {
    const container = document.getElementById('recipe-rows');
    const rowId = `recipe-${recipeRowId++}`;
    
    const row = document.createElement('div');
    row.className = 'recipe-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" id="${rowId}-elem1" placeholder="Search first element..." autocomplete="off">
        <input type="hidden" id="${rowId}-elem1-id">
        <div id="${rowId}-elem1-results" style="display: none;"></div>
        
        <span style="margin: 0 10px;">+</span>
        
        <input type="text" id="${rowId}-elem2" placeholder="Search second element..." autocomplete="off">
        <input type="hidden" id="${rowId}-elem2-id">
        <div id="${rowId}-elem2-results" style="display: none;"></div>
        
        <button class="remove-btn" onclick="removeRow('${rowId}')">✕</button>
    `;
    
    container.appendChild(row);
    
    // Setup search for both inputs
    setupRecipeSearch(`${rowId}-elem1`, `${rowId}-elem1-id`, `${rowId}-elem1-results`, null);
    setupRecipeSearch(`${rowId}-elem2`, `${rowId}-elem2-id`, `${rowId}-elem2-results`, null);
};

// Add creates row
window.addCreatesRow = function() {
    const container = document.getElementById('creates-rows');
    const rowId = `creates-${createsRowId++}`;
    
    const row = document.createElement('div');
    row.className = 'recipe-row';
    row.id = rowId;
    row.innerHTML = `
        <span style="color: #888;">This +</span>
        
        <input type="text" id="${rowId}-other" placeholder="Search element..." autocomplete="off">
        <input type="hidden" id="${rowId}-other-id">
        <div id="${rowId}-other-results" style="display: none;"></div>
        
        <span style="margin: 0 10px;">=</span>
        
        <input type="text" id="${rowId}-result" placeholder="Search or create result..." autocomplete="off">
        <input type="hidden" id="${rowId}-result-id">
        <div id="${rowId}-result-results" style="display: none;"></div>
        
        <button class="remove-btn" onclick="removeRow('${rowId}')">✕</button>
    `;
    
    container.appendChild(row);
    
    // Setup search for both elements
    setupRecipeSearch(`${rowId}-other`, `${rowId}-other-id`, `${rowId}-other-results`, null);
    setupRecipeSearchWithCreate(`${rowId}-result`, `${rowId}-result-id`, `${rowId}-result-results`);
};

// Remove row
window.removeRow = function(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
};

// Save new element
window.saveNewElement = async function() {
    const name = document.getElementById('new-name').value.trim();
    const emoji = document.getElementById('new-emoji').value.trim();
    const tier = parseInt(document.getElementById('new-tier').value);
    const id = document.getElementById('new-id').value;
    
    if (!name) {
        showMessage('Please enter an element name', 'error');
        return;
    }
    
    // Check if name already exists
    for (const elem of Object.values(elements)) {
        if (elem.name.toLowerCase() === name.toLowerCase()) {
            showMessage('An element with this name already exists', 'error');
            return;
        }
    }
    
    // Create the new element
    const newElement = {
        id: parseInt(id),
        name: name,
        tier: tier,
        emojiIndex: parseInt(id) // Use ID as emoji index
    };
    
    // Add to elements
    elements[id] = newElement;
    
    // Set emoji
    if (emoji) {
        emojis[id] = emoji;
        // Only set emoji for the specific element ID, not the shared emojiIndex
        emojis[newElement.id] = emoji;
    }
    
    // Process recipes
    let recipesAdded = 0;
    const recipeContainer = document.getElementById('recipe-rows');
    if (recipeContainer) {
        const recipeRows = recipeContainer.querySelectorAll('.recipe-row');
        recipeRows.forEach(row => {
            const rowId = row.id;
            const elem1Id = document.getElementById(`${rowId}-elem1-id`).value;
            const elem2Id = document.getElementById(`${rowId}-elem2-id`).value;
            
            if (elem1Id && elem2Id) {
                // Check if this combination already exists
                const existingResult = combinations[`${elem1Id}+${elem2Id}`] || combinations[`${elem2Id}+${elem1Id}`];
                if (existingResult) {
                    const existingElement = elements[existingResult];
                    const existingName = existingElement ? existingElement.name : `ID: ${existingResult}`;
                    const elem1Name = elements[elem1Id]?.name || elem1Id;
                    const elem2Name = elements[elem2Id]?.name || elem2Id;
                    showMessage(`⚠️ Warning: ${elem1Name} + ${elem2Name} already creates "${existingName}". Skipping this recipe.`, 'error');
                } else {
                    combinations[`${elem1Id}+${elem2Id}`] = parseInt(id);
                    combinations[`${elem2Id}+${elem1Id}`] = parseInt(id);
                    recipesAdded++;
                }
            }
        });
    }
    
    // Process creates
    const createsContainer = document.getElementById('creates-rows');
    if (createsContainer) {
        const createsRows = createsContainer.querySelectorAll('.recipe-row');
        createsRows.forEach(row => {
            const rowId = row.id;
            const otherId = document.getElementById(`${rowId}-other-id`).value;
            const resultIdOrName = document.getElementById(`${rowId}-result-id`).value;
            
            if (otherId && resultIdOrName) {
                let resultId = null;
                
                // Check if it's a new element to create
                if (resultIdOrName.startsWith('NEW:')) {
                    const resultName = resultIdOrName.substring(4);
                    // Create new element
                    const nextId = Math.max(...Object.keys(elements).map(Number), 0) + 1;
                    resultId = nextId.toString();
                    const newResultElement = {
                        id: nextId,
                        name: resultName,
                        tier: tier + 1, // One tier higher
                        emojiIndex: nextId
                    };
                    elements[resultId] = newResultElement;
                    emojis[resultId] = '🆕'; // Default emoji for new results
                } else {
                    // Use existing element
                    resultId = resultIdOrName;
                }
                
                if (resultId) {
                    // Add combination
                    combinations[`${id}+${otherId}`] = parseInt(resultId);
                    combinations[`${otherId}+${id}`] = parseInt(resultId);
                }
            }
        });
    }
    
    // Collect all new combinations
    const newCombos = {};
    const recipeRows = recipeContainer ? recipeContainer.querySelectorAll('.recipe-row') : [];
    recipeRows.forEach(row => {
        const rowId = row.id;
        const elem1Id = document.getElementById(`${rowId}-elem1-id`).value;
        const elem2Id = document.getElementById(`${rowId}-elem2-id`).value;
        if (elem1Id && elem2Id) {
            newCombos[`${elem1Id}+${elem2Id}`] = parseInt(id);
            newCombos[`${elem2Id}+${elem1Id}`] = parseInt(id);
        }
    });
    
    const createsRows = createsContainer ? createsContainer.querySelectorAll('.recipe-row') : [];
    createsRows.forEach(row => {
        const rowId = row.id;
        const otherId = document.getElementById(`${rowId}-other-id`).value;
        const resultId = elements[document.getElementById(`${rowId}-result-id`).value]?.id;
        if (otherId && resultId) {
            newCombos[`${id}+${otherId}`] = parseInt(resultId);
            newCombos[`${otherId}+${id}`] = parseInt(resultId);
        }
    });
    
    // Collect new emojis
    const newEmojis = {};
    if (emoji) {
        newEmojis[id] = emoji;
        newEmojis[newElement.emojiIndex] = emoji;
    }
    
    // Save to server
    const saved = await saveToServer(newElement, newCombos, newEmojis);
    
    if (saved) {
        // Ensure the element is properly added to global elements
        window.elements[id] = newElement;
        
        // Ensure all emojis are updated globally
        if (emoji) {
            window.emojis[id] = emoji;
        }
        
        // Notify the game loader about new combinations
        if (window.elementLoader && typeof window.elementLoader.addCombination === 'function') {
            Object.entries(newCombos).forEach(([combo, result]) => {
                const [elem1, elem2] = combo.split('+');
                if (elem1 && elem2) {
                    window.elementLoader.addCombination(elem1, elem2, result);
                }
            });
        }
        
        // Show detailed success message
        let successMsg = `✅ Element "${name}" created and saved!`;
        if (recipesAdded > 0) {
            successMsg += `\n📝 ${recipesAdded} recipe${recipesAdded > 1 ? 's' : ''} added`;
        }
        
        showMessage(successMsg, 'success');
        
        // Force reload to ensure new element is searchable
        console.log('[Cache Debug] Forcing reload after element creation...');
        await forceReload();
        
        // Show the new element
        setTimeout(() => {
            showElement(id);
        }, 100);
    }
};

// Save and create another
window.saveAndCreateAnother = async function() {
    // First save the current element
    const name = document.getElementById('new-name').value.trim();
    if (name) {
        await saveNewElement();
        
        // Then show a new create form
        setTimeout(() => {
            showCreateForm();
        }, 1000);
    }
};

// Setup recipe search with create option
function setupRecipeSearchWithCreate(inputId, hiddenId, resultsId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const resultsDiv = document.getElementById(resultsId);
    
    let searchTimeout;
    
    // Update the style of the results div to be a grid
    resultsDiv.style.cssText = `
        display: none;
        position: absolute;
        z-index: 1000;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-height: 400px;
        overflow-y: auto;
        width: min(90vw, 800px);
        padding: 10px;
    `;
    
    input.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 1) {
            resultsDiv.style.display = 'none';
            hidden.value = '';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            const exactMatches = [];
            const startsWithMatches = [];
            const containsMatches = [];
            const queryLower = query.toLowerCase();
            
            // Search existing elements
            for (const [id, elem] of Object.entries(window.elements)) {
                const nameLower = elem.name.toLowerCase();
                
                if (nameLower === queryLower || id.toString() === query) {
                    // Exact match - highest priority
                    exactMatches.push({ id, ...elem });
                } else if (nameLower.startsWith(queryLower)) {
                    // Starts with query - medium priority
                    startsWithMatches.push({ id, ...elem });
                } else if (nameLower.includes(queryLower) || id.toString().includes(query)) {
                    // Contains query - lowest priority
                    containsMatches.push({ id, ...elem });
                }
            }
            
            // Combine matches in priority order, limit to 120 total
            const matches = [
                ...exactMatches,
                ...startsWithMatches.slice(0, Math.max(0, 60 - exactMatches.length)),
                ...containsMatches.slice(0, Math.max(0, 120 - exactMatches.length - startsWithMatches.length))
            ];
            
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">';
            
            // Show create new option if exact match doesn't exist
            let exactMatch = false;
            for (const elem of Object.values(elements)) {
                if (elem.name.toLowerCase() === queryLower) {
                    exactMatch = true;
                    break;
                }
            }
            
            if (!exactMatch && query.length >= 2) {
                html += `
                    <div style="
                        padding: 10px;
                        cursor: pointer;
                        border: 2px solid #4ecdc4;
                        border-radius: 6px;
                        text-align: center;
                        transition: all 0.2s;
                        background: #f0fffe;
                        grid-column: span 4;
                    " 
                    onmouseover="this.style.background='#e0fff9'; this.style.transform='scale(1.02)'" 
                    onmouseout="this.style.background='#f0fffe'; this.style.transform='scale(1)'"
                    onclick="selectNewElement('${inputId}', '${hiddenId}', '${query}')">
                        <div style="font-size: 28px; margin-bottom: 5px;">➕</div>
                        <div style="font-size: 14px; font-weight: 500; color: #2a9d8f;">Create new: "${query}"</div>
                    </div>
                `;
            }
            
            // Show existing matches
            matches.forEach((elem, index) => {
                // Prefer element-specific emoji over shared emojiIndex
                const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
                const isExactMatch = index < exactMatches.length;
                const borderColor = isExactMatch ? '#4ecdc4' : '#e0e0e0';
                const borderWidth = isExactMatch ? '2px' : '1px';
                
                html += `
                    <div style="
                        padding: 10px;
                        cursor: pointer;
                        border: ${borderWidth} solid ${borderColor};
                        border-radius: 6px;
                        text-align: center;
                        transition: all 0.2s;
                        background: #f8f8f8;
                        ${isExactMatch ? 'box-shadow: 0 0 0 1px #4ecdc4 inset;' : ''}
                    " 
                    onmouseover="this.style.background='#f0f0f0'; this.style.borderColor='#4ecdc4'; this.style.transform='scale(1.05)'" 
                    onmouseout="this.style.background='#f8f8f8'; this.style.borderColor='${borderColor}'; this.style.transform='scale(1)'"
                    onclick="selectRecipeElement('${inputId}', '${hiddenId}', null, '${elem.id}', '${elem.name.replace(/'/g, "\\'")}', '${emoji}')">
                        <div style="font-size: 28px; margin-bottom: 5px;">${emoji}</div>
                        <div style="font-size: 12px; font-weight: 500; color: #333; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${elem.name}
                        </div>
                        <div style="font-size: 10px; color: #888;">ID: ${elem.id}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            if (matches.length > 0 || (!exactMatch && query.length >= 2)) {
                resultsDiv.innerHTML = html;
                resultsDiv.style.display = 'block';
                
                // Position the grid below the input relative to the container
                const inputRect = input.getBoundingClientRect();
                const containerRect = input.closest('.form-group') || input.parentElement;
                if (containerRect) {
                    resultsDiv.style.position = 'absolute';
                    resultsDiv.style.top = (input.offsetTop + input.offsetHeight + 5) + 'px';
                    resultsDiv.style.left = '0';
                    resultsDiv.style.right = '0';
                } else {
                    resultsDiv.style.top = (inputRect.bottom + window.scrollY + 5) + 'px';
                    resultsDiv.style.left = inputRect.left + 'px';
                }
            } else {
                resultsDiv.innerHTML = '<div style="padding: 20px; color: #666; text-align: center; background: #f8f8f8; border-radius: 6px;">No elements found</div>';
                resultsDiv.style.display = 'block';
                
                // Position even when no results
                const inputRect = input.getBoundingClientRect();
                const containerRect = input.closest('.form-group') || input.parentElement;
                if (containerRect) {
                    resultsDiv.style.position = 'absolute';
                    resultsDiv.style.top = (input.offsetTop + input.offsetHeight + 5) + 'px';
                    resultsDiv.style.left = '0';
                    resultsDiv.style.right = '0';
                } else {
                    resultsDiv.style.top = (inputRect.bottom + window.scrollY + 5) + 'px';
                    resultsDiv.style.left = inputRect.left + 'px';
                }
            }
        }, 200);
    });
    
    // Add click outside handler only once
    if (!resultsDiv.hasAttribute('data-click-handler')) {
        resultsDiv.setAttribute('data-click-handler', 'true');
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
                resultsDiv.style.display = 'none';
            }
        });
    }
}

// Select new element (to be created)
window.selectNewElement = function(inputId, hiddenId, name) {
    document.getElementById(inputId).value = name + ' (new)';
    document.getElementById(hiddenId).value = 'NEW:' + name;
    document.getElementById(inputId + '-results').style.display = 'none';
};

// Track recipe rows for bulk add
let bulkRecipeRowId = 0;

// Add new recipe to existing element (bulk mode)
window.addNewRecipe = function(elementId) {
    const results = document.getElementById('results');
    const elem = elements[elementId];
    if (!elem) return;
    
    // Prefer element-specific emoji over shared emojiIndex
    const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
    
    // Reset row counter
    bulkRecipeRowId = 0;
    
    let html = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px;">
            <h3 style="color: #4ecdc4; margin-bottom: 20px;">Add Recipes for ${emoji} ${elem.name}</h3>
            
            <div id="bulk-recipe-container">
                <!-- Recipe rows will be added here -->
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="addBulkRecipeRow()" style="background: #2a9d8f; border-color: #2a9d8f;">
                    + Add Another Recipe
                </button>
                <button onclick="saveAllNewRecipes('${elementId}')" style="background: #4ecdc4; border-color: #4ecdc4;">
                    Save All Recipes
                </button>
                <button class="secondary" onclick="showElement('${elementId}')">Cancel</button>
            </div>
        </div>
    `;
    
    results.innerHTML = html;
    
    // Add the first recipe row automatically
    addBulkRecipeRow();
};

// Add a new recipe row to the bulk form
window.addBulkRecipeRow = function() {
    const container = document.getElementById('bulk-recipe-container');
    const rowId = `bulk-recipe-${bulkRecipeRowId++}`;
    
    const row = document.createElement('div');
    row.className = 'recipe-row';
    row.id = rowId;
    row.style.cssText = 'background: #2a2a2a; padding: 15px; border-radius: 6px; margin-bottom: 15px; position: relative;';
    
    row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <h4 style="color: #4ecdc4; margin: 0;">Recipe #${bulkRecipeRowId}</h4>
        </div>
        
        ${bulkRecipeRowId > 1 ? `<button onclick="removeBulkRecipeRow('${rowId}')" style="position: absolute; top: 15px; right: 15px; background: #dc3545; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕ Remove</button>` : ''}
        
        <div style="display: flex; gap: 15px; align-items: flex-start;">
            <div class="form-group" style="position: relative; flex: 1;">
                <label style="display: block; height: 20px; margin-bottom: 5px;">First Element - Search by name or ID</label>
                <input type="text" id="${rowId}-elem1" placeholder="Type to search..." autocomplete="off">
                <input type="hidden" id="${rowId}-elem1-id">
                <div id="${rowId}-elem1-results" style="display: none;"></div>
            </div>
            
            <div class="form-group" style="position: relative; flex: 1;">
                <label style="display: block; height: 20px; margin-bottom: 5px;">Second Element - Search by name or ID</label>
                <input type="text" id="${rowId}-elem2" placeholder="Type to search..." autocomplete="off">
                <input type="hidden" id="${rowId}-elem2-id">
                <div id="${rowId}-elem2-results" style="display: none;"></div>
            </div>
        </div>
    `;
    
    container.appendChild(row);
    
    // Setup search for both inputs
    setupRecipeSearch(`${rowId}-elem1`, `${rowId}-elem1-id`, `${rowId}-elem1-results`, null);
    setupRecipeSearch(`${rowId}-elem2`, `${rowId}-elem2-id`, `${rowId}-elem2-results`, null);
};

// Remove a recipe row
window.removeBulkRecipeRow = function(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
};

// Save all new recipes at once
window.saveAllNewRecipes = async function(resultId) {
    const container = document.getElementById('bulk-recipe-container');
    const rows = container.querySelectorAll('.recipe-row');
    
    if (rows.length === 0) {
        showMessage('Please add at least one recipe', 'error');
        return;
    }
    
    const recipes = [];
    let hasErrors = false;
    
    // Validate all recipes first
    rows.forEach((row, index) => {
        const rowId = row.id;
        const elem1Id = document.getElementById(`${rowId}-elem1-id`).value;
        const elem2Id = document.getElementById(`${rowId}-elem2-id`).value;
        
        if (!elem1Id || !elem2Id) {
            showMessage(`Recipe #${index + 1}: Please select both elements`, 'error');
            hasErrors = true;
            return;
        }
        
        recipes.push({ elem1Id, elem2Id });
    });
    
    if (hasErrors) return;
    
    // Process all recipes
    let successCount = 0;
    let errorCount = 0;
    const newCombos = {};
    const removedFromDeleted = [];
    
    for (let i = 0; i < recipes.length; i++) {
        const { elem1Id, elem2Id } = recipes[i];
        
        // Check if this combination is in the deleted list
        const normalizedCombo = parseInt(elem1Id) <= parseInt(elem2Id) ? `${elem1Id}+${elem2Id}` : `${elem2Id}+${elem1Id}`;
        const isDeleted = deletedCombinations.includes(normalizedCombo);
        
        // Check if this combination already exists
        const existingResult = combinations[`${elem1Id}+${elem2Id}`] || combinations[`${elem2Id}+${elem1Id}`];
        
        if (existingResult && existingResult != resultId) {
            const existingElement = elements[existingResult];
            const existingName = existingElement ? existingElement.name : `ID: ${existingResult}`;
            const existingEmoji = existingElement ? (emojis[existingElement.id] || emojis[existingElement.emojiIndex] || '❓') : '❓';
            
            if (!confirm(`⚠️ Recipe #${i + 1}: This combination already creates "${existingEmoji} ${existingName}".\n\nDo you want to change it to create "${elements[resultId].name}" instead?`)) {
                errorCount++;
                continue;
            }
        }
        
        // Remove from deleted combinations list if it was previously deleted
        if (isDeleted) {
            const index = deletedCombinations.indexOf(normalizedCombo);
            if (index > -1) {
                deletedCombinations.splice(index, 1);
                removedFromDeleted.push(normalizedCombo);
            }
        }
        
        // Add the combination
        combinations[`${elem1Id}+${elem2Id}`] = parseInt(resultId);
        combinations[`${elem2Id}+${elem1Id}`] = parseInt(resultId);
        newCombos[`${elem1Id}+${elem2Id}`] = parseInt(resultId);
        newCombos[`${elem2Id}+${elem1Id}`] = parseInt(resultId);
        
        successCount++;
    }
    
    if (successCount === 0) {
        showMessage('No recipes were added', 'error');
        return;
    }
    
    // Save to server
    const saved = await saveToServer(null, newCombos, null, removedFromDeleted.length > 0 ? removedFromDeleted : null);
    
    if (saved) {
        const message = errorCount > 0 
            ? `Added ${successCount} recipes successfully! (${errorCount} skipped)`
            : `All ${successCount} recipes added successfully!`;
        showMessage(message, 'success');
        
        // Show the element again
        setTimeout(() => {
            showElement(resultId);
        }, 1000);
    } else {
        showMessage('Failed to save recipes. Please try again.', 'error');
    }
};

// Save new recipe
window.saveNewRecipe = async function(resultId) {
    const elem1Id = document.getElementById('new-recipe-elem1-id').value;
    const elem2Id = document.getElementById('new-recipe-elem2-id').value;
    
    if (!elem1Id || !elem2Id) {
        showMessage('Please select both elements', 'error');
        return;
    }
    
    // Check if this combination is in the deleted list
    const normalizedCombo = parseInt(elem1Id) <= parseInt(elem2Id) ? `${elem1Id}+${elem2Id}` : `${elem2Id}+${elem1Id}`;
    const isDeleted = deletedCombinations.includes(normalizedCombo);
    
    // Check if this combination already exists
    const existingResult = combinations[`${elem1Id}+${elem2Id}`] || combinations[`${elem2Id}+${elem1Id}`];
    if (existingResult && existingResult != resultId) {
        const existingElement = elements[existingResult];
        const existingName = existingElement ? existingElement.name : `ID: ${existingResult}`;
        const existingEmoji = existingElement ? (emojis[existingElement.id] || emojis[existingElement.emojiIndex] || '❓') : '❓';
        
        if (!confirm(`⚠️ Warning: This combination already creates "${existingEmoji} ${existingName}".\n\nDo you want to change it to create "${elements[resultId].name}" instead?`)) {
            return;
        }
    }
    
    // Remove from deleted combinations list if it was previously deleted
    if (isDeleted) {
        const index = deletedCombinations.indexOf(normalizedCombo);
        if (index > -1) {
            deletedCombinations.splice(index, 1);
        }
    }
    
    // Add the combination
    combinations[`${elem1Id}+${elem2Id}`] = parseInt(resultId);
    combinations[`${elem2Id}+${elem1Id}`] = parseInt(resultId);
    
    // Save to server
    const newCombos = {};
    newCombos[`${elem1Id}+${elem2Id}`] = parseInt(resultId);
    newCombos[`${elem2Id}+${elem1Id}`] = parseInt(resultId);
    
    const saved = await saveToServer(null, newCombos, null, isDeleted ? normalizedCombo : null);
    
    if (saved) {
        showMessage('Recipe added and saved!', 'success');
        
        // Update the global combinations object to ensure it's in sync
        window.combinations[`${elem1Id}+${elem2Id}`] = parseInt(resultId);
        window.combinations[`${elem2Id}+${elem1Id}`] = parseInt(resultId);
        
        // Notify the game loader to update its cache
        if (window.elementLoader && typeof window.elementLoader.addCombination === 'function') {
            window.elementLoader.addCombination(elem1Id, elem2Id, parseInt(resultId));
        }
        
        // Force reload to ensure data consistency
        console.log('[Cache Debug] Forcing reload after recipe save...');
        await forceReload();
        
        // Return to element view
        setTimeout(() => {
            showElement(resultId);
        }, 100);
    } else {
        // Revert if save failed
        delete combinations[`${elem1Id}+${elem2Id}`];
        delete combinations[`${elem2Id}+${elem1Id}`];
    }
};

// Delete recipe
window.deleteRecipe = async function(elem1, elem2, result) {
    // Check if this is a custom combination by checking if element IDs are >= 20000
    // or if the combination exists in our loaded custom combinations
    const isCustomElement1 = parseInt(elem1) >= 20000;
    const isCustomElement2 = parseInt(elem2) >= 20000;
    const isCustomResult = parseInt(result) >= 20000;
    const isCustomCombo = isCustomElement1 || isCustomElement2 || isCustomResult;
    
    let confirmMessage = 'Are you sure you want to delete this recipe?';
    
    if (!isCustomCombo) {
        confirmMessage = '⚠️ WARNING: This is a BASE GAME combination!\n\n' +
            'Deleting base game combinations can:\n' +
            '- Break element progression chains\n' +
            '- Make elements uncreatable\n' +
            '- Be restored on game updates\n\n' +
            'Are you SURE you want to delete this base game combination?';
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Store original values
    const originalValue = combinations[`${elem1}+${elem2}`];
    
    // Remove the combination
    delete combinations[`${elem1}+${elem2}`];
    delete combinations[`${elem2}+${elem1}`];
    
    // Delete from server
    try {
        const response = await fetch('/api/delete-combination', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ element1: elem1, element2: elem2 })
        });
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        // Ensure the combinations are removed from global object
        delete window.combinations[`${elem1}+${elem2}`];
        delete window.combinations[`${elem2}+${elem1}`];
        
        showMessage('Recipe deleted successfully!', 'success');
        
        // Refresh the element view
        showElement(result);
    } catch (error) {
        // Revert if delete failed
        combinations[`${elem1}+${elem2}`] = originalValue;
        combinations[`${elem2}+${elem1}`] = originalValue;
        showMessage('Failed to delete recipe', 'error');
    }
};

// Analyze element deletion impact
function analyzeElementDeletion(elementId) {
    const numericElementId = parseInt(elementId);
    const analysis = {
        element: elements[elementId],
        recipesCreating: [],
        combinationsUsing: [],
        dependentElements: new Set()
    };
    
    // Find recipes that create this element
    Object.entries(window.combinations).forEach(([combo, result]) => {
        if (parseInt(result) === numericElementId) {
            const [a, b] = combo.split('+');
            // Avoid duplicates
            if (parseInt(a) <= parseInt(b)) {
                analysis.recipesCreating.push({ elem1: a, elem2: b, combo });
            }
        }
    });
    
    // Find combinations where this element is used
    Object.entries(window.combinations).forEach(([combo, result]) => {
        if (!combo || !combo.includes('+')) return; // Skip invalid combinations
        
        const parts = combo.split('+');
        if (parts.length !== 2) return; // Skip malformed combinations
        
        const [a, b] = parts;
        if (parseInt(a) === numericElementId || parseInt(b) === numericElementId) {
            const otherElem = parseInt(a) === numericElementId ? b : a;
            analysis.combinationsUsing.push({ 
                combo,
                otherElem,
                result,
                otherElement: elements[otherElem],
                resultElement: elements[result]
            });
        }
    });
    
    // Find dependent elements (elements that can only be created through this element)
    function findDependents(elemId, visited = new Set()) {
        if (visited.has(elemId)) return;
        visited.add(elemId);
        
        // Find all elements created using this element
        analysis.combinationsUsing.forEach(item => {
            if (item.result != elemId) {
                // Check if this result element has any other recipes
                const otherRecipes = [];
                Object.entries(window.combinations).forEach(([combo, result]) => {
                    if (parseInt(result) === parseInt(item.result) && combo.split('+').every(id => parseInt(id) !== parseInt(elemId))) {
                        otherRecipes.push(combo);
                    }
                });
                
                // If no other recipes exist, this element is dependent
                if (otherRecipes.length === 0) {
                    analysis.dependentElements.add(item.result);
                    // Recursively find elements dependent on this one
                    findDependents(item.result, visited);
                }
            }
        });
    }
    
    findDependents(elementId);
    
    return analysis;
}

// Delete element
window.deleteElement = async function(elementId) {
    // Safety check - prevent deletion of core base elements
    // Core elements are 0-999, other base game elements are 1000-19999, custom are 20000+
    if (elementId < 1000) {
        showMessage('Cannot delete core base elements (ID < 1000)!', 'error');
        return;
    }
    
    // Warning for base game elements
    if (elementId < 20000) {
        if (!confirm('⚠️ WARNING: This is a BASE GAME element!\n\nDeleting base game elements can:\n- Break many combinations\n- Make other elements uncreatable\n- Cause game instability\n- Be restored on game updates\n\nAre you SURE you want to delete this base game element?')) {
            return;
        }
    }
    
    // Check if element exists
    if (!elements[elementId]) {
        showMessage('Element not found!', 'error');
        return;
    }
    
    // Analyze impact
    const analysis = analyzeElementDeletion(elementId);
    
    // Show impact review screen
    showDeleteImpact(elementId, analysis);
};

// Show delete impact screen
function showDeleteImpact(elementId, analysis) {
    const elem = analysis.element;
    // Prefer element-specific emoji over shared emojiIndex
    const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
    const results = document.getElementById('results');
    
    let html = `
        <div style="background: #1a0a0a; padding: 20px; border-radius: 8px; border: 2px solid #ff4444;">
            <h2 style="color: #ff4444; margin-bottom: 20px;">⚠️ Delete Element: ${emoji} ${elem.name}</h2>
            
            <div style="background: #2a1a1a; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="color: #faa; margin: 0;">This action will permanently delete this element and affect the following:</p>
            </div>
    `;
    
    // Show recipes that create this element
    if (analysis.recipesCreating.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ff6666;">🗑️ Recipes that create ${elem.name} (will be deleted):</h3>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 6px;">
        `;
        
        analysis.recipesCreating.forEach(recipe => {
            const e1 = elements[recipe.elem1];
            const e2 = elements[recipe.elem2];
            if (e1 && e2) {
                const emoji1 = emojis[e1.id] || emojis[e1.emojiIndex] || '❓';
                const emoji2 = emojis[e2.id] || emojis[e2.emojiIndex] || '❓';
                html += `
                    <div style="padding: 8px; border-bottom: 1px solid #333;">
                        ${emoji1} ${e1.name} + ${emoji2} ${e2.name} → ${emoji} ${elem.name}
                    </div>
                `;
            }
        });
        
        html += `</div></div>`;
    }
    
    // Show combinations using this element
    if (analysis.combinationsUsing.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ff9944;">⚠️ Combinations using ${elem.name} (need replacement):</h3>
                <div id="affected-combos" style="background: #1a1a1a; padding: 15px; border-radius: 6px;">
        `;
        
        analysis.combinationsUsing.forEach((item, index) => {
            const otherEmoji = item.otherElement ? (emojis[item.otherElement.id] || emojis[item.otherElement.emojiIndex] || '❓') : '❓';
            const resultEmoji = item.resultElement ? (emojis[item.resultElement.id] || emojis[item.resultElement.emojiIndex] || '❓') : '❓';
            const otherName = item.otherElement?.name || `ID: ${item.otherElem}`;
            const resultName = item.resultElement?.name || `ID: ${item.result}`;
            
            html += `
                <div id="combo-${index}" style="padding: 10px; border: 1px solid #444; border-radius: 4px; margin-bottom: 10px;">
                    <div style="margin-bottom: 10px;">
                        ${emoji} ${elem.name} + ${otherEmoji} ${otherName} → ${resultEmoji} ${resultName}
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editAffectedCombo(${index}, '${item.combo}', '${elementId}', '${item.otherElem}', '${item.result}')" style="padding: 5px 10px;">
                            ✏️ Edit
                        </button>
                        <button class="remove-btn" onclick="deleteAffectedCombo(${index}, '${item.combo}')" style="padding: 5px 10px;">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    // Show dependent elements
    if (analysis.dependentElements.size > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffaa44;">⚠️ Dependent elements (may become uncreatable):</h3>
                <div style="background: #1a1a1a; padding: 15px; border-radius: 6px;">
        `;
        
        Array.from(analysis.dependentElements).forEach(depId => {
            const depElem = elements[depId];
            if (depElem) {
                const depEmoji = emojis[depElem.id] || emojis[depElem.emojiIndex] || '❓';
                html += `
                    <div style="padding: 8px; border-bottom: 1px solid #333;">
                        ${depEmoji} ${depElem.name} (ID: ${depId})
                    </div>
                `;
            }
        });
        
        html += `</div></div>`;
    }
    
    // Action buttons
    html += `
        <div style="display: flex; gap: 10px; margin-top: 30px;">
            <button class="remove-btn" onclick="confirmDeleteElement('${elementId}')" style="padding: 10px 20px;">
                🗑️ Confirm Delete
            </button>
            <button class="secondary" onclick="showElement('${elementId}')" style="padding: 10px 20px;">
                Cancel
            </button>
        </div>
    `;
    
    html += `</div>`;
    
    results.innerHTML = html;
    
    // Store analysis for later use
    window.currentDeletionAnalysis = analysis;
}

// Edit affected combination
window.editAffectedCombo = function(index, combo, deletingElemId, otherElemId, resultId) {
    const comboDiv = document.getElementById(`combo-${index}`);
    const [a, b] = combo.split('+');
    
    let html = `
        <div style="background: #2a2a2a; padding: 10px; border-radius: 4px;">
            <div style="margin-bottom: 10px;">Replace deleted element with:</div>
            <input type="text" id="replace-${index}" placeholder="Search for element..." style="width: 100%; padding: 8px;">
            <input type="hidden" id="replace-${index}-id" value="">
            <div id="replace-${index}-results" style="display: none;"></div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="saveReplacementCombo(${index}, '${combo}', '${deletingElemId}', '${otherElemId}', '${resultId}')" style="padding: 5px 10px;">
                    Save
                </button>
                <button onclick="cancelEditCombo(${index})" style="padding: 5px 10px;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    comboDiv.innerHTML = html;
    
    // Setup search for replacement
    setupRecipeSearch(`replace-${index}`, `replace-${index}-id`, `replace-${index}-results`);
};

// Save replacement combo
window.saveReplacementCombo = function(index, oldCombo, deletingElemId, otherElemId, resultId) {
    const replacementId = document.getElementById(`replace-${index}-id`).value;
    
    if (!replacementId || !elements[replacementId]) {
        showMessage('Please select a valid replacement element', 'error');
        return;
    }
    
    // Update the analysis
    window.currentDeletionAnalysis.combinationsUsing[index].replacement = replacementId;
    
    // Update UI to show the change
    const comboDiv = document.getElementById(`combo-${index}`);
    const replacementElem = elements[replacementId];
    const replacementEmoji = emojis[replacementElem.id] || emojis[replacementElem.emojiIndex] || '❓';
    const otherElem = elements[otherElemId];
    const otherEmoji = emojis[otherElem.id] || emojis[otherElem.emojiIndex] || '❓';
    const resultElem = elements[resultId];
    const resultEmoji = emojis[resultElem.id] || emojis[resultElem.emojiIndex] || '❓';
    
    comboDiv.innerHTML = `
        <div style="padding: 10px;">
            <div style="margin-bottom: 5px; text-decoration: line-through; opacity: 0.5;">
                ${oldCombo.split('+').map(id => {
                    const e = elements[id];
                    const emoji = emojis[e?.emojiIndex] || emojis[id] || '❓';
                    return `${emoji} ${e?.name || id}`;
                }).join(' + ')} → ${resultEmoji} ${resultElem.name}
            </div>
            <div style="color: #4ecdc4;">
                ✅ Will be replaced with: ${replacementEmoji} ${replacementElem.name} + ${otherEmoji} ${otherElem.name} → ${resultEmoji} ${resultElem.name}
            </div>
        </div>
    `;
};

// Cancel edit combo
window.cancelEditCombo = function(index) {
    // Restore the original display for this combo
    const item = window.currentDeletionAnalysis.combinationsUsing[index];
    const elem = window.currentDeletionAnalysis.element;
    // Prefer element-specific emoji over shared emojiIndex
    const emoji = emojis[elem.id] || emojis[elem.emojiIndex] || '❓';
    const otherEmoji = item.otherElement ? (emojis[item.otherElement.id] || emojis[item.otherElement.emojiIndex] || '❓') : '❓';
    const resultEmoji = item.resultElement ? (emojis[item.resultElement.id] || emojis[item.resultElement.emojiIndex] || '❓') : '❓';
    const otherName = item.otherElement?.name || `ID: ${item.otherElem}`;
    const resultName = item.resultElement?.name || `ID: ${item.result}`;
    
    const comboDiv = document.getElementById(`combo-${index}`);
    comboDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            ${emoji} ${elem.name} + ${otherEmoji} ${otherName} → ${resultEmoji} ${resultName}
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="editAffectedCombo(${index}, '${item.combo}', '${elem.id}', '${item.otherElem}', '${item.result}')" style="padding: 5px 10px;">
                ✏️ Edit
            </button>
            <button class="remove-btn" onclick="deleteAffectedCombo(${index}, '${item.combo}')" style="padding: 5px 10px;">
                🗑️ Delete
            </button>
        </div>
    `;
};

// Delete affected combo
window.deleteAffectedCombo = function(index, combo) {
    // Mark for deletion
    window.currentDeletionAnalysis.combinationsUsing[index].markedForDeletion = true;
    
    // Update UI
    const comboDiv = document.getElementById(`combo-${index}`);
    comboDiv.style.opacity = '0.5';
    comboDiv.style.textDecoration = 'line-through';
    comboDiv.innerHTML += '<div style="color: #ff4444; margin-top: 10px;">✗ Marked for deletion</div>';
};

// Confirm element deletion
window.confirmDeleteElement = async function(elementId) {
    const analysis = window.currentDeletionAnalysis;
    
    if (!analysis || !analysis.element) {
        showMessage('Error: Analysis data not found. Please try again.', 'error');
        return;
    }
    
    if (!confirm(`Are you absolutely sure you want to delete "${analysis.element.name}"?\n\nThis will:\n- Delete ${analysis.recipesCreating.length} recipes\n- Affect ${analysis.combinationsUsing.length} combinations\n- Potentially make ${analysis.dependentElements.size} elements uncreatable`)) {
        return;
    }
    
    try {
        // Prepare the deletion data
        const deletionData = {
            elementId: elementId,
            replacements: {},
            deleteCombos: []
        };
        
        // Process combination changes
        analysis.combinationsUsing.forEach((item, index) => {
            if (item.markedForDeletion) {
                deletionData.deleteCombos.push(item.combo);
            } else if (item.replacement) {
                deletionData.replacements[item.combo] = item.replacement;
            }
        });
        
        // Send deletion request to server
        const response = await fetch('/api/delete-element', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deletionData)
        });
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        // Remove from local data
        delete elements[elementId];
        delete emojis[elementId];
        
        // Remove recipes that create this element
        analysis.recipesCreating.forEach(recipe => {
            delete combinations[recipe.combo];
            delete combinations[`${recipe.elem2}+${recipe.elem1}`];
        });
        
        // Apply combination changes
        analysis.combinationsUsing.forEach(item => {
            if (item.markedForDeletion) {
                delete combinations[item.combo];
                const [a, b] = item.combo.split('+');
                delete combinations[`${b}+${a}`];
            } else if (item.replacement) {
                delete combinations[item.combo];
                const [a, b] = item.combo.split('+');
                delete combinations[`${b}+${a}`];
                
                // Add new combination with replacement
                combinations[`${item.replacement}+${item.otherElem}`] = item.result;
                combinations[`${item.otherElem}+${item.replacement}`] = item.result;
            }
        });
        
        showMessage(`Element "${analysis.element.name}" deleted successfully!`, 'success');
        
        // Clear search and hide results
        document.getElementById('search').value = '';
        hideResults();
        
    } catch (error) {
        console.error('Error deleting element:', error);
        showMessage(`Failed to delete element: ${error.message}`, 'error');
    }
};

// Add this CSS to your styles
const paginationStyles = `
    .pagination button {
        padding: 8px 16px;
        background: #4ecdc4;
        color: #000;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
    }
    
    .pagination button:hover:not(:disabled) {
        background: #45b8b0;
        transform: scale(1.05);
    }
    
    .pagination button:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
        transform: none;
    }
    
    .combo-item {
        transition: all 0.3s;
    }
    
    .combo-item .actions {
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .combo-item:hover .actions {
        opacity: 1;
    }
`;

// Add styles to document if not already present
if (!document.getElementById('pagination-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'pagination-styles';
    styleElement.textContent = paginationStyles;
    document.head.appendChild(styleElement);
}

// Load cleanup stats
async function loadCleanupStats() {
    try {
        // Count deleted combinations
        let deletedCount = 0;
        try {
            const deletedResponse = await fetch('/elements/deleted-combinations.json');
            if (deletedResponse.ok) {
                const deletedData = await deletedResponse.json();
                deletedCount = deletedData.length;
            }
        } catch (err) {
            console.log('No deleted combinations file');
        }
        
        // Update UI if elements exist
        const deletedCountEl = document.getElementById('deleted-count');
        const totalCombosEl = document.getElementById('total-combos');
        if (deletedCountEl) deletedCountEl.textContent = deletedCount;
        if (totalCombosEl) totalCombosEl.textContent = Object.keys(combinations).length;
        
        // Disable button if nothing to clean
        const cleanupBtn = document.getElementById('cleanup-btn');
        if (deletedCount === 0) {
            cleanupBtn.textContent = 'Nothing to Clean';
            cleanupBtn.disabled = true;
        }
    } catch (err) {
        console.error('Error loading cleanup stats:', err);
    }
}

// Find broken combinations
window.findBrokenCombinations = async function() {
    const brokenBtn = document.getElementById('broken-btn');
    const resultDiv = document.getElementById('broken-result');
    
    // Show loading state
    brokenBtn.disabled = true;
    brokenBtn.textContent = 'Finding broken combinations...';
    resultDiv.classList.remove('active');
    
    try {
        const response = await fetch('/api/cleanup-broken-combinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            resultDiv.className = 'broken-result success active';
            
            let html = `<strong>✅ ${result.message}</strong><br>`;
            
            if (result.stats.found > 0) {
                html += `<small>
                    Found: ${result.stats.found} broken combinations<br>
                    Added to deletion list: ${result.stats.added}<br>
                    Total marked for deletion: ${result.stats.totalDeleted}
                </small>`;
                
                // Show examples
                if (result.examples && result.examples.length > 0) {
                    html += `<div class="broken-examples">
                        <strong>Examples of broken combinations:</strong><br>`;
                    
                    result.examples.forEach(example => {
                        html += `<div class="broken-example">
                            ${example.combo} → ${example.result} 
                            <span style="color: #e74c3c;">(${example.reasons.join(', ')})</span>
                        </div>`;
                    });
                    
                    if (result.stats.found > result.examples.length) {
                        html += `<div style="color: #888; margin-top: 5px;">
                            ... and ${result.stats.found - result.examples.length} more
                        </div>`;
                    }
                    
                    html += `</div>`;
                }
                
                // Update deleted count in cleanup section
                document.getElementById('deleted-count').textContent = result.stats.totalDeleted;
                
                // Enable cleanup button if there are deletions
                const cleanupBtn = document.getElementById('cleanup-btn');
                if (result.stats.totalDeleted > 0) {
                    cleanupBtn.textContent = 'Run Cleanup';
                    cleanupBtn.disabled = false;
                }
            } else {
                html += '<small>No broken combinations found. All combinations reference valid elements!</small>';
            }
            
            resultDiv.innerHTML = html;
            
        } else {
            // Show error
            resultDiv.className = 'broken-result error active';
            resultDiv.innerHTML = `<strong>❌ Error:</strong> ${result.error || 'Failed to find broken combinations'}`;
        }
    } catch (err) {
        console.error('Find broken combinations error:', err);
        resultDiv.className = 'broken-result error active';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${err.message}`;
    } finally {
        // Reset button
        brokenBtn.textContent = 'Find & Mark Broken';
        brokenBtn.disabled = false;
    }
};

// Run cleanup
// Add a manual reload function for debugging
window.reloadCombinations = async function() {
    console.log('Manually reloading combinations...');
    try {
        const response = await fetch('/elements/data/combinations.json');
        const data = await response.json();
        console.log('Fetched data:', data);
        console.log('Type:', typeof data);
        console.log('Keys:', Object.keys(data).length);
        console.log('Sample:', Object.entries(data).slice(0, 5));
        
        // Try to manually set combinations
        window.combinations = data;
        console.log('Set window.combinations to:', window.combinations);
        console.log('Combinations now has', Object.keys(window.combinations).length, 'entries');
    } catch (e) {
        console.error('Manual reload failed:', e);
    }
};

// Debug function to help diagnose combination issues
window.debugCombinations = function(elementId) {
    elementId = String(elementId);
    console.log(`\n=== Debug for element ${elementId} ===`);
    console.log('Total combinations:', Object.keys(combinations).length);
    
    // Find recipes
    const recipes = Object.entries(window.combinations).filter(([k, v]) => String(v) === elementId);
    console.log(`Recipes creating element ${elementId}:`, recipes);
    
    // Find uses
    const uses = Object.entries(window.combinations).filter(([k, v]) => {
        const [a, b] = k.split('+');
        return String(a) === elementId || String(b) === elementId;
    });
    console.log(`Combinations using element ${elementId}:`, uses);
    
    // Check data types
    if (recipes.length > 0) {
        console.log('Recipe value types:', recipes.map(([k, v]) => ({ combo: k, resultType: typeof v, resultValue: v })));
    }
};

window.runCleanup = async function() {
    const cleanupBtn = document.getElementById('cleanup-btn');
    const resultDiv = document.getElementById('cleanup-result');
    
    // Show loading state
    cleanupBtn.disabled = true;
    cleanupBtn.textContent = 'Running cleanup...';
    resultDiv.classList.remove('active');
    
    try {
        const response = await fetch('/api/cleanup-combinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            resultDiv.className = 'cleanup-result success active';
            resultDiv.innerHTML = `
                <strong>✅ ${result.message}</strong><br>
                <small>
                    Removed ${result.stats.deleted} combinations<br>
                    Total reduced from ${result.stats.originalCount} to ${result.stats.finalCount}<br>
                    Backup saved as: ${result.stats.backupFile}
                </small>
            `;
            
            // Update stats
            document.getElementById('deleted-count').textContent = '0';
            document.getElementById('total-combos').textContent = result.stats.finalCount;
            
            // Update button
            cleanupBtn.textContent = 'Nothing to Clean';
            cleanupBtn.disabled = true;
            
            // Reload combinations data
            window.combinations = {};
            const comboResponse = await fetch('/elements/data/combinations.json');
            const comboData = await comboResponse.json();
            Object.entries(comboData).forEach(([key, result]) => {
                window.combinations[key] = result;
                const [a, b] = key.split('+');
                window.combinations[`${b}+${a}`] = result;
            });
            
            // Clear deleted combinations from memory
            deletedCombinations = [];
            
        } else {
            // Show error
            resultDiv.className = 'cleanup-result error active';
            resultDiv.innerHTML = `<strong>❌ Error:</strong> ${result.error || 'Failed to run cleanup'}`;
            
            // Reset button
            cleanupBtn.textContent = 'Run Cleanup';
            cleanupBtn.disabled = false;
        }
    } catch (err) {
        console.error('Cleanup error:', err);
        resultDiv.className = 'cleanup-result error active';
        resultDiv.innerHTML = `<strong>❌ Error:</strong> ${err.message}`;
        
        // Reset button
        cleanupBtn.textContent = 'Run Cleanup';
        cleanupBtn.disabled = false;
    }
};