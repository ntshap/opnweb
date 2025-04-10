// Custom build script for Netlify
console.log('Starting custom Netlify build process...');

// Set environment variables
process.env.NETLIFY = 'true';
process.env.NEXT_PUBLIC_API_URL = 'https://backend-project-pemuda.onrender.com/api/v1';
process.env.NEXT_PUBLIC_USE_FALLBACK_DATA = 'false';

// Log configuration
console.log('Build environment:');
console.log('- NETLIFY:', process.env.NETLIFY);
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('- NEXT_PUBLIC_USE_FALLBACK_DATA:', process.env.NEXT_PUBLIC_USE_FALLBACK_DATA);
console.log('- NODE_VERSION:', process.version);

// Run the build process
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Build configuration complete. Starting Next.js build...');

try {
  // Run the build command with the Netlify Next.js plugin
  console.log('Building with Netlify Next.js plugin...');
  execSync('next build', { stdio: 'inherit' });
  console.log('Next.js build completed successfully');

  // Copy auth-check.js to the output directory
  console.log('Copying auth-check.js to output directory...');
  const outDir = path.join(__dirname, '.next');

  // Make sure the auth-check.js file exists
  if (fs.existsSync(path.join(__dirname, 'public', 'auth-check.js'))) {
    fs.copyFileSync(
      path.join(__dirname, 'public', 'auth-check.js'),
      path.join(outDir, 'auth-check.js')
    );
    console.log('Auth check script copied successfully');
  } else {
    console.warn('Warning: auth-check.js not found in public directory');
  }

  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
