/**
 * ETHER • TAROT
 * Main application code
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize API client
  const api = new TarotAPI();
  
  // Store state
  let selectedCards = [];
  
  // DOM references
  const elements = {
    loginButton: document.querySelector('.login-btn'),
    authStatus: document.querySelector('.auth-status'),
    queryInput: document.querySelector('.query-input textarea'),
    styleInputs: document.querySelectorAll('input[name="style"]'),
    spreadButtons: document.querySelectorAll('.spread-type'),
    tarotSpread: document.querySelector('.tarot-spread'),
    interpretation: document.querySelector('.interpretation'),
    newReadingBtn: document.getElementById('new-reading-btn'),
    drawCardsBtn: document.getElementById('draw-cards-btn'),
    saveReadingBtn: document.getElementById('save-reading-btn'),
    readingsList: document.getElementById('reading-journal'),
    deeperInsightButton: null, // Will be dynamically created
    paywall: document.getElementById('paywall-overlay'),
    closePaywall: document.getElementById('close-paywall'),
    subscribeButton: document.getElementById('subscribe-button'),
    trendTags: document.querySelector('.trend-tags'),
    modal: document.getElementById('reading-modal'),
    closeModal: document.querySelector('.close-modal')
  };
  
  // ===== INITIALIZATION =====
  
  // Update UI based on authentication state
  function updateAuthUI() {
    if (api.authState.isAuthenticated) {
      elements.authStatus.textContent = `Signed in as ${api.authState.user.email}`;
      elements.loginButton.textContent = 'LOGOUT';
      
      // Show premium features or indicators
      document.body.classList.add('premium-user');
    } else {
      elements.authStatus.textContent = 'Not signed in';
      elements.loginButton.textContent = 'LOGIN';
      
      // Hide premium features
      document.body.classList.remove('premium-user');
    }
  }
  
  // Load user's saved readings
  async function loadSavedReadings() {
    if (!api.authState.isAuthenticated) return;
    
    try {
      const result = await api.getReadings();
      const readings = result.data;
      
      // Clear existing readings
      elements.readingsList.innerHTML = '';
      
      // Add each reading to the list
      readings.forEach(reading => {
        const date = new Date(reading.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        
        const cardTitles = reading.cards.map(card => card.title);
        const title = reading.cards.length === 1 
          ? `Single Card Reading: ${cardTitles[0]}`
          : `${reading.cards.length} Card Reading: ${cardTitles.join(', ')}`;
        
        const readingItem = document.createElement('li');
        readingItem.className = 'reading-item';
        
        readingItem.innerHTML = `
          <span>${title}</span>
          <div class="reading-meta">
            <span class="reading-date">${formattedDate}</span>
            <div class="reading-actions">
              <button class="view-reading">View</button>
              <button class="delete-reading">Delete</button>
            </div>
          </div>
        `;
        
        // Store reading data
        readingItem.dataset.id = reading.id;
        readingItem.dataset.cards = JSON.stringify(cardTitles);
        readingItem.dataset.query = reading.query;
        readingItem.dataset.interpretation = reading.interpretation;
        readingItem.dataset.date = formattedDate;
        readingItem.dataset.spreadType = reading.cards.length === 1 ? 'SINGLE' : reading.cards.length === 3 ? 'THREE' : 'FIVE';
        
        // Add to reading list
        elements.readingsList.appendChild(readingItem);
      });
    } catch (error) {
      console.error('Error loading saved readings:', error);
    }
  }
  
  // Load user's reading trends
  async function loadTrends() {
    if (!api.authState.isAuthenticated) return;
    
    try {
      const result = await api.getTrends();
      const trends = result.data;
      
      // Update trend tags
      elements.trendTags.innerHTML = trends.frequentThemes.map(tag => 
        `<div class="trend-tag">${tag}</div>`
      ).join('');
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  }
  
  // Initialize the app
  async function init() {
    // Check authentication status
    await api.checkAuthStatus();
    updateAuthUI();
    
    // Load user data if authenticated
    if (api.authState.isAuthenticated) {
      await Promise.all([
        loadSavedReadings(),
        loadTrends()
      ]);
    }
    
    // Attach event listeners
    attachEventListeners();
  }
  
  // ===== EVENT HANDLERS =====
  
  // Handle login/logout
  async function handleAuthClick() {
    try {
      // Use the authClient for authentication
      if (window.authClient.isAuthenticated) {
        await window.authClient.logout();
      } else {
        await window.authClient.login();
      }
      
      // The UI will be updated by the authClient
      
      // Load user data if authenticated
      if (window.authClient.isAuthenticated) {
        await Promise.all([
          loadSavedReadings(),
          loadTrends()
        ]);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    }
  }
  
  // Handle spread type selection
  function handleSpreadSelection(event) {
    // Remove active class from all buttons
    elements.spreadButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update spread based on selection
    const spreadType = event.target.textContent.trim();
    
    // Clear current spread
    elements.tarotSpread.innerHTML = '';
    
    // Reset selected cards
    selectedCards = [];
    
    // Add appropriate number of cards
    let cardCount = 1;
    if (spreadType === 'THREE') cardCount = 3;
    if (spreadType === 'FIVE') cardCount = 5;
    
    for (let i = 0; i < cardCount; i++) {
      elements.tarotSpread.innerHTML += `
        <div class="card">
          <div class="card-placeholder">?</div>
        </div>
      `;
    }
    
    // Clear interpretation
    elements.interpretation.innerHTML = '<div class="reading-theme">Select cards to reveal your reading</div>';
  }
  
  // Handle drawing all cards
  async function handleDrawCards() {
    const userQuery = elements.queryInput.value;
    
    if (!userQuery.trim()) {
      alert('Please enter a question or topic first');
      return;
    }
    
    // Get selected spread type
    const spreadType = document.querySelector('.spread-type.active').textContent.trim();
    
    // Get all cards with placeholders
    const cards = Array.from(document.querySelectorAll('.card'));
    
    // Check if there are cards with placeholders
    if (cards.length === 0 || !cards.some(card => card.querySelector('.card-placeholder'))) {
      return;
    }
    
    // Clear selected cards array
    selectedCards = [];
    
    // Create loading state
    elements.interpretation.innerHTML = '<div class="reading-theme">Analyzing...</div><div style="text-align: center; margin: 2rem 0;">Consulting the celestial algorithm...</div>';
    
    // Simulate drawing all cards at once
    for (const card of cards) {
      if (card.querySelector('.card-placeholder')) {
        // Select random card
        const randomCardIndex = Math.floor(Math.random() * window.cardData.length);
        const randomCard = window.cardData[randomCardIndex];
        selectedCards.push({ 
          number: randomCard.number, 
          title: randomCard.title,
          keywords: randomCard.keywords
        });
        
        // Update card with animation effect
        card.style.transform = 'rotateY(90deg)';
        setTimeout(() => {
          card.innerHTML = `
            <div class="card-number">${randomCard.number}</div>
            <div class="card-art">✦</div>
            <div class="card-title">${randomCard.title}</div>
          `;
          card.style.transform = 'rotateY(0deg)';
        }, 200);
        
        // Add slight delay between cards
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Get selected interpretation style
    const styleElement = document.querySelector('input[name="style"]:checked');
    const style = styleElement ? styleElement.value : 'mystical';
    
    try {
      // Generate reading using the API
      const result = await api.generateReading(userQuery, selectedCards, style);
      
      // Update interpretation with AI response
      elements.interpretation.innerHTML = `
        <div class="reading-theme">Theme: "${result.data.theme}"</div>
        ${result.data.interpretation}
        <div class="deeper-insight-button">Seek deeper insight...</div>
      `;
      
      // Update deeper insight button reference
      elements.deeperInsightButton = document.querySelector('.deeper-insight-button');
    } catch (error) {
      console.error('Error generating reading:', error);
      elements.interpretation.innerHTML = `
        <div class="reading-theme">Error</div>
        <p>Sorry, we couldn't generate your reading. Please try again later.</p>
      `;
    }
  }
  
  // Handle new reading
  function handleNewReading() {
    // Reset selected cards
    selectedCards = [];
    
    // Reset spread
    const spreadType = document.querySelector('.spread-type.active').textContent.trim();
    
    // Clear current spread
    elements.tarotSpread.innerHTML = '';
    
    // Add appropriate number of cards
    let cardCount = 1;
    if (spreadType === 'THREE') cardCount = 3;
    if (spreadType === 'FIVE') cardCount = 5;
    
    for (let i = 0; i < cardCount; i++) {
      elements.tarotSpread.innerHTML += `
        <div class="card">
          <div class="card-placeholder">?</div>
        </div>
      `;
    }
    
    // Clear interpretation
    elements.interpretation.innerHTML = '<div class="reading-theme">Select cards to reveal your reading</div>';
    
    // Reset query text
    elements.queryInput.value = '';
  }
  
  // Handle save reading
  async function handleSaveReading() {
    try {
      // Check if user is authenticated
      if (!api.authState.isAuthenticated) {
        alert('Please log in to save readings');
        return;
      }
      
      // Check if all cards are selected
      const totalCards = document.querySelectorAll('.card').length;
      const selectedCount = document.querySelectorAll('.card:not(:has(.card-placeholder))').length;
      
      if (selectedCount !== totalCards) {
        alert('Please complete the reading before saving');
        return;
      }
      
      // Get reading data
      const interpretation = document.querySelector('.interpretation').textContent;
      const userQuery = elements.queryInput.value || "General reading";
      const cardTitles = Array.from(document.querySelectorAll('.card .card-title')).map(el => el.textContent);
      const spreadType = document.querySelector('.spread-type.active').textContent.trim();
      const styleElement = document.querySelector('input[name="style"]:checked');
      const style = styleElement ? styleElement.value : 'mystical';
      const themeElement = document.querySelector('.reading-theme');
      const theme = themeElement ? themeElement.textContent.replace('Theme: "', '').replace('"', '') : "General insight";
      
      // Save reading to API
      const reading = {
        interpretation,
        query: userQuery,
        cards: selectedCards,
        style,
        theme
      };
      
      await api.saveReading(reading);
      
      // Refresh saved readings
      await loadSavedReadings();
      
      // Refresh trends
      await loadTrends();
      
      alert('Reading saved to your journal');
    } catch (error) {
      console.error('Error saving reading:', error);
      alert('Failed to save reading. Please try again.');
    }
  }
  
  // Handle view reading
  function handleViewReading(event) {
    if (!event.target.classList.contains('view-reading')) return;
    
    const readingItem = event.target.closest('.reading-item');
    const modal = elements.modal;
    
    // Populate modal with reading details
    modal.querySelector('.modal-date').textContent = readingItem.dataset.date;
    modal.querySelector('.modal-query').textContent = `Query: "${readingItem.dataset.query}"`;
    modal.querySelector('.modal-spread-type').textContent = `${readingItem.dataset.spreadType} Card Reading`;
    
    // Format cards
    const cards = JSON.parse(readingItem.dataset.cards);
    modal.querySelector('.modal-cards').innerHTML = cards.map(card => `<p>${card}</p>`).join('');
    
    // Set interpretation
    modal.querySelector('.modal-interpretation').textContent = readingItem.dataset.interpretation;
    
    // Show modal
    modal.style.display = 'block';
  }
  
  // Handle delete reading
  async function handleDeleteReading(event) {
    if (!event.target.classList.contains('delete-reading')) return;
    
    try {
      const readingItem = event.target.closest('.reading-item');
      const readingId = readingItem.dataset.id;
      
      if (confirm('Are you sure you want to delete this reading?')) {
        await api.deleteReading(readingId);
        readingItem.remove();
        
        // Refresh trends
        await loadTrends();
      }
    } catch (error) {
      console.error('Error deleting reading:', error);
      alert('Failed to delete reading. Please try again.');
    }
  }
  
  // Handle deeper insight click
  function handleDeeperInsight(event) {
    if (!event.target.classList.contains('deeper-insight-button')) return;
    elements.paywall.style.display = 'flex';
  }
  
  // Handle close paywall
  function handleClosePaywall(event) {
    event.preventDefault();
    elements.paywall.style.display = 'none';
  }
  
  // Handle subscribe button
  function handleSubscribe() {
    alert('This is a demo. In a real application, this would redirect to a payment processor.');
    elements.paywall.style.display = 'none';
  }
  
  // Handle close modal
  function handleCloseModal() {
    elements.modal.style.display = 'none';
  }
  
  // Attach all event listeners
  function attachEventListeners() {
    // Authentication
    elements.loginButton.addEventListener('click', handleAuthClick);
    
    // Spread selection
    elements.spreadButtons.forEach(button => {
      button.addEventListener('click', handleSpreadSelection);
    });
    
    // Card drawing
    elements.drawCardsBtn.addEventListener('click', handleDrawCards);
    
    // New reading
    elements.newReadingBtn.addEventListener('click', handleNewReading);
    
    // Save reading
    elements.saveReadingBtn.addEventListener('click', handleSaveReading);
    
    // Reading journal actions (using event delegation)
    elements.readingsList.addEventListener('click', (e) => {
      handleViewReading(e);
      handleDeleteReading(e);
    });
    
    // Deeper insight button (using event delegation since it's dynamically added)
    document.addEventListener('click', handleDeeperInsight);
    
    // Paywall
    elements.closePaywall.addEventListener('click', handleClosePaywall);
    elements.subscribeButton.addEventListener('click', handleSubscribe);
    
    // Modal
    elements.closeModal.addEventListener('click', handleCloseModal);
  }
  
  // Initialize the application
  init();
});