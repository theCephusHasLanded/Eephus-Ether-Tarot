# Eephus: Ether Tarot

Eephus Ether Tarot is a modern web application for AI-powered tarot readings. Combining the ancient art of tarot with the latest advancements in artificial intelligence, Eephus provides personalized, insightful readings for users seeking guidance and self-reflection.

## Features

- **AI-Powered Readings**: Utilizes OpenAI's GPT-4o Mini for deep, personalized tarot interpretations
- **Multiple Reading Styles**: Choose from mystical, analytical, poetic, direct, or psychological interpretive styles
- **Various Spread Options**: Single card, three-card, and five-card spreads available
- **User Accounts**: Save your readings and track recurring themes in your tarot journey
- **Beautiful Interface**: Clean, modern design with art deco-inspired elements
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **AI Integration**: OpenAI API with GPT-4o Mini
- **Authentication**: Okta Identity Management
- **Database**: Not implemented in this demo version (would use MongoDB in production)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for AI-powered readings)
- Okta developer account (for authentication)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/eephus-ether-tarot.git
   cd eephus-ether-tarot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   OPENAI_API_KEY=your_openai_key_here
   OKTA_CLIENT_ID=your_okta_client_id
   OKTA_ISSUER=https://your-okta-domain/oauth2/default
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a question or topic for your reading
2. Select an interpretation style that resonates with you
3. Choose your spread type: single card, three cards, or five cards
4. Click "Draw Cards" to receive your reading
5. Save readings to your journal (requires login)
6. Analyze recurring themes in your tarot journal

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for the powerful GPT-4o Mini model
- Okta for authentication services
- The rich tradition of tarot interpretation