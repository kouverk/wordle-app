import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SharedModule } from '../../modules/shared.module';
import { MaterialModule } from '../../modules/material.module';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [SharedModule, MaterialModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup = new FormGroup({
    new_password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirm_password: new FormControl('', [Validators.required])
  });

  resetToken: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  resetComplete: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const { new_password, confirm_password } = this.form.value;

      if (new_password !== confirm_password) {
        this.errorMessage = 'Passwords do not match';
        return;
      }

      this.authService.resetPassword(this.resetToken, new_password).subscribe({
        next: (response: any) => {
          this.successMessage = `Password reset successful for ${response.username}!`;
          this.resetComplete = true;
          this.errorMessage = null;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to reset password';
          this.successMessage = null;
        }
      });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
