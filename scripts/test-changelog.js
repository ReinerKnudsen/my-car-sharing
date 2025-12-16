#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  determineVersionBump,
  incrementVersion,
  parseUnreleasedEntries,
  generateReleaseNotes
} from './update-changelog.js';

/**
 * Test the changelog automation functions
 */
function testChangelogAutomation() {
  console.log('🧪 Testing Changelog Automation Functions\n');
  
  // Test version increment
  console.log('1. Testing version increment:');
  console.log(`  1.0.0 + patch = ${incrementVersion('1.0.0', 'patch')}`);
  console.log(`  1.0.0 + minor = ${incrementVersion('1.0.0', 'minor')}`);
  console.log(`  1.0.0 + major = ${incrementVersion('1.0.0', 'major')}`);
  
  // Test version bump determination
  console.log('\n2. Testing version bump determination:');
  const testEntries = [
    ['- fixed bug in login', 'patch'],
    ['- added new feature', 'minor'],
    ['- breaking change: removed old API', 'major'],
    ['- updated documentation', 'patch']
  ];
  
  testEntries.forEach(([entry, expected]) => {
    const result = determineVersionBump([entry]);
    console.log(`  "${entry}" → ${result} (expected: ${expected})`);
  });
  
  // Test with actual changelog
  console.log('\n3. Testing with current changelog:');
  try {
    const changelogPath = path.join(process.cwd(), 'changelog.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    const unreleasedEntries = parseUnreleasedEntries(changelogContent);
    
    console.log('  Unreleased entries found:');
    console.log(`    Added: ${unreleasedEntries.added.length} items`);
    console.log(`    Changed: ${unreleasedEntries.changed.length} items`);
    console.log(`    Fixed: ${unreleasedEntries.fixed.length} items`);
    
    if (unreleasedEntries.entries.length > 0) {
      const bumpType = determineVersionBump(unreleasedEntries.entries);
      console.log(`    Suggested bump type: ${bumpType}`);
      
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const newVersion = incrementVersion(packageJson.version, bumpType);
      console.log(`    Current version: ${packageJson.version}`);
      console.log(`    New version would be: ${newVersion}`);
      
      console.log('\n  Generated release notes:');
      const releaseNotes = generateReleaseNotes(unreleasedEntries);
      console.log(releaseNotes || '    (No release notes generated)');
    } else {
      console.log('    No unreleased entries to process');
    }
    
  } catch (error) {
    console.error('  Error reading changelog:', error.message);
  }
  
  console.log('\n✅ Test completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testChangelogAutomation();
}
