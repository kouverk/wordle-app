import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // Your backend URL
  public loggedIn: boolean = false; 
  private jwtHelper: JwtHelperService; 
  constructor(private http: HttpClient) {
    this.jwtHelper = new JwtHelperService(); // Initialize it

  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!(token && !this.jwtHelper.isTokenExpired(token));  
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
