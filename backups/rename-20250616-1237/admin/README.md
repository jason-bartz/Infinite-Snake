# Infinite Snake Admin Panel

## Overview
The admin panel provides a comprehensive interface for managing the element database, combinations, and viewing statistics for the Infinite Snake game.

## Access
The admin panel is only accessible from localhost for security. To access:
1. Start the server: `node server.js`
2. Navigate to: `http://localhost:8080/admin/`

## Features

### 1. Database Tab
- View all elements with search and filtering
- Filter by tier, orphan status, or elements without recipes
- Edit element properties (name, tier, emoji)
- Delete elements (also removes related combinations)
- Pagination for large datasets
- Click emojis to copy to clipboard

### 2. Combinations Tab
- View all element combinations
- Search combinations by element names
- Visual representation of recipes
- Edit and delete combinations
- See which elements create what

### 3. Discovery Trees Tab
- Generate visual discovery trees for any element
- Shows all possible ways to create an element
- Recursive tree view with circular reference detection
- Useful for understanding element relationships

### 4. Statistics Tab
- Total elements and combinations count
- Orphan elements (not used in any combination)
- Elements without recipes
- Distribution by tier with visual charts
- Lists of problematic elements for cleanup

## Data Management

### Element Structure
```json
{
  "id": {
    "name": "Element Name",
    "tier": 1,
    "emoji": "🔥"
  }
}
```

### Combination Structure
```json
{
  "element1": 1,
  "element2": 2,
  "result": 3
}
```

## File Locations
- Elements: `elements/*.json`
- Combinations: `elements/combinations.json`
- Emojis: `elements/emojis.js`

## Security
- Only accessible from localhost (127.0.0.1)
- No authentication required when accessing locally
- External access blocked by server

## Future Enhancements
- Bulk import/export functionality
- Combination testing interface
- Element usage heatmaps
- Automatic orphan cleanup
- Backup and restore features