import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, basename } from 'path';
import { PATHS } from './paths.js';

export function createBackup(filePath, backupDir = PATHS.BACKUP_DIR) {
    if (!existsSync(filePath)) {
        console.log(`File ${filePath} does not exist, skipping backup`);
        return null;
    }
    
    // Ensure backup directory exists
    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = basename(filePath);
    const backupName = `${filename.replace('.json', '')}-backup-${timestamp}.json`;
    const backupPath = join(backupDir, backupName);
    
    // Copy file
    copyFileSync(filePath, backupPath);
    console.log(`Created backup: ${backupName}`);
    
    return backupPath;
}

export function createBackups(filePaths) {
    const backups = {};
    for (const [key, path] of Object.entries(filePaths)) {
        if (existsSync(path)) {
            backups[key] = createBackup(path);
        }
    }
    return backups;
}