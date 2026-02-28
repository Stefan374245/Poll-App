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

  /** Load user profile from public.users table with retry logic. */
  private async loadUserProfile(supabaseUser: SupabaseUser, retryCount = 0): Promise<void> {
    this.supabaseUserSignal.set(supabaseUser);

    const { data, error } = await this.supabase.client
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error(`Error loading user profile (attempt ${retryCount + 1}):`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Retry once after 2 seconds (give trigger time to complete)
      if (retryCount === 0) {
        console.log('Retrying profile load in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.loadUserProfile(supabaseUser, retryCount + 1);
      }

      // After retry failed, try to create profile manually
      console.log('Profile not found after retry, attempting manual creation...');
      await this.ensureUserProfile(supabaseUser);
      return;
    }

    console.log('✅ Profile loaded successfully:', (data as UserRow).display_name);
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

  /** Ensures user profile exists in public.users table, creates if missing. */
  private async ensureUserProfile(supabaseUser: SupabaseUser): Promise<void> {
    console.log('🔧 Ensuring user profile exists for:', supabaseUser.email);

    // Extract metadata
    const displayName = supabaseUser.user_metadata['display_name'] || supabaseUser.email?.split('@')[0] || 'User';
    const avatarUrl = supabaseUser.user_metadata['avatar_url'] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`;
    const isGuest = supabaseUser.user_metadata['is_guest'] === true || supabaseUser.user_metadata['is_guest'] === 'true';

    const profileInsert: UserInsert = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      display_name: displayName,
      avatar_url: avatarUrl,
      is_guest: isGuest
    };

    const { data, error } = await this.supabase.client
      .from('users')
      // @ts-expect-error - RLS policy causes type inference issue, but insert works at runtime
      .insert(profileInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Manual profile creation failed:', {
        code: error.code,
        message: error.message,
        details: error.details
      });

      // If profile already exists (race condition), try to load it
      if (error.code === '23505') { // Unique constraint violation
        console.log('⚠️ Profile already exists, attempting to load...');
        const { data: existingProfile } = await this.supabase.client
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (existingProfile) {
          console.log('✅ Loaded existing profile');
          const profileData = existingProfile as UserRow;
          const user: User = {
            id: profileData.id,
            displayName: profileData.display_name,
            email: profileData.email,
            avatarUrl: profileData.avatar_url || '',
            isGuest: profileData.is_guest,
          };
          this.currentUserSignal.set(user);
          return;
        }
      }

      // Last resort: Use metadata as fallback
      console.warn('⚠️ Using auth metadata as fallback');
      const user: User = {
        id: supabaseUser.id,
        displayName: displayName,
        email: supabaseUser.email || '',
        avatarUrl: avatarUrl,
        isGuest: isGuest,
      };
      this.currentUserSignal.set(user);
      return;
    }

    console.log('✅ Profile created manually:', (data as UserRow).display_name);
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

  /** Logs in with email and password. */
  async login(email: string, password: string): Promise<void> {
    console.log('🔐 Attempting login for:', email);

    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Login error:', {
        code: error.status,
        message: error.message,
        name: error.name
      });
      throw error;
    }

    if (data.user) {
      console.log('✅ Login successful, loading profile...');
      await this.loadUserProfile(data.user);
    }
  }

  /** Creates a new account. */
  async signup(displayName: string, email: string, password: string): Promise<void> {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    console.log('📝 Creating account for:', email);

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
      console.error('❌ Signup error:', {
        code: error.status,
        message: error.message,
        name: error.name
      });
      throw error;
    }

    if (data.user) {
      console.log('✅ Auth account created, loading/creating profile...');
      await this.loadUserProfile(data.user);
    }
  }

  /** Creates a guest session. */
  async loginAsGuest(): Promise<void> {
    const guestEmail = `guest_${Date.now()}@guest.pollapp.com`;
    const guestPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${Date.now()}`;

    console.log('🎭 Creating guest account:', guestEmail);

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
      console.error('❌ Guest signup error:', {
        code: error.status,
        message: error.message,
        name: error.name
      });
      throw error;
    }

    if (data.user) {
      console.log('✅ Guest account created, loading profile...');
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
