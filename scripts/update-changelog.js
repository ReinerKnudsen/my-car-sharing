#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
import fs from 'fs';
import path from 'path';

/**
 * Determines the version bump type based on changelog entries
 * @param {string[]} unreleasedEntries - Array of unreleased changelog entries
 * @returns {string} - 'major', 'minor', or 'patch'
 */
function determineVersionBump(unreleasedEntries) {
	const majorKeywords = ['breaking', 'breaking change', 'major', 'remove', 'removed'];
	const minorKeywords = ['add', 'added', 'feature', 'new'];

	const allEntries = unreleasedEntries.join(' ').toLowerCase();

	// Check for major changes
	if (majorKeywords.some((keyword) => allEntries.includes(keyword))) {
		return 'major';
	}

	// Check for minor changes
	if (minorKeywords.some((keyword) => allEntries.includes(keyword))) {
		return 'minor';
	}

	// Default to patch
	return 'patch';
}

/**
 * Increments version number based on bump type
 * @param {string} currentVersion - Current version (e.g., "1.2.3")
 * @param {string} bumpType - 'major', 'minor', or 'patch'
 * @returns {string} - New version number
 */
function incrementVersion(currentVersion, bumpType) {
	const [major, minor, patch] = currentVersion.split('.').map(Number);

	switch (bumpType) {
		case 'major':
			return `${major + 1}.0.0`;
		case 'minor':
			return `${major}.${minor + 1}.0`;
		case 'patch':
			return `${major}.${minor}.${patch + 1}`;
		default:
			throw new Error(`Invalid bump type: ${bumpType}`);
	}
}

/**
 * Parses changelog to extract unreleased entries
 * @param {string} changelogContent - Full changelog content
 * @returns {Object} - Object containing unreleased entries by category
 */
function parseUnreleasedEntries(changelogContent) {
	const lines = changelogContent.split('\n');
	const unreleasedIndex = lines.findIndex((line) => line.includes('## [Unreleased]'));

	if (unreleasedIndex === -1) {
		return { added: [], changed: [], fixed: [], entries: [] };
	}

	const nextVersionIndex = lines.findIndex(
		(line, index) => index > unreleasedIndex && line.match(/^## \[\d+\.\d+\.\d+\]/)
	);

	const unreleasedSection = lines.slice(
		unreleasedIndex,
		nextVersionIndex === -1 ? lines.length : nextVersionIndex
	);

	const result = { added: [], changed: [], fixed: [], entries: [] };
	let currentCategory = null;

	for (const line of unreleasedSection) {
		if (line.includes('### Added')) {
			currentCategory = 'added';
		} else if (line.includes('### Changed')) {
			currentCategory = 'changed';
		} else if (line.includes('### Fixed')) {
			currentCategory = 'fixed';
		} else if (line.startsWith('- ') && line.trim() !== '-' && currentCategory) {
			result[currentCategory].push(line);
			result.entries.push(line);
		}
	}

	return result;
}

/**
 * Updates package.json with new version
 * @param {string} newVersion - New version number
 */
function updatePackageJson(newVersion) {
	const packagePath = path.join(process.cwd(), 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	packageJson.version = newVersion;
	fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, '\t') + '\n');
}

/**
 * Updates changelog with new version section
 * @param {string} newVersion - New version number
 * @param {Object} unreleasedEntries - Unreleased entries object
 */
function updateChangelog(newVersion, unreleasedEntries) {
	const changelogPath = path.join(process.cwd(), 'changelog.md');
	const changelogContent = fs.readFileSync(changelogPath, 'utf8');
	const currentDate = new Date().toISOString().split('T')[0];

	// Create new version section
	let newVersionSection = `## [${newVersion}] - ${currentDate}\n\n`;

	if (unreleasedEntries.added.length > 0) {
		newVersionSection += '### Added\n\n';
		newVersionSection += unreleasedEntries.added.join('\n') + '\n\n';
	}

	if (unreleasedEntries.changed.length > 0) {
		newVersionSection += '### Changed\n\n';
		newVersionSection += unreleasedEntries.changed.join('\n') + '\n\n';
	}

	if (unreleasedEntries.fixed.length > 0) {
		newVersionSection += '### Fixed\n\n';
		newVersionSection += unreleasedEntries.fixed.join('\n') + '\n\n';
	}

	// Clear unreleased section and add new version
	const lines = changelogContent.split('\n');
	const unreleasedIndex = lines.findIndex((line) => line.includes('## [Unreleased]'));
	const nextVersionIndex = lines.findIndex(
		(line, index) => index > unreleasedIndex && line.match(/^## \[\d+\.\d+\.\d+\]/)
	);

	// Create empty unreleased section
	const emptyUnreleasedSection = [
		'## [Unreleased]',
		'',
		'### Added',
		'',
		'-',
		'',
		'### Changed',
		'',
		'-',
		'',
		'### Fixed',
		'',
		'-',
		'',
	];

	const newContent = [
		...lines.slice(0, unreleasedIndex),
		...emptyUnreleasedSection,
		newVersionSection.trim(),
		...(nextVersionIndex === -1 ? [] : lines.slice(nextVersionIndex)),
	].join('\n');

	fs.writeFileSync(changelogPath, newContent);
}

/**
 * Generates release notes from unreleased entries
 * @param {Object} unreleasedEntries - Unreleased entries object
 * @returns {string} - Formatted release notes
 */
function generateReleaseNotes(unreleasedEntries) {
	let notes = '';

	if (unreleasedEntries.added.length > 0) {
		notes += '## ✨ Added\n\n';
		notes += unreleasedEntries.added.map((entry) => entry.replace('- ', '- ')).join('\n') + '\n\n';
	}

	if (unreleasedEntries.changed.length > 0) {
		notes += '## 🔄 Changed\n\n';
		notes +=
			unreleasedEntries.changed.map((entry) => entry.replace('- ', '- ')).join('\n') + '\n\n';
	}

	if (unreleasedEntries.fixed.length > 0) {
		notes += '## 🐛 Fixed\n\n';
		notes += unreleasedEntries.fixed.map((entry) => entry.replace('- ', '- ')).join('\n') + '\n\n';
	}

	return notes.trim();
}

// Main execution
async function main() {
	try {
		// Read current package.json
		const packagePath = path.join(process.cwd(), 'package.json');
		const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
		const currentVersion = packageJson.version;

		// Read and parse changelog
		const changelogPath = path.join(process.cwd(), 'changelog.md');
		const changelogContent = fs.readFileSync(changelogPath, 'utf8');
		const unreleasedEntries = parseUnreleasedEntries(changelogContent);

		// Check if there are any unreleased entries
		if (unreleasedEntries.entries.length === 0) {
			console.log('No unreleased entries found. Skipping version update.');
			console.log('::set-output name=version_updated::false');
			return;
		}

		// Determine version bump and calculate new version
		const bumpType = determineVersionBump(unreleasedEntries.entries);
		const newVersion = incrementVersion(currentVersion, bumpType);

		console.log(`Current version: ${currentVersion}`);
		console.log(`Bump type: ${bumpType}`);
		console.log(`New version: ${newVersion}`);

		// Update package.json
		updatePackageJson(newVersion);
		console.log('Updated package.json');

		// Update changelog
		updateChangelog(newVersion, unreleasedEntries);
		console.log('Updated changelog.md');

		// Generate release notes
		const releaseNotes = generateReleaseNotes(unreleasedEntries);

		// Write release notes to file for GitHub Actions
		const releaseNotesPath = path.join(process.cwd(), 'release-notes.md');
		fs.writeFileSync(releaseNotesPath, releaseNotes, 'utf8');

		// Set GitHub Actions outputs using modern approach
		const githubOutput = process.env.GITHUB_OUTPUT;
		if (githubOutput) {
			fs.appendFileSync(githubOutput, 'version_updated=true\n');
			fs.appendFileSync(githubOutput, `new_version=${newVersion}\n`);
			fs.appendFileSync(githubOutput, 'release_notes_file=release-notes.md\n');
		} else {
			// Fallback for local testing
			console.log('::set-output name=version_updated::true');
			console.log(`::set-output name=new_version::${newVersion}`);
			console.log('::set-output name=release_notes_file::release-notes.md');
		}
	} catch (error) {
		console.error('Error updating changelog:', error);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export {
	determineVersionBump,
	incrementVersion,
	parseUnreleasedEntries,
	updatePackageJson,
	updateChangelog,
	generateReleaseNotes,
};
