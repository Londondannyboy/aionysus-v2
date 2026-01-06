// State of the agent, make sure this aligns with your agent's state.
export type Job = {
  title: string;
  company: string;
  location: string;
}

export type UserProfile = {
  id?: string;
  name?: string;
  firstName?: string;
  email?: string;
  liked_jobs?: string[];  // job IDs they've liked
  zep_thread_id?: string;  // cached Zep thread ID
}

export type AmbientScene = {
  location?: string;  // "london", "manchester", "remote", etc.
  role?: string;      // "cto", "cfo", "cmo", etc.
  mood?: string;      // "professional", "energetic", "calm"
  query?: string;     // The Unsplash search query to use
}

export type AgentState = {
  jobs: Job[];
  search_query: string;
  user?: UserProfile;
  scene?: AmbientScene;  // Dynamic ambient background
}
