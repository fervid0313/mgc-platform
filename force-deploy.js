// Force deployment script
const fs = require('fs');
const path = require('path');

// Update build timestamp
const timestamp = new Date().toISOString();
fs.writeFileSync(path.join(__dirname, 'public', 'build-timestamp.txt'), timestamp);

// Update package.json version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
packageJson.version = '0.1.2';
packageJson.description = `MGS Trading Platform - v0.1.2 - Force deploy at ${timestamp}`;
fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Deployment forced with timestamp:', timestamp);
