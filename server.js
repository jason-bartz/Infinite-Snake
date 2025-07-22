const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// Ensure the elements data directory exists
const elementsDataDir = path.join(__dirname, 'elements/data');
if (!fs.existsSync(elementsDataDir)) {
  fs.mkdirSync(elementsDataDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.webp': 'image/webp'
};

// Store for custom elements and combinations
let customData = {
  elements: {},
  combinations: {},
  emojis: {},
  deletedElements: [],
  deletedCombinations: []
};

// Load custom data on startup
try {
  const customElementsPath = path.join(__dirname, 'elements', 'elements-custom.json');
  if (fs.existsSync(customElementsPath)) {
    const data = JSON.parse(fs.readFileSync(customElementsPath, 'utf8'));
    customData.elements = data;
  }
} catch (err) {
  console.log('No custom elements file found, starting fresh');
}

try {
  const customCombosPath = path.join(__dirname, 'elements', 'combinations-custom.json');
  if (fs.existsSync(customCombosPath)) {
    const data = JSON.parse(fs.readFileSync(customCombosPath, 'utf8'));
    customData.combinations = data;
  }
} catch (err) {
  console.log('No custom combinations file found, starting fresh');
}

try {
  const customEmojisPath = path.join(__dirname, 'elements', 'emojis-custom.json');
  if (fs.existsSync(customEmojisPath)) {
    const data = JSON.parse(fs.readFileSync(customEmojisPath, 'utf8'));
    customData.emojis = data;
  }
} catch (err) {
  console.log('No custom emojis file found, starting fresh');
}

// Load deleted elements list
try {
  const deletedElementsPath = path.join(__dirname, 'elements', 'deleted-elements.json');
  if (fs.existsSync(deletedElementsPath)) {
    customData.deletedElements = JSON.parse(fs.readFileSync(deletedElementsPath, 'utf8'));
    console.log(`Loaded ${customData.deletedElements.length} deleted elements`);
  }
} catch (err) {
  console.log('No deleted elements file found');
}

// Load deleted combinations list
try {
  const deletedCombosPath = path.join(__dirname, 'elements', 'deleted-combinations.json');
  if (fs.existsSync(deletedCombosPath)) {
    customData.deletedCombinations = JSON.parse(fs.readFileSync(deletedCombosPath, 'utf8'));
    console.log(`Loaded ${customData.deletedCombinations.length} deleted combinations`);
  }
} catch (err) {
  console.log('No deleted combinations file found');
}

const server = http.createServer((req, res) => {
  // Request: ${req.method} ${req.url}
  
  // Admin panel protection - only allow localhost access
  if (req.url.startsWith('/admin') || req.url.startsWith('/api/')) {
    const clientIP = req.connection.remoteAddress;
    const forwardedFor = req.headers['x-forwarded-for'];
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1' ||
                       forwardedFor === '127.0.0.1' || forwardedFor === '::1';
    
    console.log(`[Admin Access] IP: ${clientIP}, Forwarded: ${forwardedFor}, Is Localhost: ${isLocalhost}`);
    
    if (!isLocalhost) {
      res.writeHead(403, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'Access denied - admin panel only accessible from localhost' }));
      return;
    }
  }
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  // Handle API endpoints
  if (req.method === 'POST' && req.url === '/api/save-element') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { element, combinations, emojis } = data;
        
        // Save to custom files
        if (element) {
          customData.elements[element.id] = element;
          const customElementsPath = path.join(__dirname, 'elements', 'elements-custom.json');
          fs.writeFileSync(customElementsPath, JSON.stringify(customData.elements, null, 2));
        }
        
        if (combinations) {
          Object.assign(customData.combinations, combinations);
          const customCombosPath = path.join(__dirname, 'elements', 'combinations-custom.json');
          fs.writeFileSync(customCombosPath, JSON.stringify(customData.combinations, null, 2));
        }
        
        if (emojis) {
          Object.assign(customData.emojis, emojis);
          const customEmojisPath = path.join(__dirname, 'elements', 'emojis-custom.json');
          fs.writeFileSync(customEmojisPath, JSON.stringify(customData.emojis, null, 2));
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Save error:', err);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  // New endpoint to save directly to main files
  if (req.method === 'POST' && req.url === '/api/save-element-main') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { element, combinations, emojis } = data;
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir);
        }
        
        // Create timestamp for backups
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Save element to main file
        if (element) {
          const elementsPath = path.join(__dirname, 'elements', 'data', 'elements.json');
          
          // Backup current file
          const backupPath = path.join(backupDir, `elements-all-unique-backup-${timestamp}.json`);
          fs.copyFileSync(elementsPath, backupPath);
          
          // Load current elements
          const elements = JSON.parse(fs.readFileSync(elementsPath, 'utf8'));
          
          // Add or update element
          const existingIndex = elements.findIndex(e => e.i === element.id);
          const newElement = {
            i: element.id,
            n: element.name,
            t: element.tier,
            e: element.emojiIndex || element.id
          };
          
          if (existingIndex >= 0) {
            elements[existingIndex] = newElement;
          } else {
            elements.push(newElement);
            // Sort by ID
            elements.sort((a, b) => a.i - b.i);
          }
          
          // Save updated elements
          fs.writeFileSync(elementsPath, JSON.stringify(elements, null, 2));
          console.log(`[Save] Updated element ${element.id} in main file`);
        }
        
        // Save combinations to main file
        if (combinations) {
          const combosPath = path.join(__dirname, 'elements', 'data', 'combinations.json');
          
          // Backup current file
          const backupPath = path.join(backupDir, `combinations-backup-${timestamp}.json`);
          fs.copyFileSync(combosPath, backupPath);
          
          // Load current combinations
          const allCombos = JSON.parse(fs.readFileSync(combosPath, 'utf8'));
          
          // Add new combinations
          Object.assign(allCombos, combinations);
          
          // Save updated combinations
          fs.writeFileSync(combosPath, JSON.stringify(allCombos, null, 2));
          console.log(`[Save] Added ${Object.keys(combinations).length} combinations to main file`);
        }
        
        // Save emojis to main file
        if (emojis) {
          const emojisPath = path.join(__dirname, 'elements', 'data', 'emojis.json');
          
          // Backup current file
          const backupPath = path.join(backupDir, `emojis-backup-${timestamp}.json`);
          fs.copyFileSync(emojisPath, backupPath);
          
          // Load current emojis
          const allEmojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
          
          // Add new emojis
          Object.assign(allEmojis, emojis);
          
          // Save updated emojis
          fs.writeFileSync(emojisPath, JSON.stringify(allEmojis, null, 2));
          console.log(`[Save] Updated ${Object.keys(emojis).length} emoji mappings in main file`);
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Save error:', err);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  if ((req.method === 'DELETE' || req.method === 'POST') && req.url.startsWith('/api/delete-combination')) {
    console.log(`[${req.method}] Handling delete-combination request`);
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { element1, element2 } = data;
        
        // First check if it's a custom combination
        const isCustom = customData.combinations[`${element1}+${element2}`] || 
                        customData.combinations[`${element2}+${element1}`];
        
        if (isCustom) {
          // Delete from custom combinations
          delete customData.combinations[`${element1}+${element2}`];
          delete customData.combinations[`${element2}+${element1}`];
          
          const customCombosPath = path.join(__dirname, 'elements', 'combinations-custom.json');
          fs.writeFileSync(customCombosPath, JSON.stringify(customData.combinations, null, 2));
        } else {
          // Create a deletion record for base game combinations
          if (!customData.deletedCombinations) {
            customData.deletedCombinations = [];
          }
          
          // Add to deleted list (avoid duplicates)
          const comboKey = `${Math.min(element1, element2)}+${Math.max(element1, element2)}`;
          if (!customData.deletedCombinations.includes(comboKey)) {
            customData.deletedCombinations.push(comboKey);
          }
          
          // Save deleted combinations list
          const deletedCombosPath = path.join(__dirname, 'elements', 'deleted-combinations.json');
          fs.writeFileSync(deletedCombosPath, JSON.stringify(customData.deletedCombinations, null, 2));
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Delete error:', err);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  if ((req.method === 'DELETE' || req.method === 'POST') && req.url === '/api/delete-element') {
    console.log(`[${req.method}] Handling delete-element request`);
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { elementId, replacements, deleteCombos } = data;
        
        // Check if this is a custom element
        const isCustomElement = customData.elements[elementId];
        
        if (isCustomElement) {
          // Delete from custom elements
          delete customData.elements[elementId];
          delete customData.emojis[elementId];
        } else {
          // Add to deleted elements list for base game elements
          if (!customData.deletedElements.includes(elementId)) {
            customData.deletedElements.push(elementId);
          }
          
          // Save deleted elements list
          const deletedElementsPath = path.join(__dirname, 'elements', 'deleted-elements.json');
          fs.writeFileSync(deletedElementsPath, JSON.stringify(customData.deletedElements, null, 2));
        }
        
        // Remove all combinations that create this element
        const combosToDelete = [];
        Object.entries(customData.combinations).forEach(([combo, result]) => {
          if (result == elementId) {
            combosToDelete.push(combo);
          }
        });
        
        combosToDelete.forEach(combo => {
          delete customData.combinations[combo];
          const [a, b] = combo.split('+');
          delete customData.combinations[`${b}+${a}`];
        });
        
        // Delete specified combinations
        deleteCombos.forEach(combo => {
          delete customData.combinations[combo];
          const [a, b] = combo.split('+');
          delete customData.combinations[`${b}+${a}`];
        });
        
        // Apply replacements
        Object.entries(replacements).forEach(([oldCombo, newElementId]) => {
          const [a, b] = oldCombo.split('+');
          const result = customData.combinations[oldCombo];
          
          // Delete old combinations
          delete customData.combinations[oldCombo];
          delete customData.combinations[`${b}+${a}`];
          
          // Add new combinations with replacement
          if (a == elementId) {
            customData.combinations[`${newElementId}+${b}`] = parseInt(result);
            customData.combinations[`${b}+${newElementId}`] = parseInt(result);
          } else {
            customData.combinations[`${a}+${newElementId}`] = parseInt(result);
            customData.combinations[`${newElementId}+${a}`] = parseInt(result);
          }
        });
        
        // Save all changes
        const customElementsPath = path.join(__dirname, 'elements', 'elements-custom.json');
        fs.writeFileSync(customElementsPath, JSON.stringify(customData.elements, null, 2));
        
        const customCombosPath = path.join(__dirname, 'elements', 'combinations-custom.json');
        fs.writeFileSync(customCombosPath, JSON.stringify(customData.combinations, null, 2));
        
        const customEmojisPath = path.join(__dirname, 'elements', 'emojis-custom.json');
        fs.writeFileSync(customEmojisPath, JSON.stringify(customData.emojis, null, 2));
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Delete element error:', err);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  // API endpoint to find and mark broken combinations
  if (req.method === 'POST' && req.url === '/api/cleanup-broken-combinations') {
    console.log('[DEBUG] Finding broken combinations');
    
    try {
      // Load elements
      const elementsPath = path.join(__dirname, 'elements', 'data', 'elements.json');
      const elementsData = JSON.parse(fs.readFileSync(elementsPath, 'utf8'));
      
      // Create a set of valid element IDs for faster lookup
      const validElementIds = new Set();
      elementsData.forEach(elem => {
        validElementIds.add(elem.i.toString());
      });
      
      console.log(`[DEBUG] Loaded ${validElementIds.size} valid element IDs`);
      
      // Load combinations
      const combinationsPath = path.join(__dirname, 'elements', 'data', 'combinations.json');
      const combinations = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));
      
      // Load existing deleted combinations
      const deletedCombosPath = path.join(__dirname, 'elements', 'deleted-combinations.json');
      let deletedCombinations = [];
      if (fs.existsSync(deletedCombosPath)) {
        deletedCombinations = JSON.parse(fs.readFileSync(deletedCombosPath, 'utf8'));
      }
      
      // Find broken combinations
      const brokenCombinations = [];
      const brokenDetails = [];
      
      Object.entries(combinations).forEach(([combo, result]) => {
        const [elem1, elem2] = combo.split('+');
        let isBroken = false;
        let reason = [];
        
        // Check if element 1 exists
        if (!validElementIds.has(elem1)) {
          isBroken = true;
          reason.push(`Element 1 (${elem1}) not found`);
        }
        
        // Check if element 2 exists
        if (!validElementIds.has(elem2)) {
          isBroken = true;
          reason.push(`Element 2 (${elem2}) not found`);
        }
        
        // Check if result element exists
        if (!validElementIds.has(result.toString())) {
          isBroken = true;
          reason.push(`Result element (${result}) not found`);
        }
        
        if (isBroken) {
          // Normalize combination (smaller ID first)
          const normalized = parseInt(elem1) <= parseInt(elem2) ? `${elem1}+${elem2}` : `${elem2}+${elem1}`;
          
          // Only add if not already in broken list and not already deleted
          if (!brokenCombinations.includes(normalized) && !deletedCombinations.includes(normalized)) {
            brokenCombinations.push(normalized);
            brokenDetails.push({
              combo: normalized,
              elem1,
              elem2,
              result,
              reasons: reason
            });
          }
        }
      });
      
      console.log(`[DEBUG] Found ${brokenCombinations.length} broken combinations`);
      
      // Add broken combinations to deleted list
      let addedCount = 0;
      brokenCombinations.forEach(combo => {
        if (!deletedCombinations.includes(combo)) {
          deletedCombinations.push(combo);
          addedCount++;
        }
      });
      
      // Save updated deleted combinations
      if (addedCount > 0) {
        fs.writeFileSync(deletedCombosPath, JSON.stringify(deletedCombinations, null, 2));
        console.log(`[DEBUG] Added ${addedCount} broken combinations to deletion list`);
      }
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true,
        message: `Found and marked ${brokenCombinations.length} broken combinations`,
        stats: {
          found: brokenCombinations.length,
          added: addedCount,
          totalDeleted: deletedCombinations.length
        },
        examples: brokenDetails.slice(0, 10)
      }));
      
    } catch (err) {
      console.error('Find broken combinations error:', err);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/cleanup-combinations') {
    console.log('[DEBUG] Running cleanup combinations');
    
    try {
      // Load deleted combinations
      const deletedCombosPath = path.join(__dirname, 'elements', 'deleted-combinations.json');
      const combinationsPath = path.join(__dirname, 'elements', 'data', 'combinations.json');
      
      if (!fs.existsSync(deletedCombosPath)) {
        res.writeHead(404, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'No deleted combinations file found' }));
        return;
      }
      
      const deletedCombos = JSON.parse(fs.readFileSync(deletedCombosPath, 'utf8'));
      
      if (deletedCombos.length === 0) {
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'No combinations to clean up',
          stats: { deleted: 0, total: 0 }
        }));
        return;
      }
      
      // Load current combinations
      const combinations = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));
      const originalCount = Object.keys(combinations).length;
      
      // Create a set of combinations to delete (including reverse combinations)
      const toDelete = new Set();
      deletedCombos.forEach(combo => {
        toDelete.add(combo);
        // Also add the reverse combination
        const [a, b] = combo.split('+');
        if (a && b) {
          toDelete.add(`${b}+${a}`);
        }
      });
      
      // Delete the combinations
      let deletedCount = 0;
      const deletedList = [];
      toDelete.forEach(combo => {
        if (combinations[combo]) {
          delete combinations[combo];
          deletedCount++;
          deletedList.push(combo);
        }
      });
      
      const finalCount = Object.keys(combinations).length;
      
      // Backup the original file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      const backupPath = path.join(backupDir, `combinations-backup-${timestamp}.json`);
      fs.copyFileSync(combinationsPath, backupPath);
      
      // Write the updated combinations
      fs.writeFileSync(combinationsPath, JSON.stringify(combinations, null, 2));
      
      console.log(`[DEBUG] Cleanup complete - deleted ${deletedCount} combinations`);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        success: true,
        message: `Successfully cleaned up ${deletedCount} combinations`,
        stats: {
          originalCount,
          deleted: deletedCount,
          finalCount,
          reducedBy: originalCount - finalCount,
          backupFile: path.basename(backupPath)
        },
        examples: deletedList.slice(0, 10)
      }));
      
    } catch (err) {
      console.error('Cleanup error:', err);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // Only serve static files for GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    console.log(`[DEBUG] Unsupported method ${req.method} for ${req.url}`);
    res.writeHead(405, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Allow': 'GET, POST, DELETE, OPTIONS'
    });
    res.end(JSON.stringify({ error: `Method ${req.method} not allowed for this endpoint` }));
    return;
  }
  
  // Remove query parameters from URL
  console.log(`[DEBUG] Falling through to static file handler for: ${req.method} ${req.url}`);
  const urlParts = req.url.split('?');
  let filePath = urlParts[0] === '/' ? '/index.html' : decodeURIComponent(urlParts[0]);
  
  // Handle directory requests by adding index.html
  if (filePath.endsWith('/')) {
    filePath = filePath + 'index.html';
  }
  
  filePath = path.join(__dirname, filePath);
  
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  // Server running on port 8080
});