export type User = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginAsGuest: () => void;
  exitGuest: () => void; 
  logout: () => void;
  clearError: () => void;
};