// State of the agent - Wine focused

export type Wine = {
  id: number;
  name: string;
  winery: string;
  region: string;
  country: string;
  grape_variety?: string;
  vintage?: number;
  wine_type: string;  // Red, White, Rosé, Sparkling, Dessert
  style?: string;
  color?: string;
  price_retail?: number;
  price_trade?: number;
  tasting_notes?: string;
  critic_scores?: Record<string, number>;
  image_url?: string;
  slug?: string;
}

export type UserProfile = {
  id?: string;
  name?: string;
  firstName?: string;
  email?: string;
  saved_wines?: number[];  // wine IDs they've saved
  zep_thread_id?: string;  // cached Zep thread ID
}

export type WinePreferences = {
  preferred_regions?: string[];
  preferred_types?: string[];    // Red, White, etc.
  preferred_grapes?: string[];
  price_range?: { min: number; max: number };
  taste_profile?: {
    sweetness?: 'dry' | 'off-dry' | 'sweet';
    body?: 'light' | 'medium' | 'full';
    tannins?: 'low' | 'medium' | 'high';
  };
}

export type AmbientScene = {
  region?: string;       // "burgundy", "bordeaux", "champagne", "tuscany", etc.
  wine_type?: string;    // "red", "white", "sparkling", etc.
  mood?: string;         // "elegant", "rustic", "celebratory"
  query?: string;        // The Unsplash search query to use
}

export type AgentState = {
  wines: Wine[];
  search_query: string;
  user?: UserProfile;
  preferences?: WinePreferences;
  scene?: AmbientScene;  // Dynamic ambient background
  cart?: {
    items: { wine_id: number; quantity: number }[];
    shopify_cart_id?: string;
  };
}
