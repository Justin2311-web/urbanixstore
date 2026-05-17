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
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: "admin" | "customer";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: "admin" | "customer";
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          description_en: string | null;
          description_ms: string | null;
          description_zh: string | null;
          id: string;
          image_url: string | null;
          image_url_en: string | null;
          image_url_ms: string | null;
          image_url_zh: string | null;
          is_active: boolean;
          name: string;
          name_en: string | null;
          name_ms: string | null;
          name_zh: string | null;
          slug: string;
          sort_order: number;
          tone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          description_ms?: string | null;
          description_zh?: string | null;
          id?: string;
          image_url?: string | null;
          image_url_en?: string | null;
          image_url_ms?: string | null;
          image_url_zh?: string | null;
          is_active?: boolean;
          name: string;
          name_en?: string | null;
          name_ms?: string | null;
          name_zh?: string | null;
          slug: string;
          sort_order?: number;
          tone?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          description_en: string | null;
          description_ms: string | null;
          description_zh: string | null;
          highlights: Json;
          id: string;
          image_tone: string | null;
          is_active: boolean;
          is_featured: boolean;
          main_image_url: string | null;
          main_image_url_en: string | null;
          main_image_url_ms: string | null;
          main_image_url_zh: string | null;
          name: string;
          name_en: string | null;
          name_ms: string | null;
          name_zh: string | null;
          price: number;
          promotion_end_at: string | null;
          promotion_price: number | null;
          promotion_start_at: string | null;
          rating: number | null;
          return_note: string | null;
          shipping_info: string | null;
          short_description: string | null;
          short_description_en: string | null;
          short_description_ms: string | null;
          short_description_zh: string | null;
          sku: string;
          slug: string;
          sold: number | null;
          specifications: Json;
          stock_quantity: number;
          product_variants: Json | null;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          description_en?: string | null;
          description_ms?: string | null;
          description_zh?: string | null;
          highlights?: Json;
          id?: string;
          image_tone?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          main_image_url?: string | null;
          main_image_url_en?: string | null;
          main_image_url_ms?: string | null;
          main_image_url_zh?: string | null;
          name: string;
          name_en?: string | null;
          name_ms?: string | null;
          name_zh?: string | null;
          price: number;
          promotion_end_at?: string | null;
          promotion_price?: number | null;
          promotion_start_at?: string | null;
          rating?: number | null;
          return_note?: string | null;
          shipping_info?: string | null;
          short_description?: string | null;
          short_description_en?: string | null;
          short_description_ms?: string | null;
          short_description_zh?: string | null;
          sku: string;
          slug: string;
          sold?: number | null;
          specifications?: Json;
          stock_quantity?: number;
          product_variants?: Json | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          image_url: string;
          is_primary: boolean;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          is_primary?: boolean;
          product_id: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
      };
      orders: {
        Row: {
          courier: string | null;
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_note: string | null;
          discount_amount: number;
          id: string;
          order_number: string;
          order_status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
          payment_method: "manual" | "whatsapp";
          payment_method_type: string | null;
          payment_status: "pending" | "unpaid" | "paid" | "failed" | "refunded";
          receipt_url: string | null;
          shipping_address: Json;
          shipping_fee: number;
          subtotal: number;
          total_amount: number;
          tracking_number: string | null;
          updated_at: string;
        };
        Insert: {
          courier?: string | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone: string;
          delivery_note?: string | null;
          discount_amount?: number;
          id?: string;
          order_number: string;
          order_status?: "pending" | "processing" | "shipped" | "completed" | "cancelled";
          payment_method?: "manual" | "whatsapp";
          payment_method_type?: string | null;
          payment_status?: "pending" | "unpaid" | "paid" | "failed" | "refunded";
          receipt_url?: string | null;
          shipping_address?: Json;
          shipping_fee?: number;
          subtotal?: number;
          total_amount?: number;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_sku: string;
          quantity: number;
          total_price: number;
          unit_price: number;
          selected_variants: Json | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_sku: string;
          quantity: number;
          total_price: number;
          unit_price: number;
          selected_variants?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      store_settings: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          currency: string;
          favicon_url: string | null;
          footer_content: Json | null;
          free_shipping_min_amount: number;
          id: boolean;
          is_store_active: boolean;
          logo_url: string | null;
          maintenance_message: string | null;
          nav_items: Json | null;
          shipping_fee: number;
          social_links: Json;
          store_name: string;
          store_tagline: string;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          currency?: string;
          favicon_url?: string | null;
          footer_content?: Json | null;
          free_shipping_min_amount?: number;
          id?: boolean;
          is_store_active?: boolean;
          logo_url?: string | null;
          maintenance_message?: string | null;
          nav_items?: Json | null;
          shipping_fee?: number;
          social_links?: Json;
          store_name?: string;
          store_tagline?: string;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Insert"]>;
      };
      banners: {
        Row: {
          announcement_bg_color: string | null;
          announcement_enabled: boolean;
          announcement_link: string | null;
          announcement_text_color: string | null;
          created_at: string;
          featured_category_cards: Json;
          hero_button_link: string | null;
          hero_button_text: string | null;
          hero_image_url: string | null;
          hero_subtitle: string | null;
          hero_title: string;
          id: boolean;
          is_active: boolean;
          promo_strip_text: string | null;
          trust_badge_text: Json;
          updated_at: string;
        };
        Insert: {
          announcement_bg_color?: string | null;
          announcement_enabled?: boolean;
          announcement_link?: string | null;
          announcement_text_color?: string | null;
          created_at?: string;
          featured_category_cards?: Json;
          hero_button_link?: string | null;
          hero_button_text?: string | null;
          hero_image_url?: string | null;
          hero_subtitle?: string | null;
          hero_title: string;
          id?: boolean;
          is_active?: boolean;
          promo_strip_text?: string | null;
          trust_badge_text?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
      };
      payment_settings: {
        Row: {
          account_name: string | null;
          account_number: string | null;
          bank_name: string | null;
          created_at: string;
          id: boolean;
          is_enabled: boolean;
          manual_payment_enabled: boolean;
          payment_instruction: string | null;
          provider_placeholder: string | null;
          updated_at: string;
          whatsapp_order_enabled: boolean;
        };
        Insert: {
          account_name?: string | null;
          account_number?: string | null;
          bank_name?: string | null;
          created_at?: string;
          id?: boolean;
          is_enabled?: boolean;
          manual_payment_enabled?: boolean;
          payment_instruction?: string | null;
          provider_placeholder?: string | null;
          updated_at?: string;
          whatsapp_order_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["payment_settings"]["Insert"]>;
      };
      qr_payment_methods: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          instruction_text: string | null;
          is_active: boolean;
          qr_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          instruction_text?: string | null;
          is_active?: boolean;
          qr_image_url?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["qr_payment_methods"]["Insert"]>;
      };
      promotion_banners: {
        Row: {
          created_at: string;
          cta_text: string | null;
          desktop_image_url: string | null;
          id: string;
          is_active: boolean;
          mobile_image_url: string | null;
          sort_order: number;
          subtitle: string | null;
          target_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          cta_text?: string | null;
          desktop_image_url?: string | null;
          id?: string;
          is_active?: boolean;
          mobile_image_url?: string | null;
          sort_order?: number;
          subtitle?: string | null;
          target_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promotion_banners"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
