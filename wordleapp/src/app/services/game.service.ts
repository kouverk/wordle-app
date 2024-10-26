import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Game, User, Attempts} from './interfaces'

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

  constructor(private http: HttpClient) { }

  getSolution(): Observable<{ word: string }> {
    return this.http.get<{ word: string }>(`${this.apiUrl}/get-solution`);
  }

  checkWord(word: string): Observable<{exists: boolean}>{
    return this.http.get<{exists: boolean}>(`${this.apiUrl}/check-word/${word}`)
  }

  uponLogin(userData: User, mostRecentGame: Game | null, attempts: Attempts | null) {
    // Store basic user information in localStorage
    if (userData) {
        localStorage.setItem('user_id', userData.user_id.toString());
        localStorage.setItem('username', userData.username);
        localStorage.setItem('avatar_num', userData.avatar_num.toString());
        localStorage.setItem('avatar_url', userData.avatar_url);
        this.loggedIn = true;
    }

    // If no most recent game, initialize a new single-player game
    if (!mostRecentGame) {
        this.gameSubject.next(null);
        this.attemptsSubject.next(null);
        return;
    }

    // Determine if the game is multiplayer based on game_type
    this.multiplayer_game = mostRecentGame.game_type === 'multiplayer';

    // Load the most recent game into the game subject, with type narrowing handled by TypeScript
    this.gameSubject.next(mostRecentGame);
    this.attemptsSubject.next(attempts); 
}


  retrieveMultiPlayerGame(player1_id:number, player2_id: number){

  }

  retrieveSinglePlayerGame(user_id:number){

  }
}
