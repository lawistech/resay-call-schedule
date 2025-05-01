export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  job_title?: string;
  department?: string;
  phone_number?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  profile_completed?: boolean;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
}

export interface UserPermission {
  id: string;
  name: string;
  description?: string;
}