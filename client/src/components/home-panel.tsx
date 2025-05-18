import React from "react";
import { Button } from "@/components/ui/button";

type HomePanelProps = {
  onSearchParking: () => void;
  onRegisterParking: () => void;
};

export default function HomePanel({ onSearchParking, onRegisterParking }: HomePanelProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white shadow-lg p-8">
      <div className="flex flex-col space-y-4 w-full max-w-md">
        <Button 
          className="rounded-full px-6 py-6 bg-indigo-400 text-white hover:bg-indigo-500 w-full"
          onClick={onSearchParking}
        >
          Tìm bãi đỗ xe gần bạn
        </Button>
        
        <Button 
          className="rounded-full px-6 py-6 bg-indigo-400 text-white hover:bg-indigo-500 w-full"
          onClick={onRegisterParking}
        >
          Đăng ký bãi đỗ xe của bạn
        </Button>
      </div>
    </div>
  );
}