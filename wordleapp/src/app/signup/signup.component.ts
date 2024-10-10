import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SharedModule } from '../modules/shared.module';
import { MaterialModule } from '../modules/material.module';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  form: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    if (this.form.valid && this.passwordsMatch()) {
      const credentials = {
        username: this.form.value.username,
        password: this.form.value.password
      };
      this.authService.signup(credentials).subscribe(
        (response: any) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/game']);
        },
        (error) => {
          console.error('Signup failed', error);
        }
      );
    }
  }

  onSubmit() {
    this.signup();
  }

  passwordsMatch(): boolean {
    return this.form.value.password === this.form.value.confirmPassword;
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
