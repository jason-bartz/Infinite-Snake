# Infinite Snake Scripts

## Element Manager (Consolidated Tool)

The `element-manager.js` script is a unified command-line tool for managing game elements, combinations, and emojis.

### Usage

```bash
node scripts/element-manager.js <command> [options]
```

### Commands

#### `sync` - Sync custom files to main files
```bash
# Sync all files with backup
node scripts/element-manager.js sync --all --backup

# Sync only elements with watch mode
node scripts/element-manager.js sync --elements --watch

# Dry run to see what would change
node scripts/element-manager.js sync --all --dry-run
```

Options:
- `--elements` - Sync elements only
- `--emojis` - Sync emojis only  
- `--combos` - Sync combinations only
- `--all` - Sync all files (default)
- `--watch` - Watch for changes and auto-sync
- `--backup` - Create backups before syncing
- `--dry-run` - Preview changes without modifying files

#### `clean` - Remove deleted combinations
```bash
# Clean with backup (default)
node scripts/element-manager.js clean

# Preview what would be removed
node scripts/element-manager.js clean --dry-run
```

#### `check` - Check element reachability
```bash
node scripts/element-manager.js check
```

Analyzes which elements can be reached from base elements and generates a detailed report.

## Legacy Scripts (Deprecated)

The following scripts have been replaced by `element-manager.js`:

- `add-custom-elements.js` → Use `element-manager.js sync --elements`
- `sync-custom-to-main.js` → Use `element-manager.js sync`
- `auto-sync-watcher.js` → Use `element-manager.js sync --watch`
- `merge-custom-to-main.js` → Use `element-manager.js sync --all --backup`
- `remove-deleted-combinations.js` → Use `element-manager.js clean`
- `check-element-reachability.js` → Use `element-manager.js check`

These legacy scripts are kept for reference but should not be used in new workflows.