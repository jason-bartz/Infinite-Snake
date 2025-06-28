let elements = {};
let emojis = {};
let emojiStats = {};

document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    analyzeEmojiUsage();
    setupEventListeners();
});

async function loadData() {
    try {
        // Load elements data
        const elementsResponse = await fetch('/elements/data/elements.json');
        const elementsData = await elementsResponse.json();
        
        if (elementsData.elements) {
            elementsData.elements.forEach(elem => {
                elements[elem.i] = {
                    id: elem.i,
                    name: elem.n,
                    tier: elem.t,
                    emojiIndex: elem.e
                };
            });
        }
        
        // Load emojis data
        const emojisResponse = await fetch('/elements/data/emojis.json');
        emojis = await emojisResponse.json();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load data', 'error');
    }
}

function analyzeEmojiUsage() {
    // Initialize statistics
    const emojiUsage = {};
    const elementsByEmoji = {};
    const usedEmojiIndices = new Set();
    
    // Analyze each element
    Object.values(elements).forEach(elem => {
        const emoji = emojis[elem.id] || emojis[elem.emojiIndex];
        const emojiIndex = elem.emojiIndex || elem.id;
        
        if (emoji) {
            // Track usage count
            emojiUsage[emoji] = (emojiUsage[emoji] || 0) + 1;
            
            // Track which elements use this emoji
            if (!elementsByEmoji[emoji]) {
                elementsByEmoji[emoji] = [];
            }
            elementsByEmoji[emoji].push(elem);
            
            // Track used indices
            usedEmojiIndices.add(parseInt(emojiIndex));
        }
    });
    
    // Find unused emoji slots
    const allEmojiIndices = Object.keys(emojis).map(k => parseInt(k));
    const maxIndex = Math.max(...allEmojiIndices);
    const unusedSlots = [];
    
    for (let i = 0; i <= maxIndex; i++) {
        if (!usedEmojiIndices.has(i) && emojis[i]) {
            unusedSlots.push(i);
        }
    }
    
    // Calculate statistics
    const uniqueEmojis = Object.keys(emojiUsage).length;
    const sharedEmojis = Object.entries(elementsByEmoji).filter(([emoji, elems]) => elems.length > 1);
    const mostUsedEmoji = Object.entries(emojiUsage).sort((a, b) => b[1] - a[1])[0];
    
    // Update statistics cards
    document.getElementById('total-unique-emojis').textContent = uniqueEmojis;
    document.getElementById('most-used-emoji').innerHTML = mostUsedEmoji ? `${mostUsedEmoji[0]} (${mostUsedEmoji[1]})` : '-';
    document.getElementById('shared-emoji-count').textContent = sharedEmojis.length;
    document.getElementById('unused-slots-count').textContent = unusedSlots.length;
    
    // Store for later use
    emojiStats = {
        usage: emojiUsage,
        elementsByEmoji: elementsByEmoji,
        unusedSlots: unusedSlots,
        sharedEmojis: sharedEmojis
    };
    
    // Display emoji usage grid
    displayEmojiUsageGrid(emojiUsage);
    
    // Display shared emoji analysis
    displaySharedEmojiAnalysis(sharedEmojis);
    
    // Display unused slots
    displayUnusedSlots(unusedSlots);
}

function displayEmojiUsageGrid(emojiUsage) {
    const grid = document.getElementById('emoji-usage-grid');
    const sortedEmojis = Object.entries(emojiUsage).sort((a, b) => b[1] - a[1]);
    
    // Calculate usage thresholds
    const counts = sortedEmojis.map(e => e[1]);
    const maxCount = Math.max(...counts);
    const highThreshold = maxCount * 0.66;
    const mediumThreshold = maxCount * 0.33;
    
    grid.innerHTML = sortedEmojis.map(([emoji, count]) => {
        let usageClass = 'low-usage';
        if (count > highThreshold) usageClass = 'high-usage';
        else if (count > mediumThreshold) usageClass = 'medium-usage';
        
        return `
            <div class="emoji-usage-item ${usageClass}" onclick="showEmojiDetails('${emoji}')" title="Click to see elements using this emoji">
                <div class="emoji-char-large">${emoji}</div>
                <div class="usage-count">${count}</div>
            </div>
        `;
    }).join('');
}

function displaySharedEmojiAnalysis(sharedEmojis) {
    const tbody = document.querySelector('#shared-emoji-table tbody');
    
    if (sharedEmojis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #666;">No shared emojis found</td></tr>';
        return;
    }
    
    tbody.innerHTML = sharedEmojis
        .sort((a, b) => b[1].length - a[1].length)
        .map(([emoji, elements]) => `
            <tr>
                <td class="emoji-cell">${emoji}</td>
                <td>${elements.length}</td>
                <td>
                    <div class="element-list">
                        ${elements.map(elem => `<span class="element-tag">${elem.name} (${elem.id})</span>`).join('')}
                    </div>
                </td>
            </tr>
        `).join('');
}

function displayUnusedSlots(unusedSlots) {
    const container = document.getElementById('unused-slots');
    
    if (unusedSlots.length === 0) {
        container.innerHTML = '<div style="color: #666;">All emoji slots are in use!</div>';
        return;
    }
    
    container.innerHTML = unusedSlots.map(slot => 
        `<div class="unused-slot">${slot}: ${emojis[slot]}</div>`
    ).join('');
}

function setupEventListeners() {
    const searchInput = document.getElementById('emoji-search');
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        filterEmojiDisplay(query);
    });
}

function filterEmojiDisplay(query) {
    const items = document.querySelectorAll('.emoji-usage-item');
    
    items.forEach(item => {
        const emoji = item.querySelector('.emoji-char-large').textContent;
        const count = item.querySelector('.usage-count').textContent;
        
        const matchesEmoji = emoji.includes(query);
        const matchesCount = count.includes(query);
        
        item.style.display = (matchesEmoji || matchesCount || !query) ? 'flex' : 'none';
    });
}

function showEmojiDetails(emoji) {
    const elements = emojiStats.elementsByEmoji[emoji];
    if (!elements) return;
    
    const elementNames = elements.map(e => `${e.name} (ID: ${e.id})`).join('\n');
    alert(`Elements using ${emoji}:\n\n${elementNames}`);
}

function exportToCSV() {
    const headers = ['Emoji', 'Usage Count', 'Elements'];
    const rows = Object.entries(emojiStats.usage).map(([emoji, count]) => {
        const elements = emojiStats.elementsByEmoji[emoji].map(e => e.name).join('; ');
        return [emoji, count, elements];
    });
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'emoji-statistics.csv', 'text/csv');
}

function exportToJSON() {
    const data = {
        summary: {
            totalUniqueEmojis: Object.keys(emojiStats.usage).length,
            totalSharedEmojis: emojiStats.sharedEmojis.length,
            unusedSlotsCount: emojiStats.unusedSlots.length
        },
        emojiUsage: emojiStats.usage,
        elementsByEmoji: Object.fromEntries(
            Object.entries(emojiStats.elementsByEmoji).map(([emoji, elems]) => [
                emoji,
                elems.map(e => ({ id: e.id, name: e.name }))
            ])
        ),
        unusedSlots: emojiStats.unusedSlots
    };
    
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, 'emoji-statistics.json', 'application/json');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage(`Exported to ${filename}`, 'success');
}

function showMessage(text, type = 'success') {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type} active`;
    
    setTimeout(() => {
        msg.classList.remove('active');
    }, 3000);
}

// Make showEmojiDetails global for onclick
window.showEmojiDetails = showEmojiDetails;