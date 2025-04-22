/**
 * Authentication Client
 * Handles Okta OAuth 2.0 with PKCE authentication flow
 */
class AuthClient {
  constructor() {
    this.baseUrl = '/api/auth';
    this.authState = null;
    this.codeChallenge = null;
    this.codeVerifier = null;
    this.isAuthenticated = false;
    this.user = null;
    
    // Check if we returned from an OAuth redirect
    this.handleAuthRedirect();
    
    // Check authentication status
    this.checkAuth();
  }
  
  /**
   * Check if the current URL includes an error from OAuth redirect
   * This handles the case where OAuth login fails
   */
  handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Authentication error:', error);
      // Clear the error from the URL
      const url = new URL(window.location);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url);
      
      // Show error message to user
      this.showMessage('Authentication failed. Please try again.');
    }
  }
  
  /**
   * Check if the user is authenticated
   */
  async checkAuth() {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isAuthenticated = true;
        this.user = data.data;
      } else {
        this.isAuthenticated = false;
        this.user = null;
      }
      
      this.updateUI();
      return this.isAuthenticated;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.isAuthenticated = false;
      this.user = null;
      this.updateUI();
      return false;
    }
  }
  
  /**
   * Update the UI based on authentication status
   */
  updateUI() {
    const authStatus = document.querySelector('.auth-status');
    const loginButton = document.querySelector('.login-btn');
    
    if (this.isAuthenticated && this.user) {
      authStatus.textContent = `Signed in as ${this.user.email}`;
      loginButton.textContent = 'LOGOUT';
      document.body.classList.add('authenticated');
      
      // If user is premium, add premium class
      if (this.user.isPremium) {
        document.body.classList.add('premium-user');
      }
    } else {
      authStatus.textContent = 'Not signed in';
      loginButton.textContent = 'LOGIN';
      document.body.classList.remove('authenticated', 'premium-user');
    }
  }
  
  /**
   * Generate authorization state for CSRF protection
   */
  async generateState() {
    try {
      const response = await fetch(`${this.baseUrl}/login-state`);
      if (!response.ok) throw new Error('Failed to generate auth state');
      
      const data = await response.json();
      return data.data.state;
    } catch (error) {
      console.error('Error generating auth state:', error);
      throw error;
    }
  }
  
  /**
   * Generate PKCE code challenge
   */
  async generateCodeChallenge() {
    try {
      const response = await fetch(`${this.baseUrl}/pkce-challenge`);
      if (!response.ok) throw new Error('Failed to generate PKCE challenge');
      
      const data = await response.json();
      return data.data.codeChallenge;
    } catch (error) {
      console.error('Error generating PKCE challenge:', error);
      throw error;
    }
  }
  
  /**
   * Initiate the login process
   */
  async login() {
    try {
      // First get the state for CSRF protection
      const state = await this.generateState();
      
      // Then get PKCE code challenge
      const codeChallenge = await this.generateCodeChallenge();
      
      // Navigate to the authorization URL
      window.location.href = `${this.baseUrl}/login?state=${state}&codeChallenge=${codeChallenge}`;
    } catch (error) {
      console.error('Error initiating login:', error);
      this.showMessage('Failed to initiate login. Please try again.');
    }
  }
  
  /**
   * Logout the current user
   */
  async logout() {
    try {
      window.location.href = `${this.baseUrl}/logout`;
    } catch (error) {
      console.error('Error logging out:', error);
      this.showMessage('Failed to logout. Please try again.');
    }
  }
  
  /**
   * Handle login/logout button click
   */
  async handleAuthButtonClick() {
    if (this.isAuthenticated) {
      await this.logout();
    } else {
      // For development, we can use demo login
      if (process.env.NODE_ENV === 'development') {
        this.demoLogin();
      } else {
        await this.login();
      }
    }
  }
  
  /**
   * Show a message to the user
   */
  showMessage(message) {
    // Simple implementation - replace with your UI message system
    alert(message);
  }
  
  /**
   * Demo login for development purposes
   */
  async demoLogin() {
    try {
      const response = await fetch(`${this.baseUrl}/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'demo@example.com' }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isAuthenticated = true;
        this.user = data.data.user;
        this.updateUI();
        return true;
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      this.showMessage('Login failed. Please try again.');
      return false;
    }
  }
  
  /**
   * Demo logout for development purposes
   */
  async demoLogout() {
    try {
      const response = await fetch(`${this.baseUrl}/demo-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        this.isAuthenticated = false;
        this.user = null;
        this.updateUI();
        return true;
      } else {
        throw new Error('Demo logout failed');
      }
    } catch (error) {
      console.error('Demo logout error:', error);
      this.showMessage('Logout failed. Please try again.');
      return false;
    }
  }
}

// Export the auth client
window.authClient = new AuthClient();