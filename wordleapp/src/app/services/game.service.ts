import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Game, User, Attempts, MultiplayerGame, Attempt } from './interfaces';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = environment.apiUrl;
  public loggedIn: boolean = false;
  public multiplayer_game: boolean = false;
  private gameSubject = new BehaviorSubject<Game | null>(null);
  game$ = this.gameSubject.asObservable();
  private attemptsSubject = new BehaviorSubject<Attempts | null>(null);
  attempts$ = this.attemptsSubject.asObservable();
  private initFetchId: number = 0; // Guard against stale init fetch responses

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Check if user is logged in, then fetch fresh game state from database
      const userId = localStorage.getItem('user_id');
      if (userId) {
        this.fetchCurrentGame(Number(userId));
      }
      // If not logged in, game state will be null (anonymous play gets random word)
    }
  }

  // Fetch current game state from database (replaces trusting localStorage)
  private fetchCurrentGame(userId: number): void {
    const fetchId = ++this.initFetchId; // Increment to invalidate any in-flight requests
    const params = new HttpParams().set('user_id', userId.toString());
    this.http.get<{ game: Game | null; attempts: Attempts | null }>(
      `${this.apiUrl}/get-current-game`,
      { params }
    ).subscribe({
      next: (response) => {
        // Only apply if this is still the latest fetch (no newer game load happened)
        if (fetchId === this.initFetchId) {
          this.updateGame(response.game);
          this.updateAttempts(response.attempts);
        }
      },
      error: (error) => {
        console.error('Failed to fetch current game:', error);
        // On error, clear any stale localStorage data (only if still latest)
        if (fetchId === this.initFetchId) {
          this.clearGameData();
        }
      }
    });
  }

  // Call this to invalidate any pending init fetch (prevents stale data)
  private invalidateInitFetch(): void {
    this.initFetchId++;
  }

  getSolution(): Observable<{ word: string }> {
    return this.http.get<{ word: string }>(`${this.apiUrl}/get-solution`);
  }

  checkWord(word: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${this.apiUrl}/check-word/${word}`
    );
  }

  // On login, store game and attempts data to localStorage and BehaviorSubjects
  // Returns the route to navigate to based on game state
  uponLogin(
    userData: User,
    mostRecentGame: Game | null,
    attempts: Attempts | null
  ): string {
    if (userData) {
      localStorage.setItem('user_id', userData.user_id.toString());
      localStorage.setItem('username', userData.username);
      localStorage.setItem('avatar_num', userData.avatar_num.toString());
      localStorage.setItem('avatar_url', userData.avatar_url);
      this.loggedIn = true;
    }

    if (!mostRecentGame) {
      this.clearGameData();
      return '/game'; // No game, go to game page (will show empty board for anonymous play)
    }

    this.multiplayer_game = mostRecentGame.game_type === 'multiplayer';
    this.updateGame(mostRecentGame);
    this.updateAttempts(attempts);

    // Determine correct route based on game state
    if (mostRecentGame.game_type === 'multiplayer' && userData) {
      const loggedInUserId = userData.user_id;
      const isMyTurn = mostRecentGame.player_turn === loggedInUserId;

      if (isMyTurn) {
        // It's my turn - do I have a word to guess or need to pick one?
        if (mostRecentGame.word) {
          return '/game';
        } else {
          return '/choose-word';
        }
      } else {
        // Not my turn - wait for opponent
        return '/wait';
      }
    }

    // Single player or default
    return '/game';
  }

  // Save game and attempts data to localStorage and update BehaviorSubjects
  private updateGame(game: Game | null, ) {
    this.gameSubject.next(game);
    if (game && isPlatformBrowser(this.platformId)) {
      localStorage.setItem('game', JSON.stringify(game));
    } else if (!game && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('game');
    }
  }

  private updateAttempts(attempts: Attempts | null){
    this.attemptsSubject.next(attempts);
    if (attempts && isPlatformBrowser(this.platformId)) {
      localStorage.setItem('attempts', JSON.stringify(attempts));
    } else if (!attempts && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('attempts');
    }
  }

  // Retrieve game data from localStorage on refresh
  private getStoredGame(): Game | null {
    if (isPlatformBrowser(this.platformId)) {
      const storedGame = localStorage.getItem('game');
      return storedGame ? JSON.parse(storedGame) : null;
    }
    return null;
  }

  // Clear game and attempts data from localStorage and BehaviorSubjects
  clearGameData() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('game');
      localStorage.removeItem('attempts');
    }
    this.gameSubject.next(null);
    this.attemptsSubject.next(null);
  }

  // Retrieve multiplayer game data and update state
  retrieveMultiPlayerGame(player1_id: number, player2_id: number) {
    // Invalidate any pending init fetch to prevent race conditions
    this.invalidateInitFetch();
    // Clear any existing game data first to prevent stale data display
    this.clearGameData();

    const params = new HttpParams()
      .set('player1_id', player1_id.toString()) //This is logged in player id
      .set('player2_id', player2_id.toString());
    this.http
      .get<any>(`${this.apiUrl}/retrieve-multiplayer-game`, { params })
      .subscribe({
        next: (response) => {
          if (response.newGame) {
            // New game created with word = NULL, store game so choose-word has the game_id
            this.updateGame(response.game);
            this.router.navigate(['/choose-word']);
          } else {
            // Existing game - update state with game data
            const game = response.game;
            this.updateGame(game);
            this.updateAttempts(response.attempts);

            // Check whose turn it is and if there's a word to guess
            if (player1_id == game.player_turn) {
              // It's our turn - but do we have a word to guess or need to pick one?
              if (game.word) {
                this.router.navigate(['/game']);
              } else {
                // No word set - we need to choose a word for opponent
                this.router.navigate(['/choose-word']);
              }
            } else {
              this.router.navigate(['/wait']);
            }
          }
        },
        error: (error) => {
          console.error('Failed to retrieve the multiplayer game.');
          console.log(error);
        },
      });
  }

  // Retrieve single-player game data and update state
  retrieveSinglePlayerGame(user_id: number) {
    // Invalidate any pending init fetch to prevent race conditions
    this.invalidateInitFetch();
    // Clear any existing game data first to prevent stale data display
    this.clearGameData();

    const params = new HttpParams().set('player_id', user_id.toString());
    this.http
      .get<any>(`${this.apiUrl}/retrieve-singleplayer-game`, { params })
      .subscribe({
        next: (response) => {
          this.updateGame(response.game);
          this.updateAttempts(response.attempts);
          this.router.navigate(['/game']);
        },
        error: () => {
          console.error('Failed to retrieve the single-player game.');
        },
      });
  }

  getWordChoices(player1_id: number, player2_id: number) {
    const params = new HttpParams()
      .set('player1_id', player1_id.toString())
      .set('player2_id', player2_id.toString());
    return this.http.get<any>(`${this.apiUrl}/choose-word`, { params });
  }

  // Check game status for polling (lightweight)
  // Returns turn_completed: true if the polled turn is done and a new one exists
  checkGameStatus(game_id: number) {
    const params = new HttpParams().set('game_id', game_id.toString());
    return this.http.get<{ player_turn: number; has_word: boolean; game_id?: number; turn_completed?: boolean }>(
      `${this.apiUrl}/check-game-status`,
      { params }
    );
  }

  // Update the word for a multiplayer game (when challenger picks a word)
  updateGameWord(game_id: number, word: string) {
    return this.http.post<{ game: Game }>(`${this.apiUrl}/update-game-word`, { game_id, word })
      .subscribe({
        next: (response) => {
          this.updateGame(response.game);
          this.router.navigate(['/wait']);
        },
        error: (error) => {
          console.error('Failed to update game word:', error);
        }
      });
  }

  getCurrentUser() {
    return localStorage.getItem('username');
  }

  addAttemptsData(word: string, is_correct: boolean, attempt_num: number) {
    const game = this.getStoredGame();
    if (game) {
      const attempt = {
        game_id: game.game_id,
        game_type: game?.game_type,
        player_id:
          game?.game_type == 'singleplayer'
            ? game.player1_id
            : game.player_turn,
        attempt: word,
        attempt_num: attempt_num,
        is_correct: is_correct,
        turn_num: game.current_turn_num,
      };
      this.http.post<Attempts>(`${this.apiUrl}/add-attempt`, attempt).subscribe({
        next: (response) => {
          this.updateAttempts(response)
        },
        error: (error) => {
          console.error('Failed to insert attempt ', error);
        },
      });
    }
  }

  // Complete the current turn in multiplayer - player picks a word for opponent
  // won: true if player guessed correctly, false if they failed
  completeTurn(game_id: number, player_id: number, attempts_used: number, won: boolean) {

    return this.http.post<{ game: Game; turnCompleted: boolean; pointsEarned: number }>(
      `${this.apiUrl}/complete-turn`,
      { game_id, player_id, attempts_used, won }
    ).subscribe({
      next: (response) => {
        console.log('completeTurn response:', response);
        if (response.pointsEarned > 0) {
          console.log(`Earned ${response.pointsEarned} points!`);
        }
        // Clear attempts FIRST to prevent stale attempts from triggering completion handlers again
        this.updateAttempts(null);
        this.updateGame(response.game);
        console.log('Navigating to /choose-word');
        this.router.navigate(['/choose-word']); // Player picks a word for opponent
      },
      error: (error) => {
        console.error('Failed to complete turn:', error);
      }
    });
  }

  // Complete a single player game and start a new one
  completeSinglePlayerGame(game_id: number, won: boolean) {
    return this.http.post<{ success: boolean; won: boolean }>(
      `${this.apiUrl}/complete-singleplayer-game`,
      { game_id, won }
    ).subscribe({
      next: () => {
        // Clear current game data and start a new game
        this.clearGameData();
        const userId = localStorage.getItem('user_id');
        if (userId) {
          // Small delay before starting new game so user can see result
          setTimeout(() => {
            this.retrieveSinglePlayerGame(Number(userId));
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Failed to complete single player game:', error);
      }
    });
  }
}
