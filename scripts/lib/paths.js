import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

export const PATHS = {
    // Main data files
    MAIN: {
        ELEMENTS: join(rootDir, 'elements/data/elements.json'),
        COMBINATIONS: join(rootDir, 'elements/data/combinations.json'),
        EMOJIS: join(rootDir, 'elements/data/emojis.json'),
        ALL_UNIQUE: join(rootDir, 'elements/data/elements-all-unique.json')
    },
    
    // Custom data files
    CUSTOM: {
        ELEMENTS: join(rootDir, 'elements/elements-custom.json'),
        COMBINATIONS: join(rootDir, 'elements/combinations-custom.json'),
        EMOJIS: join(rootDir, 'elements/emojis-custom.json')
    },
    
    // Deletion lists
    DELETED: {
        ELEMENTS: join(rootDir, 'elements/deleted-elements.json'),
        COMBINATIONS: join(rootDir, 'elements/deleted-combinations.json')
    },
    
    // Directories
    BACKUP_DIR: join(rootDir, 'backups'),
    ELEMENTS_DIR: join(rootDir, 'elements'),
    DATA_DIR: join(rootDir, 'elements/data'),
    
    // Reports
    REACHABILITY_REPORT: join(rootDir, 'element-reachability-report.json')
};