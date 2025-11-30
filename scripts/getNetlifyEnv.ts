import fs from 'fs';
import { execSync } from 'child_process';

console.log("Fetching Netlify environment variables for local use")
// Fetch environment variables from Netlify
const rawJson = execSync(`netlify env:list --json`, { encoding: 'utf-8' });
const envList = JSON.parse(rawJson);

// Write to custom .env file
const envContent = Object.entries(envList)
    .map(entry => `${entry[0]}=${entry[1]}`)
    .join('\n');
fs.writeFileSync('.env.netlify', envContent);
console.log('.env.netlify created successfully!');