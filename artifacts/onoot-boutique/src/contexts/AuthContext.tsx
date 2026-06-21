import React, { createContext, useContext, useEffect, useState } from "react";
import { User, useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { getToken, setToken as setLocalToken, removeToken as removeLocalToken } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const queryClient = useQueryClient();

  // If we have a token, fetch the user.
  const { data: user, isLoading: isUserLoading } = useGetCurrentUser({
    query: {
      enabled: !!token,
      queryKey: getGetCurrentUserQueryKey()
    }
  });

  const login = (newToken: string, newUser: User) => {
    setLocalToken(newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), newUser);
  };

  const logout = () => {
    removeLocalToken();
    setToken(null);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
    queryClient.invalidateQueries(); // Clear other user-specific data
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isLoading: !!token && isUserLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
