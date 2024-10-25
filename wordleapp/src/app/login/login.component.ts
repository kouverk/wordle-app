import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../modules/shared.module';
import { MaterialModule } from '../modules/material.module';
import { DataService } from '../services/data.service';

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

  constructor(private authService: AuthService, private dataservice: DataService, private router: Router) {}

  login() {
    if (this.form.valid) {
      const credentials = this.form.value;
      this.authService.login(credentials).subscribe({
        next: (response: any) => {
          console.log('Login successful');
          localStorage.setItem('token', response[0].token);
          const userData = response[1]
          const mostRecentGame = response[2]
          this.dataservice.uponLogin(response[1], response[2]);
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
