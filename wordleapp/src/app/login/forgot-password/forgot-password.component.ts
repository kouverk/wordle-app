import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../modules/shared.module';
import { MaterialModule } from '../../modules/material.module';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  form: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required])
  });

  errorMessage: string | null = null;
  successMessage: string | null = null;
  resetToken: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.valid) {
      const username = this.form.value.username;
      this.authService.requestPasswordReset(username).subscribe({
        next: (response: any) => {
          this.successMessage = 'Reset token generated!';
          this.resetToken = response.reset_token;
          this.errorMessage = null;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to request password reset';
          this.successMessage = null;
          this.resetToken = null;
        }
      });
    }
  }

  navigateToReset() {
    if (this.resetToken) {
      this.router.navigate(['/reset-password'], { queryParams: { token: this.resetToken } });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
