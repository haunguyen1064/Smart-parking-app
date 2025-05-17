import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParkingSpace } from "@/hooks/use-parking";
import ParkingSpotsLayout from "@/components/parking-spots-layout";

type ParkingStatusManagerProps = {
  parkingSpaces: ParkingSpace[];
  isLoading: boolean;
  onUpdateStatus: (spaceId: number, status: string) => void;
  isUpdating: boolean;
};

export default function ParkingStatusManager({
  parkingSpaces,
  isLoading,
  onUpdateStatus,
  isUpdating,
}: ParkingStatusManagerProps) {
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  // Group parking spaces by zone
  const groupedSpaces = parkingSpaces.reduce((groups, space) => {
    if (!groups[space.zone]) {
      groups[space.zone] = [];
    }
    groups[space.zone].push(space);
    return groups;
  }, {} as Record<string, ParkingSpace[]>);

  const handleSpaceClick = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setNewStatus(space.status);
  };

  const handleUpdateStatus = () => {
    if (selectedSpace && newStatus) {
      onUpdateStatus(selectedSpace.id, newStatus);
      setSelectedSpace(null);
      setNewStatus("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="w-48 h-6 mb-4" />
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  if (parkingSpaces.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Không có vị trí đỗ xe nào được tìm thấy
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Cập nhật trạng thái</h3>
          
          <div className="space-y-4">
            {Object.entries(groupedSpaces).map(([zone, spaces]) => (
              <div key={zone} className="mb-4">
                <Dialog>
                  <ParkingSpotsLayout
                    zone={zone}
                    spaces={spaces}
                    selectable={true}
                    onSelectSpace={(space) => {
                      handleSpaceClick(space);
                    }}
                  />
                  
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cập nhật trạng thái vị trí đỗ xe</DialogTitle>
                    </DialogHeader>
                    {selectedSpace && (
                      <div className="py-4">
                        <p className="mb-2">
                          Vị trí: <span className="font-medium">{selectedSpace.spotNumber}</span>
                        </p>
                        <p className="mb-4">
                          Trạng thái hiện tại:{" "}
                          <span className="font-medium">
                            {selectedSpace.status === "available"
                              ? "Chỗ trống"
                              : selectedSpace.status === "occupied"
                              ? "Đã sử dụng"
                              : "Đã đặt trước"}
                          </span>
                        </p>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái mới" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Chỗ trống</SelectItem>
                            <SelectItem value="occupied">Đã sử dụng</SelectItem>
                            <SelectItem value="reserved">Đã đặt trước</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Hủy</Button>
                      </DialogClose>
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={isUpdating || newStatus === selectedSpace?.status}
                      >
                        {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 mt-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Chỗ trống</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Đã sử dụng</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Đã đặt trước</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
