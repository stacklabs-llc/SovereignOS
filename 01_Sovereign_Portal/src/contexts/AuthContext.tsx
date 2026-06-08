import React from 'react';

export interface AuthUser {
  user_name: string;
  display_name: string;
  role: 'pilot' | 'creator' | 'user' | 'guest' | 'admin' | 'patron' | 'stack_manager';
  avatar_url?: string;
  favorite_team?: string;
  os_theme?: string;
  entropy_level?: number;
  procedural_avatars?: boolean;
  kiosk_projection?: boolean;
  introduction?: string;
  desk_relic?: string;
  u_layout_configuration?: string;
}

export const AuthContext = React.createContext<AuthUser | null>(null);

export function useAuth(): AuthUser | null {
  return React.useContext(AuthContext);
}
