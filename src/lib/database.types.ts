export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          pseudo: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          pseudo: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pseudo?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      movies: {
        Row: {
          id: string
          title: string
          tmdb_id: string | null
          poster_url: string | null
          release_date: string | null
          status: 'picking_days' | 'picking_times' | 'closed'
          final_showtime_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          tmdb_id?: string | null
          poster_url?: string | null
          release_date?: string | null
          status?: 'picking_days' | 'picking_times' | 'closed'
          final_showtime_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          tmdb_id?: string | null
          poster_url?: string | null
          release_date?: string | null
          status?: 'picking_days' | 'picking_times' | 'closed'
          final_showtime_id?: string | null
          created_at?: string
        }
      }
      available_days: {
        Row: {
          id: string
          movie_id: string
          date: string
        }
        Insert: {
          id?: string
          movie_id: string
          date: string
        }
        Update: {
          id?: string
          movie_id?: string
          date?: string
        }
      }
      day_votes: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          date: string
          available: boolean
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          date: string
          available: boolean
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          date?: string
          available?: boolean
        }
      }
      showtimes: {
        Row: {
          id: string
          movie_id: string
          datetime: string
        }
        Insert: {
          id?: string
          movie_id: string
          datetime: string
        }
        Update: {
          id?: string
          movie_id?: string
          datetime?: string
        }
      }
      time_votes: {
        Row: {
          id: string
          user_id: string
          showtime_id: string
          available: boolean
        }
        Insert: {
          id?: string
          user_id: string
          showtime_id: string
          available: boolean
        }
        Update: {
          id?: string
          user_id?: string
          showtime_id?: string
          available?: boolean
        }
      }
    }
  }
}
