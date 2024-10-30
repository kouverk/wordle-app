import { HttpClient, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Game, User, Attempts} from './interfaces'
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:3000';
  public loggedIn: boolean = false; 
  public multiplayer_game: boolean = false; 
  private gameSubject = new BehaviorSubject<Game | null>(null);
  game$ = this.gameSubject.asObservable();
  private attemptsSubject = new BehaviorSubject<Attempts | null>(null); 
  attempts$ = this.attemptsSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  getSolution(): Observable<{ word: string }> {
    console.log('get solution')
    return this.http.get<{ word: string }>(`${this.apiUrl}/get-solution`);
  }

  checkWord(word: string): Observable<{exists: boolean}>{
    return this.http.get<{exists: boolean}>(`${this.apiUrl}/check-word/${word}`)
  }

  // On login, store game and attempts data to localStorage and BehaviorSubjects
  uponLogin(userData: User, mostRecentGame: Game | null, attempts: Attempts | null) {
    if (userData) {
      localStorage.setItem('user_id', userData.user_id.toString());
      localStorage.setItem('username', userData.username);
      localStorage.setItem('avatar_num', userData.avatar_num.toString());
      localStorage.setItem('avatar_url', userData.avatar_url);
      this.loggedIn = true;
    }

    if (!mostRecentGame) {
      this.clearGameData();
      return;
    }

    this.multiplayer_game = mostRecentGame.game_type === 'multiplayer';
    this.updateGameState(mostRecentGame, attempts);
  }

  // Save game and attempts data to localStorage and update BehaviorSubjects
  private updateGameState(game: Game | null, attempts: Attempts | null) {
    this.gameSubject.next(game);
    this.attemptsSubject.next(attempts);

    if (game) {
      localStorage.setItem('game', JSON.stringify(game));
    } else {
      localStorage.removeItem('game');
    }

    if (attempts) {
      localStorage.setItem('attempts', JSON.stringify(attempts));
    } else {
      localStorage.removeItem('attempts');
    }
  }

  // Retrieve game data from localStorage on refresh
  private getStoredGame(): Game | null {
    const storedGame = localStorage.getItem('game');
    return storedGame ? JSON.parse(storedGame) : null;
  }

  // Retrieve attempts data from localStorage on refresh
  private getStoredAttempts(): Attempts | null {
    const storedAttempts = localStorage.getItem('attempts');
    return storedAttempts ? JSON.parse(storedAttempts) : null;
  }

  // Clear game and attempts data from localStorage and BehaviorSubjects
  clearGameData() {
    localStorage.removeItem('game');
    localStorage.removeItem('attempts');
    this.gameSubject.next(null);
    this.attemptsSubject.next(null);
  }

  // Retrieve multiplayer game data and update state
  retrieveMultiPlayerGame(player1_id: number, player2_id: number) {
    const params = new HttpParams()
      .set('player1_id', player1_id.toString())
      .set('player2_id', player2_id.toString());
    this.http.get<any>(`${this.apiUrl}/retrieve-multiplayer-game`, { params }).subscribe({
      next: (response) => {
        this.updateGameState(response.game, response.attempts);
        this.router.navigate(['/game']);
      },
      error: () => {
        console.error('Failed to retrieve the multiplayer game.');
      }
    });
  }

  // Retrieve single-player game data and update state
  retrieveSinglePlayerGame(user_id: number) {
    const params = new HttpParams().set('player_id', user_id.toString());
    this.http.get<any>(`${this.apiUrl}/retrieve-singleplayer-game`, { params }).subscribe({
      next: (response) => {
        this.updateGameState(response.game, response.attempts);
        this.router.navigate(['/game']);
      },
      error: () => {
        console.error('Failed to retrieve the single-player game.');
      }
    });
  }
}
