import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Car,
  ArrowLeft,
  Navigation,
  Clock,
  Route,
  Info,
  Image,
} from "lucide-react";
import ParkingSpotsLayout from "./parking-spots-layout";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { RouteInfo } from "./simple-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ParkingDetailProps = {
  parkingLot: ParkingLot;
  parkingSpaces: ParkingSpace[];
  isSpacesLoading: boolean;
  onBookNow: () => void;
  onBack: () => void;
  onNavigate?: () => void;
  routes?: RouteInfo[];
};

export default function ParkingDetail({
  parkingLot,
  parkingSpaces,
  isSpacesLoading,
  onBookNow,
  onBack,
  onNavigate,
  routes,
}: ParkingDetailProps) {
  // Group parking spaces by zone
  const groupedSpaces = parkingSpaces.reduce(
    (groups, space) => {
      if (!groups[space.zone]) {
        groups[space.zone] = [];
      }
      groups[space.zone].push(space);
      return groups;
    },
    {} as Record<string, ParkingSpace[]>,
  );

  // Calculate counts
  const availableCount = parkingSpaces.filter(
    (space) => space.status === "available",
  ).length;
  const occupiedCount = parkingSpaces.filter(
    (space) => space.status === "occupied",
  ).length;

  return (
    <div className="border-t border-gray-200 h-full flex flex-col overflow-auto">
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{parkingLot.name}</h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 flex items-center mb-1">
            <MapPin className="h-4 w-4 mr-1" /> {parkingLot.address}
          </p>
          <p className="text-gray-600 flex items-center mb-1">
            <Clock className="h-4 w-4 mr-1" /> {parkingLot.openingHour} -{" "}
            {parkingLot.closingHour}
          </p>
          <p className="text-gray-600 flex items-center">
            <Car className="h-4 w-4 mr-1" /> {parkingLot.availableSpots} chỗ
            trống / {parkingLot.totalSpots} chỗ
          </p>

          {/* Navigation / Routing */}
          {onNavigate && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
                onClick={onNavigate}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Chỉ đường
              </Button>

              {routes && routes.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium">Các tuyến đường:</p>
                  {routes.map((route, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-2 rounded-md text-sm"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{route.name}</span>
                        <span>{route.distance} km</span>
                      </div>
                      <div className="text-gray-500">
                        Thời gian: {route.duration} phút
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mb-4">
          <div className="text-lg font-bold text-green-600">
            {parkingLot.pricePerHour.toLocaleString("vi-VN")}đ / giờ
          </div>
          <Button onClick={onBookNow}>Đặt chỗ ngay</Button>
        </div>
      </div>

      <div className="p-4 flex-grow">
        <Tabs defaultValue="slots">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="slots">Sơ đồ</TabsTrigger>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="photos">Hình ảnh</TabsTrigger>
          </TabsList>

          <TabsContent value="slots">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">Sơ đồ chỗ đỗ xe</h3>

                {isSpacesLoading ? (
                  <p className="text-center py-8 text-gray-400">
                    Đang tải sơ đồ...
                  </p>
                ) : parkingSpaces.length === 0 ? (
                  <p className="text-center py-8 text-gray-400">
                    Không có thông tin về chỗ đỗ xe
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                        <span>Trống ({availableCount})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                        <span>Đã sử dụng ({occupiedCount})</span>
                      </div>
                    </div>

                    {Object.entries(groupedSpaces).map(([zone, spaces]) => (
                      <div key={zone} className="mt-4">
                        <ParkingSpotsLayout zone={zone} spaces={spaces} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Chi tiết bãi đỗ xe
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Mô tả</h4>
                    <p className="mt-1 text-gray-600">
                      {parkingLot.description ||
                        "Bãi đỗ xe an toàn, thuận tiện với hệ thống giám sát 24/7. Tọa lạc tại vị trí trung tâm, dễ dàng tiếp cận các địa điểm du lịch, mua sắm và giải trí trong khu vực."}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Tiện ích</h4>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Bảo vệ 24/7
                      </li>
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Camera an ninh
                      </li>
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Ánh sáng đầy đủ
                      </li>
                      <li className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Thanh toán không tiền mặt
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Quy định</h4>
                    <ul className="mt-1 space-y-1 text-gray-600 list-disc list-inside">
                      <li>Cung cấp giấy tờ xe hợp lệ khi gửi xe</li>
                      <li>Không để vật có giá trị trong xe</li>
                      <li>Chỉ đỗ tại vị trí đã được chỉ định</li>
                      <li>
                        Thanh toán theo giờ, không hoàn tiền nếu lấy xe sớm
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Hình ảnh
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {parkingLot.images && parkingLot.images.length > 0 ? (
                    parkingLot.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-video bg-gray-100 rounded-md overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${parkingLot.name} - Ảnh ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-gray-400 text-sm">
                          Hình ảnh bãi đỗ xe
                        </div>
                      </div>
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-gray-400 text-sm">
                          Hình ảnh bãi đỗ xe
                        </div>
                      </div>
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-gray-400 text-sm">
                          Hình ảnh bãi đỗ xe
                        </div>
                      </div>
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-gray-400 text-sm">
                          Hình ảnh bãi đỗ xe
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
