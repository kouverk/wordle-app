import { Component } from '@angular/core';
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

export class LoginComponent {
  form: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  loginError: string | null = null; // Variable to hold error messages

  constructor(private authService: AuthService, private gameservice: GameService, private router: Router) {}

  login() {
    if (this.form.valid) {
      const credentials = this.form.value;
      this.authService.login(credentials).subscribe({
        next: (response: any) => {
          console.log('Login successful');
          localStorage.setItem('token', response.token);
          const userData = response.user
          const mostRecentGame = response.game
          const attempts = response.attempts
          this.gameservice.uponLogin(userData, mostRecentGame, attempts);
          this.router.navigate(['/game']);
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
}
