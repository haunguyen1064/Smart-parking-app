import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Car } from "lucide-react";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-md text-white">
              <Car className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Smart Parking</h1>
          </a>
        </Link>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {user.role === "owner" && (
                <Link href="/owner/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="text-sm hidden md:block">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-medium">{user.fullName}</span>
              </div>
              <Button onClick={() => logout()} variant="ghost" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
