import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../modules/shared.module';
import { MaterialModule } from '../modules/material.module';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  form: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  loginError: string | null = null; // Variable to hold error messages

  constructor(private authService: AuthService, private gameservice: GameService, private router: Router) {}

  ngOnInit() {
    // If user already has a valid token, redirect to game
    if (this.authService.userIsLoggedIn()) {
      this.router.navigate(['/game']);
    }
  }

  login() {
    if (this.form.valid) {
      const credentials = this.form.value;
      this.authService.login(credentials).subscribe({
        next: (response: any) => {
          localStorage.setItem('token', response.token);
          const userData = response.user;
          const mostRecentGame = response.game;
          const attempts = response.attempts;
          const route = this.gameservice.uponLogin(userData, mostRecentGame, attempts);
          this.router.navigate([route]);
        }, 
        error: (error) => {
          console.error('Login failed', error);
          this.loginError = error.error?.message || 'Invalid username or password'; // Update error message
        }
      });
    }
  }

  onSubmit() {
    this.login();
  }

  // Navigate to signup
  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  // Navigate to forgot password
  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
