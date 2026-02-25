import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models';
import { SupabaseService } from './supabase/supabase.service';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '../models/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Service for authentication management.
 * Supports login, signup and guest access with Supabase.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly supabaseUserSignal = signal<SupabaseUser | null>(null);

  /** Currently authenticated user. */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /** Whether a user is logged in. */
  get isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {
    this.initAuth();
  }

  /** Initialize auth state. */
  private async initAuth(): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (user) {
      await this.loadUserProfile(user);
    }

    // Listen to auth state changes
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user);
      if (session?.user) {
        await this.loadUserProfile(session.user);
      } else {
        this.currentUserSignal.set(null);
        this.supabaseUserSignal.set(null);
      }
    });
  }

  /** Load user profile from public.users table. */
  private async loadUserProfile(supabaseUser: SupabaseUser): Promise<void> {
    this.supabaseUserSignal.set(supabaseUser);

    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      // Use auth data as fallback
      const user: User = {
        id: supabaseUser.id,
        displayName: supabaseUser.user_metadata['display_name'] || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        avatarUrl: supabaseUser.user_metadata['avatar_url'] || '',
        isGuest: false,
      };
      this.currentUserSignal.set(user);
    } else {
      const profileData = data as UserRow;
      const user: User = {
        id: profileData.id,
        displayName: profileData.display_name,
        email: profileData.email,
        avatarUrl: profileData.avatar_url || '',
        isGuest: profileData.is_guest,
      };
      this.currentUserSignal.set(user);
    }
  }

  /** Logs in with email and password. */
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    if (data.user) {
      console.log('User logged in:', data.user);
      await this.loadUserProfile(data.user);
    }
  }

  /** Creates a new account. */
  async signup(displayName: string, email: string, password: string): Promise<void> {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          avatar_url: avatarUrl,
          is_guest: false
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }

    if (data.user) {
      console.log('User signed up:', data.user);
      // Profile is automatically created by database trigger
      await this.loadUserProfile(data.user);
    }
  }

  /** Creates a guest session. */
  async loginAsGuest(): Promise<void> {
    const guestEmail = `guest_${Date.now()}@pollapp.local`;
    const guestPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${Date.now()}`;

    const { data, error } = await this.supabase.client.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: {
          display_name: 'Guest User',
          avatar_url: avatarUrl,
          is_guest: true
        }
      }
    });

    if (error) {
      console.error('Guest signup error:', error);
      throw error;
    }

    if (data.user) {
      // Profile is automatically created by database trigger
      await this.loadUserProfile(data.user);
    }
  }

  /** Logs out the current user. */
  async logout(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();

    if (error) {
      console.error('Signout error:', error);
      throw error;
    }

    this.currentUserSignal.set(null);
    this.supabaseUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  /** Get current Supabase user. */
  getSupabaseUser(): SupabaseUser | null {
    return this.supabaseUserSignal();
  }
}
