import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { format } from "date-fns";

type Booking = {
  id: number;
  userId: number;
  parkingLotId: number;
  parkingSpaceId: number;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalPrice: number;
  createdAt: string;
  user?: {
    fullName: string;
  };
  parkingSpace?: {
    spotNumber: string;
  };
};

type BookingListProps = {
  bookings: Booking[];
  isLoading: boolean;
  onUpdateStatus: (bookingId: number, status: string) => void;
  isUpdating: boolean;
};

export default function BookingList({
  bookings,
  isLoading,
  onUpdateStatus,
  isUpdating,
}: BookingListProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Today's bookings
  const todayBookings = bookings.filter(booking => {
    const today = new Date().setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.startTime).setHours(0, 0, 0, 0);
    return bookingDate === today && booking.status !== "cancelled";
  });

  // Future bookings
  const futureBookings = bookings.filter(booking => {
    const today = new Date().setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.startTime).setHours(0, 0, 0, 0);
    return bookingDate > today && booking.status !== "cancelled";
  });

  const handleUpdateStatus = () => {
    if (selectedBooking && newStatus) {
      onUpdateStatus(selectedBooking.id, newStatus);
      setSelectedBooking(null);
      setNewStatus("");
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  // Get status display name and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { name: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" };
      case "confirmed":
        return { name: "Đã xác nhận", color: "bg-green-100 text-green-800" };
      case "completed":
        return { name: "Hoàn thành", color: "bg-blue-100 text-blue-800" };
      case "cancelled":
        return { name: "Đã hủy", color: "bg-red-100 text-red-800" };
      default:
        return { name: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="w-48 h-6 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Không có đơn đặt chỗ nào
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's bookings */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Đặt trước hôm nay</h3>
          {todayBookings.length === 0 ? (
            <div className="text-center py-3 text-gray-500">
              Không có đơn đặt chỗ nào cho hôm nay
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">
                      {booking.user?.fullName || `Người dùng #${booking.userId}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vị trí: {booking.parkingSpace?.spotNumber || `#${booking.parkingSpaceId}`} - {formatDateTime(booking.startTime)} đến {formatDateTime(booking.endTime)}
                    </div>
                  </div>
                  <div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStatus(booking.status);
                          }}
                        >
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusDisplay(booking.status).color}`}>
                            {getStatusDisplay(booking.status).name}
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cập nhật trạng thái đặt chỗ</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="mb-4">Thay đổi trạng thái đặt chỗ:</p>
                          <Select 
                            value={newStatus} 
                            onValueChange={setNewStatus}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xác nhận</SelectItem>
                              <SelectItem value="confirmed">Xác nhận</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                              <SelectItem value="cancelled">Hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Hủy</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleUpdateStatus} 
                            disabled={isUpdating || newStatus === selectedBooking?.status}
                          >
                            {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future bookings */}
      {futureBookings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Đặt trước sắp tới</h3>
            <div className="space-y-3">
              {futureBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">
                      {booking.user?.fullName || `Người dùng #${booking.userId}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vị trí: {booking.parkingSpace?.spotNumber || `#${booking.parkingSpaceId}`} - {formatDateTime(booking.startTime)}
                    </div>
                  </div>
                  <div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStatus(booking.status);
                          }}
                        >
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusDisplay(booking.status).color}`}>
                            {getStatusDisplay(booking.status).name}
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cập nhật trạng thái đặt chỗ</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="mb-4">Thay đổi trạng thái đặt chỗ:</p>
                          <Select 
                            value={newStatus} 
                            onValueChange={setNewStatus}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xác nhận</SelectItem>
                              <SelectItem value="confirmed">Xác nhận</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                              <SelectItem value="cancelled">Hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Hủy</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleUpdateStatus} 
                            disabled={isUpdating || newStatus === selectedBooking?.status}
                          >
                            {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
