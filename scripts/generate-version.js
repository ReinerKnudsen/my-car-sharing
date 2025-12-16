import fs from 'fs';
import { execSync } from 'child_process';

try {
  // Read version from package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;

  // Get git commit
  const commit = execSync('git rev-parse --short HEAD').toString().trim();

  // Try to get branch name, fallback to version from package.json
  let branch = 'unknown';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    // If in detached HEAD state, use package.json version
    if (branch === 'HEAD') {
      branch = `v${version}`;
    }
  } catch (e) {
    branch = `v${version}`;
  }

  // Create version file
  const versionInfo = {
    version: branch,
    packageVersion: version,
    commit: commit,
    buildTime: new Date().toISOString(),
  };

  // Write to public folder so it gets copied to dist
  fs.writeFileSync('public/version.json', JSON.stringify(versionInfo, null, 2));

  console.log('✅ Generated version.json:', versionInfo);
} catch (error) {
  console.error('❌ Error generating version:', error.message);
  // Create fallback version
  fs.writeFileSync(
    'public/version.json',
    JSON.stringify(
      {
        version: 'unknown',
        packageVersion: '0.0.0',
        commit: 'unknown',
        buildTime: new Date().toISOString(),
      },
      null,
      2
    )
  );
}
