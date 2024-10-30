import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: object) {
    this.jwtHelper = new JwtHelperService(); // Initialize it
    this.updateLoginStatus();
  }

  private updateLoginStatus(){
    const isLoggedIn = this.checkLoginStatus();
    this.isLoggedInSubject.next(isLoggedIn);
  }

  private checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      return !!(token && !this.jwtHelper.isTokenExpired(token));
    }
    return false;
  }

  login(credentials: any): Observable<any> {
    return new Observable((observer) => {
      this.http.post(`${this.apiUrl}/login`, credentials).subscribe({
        next: (response: any) => {
          observer.next(response); // Pass response to the component
          observer.complete();
          if (isPlatformBrowser(this.platformId) && response.token) {
            this.isLoggedInSubject.next(true); // Update login state
          }
        },
        error: (err) => observer.error(err),
      });
    });
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