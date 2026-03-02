import { Component, input, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

/**
 * User menu component with dropdown.
 * Displays user name, opens dropdown menu on click.
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss'
})
export class UserMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Current user data */
  user = input.required<User>();

  /** Dropdown open state */
  isOpen = signal<boolean>(false);

  /**
   * Toggle dropdown menu
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(open => !open);
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }

  /**
   * Handle logout action
   */
  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.isOpen.set(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Navigate to profile edit page
   */
  goToProfile(): void {
    this.isOpen.set(false);
    this.router.navigate(['/profile']);
  }
}
