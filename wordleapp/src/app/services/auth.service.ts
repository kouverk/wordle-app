import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // Your backend URL
  public loggedIn: boolean = false; 

  constructor(private http: HttpClient) {}

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
    return this.http.post(`${this.apiUrl}/signup`, credentials);  // Example API endpoint
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-users`); 
  }

}
