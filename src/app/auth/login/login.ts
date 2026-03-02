import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ToastService } from '../../core/services';
import { SpinnerComponent } from '../../shared/components';

/**
 * Quick login page - only requires display name.
 * Automatically creates guest account with custom name.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  displayName = '';
  isLoading = signal<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles quick login with name only - creates guest account */
  async onQuickLogin(): Promise<void> {
    if (!this.displayName || this.displayName.trim().length < 2) {
      this.toastService.error('Please enter a name (min. 2 characters)');
      return;
    }

    this.isLoading.set(true);

    try {
      console.log('🎭 Quick login:', this.displayName);

      await this.authService.quickLogin(this.displayName.trim());

      this.toastService.success(`Welcome, ${this.displayName}! 👋`);
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('❌ Quick login error:', error);
      this.toastService.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
