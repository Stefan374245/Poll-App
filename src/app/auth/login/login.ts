import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services';
import { ToastService } from '../../core/services';

/**
 * Login page component.
 * Supports email/password login and guest access.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles login form submission. */
  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.toastService.error('Please enter email and password');
      return;
    }

    this.isLoading = true;

    try {
      console.log('Attempting login...', { email: this.email });
      
      await this.authService.login(this.email, this.password);
      
      console.log('Login successful, redirecting...');
      this.toastService.success('Logged in successfully');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Login error:', error);
      this.toastService.error(error.message || 'Invalid email or password. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /** Handles guest login. */
  async onGuestLogin(): Promise<void> {
    this.isLoading = true;

    try {
      console.log('Attempting guest login...');
      
      await this.authService.loginAsGuest();
      
      console.log('Guest login successful, redirecting...');
      this.toastService.info('Logged in as Guest');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Guest login error:', error);
      this.toastService.error('Failed to sign in as guest. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
}
