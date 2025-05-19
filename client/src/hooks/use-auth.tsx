import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "user" | "owner";
  phoneNumber?: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type SignupCredentials = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: "user" | "owner";
};

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Modified to work with our demo authentication
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      // For demo purposes, manually check if user is logged in
      // This would normally be a server API call
      try {
        // Get authentication from localStorage (demo only)
        const storedUser = localStorage.getItem('demoUser');
        if (storedUser) {
          return JSON.parse(storedUser);
        }
        return null;
      } catch (error) {
        console.error("Authentication error:", error);
        return null;
      }
    },
  });
  
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Call API
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Email hoặc mật khẩu không đúng");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng quay trở lại, ${data.fullName}!`,
      });
      
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Account created successfully",
        description: `Welcome, ${data.fullName}!`,
      });
      
      // Redirect to appropriate page based on role
      if (data.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // For demo purposes, simply clear localStorage
      localStorage.removeItem('demoUser');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Đăng xuất thành công",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng xuất thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };
  
  const signup = async (credentials: SignupCredentials) => {
    await signupMutation.mutateAsync(credentials);
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isError,
        login,
        signup,
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
