import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, ArrowLeft, Calendar, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import ParkingSpotsLayout from "./parking-spots-layout";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { addHours, format, parseISO } from "date-fns";

type BookingPanelProps = {
  parkingLot: ParkingLot;
  parkingSpaces: ParkingSpace[];
  isSpacesLoading: boolean;
  selectedParkingSpace: ParkingSpace | null;
  setSelectedParkingSpace: (space: ParkingSpace | null) => void;
  onCreateBooking: (data: any) => Promise<void>;
  isBookingLoading: boolean;
  onBack: () => void;
};

export default function BookingPanel({
  parkingLot,
  parkingSpaces,
  isSpacesLoading,
  selectedParkingSpace,
  setSelectedParkingSpace,
  onCreateBooking,
  isBookingLoading,
  onBack,
}: BookingPanelProps) {
  const [bookingDuration, setBookingDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState<string>(
    format(new Date(), "HH:mm")
  );
  
  // Group parking spaces by zone
  const groupedSpaces = parkingSpaces.reduce((groups, space) => {
    if (!groups[space.zone]) {
      groups[space.zone] = [];
    }
    groups[space.zone].push(space);
    return groups;
  }, {} as Record<string, ParkingSpace[]>);
  
  const handleSpotSelect = (space: ParkingSpace) => {
    if (space.status === "available") {
      setSelectedParkingSpace(
        selectedParkingSpace?.id === space.id ? null : space
      );
    }
  };
  
  const handleCreateBooking = async () => {
    if (!selectedParkingSpace) {
      alert("Please select a parking space");
      return;
    }
    
    // Parse start time
    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    // Calculate end time based on duration
    const endDateTime = addHours(startDateTime, bookingDuration);
    
    // Calculate total price
    const totalPrice = parkingLot.pricePerHour * bookingDuration;
    
    // Create booking
    await onCreateBooking({
      parkingLotId: parkingLot.id,
      parkingSpaceId: selectedParkingSpace.id,
      startTime: startDateTime,
      endTime: endDateTime,
      totalPrice: totalPrice,
    });
  };
  
  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" className="mr-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">Đặt chỗ trước</h2>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium">{parkingLot.name}</h3>
        <div className="flex items-start space-x-2 mt-1">
          <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
          <p className="text-sm">{parkingLot.address}</p>
        </div>
        <div className="flex items-start space-x-2 mt-1">
          <Car className="h-4 w-4 mt-0.5 text-gray-500" />
          <p className="text-sm">
            {parkingLot.availableSpots} chỗ trống / {parkingLot.totalSpots} chỗ
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-3">Thời gian</h3>
        
        <Tabs defaultValue="hour">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="hour">Giờ</TabsTrigger>
            <TabsTrigger value="day">Ngày</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hour" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ngày</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Giờ bắt đầu</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Thời gian đặt (giờ)</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingDuration(Math.max(1, bookingDuration - 1))}
                  disabled={bookingDuration <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={bookingDuration}
                  onChange={(e) => setBookingDuration(parseInt(e.target.value) || 1)}
                  min="1"
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingDuration(bookingDuration + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Tổng thời gian:</span>
                </div>
                <span className="font-medium">{bookingDuration} giờ</span>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Tổng tiền:</span>
                </div>
                <span className="font-medium text-primary">
                  {(parkingLot.pricePerHour * bookingDuration).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="day">
            <div className="bg-gray-100 p-6 rounded-md text-center text-gray-500">
              Chức năng đặt theo ngày sẽ được cập nhật sau
            </div>
          </TabsContent>
          
          <TabsContent value="month">
            <div className="bg-gray-100 p-6 rounded-md text-center text-gray-500">
              Chức năng đặt theo tháng sẽ được cập nhật sau
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-3">Chọn vị trí</h3>
        
        {isSpacesLoading ? (
          <Card>
            <CardContent className="p-4 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSpaces).map(([zone, spaces]) => (
            <div key={zone} className="mb-4">
              <ParkingSpotsLayout
                zone={zone}
                spaces={spaces}
                selectable={true}
                selectedSpaceId={selectedParkingSpace?.id}
                onSelectSpace={handleSpotSelect}
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
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Đang chọn</span>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full" 
        onClick={handleCreateBooking} 
        disabled={!selectedParkingSpace || isBookingLoading}
      >
        {isBookingLoading ? "Đang xử lý..." : "Xác nhận"}
      </Button>
    </div>
  );
}
