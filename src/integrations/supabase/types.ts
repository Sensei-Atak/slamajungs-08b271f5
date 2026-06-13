export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          duration_seconds: number
          id: string
          last_seen_at: string
          started_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number
          id?: string
          last_seen_at?: string
          started_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number
          id?: string
          last_seen_at?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          user_id?: string
        }
        Relationships: []
      }
      game_rosters: {
        Row: {
          created_at: string
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rosters_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          date: string
          game_time: string | null
          id: string
          is_home_game: boolean
          location: string | null
          meeting_time: string | null
          opponent: string
          quarter_scores: Json
          score_away: number
          score_home: number
          status: string
        }
        Insert: {
          created_at?: string
          date: string
          game_time?: string | null
          id?: string
          is_home_game?: boolean
          location?: string | null
          meeting_time?: string | null
          opponent: string
          quarter_scores?: Json
          score_away?: number
          score_home?: number
          status?: string
        }
        Update: {
          created_at?: string
          date?: string
          game_time?: string | null
          id?: string
          is_home_game?: boolean
          location?: string | null
          meeting_time?: string | null
          opponent?: string
          quarter_scores?: Json
          score_away?: number
          score_home?: number
          status?: string
        }
        Relationships: []
      }
      hangout_details: {
        Row: {
          date: string
          id: string
          location: string
          post_id: string
          time: string
        }
        Insert: {
          date: string
          id?: string
          location: string
          post_id: string
          time: string
        }
        Update: {
          date?: string
          id?: string
          location?: string
          post_id?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "hangout_details_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      hangout_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hangout_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_ratings: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_ratings_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_meal_winners: {
        Row: {
          created_at: string
          id: string
          month: string
          player_id: string
          player_name: string
          win_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          player_id: string
          player_name: string
          win_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          player_id?: string
          player_name?: string
          win_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          id: string
          player_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          status?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          ast: number
          blk: number
          fouls: number
          fw_attempted: number
          fw_made: number
          game_id: string
          id: string
          player_id: string
          pts_override: number | null
          reb: number
          stl: number
          threep_attempted: number
          threep_made: number
          to_count: number
          twop_attempted: number
          twop_made: number
        }
        Insert: {
          ast?: number
          blk?: number
          fouls?: number
          fw_attempted?: number
          fw_made?: number
          game_id: string
          id?: string
          player_id: string
          pts_override?: number | null
          reb?: number
          stl?: number
          threep_attempted?: number
          threep_made?: number
          to_count?: number
          twop_attempted?: number
          twop_made?: number
        }
        Update: {
          ast?: number
          blk?: number
          fouls?: number
          fw_attempted?: number
          fw_made?: number
          game_id?: string
          id?: string
          player_id?: string
          pts_override?: number | null
          reb?: number
          stl?: number
          threep_attempted?: number
          threep_made?: number
          to_count?: number
          twop_attempted?: number
          twop_made?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          is_guest: boolean
          jersey_number: number | null
          must_change_password: boolean
          name: string
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          is_guest?: boolean
          jersey_number?: number | null
          must_change_password?: boolean
          name: string
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_guest?: boolean
          jersey_number?: number | null
          must_change_password?: boolean
          name?: string
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          id: string
          player_id: string
          submitted_at: string
          task_id: string
          video_url: string
        }
        Insert: {
          id?: string
          player_id: string
          submitted_at?: string
          task_id: string
          video_url: string
        }
        Update: {
          id?: string
          player_id?: string
          submitted_at?: string
          task_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_watch_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          player_id: string
          task_id: string
          total_seconds: number
          updated_at: string
          watched_seconds: Json
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          player_id: string
          task_id: string
          total_seconds?: number
          updated_at?: string
          watched_seconds?: Json
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          player_id?: string
          task_id?: string
          total_seconds?: number
          updated_at?: string
          watched_seconds?: Json
        }
        Relationships: [
          {
            foreignKeyName: "task_watch_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_closed: boolean
          link_url: string | null
          pdf_url: string | null
          photo_url: string | null
          requires_watch: boolean
          title: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_closed?: boolean
          link_url?: string | null
          pdf_url?: string | null
          photo_url?: string | null
          requires_watch?: boolean
          title: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_closed?: boolean
          link_url?: string | null
          pdf_url?: string | null
          photo_url?: string | null
          requires_watch?: boolean
          title?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: { Args: { p_username: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_coach: { Args: { _user_id: string }; Returns: boolean }
      must_change_password: { Args: { _user_id: string }; Returns: boolean }
      verify_invite_code: { Args: { code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "coach" | "spieler"
      post_type: "meal" | "hangout" | "photo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coach", "spieler"],
      post_type: ["meal", "hangout", "photo"],
    },
  },
} as const
