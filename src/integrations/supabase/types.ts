export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tb_agents: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          telefono?: string | null
        }
        Relationships: []
      }
      tb_conversations: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          id: string
          instagram_page_id: string | null
          instagram_user_id: string
          instagram_username: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          instagram_page_id?: string | null
          instagram_user_id: string
          instagram_username?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          instagram_page_id?: string | null
          instagram_user_id?: string
          instagram_username?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tb_conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "tb_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          instagram_message_id: string | null
          metadata: Json | null
          responded_by_agent_id: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          instagram_message_id?: string | null
          metadata?: Json | null
          responded_by_agent_id?: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          instagram_message_id?: string | null
          metadata?: Json | null
          responded_by_agent_id?: string | null
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "tb_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tb_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tb_messages_responded_by_agent_id_fkey"
            columns: ["responded_by_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tb_queue_messages: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: number
          message_id: string | null
          text: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: number
          message_id?: string | null
          text?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: number
          message_id?: string | null
          text?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "admin" | "agent"
      conversation_status:
        | "active_ai"
        | "active_human"
        | "closed"
        | "pending_human"
      message_sender_role: "user" | "ai" | "agent"
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
      app_role: ["admin", "agent"],
      conversation_status: [
        "active_ai",
        "active_human",
        "closed",
        "pending_human",
      ],
      message_sender_role: ["user", "ai", "agent"],
    },
  },
} as const
