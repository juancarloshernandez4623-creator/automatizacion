/**
 * Tipos de la base de datos, escritos a mano.
 *
 * Normalmente este archivo se generaria con `supabase gen types typescript`,
 * pero el entorno donde se escribio este proyecto no tenia Node.js ni la
 * Supabase CLI instalados. Este archivo replica EXACTAMENTE el esquema de
 * `/supabase/migrations/*.sql` (columnas, nullability, defaults y
 * constraints `check`). Si cambias una migracion, actualiza este archivo a
 * mano en el mismo commit.
 *
 * La forma sigue el contrato que espera `createClient<Database>()` /
 * `createServerClient<Database>()` de @supabase/supabase-js y @supabase/ssr.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string | null;
          role: "owner" | "staff";
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          full_name?: string | null;
          role?: "owner" | "staff";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          full_name?: string | null;
          role?: "owner" | "staff";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_configs: {
        Row: {
          organization_id: string;
          phone_number_id: string;
          waba_id: string;
          access_token_encrypted: string;
          verify_token: string;
          app_secret_encrypted: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          phone_number_id: string;
          waba_id: string;
          access_token_encrypted: string;
          verify_token: string;
          app_secret_encrypted: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          phone_number_id?: string;
          waba_id?: string;
          access_token_encrypted?: string;
          verify_token?: string;
          app_secret_encrypted?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      google_calendar_configs: {
        Row: {
          organization_id: string;
          calendar_id: string;
          refresh_token_encrypted: string;
          access_token_encrypted: string | null;
          token_expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          calendar_id: string;
          refresh_token_encrypted: string;
          access_token_encrypted?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          calendar_id?: string;
          refresh_token_encrypted?: string;
          access_token_encrypted?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_calendar_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_configs: {
        Row: {
          organization_id: string;
          system_prompt: string;
          tone: string;
          business_info: Json;
          services: Json;
          business_hours: Json;
          handoff_message: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          system_prompt: string;
          tone?: string;
          business_info?: Json;
          services?: Json;
          business_hours?: Json;
          handoff_message?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          system_prompt?: string;
          tone?: string;
          business_info?: Json;
          services?: Json;
          business_hours?: Json;
          handoff_message?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          wa_phone: string;
          full_name: string | null;
          is_new_patient: boolean | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          wa_phone: string;
          full_name?: string | null;
          is_new_patient?: boolean | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          wa_phone?: string;
          full_name?: string | null;
          is_new_patient?: boolean | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          bot_active: boolean;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id: string;
          bot_active?: boolean;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string;
          bot_active?: boolean;
          last_message_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          wa_message_id: string | null;
          direction: "inbound" | "outbound";
          sender: "contact" | "bot" | "human";
          content: string | null;
          raw: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          organization_id: string;
          wa_message_id?: string | null;
          direction: "inbound" | "outbound";
          sender: "contact" | "bot" | "human";
          content?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          organization_id?: string;
          wa_message_id?: string | null;
          direction?: "inbound" | "outbound";
          sender?: "contact" | "bot" | "human";
          content?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          service: string;
          starts_at: string;
          ends_at: string;
          google_event_id: string | null;
          status: "confirmed" | "cancelled" | "completed";
          is_new_patient: boolean | null;
          full_name: string;
          phone: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id: string;
          service: string;
          starts_at: string;
          ends_at: string;
          google_event_id?: string | null;
          status?: "confirmed" | "cancelled" | "completed";
          is_new_patient?: boolean | null;
          full_name: string;
          phone: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string;
          service?: string;
          starts_at?: string;
          ends_at?: string;
          google_event_id?: string | null;
          status?: "confirmed" | "cancelled" | "completed";
          is_new_patient?: boolean | null;
          full_name?: string;
          phone?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// -----------------------------------------------------------------------
// Helpers de conveniencia (patron estandar de supabase-js para acceder a
// Row/Insert/Update sin repetir el path completo de Database["public"]...).
// -----------------------------------------------------------------------
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
