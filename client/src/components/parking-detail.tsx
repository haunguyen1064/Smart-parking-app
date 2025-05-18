import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, ArrowLeft, Navigation, Clock, Route } from "lucide-react";
import ParkingSpotsLayout from "./parking-spots-layout";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { RouteInfo } from "./simple-map";

type ParkingDetailProps = {
  parkingLot: ParkingLot;
  parkingSpaces: ParkingSpace[];
  isSpacesLoading: boolean;
  onBookNow: () => void;
  onBack: () => void;
  onNavigate?: () => void;
  routes?: RouteInfo[];
};

export default function ParkingDetail({ 
  parkingLot, 
  parkingSpaces,
  isSpacesLoading,
  onBookNow,
  onBack,
  onNavigate,
  routes
}: ParkingDetailProps) {
  // Group parking spaces by zone
  const groupedSpaces = parkingSpaces.reduce((groups, space) => {
    if (!groups[space.zone]) {
      groups[space.zone] = [];
    }
    groups[space.zone].push(space);
    return groups;
  }, {} as Record<string, ParkingSpace[]>);
  
  // Calculate counts
  const availableCount = parkingSpaces.filter(space => space.status === "available").length;
  const occupiedCount = parkingSpaces.filter(space => space.status === "occupied").length;
  const reservedCount = parkingSpaces.filter(space => space.status === "reserved").length;
  
  return (
    <div className="border-t border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{parkingLot.name}</h2>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 flex items-center mb-1">
            <MapPin className="h-4 w-4 mr-1" /> {parkingLot.address}
          </p>
          <p className="text-gray-600 flex items-center mb-1">
            <Clock className="h-4 w-4 mr-1" /> {parkingLot.openingHour} - {parkingLot.closingHour}
          </p>
          <p className="text-gray-600 flex items-center">
            <Car className="h-4 w-4 mr-1" /> {parkingLot.availableSpots} chỗ trống / {parkingLot.totalSpots} chỗ
          </p>
          
          {/* Navigation / Routing */}
          {onNavigate && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center"
                onClick={onNavigate}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Chỉ đường
              </Button>
              
              {routes && routes.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium">Các tuyến đường:</p>
                  {routes.map((route, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded-md text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{route.name}</span>
                        <span>{route.distance} km</span>
                      </div>
                      <div className="text-gray-500">
                        Thời gian: {route.duration} phút
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mb-4">
          <div className="text-lg font-bold text-green-600">
            {parkingLot.pricePerHour.toLocaleString('vi-VN')}đ / giờ
          </div>
          <Button onClick={onBookNow}>Đặt chỗ ngay</Button>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-grow" style={{ maxHeight: "calc(100vh - 300px)" }}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">Sơ đồ chỗ đỗ xe</h3>
            
            {isSpacesLoading ? (
              <p className="text-center py-8 text-gray-400">Đang tải sơ đồ...</p>
            ) : parkingSpaces.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Không có thông tin về chỗ đỗ xe</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span>Trống ({availableCount})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span>Đã đỗ ({occupiedCount})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                    <span>Đã đặt ({reservedCount})</span>
                  </div>
                </div>
                
                {Object.entries(groupedSpaces).map(([zone, spaces]) => (
                  <div key={zone} className="mt-4">
                    <h4 className="font-medium mb-2">Khu vực {zone}</h4>
                    <ParkingSpotsLayout zone={zone} spaces={spaces} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
