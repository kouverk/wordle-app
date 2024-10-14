import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
  form: FormGroup;

  constructor(private authService: AuthService, private router: Router) {
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', Validators.compose([Validators.required])),
    }, this.passwordMatch('password', 'confirmPassword'));
  };

  // Custom Validator: Ensures password and confirmPassword match
  passwordMatch(password: string, confirmPassword: string): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      if (
        confirmPasswordControl.errors &&
        !confirmPasswordControl.errors['passwordMismatch']
      ) {
        return null;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        confirmPasswordControl.setErrors(null);
        return null;
      }
    };
  }
  signup() {
    if (this.form.valid) {
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

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
