/**
 * Base service for Supabase client initialization.
 * Provides type-safe access to Supabase database.
 * 
 * @example
 * const supabase = inject(SupabaseService);
 * const surveys = await supabase.from('surveys').select('*');
 */

import { Injectable } from '@angular/core';
import { 
  createClient, 
  SupabaseClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload
} from '@supabase/supabase-js';

import { environment } from '../../../../environments/environment';
import type { Database } from '../../models/database.types';

type VoteRow = Database['public']['Tables']['votes']['Row'];

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

  /**
   * Subscribes to vote changes for a specific survey.
   * Calls callback on INSERT, UPDATE, or DELETE events.
   */
  subscribeToVotes(
    surveyId: string,
    callback: (payload: RealtimePostgresChangesPayload<VoteRow>) => void
  ): RealtimeChannel {
    const channel = this.supabase
      .channel(`votes:survey_id=eq.${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `survey_id=eq.${surveyId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribes from a realtime channel.
   */
  unsubscribe(channel: RealtimeChannel): void {
    this.supabase.removeChannel(channel);
  }
}
