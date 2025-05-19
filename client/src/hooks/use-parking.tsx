import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type ParkingLot = {
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  description?: string;
  openingHour: string;
  closingHour: string;
  ownerId: number;
  images: string[];
  createdAt: string;
};

export type ParkingSpace = {
  id: number;
  parkingLotId: number;
  spotNumber: string;
  zone: string;
  status: "available" | "occupied" | "reserved";
};

export type Booking = {
  id: number;
  userId: number;
  parkingLotId: number;
  parkingSpaceId: number;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalPrice: number;
  createdAt: string;
};

interface ParkingContextProps {
  // Parking Lots
  parkingLots: ParkingLot[] | undefined;
  isParkingLotsLoading: boolean;
  selectedParkingLot: ParkingLot | null;
  setSelectedParkingLot: (parkingLot: ParkingLot | null) => void;
  
  // Parking Spaces
  parkingSpaces: ParkingSpace[] | undefined;
  isParkingSpacesLoading: boolean;
  selectedParkingSpace: ParkingSpace | null;
  setSelectedParkingSpace: (parkingSpace: ParkingSpace | null) => void;
  
  // Bookings
  createBooking: (booking: CreateBookingParams) => Promise<void>;
  isBookingLoading: boolean;
}

type CreateBookingParams = {
  parkingLotId: number;
  parkingSpaceId: number;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
};

const ParkingContext = createContext<ParkingContextProps | undefined>(undefined);

export function ParkingProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Get all parking lots
  const {
    data: parkingLots,
    isLoading: isParkingLotsLoading,
  } = useQuery<ParkingLot[]>({
    queryKey: ["/api/parking-lots"],
  });
  
  // State for selected parking lot
  const [selectedParkingLot, setSelectedParkingLotState] = useState<ParkingLot | null>(null);
  
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
  
  // State for selected parking space
  const [selectedParkingSpace, setSelectedParkingSpace] = useState<ParkingSpace | null>(null);
  
  // Set selected parking lot and reset selected parking space
  const setSelectedParkingLot = (parkingLot: ParkingLot | null) => {
    setSelectedParkingLotState(parkingLot);
    setSelectedParkingSpace(null);
  };
  
  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (params: CreateBookingParams) => {
      const res = await apiRequest("POST", "/api/bookings", params);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking created successfully",
        description: "Your parking space has been reserved.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      if (selectedParkingLot) {
        queryClient.invalidateQueries({
          queryKey: [`/api/parking-lots/${selectedParkingLot.id}/spaces`],
        });
      }
      
      // Reset selected parking space
      setSelectedParkingSpace(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createBooking = async (params: CreateBookingParams) => {
    await bookingMutation.mutateAsync(params);
  };
  
  return (
    <ParkingContext.Provider
      value={{
        parkingLots,
        isParkingLotsLoading,
        selectedParkingLot,
        setSelectedParkingLot,
        parkingSpaces,
        isParkingSpacesLoading,
        selectedParkingSpace,
        setSelectedParkingSpace,
        createBooking,
        isBookingLoading: bookingMutation.isPending,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const context = useContext(ParkingContext);
  if (context === undefined) {
    throw new Error("useParking must be used within a ParkingProvider");
  }
  return context;
}

export function useCreateParkingLot(options?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/parking-lots", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Tạo bãi đỗ xe thất bại");
      }
      return await res.json();
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parking-lots"] });
      options?.onSuccess?.();
    },
    onError: (error: any) => {
      options?.onError?.(error);
    },
  });
}

// Don't forget to import useState
import { useState } from "react";
