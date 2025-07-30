#!/usr/bin/env node

// Debug validation issue

// Copy of simpleHash from codeValidator.js
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// Test code validation process step by step
const testCode = 'DISCORD-2025-JMQZ';

console.log('Testing code:', testCode);
console.log('');

// Step 1: Normalize
const normalized = testCode.trim().toUpperCase();
console.log('1. Normalized:', normalized);

// Step 2: Check format
const regex = /^DISCORD-\d{4}-[A-Z0-9]{4}$/;
const matchesFormat = regex.test(normalized);
console.log('2. Matches format:', matchesFormat);
console.log('   Regex:', regex.toString());

// Step 3: Hash
const hash = simpleHash(normalized);
console.log('3. Hash:', hash);

// Step 4: Check against valid codes
const VALID_CODES = [
    '507fbf89', // DISCORD-2025-JMQZ
    '5080068c', // DISCORD-2025-IYTM
    '5081fe09', // DISCORD-2025-F123
];

const isValid = VALID_CODES.includes(hash);
console.log('4. Hash in valid codes:', isValid);

// Test a few variations to see what might be wrong
console.log('\nTesting variations:');
const variations = [
    'DISCORD-2025-JMQZ',
    'discord-2025-jmqz',
    'Discord-2025-Jmqz',
    ' DISCORD-2025-JMQZ ',
    'DISCORD-2025-JMQZ\n'
];

variations.forEach(v => {
    const h = simpleHash(v.trim().toUpperCase());
    console.log(`"${v}" -> ${h} (${h === '507fbf89' ? 'MATCH' : 'no match'})`);
});