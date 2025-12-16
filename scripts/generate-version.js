import fs from 'fs';
import { execSync } from 'child_process';

try {
  // Get git info
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const commit = execSync('git rev-parse --short HEAD').toString().trim();

  // Create version file
  const versionInfo = {
    version: branch,
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
      { version: 'unknown', commit: 'unknown', buildTime: new Date().toISOString() },
      null,
      2
    )
  );
}
