import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  name: string;
  email: string;
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string) => string | null;
  logout: () => void;
}

const USERS_KEY = "inventory-users";
const SESSION_KEY = "inventory-session";

export const DEMO_ACCOUNT = {
  name: "Demo User",
  email: "demo@inventory.com",
  password: "demo123",
} as const;

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function ensureDemoUser() {
  const users = loadUsers();
  const exists = users.some((u) => u.email === DEMO_ACCOUNT.email);
  if (!exists) {
    users.push({
      name: DEMO_ACCOUNT.name,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
    });
    saveUsers(users);
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ensureDemoUser();
    setUser(loadSession());
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((next: User | null) => {
    if (next) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setUser(next);
  }, []);

  const login = useCallback(
    (email: string, password: string): string | null => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return "Email and password are required.";
      }

      const match = loadUsers().find((u) => u.email === normalizedEmail);
      if (!match || match.password !== password) {
        return "Invalid email or password.";
      }

      persistSession({ name: match.name, email: match.email });
      return null;
    },
    [persistSession]
  );

  const signup = useCallback(
    (name: string, email: string, password: string): string | null => {
      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();

      if (!trimmedName || !normalizedEmail || !password) {
        return "All fields are required.";
      }
      if (password.length < 6) {
        return "Password must be at least 6 characters.";
      }

      const users = loadUsers();
      if (users.some((u) => u.email === normalizedEmail)) {
        return "An account with this email already exists.";
      }

      users.push({ name: trimmedName, email: normalizedEmail, password });
      saveUsers(users);
      persistSession({ name: trimmedName, email: normalizedEmail });
      return null;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
