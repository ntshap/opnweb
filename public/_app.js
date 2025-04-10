// Custom client-side script for Netlify static export
// This script runs in the browser to handle authentication redirection

(function() {
  // Check if we're on a dashboard page
  const isDashboardPage = window.location.pathname.startsWith('/dashboard');
  
  // Function to check if user is authenticated
  function isAuthenticated() {
    // Check localStorage first
    const token = localStorage.getItem('token');
    if (token) return true;
    
    // Fallback to cookies
    const cookieToken = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    return !!cookieToken;
  }
  
  // If on dashboard page and not authenticated, redirect to login
  if (isDashboardPage && !isAuthenticated()) {
    console.log('Not authenticated, redirecting to login page');
    window.location.href = '/login';
  }
  
  // If on login page and already authenticated, redirect to dashboard
  if ((window.location.pathname === '/login' || window.location.pathname === '/register') && isAuthenticated()) {
    console.log('Already authenticated, redirecting to dashboard');
    window.location.href = '/dashboard';
  }
})();
