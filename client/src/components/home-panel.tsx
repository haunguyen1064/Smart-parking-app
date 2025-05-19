import React from "react";
import { Button } from "@/components/ui/button";

type HomePanelProps = {
  onSearchParking: () => void;
  onRegisterParking: () => void;
};

export default function HomePanel({ onSearchParking, onRegisterParking }: HomePanelProps) {
  return (
    <div className="w-full h-full flex flex-row items-center justify-center bg-white shadow-lg p-4 rounded-xl">
      <div className="flex flex-row space-y-4 w-fit gap-4">
        <Button 
          className="rounded-full px-4 py-4 bg-indigo-400 text-white hover:bg-indigo-500 w-fit"
          onClick={onSearchParking}
        >
          Tìm bãi đỗ xe gần bạn
        </Button>
        
        <Button 
          className="rounded-full py-4 bg-indigo-400 text-white hover:bg-indigo-500 w-fit !mt-0"
          onClick={onRegisterParking}
        >
          Đăng ký bãi đỗ xe của bạn
        </Button>
      </div>
    </div>
  );
}