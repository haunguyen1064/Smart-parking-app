import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, ArrowLeft } from "lucide-react";
import ParkingSpotsLayout from "./parking-spots-layout";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";

type ParkingDetailProps = {
  parkingLot: ParkingLot;
  parkingSpaces: ParkingSpace[];
  isSpacesLoading: boolean;
  onBookNow: () => void;
  onBack: () => void;
};

export default function ParkingDetail({ 
  parkingLot, 
  parkingSpaces,
  isSpacesLoading,
  onBookNow,
  onBack
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
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="mr-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">{parkingLot.name}</h2>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <Button variant="secondary" size="sm" className="rounded-full text-xs">
          Chỗ trống
        </Button>
        <Button className="rounded-full text-xs" onClick={onBookNow}>
          Đặt chỗ
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-start space-x-2 mb-2">
          <MapPin className="h-4 w-4 mt-1 text-gray-500" />
          <p>{parkingLot.address}</p>
        </div>
        <div className="flex items-start space-x-2">
          <Car className="h-4 w-4 mt-1 text-gray-500" />
          <p>{availableCount} chỗ trống</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Mô tả</h3>
        <p className="text-gray-600">{parkingLot.description || "Không có mô tả"}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Thời gian mở cửa</h3>
        <p className="text-gray-600">{parkingLot.openingHour} - {parkingLot.closingHour}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Giá</h3>
        <p className="text-gray-600">{parkingLot.pricePerHour.toLocaleString('vi-VN')}đ/giờ</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Ảnh</h3>
        <div className="relative">
          <img 
            src={parkingLot.images[0] || "https://images.unsplash.com/photo-1590674899484-13e8f7733e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"}
            alt={parkingLot.name} 
            className="w-full h-48 object-cover rounded-lg"
          />
          {parkingLot.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
              +{parkingLot.images.length - 1}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Sơ đồ</h3>
        
        {isSpacesLoading ? (
          <Card>
            <CardContent className="p-4 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : parkingSpaces.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-gray-500">
              Không có thông tin về vị trí đỗ xe
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSpaces).map(([zone, spaces]) => (
            <div key={zone} className="mb-4">
              <ParkingSpotsLayout 
                zone={zone}
                spaces={spaces}
                selectable={false}
              />
            </div>
          ))
        )}
        
        <div className="flex space-x-4 mt-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Chỗ trống</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">Đã sử dụng</span>
          </div>
          {reservedCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Đã đặt trước</span>
            </div>
          )}
        </div>
      </div>
      
      <Button className="w-full" onClick={onBookNow}>
        Đặt chỗ ngay
      </Button>
    </div>
  );
}
