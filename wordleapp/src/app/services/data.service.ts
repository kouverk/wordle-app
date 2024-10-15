import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000';

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
}
