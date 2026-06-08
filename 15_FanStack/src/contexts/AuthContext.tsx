import React from 'react';

export interface AuthUser {
  user_name: string;
  display_name: string;
  role: 'pilot' | 'creator' | 'user' | 'guest' | 'patron';
  avatar_url?: string;
  favorite_team?: string;
  os_theme?: string;
}

export const AuthContext = React.createContext<AuthUser | null>(null);

export function useAuth(): AuthUser | null {
  return React.useContext(AuthContext);
}
