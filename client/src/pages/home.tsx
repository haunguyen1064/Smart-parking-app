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
  const [activePanel, setActivePanel] = useState<"home" | "search" | "detail" | "booking" | "register">("home");
  
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
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      {/* We don't need the buttons overlay anymore as they are now in the HomePanel */}
      
      <main className="flex-grow relative overflow-hidden">
        {/* Map fills the entire container */}
        <div className="absolute inset-0 w-full h-full">
          <SimpleMap
            markers={parkingLotMarkers}
            onMarkerClick={handleMarkerClick}
            selectedMarkerId={selectedParkingLot?.id}
            onRouteCalculated={handleRouteCalculated}
          />
        </div>
        
        {/* Home buttons directly on the map */}
        {!selectedParkingLot && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col space-y-4 z-10">
            <button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-full shadow-lg"
              onClick={() => {
                // Direct search button for a cleaner interface
                const parkingLot = parkingLots?.[0];
                if (parkingLot) {
                  setSelectedParkingLot(parkingLot);
                }
              }}
            >
              Tìm bãi đỗ xe gần bạn
            </button>
            <button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-full shadow-lg"
              onClick={() => setShowRegisterForm(true)}
            >
              Đăng ký bãi đỗ xe của bạn
            </button>
          </div>
        )}
        
        {/* Content panel is positioned over the map only when needed */}
        {selectedParkingLot && (
          <div className="absolute top-0 right-0 h-full z-10">
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
