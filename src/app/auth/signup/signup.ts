import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ToastService } from '../../core/services';
import { SpinnerComponent } from '../../shared/components';

/**
 * Signup page component - redirects to login (Quick Join).
 * Same as login - only requires display name.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {
  displayName = '';
  isLoading = signal<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles quick signup with name only */
  async onQuickSignup(): Promise<void> {
    if (!this.displayName || this.displayName.trim().length < 2) {
      this.toastService.error('Please enter a name (min. 2 characters)');
      return;
    }

    this.isLoading.set(true);

    try {
      console.log('🎭 Quick signup:', this.displayName);
      await this.authService.quickLogin(this.displayName.trim());
      this.toastService.success(`Welcome, ${this.displayName}! 🎉`);
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      this.toastService.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
