const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to identify themes in user input
function identifyThemes(input) {
  if (!input) return ["general"];
  
  const lowercaseInput = input.toLowerCase();
  const themeKeywords = {
    love: ["relationship", "partner", "romance", "connection", "attraction", "dating", "marriage", "breakup", "soulmate", "commitment"],
    career: ["job", "work", "promotion", "business", "professional", "interview", "company", "career", "workplace", "colleagues", "boss"],
    spirituality: ["spiritual", "higher", "purpose", "meaning", "meditation", "practice", "soul", "divine", "growth", "awakening", "consciousness"],
    health: ["health", "wellness", "healing", "body", "mental", "physical", "illness", "recovery", "balance", "energy", "vitality"],
    finances: ["money", "financial", "investment", "debt", "abundance", "prosperity", "wealth", "savings", "income", "spending"],
    creativity: ["creative", "artist", "project", "inspiration", "expression", "art", "writing", "music", "block", "ideas", "creating"]
  };
  
  const detectedThemes = [];
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => lowercaseInput.includes(keyword))) {
      detectedThemes.push(theme);
    }
  }
  
  return detectedThemes.length > 0 ? detectedThemes : ["general"];
}

// Generate a basic reading (no authentication required)
exports.generateBasicReading = async (req, res, next) => {
  try {
    const { query, cards, style } = req.body;
    
    if (!query || !cards || !cards.length || !style) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: query, cards, and style are required' 
      });
    }
    
    // Simple validation
    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cards must be an array with 1-5 elements' 
      });
    }
    
    // Identify themes for a more tailored reading
    const themes = identifyThemes(query);
    const themeText = themes[0] !== "general" ? themes.join(", ") : "General insight";
    
    // Format card info for the prompt
    const cardInfo = cards.map(card => `${card.title} (${card.number})`).join(', ');
    
    // Basic AI prompt (simplified for free tier)
    const prompt = `As a tarot reader with a ${style} style, interpret these cards: ${cardInfo} for the question: "${query}". 
    Theme: ${themeText}
    Keep the reading concise but insightful, focusing on the core message of the cards.`;
    
    // Call OpenAI with a smaller model for basic readings
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a skilled tarot reader who provides concise, insightful readings."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    
    const interpretation = completion.choices[0].message.content;
    
    // Return the reading
    res.status(200).json({
      success: true,
      data: {
        theme: themeText,
        interpretation,
        isPremium: false
      }
    });
  } catch (error) {
    console.error('Error generating reading:', error);
    next(error);
  }
};

// Generate a premium reading (requires authentication)
exports.generatePremiumReading = async (req, res, next) => {
  try {
    const { query, cards, style } = req.body;
    
    if (!query || !cards || !cards.length || !style) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: query, cards, and style are required' 
      });
    }
    
    // Simple validation
    if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cards must be an array with 1-5 elements' 
      });
    }
    
    // Get user info from token
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Identify themes for a more tailored reading
    const themes = identifyThemes(query);
    const themeText = themes[0] !== "general" ? themes.join(", ") : "General insight";
    
    // Format card info for the prompt
    const cardInfo = cards.map(card => `${card.title} (${card.number})`).join(', ');
    
    // Advanced prompt for premium users
    const prompt = `You are an insightful tarot reader with a ${style} interpretive style. 
    The querent (${userEmail}) asks: "${query}"
    
    Their reading includes the following cards: ${cardInfo}
    
    The identified themes in their question are: ${themeText}
    
    Provide a cohesive and insightful tarot reading that:
    1. Addresses their specific question with depth and nuance
    2. Interprets each card in relation to their question
    3. Shows how the cards interact with each other to create a cohesive message
    4. Offers specific, actionable guidance based on the reading
    5. Maintains a ${style} tone and approach throughout
    
    Your response should be deep, personalized, and genuinely helpful. Include elements of psychology 
    and wisdom that will resonate with the querent. This is a premium reading, so provide more depth and insight.`;
    
    // Call OpenAI with GPT-4o mini for premium readings
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or appropriate model 
      messages: [
        {
          role: "system",
          content: "You are a master tarot reader with deep wisdom and psychological insight."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });
    
    const interpretation = completion.choices[0].message.content;
    
    // Record this reading in user history (in a real app, would save to database)
    
    // Return the premium reading
    res.status(200).json({
      success: true,
      data: {
        theme: themeText,
        interpretation,
        isPremium: true,
        cards
      }
    });
  } catch (error) {
    console.error('Error generating premium reading:', error);
    next(error);
  }
};

// Save a reading to the user's history
exports.saveReading = async (req, res, next) => {
  try {
    const { interpretation, query, cards, style, theme } = req.body;
    const userId = req.user.id;
    
    // In a real implementation, this would save to a database
    // For this demo, we'll just pretend it was saved
    
    res.status(201).json({ 
      success: true, 
      message: 'Reading saved successfully', 
      data: {
        id: Date.now().toString(), // Simulated ID
        date: new Date().toISOString(),
        query,
        theme,
        cards,
        style,
        interpretation
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's saved readings
exports.getUserReadings = (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, this would fetch from a database
    // For this demo, we'll return mock data
    const mockReadings = [
      {
        id: '1',
        date: '2025-04-15T00:00:00.000Z',
        query: 'What should I focus on in my career?',
        theme: 'career',
        cards: [
          { title: 'The Fool', number: 'O' },
          { title: 'The Magician', number: 'I' },
          { title: 'The High Priestess', number: 'II' }
        ],
        style: 'analytical',
        interpretation: 'Career reading about new beginnings and using your skills...'
      },
      {
        id: '2',
        date: '2025-04-10T00:00:00.000Z',
        query: 'What\'s blocking my creative progress?',
        theme: 'creativity',
        cards: [
          { title: 'The Tower', number: 'XVI' }
        ],
        style: 'direct',
        interpretation: 'Your creative blocks stem from rigid thinking that needs to be broken down...'
      }
    ];
    
    res.status(200).json({ 
      success: true, 
      data: mockReadings
    });
  } catch (error) {
    next(error);
  }
};

// Delete a saved reading
exports.deleteReading = (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // In a real implementation, this would delete from a database
    // For this demo, we'll just pretend it was deleted
    
    res.status(200).json({ 
      success: true, 
      message: 'Reading deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Get user's trend analysis
exports.getUserTrends = (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, this would analyze the user's reading history
    // For this demo, we'll return mock data
    const mockTrends = {
      frequentThemes: ['Transformation', 'New Beginnings', 'Spiritual Growth'],
      frequentCards: [
        { title: 'The Fool', count: 5 },
        { title: 'The Magician', count: 4 },
        { title: 'The High Priestess', count: 3 }
      ],
      recommendedFocus: 'Your readings show a consistent theme of new beginnings and transformation. Consider exploring how these energies manifest in your daily life.'
    };
    
    res.status(200).json({ 
      success: true, 
      data: mockTrends
    });
  } catch (error) {
    next(error);
  }
};