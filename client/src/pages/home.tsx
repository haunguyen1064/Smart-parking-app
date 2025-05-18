import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import SimpleMap, { ParkingLotMarker, RouteInfo } from "@/components/simple-map";
import ContentPanel from "@/components/content-panel";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import RegisterParkingLot from "@/components/register-parking-lot";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // States
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLot | null>(null);
  const [selectedParkingSpace, setSelectedParkingSpace] = useState<ParkingSpace | null>(null);
  const [routes, setRoutes] = useState<RouteInfo[] | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
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
  
  // Handle navigation request - direct navigation using the global method
  const handleNavigate = () => {
    if (!selectedParkingLot) return;
    
    // Show loading toast
    toast({
      title: "Đang tính toán tuyến đường",
      description: "Vui lòng đợi trong khi chúng tôi tính toán tuyến đường tốt nhất.",
    });
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Position obtained successfully
          // Use the global method we exposed from SimpleMap
          // @ts-ignore - Access the method we attached to window
          if (window.navigateToSelectedMarker && typeof window.navigateToSelectedMarker === 'function') {
            // @ts-ignore
            window.navigateToSelectedMarker();
          } else {
            toast({
              title: "Không thể tính toán tuyến đường",
              description: "Có lỗi xảy ra khi tính toán tuyến đường. Vui lòng thử lại sau.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          // Handle error getting location
          toast({
            title: "Không thể lấy vị trí",
            description: "Vui lòng cho phép truy cập vị trí để sử dụng tính năng chỉ đường.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Trình duyệt không hỗ trợ",
        description: "Trình duyệt của bạn không hỗ trợ định vị. Vui lòng thử trình duyệt khác.",
        variant: "destructive",
      });
    }
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
    <div className="h-screen overflow-hidden relative">
      <Navbar />
      
      {/* Full-screen map */}
      <main className="h-[calc(100vh-64px)] w-full overflow-hidden">
        <SimpleMap
          markers={parkingLotMarkers}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedParkingLot?.id}
          onRouteCalculated={handleRouteCalculated}
        />
        
        {/* Floating buttons in top-right corner */}
        <div className="absolute top-20 right-6 z-10">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <div className="flex flex-col space-y-2">
              <Button 
                className="rounded-md px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 w-full"
                onClick={() => setSelectedParkingLot(null)}
              >
                Tìm bãi đỗ xe gần bạn
              </Button>
              
              <Button 
                className="rounded-md px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 w-full"
                onClick={() => setShowRegisterForm(true)}
              >
                Đăng ký bãi đỗ xe của bạn
              </Button>
            </div>
          </div>
        </div>
        
        {/* Only show content panel when a parking lot is selected */}
        {selectedParkingLot && (
          <div className="absolute right-0 top-0 h-full w-full md:w-2/5 z-20">
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
              onRegisterParking={() => setShowRegisterForm(true)}
            />
          </div>
        )}
      </main>
      
      {/* Register Parking Lot Form */}
      {showRegisterForm && (
        <RegisterParkingLot onClose={() => setShowRegisterForm(false)} />
      )}
    </div>
  );
}
