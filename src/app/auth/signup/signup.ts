import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services';
import { ToastService } from '../../core/services';

/**
 * Signup page component.
 * Creates a new user account.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {
  displayName = '';
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles signup form submission. */
  async onSignup(): Promise<void> {
    if (!this.displayName || !this.email || !this.password) {
      this.toastService.error('Please fill in all fields');
      return;
    }

    if (this.password.length < 6) {
      this.toastService.error('Password must be at least 6 characters');
      return;
    }

    this.isLoading = true;

    try {
      console.log('Attempting signup...', { email: this.email, displayName: this.displayName });
      
      await this.authService.signup(this.displayName, this.email, this.password);
      
      console.log('Signup successful, redirecting...');
      this.toastService.success('Account created successfully');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Signup error:', error);
      this.toastService.error(error.message || 'An error occurred during signup. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
}
