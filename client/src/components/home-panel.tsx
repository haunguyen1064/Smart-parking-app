import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type HomePanelProps = {
  onSearchParking: () => void;
  onRegisterParking: () => void;
};

export default function HomePanel({ onSearchParking, onRegisterParking }: HomePanelProps) {
  const { user } = useAuth();
  return (
    <div className="w-full h-full flex flex-row items-center justify-center bg-white shadow-lg p-4 rounded-xl">
      <div className="flex flex-row w-fit gap-4">
        <Button 
          className="rounded-full px-4 py-4 bg-indigo-400 text-white hover:bg-indigo-500 w-[320px]"
          onClick={onSearchParking}
        >
          Tìm bãi đỗ xe gần bạn
        </Button>
        {user?.role === "owner" && (
          <Button 
            className="rounded-full py-4 bg-indigo-400 text-white hover:bg-indigo-500 w-[320px] !mt-0"
            onClick={onRegisterParking}
          >
            Đăng ký bãi đỗ xe của bạn
          </Button>
        )}
      </div>
    </div>
  );
}