#!/usr/bin/env node

// Test hash generation to diagnose code validation issues

// Copy of simpleHash function from generate-codes.js
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// Test cases
const testCodes = [
    { code: 'DISCORD-2025-JMQZ', expectedHash: '507fbf89' },
    { code: 'DISCORD-2025-IYTM', expectedHash: '5080068c' },
    { code: 'DISCORD-2025-F123', expectedHash: '5081fe09' }
];

console.log('Testing hash generation...\n');

// Test each code
testCodes.forEach(test => {
    const actualHash = simpleHash(test.code);
    const matches = actualHash === test.expectedHash;
    
    console.log(`Code: ${test.code}`);
    console.log(`Expected: ${test.expectedHash}`);
    console.log(`Actual:   ${actualHash}`);
    console.log(`Match:    ${matches ? '✓' : '✗'}`);
    console.log('---');
});

// Also test the validation regex
const validationRegex = /^DISCORD-\d{4}-[A-Z0-9]{4}$/;
console.log('\nTesting validation regex:');
testCodes.forEach(test => {
    const isValid = validationRegex.test(test.code);
    console.log(`${test.code}: ${isValid ? '✓ Valid format' : '✗ Invalid format'}`);
});