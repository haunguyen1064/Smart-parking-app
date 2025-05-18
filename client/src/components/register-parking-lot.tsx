import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ParkingLayoutModal, { ParkingLayoutConfig } from "./parking-layout-modal";

type RegisterParkingLotProps = {
  onClose: () => void;
};

export default function RegisterParkingLot({ onClose }: RegisterParkingLotProps) {
  const { toast } = useToast();
  const [vehicleType, setVehicleType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("");
  const [mapSelection, setMapSelection] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [parkingLayout, setParkingLayout] = useState<ParkingLayoutConfig | null>(null);
  
  const schematicImageRef = useRef<HTMLInputElement>(null);
  const realImageRef = useRef<HTMLInputElement>(null);
  
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
    
    // Show success message
    toast({
      title: "Đăng ký thành công",
      description: "Bãi đỗ xe của bạn đã được đăng ký và đang chờ xét duyệt.",
    });
    
    // Close the form
    onClose();
  };
  
  const toggleVehicleType = (type: string) => {
    if (vehicleType.includes(type)) {
      setVehicleType(vehicleType.filter(t => t !== type));
    } else {
      setVehicleType([...vehicleType, type]);
    }
  };
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="relative bg-white w-full max-w-[800px] h-[90vh] flex overflow-hidden rounded-lg shadow-lg">
        {/* Left side - Map placeholder */}
        <div className="hidden lg:block w-1/2 bg-gray-100">
          <div className="h-full flex items-center justify-center text-gray-400">
            <span>Chọn vị trí trên bản đồ</span>
          </div>
        </div>
        
        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Thông tin bãi đỗ xe</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Parking Lot Name */}
              <div>
                <Label htmlFor="name">Tên bãi đỗ xe</Label>
                <Input id="name" placeholder="Thành Công" required />
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
                <Input id="capacity" type="number" placeholder="45" required />
              </div>
              
              {/* Location */}
              <div>
                <Label>Địa chỉ</Label>
                <div className="grid grid-cols-2 gap-2 mt-1 mb-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="TPHCM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hcm">TPHCM</SelectItem>
                      <SelectItem value="hanoi">Hà Nội</SelectItem>
                      <SelectItem value="danang">Đà Nẵng</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Gò Vấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="govap">Gò Vấp</SelectItem>
                      <SelectItem value="q1">Quận 1</SelectItem>
                      <SelectItem value="q2">Quận 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Phường 8" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p8">Phường 8</SelectItem>
                      <SelectItem value="p9">Phường 9</SelectItem>
                      <SelectItem value="p10">Phường 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Input placeholder="426 Nguyễn Văn Khối" required />
                
                <div className="flex items-center mt-2">
                  <Checkbox 
                    id="mapSelect" 
                    checked={mapSelection}
                    onCheckedChange={(checked) => setMapSelection(!!checked)}
                  />
                  <Label htmlFor="mapSelect" className="ml-2 cursor-pointer">Chọn trên bản đồ</Label>
                </div>
              </div>
              
              {/* Image Uploads */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Parking Layout */}
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
              <div className="flex justify-end mt-6">
                <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  Đăng ký
                </Button>
              </div>
            </div>
          </form>
        </div>
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