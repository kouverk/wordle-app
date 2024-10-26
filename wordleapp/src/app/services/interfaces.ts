export type Game = Partial<{
    game_id: number;
    game_type: string;
    player1_id: number;
    player2_id: number;
    player1_username: string;
    player2_username: string;
    player_turn: number;
    current_turn_num: number;
    word: string;
    player1_score: number;
    player2_score: number;
    status: string;
    completed_at: Date;
    last_turn_time: Date
}> | null;

export type User = {
    user_id: number;
    username: string;
    avatar_num: number;
    avatar_url: string;
} | null;
