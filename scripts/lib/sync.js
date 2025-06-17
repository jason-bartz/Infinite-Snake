import { readFileSync, writeFileSync, existsSync } from 'fs';

export function loadJSON(filePath, defaultValue = null) {
    if (!existsSync(filePath)) {
        return defaultValue;
    }
    
    try {
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        return defaultValue;
    }
}

export function saveJSON(filePath, data) {
    try {
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved ${filePath}`);
    } catch (error) {
        console.error(`Error saving ${filePath}:`, error.message);
        throw error;
    }
}

export function mergeElements(mainElements, customElements) {
    const merged = [...mainElements];
    let added = 0;
    
    for (const customElement of customElements) {
        const exists = merged.some(e => e.i === customElement.i);
        if (!exists) {
            merged.push(customElement);
            added++;
        }
    }
    
    // Sort by ID
    merged.sort((a, b) => a.i - b.i);
    
    return { merged, added };
}

export function mergeCombinations(mainCombinations, customCombinations) {
    const merged = { ...mainCombinations };
    let added = 0;
    
    for (const [key, value] of Object.entries(customCombinations)) {
        if (!merged[key]) {
            merged[key] = value;
            added++;
        }
    }
    
    return { merged, added };
}

export function mergeEmojis(mainEmojis, customEmojis) {
    const merged = { ...mainEmojis };
    let added = 0;
    
    for (const [key, value] of Object.entries(customEmojis)) {
        if (!merged[key] || merged[key] !== value) {
            merged[key] = value;
            added++;
        }
    }
    
    return { merged, added };
}

export function removeCombinations(combinations, deletionList) {
    const cleaned = { ...combinations };
    let removed = 0;
    
    for (const combo of deletionList) {
        if (cleaned[combo]) {
            delete cleaned[combo];
            removed++;
        }
        
        // Also check reverse combination
        const [a, b] = combo.split('+');
        const reverse = `${b}+${a}`;
        if (cleaned[reverse]) {
            delete cleaned[reverse];
            removed++;
        }
    }
    
    return { cleaned, removed };
}