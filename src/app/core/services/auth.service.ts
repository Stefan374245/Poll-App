import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models';
import { SupabaseService } from './supabase/supabase.service';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '../models/database.types';

type DbUser = Database['public']['Tables']['users'];
type UserRow = DbUser['Row'];
type UserInsert = DbUser['Insert'];

/**
 * Service for authentication management.
 * Supports quick login with display name (creates guest accounts).
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

  /** Load user profile from public.users table with retry logic. */
  private async loadUserProfile(supabaseUser: SupabaseUser, retryCount = 0): Promise<void> {
    this.supabaseUserSignal.set(supabaseUser);

    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      await this.handleProfileLoadError(supabaseUser, retryCount, error);
      return;
    }

    this.setUserFromProfile(data as UserRow);
  }

  /** Handles profile loading errors with retry logic. */
  private async handleProfileLoadError(
    supabaseUser: SupabaseUser,
    retryCount: number,
    error: any
  ): Promise<void> {
    console.error(`Error loading user profile (attempt ${retryCount + 1}):`, {
      code: error.code,
      message: error.message
    });

    if (retryCount === 0) {
      console.log('Retrying profile load in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.loadUserProfile(supabaseUser, retryCount + 1);
    }

    console.log('Profile not found after retry, attempting manual creation...');
    await this.ensureUserProfile(supabaseUser);
  }

  /** Sets current user from profile data. */
  private setUserFromProfile(profileData: UserRow): void {
    console.log('✅ Profile loaded successfully:', profileData.display_name);
    const user: User = {
      id: profileData.id,
      displayName: profileData.display_name,
      email: profileData.email,
      isGuest: profileData.is_guest,
    };
    this.currentUserSignal.set(user);
  }

  /** Ensures user profile exists in public.users table, creates if missing. */
  private async ensureUserProfile(supabaseUser: SupabaseUser): Promise<void> {
    console.log('🔧 Ensuring user profile exists for:', supabaseUser.email);

    const profileInsert = this.createProfileInsert(supabaseUser);
    const { data, error } = await this.supabase.client
      .from('users')
      // @ts-expect-error - Supabase RLS policies cause type inference issues, but operation works at runtime
      .insert(profileInsert)
      .select()
      .single();

    if (error) {
      await this.handleProfileCreationError(error, supabaseUser, profileInsert);
      return;
    }

    this.setUserFromProfile(data as UserRow);
  }

  /** Creates profile insert payload from Supabase user. */
  private createProfileInsert(supabaseUser: SupabaseUser): UserInsert {
    const displayName = supabaseUser.user_metadata['display_name']
      || supabaseUser.email?.split('@')[0]
      || 'User';
    const isGuest = supabaseUser.user_metadata['is_guest'] === true
      || supabaseUser.user_metadata['is_guest'] === 'true';

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      display_name: displayName,
      is_guest: isGuest
    };
  }

  /** Handles profile creation errors with fallback strategies. */
  private async handleProfileCreationError(
    error: any,
    supabaseUser: SupabaseUser,
    profileInsert: UserInsert
  ): Promise<void> {
    console.error('❌ Manual profile creation failed:', {
      code: error.code,
      message: error.message
    });

    if (error.code === '23505') {
      await this.loadExistingProfile(supabaseUser);
      return;
    }

    this.setUserFromMetadata(supabaseUser, profileInsert);
  }

  /** Attempts to load existing profile (handles race conditions). */
  private async loadExistingProfile(supabaseUser: SupabaseUser): Promise<void> {
    console.log('⚠️ Profile already exists, attempting to load...');
    const { data: existingProfile } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (existingProfile) {
      console.log('✅ Loaded existing profile');
      this.setUserFromProfile(existingProfile as UserRow);
    }
  }

  /** Sets user from metadata as fallback. */
  private setUserFromMetadata(supabaseUser: SupabaseUser, profileInsert: UserInsert): void {
    console.warn('⚠️ Using auth metadata as fallback');
    const user: User = {
      id: supabaseUser.id,
      displayName: profileInsert.display_name,
      email: supabaseUser.email || '',
      isGuest: profileInsert.is_guest || false,
    };
    this.currentUserSignal.set(user);
  }

  /** Quick login with display name only - creates guest account. */
  async quickLogin(displayName: string): Promise<void> {
    console.log('🎭 Quick login for:', displayName);

    await this.clearAllSessions();

    const credentials = this.generateGuestCredentials();
    const { data, error } = await this.createGuestAccount(displayName, credentials);

    if (error) {
      this.handleQuickLoginError(error);
      throw error;
    }

    if (data.user) {
      await this.finalizeGuestLogin(data.user);
    }
  }

  /** Clears all existing sessions completely. */
  private async clearAllSessions(): Promise<void> {
    console.log('🧹 Clearing all sessions completely...');
    await this.supabase.client.auth.signOut();

    this.currentUserSignal.set(null);
    this.supabaseUserSignal.set(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      this.forceSessionCleanup();
    }

    console.log('✅ Session completely cleared');
  }

  /** Forces manual session cleanup from localStorage. */
  private forceSessionCleanup(): void {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /** Generates unique guest credentials. */
  private generateGuestCredentials(): { email: string; password: string } {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const email = `guest_${timestamp}_${randomId}@pollapp.guest`;
    const password = Math.random().toString(36).substring(2, 15)
      + Math.random().toString(36).substring(2, 15);

    return { email, password };
  }

  /** Creates a guest account with Supabase. */
  private async createGuestAccount(
    displayName: string,
    credentials: { email: string; password: string }
  ) {
    return await this.supabase.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          display_name: displayName,
          is_guest: true
        }
      }
    });
  }

  /** Handles quick login errors. */
  private handleQuickLoginError(error: any): void {
    console.error('❌ Quick login error:', {
      code: error.status,
      message: error.message,
      name: error.name
    });
  }

  /** Finalizes guest login by loading profile. */
  private async finalizeGuestLogin(user: SupabaseUser): Promise<void> {
    console.log('✅ Guest account created with UUID:', user.id);
    console.log('📧 Email:', user.email);
    await this.loadUserProfile(user);
  }

  /** Logs out the current user. */
  async logout(): Promise<void> {
    const userName = this.currentUserSignal()?.displayName;

    const { error } = await this.supabase.client.auth.signOut();

    if (error) {
      console.error('❌ Signout error:', error);
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
