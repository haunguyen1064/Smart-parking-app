import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";

type ParkingLotStatsProps = {
  parkingLot: ParkingLot;
  parkingSpaces: ParkingSpace[];
  isLoading: boolean;
};

export default function ParkingLotStats({
  parkingLot,
  parkingSpaces,
  isLoading,
}: ParkingLotStatsProps) {
  // Calculate counts
  const availableCount = parkingSpaces.filter(space => space.status === "available").length;
  const occupiedCount = parkingSpaces.filter(space => space.status === "occupied").length;
  const reservedCount = parkingSpaces.filter(space => space.status === "reserved").length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <Skeleton className="w-40 h-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-4">{parkingLot.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-md text-center">
            <div className="text-3xl font-semibold text-primary">{availableCount}</div>
            <div className="text-sm text-gray-600">Chỗ trống</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-md text-center">
            <div className="text-3xl font-semibold text-orange-500">{occupiedCount}</div>
            <div className="text-sm text-gray-600">Đã sử dụng</div>
          </div>
          <div className="bg-green-50 p-3 rounded-md text-center">
            <div className="text-3xl font-semibold text-green-500">{reservedCount}</div>
            <div className="text-sm text-gray-600">Đã đặt trước</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
