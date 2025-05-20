import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { ParkingLot, ParkingSpace } from "@/hooks/use-parking";
import { 
  Loader2, Plus, Info, Edit, Trash2, 
  LayersIcon, CarIcon, AlertCircle, 
  ParkingCircle, CheckCircle
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Simulated data for reservation trends
const weeklyReservationData = [
  { day: "Mon", reservations: 37 },
  { day: "Tue", reservations: 45 },
  { day: "Wed", reservations: 38 },
  { day: "Thu", reservations: 53 },
  { day: "Fri", reservations: 65 },
  { day: "Sat", reservations: 46 },
  { day: "Sun", reservations: 42 }
];

// Simulated data for a single parking lot
const mockParkingLot = {
  id: 5,
  name: "Bãi đỗ xe Tân Phú",
  address: "99 Tân Kỳ Tân Quý, Tân Phú",
  latitude: "10.7891",
  longitude: "106.6290",
  totalSpots: 25,
  availableSpots: 18,
  pricePerHour: 15000,
  description: "Bãi đỗ xe an toàn tại khu vực Tân Phú",
  openingHour: "06:00",
  closingHour: "23:00",
  ownerId: 1,
  images: ["https://example.com/parking1.jpg"],
  createdAt: "2023-01-01T00:00:00Z"
};

// Mocked parking lot data
const mockParkingLots = [
  {
    id: 1,
    name: "Bãi đỗ xe A",
    address: "123 đường ABC",
    latitude: "10.7725",
    longitude: "106.6980",
    totalSpots: 45,
    availableSpots: 12,
    pricePerHour: 20000,
    description: "Bãi đỗ xe trung tâm quận 1",
    openingHour: "05:00",
    closingHour: "23:59",
    ownerId: 1,
    images: ["https://example.com/parking1.jpg"],
    createdAt: "2023-01-01T00:00:00Z",
    status: "available"
  },
  {
    id: 2,
    name: "Bãi đỗ xe B",
    address: "1A Hoàng Văn Thụ, Tân Bình",
    latitude: "10.8023",
    longitude: "106.6644",
    totalSpots: 30,
    availableSpots: 0,
    pricePerHour: 15000,
    description: "Bãi đỗ xe gần sân bay",
    openingHour: "06:00",
    closingHour: "22:00",
    ownerId: 1,
    images: ["https://example.com/parking2.jpg"],
    createdAt: "2023-01-02T00:00:00Z",
    status: "full"
  },
  {
    id: 3,
    name: "Bãi đỗ xe C",
    address: "59 Võ Văn Ngân, Thủ Đức",
    latitude: "10.8509",
    longitude: "106.7721",
    totalSpots: 60,
    availableSpots: 0,
    pricePerHour: 18000,
    description: "Bãi đỗ xe khu vực Thủ Đức",
    openingHour: "00:00",
    closingHour: "23:59",
    ownerId: 1,
    images: ["https://example.com/parking3.jpg"],
    createdAt: "2023-01-03T00:00:00Z",
    status: "full"
  },
  mockParkingLot
];

// Mock chart data
const availabilityData = [
  { name: "Còn trống", value: 32, color: "#2563EB" },
  { name: "Đã đặt", value: 83, color: "#F59E0B" }
];

// Pie chart colors
const COLORS = ["#2563EB", "#F59E0B"];

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [parkingLotToDelete, setParkingLotToDelete] = useState<ParkingLot | null>(null);
  const [newParkingLotData, setNewParkingLotData] = useState({
    name: "",
    address: "",
    totalSpots: "30",
    pricePerHour: "15000"
  });

  // For demo purposes, allow all logged-in users to access the dashboard
  useEffect(() => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để truy cập trang này.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  // Get owner's parking lots - using mocked data
  const {
    data: parkingLots = mockParkingLots,
    isLoading: isParkingLotsLoading,
    isError: isParkingLotsError,
  } = useQuery<ParkingLot[]>({
    queryKey: ["/api/owner/parking-lots"],
    enabled: !!user && user.role === "owner",
    initialData: mockParkingLots,
    staleTime: Infinity // For demo, prevent refetching
  });

  // Calculate statistics from the parking lots data
  const totalParkingLots = parkingLots?.length || 0;
  const totalParkingSpots = parkingLots?.reduce((acc, lot) => acc + lot.totalSpots, 0) || 0;
  const totalAvailableSpots = parkingLots?.reduce((acc, lot) => acc + lot.availableSpots, 0) || 0;
  const totalReservedSpots = totalParkingSpots - totalAvailableSpots;

  // Handle adding a new parking lot
  const handleAddParkingLot = async () => {
    // Validate inputs
    if (!newParkingLotData.name.trim() || !newParkingLotData.address.trim()) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng nhập đầy đủ thông tin bãi đỗ xe.",
        variant: "destructive",
      });
      return;
    }

    // Create a new parking lot object
    const newLot = {
      ...mockParkingLot,
      id: mockParkingLots.length + 1,
      name: newParkingLotData.name,
      address: newParkingLotData.address,
      totalSpots: parseInt(newParkingLotData.totalSpots),
      availableSpots: parseInt(newParkingLotData.totalSpots), // All spots initially available
      pricePerHour: parseInt(newParkingLotData.pricePerHour),
    };

    // For demo, we'll mock adding to the array
    mockParkingLots.push(newLot as any);
    
    // Close dialog and show success message
    setIsAddDialogOpen(false);
    toast({
      title: "Thêm thành công",
      description: "Bãi đỗ xe đã được thêm vào hệ thống.",
    });

    // Reset form data
    setNewParkingLotData({
      name: "",
      address: "",
      totalSpots: "30",
      pricePerHour: "15000"
    });
    
    // Refetch data to reflect changes
    queryClient.invalidateQueries({
      queryKey: ["/api/owner/parking-lots"],
    });
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (lot: ParkingLot) => {
    setParkingLotToDelete(lot);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete parking lot after confirmation
  const handleDeleteParkingLot = () => {
    if (!parkingLotToDelete) return;
    
    // Demo: Remove from mocked array
    const index = mockParkingLots.findIndex(lot => lot.id === parkingLotToDelete.id);
    if (index !== -1) {
      mockParkingLots.splice(index, 1);
    }
    
    // Close dialog and show success message
    setIsDeleteDialogOpen(false);
    setParkingLotToDelete(null);
    
    toast({
      title: "Xóa thành công",
      description: "Bãi đỗ xe đã được xóa khỏi hệ thống.",
    });
    
    // Refresh data
    queryClient.invalidateQueries({
      queryKey: ["/api/owner/parking-lots"],
    });
  };

  // For demo purposes, allow access if user is logged in
  if (!user) {
    return null; // Will redirect via useEffect
  }

  const handleAddParkingLotClick = () => {
    navigate("/");
    setTimeout(() => {
      window.location.hash = "panel=register";
    }, 0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow p-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Bảng điều khiển</h1>

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
          ) : (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white shadow-sm">
                  <CardContent className="flex items-center py-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <LayersIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-3xl font-bold text-gray-800">{totalParkingLots}</p>
                      <p className="text-sm text-gray-500">Tổng số bãi xe</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardContent className="flex items-center py-6">
                    <div className="bg-indigo-100 p-4 rounded-full">
                      <ParkingCircle className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-3xl font-bold text-gray-800">{totalAvailableSpots}</p>
                      <p className="text-sm text-gray-500">Số chỗ đỗ xe còn trống</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardContent className="flex items-center py-6">
                    <div className="bg-amber-100 p-4 rounded-full">
                      <CheckCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-3xl font-bold text-gray-800">{totalReservedSpots}</p>
                      <p className="text-sm text-gray-500">Số chỗ đã được đặt</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-md font-medium">Xu hướng đặt chỗ</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weeklyReservationData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="reservations" 
                            stroke="#2563EB" 
                            strokeWidth={2} 
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-md font-medium">Phân phối đặt chỗ</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex justify-center items-center">
                      <div className="w-full h-full flex">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={availabilityData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {availabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      {availabilityData.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center">
                          <div 
                            className="w-4 h-4 mr-2 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Parking Lots List */}
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Bãi xe của tôi</h2>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddParkingLotClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bãi xe
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parkingLots.map((lot) => (
                  <Card key={lot.id} className="overflow-hidden bg-white border border-gray-200">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center">
                        <div className="bg-blue-600 p-2 rounded-md text-white">
                          <ParkingCircle className="h-5 w-5" />
                        </div>
                        <div className="ml-2">
                          <CardTitle className="text-lg font-medium">{lot.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">{lot.address}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <CarIcon className="h-4 w-4 mr-1" />
                          <span>Tổng số: {lot.totalSpots} chỗ</span>
                        </div>
                        <Badge 
                          variant={lot.availableSpots > 0 ? "outline" : "destructive"} 
                          className={`${lot.availableSpots > 0 ? 'border-green-500 text-green-600 bg-green-50' : ''}`}
                        >
                          {lot.availableSpots > 0 ? 'Còn trống' : 'Đầy'}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>Trống: {lot.availableSpots}</span>
                        <span>Đã đặt: {lot.totalSpots - lot.availableSpots}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-4 pt-2 bg-gray-50 border-t">
                      <Button variant="ghost" size="sm" className="flex items-center text-blue-600" onClick={() => {
                        navigate("/");
                        setTimeout(() => {
                          window.location.hash = `panel=detail&lot=${lot.id}`;
                        }, 0);
                      }}>
                        <Info className="h-4 w-4 mr-1" />
                        <span>Chi tiết</span>
                      </Button>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => {
                          navigate("/");
                          setTimeout(() => {
                            window.location.hash = `panel=edit&lot=${lot.id}`;
                          }, 0);
                        }}>
                          <Edit className="h-4 w-4 mr-1" />
                          <span>Chỉnh sửa</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => openDeleteDialog(lot)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span>Xóa</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md p-0 border-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Xác nhận xóa</DialogTitle>
                  </DialogHeader>
                  <div className="text-center py-8 px-1">
                    <h2 className="text-2xl">
                      Bạn có chắc muốn xóa{" "}
                      <span className="font-bold">
                        {parkingLotToDelete?.name}
                      </span>
                      ?
                    </h2>
                    
                    <div className="mt-8 flex justify-center gap-4">
                      <Button 
                        variant="destructive" 
                        className="bg-red-500 hover:bg-red-600 px-12"
                        onClick={handleDeleteParkingLot}
                      >
                        OK
                      </Button>
                      <Button 
                        variant="outline"
                        className="px-12"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
