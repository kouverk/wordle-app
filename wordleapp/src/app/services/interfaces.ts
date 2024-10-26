interface BaseGame {
    id: number;
    game_type: 'singleplayer' | 'multiplayer';
    current_turn_num: number;
    word: string;
    status: 'in_progress' | 'completed';
    completed_at?: string | null;
    attempts: Attempt[];
}

interface SinglePlayerGame extends BaseGame {
    game_type: 'singleplayer';
    player1_id: number;
}

interface MultiplayerGame extends BaseGame {
    game_type: 'multiplayer';
    player1_id: number;
    player2_id: number;
    player1_score: number | null;
    player2_score: number | null;
    player_turn: number;
}

export type Game = SinglePlayerGame | MultiplayerGame;

interface Attempt {
    id: number;
    game_id: number;
    player_id: number;
    attempt: string;
    attempt_num: number;
    is_correct: boolean;
    created_at: string;
}

// Define the type for an array of Attempts
export type Attempts = Attempt[];

export type User = {
    user_id: number;
    username: string;
    avatar_num: number;
    avatar_url: string;
} | null;
