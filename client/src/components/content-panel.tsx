import { useState, useEffect } from "react";
import SearchPanel from "./search-panel";
import ParkingDetail from "./parking-detail";
import BookingPanel from "./booking-panel";
import HomePanel from "./home-panel";
import RegisterParkingLotPanel from "./register-parking-lot-panel";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { RouteInfo } from "./simple-map";
import { useAuth } from "@/hooks/use-auth";

type ContentPanelProps = {
  parkingLots: ParkingLot[] | undefined;
  isLoading: boolean;
  selectedParkingLot: ParkingLot | null;
  setSelectedParkingLot: (parkingLot: ParkingLot | null) => void;
  parkingSpaces: ParkingSpace[] | undefined;
  isSpacesLoading: boolean;
  selectedParkingSpace: ParkingSpace | null;
  setSelectedParkingSpace: (parkingSpace: ParkingSpace | null) => void;
  onCreateBooking: (data: any) => Promise<void>;
  isBookingLoading: boolean;
  routes?: RouteInfo[];
  onNavigate?: () => void;
  onRegisterParking?: () => void;
};

type PanelType = "home" | "search" | "detail" | "booking" | "register";

export default function ContentPanel({
  parkingLots,
  isLoading,
  selectedParkingLot,
  setSelectedParkingLot,
  parkingSpaces,
  isSpacesLoading,
  selectedParkingSpace,
  setSelectedParkingSpace,
  onCreateBooking,
  isBookingLoading,
  routes,
  onNavigate,
  onRegisterParking
}: ContentPanelProps) {
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<PanelType>("home");
  
  // Update active panel only when a parking lot is selected
  useEffect(() => {
    if (selectedParkingLot) {
      setActivePanel("detail");
    }
  }, [selectedParkingLot]);
  
  const handleBookNow = () => {
    setActivePanel("booking");
  };
  
  const handleBackToDetail = () => {
    setActivePanel("detail");
  };
  
  const handleSearch = (query: string) => {
    // If there's a query, search for matching parking lots
    if (query && parkingLots) {
      const matchingLots = parkingLots.filter(lot => 
        lot.name.toLowerCase().includes(query.toLowerCase()) ||
        lot.address.toLowerCase().includes(query.toLowerCase())
      );
      
      // If there's only one match, select it
      if (matchingLots.length === 1) {
        setSelectedParkingLot(matchingLots[0]);
      }
    }
  };
  
  // Navigation handlers
  const handleSearchParking = () => {
    setActivePanel("search");
  };
  
  const handleRegisterParking = () => {
    setActivePanel("register");
  };
  
  const handleBackToHome = () => {
    setActivePanel("home");
  };

  return (
    <div className="w-full md:w-2/5 bg-white h-full overflow-auto" id="content-panel">
      {/* Home Panel */}
      <div className={activePanel !== "home" ? "hidden" : ""}>
        <HomePanel 
          onSearchParking={handleSearchParking}
          onRegisterParking={handleRegisterParking}
        />
      </div>
      
      {/* Search Panel */}
      <div className={activePanel !== "search" ? "hidden" : ""}>
        <SearchPanel 
          isLoading={isLoading} 
          parkingLots={parkingLots || []} 
          onSelectParkingLot={setSelectedParkingLot}
          onSearch={handleSearch}
          onBack={handleBackToHome}
        />
      </div>
      
      {/* Register Parking Lot Panel */}
      <div className={activePanel !== "register" ? "hidden" : ""}>
        <RegisterParkingLotPanel onBack={handleBackToHome} />
      </div>
      
      {/* Detail Panel */}
      <div className={activePanel !== "detail" ? "hidden" : ""}>
        {selectedParkingLot && (
          <ParkingDetail 
            parkingLot={selectedParkingLot}
            parkingSpaces={parkingSpaces || []}
            isSpacesLoading={isSpacesLoading}
            onBookNow={handleBookNow}
            onBack={() => {
              setSelectedParkingLot(null);
              // If user is logged in, go back to home panel
              if (user) {
                setActivePanel("home");
              }
            }}
            onNavigate={onNavigate}
            routes={routes}
          />
        )}
      </div>
      
      {/* Booking Panel */}
      <div className={activePanel !== "booking" ? "hidden" : "h-full"}>
        {selectedParkingLot && (
          <BookingPanel 
            parkingLot={selectedParkingLot}
            parkingSpaces={parkingSpaces || []}
            isSpacesLoading={isSpacesLoading}
            selectedParkingSpace={selectedParkingSpace}
            setSelectedParkingSpace={setSelectedParkingSpace}
            onCreateBooking={onCreateBooking}
            isBookingLoading={isBookingLoading}
            onBack={handleBackToDetail}
          />
        )}
      </div>
    </div>
  );
}
