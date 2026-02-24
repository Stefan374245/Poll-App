import { Injectable, signal } from '@angular/core';
import { User } from '../models';

/**
 * Service for authentication management.
 * Supports login, signup and guest access.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);

  /** Currently authenticated user. */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /** Whether a user is logged in. */
  get isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  /** Logs in with email and password. */
  login(email: string, _password: string): void {
    const user: User = {
      id: crypto.randomUUID(),
      displayName: email.split('@')[0],
      email,
      avatarUrl: '',
      isGuest: false,
    };
    this.currentUserSignal.set(user);
  }

  /** Creates a new account. */
  signup(displayName: string, email: string, _password: string): void {
    const user: User = {
      id: crypto.randomUUID(),
      displayName,
      email,
      avatarUrl: '',
      isGuest: false,
    };
    this.currentUserSignal.set(user);
  }

  /** Creates a guest session. */
  loginAsGuest(): void {
    const user: User = {
      id: crypto.randomUUID(),
      displayName: 'Guest',
      email: '',
      avatarUrl: '',
      isGuest: true,
    };
    this.currentUserSignal.set(user);
  }

  /** Logs out the current user. */
  logout(): void {
    this.currentUserSignal.set(null);
  }
}
