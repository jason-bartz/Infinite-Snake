// Combinations Report Admin Panel
let elements = {};
let combinations = {};
let emojis = {};
let deletedCombinations = [];
let combinationsList = [];
let filteredCombinations = [];
let currentPage = 1;
let searchQuery = '';
let tierFilter = '';
let sortBy = 'result-name';
let selectedCombinations = new Set();

const COMBINATIONS_PER_PAGE = 200;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Initializing combinations report
    
    await loadData();
    setupEventListeners();
    filterAndDisplay();
});

// Load data
async function loadData() {
    try {
        // Load elements
        const elementsResponse = await fetch('/elements/data/elements.json');
        const elementsData = await elementsResponse.json();
        
        // Convert array format to object
        elementsData.forEach(elem => {
            elements[elem.i] = {
                id: elem.i,
                name: elem.n,
                tier: elem.t,
                emojiIndex: elem.e
            };
        });
        
        // Elements loaded
        
        // Load combinations
        const comboResponse = await fetch('/elements/data/combinations.json');
        const comboData = await comboResponse.json();
        
        // Convert to list format and deduplicate
        const seen = new Set();
        Object.entries(comboData).forEach(([combo, result]) => {
            const [a, b] = combo.split('+').map(id => parseInt(id));
            // Normalize combination (smaller ID first) to avoid duplicates
            const normalized = a <= b ? `${a}+${b}` : `${b}+${a}`;
            
            if (!seen.has(normalized)) {
                seen.add(normalized);
                combinationsList.push({
                    elem1: String(a <= b ? a : b),
                    elem2: String(a <= b ? b : a),
                    result: result,
                    combo: normalized
                });
            }
        });
        
        // Unique combinations loaded
        
        // Double-check for any duplicates
        const checkSet = new Set();
        let duplicateCount = 0;
        combinationsList.forEach(item => {
            const reverseCombo = `${item.elem2}+${item.elem1}`;
            if (checkSet.has(reverseCombo)) {
                duplicateCount++;
                // Found duplicate combination
            }
            checkSet.add(item.combo);
        });
        if (duplicateCount > 0) {
            // Found duplicate combinations after deduplication
        }
        
        // Load deleted combinations list
        try {
            const deletedCombosResponse = await fetch('/elements/deleted-combinations.json');
            if (deletedCombosResponse.ok) {
                deletedCombinations = await deletedCombosResponse.json();
                // Deleted combinations loaded
                
                // Create a set for faster lookup
                const deletedSet = new Set();
                deletedCombinations.forEach(combo => {
                    deletedSet.add(combo);
                    // Also add reverse combination
                    const [a, b] = combo.split('+');
                    if (a && b) {
                        deletedSet.add(`${b}+${a}`);
                    }
                });
                
                // Filter out deleted combinations
                combinationsList = combinationsList.filter(item => {
                    const isDeleted = deletedSet.has(item.combo) || deletedSet.has(`${item.elem2}+${item.elem1}`);
                    return !isDeleted;
                });
                
                // Filtered deleted combinations
            }
        } catch (err) {
            // No deleted combinations file found
        }
        
        // Load emojis
        try {
            const emojiResponse = await fetch('/elements/data/emojis.json');
            emojis = await emojiResponse.json();
            // Emojis loaded
        } catch (err) {
            // Failed to load emojis
        }
        
        // Update stats
        document.getElementById('total-combinations').textContent = Object.keys(comboData).length;
        document.getElementById('unique-combinations').textContent = combinationsList.length;
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load data', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.trim().toLowerCase();
            currentPage = 1;
            filterAndDisplay();
        }, 300);
    });
    
    // Tier filter
    document.getElementById('tier-filter').addEventListener('change', function(e) {
        tierFilter = e.target.value;
        currentPage = 1;
        filterAndDisplay();
    });
    
    // Sort by
    document.getElementById('sort-by').addEventListener('change', function(e) {
        sortBy = e.target.value;
        filterAndDisplay();
    });
}

// Filter and display combinations
function filterAndDisplay() {
    // Apply filters
    filteredCombinations = combinationsList.filter(combo => {
        const elem1 = elements[combo.elem1];
        const elem2 = elements[combo.elem2];
        const result = elements[combo.result];
        
        // Search filter
        if (searchQuery) {
            const matchesElem1 = elem1 && (elem1.name.toLowerCase().includes(searchQuery) || combo.elem1.toString().includes(searchQuery));
            const matchesElem2 = elem2 && (elem2.name.toLowerCase().includes(searchQuery) || combo.elem2.toString().includes(searchQuery));
            const matchesResult = result && (result.name.toLowerCase().includes(searchQuery) || combo.result.toString().includes(searchQuery));
            
            if (!matchesElem1 && !matchesElem2 && !matchesResult) return false;
        }
        
        // Tier filter (for result)
        if (tierFilter !== '' && result && result.tier !== parseInt(tierFilter)) {
            return false;
        }
        
        return true;
    });
    
    // Sort combinations
    filteredCombinations.sort((a, b) => {
        const elem1A = elements[a.elem1];
        const elem2A = elements[a.elem2];
        const resultA = elements[a.result];
        const elem1B = elements[b.elem1];
        const elem2B = elements[b.elem2];
        const resultB = elements[b.result];
        
        switch (sortBy) {
            case 'result-name':
                return (resultA?.name || '').localeCompare(resultB?.name || '');
            case 'elem1-name':
                return (elem1A?.name || '').localeCompare(elem1B?.name || '');
            case 'elem2-name':
                return (elem2A?.name || '').localeCompare(elem2B?.name || '');
            case 'result-id':
                return a.result - b.result;
            default:
                return 0;
        }
    });
    
    // Update filtered count
    document.getElementById('filtered-combinations').textContent = filteredCombinations.length;
    
    // Display current page
    displayPage();
}

// Display current page of combinations
function displayPage() {
    const list = document.getElementById('combinations-list');
    const totalPages = Math.ceil(filteredCombinations.length / COMBINATIONS_PER_PAGE);
    
    // Ensure current page is valid
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    // Calculate slice indices
    const startIndex = (currentPage - 1) * COMBINATIONS_PER_PAGE;
    const endIndex = startIndex + COMBINATIONS_PER_PAGE;
    const pageCombinations = filteredCombinations.slice(startIndex, endIndex);
    
    // Clear list
    list.innerHTML = '';
    
    if (pageCombinations.length === 0) {
        list.innerHTML = '<div class="no-results">No combinations found</div>';
        updatePagination(0);
        return;
    }
    
    // Display combinations
    pageCombinations.forEach((combo, index) => {
        const elem1 = elements[combo.elem1];
        const elem2 = elements[combo.elem2];
        const result = elements[combo.result];
        
        const emoji1 = elem1 ? (emojis[elem1.id] || emojis[elem1.emojiIndex] || '❓') : '❓';
        const emoji2 = elem2 ? (emojis[elem2.id] || emojis[elem2.emojiIndex] || '❓') : '❓';
        const emojiResult = result ? (emojis[result.id] || emojis[result.emojiIndex] || '❓') : '❓';
        
        const row = document.createElement('div');
        row.className = 'combination-row';
        row.id = `combo-row-${startIndex + index}`;
        
        // Click handler for the row (except delete button and checkbox)
        row.onclick = (e) => {
            if (!e.target.classList.contains('delete-btn') && e.target.type !== 'checkbox') {
                // For now, clicking does nothing since we need to handle modal from main page
                // TODO: Implement element detail modal from combinations page
            }
        };
        
        const comboKey = `${combo.elem1}+${combo.elem2}`;
        const isChecked = selectedCombinations.has(comboKey);
        
        row.innerHTML = `
            <div class="checkbox-cell">
                <input type="checkbox" 
                    id="checkbox-${startIndex + index}" 
                    data-combo="${comboKey}"
                    ${isChecked ? 'checked' : ''}
                    onchange="toggleCombination('${comboKey}', ${startIndex + index})">
            </div>
            
            <div class="element-cell" onclick="window.location.href='/admin/?search=${combo.elem1}'">
                <span class="element-emoji">${emoji1}</span>
                <span class="element-name">${elem1?.name || 'Unknown'}</span>
                <span class="element-id">(${combo.elem1})</span>
            </div>
            
            <div class="operator">+</div>
            
            <div class="element-cell" onclick="window.location.href='/admin/?search=${combo.elem2}'">
                <span class="element-emoji">${emoji2}</span>
                <span class="element-name">${elem2?.name || 'Unknown'}</span>
                <span class="element-id">(${combo.elem2})</span>
            </div>
            
            <div class="operator">→</div>
            
            <div class="element-cell" onclick="window.location.href='/admin/?search=${combo.result}'">
                <span class="element-emoji">${emojiResult}</span>
                <span class="element-name">${result?.name || 'Unknown'}</span>
                <span class="element-id">(${combo.result})</span>
            </div>
            
            <div>
                <button class="delete-btn" onclick="deleteCombination('${combo.elem1}', '${combo.elem2}', '${combo.result}', ${startIndex + index}, event)">
                    Delete
                </button>
            </div>
        `;
        
        list.appendChild(row);
    });
    
    // Update pagination
    updatePagination(totalPages);
    
    // Update bulk actions and select all checkbox
    updateBulkActions();
    updateSelectAllCheckbox();
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
    const totalPages = Math.ceil(filteredCombinations.length / COMBINATIONS_PER_PAGE);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    currentPage = page;
    displayPage();
    
    // Scroll to top
    window.scrollTo(0, 0);
};

// Delete combination
window.deleteCombination = async function(elem1, elem2, result, rowIndex, event) {
    event.stopPropagation(); // Prevent row click
    
    const resultElem = elements[result];
    const resultName = resultElem ? resultElem.name : `ID: ${result}`;
    
    if (!confirm(`Delete combination that creates "${resultName}"?`)) {
        return;
    }
    
    // Show loading state on the row
    const rowElement = document.getElementById(`combo-row-${rowIndex}`);
    if (rowElement) {
        rowElement.style.opacity = '0.5';
        rowElement.style.pointerEvents = 'none';
    }
    
    try {
        // Send deletion request
        const response = await fetch('/api/delete-combination', {
            method: 'DELETE',
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
        
        // Remove from local data
        delete combinations[`${elem1}+${elem2}`];
        delete combinations[`${elem2}+${elem1}`];
        
        // Add to deleted combinations list
        const normalizedCombo = parseInt(elem1) <= parseInt(elem2) ? `${elem1}+${elem2}` : `${elem2}+${elem1}`;
        if (!deletedCombinations.includes(normalizedCombo)) {
            deletedCombinations.push(normalizedCombo);
        }
        
        // Remove from lists
        combinationsList = combinationsList.filter(c => 
            !(c.elem1 == elem1 && c.elem2 == elem2)
        );
        
        showMessage('Combination deleted successfully!', 'success');
        
        // Refresh display
        filterAndDisplay();
        
    } catch (error) {
        console.error('Error deleting combination:', error);
        showMessage('Failed to delete combination', 'error');
        
        // Restore row appearance
        if (rowElement) {
            rowElement.style.opacity = '1';
            rowElement.style.pointerEvents = 'auto';
        }
    }
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

// Toggle combination selection
window.toggleCombination = function(comboKey, index) {
    const checkbox = document.getElementById(`checkbox-${index}`);
    
    if (checkbox.checked) {
        selectedCombinations.add(comboKey);
    } else {
        selectedCombinations.delete(comboKey);
    }
    
    updateBulkActions();
    updateSelectAllCheckbox();
};

// Toggle select all
window.toggleSelectAll = function() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-combo]');
    
    if (selectAllCheckbox.checked) {
        // Select all visible combinations
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedCombinations.add(cb.dataset.combo);
        });
    } else {
        // Deselect all
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        selectedCombinations.clear();
    }
    
    updateBulkActions();
};

// Deselect all
window.deselectAll = function() {
    selectedCombinations.clear();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkActions();
};

// Update bulk actions visibility
function updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');
    
    if (selectedCombinations.size > 0) {
        bulkActions.classList.add('active');
        selectedCount.textContent = selectedCombinations.size;
    } else {
        bulkActions.classList.remove('active');
    }
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const visibleCheckboxes = document.querySelectorAll('input[type="checkbox"][data-combo]');
    const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"][data-combo]:checked');
    
    if (visibleCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === visibleCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// Bulk delete
window.bulkDelete = async function() {
    if (selectedCombinations.size === 0) return;
    
    const count = selectedCombinations.size;
    if (!confirm(`Are you sure you want to delete ${count} combination${count > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Show loading state
    const bulkBtn = document.querySelector('.bulk-delete-btn');
    const originalText = bulkBtn.textContent;
    bulkBtn.textContent = 'Deleting...';
    bulkBtn.disabled = true;
    
    let successCount = 0;
    let failCount = 0;
    
    // Process deletions
    for (const comboKey of selectedCombinations) {
        const [elem1, elem2] = comboKey.split('+');
        
        try {
            const response = await fetch('/api/delete-combination', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    element1: elem1,
                    element2: elem2
                })
            });
            
            if (response.ok) {
                // Remove from local data
                delete combinations[`${elem1}+${elem2}`];
                delete combinations[`${elem2}+${elem1}`];
                
                // Add to deleted combinations list
                const normalizedCombo = parseInt(elem1) <= parseInt(elem2) ? `${elem1}+${elem2}` : `${elem2}+${elem1}`;
                if (!deletedCombinations.includes(normalizedCombo)) {
                    deletedCombinations.push(normalizedCombo);
                }
                
                // Remove from list
                combinationsList = combinationsList.filter(c => 
                    !(c.elem1 == elem1 && c.elem2 == elem2)
                );
                
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error('Error deleting combination:', error);
            failCount++;
        }
    }
    
    // Clear selections
    selectedCombinations.clear();
    
    // Show result message
    if (failCount === 0) {
        showMessage(`Successfully deleted ${successCount} combination${successCount > 1 ? 's' : ''}!`, 'success');
    } else {
        showMessage(`Deleted ${successCount} combinations, ${failCount} failed`, 'error');
    }
    
    // Reset button
    bulkBtn.textContent = originalText;
    bulkBtn.disabled = false;
    
    // Refresh display
    filterAndDisplay();
};