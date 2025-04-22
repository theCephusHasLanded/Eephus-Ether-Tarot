/**
 * Tarot API Client
 * Handles communication with the backend API
 */
class TarotAPI {
  constructor() {
    this.apiBaseUrl = '/api';
    this.authState = {
      isAuthenticated: false,
      user: null
    };
    
    // Initialize the client
    this.init();
  }
  
  /**
   * Initialize the API client
   */
  async init() {
    try {
      // Check authentication status
      await this.checkAuthStatus();
    } catch (error) {
      console.error('Error initializing API client:', error);
    }
  }
  
  /**
   * Check the current authentication status
   */
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.authState.isAuthenticated = true;
        this.authState.user = data.data;
        return true;
      } else {
        this.authState.isAuthenticated = false;
        this.authState.user = null;
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.authState.isAuthenticated = false;
      this.authState.user = null;
      return false;
    }
  }
  
  /**
   * Simulated login for demo purposes
   */
  async login(email = 'user@example.com') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.authState.isAuthenticated = true;
        this.authState.user = data.data.user;
        return data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  async logout() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/demo-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        this.authState.isAuthenticated = false;
        this.authState.user = null;
        return true;
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Generate a tarot reading
   */
  async generateReading(query, cards, style) {
    try {
      // Determine which endpoint to use based on authentication status
      const endpoint = this.authState.isAuthenticated 
        ? `${this.apiBaseUrl}/tarot/premium-reading` 
        : `${this.apiBaseUrl}/tarot/generate-reading`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, cards, style }),
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate reading');
      }
    } catch (error) {
      console.error('Error generating reading:', error);
      throw error;
    }
  }
  
  /**
   * Save a reading to the user's history
   */
  async saveReading(reading) {
    try {
      if (!this.authState.isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/tarot/save-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reading),
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save reading');
      }
    } catch (error) {
      console.error('Error saving reading:', error);
      throw error;
    }
  }
  
  /**
   * Get the user's saved readings
   */
  async getReadings() {
    try {
      if (!this.authState.isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/tarot/readings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch readings');
      }
    } catch (error) {
      console.error('Error fetching readings:', error);
      throw error;
    }
  }
  
  /**
   * Delete a saved reading
   */
  async deleteReading(readingId) {
    try {
      if (!this.authState.isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/tarot/readings/${readingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete reading');
      }
    } catch (error) {
      console.error('Error deleting reading:', error);
      throw error;
    }
  }
  
  /**
   * Get the user's reading trends and patterns
   */
  async getTrends() {
    try {
      if (!this.authState.isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.apiBaseUrl}/tarot/trends`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch trends');
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }
}