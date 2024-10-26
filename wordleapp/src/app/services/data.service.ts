import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Game, User } from './interfaces'

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000';
  public loggedIn: boolean = false; 
  public multiplayer_game: boolean = false; 
  private gameSubject = new BehaviorSubject<Game | null>(null);
  game$ = this.gameSubject.asObservable();

  constructor(private http: HttpClient) { }

  getSolution(): Observable<{ word: string }> {
    return this.http.get<{ word: string }>(`${this.apiUrl}/get-solution`);
  }

  checkWord(word: string): Observable<{exists: boolean}>{
    return this.http.get<{exists: boolean}>(`${this.apiUrl}/check-word/${word}`)
  }

  getAvatars(): Observable<Array<object>> {
    return this.http.get<Array<object>>(`${this.apiUrl}/get-avatars`)
  }

  assignAvatar(payload:{user_id:number, avatar_num:number}): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-avatar`, payload);  
  }

  uponLogin(userData: User, mostRecentGame: Game){
    //response handles if this was fired from sign/login or not (from the sidenav of the app)
    if (userData) {
      localStorage.setItem('user_id', (userData.user_id).toString())
      localStorage.setItem('username', userData.username)
      localStorage.setItem('avatar_num', (userData.avatar_num).toString())
      localStorage.setItem('avatar_url', userData.avatar_url)
      this.loggedIn = true;
    }

    //Update multiplayer game boolean
    this.multiplayer_game = mostRecentGame ? mostRecentGame.player2_id !== null : false;

    // If no most recent game, start single player game
    if (!mostRecentGame) {
        this.gameSubject.next(null)
        return;
    }

    // Load appropriate game based on multiplayer_game status
    this.gameSubject.next(mostRecentGame)
  }

  retrieveMultiPlayerGame(player1_id:number, player2_id: number){

  }

  retrieveSinglePlayerGame(user_id:number){

  }
}
