// This file is used by the Netlify build process
// It helps with environment variable configuration and build optimization

// Log the build environment
console.log('Building for Netlify...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

// Set environment variables if not already set
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = 'https://backend-project-pemuda.onrender.com/api/v1';
  console.log('Set API URL:', process.env.NEXT_PUBLIC_API_URL);
}

// Always disable fallback data
process.env.NEXT_PUBLIC_USE_FALLBACK_DATA = 'false';
console.log('Disabled fallback data for all builds');

console.log('Build configuration complete');
