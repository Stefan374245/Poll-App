/**
 * Base service for Supabase client initialization.
 * Provides type-safe access to Supabase database.
 * 
 * @example
 * const supabase = inject(SupabaseService);
 * const surveys = await supabase.from('surveys').select('*');
 */

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../../environments/environment';
import type { Database } from '../../models/database.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = this.initializeClient();
  }

  /**
   * Gets the Supabase client instance.
   */
  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Initializes Supabase client with environment configuration.
   */
  private initializeClient(): SupabaseClient<Database> {
    return createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true
        }
      }
    );
  }

  /**
   * Gets a type-safe table reference.
   */
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return this.supabase.from(table);
  }

  /**
   * Gets authentication instance.
   */
  get auth() {
    return this.supabase.auth;
  }

  /**
   * Gets realtime instance.
   */
  get realtime() {
    return this.supabase.realtime;
  }
}
