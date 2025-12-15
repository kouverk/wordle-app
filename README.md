# Multiplayer Wordle 👑

A multiplayer Wordle app for playing with friends — no ads, no NYT subscription, no complicity in genocide, just wordle, pwincess 💕 

Free Palestine 🇵🇸

## Live Demo

Play it now: [wordle-app-vert.vercel.app](https://wordle-app-vert.vercel.app)

## Why This App Exists

This app is part of the boycott of The New York Times, offering an alternative for those who want to play Wordle without supporting its Crimes.

*"Language makes genocide justifiable. A reason why we are still being bombed after 243 days is because of The New York Times and most Western media" — Hossam Shabat, Palestinian journalist*

American news media has been critical to maintaining Israel's death machine in gaza. And there is no American media institution more influential than The New York Times.

The new york times has routinely collaborated with Israel, printed outright lies from Israeli officials, it has directed reporters to avoid terms like "slaughter" and "ethnic cleansing", and systematically evades the culpability of Israel. 

Please consider joining the boycott of the NYT. Learn more at [boycottdivestunsubscribe.com](https://www.boycottdivestunsubscribe.com/).

## Tech Stack

- **Frontend**: Angular 17 with Angular Material
- **Backend**: Node.js / Express.js
- **Database**: MySQL
- **Auth**: JWT tokens with bcrypt password hashing

## Features

- **Multiplayer Games**: Challenge friends to head-to-head Wordle matches
- **Single Player Mode**: Classic Wordle gameplay for when ur friends are busy bestie
- **Word Frequency Scoring**: Rarer words are worth more points
- **Attempt-Based Multipliers**: Fewer guesses = higher score bonus (slay queen slay 💅)
- **Custom Avatars**: Pick your player avatar, cutie patootie 🎀
- **Password Reset**: Forgot your password? No problem bb
- **Dark Mode**: For those of us who aren't butterfly sunshine whores 🖤
- **Affirmations**: Click the heart for a random affirmation because you deserve it 💕

## Project Structure

```
wordle-app/
├── .env                 # Database credentials (create from .env.example)
├── wordleapp/           # Angular frontend
│   └── src/app/
│       ├── game/        # Main game component
│       ├── login/       # Auth components (login, signup, forgot-password)
│       └── services/    # API services
├── wordle-backend/      # Express backend
│   ├── controllers/     # Route handlers (auth, game)
│   ├── routes/          # API route definitions
│   ├── utils/           # Scoring utilities
│   └── db/              # Database connection
└── entropy/             # Entropy-based Wordle solver tools
    ├── entropy.py       # Core entropy calculation library
    └── wordle_cheater.py # Interactive terminal cheater game
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL
- npm or yarn

### Backend Setup

```bash
cd wordle-backend
npm install

# Create .env file with:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=wordleapp
# JWT_SECRET=your_secret_key

npm start
```

### Frontend Setup

```bash
cd wordleapp
npm install
ng serve
```

The app runs at `http://localhost:4200` with the API at `http://localhost:3000`.

## API Endpoints

### Auth
- `POST /signup` - Create account
- `POST /login` - Login (returns JWT + game state)
- `POST /request-password-reset` - Get reset token
- `POST /reset-password` - Reset password with token
- `GET /get-avatars` - List available avatars
- `POST /assign-avatar` - Set user avatar

### Game
- `GET /get-solution` - Get current word (dev only)
- `GET /check-word/:word` - Validate a word exists
- `GET /retrieve-multiplayer-game` - Get/create multiplayer game
- `GET /retrieve-singleplayer-game` - Get/create single player game
- `POST /add-attempt` - Submit a guess
- `POST /complete-turn` - End current turn
- `GET /check-game-status` - Poll game state

## Testing

E2E tests are powered by [Playwright](https://playwright.dev/).

```bash
# Run all tests
npm run test

# Run with interactive UI
npm run test:ui

# Run with visible browser
npm run test:headed

# Debug mode
npm run test:debug
```

Tests run on both Chromium and Mobile Safari (iPhone 14), covering:
- Single player game flow (login, play, persistence after refresh)
- Multiplayer routing (choose-word, wait, game states)
- Responsive design (board fits on mobile screens)
- In-app browser detection and warning banner

## Scoring System

Final score = `base_word_score × attempt_multiplier`

**Attempt Multipliers:**
| Attempts | Multiplier | Bonus/Penalty |
|----------|------------|---------------|
| 1        | 1.50       | +50%          |
| 2        | 1.20       | +20%          |
| 3        | 1.02       | +2%           |
| 4        | 0.98       | -2%           |
| 5        | 0.80       | -20%          |
| 6        | 0.50       | -50%          |

Word base scores range from 1-10 based on frequency (rarer = higher).

## Entropy Solver (Cheater Tools)

The `entropy/` folder contains tools for solving Wordle using information theory. These are standalone Python scripts that connect to the same word database as the main app.

### What is Entropy?

In Wordle, **entropy** measures how much information a guess provides. A high-entropy guess splits the remaining candidates as evenly as possible across all possible feedback patterns (the 243 combinations of Green/Yellow/Gray).

- **High entropy** = The guess eliminates roughly the same number of words regardless of feedback = Good guess
- **Low entropy** = The guess only helps in specific scenarios = Bad guess

For example, "SOARE" and "CRANE" are popular openers because they have high entropy against the full word list.

### Files

- **`entropy.py`** - Core library with entropy calculation functions:
  - `compute_entropy(candidates, word)` - Calculate bits of information for a guess
  - `generate_feedback(guess, solution)` - Simulate Wordle feedback
  - `filter_candidates(candidates, guess, feedback)` - Narrow down remaining words
  - `get_top_entropy_words(candidates, n)` - Get the best N guesses

- **`wordle_cheater.py`** - Interactive terminal game with two modes:
  1. **Simulated game** - Picks a random word and lets you cheat your way to victory
  2. **Practice mode** - Enter feedback from the real Wordle to get optimal suggestions

### Running the Cheater

```bash
cd entropy

# Install dependencies (first time only)
pip install mysql-connector-python python-dotenv

# Run the cheater
python wordle_cheater.py
```

You'll see something like:
```
Select mode:
  1. Play a simulated game (random word)
  2. Practice mode (enter feedback from real Wordle)

--- Attempt 1/6 | 4523 candidates remaining ---

Top 10 guesses by entropy:
   1. SOARE  (5.891 bits)
   2. ROATE  (5.884 bits)
   3. RAISE  (5.878 bits)
   ...
```

## License

Do whatever you want with it. Just play Wordle, diva 💅
