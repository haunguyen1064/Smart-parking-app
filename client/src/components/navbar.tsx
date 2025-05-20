import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CarFront, FileText, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <div className="bg-[#2D3137] p-1.5 rounded-md text-white">
              <CarFront className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Smart Parking</h1>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {user.role === 'owner' && (
                <Link href="/owner/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">Quản lý bãi đỗ xe</span>
                  </Button>
                </Link>
              )}
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-gray-200">
                  <AvatarImage src="" alt={user.fullName} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {user.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <Button onClick={() => logout()} variant="ghost" size="sm" className="text-gray-500">
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm" className="bg-primary text-white hover:bg-primary/90">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
