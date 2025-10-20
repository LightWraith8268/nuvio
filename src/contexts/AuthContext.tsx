import { createContext, useContext, useState, ReactNode } from 'react';
import type { Employee } from '@/types';

interface AuthContextType {
  currentEmployee: Employee | null;
  login: (employee: Employee) => void;
  logout: () => void;
  hasPermission: (permission: keyof Employee['permissions']) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const login = (employee: Employee) => {
    setCurrentEmployee(employee);
    // Store in session storage for persistence across page refreshes
    sessionStorage.setItem('currentEmployee', JSON.stringify(employee));
  };

  const logout = () => {
    setCurrentEmployee(null);
    sessionStorage.removeItem('currentEmployee');
  };

  const hasPermission = (permission: keyof Employee['permissions']): boolean => {
    if (!currentEmployee) return false;
    return currentEmployee.permissions[permission];
  };

  // Load from session storage on mount
  useState(() => {
    const stored = sessionStorage.getItem('currentEmployee');
    if (stored) {
      setCurrentEmployee(JSON.parse(stored));
    }
  });

  return (
    <AuthContext.Provider value={{ currentEmployee, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
