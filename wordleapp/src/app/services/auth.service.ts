import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // Your backend URL
  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  isLoggedIn(): boolean {
    return true
    // const token = localStorage.getItem('token');
    // return !!(token && !this.jwtHelper.isTokenExpired(token));  
  }
  
  
  logout() {
    localStorage.removeItem('token');
  }

  signup(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post('/api/signup', credentials);  // Example API endpoint
  }
}
