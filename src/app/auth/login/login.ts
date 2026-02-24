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

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles login form submission. */
  onLogin(): void {
    this.authService.login(this.email, this.password);
    this.toastService.success('Logged in successfully');
    this.router.navigate(['/']);
  }

  /** Handles guest login. */
  onGuestLogin(): void {
    this.authService.loginAsGuest();
    this.toastService.info('Logged in as Guest');
    this.router.navigate(['/']);
  }
}
