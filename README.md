# Wordle Bitch

A multiplayer Wordle app for playing with friends — no ads, no NYT subscription, just pure word-guessing fun.

## Why This Exists

I refuse to support the New York Times due to their complicity in the genocide in Gaza. I also love Wordle. So I built my own.

Please consider joining the boycott of the NYT. Learn more at [boycottdivestunsubscribe.com](https://www.boycottdivestunsubscribe.com/).

## Tech Stack

- **Frontend**: Angular 17 with Angular Material
- **Backend**: Node.js / Express.js
- **Database**: MySQL
- **Auth**: JWT tokens with bcrypt password hashing

## Features

- **Multiplayer Games**: Challenge friends to head-to-head Wordle matches
- **Single Player Mode**: Classic Wordle gameplay
- **Word Frequency Scoring**: Rarer words are worth more points
- **Attempt-Based Multipliers**: Fewer guesses = higher score bonus
- **Custom Avatars**: Pick your player avatar
- **Password Reset**: Forgot your password? No problem.

## Project Structure

```
wordle-app/
├── wordleapp/           # Angular frontend
│   └── src/app/
│       ├── game/        # Main game component
│       ├── login/       # Auth components (login, signup, forgot-password)
│       └── services/    # API services
└── wordle-backend/      # Express backend
    ├── controllers/     # Route handlers (auth, game)
    ├── routes/          # API route definitions
    ├── utils/           # Scoring utilities
    └── db/              # Database connection
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

## License

Do whatever you want with it. Just play Wordle.
