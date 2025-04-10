// Client-side authentication check for Netlify static export
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
})();
