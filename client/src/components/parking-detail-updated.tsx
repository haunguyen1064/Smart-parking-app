import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Navigation, Clock, Car } from "lucide-react";
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
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-grow overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold mb-2">{parkingLot.name}</h2>
          
          <div className="flex space-x-2 mb-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-full"
              onClick={onNavigate}
            >
              Chỉ đường
            </Button>
            
            <Button 
              size="sm" 
              variant="default" 
              className="rounded-full bg-indigo-500 text-white"
              onClick={onBookNow}
            >
              Đặt chỗ
            </Button>
          </div>
          
          <div className="flex items-center mb-2">
            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-700">{parkingLot.address}</span>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 flex items-center">
              <Car className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-700">{parkingLot.availableSpots} chỗ trống</span>
            </div>
          </div>
        </div>
        
        {/* Description Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-2">Mô tả</h3>
          <p className="text-gray-700">{parkingLot.description || "Bãi đỗ xe ngoài trời, có bảo vệ"}</p>
        </div>
        
        {/* Photos Section */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium mb-2">Ảnh</h3>
          <div className="relative overflow-hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {parkingLot.images && parkingLot.images.length > 0 ? (
                parkingLot.images.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-56 h-32 bg-gray-200 rounded-md overflow-hidden">
                    <img src={image} alt={`Parking lot ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="flex-shrink-0 w-56 h-32 bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                    alt="Default parking lot" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div className="flex-shrink-0 w-12 h-32 flex items-center justify-center bg-gray-100 rounded-md">
                <span className="text-gray-500 font-medium">+10</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Parking Layout */}
        <div className="p-4">
          <h3 className="text-lg font-medium mb-3">Sơ đồ</h3>
          
          {isSpacesLoading ? (
            <div className="py-8 text-center text-gray-500">Đang tải sơ đồ...</div>
          ) : (
            <>
              {Object.entries(groupedSpaces).map(([zone, spaces]) => (
                <div key={zone} className="mb-6">
                  <div className="grid grid-cols-5 gap-2">
                    {spaces.map((space) => {
                      const statusColor = 
                        space.status === "available" 
                          ? "bg-blue-500" 
                          : space.status === "occupied" 
                            ? "bg-gray-400" 
                            : "bg-orange-500";
                      
                      return (
                        <div
                          key={space.id}
                          className={`${statusColor} text-white text-center py-3 rounded-md`}
                        >
                          {space.spotNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center text-sm mt-2">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span>Chỗ trống</span>
                </div>
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                  <div>Đã sử dụng</div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Route Info */}
        {routes && routes.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="font-medium mb-2">Tuyến đường đến bãi đỗ xe</h3>
            <div className="space-y-2">
              {routes.map((route, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{route.name}</span>
                    <span>{route.distance} km</span>
                  </div>
                  <div className="text-gray-600 text-sm">
                    Thời gian: {route.duration} phút
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed back button on top */}
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 rounded-full w-8 h-8 bg-white shadow-md flex items-center justify-center z-10"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    </div>
  );
}