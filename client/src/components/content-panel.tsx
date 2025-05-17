import { useState, useEffect } from "react";
import SearchPanel from "./search-panel";
import ParkingDetail from "./parking-detail";
import BookingPanel from "./booking-panel";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { RouteInfo } from "./simple-map";

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
};

type PanelType = "search" | "detail" | "booking";

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
}: ContentPanelProps) {
  const [activePanel, setActivePanel] = useState<PanelType>("search");
  
  // Update active panel based on selection
  useEffect(() => {
    if (selectedParkingLot) {
      setActivePanel("detail");
    } else {
      setActivePanel("search");
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
  
  return (
    <div className="w-full md:w-2/5 bg-white overflow-y-auto" id="content-panel">
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
            onBack={() => setSelectedParkingLot(null)}
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
