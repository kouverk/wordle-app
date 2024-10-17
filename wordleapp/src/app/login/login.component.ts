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

  constructor(private authService: AuthService, private dataservice: DataService, private router: Router) {}

  login() {
    if (this.form.valid) {
      const credentials = this.form.value;
      this.authService.login(credentials).subscribe({
        next: (response:any) => {
          localStorage.setItem('token', response.token);
          this.dataservice.uponLogin(response, true)
          this.router.navigate(['/game']);
        }, 
        error: (error) => {
          console.error('Login failed', error);

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
