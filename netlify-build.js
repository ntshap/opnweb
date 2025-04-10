// Simple build script for Netlify
console.log('Starting Netlify build process...');

// Set environment variables
process.env.NETLIFY = 'true';
process.env.NEXT_PUBLIC_API_URL = 'https://backend-project-pemuda.onrender.com/api/v1';

// Log configuration
console.log('Build environment:');
console.log('- NETLIFY:', process.env.NETLIFY);
console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('- NODE_VERSION:', process.version);

// Enable fallback data for Netlify builds
process.env.NEXT_PUBLIC_USE_FALLBACK_DATA = 'true';
console.log('- NEXT_PUBLIC_USE_FALLBACK_DATA:', process.env.NEXT_PUBLIC_USE_FALLBACK_DATA);

// Run the build and export process
const { execSync } = require('child_process');

console.log('Build configuration complete. Starting Next.js build...');

try {
  // Run the build command
  execSync('next build', { stdio: 'inherit' });
  console.log('Next.js build completed successfully');

  // Run the export command
  console.log('Starting static export...');
  execSync('next export', { stdio: 'inherit' });
  console.log('Static export completed successfully');

  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
