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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      associations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          siret: string | null
          rna_number: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          region: string | null
          email: string | null
          phone: string | null
          website_url: string | null
          social_links: Json | null
          status: string
          admin_status: string
          admin_status_reason: string | null
          admin_status_changed_at: string | null
          admin_status_changed_by: string | null
          admin_notes: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          founded_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          siret?: string | null
          rna_number?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          email?: string | null
          phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          status?: string
          admin_status?: string
          admin_status_reason?: string | null
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          founded_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          siret?: string | null
          rna_number?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          email?: string | null
          phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          status?: string
          admin_status?: string
          admin_status_reason?: string | null
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          founded_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_contacts: {
        Row: {
          id: string
          association_id: string
          name: string
          organization: string | null
          contact_type: Database["public"]["Enums"]["association_contact_type"]
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          website_url: string | null
          social_links: Json | null
          notes: string | null
          tags: string[] | null
          last_contacted: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          association_id: string
          name: string
          organization?: string | null
          contact_type?: Database["public"]["Enums"]["association_contact_type"]
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          website_url?: string | null
          social_links?: Json | null
          notes?: string | null
          tags?: string[] | null
          last_contacted?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          name?: string
          organization?: string | null
          contact_type?: Database["public"]["Enums"]["association_contact_type"]
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          website_url?: string | null
          social_links?: Json | null
          notes?: string | null
          tags?: string[] | null
          last_contacted?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
        ]
      }
      association_documents: {
        Row: {
          id: string
          association_id: string
          title: string
          description: string | null
          category: string
          file_url: string | null
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          status: Database["public"]["Enums"]["association_document_status"]
          submitted_by: string | null
          reviewed_by: string | null
          submitted_at: string | null
          reviewed_at: string | null
          review_comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          association_id: string
          title: string
          description?: string | null
          category?: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["association_document_status"]
          submitted_by?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          review_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          title?: string
          description?: string | null
          category?: string
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          status?: Database["public"]["Enums"]["association_document_status"]
          submitted_by?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          review_comment?: string | null
          created_at?: string
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
            foreignKeyName: "association_documents_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_invitations: {
        Row: {
          id: string
          association_id: string
          user_id: string
          invited_by: string
          role: Database["public"]["Enums"]["association_role"]
          status: Database["public"]["Enums"]["association_invitation_status"]
          message: string | null
          responded_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          association_id: string
          user_id: string
          invited_by: string
          role?: Database["public"]["Enums"]["association_role"]
          status?: Database["public"]["Enums"]["association_invitation_status"]
          message?: string | null
          responded_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          user_id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["association_role"]
          status?: Database["public"]["Enums"]["association_invitation_status"]
          message?: string | null
          responded_at?: string | null
          expires_at?: string | null
          created_at?: string
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
            foreignKeyName: "association_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_memberships: {
        Row: {
          id: string
          association_id: string
          user_id: string
          role: Database["public"]["Enums"]["association_role"]
          title: string | null
          joined_at: string
          left_at: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          association_id: string
          user_id: string
          role?: Database["public"]["Enums"]["association_role"]
          title?: string | null
          joined_at?: string
          left_at?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          association_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["association_role"]
          title?: string | null
          joined_at?: string
          left_at?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
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
            foreignKeyName: "cosplay_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "cosplay_vestiaire"
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
        ]
      }
      cosplay_plan_tasks: {
        Row: {
          created_at: string
          id: string
          is_done: boolean
          label: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_done?: boolean
          label: string
          plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_done?: boolean
          label?: string
          plan_id?: string
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
          created_at: string
          deadline: string | null
          id: string
          image_url: string | null
          notes: string | null
          priority: number
          progress_level: number
          status: Database["public"]["Enums"]["cosplan_status"]
          target_year: number
          universe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_progress?: boolean
          budget?: number | null
          character_name: string
          created_at?: string
          deadline?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          priority?: number
          progress_level?: number
          status?: Database["public"]["Enums"]["cosplan_status"]
          target_year?: number
          universe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_progress?: boolean
          budget?: number | null
          character_name?: string
          created_at?: string
          deadline?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          priority?: number
          progress_level?: number
          status?: Database["public"]["Enums"]["cosplan_status"]
          target_year?: number
          universe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_photo_tags: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
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
          linked_cosplay_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
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
          linked_cosplay_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
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
          linked_cosplay_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "cosplay_photo_tags_tagger_user_id_fkey"
            columns: ["tagger_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosplay_photos: {
        Row: {
          caption: string | null
          cosplay_id: string
          created_at: string
          activity_id: string | null
          event_date_manual: string | null
          event_id: string | null
          event_location_manual: string | null
          event_name_manual: string | null
          exif_date: string | null
          exif_gps_lat: number | null
          exif_gps_lng: number | null
          id: string
          is_group_photo: boolean
          photo_type: string
          photo_url: string
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
          photo_type?: string
          photo_url: string
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
          photo_type?: string
          photo_url?: string
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
        ]
      }
      cosplay_vestiaire: {
        Row: {
          character_id: string | null
          character_name: string
          created_at: string
          id: string
          official_image_url: string
          universe: string
          universe_id: string | null
          user_id: string
          user_image_url: string
        }
        Insert: {
          character_id?: string | null
          character_name: string
          created_at?: string
          id?: string
          official_image_url: string
          universe: string
          universe_id?: string | null
          user_id: string
          user_image_url: string
        }
        Update: {
          character_id?: string | null
          character_name?: string
          created_at?: string
          id?: string
          official_image_url?: string
          universe?: string
          universe_id?: string | null
          user_id?: string
          user_image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosplay_vestiaire_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "ref_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_vestiaire_universe_id_fkey"
            columns: ["universe_id"]
            isOneToOne: false
            referencedRelation: "ref_universes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosplay_vestiaire_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
      event_participants: {
        Row: {
          attendance_details: Json | null
          event_id: string
          id: string
          planned_cosplay_id: string | null
          registered_at: string
          role: string
          user_id: string
          is_present: boolean
          checked_in_at: string | null
          // Nouveaux champs MVP Agenda
          cosplay_id: string | null
          attendance_dates: Json | null
          cosplay_data: Json | null
          universe: string | null
        }
        Insert: {
          attendance_details?: Json | null
          event_id: string
          id?: string
          planned_cosplay_id?: string | null
          registered_at?: string
          role?: string
          user_id: string
          is_present?: boolean
          checked_in_at?: string | null
          // Nouveaux champs MVP Agenda
          cosplay_id?: string | null
          attendance_dates?: Json | null
          cosplay_data?: Json | null
          universe?: string | null
        }
        Update: {
          attendance_details?: Json | null
          event_id?: string
          id?: string
          planned_cosplay_id?: string | null
          registered_at?: string
          role?: string
          user_id?: string
          is_present?: boolean
          checked_in_at?: string | null
          // Nouveaux champs MVP Agenda
          cosplay_id?: string | null
          attendance_dates?: Json | null
          cosplay_data?: Json | null
          universe?: string | null
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
            foreignKeyName: "event_participants_planned_cosplay_id_fkey"
            columns: ["planned_cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_vestiaire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          mode: string
          name: string
          slots: Json | null
          tags: string[] | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          event_id: string
          id?: string
          max_members?: number | null
          mode?: string
          name: string
          slots?: Json | null
          tags?: string[] | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          event_id?: string
          id?: string
          max_members?: number | null
          mode?: string
          name?: string
          slots?: Json | null
          tags?: string[] | null
          updated_at?: string
          visibility?: string
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
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          party_id: string
          role?: string
          slot_index?: number | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          party_id?: string
          role?: string
          slot_index?: number | null
          status?: string
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
        ]
      }
      event_quests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_active: boolean | null
          quest_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          quest_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
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
          {
            foreignKeyName: "event_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          id: string
          slug: string
          canonical_name: string
          description: string | null
          type_evenement: string | null
          default_city: string | null
          default_venue: string | null
          organizer_association_id: string | null
          cover_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          canonical_name: string
          description?: string | null
          type_evenement?: string | null
          default_city?: string | null
          default_venue?: string | null
          organizer_association_id?: string | null
          cover_image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          canonical_name?: string
          description?: string | null
          type_evenement?: string | null
          default_city?: string | null
          default_venue?: string | null
          organizer_association_id?: string | null
          cover_image?: string | null
          created_at?: string
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
          association_id: string | null
          category: string
          city: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_date: string | null
          external_link: string | null
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          price: string | null
          region: string | null
          schedule: Json | null
          status: string
          ticketing_mode: string
          time: string | null
          title: string
          updated_at: string
          venue_name: string | null
          // Nouveaux champs MVP Agenda
          date_debut: string | null
          date_fin: string | null
          adresse: string | null
          coordonnees_gps: Json | null
          type_evenement: string | null
          cover_image: string | null
          // Phase 1 – Séries d'événements
          series_id: string | null
          edition_label: string | null
          slug: string | null
          // Phase 1 – Multi-organisateur
          organizer_type: string
          organizer_id: string | null
        }
        Insert: {
          association_id?: string | null
          category?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          price?: string | null
          region?: string | null
          schedule?: Json | null
          status?: string
          ticketing_mode?: string
          time?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
          // Nouveaux champs MVP Agenda
          date_debut?: string | null
          date_fin?: string | null
          adresse?: string | null
          coordonnees_gps?: Json | null
          type_evenement?: string | null
          cover_image?: string | null
          // Phase 1 – Séries d'événements
          series_id?: string | null
          edition_label?: string | null
          slug?: string | null
          // Phase 1 – Multi-organisateur
          organizer_type?: string
          organizer_id?: string | null
        }
        Update: {
          association_id?: string | null
          category?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          price?: string | null
          region?: string | null
          schedule?: Json | null
          status?: string
          ticketing_mode?: string
          time?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
          // Nouveaux champs MVP Agenda
          date_debut?: string | null
          date_fin?: string | null
          adresse?: string | null
          coordonnees_gps?: Json | null
          type_evenement?: string | null
          cover_image?: string | null
          // Phase 1 – Séries d'événements
          series_id?: string | null
          edition_label?: string | null
          slug?: string | null
          // Phase 1 – Multi-organisateur
          organizer_type?: string
          organizer_id?: string | null
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
      event_schedule: {
        Row: {
          id: string
          event_id: string
          time: string
          start_time: string
          end_time: string | null
          title: string
          location: string | null
          category: string
          description: string | null
          day_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          time: string
          start_time: string
          end_time?: string | null
          title: string
          location?: string | null
          category?: string
          description?: string | null
          day_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          time?: string
          start_time?: string
          end_time?: string | null
          title?: string
          location?: string | null
          category?: string
          description?: string | null
          day_date?: string | null
          created_at?: string
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
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          invited_by: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          invited_by?: string
          status?: string
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
            foreignKeyName: "guild_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
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
          access_type: string
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
          status: string
          updated_at: string
        }
        Insert: {
          access_type?: string
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
          status?: string
          updated_at?: string
        }
        Update: {
          access_type?: string
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
          status?: string
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
        Relationships: []
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
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: []
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
            foreignKeyName: "posts_related_cosplay_id_fkey"
            columns: ["related_cosplay_id"]
            isOneToOne: false
            referencedRelation: "cosplay_vestiaire"
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_character_id: string | null
          bio: string | null
          birth_date: string | null
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
          created_at: string | null
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
          image_rights_consent: boolean | null
          inspiration_universes: string[] | null
          is_cosplayer_mode_active: boolean | null
          is_creator_profile_active: boolean | null
          is_gamer_mode_active: boolean | null
          is_otaku_mode_active: boolean | null
          is_subscription_active: boolean | null
          last_name: string | null
          level: number
          member_since: string | null
          membership_status: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"] | null
          monthly_xp: number | null
          occupation_status: string | null
          onboarding_completed: boolean | null
          otaku_class: string | null
          otaku_con_activity: string | null
          otaku_favorite_artist: string | null
          otaku_first_manga: string | null
          otaku_japan_destination: string | null
          otaku_japan_must_buy: string | null
           otaku_social_nightmare: string | null
           otaku_stats: Json | null
           otaku_top3: Json | null
           allow_event_checkin: boolean | null
          otk_coins: number
          parental_authorization_url: string | null
          partner_address: string | null
          partner_admin_email: string | null
          partner_category: string | null
          partner_city: string | null
          partner_company_name: string | null
          partner_contact_name: string | null
          partner_convention_status: string | null
          partner_cover_url: string | null
          partner_description: string | null
          partner_facebook: string | null
          partner_instagram: string | null
          partner_legal_form: string | null
          partner_logo_url: string | null
          partner_offers: Json | null
          partner_postal_code: string | null
          partner_representative_function: string | null
          partner_representative_name: string | null
          partner_requests: Json | null
          partner_siret: string | null
          partner_status: string | null
          partner_subcategory: string | null
          partner_validated_at: string | null
          partner_validated_by: string | null
          partner_website: string | null
          payment_method: string | null
          phone: string | null
          podium_lock_states: Json | null
          privacy_settings: Json | null
          profile_visibility: string | null
          qr_code_token: string
          referral_count: number | null
          referral_year: number | null
          role: string | null
          role_function: string | null
          rules_accepted: boolean | null
          rules_accepted_at: string | null
          selected_pack: string | null
          social_links: Json | null
          sponsor_id: string | null
          subscription_expires_at: string | null
          total_otk_earned: number
          updated_at: string | null
          username: string | null
          worst_character_id: string | null
          xp: number
          // Nouveau champ MVP Agenda - Hub Local
          pinned_city: string | null
        }
        Insert: {
          avatar_url?: string | null
          best_character_id?: string | null
          bio?: string | null
          birth_date?: string | null
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
          created_at?: string | null
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
          image_rights_consent?: boolean | null
          inspiration_universes?: string[] | null
          is_cosplayer_mode_active?: boolean | null
          is_creator_profile_active?: boolean | null
          is_gamer_mode_active?: boolean | null
          is_otaku_mode_active?: boolean | null
          is_subscription_active?: boolean | null
          last_name?: string | null
          level?: number
          member_since?: string | null
          membership_status?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          monthly_xp?: number | null
          occupation_status?: string | null
          onboarding_completed?: boolean | null
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
          parental_authorization_url?: string | null
          partner_address?: string | null
          partner_admin_email?: string | null
          partner_category?: string | null
          partner_city?: string | null
          partner_company_name?: string | null
          partner_contact_name?: string | null
          partner_convention_status?: string | null
          partner_cover_url?: string | null
          partner_description?: string | null
          partner_facebook?: string | null
          partner_instagram?: string | null
          partner_legal_form?: string | null
          partner_logo_url?: string | null
          partner_offers?: Json | null
          partner_postal_code?: string | null
          partner_representative_function?: string | null
          partner_representative_name?: string | null
          partner_requests?: Json | null
          partner_siret?: string | null
          partner_status?: string | null
          partner_subcategory?: string | null
          partner_validated_at?: string | null
          partner_validated_by?: string | null
          partner_website?: string | null
          payment_method?: string | null
          phone?: string | null
          podium_lock_states?: Json | null
          privacy_settings?: Json | null
          profile_visibility?: string | null
          qr_code_token?: string
          referral_count?: number | null
          referral_year?: number | null
          role?: string | null
          role_function?: string | null
          rules_accepted?: boolean | null
          rules_accepted_at?: string | null
          selected_pack?: string | null
          social_links?: Json | null
          sponsor_id?: string | null
          subscription_expires_at?: string | null
          total_otk_earned?: number
          updated_at?: string | null
          username?: string | null
          worst_character_id?: string | null
          xp?: number
          // Nouveau champ MVP Agenda - Hub Local
          pinned_city?: string | null
        }
        Update: {
          avatar_url?: string | null
          best_character_id?: string | null
          bio?: string | null
          birth_date?: string | null
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
          created_at?: string | null
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
          image_rights_consent?: boolean | null
          inspiration_universes?: string[] | null
          is_cosplayer_mode_active?: boolean | null
          is_creator_profile_active?: boolean | null
          is_gamer_mode_active?: boolean | null
          is_otaku_mode_active?: boolean | null
          is_subscription_active?: boolean | null
          last_name?: string | null
          level?: number
          member_since?: string | null
          membership_status?: string | null
          membership_tier?:
            | Database["public"]["Enums"]["membership_tier"]
            | null
          monthly_xp?: number | null
          occupation_status?: string | null
          onboarding_completed?: boolean | null
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
          parental_authorization_url?: string | null
          partner_address?: string | null
          partner_admin_email?: string | null
          partner_category?: string | null
          partner_city?: string | null
          partner_company_name?: string | null
          partner_contact_name?: string | null
          partner_convention_status?: string | null
          partner_cover_url?: string | null
          partner_description?: string | null
          partner_facebook?: string | null
          partner_instagram?: string | null
          partner_legal_form?: string | null
          partner_logo_url?: string | null
          partner_offers?: Json | null
          partner_postal_code?: string | null
          partner_representative_function?: string | null
          partner_representative_name?: string | null
          partner_requests?: Json | null
          partner_siret?: string | null
          partner_status?: string | null
          partner_subcategory?: string | null
          partner_validated_at?: string | null
          partner_validated_by?: string | null
          partner_website?: string | null
          payment_method?: string | null
          phone?: string | null
          podium_lock_states?: Json | null
          privacy_settings?: Json | null
          profile_visibility?: string | null
          qr_code_token?: string
          referral_count?: number | null
          referral_year?: number | null
          role?: string | null
          role_function?: string | null
          rules_accepted?: boolean | null
          rules_accepted_at?: string | null
          selected_pack?: string | null
          social_links?: Json | null
          sponsor_id?: string | null
          subscription_expires_at?: string | null
          total_otk_earned?: number
          updated_at?: string | null
          username?: string | null
          worst_character_id?: string | null
          xp?: number
          // Nouveau champ MVP Agenda - Hub Local
          pinned_city?: string | null
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
            foreignKeyName: "profiles_worst_character_id_fkey"
            columns: ["worst_character_id"]
            isOneToOne: false
            referencedRelation: "ref_characters"
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
            foreignKeyName: "quest_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          favorite_categories: string[] | null
          id: string
          interests: string[] | null
          updated_at: string | null
          user_id: string
          viewed_events: string[] | null
          viewed_products: string[] | null
        }
        Insert: {
          created_at?: string | null
          favorite_categories?: string[] | null
          id?: string
          interests?: string[] | null
          updated_at?: string | null
          user_id: string
          viewed_events?: string[] | null
          viewed_products?: string[] | null
        }
        Update: {
          created_at?: string | null
          favorite_categories?: string[] | null
          id?: string
          interests?: string[] | null
          updated_at?: string | null
          user_id?: string
          viewed_events?: string[] | null
          viewed_products?: string[] | null
        }
        Relationships: []
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
            foreignKeyName: "user_quests_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Pro Partners Module V2 ──
      pro_partners: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          directory_category: string | null
          subcategories: string[]
          description: string | null
          description_long: string | null
          member_benefit: string | null
          logo_url: string | null
          banner_url: string | null
          siret: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          region: string | null
          email: string | null
          phone: string | null
          website_url: string | null
          social_links: Json | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          tiktok_url: string | null
          youtube_url: string | null
          linkedin_url: string | null
          partner_status: string
          partner_offers: string | null
          mp_offers: string | null
          status: string
          is_public: boolean
          is_featured: boolean
          admin_status: string
          admin_status_reason: string | null
          admin_status_changed_at: string | null
          admin_status_changed_by: string | null
          admin_notes: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          source_import: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: string
          directory_category?: string | null
          subcategories?: string[]
          description?: string | null
          description_long?: string | null
          member_benefit?: string | null
          logo_url?: string | null
          banner_url?: string | null
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          email?: string | null
          phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          youtube_url?: string | null
          linkedin_url?: string | null
          partner_status?: string
          partner_offers?: string | null
          mp_offers?: string | null
          status?: string
          is_public?: boolean
          is_featured?: boolean
          admin_status?: string
          admin_status_reason?: string | null
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          source_import?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: string
          directory_category?: string | null
          subcategories?: string[]
          description?: string | null
          description_long?: string | null
          member_benefit?: string | null
          logo_url?: string | null
          banner_url?: string | null
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          region?: string | null
          email?: string | null
          phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          youtube_url?: string | null
          linkedin_url?: string | null
          partner_status?: string
          partner_offers?: string | null
          mp_offers?: string | null
          status?: string
          is_public?: boolean
          is_featured?: boolean
          admin_status?: string
          admin_status_reason?: string | null
          admin_status_changed_at?: string | null
          admin_status_changed_by?: string | null
          admin_notes?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          source_import?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_partners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_partner_members: {
        Row: {
          id: string
          partner_id: string
          user_id: string
          role: string
          title: string | null
          notes: string | null
          is_active: boolean
          membership_status: string
          joined_at: string
          left_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          user_id: string
          role?: string
          title?: string | null
          notes?: string | null
          is_active?: boolean
          membership_status?: string
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          partner_id?: string
          user_id?: string
          role?: string
          title?: string | null
          notes?: string | null
          is_active?: boolean
          membership_status?: string
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
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
        ]
      }
      pro_partner_applications: {
        Row: {
          id: string
          company_name: string
          company_type: string
          siret: string | null
          description: string | null
          contact_first_name: string
          contact_last_name: string
          contact_email: string
          contact_phone: string | null
          website_url: string | null
          social_links: Json | null
          message: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          partner_id: string | null
          submitted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          company_type?: string
          siret?: string | null
          description?: string | null
          contact_first_name: string
          contact_last_name: string
          contact_email: string
          contact_phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          message?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          partner_id?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_type?: string
          siret?: string | null
          description?: string | null
          contact_first_name?: string
          contact_last_name?: string
          contact_email?: string
          contact_phone?: string | null
          website_url?: string | null
          social_links?: Json | null
          message?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          partner_id?: string | null
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_partner_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pro_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_membership: {
        Args: { _otk_amount: number; _pack_id: string; _user_id: string }
        Returns: boolean
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
      complete_quest: {
        Args: {
          _event_id?: string
          _proof_url?: string
          _quest_id: string
          _user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      get_cosplay_events_count: {
        Args: { p_cosplay_id: string }
        Returns: number
      }
      get_cosplay_people_met: {
        Args: { p_cosplay_id: string }
        Returns: number
      }
      process_sponsorship_rewards: {
        Args: {
          _godchild_id: string
          _godchild_username: string
          _sponsor_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "member"
        | "premium"
        | "volunteer"
        | "partner"
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
      association_role:
        | "president"
        | "vice_president"
        | "tresorier"
        | "secretaire"
        | "responsable"
        | "benevole"
        | "membre"
      chat_room_type: "event" | "guild" | "dm"
      cosplan_status: "wishlist" | "started" | "paused" | "finished"
      friendship_status: "pending" | "accepted" | "rejected"
      invitation_status: "pending" | "accepted" | "rejected"
      labs_category: "event" | "feature" | "merch" | "other"
      labs_status: "draft" | "voting" | "review" | "approved" | "rejected"
      membership_tier: "bronze" | "silver" | "gold"
      message_type: "text" | "image" | "location" | "system"
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
      app_role: [
        "admin",
        "moderator",
        "member",
        "premium",
        "volunteer",
        "partner",
      ],
      chat_room_type: ["event", "guild", "dm"],
      cosplan_status: ["wishlist", "started", "paused", "finished"],
      friendship_status: ["pending", "accepted", "rejected"],
      invitation_status: ["pending", "accepted", "rejected"],
      labs_category: ["event", "feature", "merch", "other"],
      labs_status: ["draft", "voting", "review", "approved", "rejected"],
      membership_tier: ["bronze", "silver", "gold"],
      message_type: ["text", "image", "location", "system"],
    },
  },
} as const
