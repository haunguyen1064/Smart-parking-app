import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type RegisterParkingLotPanelProps = {
  onBack: () => void;
};

export default function RegisterParkingLotPanel({ onBack }: RegisterParkingLotPanelProps) {
  const { toast } = useToast();
  const [vehicleType, setVehicleType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("");
  const [mapSelection, setMapSelection] = useState(false);
  
  const schematicImageRef = useRef<HTMLInputElement>(null);
  const realImageRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show success message
    toast({
      title: "Đăng ký thành công",
      description: "Bãi đỗ xe của bạn đã được đăng ký và đang chờ xét duyệt.",
    });
    
    // Go back to home panel
    onBack();
  };
  
  const toggleVehicleType = (type: string) => {
    if (vehicleType.includes(type)) {
      setVehicleType(vehicleType.filter(t => t !== type));
    } else {
      setVehicleType([...vehicleType, type]);
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      <div className="p-4 border-b">
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
      
      <div className="p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parking Lot Name */}
          <div>
            <Label htmlFor="name">Tên bãi đỗ xe</Label>
            <Input id="name" placeholder="Nhập tên bãi đỗ xe" required />
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
            <Input id="capacity" type="number" placeholder="Nhập số lượng chỗ đỗ xe" required />
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
            
            <Input placeholder="Nhập số nhà, tên đường" required />
            
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
            {/* Schematic Image */}
            <div className="space-y-2">
              <Label>Thêm Sơ đồ</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => schematicImageRef.current?.click()}
              >
                <div className="text-gray-400 text-4xl">+</div>
              </div>
              <input 
                type="file" 
                ref={schematicImageRef} 
                className="hidden" 
                accept="image/*"
              />
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
    </div>
  );
}