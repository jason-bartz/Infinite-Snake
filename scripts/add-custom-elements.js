const fs = require('fs');
const path = require('path');

// Load custom elements
const customPath = path.join(__dirname, '..', 'elements', 'elements-custom.json');
if (fs.existsSync(customPath)) {
    const customElements = JSON.parse(fs.readFileSync(customPath, 'utf8'));
    
    // Load main elements
    const mainPath = path.join(__dirname, '..', 'elements', 'elements-new', 'elements-all-unique.json');
    const mainElements = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
    
    // Add new elements
    let added = 0;
    Object.values(customElements).forEach(elem => {
        if (!mainElements.find(e => e.i === elem.id)) {
            mainElements.push({
                i: elem.id,
                n: elem.name,
                t: elem.tier,
                e: elem.emojiIndex
            });
            console.log('Added element:', elem.name, '(ID:', elem.id, ')');
            added++;
        }
    });
    
    // Sort and save
    mainElements.sort((a, b) => a.i - b.i);
    fs.writeFileSync(mainPath, JSON.stringify(mainElements, null, 2));
    console.log(`\nAdded ${added} new elements. Total elements: ${mainElements.length}`);
}