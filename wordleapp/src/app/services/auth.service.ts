import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000'; // Your backend URL
  public loggedIn: boolean = false; 
  private jwtHelper: JwtHelperService; 
  private isLoggedIn: boolean = false; 

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: object) {
    this.jwtHelper = new JwtHelperService(); // Initialize it
    this.checkLoginStatus();
  }

  private checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      // Only access localStorage if we're in the browser
      this.isLoggedIn = !!localStorage.getItem('token');
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  userIsLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      return !!(token && !this.jwtHelper.isTokenExpired(token));  
    }
    return false; // Not in browser, so return false
  }
  
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
  }

  signup(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, credentials); 
  }

  getAvatars(): Observable<Array<object>> {
    return this.http.get<Array<object>>(`${this.apiUrl}/get-avatars`)
  }

  assignAvatar(payload:{user_id:number, avatar_num:number}): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-avatar`, payload);  
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-users`); 
  }
}
