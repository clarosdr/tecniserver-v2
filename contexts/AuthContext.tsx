
import React, { createContext } from 'react';
import { User, UserRole, UserCredentials } from '../types'; // Assuming types.ts is at the root

export interface AuthContextType {
  user: User | null;
  login: (credentials: UserCredentials) => Promise<void>; // Changed to Promise<void>
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);