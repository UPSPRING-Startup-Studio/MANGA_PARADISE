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
      association_contacts: {
        Row: {
          address: string | null
          association_id: string
          city: string | null
          contact_type: Database["public"]["Enums"]["association_contact_type"]
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contacted: string | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          social_links: Json
          tags: string[]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          association_id: string
          city?: string | null
          contact_type?: Database["public"]["Enums"]["association_contact_type"]
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          social_links?: Json
          tags?: string[]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          association_id?: string
          city?: string | null
          contact_type?: Database["public"]["Enums"]["association_contact_type"]
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          social_links?: Json
          tags?: string[]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_contacts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_documents: {
        Row: {
          association_id: string
          category: string
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["association_document_status"]
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          association_id: string
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["association_document_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["association_document_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_documents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_documents_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_documents_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_fiche_config: {
        Row: {
          association_id: string
          charter_rules: Json
          created_at: string
          featured_document_ids: string[]
          id: string
          mission: string | null
          president_message: string | null
          president_name: string | null
          president_photo: string | null
          president_title: string | null
          sections_visibility: Json
          team_visible_roles: string[]
          updated_at: string
          updated_by: string | null
          values: string | null
          vision: string | null
        }
        Insert: {
          association_id: string
          charter_rules?: Json
          created_at?: string
          featured_document_ids?: string[]
          id?: string
          mission?: string | null
          president_message?: string | null
          president_name?: string | null
          president_photo?: string | null
          president_title?: string | null
          sections_visibility?: Json
          team_visible_roles?: string[]
          updated_at?: string
          updated_by?: string | null
          values?: string | null
          vision?: string | null
        }
        Update: {
          association_id?: string
          charter_rules?: Json
          created_at?: string
          featured_document_ids?: string[]
          id?: string
          mission?: string | null
          president_message?: string | null
          president_name?: string | null
          president_photo?: string | null
          president_title?: string | null
          sections_visibility?: Json
          team_visible_roles?: string[]
          updated_at?: string
          updated_by?: string | null
          values?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_fiche_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: true
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_fiche_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_fiche_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_invitations: {
        Row: {
          accepted_at: string | null
          association_id: string
          cancelled_at: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          id: string
          invited_by: string
          invited_user_id: string | null
          message: string | null
          nom: string | null
          phone: string | null
          prenom: string | null
          responded_at: string | null
          role: Database["public"]["Enums"]["association_role"]
          sent_at: string | null
          status: Database["public"]["Enums"]["association_invitation_status"]
          token: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          association_id: string
          cancelled_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          invited_by: string
          invited_user_id?: string | null
          message?: string | null
          nom?: string | null
          phone?: string | null
          prenom?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["association_role"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["association_invitation_status"]
          token?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          association_id?: string
          cancelled_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string | null
          message?: string | null
          nom?: string | null
          phone?: string | null
          prenom?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["association_role"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["association_invitation_status"]
          token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_invitations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_memberships: {
        Row: {
          association_id: string
          availability: Json
          belonging_status: string
          consent_photo: boolean
          created_at: string
          display_order: number
          engagement_level: string
          id: string
          interests: string[]
          is_active: boolean
          is_primary: boolean
          joined_at: string
          languages: string[]
          left_at: string | null
          mandate_end: string | null
          mandate_start: string | null
          membership_status: string
          notes: string | null
          participation_preferences: string[]
          public_visibility: boolean
          role: Database["public"]["Enums"]["association_role"]
          skills: string[]
          title: string | null
          updated_at: string
          user_id: string
          volunteer_experience: string
        }
        Insert: {
          association_id: string
          availability?: Json
          belonging_status?: string
          consent_photo?: boolean
          created_at?: string
          display_order?: number
          engagement_level?: string
          id?: string
          interests?: string[]
          is_active?: boolean
          is_primary?: boolean
          joined_at?: string
          languages?: string[]
          left_at?: string | null
          mandate_end?: string | null
          mandate_start?: string | null
          membership_status?: string
          notes?: string | null
          participation_preferences?: string[]
          public_visibility?: boolean
          role?: Database["public"]["Enums"]["association_role"]
          skills?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
          volunteer_experience?: string
        }
        Update: {
          association_id?: string
          availability?: Json
          belonging_status?: string
          consent_photo?: boolean
          created_at?: string
          display_order?: number
          engagement_level?: string
          id?: string
          interests?: string[]
          is_active?: boolean
          is_primary?: boolean
          joined_at?: string
          languages?: string[]
          left_at?: string | null
          mandate_end?: string | null
          mandate_start?: string | null
          membership_status?: string
          notes?: string | null
          participation_preferences?: string[]
          public_visibility?: boolean
          role?: Database["public"]["Enums"]["association_role"]
          skills?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
          volunteer_experience?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_memberships_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          address: string | null
          admin_notes: string | null
          admin_status: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at: string | null
          admin_status_changed_by: string | null
          admin_status_reason: string | null
          association_type: string | null
          banner_url: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          discord_url: string | null
          email: string | null
          founded_at: string | null
          id: string
          instagram_url: string | null
          is_public: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          rna_number: string | null
          short_description: string | null
          siret: string | null
          slug: string
          social_links: Json
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_status_reason?: string | null
          association_type?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          discord_url?: string | null
          email?: string | null
          founded_at?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          rna_number?: string | null
          short_description?: string | null
          siret?: string | null
          slug: string
          social_links?: Json
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_status_reason?: string | null
          association_type?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          discord_url?: string | null
          email?: string | null
          founded_at?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          rna_number?: string | null
          short_description?: string | null
          siret?: string | null
          slug?: string
          social_links?: Json
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "associations_admin_status_changed_by_fkey"
            columns: ["admin_status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_admin_status_changed_by_fkey"
            columns: ["admin_status_changed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          otk_reward: number | null
          rarity: string | null
          xp_reward: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          otk_reward?: number | null
          rarity?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          otk_reward?: number | null
          rarity?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          related_id: string | null
          type: Database["public"]["Enums"]["chat_room_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          related_id?: string | null
          type: Database["public"]["Enums"]["chat_room_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          related_id?: string | null
          type?: Database["public"]["Enums"]["chat_room_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contest_registrations: {
        Row: {
          activity_id: string | null
          admin_notes: string | null
          audio_file_url: string | null
          character_name: string
          cosplay_id: string | null
          created_at: string
          event_id: string
          format: Database["public"]["Enums"]["contest_format"]
          group_name: string | null
          guardian_consent: boolean
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          is_minor: boolean
          judging_time: string | null
          lighting_needs: Json
          media_link: string | null
          media_type: Database["public"]["Enums"]["contest_media_type"]
          passage_order: number | null
          passage_time: string | null
          props_needs: string | null
          ref_image_url: string | null
          status: Database["public"]["Enums"]["contest_registration_status"]
          universe: string | null
          updated_at: string
          user_id: string
          wip_image_url: string | null
        }
        Insert: {
          activity_id?: string | null
          admin_notes?: string | null
          audio_file_url?: string | null
          character_name: string
          cosplay_id?: string | null
          created_at?: string
          event_id: string
          format: Database["public"]["Enums"]["contest_format"]
          group_name?: string | null
          guardian_consent?: boolean
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_minor?: boolean
          judging_time?: string | null
          lighting_needs?: Json
          media_link?: string | null
          media_type?: Database["public"]["Enums"]["contest_media_type"]
          passage_order?: number | null
          passage_time?: string | null
          props_needs?: string | null
          ref_image_url?: string | null
          status?: Database["public"]["Enums"]["contest_registration_status"]
          universe?: string | null
          updated_at?: string
          user_id: string
          wip_image_url?: string | null
        }
        Update: {
          activity_id?: string | null
          admin_notes?: string | null
          audio_file_url?: string | null
          character_name?: string
          cosplay_id?: string | null
          created_at?: string
          event_id?: string
          format?: Database["public"]["Enums"]["contest_format"]
          group_name?: string | null
          guardian_consent?: boolean
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_minor?: boolean
          judging_time?: string | null
          lighting_needs?: Json
          media_link?: string | null
          media_type?: Database["public"]["Enums"]["contest_media_type"]
          passage_order?: number | null
          passage_time?: string | null
          props_needs?: string | null
          ref_image_url?: string | null
          status?: Database["public"]["Enums"]["contest_registration_status"]
          universe?: string | null
          updated_at?: string
          user_id?: string
          wip_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_registrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "event_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_registrations_cosplay_id_fkey"
            columns: ["cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplan_reactions: {
        Row: {
          cosplay_plan_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          cosplay_plan_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          cosplay_plan_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplan_reactions_cosplay_plan_id_fkey"
            columns: ["cosplay_plan_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplan_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplan_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_achievements: {
        Row: {
          award_title: string
          contest_name: string
          created_at: string
          event_date: string
          id: string
          proof_image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          award_title: string
          contest_name: string
          created_at?: string
          event_date: string
          id?: string
          proof_image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          award_title?: string
          contest_name?: string
          created_at?: string
          event_date?: string
          id?: string
          proof_image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_achievements_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_achievements_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cosplay_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_lineups: {
        Row: {
          cosplay_id: string | null
          created_at: string
          event_date: string
          event_id: string
          id: string
          slot_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cosplay_id?: string | null
          created_at?: string
          event_date: string
          event_id: string
          id?: string
          slot_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cosplay_id?: string | null
          created_at?: string
          event_date?: string
          event_id?: string
          id?: string
          slot_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_lineups_cosplay_id_fkey"
            columns: ["cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_lineups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_photo_tags: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          linked_cosplay_id: string | null
          notified_at: string | null
          photo_id: string
          pin_x: number
          pin_y: number
          status: string
          tagged_character: string | null
          tagged_name: string | null
          tagged_social_link: string | null
          tagged_user_id: string | null
          tagger_user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          linked_cosplay_id?: string | null
          notified_at?: string | null
          photo_id: string
          pin_x: number
          pin_y: number
          status?: string
          tagged_character?: string | null
          tagged_name?: string | null
          tagged_social_link?: string | null
          tagged_user_id?: string | null
          tagger_user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          linked_cosplay_id?: string | null
          notified_at?: string | null
          photo_id?: string
          pin_x?: number
          pin_y?: number
          status?: string
          tagged_character?: string | null
          tagged_name?: string | null
          tagged_social_link?: string | null
          tagged_user_id?: string | null
          tagger_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_photo_tags_linked_cosplay_id_fkey"
            columns: ["linked_cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "cosplay_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photo_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photo_tags_tagged_user_id_fkey"
            columns: ["tagged_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photo_tags_tagger_user_id_fkey"
            columns: ["tagger_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photo_tags_tagger_user_id_fkey"
            columns: ["tagger_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_photos: {
        Row: {
          activity_id: string | null
          caption: string | null
          cosplay_id: string
          created_at: string
          event_date_manual: string | null
          event_id: string | null
          event_location_manual: string | null
          event_name_manual: string | null
          exif_date: string | null
          exif_gps_lat: number | null
          exif_gps_lng: number | null
          id: string
          is_group_photo: boolean
          is_showcase: boolean
          photo_type: string
          photo_url: string
          shot_date: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          caption?: string | null
          cosplay_id: string
          created_at?: string
          event_date_manual?: string | null
          event_id?: string | null
          event_location_manual?: string | null
          event_name_manual?: string | null
          exif_date?: string | null
          exif_gps_lat?: number | null
          exif_gps_lng?: number | null
          id?: string
          is_group_photo?: boolean
          is_showcase?: boolean
          photo_type?: string
          photo_url: string
          shot_date?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          caption?: string | null
          cosplay_id?: string
          created_at?: string
          event_date_manual?: string | null
          event_id?: string | null
          event_location_manual?: string | null
          event_name_manual?: string | null
          exif_date?: string | null
          exif_gps_lat?: number | null
          exif_gps_lng?: number | null
          id?: string
          is_group_photo?: boolean
          is_showcase?: boolean
          photo_type?: string
          photo_url?: string
          shot_date?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "event_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photos_cosplay_id_fkey"
            columns: ["cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_plan_tasks: {
        Row: {
          category: string
          created_at: string
          id: string
          is_done: boolean
          label: string
          plan_id: string
          price: number | null
          status: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_done?: boolean
          label: string
          plan_id: string
          price?: number | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_done?: boolean
          label?: string
          plan_id?: string
          price?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_plans: {
        Row: {
          auto_progress: boolean
          budget: number | null
          character_name: string
          completed_at: string | null
          craft_type: string | null
          created_at: string
          deadline: string | null
          folder_id: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_in_wardrobe: boolean
          notes: string | null
          official_image_url: string | null
          priority: number
          progress_level: number
          status: Database["public"]["Enums"]["cosplan_status"]
          target_event_id: string | null
          target_year: number
          universe: string
          updated_at: string
          user_id: string
          user_image_url: string | null
        }
        Insert: {
          auto_progress?: boolean
          budget?: number | null
          character_name: string
          completed_at?: string | null
          craft_type?: string | null
          created_at?: string
          deadline?: string | null
          folder_id?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_in_wardrobe?: boolean
          notes?: string | null
          official_image_url?: string | null
          priority?: number
          progress_level?: number
          status?: Database["public"]["Enums"]["cosplan_status"]
          target_event_id?: string | null
          target_year?: number
          universe: string
          updated_at?: string
          user_id: string
          user_image_url?: string | null
        }
        Update: {
          auto_progress?: boolean
          budget?: number | null
          character_name?: string
          completed_at?: string | null
          craft_type?: string | null
          created_at?: string
          deadline?: string | null
          folder_id?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_in_wardrobe?: boolean
          notes?: string | null
          official_image_url?: string | null
          priority?: number
          progress_level?: number
          status?: Database["public"]["Enums"]["cosplan_status"]
          target_event_id?: string | null
          target_year?: number
          universe?: string
          updated_at?: string
          user_id?: string
          user_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_plans_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "cosplay_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_plans_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_showcase_photos: {
        Row: {
          caption: string | null
          cosplay_plan_id: string
          created_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          cosplay_plan_id: string
          created_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          cosplay_plan_id?: string
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_showcase_photos_cosplay_plan_id_fkey"
            columns: ["cosplay_plan_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_showcase_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_showcase_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_contest_config: {
        Row: {
          allow_lights: boolean
          allow_props: boolean
          allowed_formats: Json
          contest_type: string
          created_at: string
          dressing_info: string | null
          event_id: string
          id: string
          is_open: boolean
          judging_criteria: Json
          prejudging_time: string | null
          stage_dimensions: string | null
          updated_at: string
        }
        Insert: {
          allow_lights?: boolean
          allow_props?: boolean
          allowed_formats?: Json
          contest_type?: string
          created_at?: string
          dressing_info?: string | null
          event_id: string
          id?: string
          is_open?: boolean
          judging_criteria?: Json
          prejudging_time?: string | null
          stage_dimensions?: string | null
          updated_at?: string
        }
        Update: {
          allow_lights?: boolean
          allow_props?: boolean
          allowed_formats?: Json
          contest_type?: string
          created_at?: string
          dressing_info?: string | null
          event_id?: string
          id?: string
          is_open?: boolean
          judging_criteria?: Json
          prejudging_time?: string | null
          stage_dimensions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_contest_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cosplay_lineups: {
        Row: {
          cosplay_project_id: string | null
          created_at: string
          event_date: string
          event_id: string
          id: string
          slot_type: Database["public"]["Enums"]["cosplay_slot_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cosplay_project_id?: string | null
          created_at?: string
          event_date: string
          event_id: string
          id?: string
          slot_type?: Database["public"]["Enums"]["cosplay_slot_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cosplay_project_id?: string | null
          created_at?: string
          event_date?: string
          event_id?: string
          id?: string
          slot_type?: Database["public"]["Enums"]["cosplay_slot_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cosplay_lineups_cosplay_project_id_fkey"
            columns: ["cosplay_project_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cosplay_lineups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cosplay_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cosplay_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_encounters: {
        Row: {
          created_at: string
          encountered_user_id: string
          event_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          encountered_user_id: string
          event_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          encountered_user_id?: string
          event_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_encounters_encountered_user_id_fkey"
            columns: ["encountered_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_encounters_encountered_user_id_fkey"
            columns: ["encountered_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_encounters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_encounters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_encounters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_exhibitors: {
        Row: {
          created_at: string
          event_id: string
          id: string
          stand_description: string | null
          stand_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          stand_description?: string | null
          stand_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          stand_description?: string | null
          stand_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_exhibitors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_exhibitors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_exhibitors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_lineups: {
        Row: {
          cosplay_plan_id: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          cosplay_plan_id: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          cosplay_plan_id?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_lineups_cosplay_plan_id_fkey"
            columns: ["cosplay_plan_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_memories: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_memory_photos: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_memory_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memory_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memory_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          attendance_dates: Json | null
          attendance_details: Json | null
          checked_in_at: string | null
          cosplay_data: Json | null
          cosplay_id: string | null
          event_id: string
          id: string
          is_present: boolean
          registered_at: string
          role: string
          universe: string | null
          user_id: string
        }
        Insert: {
          attendance_dates?: Json | null
          attendance_details?: Json | null
          checked_in_at?: string | null
          cosplay_data?: Json | null
          cosplay_id?: string | null
          event_id: string
          id?: string
          is_present?: boolean
          registered_at?: string
          role?: string
          universe?: string | null
          user_id: string
        }
        Update: {
          attendance_dates?: Json | null
          attendance_details?: Json | null
          checked_in_at?: string | null
          cosplay_data?: Json | null
          cosplay_id?: string | null
          event_id?: string
          id?: string
          is_present?: boolean
          registered_at?: string
          role?: string
          universe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_parties: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          event_id: string
          id: string
          max_members: number | null
          mode: Database["public"]["Enums"]["party_mode"]
          name: string
          slots: Json | null
          tags: string[] | null
          updated_at: string
          visibility: Database["public"]["Enums"]["party_visibility"]
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          event_id: string
          id?: string
          max_members?: number | null
          mode?: Database["public"]["Enums"]["party_mode"]
          name: string
          slots?: Json | null
          tags?: string[] | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["party_visibility"]
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          event_id?: string
          id?: string
          max_members?: number | null
          mode?: Database["public"]["Enums"]["party_mode"]
          name?: string
          slots?: Json | null
          tags?: string[] | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["party_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "event_parties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_parties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_parties_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_party_members: {
        Row: {
          id: string
          joined_at: string
          party_id: string
          role: string
          slot_index: number | null
          status: Database["public"]["Enums"]["party_member_status"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          party_id: string
          role?: string
          slot_index?: number | null
          status?: Database["public"]["Enums"]["party_member_status"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          party_id?: string
          role?: string
          slot_index?: number | null
          status?: Database["public"]["Enums"]["party_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_party_members_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "event_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_party_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_party_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_proposals: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          external_link: string | null
          id: string
          image_url: string | null
          is_free: boolean
          is_organizer: boolean
          organisateur: string | null
          organizer_contact_email: string | null
          organizer_contact_first_name: string | null
          organizer_contact_last_name: string | null
          organizer_contact_phone: string | null
          organizer_contact_role: string | null
          published_event_id: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["event_proposal_status"]
          submitted_by: string
          title: string
          type_evenement: string | null
          updated_at: string
          venue_name: string | null
          verification_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_organizer?: boolean
          organisateur?: string | null
          organizer_contact_email?: string | null
          organizer_contact_first_name?: string | null
          organizer_contact_last_name?: string | null
          organizer_contact_phone?: string | null
          organizer_contact_role?: string | null
          published_event_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_proposal_status"]
          submitted_by: string
          title: string
          type_evenement?: string | null
          updated_at?: string
          venue_name?: string | null
          verification_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_organizer?: boolean
          organisateur?: string | null
          organizer_contact_email?: string | null
          organizer_contact_first_name?: string | null
          organizer_contact_last_name?: string | null
          organizer_contact_phone?: string | null
          organizer_contact_role?: string | null
          published_event_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["event_proposal_status"]
          submitted_by?: string
          title?: string
          type_evenement?: string | null
          updated_at?: string
          venue_name?: string | null
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_proposals_published_event_id_fkey"
            columns: ["published_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_proposals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_quests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          quest_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          quest_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_quests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule: {
        Row: {
          category: string
          created_at: string
          day_date: string | null
          description: string | null
          end_time: string | null
          event_id: string
          id: string
          is_cosplay_contest: boolean
          location: string | null
          start_time: string | null
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          day_date?: string | null
          description?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          is_cosplay_contest?: boolean
          location?: string | null
          start_time?: string | null
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          day_date?: string | null
          description?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          is_cosplay_contest?: boolean
          location?: string | null
          start_time?: string | null
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          canonical_name: string
          cover_image: string | null
          created_at: string
          default_city: string | null
          default_venue: string | null
          description: string | null
          id: string
          organizer_association_id: string | null
          slug: string
          type_evenement: Database["public"]["Enums"]["event_type"] | null
          updated_at: string
        }
        Insert: {
          canonical_name: string
          cover_image?: string | null
          created_at?: string
          default_city?: string | null
          default_venue?: string | null
          description?: string | null
          id?: string
          organizer_association_id?: string | null
          slug: string
          type_evenement?: Database["public"]["Enums"]["event_type"] | null
          updated_at?: string
        }
        Update: {
          canonical_name?: string
          cover_image?: string | null
          created_at?: string
          default_city?: string | null
          default_venue?: string | null
          description?: string | null
          id?: string
          organizer_association_id?: string | null
          slug?: string
          type_evenement?: Database["public"]["Enums"]["event_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_series_organizer_association_id_fkey"
            columns: ["organizer_association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          adresse: string | null
          association_id: string | null
          category: string
          city: string | null
          coordonnees_gps: Json | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          date: string
          date_debut: string | null
          date_fin: string | null
          description: string | null
          edition_label: string | null
          end_date: string | null
          external_link: string | null
          has_contest: boolean
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          organizer_id: string | null
          organizer_type: Database["public"]["Enums"]["event_organizer_type"]
          price: string | null
          region: string | null
          schedule: Json | null
          series_id: string | null
          slug: string | null
          status: string
          ticketing_mode: string
          time: string | null
          title: string
          type_evenement: Database["public"]["Enums"]["event_type"] | null
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          adresse?: string | null
          association_id?: string | null
          category?: string
          city?: string | null
          coordonnees_gps?: Json | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          edition_label?: string | null
          end_date?: string | null
          external_link?: string | null
          has_contest?: boolean
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          organizer_type?: Database["public"]["Enums"]["event_organizer_type"]
          price?: string | null
          region?: string | null
          schedule?: Json | null
          series_id?: string | null
          slug?: string | null
          status?: string
          ticketing_mode?: string
          time?: string | null
          title: string
          type_evenement?: Database["public"]["Enums"]["event_type"] | null
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          adresse?: string | null
          association_id?: string | null
          category?: string
          city?: string | null
          coordonnees_gps?: Json | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          edition_label?: string | null
          end_date?: string | null
          external_link?: string | null
          has_contest?: boolean
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string | null
          organizer_type?: Database["public"]["Enums"]["event_organizer_type"]
          price?: string | null
          region?: string | null
          schedule?: Json | null
          series_id?: string | null
          slug?: string | null
          status?: string
          ticketing_mode?: string
          time?: string | null
          title?: string
          type_evenement?: Database["public"]["Enums"]["event_type"] | null
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          meeting_context: string | null
          meeting_event_id: string | null
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          meeting_context?: string | null
          meeting_event_id?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          meeting_context?: string | null
          meeting_event_id?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_meeting_event_id_fkey"
            columns: ["meeting_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      guild_events: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          guild_id: string
          id: string
          location_address: string | null
          location_type: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          guild_id: string
          id?: string
          location_address?: string | null
          location_type?: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          guild_id?: string
          id?: string
          location_address?: string | null
          location_type?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_invitations: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          invited_by: string
          status: Database["public"]["Enums"]["guild_invitation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          invited_by: string
          status?: Database["public"]["Enums"]["guild_invitation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          invited_by?: string
          status?: Database["public"]["Enums"]["guild_invitation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_invitations_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_posts: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          guild_id: string
          id: string
          image_url: string | null
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          guild_id: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          access_type: Database["public"]["Enums"]["guild_access_type"]
          banner_url: string | null
          category_id: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          goal: string | null
          id: string
          name: string
          primary_color: string | null
          secondary_color: string | null
          status: Database["public"]["Enums"]["guild_status"]
          updated_at: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["guild_access_type"]
          banner_url?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal?: string | null
          id?: string
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          status?: Database["public"]["Enums"]["guild_status"]
          updated_at?: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["guild_access_type"]
          banner_url?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal?: string | null
          id?: string
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          status?: Database["public"]["Enums"]["guild_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "guild_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guilds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guilds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labs_ideas: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["labs_category"]
          cover_url: string
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["labs_status"]
          target_votes: number
          title: string
          updated_at: string
          votes_count: number
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["labs_category"]
          cover_url: string
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["labs_status"]
          target_votes?: number
          title: string
          updated_at?: string
          votes_count?: number
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["labs_category"]
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["labs_status"]
          target_votes?: number
          title?: string
          updated_at?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "labs_ideas_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labs_ideas_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labs_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labs_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "labs_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labs_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labs_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          min_quests: number
          monthly_rent: number
          name: string
          rank_order: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          min_quests?: number
          monthly_rent?: number
          name: string
          rank_order?: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          min_quests?: number
          monthly_rent?: number
          name?: string
          rank_order?: number
          slug?: string
        }
        Relationships: []
      }
      mangas: {
        Row: {
          cover_url: string
          created_at: string
          created_by: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mangas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mangas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_participants: {
        Row: {
          id: string
          joined_at: string
          meetup_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          meetup_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          meetup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_participants_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetup_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetups: {
        Row: {
          cover_image: string | null
          created_at: string
          current_participants: number
          description: string | null
          event_id: string | null
          id: string
          location: string
          max_participants: number
          organizer_id: string
          start_time: string
          status: string
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          current_participants?: number
          description?: string | null
          event_id?: string | null
          id?: string
          location: string
          max_participants?: number
          organizer_id: string
          start_time: string
          status?: string
          theme: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          current_participants?: number
          description?: string | null
          event_id?: string | null
          id?: string
          location?: string
          max_participants?: number
          organizer_id?: string
          start_time?: string
          status?: string
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          actor_type: Database["public"]["Enums"]["membership_actor_type"]
          consent_text: string | null
          created_at: string
          field_id: string
          id: string
          label: string
          submission_id: string
          version: string | null
        }
        Insert: {
          accepted: boolean
          accepted_at?: string | null
          actor_type?: Database["public"]["Enums"]["membership_actor_type"]
          consent_text?: string | null
          created_at?: string
          field_id: string
          id?: string
          label: string
          submission_id: string
          version?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          actor_type?: Database["public"]["Enums"]["membership_actor_type"]
          consent_text?: string | null
          created_at?: string
          field_id?: string
          id?: string
          label?: string
          submission_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_consents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "membership_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_form_definitions: {
        Row: {
          association_id: string
          created_at: string
          created_by: string | null
          definition: Json
          id: string
          is_default: boolean
          name: string
          season: string | null
          slug: string
          status: Database["public"]["Enums"]["membership_form_status"]
          updated_at: string
          version: number
        }
        Insert: {
          association_id: string
          created_at?: string
          created_by?: string | null
          definition?: Json
          id?: string
          is_default?: boolean
          name: string
          season?: string | null
          slug: string
          status?: Database["public"]["Enums"]["membership_form_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          association_id?: string
          created_at?: string
          created_by?: string | null
          definition?: Json
          id?: string
          is_default?: boolean
          name?: string
          season?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["membership_form_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_form_definitions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_form_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_form_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_signatures: {
        Row: {
          actor_type: Database["public"]["Enums"]["membership_actor_type"]
          created_at: string
          field_id: string
          id: string
          signature_payload: Json | null
          signed_at: string
          signed_name: string
          submission_id: string
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["membership_actor_type"]
          created_at?: string
          field_id: string
          id?: string
          signature_payload?: Json | null
          signed_at?: string
          signed_name: string
          submission_id: string
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["membership_actor_type"]
          created_at?: string
          field_id?: string
          id?: string
          signature_payload?: Json | null
          signed_at?: string
          signed_name?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_signatures_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "membership_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_submission_answers: {
        Row: {
          created_at: string
          field_id: string
          field_type: string
          id: string
          is_visible: boolean
          step_id: string
          submission_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          field_id: string
          field_type: string
          id?: string
          is_visible?: boolean
          step_id: string
          submission_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          field_id?: string
          field_type?: string
          id?: string
          is_visible?: boolean
          step_id?: string
          submission_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "membership_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_submission_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          requested_at: string
          requested_by: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["membership_request_status"]
          submission_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          requested_at?: string
          requested_by: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          submission_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          requested_at?: string
          requested_by?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          submission_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_submission_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submission_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submission_requests_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "membership_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_submission_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          submission_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          submission_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          submission_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_submission_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submission_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submission_status_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "membership_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_submissions: {
        Row: {
          activated_at: string | null
          applicant_profile_id: string | null
          approved_at: string | null
          association_id: string
          created_at: string
          form_definition_id: string
          id: string
          internal_notes: string | null
          pathway: Database["public"]["Enums"]["membership_pathway"]
          payment_status: Database["public"]["Enums"]["membership_payment_status"]
          public_slug: string | null
          rejected_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          season: string | null
          status: Database["public"]["Enums"]["membership_submission_status"]
          submitted_at: string | null
          submitted_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          applicant_profile_id?: string | null
          approved_at?: string | null
          association_id: string
          created_at?: string
          form_definition_id: string
          id?: string
          internal_notes?: string | null
          pathway?: Database["public"]["Enums"]["membership_pathway"]
          payment_status?: Database["public"]["Enums"]["membership_payment_status"]
          public_slug?: string | null
          rejected_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season?: string | null
          status?: Database["public"]["Enums"]["membership_submission_status"]
          submitted_at?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          applicant_profile_id?: string | null
          approved_at?: string | null
          association_id?: string
          created_at?: string
          form_definition_id?: string
          id?: string
          internal_notes?: string | null
          pathway?: Database["public"]["Enums"]["membership_pathway"]
          payment_status?: Database["public"]["Enums"]["membership_payment_status"]
          public_slug?: string | null
          rejected_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season?: string | null
          status?: Database["public"]["Enums"]["membership_submission_status"]
          submitted_at?: string | null
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_submissions_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_form_definition_id_fkey"
            columns: ["form_definition_id"]
            isOneToOne: false
            referencedRelation: "membership_form_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_submissions_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_schema_fields: {
        Row: {
          applicable_poles: string[]
          applicable_types: string[]
          association_id: string | null
          conditions: Json
          created_at: string
          default_value: Json | null
          display_order: number
          field_type: string
          helper_text: string | null
          id: string
          is_active: boolean
          is_admin_only: boolean
          is_locked_after_create: boolean
          is_multi_value: boolean
          is_required: boolean
          is_system: boolean
          is_visible: boolean
          label: string
          native_column: string | null
          options: Json
          placeholder: string | null
          section_id: string
          slug: string
          updated_at: string
          validation_rules: Json
          visibility_level: string
        }
        Insert: {
          applicable_poles?: string[]
          applicable_types?: string[]
          association_id?: string | null
          conditions?: Json
          created_at?: string
          default_value?: Json | null
          display_order?: number
          field_type?: string
          helper_text?: string | null
          id?: string
          is_active?: boolean
          is_admin_only?: boolean
          is_locked_after_create?: boolean
          is_multi_value?: boolean
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          label: string
          native_column?: string | null
          options?: Json
          placeholder?: string | null
          section_id: string
          slug: string
          updated_at?: string
          validation_rules?: Json
          visibility_level?: string
        }
        Update: {
          applicable_poles?: string[]
          applicable_types?: string[]
          association_id?: string | null
          conditions?: Json
          created_at?: string
          default_value?: Json | null
          display_order?: number
          field_type?: string
          helper_text?: string | null
          id?: string
          is_active?: boolean
          is_admin_only?: boolean
          is_locked_after_create?: boolean
          is_multi_value?: boolean
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          label?: string
          native_column?: string | null
          options?: Json
          placeholder?: string | null
          section_id?: string
          slug?: string
          updated_at?: string
          validation_rules?: Json
          visibility_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_schema_fields_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_schema_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "mission_schema_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_schema_sections: {
        Row: {
          applicable_poles: string[]
          applicable_types: string[]
          association_id: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_collapsed_default: boolean
          is_required: boolean
          is_system: boolean
          is_visible: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          applicable_poles?: string[]
          applicable_types?: string[]
          association_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_collapsed_default?: boolean
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          applicable_poles?: string[]
          applicable_types?: string[]
          association_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_collapsed_default?: boolean
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_schema_sections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_link: string | null
          sender_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_link?: string | null
          sender_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_link?: string | null
          sender_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      official_animes: {
        Row: {
          cover_url: string
          created_at: string
          id: string
          studio: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url: string
          created_at?: string
          id?: string
          studio?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          id?: string
          studio?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      official_mangas: {
        Row: {
          author: string | null
          cover_url: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          cover_url: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          cover_url?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      otaku_library: {
        Row: {
          cover_url: string
          created_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          cover_url: string
          created_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otaku_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otaku_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otk_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otk_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otk_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      party_invitations: {
        Row: {
          created_at: string
          id: string
          party_id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          party_id: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          party_id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_invitations_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "event_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_invitations_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_invitations_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_invitations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_invitations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: string
          comments_count: number
          content: string | null
          content_type: string
          created_at: string
          id: string
          is_pinned: boolean
          likes_count: number
          media_url: string | null
          post_type: string | null
          related_cosplay_id: string | null
          related_event_id: string | null
          tagged_photographer_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          comments_count?: number
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          media_url?: string | null
          post_type?: string | null
          related_cosplay_id?: string | null
          related_event_id?: string | null
          tagged_photographer_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          comments_count?: number
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          media_url?: string | null
          post_type?: string | null
          related_cosplay_id?: string | null
          related_event_id?: string | null
          tagged_photographer_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_related_cosplay_id_fkey"
            columns: ["related_cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tagged_photographer_id_fkey"
            columns: ["tagged_photographer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tagged_photographer_id_fkey"
            columns: ["tagged_photographer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_partner_applications: {
        Row: {
          company_name: string
          company_type: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          message: string | null
          partner_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          siret: string | null
          social_links: Json
          status: string
          submitted_by: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          company_name: string
          company_type?: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message?: string | null
          partner_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          siret?: string | null
          social_links?: Json
          status?: string
          submitted_by?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          company_name?: string
          company_type?: string
          contact_email?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message?: string | null
          partner_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          siret?: string | null
          social_links?: Json
          status?: string
          submitted_by?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_partner_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pro_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_applications_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_partner_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          left_at: string | null
          membership_status: string
          notes: string | null
          partner_id: string
          role: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          membership_status?: string
          notes?: string | null
          partner_id: string
          role?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          membership_status?: string
          notes?: string | null
          partner_id?: string
          role?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_partner_members_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pro_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partner_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_partners: {
        Row: {
          address: string | null
          admin_notes: string | null
          admin_status: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at: string | null
          admin_status_changed_by: string | null
          admin_status_reason: string | null
          banner_url: string | null
          city: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          description_long: string | null
          directory_category: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_featured: boolean
          is_public: boolean
          linkedin_url: string | null
          logo_url: string | null
          member_benefit: string | null
          mp_offers: string | null
          name: string
          partner_offers: string | null
          partner_status: string
          phone: string | null
          postal_code: string | null
          region: string | null
          siret: string | null
          slug: string
          social_links: Json
          source_import: string | null
          status: string
          subcategories: string[]
          tiktok_url: string | null
          twitter_url: string | null
          type: string
          updated_at: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_status_reason?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          description_long?: string | null
          directory_category?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          member_benefit?: string | null
          mp_offers?: string | null
          name: string
          partner_offers?: string | null
          partner_status?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          siret?: string | null
          slug: string
          social_links?: Json
          source_import?: string | null
          status?: string
          subcategories?: string[]
          tiktok_url?: string | null
          twitter_url?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["admin_status"]
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_status_reason?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          description_long?: string | null
          directory_category?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          member_benefit?: string | null
          mp_offers?: string | null
          name?: string
          partner_offers?: string | null
          partner_status?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          siret?: string | null
          slug?: string
          social_links?: Json
          source_import?: string | null
          status?: string
          subcategories?: string[]
          tiktok_url?: string | null
          twitter_url?: string | null
          type?: string
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_partners_admin_status_changed_by_fkey"
            columns: ["admin_status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partners_admin_status_changed_by_fkey"
            columns: ["admin_status_changed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partners_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_partners_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_event_checkin: boolean
          avatar_url: string | null
          best_character_id: string | null
          bio: string | null
          city: string | null
          collaboration_interests: string[] | null
          cosplay_collaboration_prefs: string[] | null
          cosplay_con_crunch: string | null
          cosplay_motivation: string | null
          cosplay_nightmare: string | null
          cosplay_specialties: string[] | null
          cosplay_style: string | null
          cosplay_years_experience: string | null
          cover_image_url: string | null
          created_at: string
          creative_collaboration_types: string[] | null
          creative_commission_status: string | null
          creative_hardware_equipment: string | null
          creative_nightmare: string | null
          creative_project_habit: string | null
          creative_software_skills: string[] | null
          creative_tool_preference: string | null
          creative_workflow_vibe: string | null
          creator_domains: string[] | null
          creator_experience_level: string | null
          display_name: string | null
          favorite_activities: string[] | null
          favorite_character: string | null
          favorite_character_image: string | null
          favorite_genres: string[] | null
          favorite_manga: string | null
          first_name: string | null
          gamer_favorite_genre: string | null
          gamer_friendship_breaker: string | null
          gamer_ids: Json | null
          gamer_mobile_vice: string | null
          gamer_play_style: string | null
          gamer_rage_trigger: string | null
          gaming_platforms: string[] | null
          gender: string | null
          id: string
          image_rights_consent: boolean
          inspiration_universes: string[] | null
          is_cosplayer_mode_active: boolean
          is_creator_profile_active: boolean
          is_gamer_mode_active: boolean
          is_location_public: boolean
          is_otaku_mode_active: boolean
          is_subscription_active: boolean
          last_name: string | null
          level: number
          location_city: string | null
          location_country: string | null
          location_geo: unknown
          location_lat: number | null
          location_lng: number | null
          location_updated_at: string | null
          member_since: string | null
          membership_status: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          monthly_xp: number
          occupation_status: string | null
          onboarding_completed: boolean
          otaku_class: string | null
          otaku_con_activity: string | null
          otaku_favorite_artist: string | null
          otaku_first_manga: string | null
          otaku_japan_destination: string | null
          otaku_japan_must_buy: string | null
          otaku_social_nightmare: string | null
          otaku_stats: Json | null
          otaku_top3: Json | null
          otk_coins: number
          pinned_city: string | null
          podium_lock_states: Json | null
          privacy_settings: Json | null
          profile_visibility: string
          qr_code_token: string
          referral_count: number
          referral_year: number | null
          rules_accepted: boolean
          rules_accepted_at: string | null
          selected_pack: string | null
          social_links: Json | null
          sponsor_id: string | null
          subscription_expires_at: string | null
          total_otk_earned: number
          updated_at: string
          username: string | null
          worst_character_id: string | null
          xp: number
        }
        Insert: {
          allow_event_checkin?: boolean
          avatar_url?: string | null
          best_character_id?: string | null
          bio?: string | null
          city?: string | null
          collaboration_interests?: string[] | null
          cosplay_collaboration_prefs?: string[] | null
          cosplay_con_crunch?: string | null
          cosplay_motivation?: string | null
          cosplay_nightmare?: string | null
          cosplay_specialties?: string[] | null
          cosplay_style?: string | null
          cosplay_years_experience?: string | null
          cover_image_url?: string | null
          created_at?: string
          creative_collaboration_types?: string[] | null
          creative_commission_status?: string | null
          creative_hardware_equipment?: string | null
          creative_nightmare?: string | null
          creative_project_habit?: string | null
          creative_software_skills?: string[] | null
          creative_tool_preference?: string | null
          creative_workflow_vibe?: string | null
          creator_domains?: string[] | null
          creator_experience_level?: string | null
          display_name?: string | null
          favorite_activities?: string[] | null
          favorite_character?: string | null
          favorite_character_image?: string | null
          favorite_genres?: string[] | null
          favorite_manga?: string | null
          first_name?: string | null
          gamer_favorite_genre?: string | null
          gamer_friendship_breaker?: string | null
          gamer_ids?: Json | null
          gamer_mobile_vice?: string | null
          gamer_play_style?: string | null
          gamer_rage_trigger?: string | null
          gaming_platforms?: string[] | null
          gender?: string | null
          id: string
          image_rights_consent?: boolean
          inspiration_universes?: string[] | null
          is_cosplayer_mode_active?: boolean
          is_creator_profile_active?: boolean
          is_gamer_mode_active?: boolean
          is_location_public?: boolean
          is_otaku_mode_active?: boolean
          is_subscription_active?: boolean
          last_name?: string | null
          level?: number
          location_city?: string | null
          location_country?: string | null
          location_geo?: unknown
          location_lat?: number | null
          location_lng?: number | null
          location_updated_at?: string | null
          member_since?: string | null
          membership_status?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          monthly_xp?: number
          occupation_status?: string | null
          onboarding_completed?: boolean
          otaku_class?: string | null
          otaku_con_activity?: string | null
          otaku_favorite_artist?: string | null
          otaku_first_manga?: string | null
          otaku_japan_destination?: string | null
          otaku_japan_must_buy?: string | null
          otaku_social_nightmare?: string | null
          otaku_stats?: Json | null
          otaku_top3?: Json | null
          otk_coins?: number
          pinned_city?: string | null
          podium_lock_states?: Json | null
          privacy_settings?: Json | null
          profile_visibility?: string
          qr_code_token?: string
          referral_count?: number
          referral_year?: number | null
          rules_accepted?: boolean
          rules_accepted_at?: string | null
          selected_pack?: string | null
          social_links?: Json | null
          sponsor_id?: string | null
          subscription_expires_at?: string | null
          total_otk_earned?: number
          updated_at?: string
          username?: string | null
          worst_character_id?: string | null
          xp?: number
        }
        Update: {
          allow_event_checkin?: boolean
          avatar_url?: string | null
          best_character_id?: string | null
          bio?: string | null
          city?: string | null
          collaboration_interests?: string[] | null
          cosplay_collaboration_prefs?: string[] | null
          cosplay_con_crunch?: string | null
          cosplay_motivation?: string | null
          cosplay_nightmare?: string | null
          cosplay_specialties?: string[] | null
          cosplay_style?: string | null
          cosplay_years_experience?: string | null
          cover_image_url?: string | null
          created_at?: string
          creative_collaboration_types?: string[] | null
          creative_commission_status?: string | null
          creative_hardware_equipment?: string | null
          creative_nightmare?: string | null
          creative_project_habit?: string | null
          creative_software_skills?: string[] | null
          creative_tool_preference?: string | null
          creative_workflow_vibe?: string | null
          creator_domains?: string[] | null
          creator_experience_level?: string | null
          display_name?: string | null
          favorite_activities?: string[] | null
          favorite_character?: string | null
          favorite_character_image?: string | null
          favorite_genres?: string[] | null
          favorite_manga?: string | null
          first_name?: string | null
          gamer_favorite_genre?: string | null
          gamer_friendship_breaker?: string | null
          gamer_ids?: Json | null
          gamer_mobile_vice?: string | null
          gamer_play_style?: string | null
          gamer_rage_trigger?: string | null
          gaming_platforms?: string[] | null
          gender?: string | null
          id?: string
          image_rights_consent?: boolean
          inspiration_universes?: string[] | null
          is_cosplayer_mode_active?: boolean
          is_creator_profile_active?: boolean
          is_gamer_mode_active?: boolean
          is_location_public?: boolean
          is_otaku_mode_active?: boolean
          is_subscription_active?: boolean
          last_name?: string | null
          level?: number
          location_city?: string | null
          location_country?: string | null
          location_geo?: unknown
          location_lat?: number | null
          location_lng?: number | null
          location_updated_at?: string | null
          member_since?: string | null
          membership_status?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          monthly_xp?: number
          occupation_status?: string | null
          onboarding_completed?: boolean
          otaku_class?: string | null
          otaku_con_activity?: string | null
          otaku_favorite_artist?: string | null
          otaku_first_manga?: string | null
          otaku_japan_destination?: string | null
          otaku_japan_must_buy?: string | null
          otaku_social_nightmare?: string | null
          otaku_stats?: Json | null
          otaku_top3?: Json | null
          otk_coins?: number
          pinned_city?: string | null
          podium_lock_states?: Json | null
          privacy_settings?: Json | null
          profile_visibility?: string
          qr_code_token?: string
          referral_count?: number
          referral_year?: number | null
          rules_accepted?: boolean
          rules_accepted_at?: string | null
          selected_pack?: string | null
          social_links?: Json | null
          sponsor_id?: string | null
          subscription_expires_at?: string | null
          total_otk_earned?: number
          updated_at?: string
          username?: string | null
          worst_character_id?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_best_character_id_fkey"
            columns: ["best_character_id"]
            isOneToOne: false
            referencedRelation: "ref_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_worst_character_id_fkey"
            columns: ["worst_character_id"]
            isOneToOne: false
            referencedRelation: "ref_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_private: {
        Row: {
          birth_date: string | null
          guardian_address: string | null
          guardian_email: string | null
          guardian_first_name: string | null
          guardian_last_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          health_allergies: string | null
          health_conditions: string | null
          health_treatments: string | null
          id: string
          parental_authorization_url: string | null
          payment_method: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          guardian_address?: string | null
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          health_allergies?: string | null
          health_conditions?: string | null
          health_treatments?: string | null
          id: string
          parental_authorization_url?: string | null
          payment_method?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          guardian_address?: string | null
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          health_allergies?: string | null
          health_conditions?: string | null
          health_treatments?: string | null
          id?: string
          parental_authorization_url?: string | null
          payment_method?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_submissions: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          proof_link: string | null
          proof_text: string | null
          quest_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          proof_link?: string | null
          proof_text?: string | null
          quest_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          proof_link?: string | null
          proof_text?: string | null
          quest_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_submissions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          category: string | null
          class_requirement: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          otk_reward: number | null
          priority: string | null
          quest_type: string | null
          status: string | null
          target_count: number | null
          title: string
          validation_type: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          class_requirement?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          otk_reward?: number | null
          priority?: string | null
          quest_type?: string | null
          status?: string | null
          target_count?: number | null
          title: string
          validation_type?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          class_requirement?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          otk_reward?: number | null
          priority?: string | null
          quest_type?: string | null
          status?: string | null
          target_count?: number | null
          title?: string
          validation_type?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_characters: {
        Row: {
          created_at: string
          id: string
          name: string
          name_normalized: string | null
          official_image_url: string | null
          universe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_normalized?: string | null
          official_image_url?: string | null
          universe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_normalized?: string | null
          official_image_url?: string | null
          universe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ref_characters_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "ref_universes"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_universes: {
        Row: {
          created_at: string
          id: string
          name: string
          name_normalized: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_normalized?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_normalized?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          partner_location: string | null
          partner_name: string | null
          price: number
          stock: number | null
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          partner_location?: string | null
          partner_name?: string | null
          price: number
          stock?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          partner_location?: string | null
          partner_name?: string | null
          price?: number
          stock?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          delivery_info: Json | null
          id: string
          item_id: string | null
          quantity: number
          status: string
          total_price: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          delivery_info?: Json | null
          id?: string
          item_id?: string | null
          quantity?: number
          status?: string
          total_price: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          delivery_info?: Json | null
          id?: string
          item_id?: string | null
          quantity?: number
          status?: string
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          cosplay_plan_id: string | null
          created_at: string
          id: string
          slot_id: string | null
          squad_id: string
          status: Database["public"]["Enums"]["party_member_status"]
          user_id: string
        }
        Insert: {
          cosplay_plan_id?: string | null
          created_at?: string
          id?: string
          slot_id?: string | null
          squad_id: string
          status?: Database["public"]["Enums"]["party_member_status"]
          user_id: string
        }
        Update: {
          cosplay_plan_id?: string | null
          created_at?: string
          id?: string
          slot_id?: string | null
          squad_id?: string
          status?: Database["public"]["Enums"]["party_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_cosplay_plan_id_fkey"
            columns: ["cosplay_plan_id"]
            isOneToOne: false
            referencedRelation: "cosplay_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "squad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_slots: {
        Row: {
          created_at: string
          id: string
          requirements: string | null
          role_type: Database["public"]["Enums"]["squad_slot_role"]
          squad_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          requirements?: string | null
          role_type?: Database["public"]["Enums"]["squad_slot_role"]
          squad_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          requirements?: string | null
          role_type?: Database["public"]["Enums"]["squad_slot_role"]
          squad_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_slots_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          mode: Database["public"]["Enums"]["party_mode"]
          name: string
          target_event_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          mode?: Database["public"]["Enums"]["party_mode"]
          name: string
          target_event_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          mode?: Database["public"]["Enums"]["party_mode"]
          name?: string
          target_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squads_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          favoritable_id: string
          favoritable_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favoritable_id: string
          favoritable_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favoritable_id?: string
          favoritable_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_league_stats: {
        Row: {
          current_league_id: string | null
          id: string
          last_updated: string
          month_year: string
          quests_completed_this_month: number
          user_id: string
        }
        Insert: {
          current_league_id?: string | null
          id?: string
          last_updated?: string
          month_year?: string
          quests_completed_this_month?: number
          user_id: string
        }
        Update: {
          current_league_id?: string | null
          id?: string
          last_updated?: string
          month_year?: string
          quests_completed_this_month?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_league_stats_current_league_id_fkey"
            columns: ["current_league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_league_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_league_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          favorite_categories: string[]
          id: string
          interests: string[]
          updated_at: string
          user_id: string
          viewed_events: string[]
          viewed_products: string[]
        }
        Insert: {
          created_at?: string
          favorite_categories?: string[]
          id?: string
          interests?: string[]
          updated_at?: string
          user_id: string
          viewed_events?: string[]
          viewed_products?: string[]
        }
        Update: {
          created_at?: string
          favorite_categories?: string[]
          id?: string
          interests?: string[]
          updated_at?: string
          user_id?: string
          viewed_events?: string[]
          viewed_products?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          event_id: string | null
          id: string
          progress: number | null
          proof_url: string | null
          quest_id: string
          status: string | null
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          progress?: number | null
          proof_url?: string | null
          quest_id: string
          status?: string | null
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          progress?: number | null
          proof_url?: string | null
          quest_id?: string
          status?: string | null
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_activity_log: {
        Row: {
          association_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          points: number
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          points?: number
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_activity_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_applications: {
        Row: {
          approved_at: string | null
          association_id: string
          availability: Json
          city: string | null
          consent_photo: boolean
          created_at: string
          email: string | null
          event_id: string | null
          experience_level: string
          first_name: string | null
          id: string
          interests: string[]
          invitation_message: string | null
          invited_by: string | null
          languages: string[]
          last_name: string | null
          motivation: string | null
          onboarding_data: Json
          onboarding_step: number
          participation_preferences: string[]
          phone: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[]
          source: Database["public"]["Enums"]["volunteer_application_source"]
          status: Database["public"]["Enums"]["volunteer_application_status"]
          submitted_at: string | null
          token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          association_id: string
          availability?: Json
          city?: string | null
          consent_photo?: boolean
          created_at?: string
          email?: string | null
          event_id?: string | null
          experience_level?: string
          first_name?: string | null
          id?: string
          interests?: string[]
          invitation_message?: string | null
          invited_by?: string | null
          languages?: string[]
          last_name?: string | null
          motivation?: string | null
          onboarding_data?: Json
          onboarding_step?: number
          participation_preferences?: string[]
          phone?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          source?: Database["public"]["Enums"]["volunteer_application_source"]
          status?: Database["public"]["Enums"]["volunteer_application_status"]
          submitted_at?: string | null
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          association_id?: string
          availability?: Json
          city?: string | null
          consent_photo?: boolean
          created_at?: string
          email?: string | null
          event_id?: string | null
          experience_level?: string
          first_name?: string | null
          id?: string
          interests?: string[]
          invitation_message?: string | null
          invited_by?: string | null
          languages?: string[]
          last_name?: string | null
          motivation?: string | null
          onboarding_data?: Json
          onboarding_step?: number
          participation_preferences?: string[]
          phone?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[]
          source?: Database["public"]["Enums"]["volunteer_application_source"]
          status?: Database["public"]["Enums"]["volunteer_application_status"]
          submitted_at?: string | null
          token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          association_id: string
          cancelled_at: string | null
          checked_in_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          feedback: string | null
          id: string
          mission_id: string
          notes: string | null
          proposed_at: string | null
          proposed_by: string | null
          rating: number | null
          shift_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          mission_id: string
          notes?: string | null
          proposed_at?: string | null
          proposed_by?: string | null
          rating?: number | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          mission_id?: string
          notes?: string | null
          proposed_at?: string | null
          proposed_by?: string | null
          rating?: number | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "volunteer_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "volunteer_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_documents: {
        Row: {
          association_id: string
          created_at: string
          description: string | null
          doc_type: Database["public"]["Enums"]["volunteer_document_type"]
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["volunteer_document_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          description?: string | null
          doc_type?: Database["public"]["Enums"]["volunteer_document_type"]
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["volunteer_document_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          description?: string | null
          doc_type?: Database["public"]["Enums"]["volunteer_document_type"]
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["volunteer_document_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_documents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_messages: {
        Row: {
          association_id: string
          body: string
          created_at: string
          event_id: string | null
          id: string
          is_broadcast: boolean
          is_read: boolean
          mission_id: string | null
          msg_type: Database["public"]["Enums"]["volunteer_message_type"]
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string | null
        }
        Insert: {
          association_id: string
          body: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          mission_id?: string | null
          msg_type?: Database["public"]["Enums"]["volunteer_message_type"]
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject?: string | null
        }
        Update: {
          association_id?: string
          body?: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_broadcast?: boolean
          is_read?: boolean
          mission_id?: string | null
          msg_type?: Database["public"]["Enums"]["volunteer_message_type"]
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_messages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "volunteer_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_mission_templates: {
        Row: {
          association_id: string | null
          created_at: string
          created_by: string | null
          custom_field_values: Json
          default_values: Json
          description: string | null
          enabled_sections: string[]
          icon: string | null
          id: string
          is_active: boolean
          is_global: boolean
          mission_subtype: string | null
          mission_type: string | null
          name: string
          pole: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_field_values?: Json
          default_values?: Json
          description?: string | null
          enabled_sections?: string[]
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          mission_subtype?: string | null
          mission_type?: string | null
          name: string
          pole?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_field_values?: Json
          default_values?: Json
          description?: string | null
          enabled_sections?: string[]
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          mission_subtype?: string | null
          mission_type?: string | null
          name?: string
          pole?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_mission_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_mission_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_mission_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_missions: {
        Row: {
          application_deadline: string | null
          application_message: string | null
          application_mode: Database["public"]["Enums"]["mission_application_mode"]
          association_id: string
          autonomy_level: string | null
          break_minutes: number | null
          briefing_minutes: number | null
          briefing_required: boolean
          confirmation_deadline: string | null
          constraints_text: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          custom_data: Json
          description: string | null
          dress_code: string | null
          end_at: string | null
          equipment_provided: string[]
          equipment_required: string[]
          event_id: string | null
          id: string
          internal_checklist: Json
          is_public: boolean
          location_detail: string | null
          mission_subtype: string | null
          mission_type: string | null
          notes: string | null
          optional_skills: string[]
          perks: Json
          physical_requirements: string | null
          pole: string | null
          preparation_status: Database["public"]["Enums"]["mission_preparation_status"]
          priority: Database["public"]["Enums"]["mission_priority"]
          procedures: string | null
          required_documents: string[]
          required_experience: string
          required_interests: string[]
          required_skills: string[]
          responsible_id: string | null
          risks: string | null
          secondary_poles: string[]
          setup_start_at: string | null
          slots_filled: number
          slots_max: number | null
          slots_min: number
          slots_needed: number
          start_at: string | null
          status: Database["public"]["Enums"]["mission_status"]
          suitable_for_beginners: boolean
          suitable_for_minors: boolean
          summary: string | null
          tags: string[]
          teardown_end_at: string | null
          template_id: string | null
          title: string
          trainable_skills: string[]
          updated_at: string
          zone: string | null
        }
        Insert: {
          application_deadline?: string | null
          application_message?: string | null
          application_mode?: Database["public"]["Enums"]["mission_application_mode"]
          association_id: string
          autonomy_level?: string | null
          break_minutes?: number | null
          briefing_minutes?: number | null
          briefing_required?: boolean
          confirmation_deadline?: string | null
          constraints_text?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json
          description?: string | null
          dress_code?: string | null
          end_at?: string | null
          equipment_provided?: string[]
          equipment_required?: string[]
          event_id?: string | null
          id?: string
          internal_checklist?: Json
          is_public?: boolean
          location_detail?: string | null
          mission_subtype?: string | null
          mission_type?: string | null
          notes?: string | null
          optional_skills?: string[]
          perks?: Json
          physical_requirements?: string | null
          pole?: string | null
          preparation_status?: Database["public"]["Enums"]["mission_preparation_status"]
          priority?: Database["public"]["Enums"]["mission_priority"]
          procedures?: string | null
          required_documents?: string[]
          required_experience?: string
          required_interests?: string[]
          required_skills?: string[]
          responsible_id?: string | null
          risks?: string | null
          secondary_poles?: string[]
          setup_start_at?: string | null
          slots_filled?: number
          slots_max?: number | null
          slots_min?: number
          slots_needed?: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          suitable_for_beginners?: boolean
          suitable_for_minors?: boolean
          summary?: string | null
          tags?: string[]
          teardown_end_at?: string | null
          template_id?: string | null
          title: string
          trainable_skills?: string[]
          updated_at?: string
          zone?: string | null
        }
        Update: {
          application_deadline?: string | null
          application_message?: string | null
          application_mode?: Database["public"]["Enums"]["mission_application_mode"]
          association_id?: string
          autonomy_level?: string | null
          break_minutes?: number | null
          briefing_minutes?: number | null
          briefing_required?: boolean
          confirmation_deadline?: string | null
          constraints_text?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_data?: Json
          description?: string | null
          dress_code?: string | null
          end_at?: string | null
          equipment_provided?: string[]
          equipment_required?: string[]
          event_id?: string | null
          id?: string
          internal_checklist?: Json
          is_public?: boolean
          location_detail?: string | null
          mission_subtype?: string | null
          mission_type?: string | null
          notes?: string | null
          optional_skills?: string[]
          perks?: Json
          physical_requirements?: string | null
          pole?: string | null
          preparation_status?: Database["public"]["Enums"]["mission_preparation_status"]
          priority?: Database["public"]["Enums"]["mission_priority"]
          procedures?: string | null
          required_documents?: string[]
          required_experience?: string
          required_interests?: string[]
          required_skills?: string[]
          responsible_id?: string | null
          risks?: string | null
          secondary_poles?: string[]
          setup_start_at?: string | null
          slots_filled?: number
          slots_max?: number | null
          slots_min?: number
          slots_needed?: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          suitable_for_beginners?: boolean
          suitable_for_minors?: boolean
          summary?: string | null
          tags?: string[]
          teardown_end_at?: string | null
          template_id?: string | null
          title?: string
          trainable_skills?: string[]
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_missions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_missions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "volunteer_mission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_shifts: {
        Row: {
          created_at: string
          end_at: string
          id: string
          location: string | null
          mission_id: string
          notes: string | null
          slots_filled: number
          slots_needed: number
          start_at: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          location?: string | null
          mission_id: string
          notes?: string | null
          slots_filled?: number
          slots_needed?: number
          start_at: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          location?: string | null
          mission_id?: string
          notes?: string | null
          slots_filled?: number
          slots_needed?: number
          start_at?: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "volunteer_missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string | null
          favorite_activities: string[] | null
          favorite_character: string | null
          favorite_character_image: string | null
          favorite_genres: string[] | null
          favorite_manga: string | null
          id: string | null
          level: number | null
          otaku_class: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_activities?: string[] | null
          favorite_character?: string | null
          favorite_character_image?: string | null
          favorite_genres?: string[] | null
          favorite_manga?: string | null
          id?: string | null
          level?: number | null
          otaku_class?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_activities?: string[] | null
          favorite_character?: string | null
          favorite_character_image?: string | null
          favorite_genres?: string[] | null
          favorite_manga?: string | null
          id?: string | null
          level?: number | null
          otaku_class?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_association_invitation: {
        Args: { _invitation_id: string }
        Returns: string
      }
      activate_membership: {
        Args: { _otk_amount: number; _pack_id: string; _user_id: string }
        Returns: boolean
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_process_transaction: {
        Args: {
          _admin_id: string
          _amount: number
          _reason: string
          _target_user_id: string
          _type: string
        }
        Returns: Json
      }
      are_friends: {
        Args: { _user_id1: string; _user_id2: string }
        Returns: boolean
      }
      can_admin_membership_submission: {
        Args: { _submission_id: string }
        Returns: boolean
      }
      can_manage_event_contest: {
        Args: { _event_id: string }
        Returns: boolean
      }
      complete_quest: {
        Args: {
          _event_id?: string
          _proof_url?: string
          _quest_id: string
          _user_id: string
        }
        Returns: Json
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_cosplay_events_count: {
        Args: { p_cosplay_id: string }
        Returns: number
      }
      get_cosplay_people_met: {
        Args: { p_cosplay_id: string }
        Returns: number
      }
      get_nearby_profiles: {
        Args: { _lat: number; _lng: number; _radius_meters?: number }
        Returns: {
          avatar_url: string
          city: string
          display_name: string
          distance_meters: number
          id: string
          is_cosplayer_mode_active: boolean
          latitude: number
          longitude: number
          otaku_class: string
          username: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_pro_partner_role: {
        Args: { _partner_id: string; _roles: string[] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_association_admin: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_association_leader: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_association_member: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_association_owner: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_association_restricted: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_association_writable: {
        Args: { _association_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _room_id: string; _user_id?: string }
        Returns: boolean
      }
      is_guild_admin: {
        Args: { _guild_id: string; _user_id: string }
        Returns: boolean
      }
      is_party_creator: {
        Args: { _party_id: string; _user_id: string }
        Returns: boolean
      }
      is_party_member: {
        Args: { _party_id: string; _user_id: string }
        Returns: boolean
      }
      is_pro_partner_admin: { Args: { _partner_id: string }; Returns: boolean }
      is_pro_partner_member: { Args: { _partner_id: string }; Returns: boolean }
      is_pro_partner_restricted: {
        Args: { _partner_id: string }
        Returns: boolean
      }
      is_pro_partner_writable: {
        Args: { _partner_id: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      owns_cosplan: {
        Args: { _plan_id: string; _user_id?: string }
        Returns: boolean
      }
      owns_membership_submission: {
        Args: { _submission_id: string }
        Returns: boolean
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_sponsorship_rewards: {
        Args: {
          _godchild_id: string
          _godchild_username: string
          _sponsor_id: string
        }
        Returns: boolean
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_my_location: {
        Args: {
          _city?: string
          _country?: string
          _latitude: number
          _longitude: number
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      admin_status: "active" | "restricted" | "blocked"
      app_role:
        | "admin"
        | "moderator"
        | "member"
        | "premium"
        | "volunteer"
        | "partner"
      assignment_status:
        | "proposed"
        | "confirmed"
        | "checked_in"
        | "absent"
        | "completed"
        | "cancelled"
      association_contact_type:
        | "partenaire"
        | "fournisseur"
        | "institution"
        | "media"
        | "sponsor"
        | "intervenant"
        | "autre"
      association_document_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
      association_invitation_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      association_role:
        | "president"
        | "vice_president"
        | "tresorier"
        | "secretaire"
        | "responsable"
        | "benevole"
        | "membre"
      chat_room_type: "event" | "guild" | "dm"
      contest_format: "solo" | "duo" | "trio" | "quatuor" | "group"
      contest_media_type: "audio" | "video" | "link"
      contest_registration_status:
        | "pending"
        | "approved"
        | "rejected"
        | "waitlist"
      cosplan_status: "wishlist" | "started" | "paused" | "finished"
      cosplay_slot_type: "full_day" | "morning" | "afternoon"
      event_organizer_type: "association" | "pro_partner" | "user"
      event_proposal_status:
        | "submitted"
        | "under_review"
        | "needs_changes"
        | "approved"
        | "rejected"
        | "published"
      event_type:
        | "convention"
        | "tournoi"
        | "atelier"
        | "meetup"
        | "concert"
        | "exposition"
        | "projection"
        | "autre"
      friendship_status: "pending" | "accepted" | "rejected"
      guild_access_type: "public" | "private" | "invite_only"
      guild_invitation_status: "pending" | "accepted" | "declined"
      guild_role: "master" | "officer" | "member"
      guild_status: "active" | "pending" | "archived"
      invitation_status: "pending" | "accepted" | "declined"
      labs_category: "event" | "feature" | "merch" | "other"
      labs_status: "draft" | "voting" | "review" | "approved" | "rejected"
      membership_actor_type: "member" | "guardian" | "admin"
      membership_form_status: "draft" | "published" | "archived"
      membership_pathway: "major" | "minor"
      membership_payment_status:
        | "unpaid"
        | "pending"
        | "paid"
        | "waived"
        | "not_applicable"
      membership_request_status: "open" | "resolved" | "cancelled"
      membership_submission_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "needs_more_info"
        | "approved"
        | "rejected"
        | "awaiting_payment"
        | "activated"
      membership_tier: "bronze" | "silver" | "gold"
      message_type: "text" | "image" | "location" | "system"
      mission_application_mode: "open" | "manual" | "invitation_only"
      mission_preparation_status:
        | "not_started"
        | "in_progress"
        | "ready"
        | "blocked"
      mission_priority: "low" | "medium" | "high" | "critical"
      mission_status:
        | "draft"
        | "open"
        | "in_progress"
        | "complete"
        | "cancelled"
      party_member_status: "pending" | "accepted" | "declined"
      party_mode: "squad" | "shooting" | "concours"
      party_visibility: "public" | "private"
      shift_status: "open" | "full" | "in_progress" | "completed" | "cancelled"
      squad_slot_role: "character" | "staff" | "generic"
      volunteer_application_source:
        | "self"
        | "invitation"
        | "external"
        | "promotion"
      volunteer_application_status:
        | "invited"
        | "started"
        | "incomplete"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
      volunteer_document_status: "pending" | "approved" | "rejected" | "expired"
      volunteer_document_type:
        | "charter"
        | "image_rights"
        | "authorization"
        | "id_copy"
        | "medical"
        | "insurance"
        | "other"
      volunteer_message_type:
        | "welcome"
        | "reminder"
        | "assignment"
        | "document_request"
        | "shift_reminder"
        | "thanks"
        | "custom"
        | "broadcast"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      admin_status: ["active", "restricted", "blocked"],
      app_role: [
        "admin",
        "moderator",
        "member",
        "premium",
        "volunteer",
        "partner",
      ],
      assignment_status: [
        "proposed",
        "confirmed",
        "checked_in",
        "absent",
        "completed",
        "cancelled",
      ],
      association_contact_type: [
        "partenaire",
        "fournisseur",
        "institution",
        "media",
        "sponsor",
        "intervenant",
        "autre",
      ],
      association_document_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
      association_invitation_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
      ],
      association_role: [
        "president",
        "vice_president",
        "tresorier",
        "secretaire",
        "responsable",
        "benevole",
        "membre",
      ],
      chat_room_type: ["event", "guild", "dm"],
      contest_format: ["solo", "duo", "trio", "quatuor", "group"],
      contest_media_type: ["audio", "video", "link"],
      contest_registration_status: [
        "pending",
        "approved",
        "rejected",
        "waitlist",
      ],
      cosplan_status: ["wishlist", "started", "paused", "finished"],
      cosplay_slot_type: ["full_day", "morning", "afternoon"],
      event_organizer_type: ["association", "pro_partner", "user"],
      event_proposal_status: [
        "submitted",
        "under_review",
        "needs_changes",
        "approved",
        "rejected",
        "published",
      ],
      event_type: [
        "convention",
        "tournoi",
        "atelier",
        "meetup",
        "concert",
        "exposition",
        "projection",
        "autre",
      ],
      friendship_status: ["pending", "accepted", "rejected"],
      guild_access_type: ["public", "private", "invite_only"],
      guild_invitation_status: ["pending", "accepted", "declined"],
      guild_role: ["master", "officer", "member"],
      guild_status: ["active", "pending", "archived"],
      invitation_status: ["pending", "accepted", "declined"],
      labs_category: ["event", "feature", "merch", "other"],
      labs_status: ["draft", "voting", "review", "approved", "rejected"],
      membership_actor_type: ["member", "guardian", "admin"],
      membership_form_status: ["draft", "published", "archived"],
      membership_pathway: ["major", "minor"],
      membership_payment_status: [
        "unpaid",
        "pending",
        "paid",
        "waived",
        "not_applicable",
      ],
      membership_request_status: ["open", "resolved", "cancelled"],
      membership_submission_status: [
        "draft",
        "submitted",
        "under_review",
        "needs_more_info",
        "approved",
        "rejected",
        "awaiting_payment",
        "activated",
      ],
      membership_tier: ["bronze", "silver", "gold"],
      message_type: ["text", "image", "location", "system"],
      mission_application_mode: ["open", "manual", "invitation_only"],
      mission_preparation_status: [
        "not_started",
        "in_progress",
        "ready",
        "blocked",
      ],
      mission_priority: ["low", "medium", "high", "critical"],
      mission_status: ["draft", "open", "in_progress", "complete", "cancelled"],
      party_member_status: ["pending", "accepted", "declined"],
      party_mode: ["squad", "shooting", "concours"],
      party_visibility: ["public", "private"],
      shift_status: ["open", "full", "in_progress", "completed", "cancelled"],
      squad_slot_role: ["character", "staff", "generic"],
      volunteer_application_source: [
        "self",
        "invitation",
        "external",
        "promotion",
      ],
      volunteer_application_status: [
        "invited",
        "started",
        "incomplete",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
      volunteer_document_status: ["pending", "approved", "rejected", "expired"],
      volunteer_document_type: [
        "charter",
        "image_rights",
        "authorization",
        "id_copy",
        "medical",
        "insurance",
        "other",
      ],
      volunteer_message_type: [
        "welcome",
        "reminder",
        "assignment",
        "document_request",
        "shift_reminder",
        "thanks",
        "custom",
        "broadcast",
      ],
    },
  },
} as const
