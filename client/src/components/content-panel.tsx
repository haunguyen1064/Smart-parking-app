import { useState, useEffect } from "react";
import SearchPanel from "./search-panel";
import ParkingDetail from "./parking-detail";
import BookingPanel from "./booking-panel";
import HomePanel from "./home-panel";
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

type PanelType = "home" | "search" | "detail" | "booking";

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
  const [activePanel, setActivePanel] = useState<PanelType>(user ? "home" : "search");
  
  // Update active panel based on selection
  useEffect(() => {
    if (selectedParkingLot) {
      setActivePanel("detail");
    } else if (user && activePanel !== "home") {
      // Keep the current panel if it's not detail and not home
      // Don't automatically go back to home when deselecting a parking lot
    } else if (!user) {
      setActivePanel("search");
    }
  }, [selectedParkingLot, user]);
  
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
  
  // Function to handle home search button
  const handleSearchParking = () => {
    setActivePanel("search");
  };

  return (
    <div className="w-full md:w-2/5 bg-white overflow-y-auto" id="content-panel">
      {/* Home Panel */}
      <div className={activePanel !== "home" ? "hidden" : ""}>
        <HomePanel 
          onSearchParking={handleSearchParking}
          onRegisterParking={onRegisterParking || (() => {})}
        />
      </div>
      
      {/* Search Panel */}
      <div className={activePanel !== "search" ? "hidden" : ""}>
        <SearchPanel 
          isLoading={isLoading} 
          parkingLots={parkingLots || []} 
          onSelectParkingLot={setSelectedParkingLot}
          onSearch={handleSearch}
        />
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
      <div className={activePanel !== "booking" ? "hidden" : ""}>
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
