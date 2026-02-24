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

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  /** Handles signup form submission. */
  onSignup(): void {
    this.authService.signup(this.displayName, this.email, this.password);
    this.toastService.success('Account created successfully');
    this.router.navigate(['/']);
  }
}
