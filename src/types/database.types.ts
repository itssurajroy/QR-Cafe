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
      analytics: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          type?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          metadata: Json | null
          restaurant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          metadata?: Json | null
          restaurant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          metadata?: Json | null
          restaurant_id?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_paise: number | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          restaurant_id: string | null
          status: string
        }
        Insert: {
          amount_paise?: number | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          restaurant_id?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          restaurant_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          pin_failed_attempts: number
          pin_hash: string | null
          pin_locked_until: string | null
          pin_updated_at: string | null
          restaurant_id: string | null
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          pin_updated_at?: string | null
          restaurant_id?: string | null
          role?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          pin_updated_at?: string | null
          restaurant_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          action_type: string
          bonus_points: number
          coupon_code: string | null
          created_at: string
          id: string
          is_active: boolean
          is_enabled: boolean
          message: string | null
          name: string
          restaurant_id: string
          run_count: number
          template_message: string
          template_title: string
          title: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_type?: string
          bonus_points?: number
          coupon_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_enabled?: boolean
          message?: string | null
          name: string
          restaurant_id: string
          run_count?: number
          template_message: string
          template_title: string
          title?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          bonus_points?: number
          coupon_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_enabled?: boolean
          message?: string | null
          name?: string
          restaurant_id?: string
          run_count?: number
          template_message?: string
          template_title?: string
          title?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_automations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customer_notes: {
        Row: {
          author_name: string | null
          created_at: string
          customer_id: string
          id: string
          note: string
          restaurant_id: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          customer_id: string
          id?: string
          note: string
          restaurant_id: string
        }
        Update: {
          author_name?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          note?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "restaurant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_notes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          allow_list: string[]
          description: string
          enabled: boolean
          key: string
          rollout_pct: number
          updated_at: string
        }
        Insert: {
          allow_list?: string[]
          description?: string
          enabled?: boolean
          key: string
          rollout_pct?: number
          updated_at?: string
        }
        Update: {
          allow_list?: string[]
          description?: string
          enabled?: boolean
          key?: string
          rollout_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      gravy_ingredients: {
        Row: {
          gravy_recipe_id: string
          id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          gravy_recipe_id: string
          id?: string
          ingredient_id: string
          quantity?: number
        }
        Update: {
          gravy_recipe_id?: string
          id?: string
          ingredient_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "gravy_ingredients_gravy_recipe_id_fkey"
            columns: ["gravy_recipe_id"]
            isOneToOne: false
            referencedRelation: "gravy_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gravy_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      gravy_recipes: {
        Row: {
          cost_per_yield: number | null
          id: string
          instructions: string | null
          name: string
          restaurant_id: string
          updated_at: string
          yield_quantity: number
          yield_unit: string
        }
        Insert: {
          cost_per_yield?: number | null
          id?: string
          instructions?: string | null
          name: string
          restaurant_id: string
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Update: {
          cost_per_yield?: number | null
          id?: string
          instructions?: string | null
          name?: string
          restaurant_id?: string
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "gravy_recipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string
          cost_per_unit: number
          id: string
          min_stock: number
          name: string
          restaurant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          cost_per_unit?: number
          id?: string
          min_stock?: number
          name: string
          restaurant_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number
          id?: string
          min_stock?: number
          name?: string
          restaurant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          business_name: string
          category: string
          created_at: string | null
          google_url: string
          id: string
          public_code: string
          user_id: string
        }
        Insert: {
          business_name: string
          category: string
          created_at?: string | null
          google_url: string
          id?: string
          public_code: string
          user_id: string
        }
        Update: {
          business_name?: string
          category?: string
          created_at?: string | null
          google_url?: string
          id?: string
          public_code?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_order_paise: number
          name: string
          points_required: number
          restaurant_id: string
          reward_type: string
          usage_limit: number
          validity_days: number
          value_paise: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_order_paise?: number
          name: string
          points_required: number
          restaurant_id: string
          reward_type?: string
          usage_limit?: number
          validity_days?: number
          value_paise?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_order_paise?: number
          name?: string
          points_required?: number
          restaurant_id?: string
          reward_type?: string
          usage_limit?: number
          validity_days?: number
          value_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: Json
          color: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean
          max_points: number | null
          min_points: number
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json
          color: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          max_points?: number | null
          min_points?: number
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json
          color?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          max_points?: number | null
          min_points?: number
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          order_id: string | null
          points: number
          restaurant_id: string
          type: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          points: number
          restaurant_id: string
          type?: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          points?: number
          restaurant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "restaurant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          active: boolean
          id: string
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_gravies: {
        Row: {
          gravy_recipe_id: string
          menu_item_id: string
          quantity: number
        }
        Insert: {
          gravy_recipe_id: string
          menu_item_id: string
          quantity?: number
        }
        Update: {
          gravy_recipe_id?: string
          menu_item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_gravies_gravy_recipe_id_fkey"
            columns: ["gravy_recipe_id"]
            isOneToOne: false
            referencedRelation: "gravy_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_gravies_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_modifier_groups: {
        Row: {
          menu_item_id: string
          modifier_group_id: string
          sort_order: number
        }
        Insert: {
          menu_item_id: string
          modifier_group_id: string
          sort_order?: number
        }
        Update: {
          menu_item_id?: string
          modifier_group_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string
          description: string | null
          hsn: string | null
          id: string
          image_url: string | null
          is_veg: boolean
          name: string
          price_paise: number
          restaurant_id: string
        }
        Insert: {
          available?: boolean
          category_id: string
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_veg?: boolean
          name: string
          price_paise?: number
          restaurant_id: string
        }
        Update: {
          available?: boolean
          category_id?: string
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_veg?: boolean
          name?: string
          price_paise?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          id: string
          max_select: number
          min_select: number
          name: string
          required: boolean
          restaurant_id: string
        }
        Insert: {
          id?: string
          max_select?: number
          min_select?: number
          name: string
          required?: boolean
          restaurant_id: string
        }
        Update: {
          id?: string
          max_select?: number
          min_select?: number
          name?: string
          required?: boolean
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_options: {
        Row: {
          active: boolean
          id: string
          modifier_group_id: string
          name: string
          price_delta_paise: number
        }
        Insert: {
          active?: boolean
          id?: string
          modifier_group_id: string
          name: string
          price_delta_paise?: number
        }
        Update: {
          active?: boolean
          id?: string
          modifier_group_id?: string
          name?: string
          price_delta_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          audience_segment: string
          campaign_type: string
          clicked_count: number
          created_at: string
          cta_button: string
          deep_link: string
          delivered_count: number
          id: string
          image_url: string | null
          message: string
          name: string
          opened_count: number
          orders_count: number
          restaurant_id: string
          revenue_paise: number
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subscriber_count: number
          title: string
        }
        Insert: {
          audience_segment?: string
          campaign_type?: string
          clicked_count?: number
          created_at?: string
          cta_button?: string
          deep_link?: string
          delivered_count?: number
          id?: string
          image_url?: string | null
          message: string
          name: string
          opened_count?: number
          orders_count?: number
          restaurant_id: string
          revenue_paise?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subscriber_count?: number
          title: string
        }
        Update: {
          audience_segment?: string
          campaign_type?: string
          clicked_count?: number
          created_at?: string
          cta_button?: string
          deep_link?: string
          delivered_count?: number
          id?: string
          image_url?: string | null
          message?: string
          name?: string
          opened_count?: number
          orders_count?: number
          restaurant_id?: string
          revenue_paise?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subscriber_count?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          option_name: string
          order_item_id: string
          price_delta_paise: number
        }
        Insert: {
          id?: string
          option_name: string
          order_item_id: string
          price_delta_paise?: number
        }
        Update: {
          id?: string
          option_name?: string
          order_item_id?: string
          price_delta_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          hsn: string | null
          id: string
          item_name: string
          line_total_paise: number
          menu_item_id: string | null
          notes: string | null
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Insert: {
          hsn?: string | null
          id?: string
          item_name: string
          line_total_paise?: number
          menu_item_id?: string | null
          notes?: string | null
          order_id: string
          quantity?: number
          unit_price_paise?: number
        }
        Update: {
          hsn?: string | null
          id?: string
          item_name?: string
          line_total_paise?: number
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          discount_paise: number
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          order_type: string
          payment_method: string | null
          payment_status: string
          reservation_id: string | null
          restaurant_id: string
          status: string
          status_token: string | null
          subtotal_paise: number
          table_id: string | null
          tax_paise: number
          total_paise: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount_paise?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          order_type?: string
          payment_method?: string | null
          payment_status?: string
          reservation_id?: string | null
          restaurant_id: string
          status?: string
          status_token?: string | null
          subtotal_paise?: number
          table_id?: string | null
          tax_paise?: number
          total_paise?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount_paise?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string
          payment_method?: string | null
          payment_status?: string
          reservation_id?: string | null
          restaurant_id?: string
          status?: string
          status_token?: string | null
          subtotal_paise?: number
          table_id?: string | null
          tax_paise?: number
          total_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "table_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          order_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          raw_event_ref: string | null
          status: string
        }
        Insert: {
          amount_paise?: number
          created_at?: string
          id?: string
          order_id: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_event_ref?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_event_ref?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          starts_at: string
          target_plan: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string
          target_plan?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string
          target_plan?: string
          title?: string
        }
        Relationships: []
      }
      platform_api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          restaurant_id: string | null
          revoked_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          restaurant_id?: string | null
          revoked_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          restaurant_id?: string | null
          revoked_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_api_keys_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      platform_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          permissions: Json
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          permissions?: Json
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          permissions?: Json
          role?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          restaurant_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          restaurant_id?: string
        }
        Relationships: []
      }
      recipe_instructions: {
        Row: {
          id: string
          instruction: string
          menu_item_id: string
          step_number: number
        }
        Insert: {
          id?: string
          instruction: string
          menu_item_id: string
          step_number?: number
        }
        Update: {
          id?: string
          instruction?: string
          menu_item_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_instructions_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          id: string
          ingredient_id: string
          menu_item_id: string
          quantity: number
        }
        Insert: {
          id?: string
          ingredient_id: string
          menu_item_id: string
          quantity?: number
        }
        Update: {
          id?: string
          ingredient_id?: string
          menu_item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit_at: string
          loyalty_points: number
          name: string | null
          phone: string
          restaurant_id: string
          tier_id: string | null
          total_spent_paise: number
          visit_count: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string
          loyalty_points?: number
          name?: string | null
          phone: string
          restaurant_id: string
          tier_id?: string | null
          total_spent_paise?: number
          visit_count?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string
          loyalty_points?: number
          name?: string | null
          phone?: string
          restaurant_id?: string
          tier_id?: string | null
          total_spent_paise?: number
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_customers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          active: boolean
          id: string
          label: string
          qr_token: string | null
          restaurant_id: string
          seats: number
        }
        Insert: {
          active?: boolean
          id?: string
          label: string
          qr_token?: string | null
          restaurant_id: string
          seats?: number
        }
        Update: {
          active?: boolean
          id?: string
          label?: string
          qr_token?: string | null
          restaurant_id?: string
          seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_whatsapp_settings: {
        Row: {
          enabled: boolean
          id: string
          include_gstin_line: boolean
          include_review_cta: boolean
          message_template: string
          restaurant_id: string
          thank_you_line: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          include_gstin_line?: boolean
          include_review_cta?: boolean
          message_template: string
          restaurant_id: string
          thank_you_line?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          include_gstin_line?: boolean
          include_review_cta?: boolean
          message_template?: string
          restaurant_id?: string
          thank_you_line?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_whatsapp_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          accent_color: string | null
          address: string | null
          admin_notes: string | null
          billing_status: string | null
          close_time: string
          created_at: string
          created_by: string | null
          currency: string
          google_review_url: string | null
          gstin: string | null
          id: string
          internal_notes: string
          is_suspended: boolean
          last_active_at: string | null
          logo_url: string | null
          mrr_cents: number
          name: string
          onboarded_at: string | null
          open_time: string
          phone: string | null
          plan: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          slug: string
          subscription_ends_at: string | null
          subscription_plan_id: string | null
          subscription_status: string
          suspended_at: string | null
          suspended_reason: string | null
          tagline: string | null
          tax_rate: number
          tier: string
          timezone: string
          trial_ends_at: string | null
          trial_starts_at: string | null
          upi_id: string | null
          upi_qr_url: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          admin_notes?: string | null
          billing_status?: string | null
          close_time?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          google_review_url?: string | null
          gstin?: string | null
          id?: string
          internal_notes?: string
          is_suspended?: boolean
          last_active_at?: string | null
          logo_url?: string | null
          mrr_cents?: number
          name: string
          onboarded_at?: string | null
          open_time?: string
          phone?: string | null
          plan?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          slug: string
          subscription_ends_at?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          tagline?: string | null
          tax_rate?: number
          tier?: string
          timezone?: string
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          upi_id?: string | null
          upi_qr_url?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          admin_notes?: string | null
          billing_status?: string | null
          close_time?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          google_review_url?: string | null
          gstin?: string | null
          id?: string
          internal_notes?: string
          is_suspended?: boolean
          last_active_at?: string | null
          logo_url?: string | null
          mrr_cents?: number
          name?: string
          onboarded_at?: string | null
          open_time?: string
          phone?: string | null
          plan?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          slug?: string
          subscription_ends_at?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string
          suspended_at?: string | null
          suspended_reason?: string | null
          tagline?: string | null
          tax_rate?: number
          tier?: string
          timezone?: string
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          upi_id?: string | null
          upi_qr_url?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      split_bill_items: {
        Row: {
          id: string
          line_total_paise: number
          order_item_id: string
          quantity: number
          split_bill_id: string
        }
        Insert: {
          id?: string
          line_total_paise?: number
          order_item_id: string
          quantity?: number
          split_bill_id: string
        }
        Update: {
          id?: string
          line_total_paise?: number
          order_item_id?: string
          quantity?: number
          split_bill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_bill_items_split_bill_id_fkey"
            columns: ["split_bill_id"]
            isOneToOne: false
            referencedRelation: "split_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bills: {
        Row: {
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          split_number: number
          total_paise: number
        }
        Insert: {
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          split_number: number
          total_paise?: number
        }
        Update: {
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          split_number?: number
          total_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "split_bills_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          id: string
          ingredient_id: string
          location: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          location?: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          location?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ingredient_id: string
          location: string
          notes: string | null
          quantity: number
          reference: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id: string
          location?: string
          notes?: string | null
          quantity: number
          reference?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id?: string
          location?: string
          notes?: string | null
          quantity?: number
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      table_reservations: {
        Row: {
          code: string
          created_at: string
          day: string
          ends_at: string
          id: string
          name: string
          party_size: number
          phone: string
          restaurant_id: string
          starts_at: string
          status: string
          table_ids: string[]
        }
        Insert: {
          code: string
          created_at?: string
          day: string
          ends_at: string
          id?: string
          name: string
          party_size: number
          phone: string
          restaurant_id: string
          starts_at: string
          status?: string
          table_ids?: string[]
        }
        Update: {
          code?: string
          created_at?: string
          day?: string
          ends_at?: string
          id?: string
          name?: string
          party_size?: number
          phone?: string
          restaurant_id?: string
          starts_at?: string
          status?: string
          table_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "table_reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          access_token: string | null
          business_account_id: string | null
          connected_at: string | null
          created_at: string
          id: string
          last_seen_at: string | null
          phone_number_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          verify_token: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          business_account_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string | null
          phone_number_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          verify_token?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          business_account_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string | null
          phone_number_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          verify_token?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_bill_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          order_id: string | null
          phone: string | null
          restaurant_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          order_id?: string | null
          phone?: string | null
          restaurant_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          order_id?: string | null
          phone?: string | null
          restaurant_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_bill_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_bill_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_bill_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          message_id: string
          payload: Json | null
          provider_event_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          message_id: string
          payload?: Json | null
          provider_event_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          message_id?: string
          payload?: Json | null
          provider_event_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          document_filename: string | null
          document_mime_type: string | null
          document_url: string | null
          error_code: string | null
          error_message: string | null
          id: string
          max_retries: number
          message_type: string
          order_id: string | null
          provider_message_id: string | null
          read_at: string | null
          recipient_phone: string
          retry_count: number
          scheduled_at: string
          sent_at: string | null
          status: string
          template_language: string | null
          template_name: string | null
          template_variables: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          document_filename?: string | null
          document_mime_type?: string | null
          document_url?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number
          message_type: string
          order_id?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_phone: string
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          document_filename?: string | null
          document_mime_type?: string | null
          document_url?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number
          message_type?: string
          order_id?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_phone?: string
          retry_count?: number
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          template_variables?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_opt_ins: {
        Row: {
          confirmed_at: string | null
          consent_text: string | null
          consent_version: string | null
          created_at: string
          customer_id: string | null
          expires_at: string | null
          id: string
          meta: Json | null
          opt_in_type: string
          phone: string
          revoked_at: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          meta?: Json | null
          opt_in_type: string
          phone: string
          revoked_at?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          meta?: Json | null
          opt_in_type?: string
          phone?: string
          revoked_at?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_opt_ins_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_opt_ins_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "restaurant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_opt_ins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          encryption_key_id: string
          id: string
          session_data: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          encryption_key_id?: string
          id?: string
          session_data?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          encryption_key_id?: string
          id?: string
          session_data?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_restaurant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          auto_send_bill: boolean
          auto_send_order_confirmation: boolean
          auto_send_status_updates: boolean
          business_name_override: string | null
          created_at: string
          default_language: string | null
          default_template: string | null
          enabled: boolean
          id: string
          include_gstin_line: boolean
          include_review_cta: boolean
          tenant_id: string
          thank_you_line: string | null
          updated_at: string
        }
        Insert: {
          auto_send_bill?: boolean
          auto_send_order_confirmation?: boolean
          auto_send_status_updates?: boolean
          business_name_override?: string | null
          created_at?: string
          default_language?: string | null
          default_template?: string | null
          enabled?: boolean
          id?: string
          include_gstin_line?: boolean
          include_review_cta?: boolean
          tenant_id: string
          thank_you_line?: string | null
          updated_at?: string
        }
        Update: {
          auto_send_bill?: boolean
          auto_send_order_confirmation?: boolean
          auto_send_status_updates?: boolean
          business_name_override?: string | null
          created_at?: string
          default_language?: string | null
          default_template?: string | null
          enabled?: boolean
          id?: string
          include_gstin_line?: boolean
          include_review_cta?: boolean
          tenant_id?: string
          thank_you_line?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          components: Json
          created_at: string
          id: string
          language: string
          meta_template_id: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          components?: Json
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          components?: Json
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_visit_at: string | null
          loyalty_points: number | null
          name: string | null
          phone: string | null
          restaurant_id: string | null
          tier_id: string | null
          total_spent_paise: number | null
          visit_count: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          name?: string | null
          phone?: string | null
          restaurant_id?: string | null
          tier_id?: string | null
          total_spent_paise?: number | null
          visit_count?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          name?: string | null
          phone?: string | null
          restaurant_id?: string | null
          tier_id?: string | null
          total_spent_paise?: number | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_customers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      qrcafe_auth_restaurant_id: { Args: never; Returns: string }
      qrcafe_auth_role: { Args: never; Returns: string }
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
