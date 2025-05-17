import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import SimpleMap, { ParkingLotMarker, RouteInfo } from "@/components/simple-map";
import ContentPanel from "@/components/content-panel";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // States
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLot | null>(null);
  const [selectedParkingSpace, setSelectedParkingSpace] = useState<ParkingSpace | null>(null);
  const [routes, setRoutes] = useState<RouteInfo[] | null>(null);
  
  // Get all parking lots
  const {
    data: parkingLots,
    isLoading: isParkingLotsLoading,
  } = useQuery<ParkingLot[]>({
    queryKey: ["/api/parking-lots"],
  });
  
  // Get parking spaces for selected parking lot
  const {
    data: parkingSpaces,
    isLoading: isParkingSpacesLoading,
  } = useQuery<ParkingSpace[]>({
    queryKey: [
      `/api/parking-lots/${selectedParkingLot?.id}/spaces`,
      selectedParkingLot?.id,
    ],
    enabled: !!selectedParkingLot,
  });
  
  // Convert parking lots to markers
  const parkingLotMarkers = parkingLots
    ? parkingLots.map((lot) => ({
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        availableSpots: lot.availableSpots,
        totalSpots: lot.totalSpots,
        isSelected: selectedParkingLot?.id === lot.id,
      }))
    : [];
  
  // Handle marker click
  const handleMarkerClick = (marker: ParkingLotMarker) => {
    const parkingLot = parkingLots?.find((lot) => lot.id === marker.id);
    if (parkingLot) {
      setSelectedParkingLot(parkingLot);
      // Clear any existing routes when selecting a new parking lot
      setRoutes(null);
    }
  };
  
  // Handle route calculation
  const handleRouteCalculated = (calculatedRoutes: RouteInfo[]) => {
    setRoutes(calculatedRoutes);
    
    // Display notification
    if (calculatedRoutes.length > 0) {
      toast({
        title: "Tìm thấy tuyến đường",
        description: `Đã tìm thấy ${calculatedRoutes.length} tuyến đường đến ${selectedParkingLot?.name}.`,
      });
    }
  };
  
  // Handle navigation request
  const handleNavigate = () => {
    // Map component will handle the actual navigation calculation
    // This just signals the intent to navigate
    toast({
      title: "Đang tính toán tuyến đường",
      description: "Vui lòng đợi trong giây lát...",
    });
  };
  
  // Create booking
  const createBooking = async (bookingData: any) => {
    if (!user) {
      toast({
        title: "Đăng nhập để đặt chỗ",
        description: "Vui lòng đăng nhập để đặt chỗ đỗ xe.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/bookings", bookingData);
      
      toast({
        title: "Đặt chỗ thành công",
        description: "Vui lòng kiểm tra thông tin đặt chỗ của bạn.",
      });
      
      // Reset selected parking space
      setSelectedParkingSpace(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/parking-lots/${selectedParkingLot?.id}/spaces`],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/parking-lots"],
      });
    } catch (error) {
      toast({
        title: "Đặt chỗ thất bại",
        description: error instanceof Error ? error.message : "Đã có lỗi xảy ra.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex flex-col md:flex-row h-full">
        <SimpleMap
          markers={parkingLotMarkers}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedParkingLot?.id}
          onRouteCalculated={handleRouteCalculated}
        />
        
        <ContentPanel
          parkingLots={parkingLots}
          isLoading={isParkingLotsLoading}
          selectedParkingLot={selectedParkingLot}
          setSelectedParkingLot={setSelectedParkingLot}
          parkingSpaces={parkingSpaces}
          isSpacesLoading={isParkingSpacesLoading}
          selectedParkingSpace={selectedParkingSpace}
          setSelectedParkingSpace={setSelectedParkingSpace}
          onCreateBooking={createBooking}
          isBookingLoading={false}
          routes={routes || undefined}
          onNavigate={handleNavigate}
        />
      </main>
    </div>
  );
}
