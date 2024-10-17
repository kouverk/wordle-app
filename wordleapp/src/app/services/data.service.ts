import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000';
  public loggedIn: boolean = false; 
  public multiplayer_game: boolean = false; 

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

  uponLogin(response:any, multiplayer_game:boolean){
    localStorage.setItem('user_id', response.user_id)
    localStorage.setItem('username', response.username)
    localStorage.setItem('avatar_num', response.avatar_num)
    localStorage.setItem('avatar_url', response.avatar_url)
    this.loggedIn = true;
    this.multiplayer_game = multiplayer_game; 

  }
}
