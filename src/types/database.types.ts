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
      ai_jdv_knowledge: {
        Row: {
          active: boolean
          content: string
          id: string
          scope: string
          topic: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          id?: string
          scope: string
          topic: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          id?: string
          scope?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_categories: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      article_serial_assignments: {
        Row: {
          active: boolean
          article_id: string
          assigned_at: string
          created_by: string | null
          id: string
          organization_id: string
          prospecteur_id: string | null
          released_at: string | null
          serial_number_id: string
          warehouse_id: string | null
        }
        Insert: {
          active?: boolean
          article_id: string
          assigned_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          prospecteur_id?: string | null
          released_at?: string | null
          serial_number_id: string
          warehouse_id?: string | null
        }
        Update: {
          active?: boolean
          article_id?: string
          assigned_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          prospecteur_id?: string | null
          released_at?: string | null
          serial_number_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_serial_assignments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "article_serial_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_serial_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          active: boolean
          cash_price: number
          category: string | null
          code: string
          created_at: string
          credit_price: number
          default_payment_amount: number
          description: string | null
          fixed_price: number
          id: string
          minimum_deposit: number
          name: string
          organization_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cash_price?: number
          category?: string | null
          code: string
          created_at?: string
          credit_price?: number
          default_payment_amount?: number
          description?: string | null
          fixed_price?: number
          id?: string
          minimum_deposit?: number
          name: string
          organization_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cash_price?: number
          category?: string | null
          code?: string
          created_at?: string
          credit_price?: number
          default_payment_amount?: number
          description?: string | null
          fixed_price?: number
          id?: string
          minimum_deposit?: number
          name?: string
          organization_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string
          prospect_id: string | null
          prospecteur_id: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_center_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "call_center_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "call_center_tasks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_date: string
          caller_user_id: string | null
          client_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          organization_id: string
          prospect_id: string | null
          prospecteur_id: string | null
          result: string | null
        }
        Insert: {
          call_date?: string
          caller_user_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          result?: string | null
        }
        Update: {
          call_date?: string
          caller_user_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          prospect_id?: string | null
          prospecteur_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "call_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "call_logs_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portfolios: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          owner_type: string
          owner_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          organization_id: string
          owner_type: string
          owner_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          owner_type?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portfolios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          identity_reference: string | null
          last_activity_at: string | null
          last_contact_at: string | null
          last_name: string | null
          last_payment_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          organization_id: string
          phone: string | null
          portfolio_id: string | null
          prospecteur_id: string | null
          status: string
          temperature: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "client_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_adjustments: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          commission_type_id: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          prospecteur_id: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          commission_type_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          prospecteur_id?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          commission_type_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          prospecteur_id?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_adjustments_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_adjustments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "commission_adjustments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          amount: number
          commission_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payout_mode: string | null
          phone_number: string
          prospecteur_id: string
          provider: string
          provider_payout_id: string | null
          provider_reference: string | null
          requested_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          commission_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          payout_mode?: string | null
          phone_number: string
          prospecteur_id: string
          provider?: string
          provider_payout_id?: string | null
          provider_reference?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          payout_mode?: string | null
          phone_number?: string
          prospecteur_id?: string
          provider?: string
          provider_payout_id?: string | null
          provider_reference?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: true
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: true
            referencedRelation: "jdvcrm_pending_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payouts_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "commission_payouts_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          active: boolean
          applies_to_sale_type: string
          article_id: string | null
          base: string
          category_name: string | null
          commission_type_id: string
          conditions: Json
          created_at: string
          created_by: string | null
          cumulative: boolean
          fixed_amount: number | null
          id: string
          name: string
          organization_id: string
          per_unit_amount: number | null
          priority: number
          prospecteur_id: string | null
          rate_percent: number | null
          scope: string
          target_role: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          applies_to_sale_type?: string
          article_id?: string | null
          base?: string
          category_name?: string | null
          commission_type_id: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          cumulative?: boolean
          fixed_amount?: number | null
          id?: string
          name: string
          organization_id: string
          per_unit_amount?: number | null
          priority?: number
          prospecteur_id?: string | null
          rate_percent?: number | null
          scope?: string
          target_role?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          applies_to_sale_type?: string
          article_id?: string | null
          base?: string
          category_name?: string | null
          commission_type_id?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          cumulative?: boolean
          fixed_amount?: number | null
          id?: string
          name?: string
          organization_id?: string
          per_unit_amount?: number | null
          priority?: number
          prospecteur_id?: string | null
          rate_percent?: number | null
          scope?: string
          target_role?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "commission_rules_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_types: {
        Row: {
          active: boolean
          calculation_method: string
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          calculation_method?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          calculation_method?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          article_id: string | null
          base_amount: number
          calculation_method: string | null
          calculation_snapshot: Json
          commission_amount: number
          commission_rate: number
          commission_type_id: string | null
          created_at: string
          description: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payment_id: string | null
          prospecteur_id: string
          rule_id: string | null
          sale_id: string | null
          source_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          base_amount?: number
          calculation_method?: string | null
          calculation_snapshot?: Json
          commission_amount?: number
          commission_rate?: number
          commission_type_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id: string
          rule_id?: string | null
          sale_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          base_amount?: number
          calculation_method?: string | null
          calculation_snapshot?: Json
          commission_amount?: number
          commission_rate?: number
          commission_type_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id?: string
          rule_id?: string | null
          sale_id?: string | null
          source_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sectors: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          active: boolean
          code: string
          currency_code: string | null
          id: string
          name: string
          phone_prefix: string | null
        }
        Insert: {
          active?: boolean
          code: string
          currency_code?: string | null
          id?: string
          name: string
          phone_prefix?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          currency_code?: string | null
          id?: string
          name?: string
          phone_prefix?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          active: boolean
          code: string
          decimals: number
          id: string
          name: string
          symbol: string | null
        }
        Insert: {
          active?: boolean
          code: string
          decimals?: number
          id?: string
          name: string
          symbol?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          decimals?: number
          id?: string
          name?: string
          symbol?: string | null
        }
        Relationships: []
      }
      daily_tokens: {
        Row: {
          client_id: string | null
          created_at: string
          expected_amount: number
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          prospecteur_id: string | null
          sale_id: string | null
          status: string
          token_date: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string
          token_date?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string
          token_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "daily_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "daily_tokens_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tokens_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          created_at: string
          current_number: number
          document_type: string
          id: string
          organization_id: string
          padding: number
          prefix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_number?: number
          document_type: string
          id?: string
          organization_id: string
          padding?: number
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_number?: number
          document_type?: string
          id?: string
          organization_id?: string
          padding?: number
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          code: string
          created_at: string
          document_type: string
          id: string
          name: string
          organization_id: string | null
          template_content: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          document_type: string
          id?: string
          name: string
          organization_id?: string | null
          template_content?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          document_type?: string
          id?: string
          name?: string
          organization_id?: string | null
          template_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_number: string | null
          document_type: string
          id: string
          metadata: Json
          organization_id: string
          related_id: string | null
          related_table: string | null
          status: string
          storage_path: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type: string
          id?: string
          metadata?: Json
          organization_id: string
          related_id?: string | null
          related_table?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          related_id?: string | null
          related_table?: string | null
          status?: string
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          effective_at: string
          id: string
          quote_currency: string
          rate: number
          source: string | null
        }
        Insert: {
          base_currency: string
          created_at?: string
          effective_at?: string
          id?: string
          quote_currency: string
          rate: number
          source?: string | null
        }
        Update: {
          base_currency?: string
          created_at?: string
          effective_at?: string
          id?: string
          quote_currency?: string
          rate?: number
          source?: string | null
        }
        Relationships: []
      }
      field_visits: {
        Row: {
          address: string | null
          client_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          prospect_id: string | null
          prospecteur_id: string
          result: string | null
          visit_date: string
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          prospect_id?: string | null
          prospecteur_id: string
          result?: string | null
          visit_date?: string
        }
        Update: {
          address?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          prospect_id?: string | null
          prospecteur_id?: string
          result?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "field_visits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_visits_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "field_visits_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string
          id: string
          message: string | null
          organization_id: string
          prospect_id: string | null
          reminder_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          prospect_id?: string | null
          reminder_at: string
          status?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          prospect_id?: string | null
          reminder_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "follow_up_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity_received: number
          receipt_id: string
          unit_cost: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity_received: number
          receipt_id: string
          unit_cost?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity_received?: number
          receipt_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          purchase_order_id: string | null
          receipt_date: string
          receipt_number: string
          received_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_alerts: {
        Row: {
          acknowledged_at: string | null
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          fingerprint: string
          id: string
          message: string
          metadata: Json
          organization_id: string
          prospecteur_id: string | null
          recommendation: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          category: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          fingerprint: string
          id?: string
          message: string
          metadata?: Json
          organization_id: string
          prospecteur_id?: string | null
          recommendation?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          fingerprint?: string
          id?: string
          message?: string
          metadata?: Json
          organization_id?: string
          prospecteur_id?: string | null
          recommendation?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_alerts_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "intelligence_alerts_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          active: boolean
          code: string
          id: string
          name: string
          native_name: string | null
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          name: string
          native_name?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          name?: string
          native_name?: string | null
        }
        Relationships: []
      }
      login_security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          channel: string
          created_at: string
          data: Json
          id: string
          message: string | null
          notification_type: string
          organization_id: string | null
          read_at: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          notification_type: string
          organization_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          notification_type?: string
          organization_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          notification_type: string
          push: boolean
          sms: boolean
          updated_at: string
          user_id: string
          whatsapp: boolean
        }
        Insert: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id: string
          whatsapp?: boolean
        }
        Update: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type?: string
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id?: string
          whatsapp?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json
          organization_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          organization_id?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          organization_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_application_documents: {
        Row: {
          analysis_result: Json
          application_id: string
          created_at: string
          document_name: string
          document_number: string | null
          document_type: string
          expires_at: string | null
          file_size: number | null
          id: string
          issued_at: string | null
          mime_type: string | null
          rejection_reason: string | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          analysis_result?: Json
          application_id: string
          created_at?: string
          document_name: string
          document_number?: string | null
          document_type: string
          expires_at?: string | null
          file_size?: number | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          analysis_result?: Json
          application_id?: string
          created_at?: string
          document_name?: string
          document_number?: string | null
          document_type?: string
          expires_at?: string | null
          file_size?: number | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_application_reviews: {
        Row: {
          application_id: string
          automatic_analysis: Json
          created_at: string
          decision: string
          id: string
          notes: string | null
          reviewer_user_id: string
        }
        Insert: {
          application_id: string
          automatic_analysis?: Json
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          reviewer_user_id: string
        }
        Update: {
          application_id?: string
          automatic_analysis?: Json
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_application_tokens: {
        Row: {
          application_id: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          expires_at: string
          id?: string
          purpose?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_application_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_applications: {
        Row: {
          activated_at: string | null
          address: string | null
          ai_identity_attempts: number
          ai_identity_checked_at: string | null
          ai_identity_reasons: Json
          ai_identity_status: string
          analysis_result: Json
          analysis_score: number | null
          analysis_status: string
          applicant_user_id: string
          approved_at: string | null
          associate_count: number | null
          city: string | null
          company_name: string
          company_nature: string
          company_size: string | null
          country: string
          created_at: string
          email_verified_at: string | null
          id: string
          identity_fingerprint: string | null
          legal_form: string | null
          legal_name: string | null
          legal_status: string | null
          manager_count: number | null
          ownership_count: number | null
          people_count: number | null
          phone: string | null
          primary_sector_id: string | null
          professional_email: string
          registration_number: string | null
          representative_birth_date: string | null
          representative_email: string
          representative_first_name: string
          representative_last_name: string
          representative_nationality: string | null
          representative_phone: string | null
          representative_role: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          secondary_sector_ids: string[]
          status: string
          tax_number: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: string | null
          ai_identity_attempts?: number
          ai_identity_checked_at?: string | null
          ai_identity_reasons?: Json
          ai_identity_status?: string
          analysis_result?: Json
          analysis_score?: number | null
          analysis_status?: string
          applicant_user_id: string
          approved_at?: string | null
          associate_count?: number | null
          city?: string | null
          company_name: string
          company_nature: string
          company_size?: string | null
          country: string
          created_at?: string
          email_verified_at?: string | null
          id?: string
          identity_fingerprint?: string | null
          legal_form?: string | null
          legal_name?: string | null
          legal_status?: string | null
          manager_count?: number | null
          ownership_count?: number | null
          people_count?: number | null
          phone?: string | null
          primary_sector_id?: string | null
          professional_email: string
          registration_number?: string | null
          representative_birth_date?: string | null
          representative_email: string
          representative_first_name: string
          representative_last_name: string
          representative_nationality?: string | null
          representative_phone?: string | null
          representative_role: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_sector_ids?: string[]
          status?: string
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: string | null
          ai_identity_attempts?: number
          ai_identity_checked_at?: string | null
          ai_identity_reasons?: Json
          ai_identity_status?: string
          analysis_result?: Json
          analysis_score?: number | null
          analysis_status?: string
          applicant_user_id?: string
          approved_at?: string | null
          associate_count?: number | null
          city?: string | null
          company_name?: string
          company_nature?: string
          company_size?: string | null
          country?: string
          created_at?: string
          email_verified_at?: string | null
          id?: string
          identity_fingerprint?: string | null
          legal_form?: string | null
          legal_name?: string | null
          legal_status?: string | null
          manager_count?: number | null
          ownership_count?: number | null
          people_count?: number | null
          phone?: string | null
          primary_sector_id?: string | null
          professional_email?: string
          registration_number?: string | null
          representative_birth_date?: string | null
          representative_email?: string
          representative_first_name?: string
          representative_last_name?: string
          representative_nationality?: string | null
          representative_phone?: string | null
          representative_role?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          secondary_sector_ids?: string[]
          status?: string
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_applications_primary_sector_id_fkey"
            columns: ["primary_sector_id"]
            isOneToOne: false
            referencedRelation: "company_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_personalization: {
        Row: {
          accent_color: string | null
          company_slogan: string | null
          created_at: string
          dashboard_background_url: string | null
          favicon_url: string | null
          id: string
          login_background_url: string | null
          logo_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          company_slogan?: string | null
          created_at?: string
          dashboard_background_url?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          company_slogan?: string | null
          created_at?: string
          dashboard_background_url?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_personalization_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          organization_id: string
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          organization_id: string
          plan_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_team_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          organization_id: string
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id: string
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "organization_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_teams: {
        Row: {
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          status: string
          supervisor_user_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          supervisor_user_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          supervisor_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          currency: string
          email: string | null
          id: string
          language: string
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          primary_color: string | null
          registration_number: string | null
          secondary_color: string | null
          status: string
          subscription_status: string
          tax_id: string | null
          tax_number: string | null
          timezone: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          language?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          status?: string
          subscription_status?: string
          tax_id?: string | null
          tax_number?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          language?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          status?: string
          subscription_status?: string
          tax_id?: string | null
          tax_number?: string | null
          timezone?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      payment_provider_accounts: {
        Row: {
          created_at: string
          environment: string
          id: string
          last_verified_at: string | null
          organization_id: string
          provider: string
          public_key: string | null
          secret_key_encrypted: string | null
          status: string
          updated_at: string
          webhook_secret_encrypted: string | null
        }
        Insert: {
          created_at?: string
          environment?: string
          id?: string
          last_verified_at?: string | null
          organization_id: string
          provider: string
          public_key?: string | null
          secret_key_encrypted?: string | null
          status?: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          id?: string
          last_verified_at?: string | null
          organization_id?: string
          provider?: string
          public_key?: string | null
          secret_key_encrypted?: string | null
          status?: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string | null
          provider_reference: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
          provider_reference?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_provider_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          notes: string | null
          organization_id: string
          payment_id: string
          provider: string | null
          provider_reference: string | null
          refund_date: string
          sale_return_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id: string
          payment_id: string
          provider?: string | null
          provider_reference?: string | null
          refund_date?: string
          sale_return_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id?: string
          payment_id?: string
          provider?: string | null
          provider_reference?: string | null
          refund_date?: string
          sale_return_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_returns_traceability_v1"
            referencedColumns: ["return_id"]
          },
          {
            foreignKeyName: "payment_refunds_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          created_at: string
          due_date: string
          expected_amount: number
          id: string
          installment_number: number
          organization_id: string
          paid_amount: number
          paid_at: string | null
          reminder_sent: boolean
          sale_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          expected_amount: number
          id?: string
          installment_number: number
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          reminder_sent?: boolean
          sale_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          expected_amount?: number
          id?: string
          installment_number?: number
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          reminder_sent?: boolean
          sale_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          external_event_id: string | null
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          id: string
          merchant_reference: string | null
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          prospecteur_id: string | null
          provider: string | null
          provider_reference: string | null
          provider_transaction_id: string | null
          recorded_by: string | null
          sale_id: string | null
          schedule_id: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_reference?: string | null
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          prospecteur_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string | null
          recorded_by?: string | null
          sale_id?: string | null
          schedule_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant_reference?: string | null
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          prospecteur_id?: string | null
          provider?: string | null
          provider_reference?: string | null
          provider_transaction_id?: string | null
          recorded_by?: string | null
          sale_id?: string | null
          schedule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "payments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_payment_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_language: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          preferred_language?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_language?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospect_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          created_by: string | null
          id: string
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id: string | null
          result: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id?: string | null
          result?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospect_activities_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string
          prospect_id: string
          prospecteur_id: string
          released_at: string | null
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id: string
          prospect_id: string
          prospecteur_id: string
          released_at?: string | null
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospect_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_followups: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id: string | null
          reminder_sent: boolean
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          prospect_id: string
          prospecteur_id?: string | null
          reminder_sent?: boolean
          scheduled_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          prospect_id?: string
          prospecteur_id?: string | null
          reminder_sent?: boolean
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_followups_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospect_followups_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          organization_id: string
          prospect_id: string
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id: string
          prospect_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id?: string
          prospect_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_status_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_status_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_followup_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_status_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospects_to_followup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_status_history_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_stock_holdings: {
        Row: {
          article_id: string
          created_at: string
          hard_due_at: string
          id: string
          notes: string | null
          organization_id: string
          prospecteur_id: string
          quantity: number
          remaining_quantity: number
          return_due_at: string
          returned_at: string | null
          sold_at: string | null
          status: string
          supplied_at: string
          supply_request_id: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          hard_due_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          prospecteur_id: string
          quantity: number
          remaining_quantity: number
          return_due_at?: string
          returned_at?: string | null
          sold_at?: string | null
          status?: string
          supplied_at?: string
          supply_request_id?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          hard_due_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          prospecteur_id?: string
          quantity?: number
          remaining_quantity?: number
          return_due_at?: string
          returned_at?: string | null
          sold_at?: string | null
          status?: string
          supplied_at?: string
          supply_request_id?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_stock_holdings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stock_holdings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stock_holdings_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospecteur_stock_holdings_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stock_holdings_supply_request_id_fkey"
            columns: ["supply_request_id"]
            isOneToOne: false
            referencedRelation: "prospecteur_supply_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stock_holdings_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_stocks: {
        Row: {
          article_id: string
          id: string
          organization_id: string
          prospecteur_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          article_id: string
          id?: string
          organization_id: string
          prospecteur_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          organization_id?: string
          prospecteur_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_supply_request_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          request_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          request_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_supply_request_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_supply_request_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_supply_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "prospecteur_supply_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_supply_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          processed_at: string | null
          processed_by: string | null
          prospecteur_id: string
          requested_at: string
          status: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          processed_at?: string | null
          processed_by?: string | null
          prospecteur_id: string
          requested_at?: string
          status?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          processed_at?: string | null
          processed_by?: string | null
          prospecteur_id?: string
          requested_at?: string
          status?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_supply_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_supply_requests_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospecteur_supply_requests_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_supply_requests_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteur_warehouse_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          city: string | null
          created_at: string
          department: string | null
          id: string
          is_primary: boolean
          organization_id: string
          prospecteur_id: string
          unassigned_at: string | null
          updated_at: string
          warehouse_id: string
          work_zone: string | null
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          city?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_primary?: boolean
          organization_id: string
          prospecteur_id: string
          unassigned_at?: string | null
          updated_at?: string
          warehouse_id: string
          work_zone?: string | null
        }
        Update: {
          active?: boolean
          assigned_at?: string
          city?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_primary?: boolean
          organization_id?: string
          prospecteur_id?: string
          unassigned_at?: string | null
          updated_at?: string
          warehouse_id?: string
          work_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_warehouse_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_warehouse_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospecteur_warehouse_assignments_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_warehouse_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecteurs: {
        Row: {
          address: string | null
          city: string | null
          code: string
          commission_payout_mode: string | null
          commission_rate: number | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          hired_at: string | null
          id: string
          last_name: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          commission_payout_mode?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          hired_at?: string | null
          id?: string
          last_name?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          commission_payout_mode?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          hired_at?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteurs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address: string | null
          archived_at: string | null
          category: string | null
          city: string | null
          client_id: string | null
          created_at: string
          desired_article: string | null
          desired_article_id: string | null
          duplicate_phone_flag: boolean | null
          duplicate_phone_of: string | null
          estimated_amount: number | null
          first_name: string
          id: string
          last_contact_at: string | null
          last_follow_up_at: string | null
          last_name: string | null
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          portfolio_id: string | null
          prospecteur_id: string | null
          purchase_date_planned: string | null
          status: string
          temperature: string | null
          updated_at: string
          visit_count: number
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          category?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          estimated_amount?: number | null
          first_name: string
          id?: string
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          purchase_date_planned?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          visit_count?: number
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          category?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          estimated_amount?: number | null
          first_name?: string
          id?: string
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          portfolio_id?: string | null
          prospecteur_id?: string | null
          purchase_date_planned?: string | null
          status?: string
          temperature?: string | null
          updated_at?: string
          visit_count?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "client_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          article_id: string
          created_at: string
          discount_amount: number
          id: string
          organization_id: string
          purchase_order_id: string
          quantity: number
          tax_amount: number
          total_amount: number
          unit_cost: number
        }
        Insert: {
          article_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          organization_id: string
          purchase_order_id: string
          quantity: number
          tax_amount?: number
          total_amount?: number
          unit_cost?: number
        }
        Update: {
          article_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          organization_id?: string
          purchase_order_id?: string
          quantity?: number
          tax_amount?: number
          total_amount?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          status: string
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          status?: string
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          article_id: string
          created_at: string
          discount_amount: number
          id: string
          line_total: number
          organization_id: string
          quantity: number
          sale_id: string
          unit_cash_price: number | null
          unit_credit_price: number | null
          unit_fixed_price: number | null
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          organization_id: string
          quantity?: number
          sale_id: string
          unit_cash_price?: number | null
          unit_credit_price?: number | null
          unit_fixed_price?: number | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number
          organization_id?: string
          quantity?: number
          sale_id?: string
          unit_cash_price?: number | null
          unit_credit_price?: number | null
          unit_fixed_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          amount_remaining: number
          article_id: string | null
          cash_price: number
          client_id: string | null
          client_location: string | null
          client_phone: string | null
          completed_at: string | null
          created_at: string
          credit_price: number
          deadline_date: string | null
          fixed_price: number
          id: string
          notes: string | null
          organization_id: string
          payment_amount: number
          payment_frequency: string | null
          prospecteur_id: string | null
          quantity: number
          sale_date: string
          sale_number: string
          sale_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          amount_remaining?: number
          article_id?: string | null
          cash_price?: number
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          credit_price?: number
          deadline_date?: string | null
          fixed_price?: number
          id?: string
          notes?: string | null
          organization_id: string
          payment_amount?: number
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number
          sale_date?: string
          sale_number: string
          sale_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          amount_remaining?: number
          article_id?: string | null
          cash_price?: number
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          completed_at?: string | null
          created_at?: string
          credit_price?: number
          deadline_date?: string | null
          fixed_price?: number
          id?: string
          notes?: string | null
          organization_id?: string
          payment_amount?: number
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number
          sale_date?: string
          sale_number?: string
          sale_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          article_code_snapshot: string | null
          article_id: string
          article_name_snapshot: string | null
          created_at: string
          id: string
          organization_id: string
          quantity: number
          refund_amount: number
          return_id: string
          serial_number_id: string | null
        }
        Insert: {
          article_code_snapshot?: string | null
          article_id: string
          article_name_snapshot?: string | null
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          refund_amount?: number
          return_id: string
          serial_number_id?: string | null
        }
        Update: {
          article_code_snapshot?: string | null
          article_id?: string
          article_name_snapshot?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          refund_amount?: number
          return_id?: string
          serial_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_returns_traceability_v1"
            referencedColumns: ["return_id"]
          },
          {
            foreignKeyName: "sales_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          reason: string | null
          received_at: string | null
          received_by_user_id: string | null
          refund_amount: number
          return_date: string
          return_number: string
          returned_by_name: string | null
          returned_by_role: string | null
          returned_by_user_id: string | null
          sale_id: string
          status: string
          subwarehouse_id: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          received_at?: string | null
          received_by_user_id?: string | null
          refund_amount?: number
          return_date?: string
          return_number: string
          returned_by_name?: string | null
          returned_by_role?: string | null
          returned_by_user_id?: string | null
          sale_id: string
          status?: string
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          received_at?: string | null
          received_by_user_id?: string | null
          refund_amount?: number
          return_date?: string
          return_number?: string
          returned_by_name?: string | null
          returned_by_role?: string | null
          returned_by_user_id?: string | null
          sale_id?: string
          status?: string
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sales_returns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          article_id: string
          client_id: string | null
          created_at: string
          id: string
          organization_id: string
          purchase_order_id: string | null
          sale_id: string | null
          serial_number: string
          status: string
          updated_at: string
        }
        Insert: {
          article_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          purchase_order_id?: string | null
          sale_id?: string | null
          serial_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          purchase_order_id?: string | null
          sale_id?: string | null
          serial_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "serial_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          article_id: string
          created_at: string
          created_by: string | null
          destination_location: string | null
          destination_subwarehouse_id: string | null
          id: string
          movement_type: string
          notes: string | null
          organization_id: string
          prospecteur_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          source_location: string | null
          source_subwarehouse_id: string | null
          unit_price: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          destination_subwarehouse_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          organization_id: string
          prospecteur_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          source_location?: string | null
          source_subwarehouse_id?: string | null
          unit_price?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          created_by?: string | null
          destination_location?: string | null
          destination_subwarehouse_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          prospecteur_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          source_location?: string | null
          source_subwarehouse_id?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_destination_subwarehouse_id_fkey"
            columns: ["destination_subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "stock_movements_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_source_subwarehouse_id_fkey"
            columns: ["source_subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          received_quantity: number
          transfer_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          received_quantity?: number
          transfer_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          received_quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          destination_warehouse_id: string
          id: string
          notes: string | null
          organization_id: string
          received_by: string | null
          source_warehouse_id: string
          status: string
          transfer_date: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id: string
          id?: string
          notes?: string | null
          organization_id: string
          received_by?: string | null
          source_warehouse_id: string
          status?: string
          transfer_date?: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          received_by?: string | null
          source_warehouse_id?: string
          status?: string
          transfer_date?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          provider: string | null
          provider_reference: string | null
          subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
          provider?: string | null
          provider_reference?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          provider?: string | null
          provider_reference?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_limits: {
        Row: {
          created_at: string
          id: string
          limit_value: number | null
          plan_id: string
          resource_code: string
          unlimited: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          limit_value?: number | null
          plan_id: string
          resource_code: string
          unlimited?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          limit_value?: number | null
          plan_id?: string
          resource_code?: string
          unlimited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subscription_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          billing_amount_xof: number | null
          code: string
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          features: Json
          id: string
          max_admins: number | null
          max_clients: number | null
          max_prospecteurs: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_amount_xof?: number | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days: number
          features?: Json
          id?: string
          max_admins?: number | null
          max_clients?: number | null
          max_prospecteurs?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_amount_xof?: number | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          max_admins?: number | null
          max_clients?: number | null
          max_prospecteurs?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      super_admin_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_code: string
          module_name: string
          subscription_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_code: string
          module_name: string
          subscription_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_code?: string
          module_name?: string
          subscription_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          actif: boolean | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          purchase_order_id: string | null
          recorded_by: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          provider?: string | null
          provider_reference?: string | null
          purchase_order_id?: string | null
          recorded_by?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_name: string
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          phone: string | null
          registration_number: string | null
          status: string
          tax_number: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_name: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          phone?: string | null
          registration_number?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_sessions: {
        Row: {
          action_count: number
          ended_at: string | null
          id: string
          last_action_at: string
          last_route: string | null
          last_seen_at: string
          metadata: Json
          organization_id: string
          prospecteur_id: string | null
          role: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          action_count?: number
          ended_at?: string | null
          id?: string
          last_action_at?: string
          last_route?: string | null
          last_seen_at?: string
          metadata?: Json
          organization_id: string
          prospecteur_id?: string | null
          role?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          action_count?: number
          ended_at?: string | null
          id?: string
          last_action_at?: string
          last_route?: string | null
          last_seen_at?: string
          metadata?: Json
          organization_id?: string
          prospecteur_id?: string | null
          role?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_sessions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "user_activity_sessions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      warehouse_day_closures: {
        Row: {
          closed_at: string
          closed_by: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          service_date: string
          snapshot: Json
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          service_date: string
          snapshot: Json
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          service_date?: string
          snapshot?: Json
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_day_closures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_day_closures_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory: {
        Row: {
          article_id: string
          id: string
          minimum_quantity: number
          organization_id: string
          quantity: number
          reserved_quantity: number
          subwarehouse_id: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id: string
          id?: string
          minimum_quantity?: number
          organization_id: string
          quantity?: number
          reserved_quantity?: number
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string
          id?: string
          minimum_quantity?: number
          organization_id?: string
          quantity?: number
          reserved_quantity?: number
          subwarehouse_id?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_managers: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          organization_id: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_managers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_managers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock_daily_closure_lines: {
        Row: {
          article_id: string
          closing_quantity: number
          closure_id: string
          created_at: string
          entry_quantity: number
          exit_quantity: number
          id: string
          movement_count: number
          opening_quantity: number
          organization_id: string
          physical_quantity: number | null
          theoretical_value: number
          unit_price: number
          variance_quantity: number | null
          variance_value: number | null
          warehouse_id: string
        }
        Insert: {
          article_id: string
          closing_quantity?: number
          closure_id: string
          created_at?: string
          entry_quantity?: number
          exit_quantity?: number
          id?: string
          movement_count?: number
          opening_quantity?: number
          organization_id: string
          physical_quantity?: number | null
          theoretical_value?: number
          unit_price?: number
          variance_quantity?: number | null
          variance_value?: number | null
          warehouse_id: string
        }
        Update: {
          article_id?: string
          closing_quantity?: number
          closure_id?: string
          created_at?: string
          entry_quantity?: number
          exit_quantity?: number
          id?: string
          movement_count?: number
          opening_quantity?: number
          organization_id?: string
          physical_quantity?: number | null
          theoretical_value?: number
          unit_price?: number
          variance_quantity?: number | null
          variance_value?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_daily_closure_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_daily_closure_lines_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "warehouse_stock_daily_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_daily_closure_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_daily_closure_lines_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock_daily_closures: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_units: number
          created_at: string
          exercise_date: string
          id: string
          movement_count: number
          notes: string | null
          opened_at: string
          opening_units: number
          organization_id: string
          physical_value: number | null
          reopened_at: string | null
          reopened_by: string | null
          status: string
          theoretical_value: number
          total_entries: number
          total_exits: number
          updated_at: string
          variance_units: number | null
          variance_value: number | null
          warehouse_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_units?: number
          created_at?: string
          exercise_date: string
          id?: string
          movement_count?: number
          notes?: string | null
          opened_at?: string
          opening_units?: number
          organization_id: string
          physical_value?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: string
          theoretical_value?: number
          total_entries?: number
          total_exits?: number
          updated_at?: string
          variance_units?: number | null
          variance_value?: number | null
          warehouse_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_units?: number
          created_at?: string
          exercise_date?: string
          id?: string
          movement_count?: number
          notes?: string | null
          opened_at?: string
          opening_units?: number
          organization_id?: string
          physical_value?: number | null
          reopened_at?: string | null
          reopened_by?: string | null
          status?: string
          theoretical_value?: number
          total_entries?: number
          total_exits?: number
          updated_at?: string
          variance_units?: number | null
          variance_value?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_daily_closures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_daily_closures_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_subwarehouse_daily_closure_lines: {
        Row: {
          article_id: string
          closing_quantity: number
          closure_id: string
          entry_quantity: number
          exit_quantity: number
          id: string
          movement_count: number
          opening_quantity: number
          organization_id: string
          physical_quantity: number | null
          subwarehouse_id: string
          theoretical_value: number
          unit_price: number
          variance_quantity: number | null
          variance_value: number | null
          warehouse_id: string
        }
        Insert: {
          article_id: string
          closing_quantity?: number
          closure_id: string
          entry_quantity?: number
          exit_quantity?: number
          id?: string
          movement_count?: number
          opening_quantity?: number
          organization_id: string
          physical_quantity?: number | null
          subwarehouse_id: string
          theoretical_value?: number
          unit_price?: number
          variance_quantity?: number | null
          variance_value?: number | null
          warehouse_id: string
        }
        Update: {
          article_id?: string
          closing_quantity?: number
          closure_id?: string
          entry_quantity?: number
          exit_quantity?: number
          id?: string
          movement_count?: number
          opening_quantity?: number
          organization_id?: string
          physical_quantity?: number | null
          subwarehouse_id?: string
          theoretical_value?: number
          unit_price?: number
          variance_quantity?: number | null
          variance_value?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closure_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closure_lines_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouse_daily_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closure_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closure_lines_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closure_lines_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_subwarehouse_daily_closures: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_units: number
          created_at: string
          exercise_date: string
          id: string
          movement_count: number
          notes: string | null
          opening_units: number
          organization_id: string
          physical_value: number | null
          status: string
          subwarehouse_id: string
          theoretical_value: number
          total_entries: number
          total_exits: number
          updated_at: string
          variance_units: number | null
          variance_value: number | null
          warehouse_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_units?: number
          created_at?: string
          exercise_date: string
          id?: string
          movement_count?: number
          notes?: string | null
          opening_units?: number
          organization_id: string
          physical_value?: number | null
          status?: string
          subwarehouse_id: string
          theoretical_value?: number
          total_entries?: number
          total_exits?: number
          updated_at?: string
          variance_units?: number | null
          variance_value?: number | null
          warehouse_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_units?: number
          created_at?: string
          exercise_date?: string
          id?: string
          movement_count?: number
          notes?: string | null
          opening_units?: number
          organization_id?: string
          physical_value?: number | null
          status?: string
          subwarehouse_id?: string
          theoretical_value?: number
          total_entries?: number
          total_exits?: number
          updated_at?: string
          variance_units?: number | null
          variance_value?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closures_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouse_daily_closures_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_subwarehouses: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          manager_user_id: string | null
          name: string
          organization_id: string
          parent_warehouse_id: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          organization_id: string
          parent_warehouse_id: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
          organization_id?: string
          parent_warehouse_id?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_subwarehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_subwarehouses_parent_warehouse_id_fkey"
            columns: ["parent_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_supply_request_items: {
        Row: {
          article_id: string
          created_at: string
          id: string
          organization_id: string
          quantity: number
          received_quantity: number
          request_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          received_quantity?: number
          request_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          received_quantity?: number
          request_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_supply_request_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_supply_request_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_supply_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "warehouse_supply_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_supply_request_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_supply_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          requested_at: string
          requested_by: string | null
          response_notes: string | null
          status: string
          supplier_id: string | null
          target: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string
          requested_by?: string | null
          response_notes?: string | null
          status?: string
          supplier_id?: string | null
          target: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string
          requested_by?: string | null
          response_notes?: string | null
          status?: string
          supplier_id?: string | null
          target?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_supply_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_supply_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_supply_requests_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_ticket_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          organization_id: string
          ticket_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          organization_id: string
          ticket_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          organization_id?: string
          ticket_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_ticket_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "warehouse_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_ticket_notes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_tickets: {
        Row: {
          article_id: string | null
          assigned_to: string | null
          caller_name: string | null
          caller_phone: string | null
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: string
          organization_id: string
          priority: string
          prospecteur_id: string | null
          resolution: string | null
          resolved_at: string | null
          sale_id: string | null
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          article_id?: string | null
          assigned_to?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          organization_id: string
          priority?: string
          prospecteur_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          article_id?: string | null
          assigned_to?: string | null
          caller_name?: string | null
          caller_phone?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          organization_id?: string
          priority?: string
          prospecteur_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_tickets_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_tickets_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "warehouse_tickets_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_tickets_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_tickets_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_tickets_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_users_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          id: string
          manager_user_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          id?: string
          manager_user_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          id?: string
          manager_user_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      jdv_super_admin_modules: {
        Row: {
          enabled: boolean | null
          id: string | null
          module_code: string | null
          module_name: string | null
          subscription_required: boolean | null
        }
        Insert: {
          enabled?: boolean | null
          id?: string | null
          module_code?: string | null
          module_name?: string | null
          subscription_required?: boolean | null
        }
        Update: {
          enabled?: boolean | null
          id?: string | null
          module_code?: string | null
          module_name?: string | null
          subscription_required?: boolean | null
        }
        Relationships: []
      }
      jdvcrm_clients_overdue: {
        Row: {
          address: string | null
          city: string | null
          client_id: string | null
          code: string | null
          first_name: string | null
          last_name: string | null
          organization_id: string | null
          phone: string | null
          prospecteur_id: string | null
          whatsapp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_clients_to_reactivate: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          identity_reference: string | null
          last_activity_at: string | null
          last_contact_at: string | null
          last_name: string | null
          last_payment_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          prospecteur_id: string | null
          status: string | null
          temperature: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          identity_reference?: string | null
          last_activity_at?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          last_payment_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "clients_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_collections_monthly_v1: {
        Row: {
          collected_total: number | null
          month: string | null
          organization_id: string | null
          payment_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_commissions_monthly_v1: {
        Row: {
          commission_paid: number | null
          commission_total: number | null
          commission_unpaid: number | null
          month: string | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_financial_kpi_monthly_v1: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          month: string | null
          organization_id: string | null
          sales_count: number | null
          sales_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_followup_queue: {
        Row: {
          days_without_contact: number | null
          first_name: string | null
          id: string | null
          last_contact_at: string | null
          last_follow_up_at: string | null
          last_name: string | null
          next_follow_up_at: string | null
          organization_id: string | null
          phone: string | null
          prospecteur_id: string | null
          status: string | null
          temperature: string | null
        }
        Insert: {
          days_without_contact?: never
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
        }
        Update: {
          days_without_contact?: never
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_low_stocks: {
        Row: {
          article_id: string | null
          available_quantity: number | null
          id: string | null
          minimum_quantity: number | null
          organization_id: string | null
          quantity: number | null
          reserved_quantity: number | null
        }
        Insert: {
          article_id?: string | null
          available_quantity?: never
          id?: string | null
          minimum_quantity?: number | null
          organization_id?: string | null
          quantity?: number | null
          reserved_quantity?: number | null
        }
        Update: {
          article_id?: string | null
          available_quantity?: never
          id?: string | null
          minimum_quantity?: number | null
          organization_id?: string | null
          quantity?: number | null
          reserved_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_overdue_credit_sales: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          article_id: string | null
          cash_price: number | null
          client_id: string | null
          client_location: string | null
          client_phone: string | null
          credit_price: number | null
          days_overdue: number | null
          deadline_date: string | null
          fixed_price: number | null
          id: string | null
          organization_id: string | null
          payment_amount: number | null
          payment_frequency: string | null
          prospecteur_id: string | null
          quantity: number | null
          sale_date: string | null
          sale_number: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_remaining?: number | null
          article_id?: string | null
          cash_price?: number | null
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          credit_price?: number | null
          days_overdue?: never
          deadline_date?: string | null
          fixed_price?: number | null
          id?: string | null
          organization_id?: string | null
          payment_amount?: number | null
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          sale_number?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_remaining?: number | null
          article_id?: string | null
          cash_price?: number | null
          client_id?: string | null
          client_location?: string | null
          client_phone?: string | null
          credit_price?: number | null
          days_overdue?: never
          deadline_date?: string | null
          fixed_price?: number | null
          id?: string | null
          organization_id?: string | null
          payment_amount?: number | null
          payment_frequency?: string | null
          prospecteur_id?: string | null
          quantity?: number | null
          sale_date?: string | null
          sale_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_overdue_payment_schedules: {
        Row: {
          created_at: string | null
          due_date: string | null
          expected_amount: number | null
          id: string | null
          installment_number: number | null
          organization_id: string | null
          paid_amount: number | null
          remaining_amount: number | null
          reminder_sent: boolean | null
          sale_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          expected_amount?: number | null
          id?: string | null
          installment_number?: number | null
          organization_id?: string | null
          paid_amount?: number | null
          remaining_amount?: never
          reminder_sent?: boolean | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          expected_amount?: number | null
          id?: string | null
          installment_number?: number | null
          organization_id?: string | null
          paid_amount?: number | null
          remaining_amount?: never
          reminder_sent?: boolean | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_pending_commissions: {
        Row: {
          article_id: string | null
          base_amount: number | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          id: string | null
          organization_id: string | null
          paid_at: string | null
          payment_id: string | null
          prospecteur_id: string | null
          sale_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          article_id?: string | null
          base_amount?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string | null
          base_amount?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          prospecteur_id?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "commissions_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_prospecteur_followup_queue: {
        Row: {
          address: string | null
          city: string | null
          days_without_contact: number | null
          desired_article: string | null
          desired_article_id: string | null
          first_name: string | null
          id: string | null
          last_contact_at: string | null
          last_follow_up_at: string | null
          last_name: string | null
          next_follow_up_at: string | null
          organization_id: string | null
          phone: string | null
          prospecteur_id: string | null
          temperature: string | null
          visit_count: number | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          days_without_contact?: never
          desired_article?: string | null
          desired_article_id?: string | null
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          temperature?: string | null
          visit_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          days_without_contact?: never
          desired_article?: string | null
          desired_article_id?: string | null
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          temperature?: string | null
          visit_count?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_prospecteur_management_v1: {
        Row: {
          city: string | null
          code: string | null
          commission_payout_mode: string | null
          commissions_approved: number | null
          commissions_cancelled_count: number | null
          commissions_paid: number | null
          commissions_pending: number | null
          department: string | null
          full_name: string | null
          hired_at: string | null
          organization_id: string | null
          overdue_holdings: number | null
          personal_commission_rate: number | null
          phone: string | null
          prospecteur_id: string | null
          returns_count: number | null
          sales_amount: number | null
          sales_count: number | null
          specific_rules_count: number | null
          status: string | null
          stock_units_held: number | null
          warehouse_city: string | null
          warehouse_id: string | null
          warehouse_name: string | null
          work_zone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_warehouse_assignments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteurs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_prospecteur_stock_status: {
        Row: {
          article_id: string | null
          id: string | null
          organization_id: string | null
          prospecteur_code: string | null
          prospecteur_first_name: string | null
          prospecteur_id: string | null
          prospecteur_last_name: string | null
          quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecteur_stocks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospecteur_stocks_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_prospects_to_followup: {
        Row: {
          address: string | null
          archived_at: string | null
          city: string | null
          client_id: string | null
          created_at: string | null
          desired_article: string | null
          desired_article_id: string | null
          duplicate_phone_flag: boolean | null
          duplicate_phone_of: string | null
          first_name: string | null
          id: string | null
          last_contact_at: string | null
          last_follow_up_at: string | null
          last_name: string | null
          next_follow_up_at: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          prospecteur_id: string | null
          status: string | null
          temperature: string | null
          updated_at: string | null
          visit_count: number | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
          updated_at?: string | null
          visit_count?: number | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          desired_article?: string | null
          desired_article_id?: string | null
          duplicate_phone_flag?: boolean | null
          duplicate_phone_of?: string | null
          first_name?: string | null
          id?: string | null
          last_contact_at?: string | null
          last_follow_up_at?: string | null
          last_name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          prospecteur_id?: string | null
          status?: string | null
          temperature?: string | null
          updated_at?: string | null
          visit_count?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_overdue"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_clients_to_reactivate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "prospects_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_returns_traceability_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          organization_id: string | null
          prospecteur_id: string | null
          quantity: number | null
          reason: string | null
          received_at: string | null
          received_by_user_id: string | null
          refund_amount: number | null
          return_date: string | null
          return_id: string | null
          return_item_id: string | null
          return_number: string | null
          returned_by_name: string | null
          returned_by_role: string | null
          returned_by_user_id: string | null
          sale_id: string | null
          status: string | null
          subwarehouse_code: string | null
          subwarehouse_id: string | null
          subwarehouse_name: string | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "sales_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_overdue_credit_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_stock_journal_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          created_by: string | null
          from_section: string | null
          movement_id: string | null
          movement_label: string | null
          movement_type: string | null
          notes: string | null
          occurred_at: string | null
          organization_id: string | null
          prospecteur_id: string | null
          prospecteur_name: string | null
          quantity: number | null
          reference_id: string | null
          reference_type: string | null
          to_section: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "jdvcrm_prospecteur_management_v1"
            referencedColumns: ["prospecteur_id"]
          },
          {
            foreignKeyName: "stock_movements_prospecteur_id_fkey"
            columns: ["prospecteur_id"]
            isOneToOne: false
            referencedRelation: "prospecteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_stock_recap_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          dernier_mouvement: string | null
          organization_id: string | null
          section: string | null
          solde: number | null
          total_entrees: number | null
          total_sorties: number | null
        }
        Relationships: []
      }
      jdvcrm_subwarehouse_stock_ledger_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          created_by: string | null
          entry_quantity: number | null
          exit_quantity: number | null
          movement_amount: number | null
          movement_id: string | null
          movement_label: string | null
          movement_type: string | null
          notes: string | null
          occurred_at: string | null
          organization_id: string | null
          reference_id: string | null
          reference_type: string | null
          stock_after: number | null
          stock_before: number | null
          stock_value_after: number | null
          subwarehouse_code: string | null
          subwarehouse_id: string | null
          subwarehouse_name: string | null
          unit_price: number | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_subwarehouse_stock_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          inventory_id: string | null
          minimum_quantity: number | null
          organization_id: string | null
          quantity: number | null
          reserved_quantity: number | null
          subwarehouse_code: string | null
          subwarehouse_id: string | null
          subwarehouse_name: string | null
          updated_at: string | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_subwarehouse_id_fkey"
            columns: ["subwarehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse_subwarehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      jdvcrm_warehouse_stock_ledger_v1: {
        Row: {
          article_code: string | null
          article_id: string | null
          article_name: string | null
          created_by: string | null
          entry_quantity: number | null
          exit_quantity: number | null
          movement_amount: number | null
          movement_id: string | null
          movement_label: string | null
          movement_type: string | null
          notes: string | null
          occurred_at: string | null
          organization_id: string | null
          reference_id: string | null
          reference_type: string | null
          stock_after: number | null
          stock_before: number | null
          stock_value_after: number | null
          unit_price: number | null
          warehouse_code: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_organization_access: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      create_company_onboarding: {
        Args: {
          p_address: string
          p_city: string
          p_company_name: string
          p_country: string
          p_email: string
          p_first_name: string
          p_industry: string
          p_last_name: string
          p_legal_name: string
          p_phone: string
          p_plan_code: string
          p_team_size: string
          p_user_id: string
          p_website: string
        }
        Returns: string
      }
      ensure_organization_personalization: {
        Args: { p_organization_id: string }
        Returns: string
      }
      generate_client_code: { Args: never; Returns: string }
      generate_prospecteur_code: { Args: never; Returns: string }
      jdv_archive_inactive_clients: { Args: never; Returns: number }
      jdv_business_integrity_report: { Args: never; Returns: Json }
      jdv_process_prospect_followups: { Args: never; Returns: number }
      jdv_run_daily_business_maintenance: { Args: never; Returns: Json }
      jdvcrm_activate_subscription_v1: {
        Args: {
          p_provider?: string
          p_provider_reference?: string
          p_started_at?: string
          p_subscription_id: string
        }
        Returns: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          organization_id: string
          plan_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jdvcrm_admin_stock_entry_v1: {
        Args: {
          p_article_id: string
          p_minimum_quantity?: number
          p_notes?: string
          p_organization_id: string
          p_quantity: number
        }
        Returns: Json
      }
      jdvcrm_admin_supply_warehouse_v1: {
        Args: {
          p_article_id: string
          p_minimum_quantity?: number
          p_notes?: string
          p_organization_id: string
          p_quantity: number
          p_warehouse_id: string
        }
        Returns: Json
      }
      jdvcrm_apply_sale_commissions_v1: {
        Args: { p_sale_id: string }
        Returns: Json
      }
      jdvcrm_approve_prospecteur_supply_v1: {
        Args: { p_request_id: string }
        Returns: Json
      }
      jdvcrm_archive_cold_clients: { Args: never; Returns: number }
      jdvcrm_archive_inactive_clients: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_archive_inactive_clients_v1: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_archive_old_prospects: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_archive_old_prospects_v1: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_assign_prospecteur_warehouse_v1: {
        Args: {
          p_city?: string
          p_department?: string
          p_organization_id: string
          p_prospecteur_id: string
          p_warehouse_id: string
          p_work_zone?: string
        }
        Returns: Json
      }
      jdvcrm_calculate_sale_commissions_v1: {
        Args: { p_sale_id: string }
        Returns: Json
      }
      jdvcrm_cancel_purchase_order_v1: {
        Args: { p_purchase_order_id: string }
        Returns: Json
      }
      jdvcrm_cancel_return_commissions_v1: {
        Args: { p_return_id: string }
        Returns: number
      }
      jdvcrm_check_subscription_limit_v1: {
        Args: { p_organization_id: string; p_resource_code: string }
        Returns: {
          allowed: boolean
          current_count: number
          limit_value: number
          plan_code: string
          reason: string
          resource_code: string
          subscription_status: string
          unlimited: boolean
        }[]
      }
      jdvcrm_close_warehouse_day_v1: {
        Args: { p_date?: string; p_notes?: string; p_warehouse_id: string }
        Returns: Json
      }
      jdvcrm_confirm_subscription_payment_v1: {
        Args: {
          p_amount: number
          p_currency: string
          p_metadata?: Json
          p_payment_method?: string
          p_provider: string
          p_provider_reference: string
          p_subscription_id: string
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "subscription_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jdvcrm_convert_prospect_to_client_v1: {
        Args: { p_prospect_id: string }
        Returns: string
      }
      jdvcrm_create_followup_notifications: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_create_purchase_order_v1: {
        Args: {
          p_expected_date: string
          p_items: Json
          p_notes: string
          p_supplier_id: string
        }
        Returns: Json
      }
      jdvcrm_create_sale_return_v1: {
        Args: { p_items?: Json; p_reason?: string; p_sale_id: string }
        Returns: Json
      }
      jdvcrm_create_unpaid_followup_reminders_v1: {
        Args: { p_organization_id: string }
        Returns: number
      }
      jdvcrm_create_warehouse_v1: {
        Args: {
          p_address?: string
          p_city?: string
          p_code: string
          p_country?: string
          p_name: string
          p_organization_id: string
        }
        Returns: Json
      }
      jdvcrm_daily_maintenance_v41: { Args: never; Returns: Json }
      jdvcrm_ensure_my_portfolio_v1: {
        Args: { p_organization_id: string }
        Returns: string
      }
      jdvcrm_expire_subscriptions_v1: { Args: never; Returns: number }
      jdvcrm_finalize_company_application_v1: {
        Args: { p_application_id: string }
        Returns: {
          organization_id: string
          status: string
          trial_expires_at: string
        }[]
      }
      jdvcrm_financial_dashboard_by_prospecteur_v1: {
        Args: {
          p_end_date?: string
          p_organization_id: string
          p_start_date?: string
        }
        Returns: {
          collected: number
          commission_paid: number
          commission_total: number
          commission_unpaid: number
          outstanding: number
          prospecteur_id: string
          sales_count: number
          sales_total: number
        }[]
      }
      jdvcrm_financial_dashboard_v1: {
        Args: {
          p_end_date?: string
          p_organization_id: string
          p_start_date?: string
        }
        Returns: Json
      }
      jdvcrm_generate_followup_notifications: { Args: never; Returns: number }
      jdvcrm_generate_sale_schedules_v42: {
        Args: { p_sale_id: string }
        Returns: number
      }
      jdvcrm_get_business_access_v1: {
        Args: { p_organization_id?: string }
        Returns: Json
      }
      jdvcrm_get_concepteur_workspace_v1: {
        Args: never
        Returns: {
          branch_code: string
          branch_label: string
          is_own_company: boolean
          organization_id: string
          organization_name: string
          route: string
          subscription_required: boolean
        }[]
      }
      jdvcrm_get_current_subscription_v1: {
        Args: { p_organization_id: string }
        Returns: {
          auto_renew: boolean
          expires_at: string
          is_effectively_active: boolean
          organization_id: string
          plan_code: string
          plan_id: string
          plan_name: string
          started_at: string
          status: string
          subscription_id: string
        }[]
      }
      jdvcrm_get_documents_to_review_v1: {
        Args: never
        Returns: {
          application_id: string
          company_name: string
          created_at: string
          document_id: string
          document_name: string
          document_type: string
          storage_path: string
        }[]
      }
      jdvcrm_get_inactive_clients: {
        Args: { p_organization_id: string }
        Returns: {
          client_id: string
          days_without_activity: number
          first_name: string
          last_activity_at: string
          last_name: string
          phone: string
          prospecteur_id: string
          temperature: string
        }[]
      }
      jdvcrm_get_payment_followups_v43: {
        Args: { p_organization_id: string }
        Returns: {
          client_id: string
          due_date: string
          expected_amount: number
          installment_number: number
          paid_amount: number
          remaining_amount: number
          sale_id: string
          schedule_id: string
          status: string
        }[]
      }
      jdvcrm_get_payment_followups_v44: {
        Args: { p_organization_id: string }
        Returns: {
          client_id: string
          client_name: string
          client_phone: string
          days_late: number
          due_date: string
          expected_amount: number
          installment_number: number
          paid_amount: number
          prospecteur_id: string
          remaining_amount: number
          sale_id: string
          schedule_id: string
          status: string
        }[]
      }
      jdvcrm_get_pending_company_applications_v1: {
        Args: never
        Returns: {
          analysis_score: number
          analysis_status: string
          application_id: string
          city: string
          company_name: string
          company_nature: string
          company_size: string
          country: string
          created_at: string
          legal_form: string
          legal_name: string
          legal_status: string
          professional_email: string
          sector_name: string
          status: string
        }[]
      }
      jdvcrm_get_platform_companies_v1: {
        Args: never
        Returns: {
          auto_renew: boolean
          city: string
          days_remaining: number
          expires_at: string
          last_payment_at: string
          last_payment_status: string
          organization_id: string
          organization_name: string
          organization_status: string
          phone: string
          plan_code: string
          plan_currency: string
          plan_name: string
          plan_price: number
          started_at: string
          subscription_status: string
        }[]
      }
      jdvcrm_get_prospects_to_follow_up: {
        Args: { p_organization_id: string }
        Returns: {
          days_without_contact: number
          first_name: string
          last_contact_at: string
          last_name: string
          next_follow_up_at: string
          phone: string
          prospect_id: string
          prospecteur_id: string
          temperature: string
        }[]
      }
      jdvcrm_integrity_report: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      jdvcrm_mark_commission_payout_result_v1: {
        Args: {
          p_failure_reason?: string
          p_payout_id: string
          p_provider_id?: string
          p_reference?: string
          p_status: string
        }
        Returns: {
          amount: number
          commission_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          organization_id: string
          paid_at: string | null
          payout_mode: string | null
          phone_number: string
          prospecteur_id: string
          provider: string
          provider_payout_id: string | null
          provider_reference: string | null
          requested_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "commission_payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jdvcrm_mark_late_schedules_v43: { Args: never; Returns: number }
      jdvcrm_mark_late_schedules_v44: { Args: never; Returns: number }
      jdvcrm_my_company_validation_v1: {
        Args: { p_application_id: string }
        Returns: Json
      }
      jdvcrm_my_warehouses_v1: {
        Args: never
        Returns: {
          access_role: string
          active: boolean
          city: string
          code: string
          name: string
          organization_id: string
          warehouse_id: string
        }[]
      }
      jdvcrm_normalize_phone: { Args: { p_phone: string }; Returns: string }
      jdvcrm_overdue_notifications_v41: { Args: never; Returns: number }
      jdvcrm_pay_purchase_order_v1: {
        Args: {
          p_amount: number
          p_method: string
          p_notes: string
          p_purchase_order_id: string
          p_reference: string
        }
        Returns: Json
      }
      jdvcrm_platform_review_company_application_v1: {
        Args: { p_application_id: string; p_decision: string; p_notes?: string }
        Returns: boolean
      }
      jdvcrm_platform_set_auto_renew_v1: {
        Args: { p_auto_renew: boolean; p_organization_id: string }
        Returns: Json
      }
      jdvcrm_platform_subscription_guard_v1: { Args: never; Returns: number }
      jdvcrm_platform_subscription_reminder_v1: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      jdvcrm_platform_suspend_organization_v1: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      jdvcrm_prepare_subscription_payment_v1: {
        Args: { p_organization_id: string; p_plan_code: string }
        Returns: {
          amount: number
          currency: string
          payment_id: string
          plan_code: string
          plan_name: string
          subscription_id: string
        }[]
      }
      jdvcrm_process_goods_receipt_v1: {
        Args: { p_receipt_id: string }
        Returns: Json
      }
      jdvcrm_process_payment_v43: {
        Args: { p_payment_id: string }
        Returns: Json
      }
      jdvcrm_process_sale_return: {
        Args: { p_return_id: string }
        Returns: boolean
      }
      jdvcrm_process_sale_stock_v42: {
        Args: { p_sale_id: string }
        Returns: boolean
      }
      jdvcrm_process_sale_v42: { Args: { p_sale_id: string }; Returns: Json }
      jdvcrm_process_subscription_webhook_v1: {
        Args: {
          p_amount: number
          p_currency: string
          p_event_type: string
          p_external_event_id: string
          p_payload?: Json
          p_payment_method?: string
          p_provider: string
          p_provider_reference: string
          p_subscription_id: string
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "subscription_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jdvcrm_process_supplier_payment_v1: {
        Args: { p_payment_id: string }
        Returns: Json
      }
      jdvcrm_rate_limit_check_v1: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_at: string
        }[]
      }
      jdvcrm_recalculate_sale: { Args: { p_sale_id: string }; Returns: number }
      jdvcrm_receive_purchase_order_v1: {
        Args: { p_items: Json; p_notes: string; p_purchase_order_id: string }
        Returns: Json
      }
      jdvcrm_receive_stock_transfer_v1: {
        Args: { p_transfer_id: string }
        Returns: boolean
      }
      jdvcrm_refresh_client_activity_v41: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      jdvcrm_refresh_overdue_schedules_v41: { Args: never; Returns: number }
      jdvcrm_refresh_payment_schedule: {
        Args: { p_sale_id: string }
        Returns: undefined
      }
      jdvcrm_refresh_sale_schedules_v43: {
        Args: { p_sale_id: string }
        Returns: number
      }
      jdvcrm_refresh_schedule_v41: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      jdvcrm_refresh_schedule_v43: {
        Args: { p_schedule_id: string }
        Returns: undefined
      }
      jdvcrm_report_commissions_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          article_id: string
          base_amount: number
          commission_amount: number
          commission_id: string
          paid_at: string
          prospecteur_id: string
          rate: number
          sale_id: string
          status: string
        }[]
      }
      jdvcrm_report_overdue_v1: {
        Args: { p_organization_id: string }
        Returns: {
          client_id: string
          days_late: number
          due_date: string
          expected_amount: number
          paid_amount: number
          remaining_amount: number
          sale_id: string
          schedule_id: string
          status: string
        }[]
      }
      jdvcrm_report_payments_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          amount: number
          client_id: string
          currency: string
          payment_date: string
          payment_id: string
          payment_method: string
          prospecteur_id: string
          provider: string
          sale_id: string
          status: string
        }[]
      }
      jdvcrm_report_sales_v1: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: {
          amount_paid: number
          amount_remaining: number
          client_id: string
          prospecteur_id: string
          quantity: number
          sale_date: string
          sale_number: string
          sale_type: string
          status: string
          total_amount: number
        }[]
      }
      jdvcrm_request_prospecteur_supply_v1: {
        Args: { p_items: Json; p_warehouse_id: string }
        Returns: Json
      }
      jdvcrm_respond_warehouse_supply_v1: {
        Args: { p_decision: string; p_notes?: string; p_request_id: string }
        Returns: Json
      }
      jdvcrm_restore_holdings_after_return_v1: {
        Args: { p_return_id: string }
        Returns: undefined
      }
      jdvcrm_return_prospecteur_stock_v1: {
        Args: { p_holding_id: string }
        Returns: Json
      }
      jdvcrm_review_application_document_v1: {
        Args: { p_decision: string; p_document_id: string; p_reason?: string }
        Returns: boolean
      }
      jdvcrm_run_daily_automations: { Args: never; Returns: Json }
      jdvcrm_run_intelligence_scan_v1: { Args: never; Returns: Json }
      jdvcrm_run_maintenance: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      jdvcrm_send_stock_transfer_v1: {
        Args: { p_transfer_id: string }
        Returns: boolean
      }
      jdvcrm_set_warehouse_manager_status_v1: {
        Args: { p_manager_id: string; p_status: string }
        Returns: undefined
      }
      jdvcrm_settle_commission_v1: {
        Args: { p_commission_id: string }
        Returns: Json
      }
      jdvcrm_settle_fedapay_payment_v1: {
        Args: {
          p_amount: number
          p_currency: string
          p_event_id: string
          p_event_type: string
          p_payload: Json
          p_payment_id: string
          p_transaction_id: string
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          provider: string | null
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "subscription_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      jdvcrm_submit_company_application_v1: {
        Args: {
          p_address: string
          p_associate_count: number
          p_city: string
          p_company_name: string
          p_company_nature: string
          p_company_size: string
          p_country: string
          p_legal_form: string
          p_legal_name: string
          p_legal_status: string
          p_manager_count: number
          p_ownership_count: number
          p_people_count: number
          p_phone: string
          p_primary_sector_id: string
          p_registration_number: string
          p_representative_birth_date: string
          p_representative_email: string
          p_representative_first_name: string
          p_representative_last_name: string
          p_representative_nationality: string
          p_representative_phone: string
          p_representative_role: string
          p_secondary_sector_ids: string[]
          p_tax_number: string
          p_website: string
        }
        Returns: string
      }
      jdvcrm_subscription_lifecycle_job_v1: { Args: never; Returns: number }
      jdvcrm_subwarehouse_close_day_v1: {
        Args: {
          p_exercise_date?: string
          p_notes?: string
          p_physical_counts?: Json
          p_subwarehouse_id: string
        }
        Returns: Json
      }
      jdvcrm_subwarehouse_daily_summary_v1: {
        Args: { p_exercise_date?: string; p_subwarehouse_id: string }
        Returns: {
          closing_units: number
          exercise_date: string
          movement_count: number
          opening_units: number
          subwarehouse_id: string
          theoretical_value: number
          total_entries: number
          total_exits: number
        }[]
      }
      jdvcrm_sync_subscription_status_v1: {
        Args: { p_organization_id: string }
        Returns: string
      }
      jdvcrm_touch_activity_session_v1: {
        Args: { p_route?: string; p_session_id: string }
        Returns: undefined
      }
      jdvcrm_transfer_stock_location_v1: {
        Args: {
          p_article_id: string
          p_destination_subwarehouse_id?: string
          p_destination_warehouse_id?: string
          p_notes?: string
          p_quantity: number
          p_source_subwarehouse_id?: string
          p_source_warehouse_id: string
        }
        Returns: string
      }
      jdvcrm_validate_my_company_v1: {
        Args: { p_application_id: string }
        Returns: {
          organization_id: string
          status: string
          trial_expires_at: string
        }[]
      }
      jdvcrm_warehouse_admin_overview_v1: {
        Args: { p_organization_id: string }
        Returns: {
          active: boolean
          city: string
          code: string
          low_stock_count: number
          managers_count: number
          name: string
          open_tickets: number
          pending_requests: number
          prospecteurs_count: number
          stock_units: number
          warehouse_id: string
        }[]
      }
      jdvcrm_warehouse_close_day_v1: {
        Args: {
          p_exercise_date?: string
          p_notes?: string
          p_physical_counts?: Json
          p_warehouse_id: string
        }
        Returns: Json
      }
      jdvcrm_warehouse_daily_summary_v1: {
        Args: { p_exercise_date?: string; p_warehouse_id: string }
        Returns: {
          closing_units: number
          exercise_date: string
          movement_count: number
          opening_units: number
          theoretical_value: number
          total_entries: number
          total_exits: number
          warehouse_id: string
        }[]
      }
      jdvcrm_warehouse_day_report_v1: {
        Args: { p_date?: string; p_warehouse_id: string }
        Returns: Json
      }
      jdvcrm_warehouse_holdings_v1: {
        Args: { p_prospecteur_id?: string; p_warehouse_id: string }
        Returns: {
          article_id: string
          article_name: string
          hard_due_at: string
          holding_id: string
          is_overdue: boolean
          prospecteur_id: string
          prospecteur_name: string
          quantity: number
          remaining_quantity: number
          return_due_at: string
          status: string
          supplied_at: string
        }[]
      }
      jdvcrm_warehouse_prospecteurs_v1: {
        Args: { p_warehouse_id: string }
        Returns: {
          code: string
          full_name: string
          last_supply_at: string
          next_due_at: string
          overdue_count: number
          phone: string
          prospecteur_id: string
          status: string
          stock_units: number
          to_return_units: number
          work_zone: string
        }[]
      }
      jdvcrm_warehouse_receive_return_v1: {
        Args: { p_holding_id: string; p_note?: string; p_quantity?: number }
        Returns: Json
      }
      jdvcrm_warehouse_receive_supply_v1: {
        Args: { p_items?: Json; p_request_id: string }
        Returns: Json
      }
      jdvcrm_warehouse_request_supply_v1: {
        Args: {
          p_items: Json
          p_notes?: string
          p_supplier_id: string
          p_target: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      jdvcrm_warehouse_sales_v1: {
        Args: { p_days?: number; p_warehouse_id: string }
        Returns: {
          amount: number
          article_name: string
          prospecteur_name: string
          quantity: number
          returned_quantity: number
          sale_date: string
          sale_id: string
          sale_number: string
          status: string
        }[]
      }
      jdvcrm_warehouse_stock_v1: {
        Args: { p_warehouse_id: string }
        Returns: {
          article_code: string
          article_id: string
          article_name: string
          available: number
          category: string
          is_low: boolean
          minimum_quantity: number
          quantity: number
          reserved_quantity: number
        }[]
      }
      jdvcrm_warehouse_suppliers_v1: {
        Args: { p_warehouse_id: string }
        Returns: {
          contact_name: string
          name: string
          phone: string
          status: string
          supplier_id: string
        }[]
      }
      jdvcrm_warehouse_supply_prospecteur_v1: {
        Args: {
          p_items: Json
          p_notes?: string
          p_override?: boolean
          p_prospecteur_id: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      jdvcrm_warehouse_team_v1: {
        Args: { p_warehouse_id: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          manager_id: string
          phone: string
          status: string
          user_id: string
        }[]
      }
      jdvcrm_warehouse_trace_serial_v1: {
        Args: { p_serial: string; p_warehouse_id: string }
        Returns: Json
      }
      jdvcrm_warehouse_trace_v1: {
        Args: { p_article_id?: string; p_days?: number; p_warehouse_id: string }
        Returns: {
          article_name: string
          from_label: string
          movement_label: string
          notes: string
          occurred_at: string
          prospecteur_name: string
          quantity: number
          reference_type: string
          to_label: string
        }[]
      }
      jdvcrm_warehouse_update_supply_v1: {
        Args: { p_action: string; p_notes?: string; p_request_id: string }
        Returns: Json
      }
      register_company: {
        Args: {
          p_city?: string
          p_country?: string
          p_email?: string
          p_name: string
          p_phone?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
