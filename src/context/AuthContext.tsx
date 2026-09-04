import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCapabilities, type Capabilities, type Role } from "../utils/permissions";

export interface User {
  name: string;
  email: string;
  role: Role;
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
  listUsers: () => User[];
  updateUserRole: (email: string, role: Role) => string | null;
}

const USERS_KEY = "inventory-users";
const SESSION_KEY = "inventory-session";

export const DEMO_ACCOUNT = {
  name: "Demo User",
  email: "demo@inventory.com",
  password: "demo123",
  role: "admin",
} as const;

export const MANAGER_DEMO_ACCOUNT = {
  name: "Morgan Manager",
  email: "manager@inventory.com",
  password: "manager123",
  role: "manager",
} as const;

export const STAFF_DEMO_ACCOUNT = {
  name: "Sam Staff",
  email: "staff@inventory.com",
  password: "staff123",
  role: "staff",
} as const;

const SEED_ACCOUNTS = [DEMO_ACCOUNT, MANAGER_DEMO_ACCOUNT, STAFF_DEMO_ACCOUNT];

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(stored: StoredUser): User {
  return { name: stored.name, email: stored.email, role: stored.role };
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    return parsed.map((u) => ({ ...u, role: u.role ?? "staff" }));
  } catch {
    return [];
  }
}

function ensureSeedUsers() {
  const users = loadUsers();
  let changed = false;
  for (const account of SEED_ACCOUNTS) {
    if (!users.some((u) => u.email === account.email)) {
      users.push({
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
      });
      changed = true;
    }
  }
  if (changed) saveUsers(users);
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
    ensureSeedUsers();
    const session = loadSession();
    if (session) {
      const match = loadUsers().find((u) => u.email === session.email);
      setUser(match ? toUser(match) : session);
    }
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

      persistSession(toUser(match));
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

      const newUser: StoredUser = {
        name: trimmedName,
        email: normalizedEmail,
        password,
        role: "staff",
      };
      users.push(newUser);
      saveUsers(users);
      persistSession(toUser(newUser));
      return null;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const listUsers = useCallback((): User[] => {
    return loadUsers().map(toUser);
  }, []);

  const updateUserRole = useCallback(
    (email: string, role: Role): string | null => {
      const normalizedEmail = email.trim().toLowerCase();
      const users = loadUsers();
      const match = users.find((u) => u.email === normalizedEmail);
      if (!match) {
        return "User not found.";
      }

      match.role = role;
      saveUsers(users);

      if (user && user.email === normalizedEmail) {
        persistSession(toUser(match));
      }

      return null;
    },
    [user, persistSession]
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      logout,
      listUsers,
      updateUserRole,
    }),
    [user, isLoading, login, signup, logout, listUsers, updateUserRole]
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

export function usePermission(): Capabilities {
  const { user } = useAuth();
  return getCapabilities(user?.role);
}
