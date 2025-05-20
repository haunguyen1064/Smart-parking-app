import { useState, useEffect } from "react";
import SearchPanel from "./search-panel";
import ParkingDetail from "./parking-detail";
import BookingPanel from "./booking-panel";
import HomePanel from "./home-panel";
import RegisterParkingLotPanel from "./register-parking-lot-panel";
import { Layout, ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { RouteInfo } from "./simple-map";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export type PanelType = "home" | "search" | "detail" | "booking" | "register";

type ContentPanelProps = {
  parkingLots: ParkingLot[] | undefined;
  isLoading: boolean;
  selectedParkingLot: ParkingLot | null;
  setSelectedParkingLot: (parkingLot: ParkingLot | null) => void;
  parkingSpaces: Layout[] | undefined;
  isSpacesLoading: boolean;
  selectedParkingSpace: ParkingSpace | null;
  setSelectedParkingSpace: (parkingSpace: ParkingSpace | null) => void;
  onCreateBooking: (data: any) => Promise<void>;
  isBookingLoading: boolean;
  routes?: RouteInfo[];
  onNavigate?: () => void;
  onRegisterParking?: () => void;
  activePanel?: PanelType;
  onActivePanelChange?: (panel: PanelType) => void;
};

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
  onRegisterParking,
  activePanel: controlledActivePanel,
  onActivePanelChange,
}: ContentPanelProps) {
  const { user } = useAuth();
  const [uncontrolledActivePanel, setUncontrolledActivePanel] = useState<PanelType>("home");
  const activePanel = controlledActivePanel !== undefined ? controlledActivePanel : uncontrolledActivePanel;
  const [matchingParkingLots, setMatchingLots] = useState<ParkingLot[]>(
    parkingLots ?? [],
  );
  const [location, setLocation] = useLocation();

  // Helper: update hash fragment for state sharing
  const updateHash = (params: Record<string, string | undefined>) => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) hashParams.delete(key);
      else hashParams.set(key, value);
    });
    window.location.hash = hashParams.toString() ? `#${hashParams.toString()}` : "";
  };

  // Update active panel only when a parking lot is selected
  useEffect(() => {
    if (selectedParkingLot) {
      setActivePanel("detail");
      updateHash({ panel: "detail", lot: String(selectedParkingLot.id) });
    }
  }, [selectedParkingLot]);

  useEffect(() => {
    if (parkingLots?.length) {
      setMatchingLots(parkingLots);
    }
  }, [parkingLots]);

  // Sync activePanel with hash
  useEffect(() => {
    if (activePanel === "home") updateHash({ panel: undefined, lot: undefined });
    else if (activePanel === "search") updateHash({ panel: "search", lot: undefined });
    else if (activePanel === "register") updateHash({ panel: "register", lot: undefined });
    else if (activePanel === "booking" && selectedParkingLot) updateHash({ panel: "booking", lot: String(selectedParkingLot.id) });
    // detail panel handled above
  }, [activePanel]);

  // On mount & when hash changes: parse hash to set initial panel/selection
  useEffect(() => {
    if (!parkingLots) return;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const panel = hashParams.get("panel") as PanelType | null;
    const lotId = hashParams.get("lot");
    if (lotId) {
      const lot = parkingLots.find(l => l.id === Number(lotId));
      if (lot) {
        setSelectedParkingLot(lot);
        if (panel === "booking") setActivePanel("booking");
        else setActivePanel(panel || "detail");
      } else {
        // Nếu không tìm thấy lot, về home
        updateHash({ panel: undefined, lot: undefined });
        setActivePanel("home");
      }
    } else if (panel === "search") setActivePanel("search");
    else if (panel === "register") setActivePanel("register");
    else setActivePanel("home");
  }, [parkingLots]);

  // Listen to hashchange event
  useEffect(() => {
    const onHashChange = () => {
      if (!parkingLots) return;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const panel = hashParams.get("panel") as PanelType | null;
      const lotId = hashParams.get("lot");
      if (lotId) {
        const lot = parkingLots.find(l => l.id === Number(lotId));
        if (lot) {
          setSelectedParkingLot(lot);
          if (panel === "booking") setActivePanel("booking");
          else setActivePanel(panel || "detail");
        } else {
          updateHash({ panel: undefined, lot: undefined });
          setActivePanel("home");
        }
      } else if (panel === "search") setActivePanel("search");
      else if (panel === "register") setActivePanel("register");
      else setActivePanel("home");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [parkingLots]);

  const handleBookNow = () => {
    setActivePanel("booking");
  };

  const handleBackToDetail = () => {
    setActivePanel("detail");
  };

  const handleSearch = (query: string) => {
    // If there's a query, search for matching parking lots
    if (query && parkingLots) {
      const matchingLots = parkingLots.filter(
        (lot) =>
          lot.name.toLowerCase().includes(query.toLowerCase()) ||
          lot.address.toLowerCase().includes(query.toLowerCase()),
      );
      setMatchingLots(matchingLots);
    }

    if (!query) {
      setMatchingLots(parkingLots ?? [])
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

  // Helper to set active panel and notify parent
  const setActivePanel = (panel: PanelType) => {
    if (!controlledActivePanel) setUncontrolledActivePanel(panel);
    if (onActivePanelChange) onActivePanelChange(panel);
  };

  const containerClasses = "w-full bg-white h-full overflow-auto"

  return (
    <div
      className={containerClasses + activePanel === "home" ?  "rounded-xl" : ""}
      id="content-panel"
    >
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
          parkingLots={matchingParkingLots || []}
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
              handleSearchParking()
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
