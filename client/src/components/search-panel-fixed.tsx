import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Clock, Car } from "lucide-react";
import type { ParkingLot } from "@/hooks/use-parking";

type SearchPanelProps = {
  isLoading: boolean;
  parkingLots: ParkingLot[];
  onSelectParkingLot: (parkingLot: ParkingLot) => void;
  onSearch: (query: string) => void;
  onBack?: () => void;
};

export default function SearchPanel({ 
  isLoading, 
  parkingLots, 
  onSelectParkingLot,
  onSearch,
  onBack
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex-shrink-0">
        {onBack && (
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center justify-center text-gray-600 w-8 h-8 p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Nhập vị trí của bạn để tìm bãi đỗ xe..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </form>
        
        <div className="mb-4">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="4" x2="20" y1="21" y2="21" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="3" y2="3" />
            </svg>
            <span>Bộ lọc</span>
          </Button>
        </div>
        
        {showFilters && (
          <div className="mb-6 bg-gray-50 p-3 rounded-md">
            <h3 className="font-medium mb-2">Lọc theo:</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Gần nhất
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <Car className="h-4 w-4 mr-2" />
                Nhiều chỗ trống
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Mở 24h
              </Button>
              <Button variant="outline" className="justify-start" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                Có bảo vệ
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 pb-4 overflow-y-auto flex-grow">
        <div className="space-y-3">
          <h3 className="font-medium">Bãi đỗ xe gần đây</h3>
          
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="cursor-wait">
                <CardContent className="p-3 grid grid-cols-[70px_1fr] gap-3">
                  <div className="bg-gray-200 rounded-md w-[70px] h-[70px] animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : parkingLots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Không tìm thấy bãi đỗ xe nào.</p>
            </div>
          ) : (
            parkingLots.map((lot) => (
              <Card key={lot.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onSelectParkingLot(lot)}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{lot.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {lot.address}
                      </p>
                      <div className="flex items-center mt-1">
                        <Car className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {lot.availableSpots} chỗ trống / {lot.totalSpots} chỗ
                        </span>
                      </div>
                    </div>
                    <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {lot.pricePerHour.toLocaleString('vi-VN')}đ/h
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}