import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMapSelect } from "@/hooks/map-select-context";
import { Layout, useCreateParkingLot } from "@/hooks/use-parking";
import ParkingLayoutModal, { ParkingLayoutConfig } from "./parking-layout-modal";

type RegisterParkingLotPanelProps = {
  onBack: () => void;
};

export default function RegisterParkingLotPanel({ onBack }: RegisterParkingLotPanelProps) {
  const { toast } = useToast();
  const { startSelecting } = useMapSelect();
  const [vehicleType, setVehicleType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("");
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [parkingLayout, setParkingLayout] = useState<ParkingLayoutConfig | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const schematicImageRef = useRef<HTMLInputElement>(null);
  const realImageRef = useRef<HTMLInputElement>(null);
  
  // Hàm reset toàn bộ form
  const resetForm = () => {
    setVehicleType([]);
    setPriceRange("");
    setIsLayoutModalOpen(false);
    setParkingLayout(null);
    setIsSelectingLocation(false);
    setSelectedLocation(null);
    if (schematicImageRef.current) schematicImageRef.current.value = "";
    if (realImageRef.current) realImageRef.current.value = "";
    // Reset các input text
    const form = document.getElementById("register-parking-lot-form") as HTMLFormElement | null;
    if (form) {
      form.reset();
    }
  };
  
  // Mutation để tạo bãi đỗ xe mới
  const createParkingLot = useCreateParkingLot({
    onSuccess: () => {
      resetForm();
      toast({
        title: "Đăng ký thành công",
        description: "Bãi đỗ xe của bạn đã được đăng ký.",
      });
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle the layout configuration from the modal
  const handleLayoutConfirm = (layoutConfig: ParkingLayoutConfig) => {
    setParkingLayout(layoutConfig);
    
    toast({
      title: "Đã thêm sơ đồ",
      description: `Sơ đồ '${layoutConfig.name}' với ${layoutConfig.rows.length} hàng đã được thêm.`
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lấy dữ liệu từ form
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const address = (form.elements.namedItem("address") as HTMLInputElement)?.value;
    const totalSpots = Number((form.elements.namedItem("capacity") as HTMLInputElement)?.value);
    // Lấy giá trị price
    let pricePerHour = 0;
    if (priceRange === "0-20k") pricePerHour = 20000;
    else if (priceRange === "21-50k") pricePerHour = 50000;
    else if (priceRange === "51-100k") pricePerHour = 100000;
    else if (priceRange === ">100k") pricePerHour = 150000;
    // Lấy lat/lng
    const latitude = selectedLocation?.lat?.toString() || "";
    const longitude = selectedLocation?.lng?.toString() || "";

    let layouts: Layout[] = [];
    if (parkingLayout) {
      layouts = [
        {
          name: parkingLayout.name,
          rows: parkingLayout.rows.map((row) => ({
            prefix: row.prefix,
            slots: Array.from({ length: row.slotCount }).map((_, i) => ({
              id: `${row.prefix}${i + 1}`,
              status: "available"
            }))
          }))
        }
      ];
    }
    // Tạo dữ liệu gửi đi
    const data = {
      name,
      address: address || "",
      latitude,
      longitude,
      totalSpots,
      availableSpots: totalSpots,
      pricePerHour,
      description: "",
      openingHour: "06:00",
      closingHour: "22:00",
      images: [],
      layouts,
    };
    createParkingLot.mutate(data);
  };
  
  const toggleVehicleType = (type: string) => {
    if (vehicleType.includes(type)) {
      setVehicleType(vehicleType.filter(t => t !== type));
    } else {
      setVehicleType([...vehicleType, type]);
    }
  };

  // Callback khi chọn vị trí trên bản đồ
  const handleMapClick = (lat: number, lng: number) => {
    setIsSelectingLocation(false);
    setSelectedLocation({ lat, lng });
  };

  const handleSelectLocation = () => {
    setIsSelectingLocation(true);
    startSelecting(handleMapClick);
  }
  
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center justify-center text-gray-600 w-8 h-8 p-0 mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Button>
          <h2 className="text-lg font-semibold">Thông tin bãi đỗ xe</h2>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-grow" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
        <form id="register-parking-lot-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Parking Lot Name */}
          <div>
            <Label htmlFor="name">Tên bãi đỗ xe</Label>
            <Input id="name" name="name" placeholder="Nhập tên bãi đỗ xe" required />
          </div>
          
          {/* Vehicle Type */}
          <div>
            <Label>Loại xe</Label>
            <div className="flex gap-2 mt-1">
              <Button 
                type="button"
                variant={vehicleType.includes("car") ? "default" : "outline"} 
                className="w-24 flex-1"
                onClick={() => toggleVehicleType("car")}
              >
                Ô tô
              </Button>
              <Button 
                type="button"
                variant={vehicleType.includes("motorbike") ? "default" : "outline"} 
                className="w-24 flex-1"
                onClick={() => toggleVehicleType("motorbike")}
              >
                Xe máy
              </Button>
            </div>
          </div>
          
          {/* Price Range */}
          <div>
            <Label>Giá</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              <Button 
                type="button"
                variant={priceRange === "0-20k" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setPriceRange("0-20k")}
              >
                0-20k
              </Button>
              <Button 
                type="button"
                variant={priceRange === "21-50k" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setPriceRange("21-50k")}
              >
                21-50k
              </Button>
              <Button 
                type="button"
                variant={priceRange === "51-100k" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setPriceRange("51-100k")}
              >
                51-100k
              </Button>
              <Button 
                type="button"
                variant={priceRange === ">100k" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setPriceRange(">100k")}
              >
                {">100k"}
              </Button>
            </div>
          </div>
          
          {/* Capacity */}
          <div>
            <Label htmlFor="capacity">Sức chứa</Label>
            <Input id="capacity" name="capacity" type="number" placeholder="Nhập số lượng chỗ đỗ xe" required />
          </div>
          
          {/* Location */}
          <div>
            <Label>Địa chỉ</Label>
            <div className="grid grid-cols-2 gap-2 mt-1 mb-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thành phó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hcm">TPHCM</SelectItem>
                  <SelectItem value="hanoi">Hà Nội</SelectItem>
                  <SelectItem value="danang">Đà Nẵng</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn Quận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binhChanh">Bình Chánh</SelectItem>
                  <SelectItem value="binhTan">Bình Tân</SelectItem>
                  <SelectItem value="binhThanh">Bình Thạnh</SelectItem>
                  <SelectItem value="canGio">Cần Giờ</SelectItem>
                  <SelectItem value="cuChi">Củ Chi</SelectItem>
                  <SelectItem value="goVap">Gò Vấp</SelectItem>
                  <SelectItem value="hocMon">Hóc Môn</SelectItem>
                  <SelectItem value="nhaBe">Nhà Bè</SelectItem>
                  <SelectItem value="phuNhuan">Phú Nhuận</SelectItem>
                  <SelectItem value="tanBinh">Tân Bình</SelectItem>
                  <SelectItem value="tanPhu">Tân Phú</SelectItem>
                  <SelectItem value="thuDuc">TP Thủ Đức</SelectItem>
                  <SelectItem value="q1">Quận 1</SelectItem>
                  <SelectItem value="q2">Quận 2</SelectItem>
                  <SelectItem value="q3">Quận 3</SelectItem>
                  <SelectItem value="q4">Quận 4</SelectItem>
                  <SelectItem value="q5">Quận 5</SelectItem>
                  <SelectItem value="q6">Quận 6</SelectItem>
                  <SelectItem value="q7">Quận 7</SelectItem>
                  <SelectItem value="q8">Quận 8</SelectItem>
                  <SelectItem value="q10">Quận 10</SelectItem>
                  <SelectItem value="q11">Quận 11</SelectItem>
                  <SelectItem value="q12">Quận 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-2">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn Phường" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">Phường 1</SelectItem>
                  <SelectItem value="p2">Phường 2</SelectItem>
                  <SelectItem value="p3">Phường 3</SelectItem>
                  <SelectItem value="p4">Phường 4</SelectItem>
                  <SelectItem value="p5">Phường 5</SelectItem>
                  <SelectItem value="p6">Phường 6</SelectItem>
                  <SelectItem value="p7">Phường 7</SelectItem>
                  <SelectItem value="p8">Phường 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Input name="address" placeholder="Nhập số nhà, tên đường" required />
            
            <div className="flex items-center mt-2 gap-2">
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={handleSelectLocation}
                  style={{ backgroundColor: isSelectingLocation ? "#e6f9ed" : "" }} // Light green background
                >
                  {isSelectingLocation ? 'Hãy click vào bản đồ' : 'Chọn vị trí bãi xe trên bản đồ'}
                </Button>
              {selectedLocation && (
                <span className="ml-2 text-sm text-gray-600">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                </span>
              )}
            </div>
          </div>
          
          {/* Image Uploads */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Schematic Image */}
            <div className="space-y-2">
              <Label>Thêm Sơ đồ</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => setIsLayoutModalOpen(true)}
              >
                {parkingLayout ? (
                  <div className="flex flex-col items-center text-sm">
                    <div className="text-blue-500 font-medium mb-1">{parkingLayout.name}</div>
                    <div className="text-gray-500">{parkingLayout.rows.length} hàng, {parkingLayout.rows.reduce((total, row) => total + row.slotCount, 0)} chỗ</div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-4xl">+</div>
                )}
              </div>
            </div>
            
            {/* Real Image */}
            <div className="space-y-2">
              <Label>Thêm hình ảnh</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => realImageRef.current?.click()}
              >
                <div className="text-gray-400 text-4xl">+</div>
              </div>
              <input 
                type="file" 
                ref={realImageRef} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6">
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white w-full">
              Đăng ký
            </Button>
          </div>
        </form>
      </div>
      
      {/* Parking Layout Modal */}
      <ParkingLayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        onConfirm={handleLayoutConfirm}
      />
    </div>
  );
}