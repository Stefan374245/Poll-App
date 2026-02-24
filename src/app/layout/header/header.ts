import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services';

/**
 * App header with navigation and user actions.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly currentUser;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.currentUser = this.authService.currentUser;
  }

  /** Logs out and navigates to login. */
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
