import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Car, ArrowLeft, Calendar, Clock, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import ParkingSpotsLayout from "./parking-spots-layout";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { addDays, addHours, addMonths, differenceInDays, format, parseISO } from "date-fns";

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
  // Booking by hour states
  const [bookingDuration, setBookingDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState<string>(
    format(new Date(), "HH:mm")
  );
  
  // Booking by day states
  const [selectedDates, setSelectedDates] = useState<string[]>([
    format(new Date(), "dd/MM/yyyy"),
    format(addDays(new Date(), 1), "dd/MM/yyyy"),
  ]);
  
  // Booking by month states
  const [startMonthDate, setStartMonthDate] = useState<string>(
    format(new Date(), "dd/MM/yyyy")
  );
  const [monthCount, setMonthCount] = useState<number>(1);
  
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
  
  // Add a date to selectedDates
  const handleAddDate = () => {
    // Add a new date (current date + length of current dates array)
    const newDate = format(
      addDays(new Date(), selectedDates.length),
      "dd/MM/yyyy"
    );
    setSelectedDates([...selectedDates, newDate]);
  };
  
  // Remove a date from selectedDates
  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
  };
  
  // Track the current booking mode
  const [activeTab, setActiveTab] = useState<"hour" | "day" | "month">("hour");
  
  // Create booking based on active tab
  const handleCreateBooking = async () => {
    if (!selectedParkingSpace) {
      alert("Vui lòng chọn một vị trí đỗ xe");
      return;
    }
    
    let startDateTime: Date;
    let endDateTime: Date;
    let totalPrice: number;
    
    if (activeTab === "hour") {
      // Parse start time for hourly booking
      startDateTime = new Date(`${startDate}T${startTime}`);
      
      // Calculate end time based on hour duration
      endDateTime = addHours(startDateTime, bookingDuration);
      
      // Calculate total price for hours
      totalPrice = parkingLot.pricePerHour * bookingDuration;
    } 
    else if (activeTab === "day") {
      // For day booking, use the first selected date as start
      // and the last selected date + 1 as end
      const firstDate = selectedDates[0];
      const lastDate = selectedDates[selectedDates.length - 1];
      
      // Parse the date strings (format: dd/MM/yyyy)
      const [firstDay, firstMonth, firstYear] = firstDate.split('/').map(Number);
      startDateTime = new Date(firstYear, firstMonth - 1, firstDay, 0, 0, 0);
      
      const [lastDay, lastMonth, lastYear] = lastDate.split('/').map(Number);
      // End time is the end of the last selected day
      endDateTime = new Date(lastYear, lastMonth - 1, lastDay, 23, 59, 59);
      
      // Calculate number of days for pricing
      const daysDifference = differenceInDays(endDateTime, startDateTime) + 1;
      
      // Calculate price (assuming daily price is 8 hours of hourly price)
      totalPrice = parkingLot.pricePerHour * 8 * daysDifference;
    }
    else if (activeTab === "month") {
      // Parse the start date string (format: dd/MM/yyyy)
      const [startDay, startMonth, startYear] = startMonthDate.split('/').map(Number);
      startDateTime = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
      
      // Calculate end date (add months to start date)
      endDateTime = addMonths(startDateTime, monthCount);
      
      // Calculate price (assuming monthly price is 30 days of daily price)
      // Daily price is 8 hours of hourly price
      totalPrice = parkingLot.pricePerHour * 8 * 30 * monthCount;
    }
    else {
      return;
    }
    
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
    <div className="border-t border-gray-200 p-4 h-full overflow-y-auto">
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
        
        <Tabs defaultValue="hour" onValueChange={(value) => setActiveTab(value as "hour" | "day" | "month")}>
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
          
          <TabsContent value="day" className="space-y-4">
            <div className="space-y-3">
              {selectedDates.map((date, index) => (
                <div key={index} className="relative">
                  <Input 
                    value={date} 
                    readOnly 
                    className="pr-10"
                  />
                  {selectedDates.length > 1 && (
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleRemoveDate(date)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleAddDate}
              >
                <Plus size={16} />
                <span>Thêm ngày</span>
              </Button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Tổng ngày:</span>
                </div>
                <span className="font-medium">{selectedDates.length} ngày</span>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Tổng tiền:</span>
                </div>
                <span className="font-medium text-primary">
                  {(parkingLot.pricePerHour * 8 * selectedDates.length).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="month" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Từ ngày</label>
                <Input
                  type="date"
                  value={format(parseISO(startMonthDate.split('/').reverse().join('-')), 'yyyy-MM-dd')}
                  onChange={(e) => setStartMonthDate(format(new Date(e.target.value), 'dd/MM/yyyy'))}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Số tháng</label>
                <Input
                  type="number"
                  value={monthCount}
                  onChange={(e) => setMonthCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="12"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Thời hạn:</span>
                </div>
                <span className="font-medium">{monthCount} tháng</span>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Tổng tiền:</span>
                </div>
                <span className="font-medium text-primary">
                  {(parkingLot.pricePerHour * 8 * 30 * monthCount).toLocaleString('vi-VN')}đ
                </span>
              </div>
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
