import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import ParkingLotStats from "@/components/owner/parking-lot-stats";
import BookingList from "@/components/owner/booking-list";
import ParkingStatusManager from "@/components/owner/parking-status-manager";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { Loader2 } from "lucide-react";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedParkingLot, setSelectedParkingLot] = useState<ParkingLot | null>(null);

  // Redirect if not logged in or not an owner
  useEffect(() => {
    if (user && user.role !== "owner") {
      toast({
        title: "Quyền truy cập bị từ chối",
        description: "Bạn không có quyền truy cập vào trang này.",
        variant: "destructive",
      });
      navigate("/");
    } else if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để truy cập trang này.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  // Get owner's parking lots
  const {
    data: parkingLots,
    isLoading: isParkingLotsLoading,
    isError: isParkingLotsError,
  } = useQuery<ParkingLot[]>({
    queryKey: ["/api/owner/parking-lots"],
    enabled: !!user && user.role === "owner",
  });

  // Get parking spaces for selected parking lot
  const {
    data: parkingSpaces,
    isLoading: isParkingSpacesLoading,
    isError: isParkingSpacesError,
  } = useQuery<ParkingSpace[]>({
    queryKey: [
      `/api/parking-lots/${selectedParkingLot?.id}/spaces`,
      selectedParkingLot?.id,
    ],
    enabled: !!selectedParkingLot,
  });

  // Get bookings for selected parking lot
  const {
    data: bookings,
    isLoading: isBookingsLoading,
    isError: isBookingsError,
  } = useQuery({
    queryKey: [
      `/api/parking-lots/${selectedParkingLot?.id}/bookings`,
      selectedParkingLot?.id,
    ],
    enabled: !!selectedParkingLot,
  });

  // Update parking space status mutation
  const updateSpaceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/parking-spaces/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái vị trí đỗ xe đã được cập nhật.",
      });

      // Invalidate queries to refresh data
      if (selectedParkingLot) {
        queryClient.invalidateQueries({
          queryKey: [`/api/parking-lots/${selectedParkingLot.id}/spaces`],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/owner/parking-lots"],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/parking-lots/${selectedParkingLot.id}/bookings`],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Cập nhật thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đặt chỗ đã được cập nhật.",
      });

      // Invalidate queries to refresh data
      if (selectedParkingLot) {
        queryClient.invalidateQueries({
          queryKey: [`/api/parking-lots/${selectedParkingLot.id}/bookings`],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Cập nhật thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set the first parking lot as selected when data is loaded
  useEffect(() => {
    if (parkingLots && parkingLots.length > 0 && !selectedParkingLot) {
      setSelectedParkingLot(parkingLots[0]);
    }
  }, [parkingLots, selectedParkingLot]);

  // Handle space status update
  const handleUpdateSpaceStatus = (spaceId: number, status: string) => {
    updateSpaceStatusMutation.mutate({ id: spaceId, status });
  };

  // Handle booking status update
  const handleUpdateBookingStatus = (bookingId: number, status: string) => {
    updateBookingStatusMutation.mutate({ id: bookingId, status });
  };

  if (!user || user.role !== "owner") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow p-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold mb-6">Quản lý bãi đỗ xe</h1>

          {isParkingLotsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isParkingLotsError ? (
            <Card>
              <CardContent className="p-6 text-center text-red-500">
                Đã xảy ra lỗi khi tải dữ liệu bãi đỗ xe. Vui lòng thử lại sau.
              </CardContent>
            </Card>
          ) : parkingLots && parkingLots.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4 text-gray-500">Bạn chưa có bãi đỗ xe nào.</p>
                <Button>Thêm bãi đỗ xe mới</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Parking lot selector */}
              {parkingLots && parkingLots.length > 1 && (
                <div className="mb-6">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h2 className="text-sm font-medium mb-2">Chọn bãi đỗ xe:</h2>
                    <div className="flex flex-wrap gap-2">
                      {parkingLots.map((lot) => (
                        <Button
                          key={lot.id}
                          variant={selectedParkingLot?.id === lot.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedParkingLot(lot)}
                        >
                          {lot.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedParkingLot && (
                <div>
                  <ParkingLotStats
                    parkingLot={selectedParkingLot}
                    parkingSpaces={parkingSpaces || []}
                    isLoading={isParkingSpacesLoading || isBookingsLoading}
                  />

                  <Tabs defaultValue="bookings" className="mt-6">
                    <TabsList className="grid grid-cols-2 w-full md:w-[400px] mb-4">
                      <TabsTrigger value="bookings">Đặt trước</TabsTrigger>
                      <TabsTrigger value="spaces">Cập nhật trạng thái</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings">
                      <BookingList
                        bookings={bookings || []}
                        isLoading={isBookingsLoading}
                        onUpdateStatus={handleUpdateBookingStatus}
                        isUpdating={updateBookingStatusMutation.isPending}
                      />
                    </TabsContent>

                    <TabsContent value="spaces">
                      <ParkingStatusManager
                        parkingSpaces={parkingSpaces || []}
                        isLoading={isParkingSpacesLoading}
                        onUpdateStatus={handleUpdateSpaceStatus}
                        isUpdating={updateSpaceStatusMutation.isPending}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
