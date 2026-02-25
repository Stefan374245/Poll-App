/**
 * Database types for Supabase.
 * This file should be auto-generated using: supabase gen types typescript
 * 
 * Command: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/app/core/models/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          is_guest: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          is_guest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          is_guest?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          creator_id: string;
          deadline: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: string;
          creator_id: string;
          deadline?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          deadline?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'surveys_creator_id_fkey';
            columns: ['creator_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      questions: {
        Row: {
          id: string;
          survey_id: string;
          text: string;
          allow_multiple: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          text: string;
          allow_multiple?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          text?: string;
          allow_multiple?: boolean;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_survey_id_fkey';
            columns: ['survey_id'];
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          }
        ];
      };
      options: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'options_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          }
        ];
      };
      votes: {
        Row: {
          id: string;
          survey_id: string;
          question_id: string;
          option_id: string;
          user_id: string;
          voted_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          question_id: string;
          option_id: string;
          user_id: string;
          voted_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          question_id?: string;
          option_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_survey_id_fkey';
            columns: ['survey_id'];
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_option_id_fkey';
            columns: ['option_id'];
            referencedRelation: 'options';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      survey_statistics: {
        Row: {
          survey_id: string;
          total_participants: number;
          total_votes: number;
          last_vote_at: string | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
