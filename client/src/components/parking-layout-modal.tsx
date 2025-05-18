import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type ParkingRowConfig = {
  prefix: string;
  slotCount: number;
};

export type ParkingLayoutConfig = {
  name: string;
  rows: ParkingRowConfig[];
};

type ParkingLayoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (layoutConfig: ParkingLayoutConfig) => void;
};

export default function ParkingLayoutModal({
  isOpen,
  onClose,
  onConfirm,
}: ParkingLayoutModalProps) {
  // Layout name
  const [layoutName, setLayoutName] = useState<string>("");
  
  // Number of rows
  const [rowCount, setRowCount] = useState<number>(1);
  
  // Selected row for editing
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  
  // Row configurations - prefix and slot count for each row
  const [rowConfigs, setRowConfigs] = useState<ParkingRowConfig[]>([]);
  
  // Initialize row configs when row count changes
  useEffect(() => {
    // Keep existing configurations if available
    const newConfigs = [...rowConfigs];
    
    // Add configurations for new rows
    for (let i = 0; i < rowCount; i++) {
      if (!newConfigs[i]) {
        // Default configuration for a new row
        // Use letters A, B, C, etc. for prefixes based on row index
        const prefix = String.fromCharCode(65 + i); // 65 is ASCII for 'A'
        newConfigs[i] = {
          prefix,
          slotCount: 7 // Default number of slots per row
        };
      }
    }
    
    // Trim if rowCount decreased
    while (newConfigs.length > rowCount) {
      newConfigs.pop();
    }
    
    setRowConfigs(newConfigs);
  }, [rowCount]);
  
  // When selected row changes, ensure UI is updated
  useEffect(() => {
    // Make sure the selected row index is valid
    if (selectedRowIndex >= rowCount) {
      setSelectedRowIndex(0);
    }
  }, [selectedRowIndex, rowCount]);
  
  // Handle changes to the selected row's slot count
  const handleSlotCountChange = (count: number) => {
    const newConfigs = [...rowConfigs];
    if (newConfigs[selectedRowIndex]) {
      newConfigs[selectedRowIndex] = {
        ...newConfigs[selectedRowIndex],
        slotCount: count,
      };
      setRowConfigs(newConfigs);
    }
  };
  
  // Handle changes to the selected row's prefix
  const handlePrefixChange = (prefix: string) => {
    const newConfigs = [...rowConfigs];
    if (newConfigs[selectedRowIndex]) {
      newConfigs[selectedRowIndex] = {
        ...newConfigs[selectedRowIndex],
        prefix,
      };
      setRowConfigs(newConfigs);
    }
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    onConfirm({
      name: layoutName,
      rows: rowConfigs,
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] min-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Thêm sơ đồ</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-1">
          {/* Layout name */}
          <div>
            <Label htmlFor="layout-name">Tên sơ đồ</Label>
            <Input
              id="layout-name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Nhập tên khu vực (VD: Khu A, Zone B)"
            />
          </div>
          
          {/* Number of rows */}
          <div>
            <Label htmlFor="row-count">Số hàng</Label>
            <Input
              id="row-count"
              type="number"
              min={1}
              max={10}
              value={rowCount}
              onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
              placeholder="Nhập số hàng (1-10)"
            />
          </div>
          
          {/* Row configuration section */}
          <div className="space-y-2">
            <Label>Thông tin chỗ đỗ xe theo hàng</Label>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Row selector */}
              <div>
                <Select
                  value={selectedRowIndex.toString()}
                  onValueChange={(value) => setSelectedRowIndex(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: rowCount }).map((_, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        Hàng {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Slot count */}
              <div>
                <Label htmlFor="slot-count" className="text-xs mb-1 block">Số chỗ</Label>
                <Input
                  id="slot-count"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="Nhập số chỗ đỗ (1-20)"
                  value={rowConfigs[selectedRowIndex]?.slotCount || 0}
                  onChange={(e) => handleSlotCountChange(parseInt(e.target.value) || 0)}
                />
              </div>
              
              {/* Prefix */}
              <div>
                <Label htmlFor="row-prefix" className="text-xs mb-1 block">Ký hiệu</Label>
                <Input
                  id="row-prefix"
                  placeholder="Nhập ký hiệu (A-Z,1-9)"
                  value={rowConfigs[selectedRowIndex]?.prefix || ""}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
          
          {/* Layout preview */}
          <div>
            <Label className="block mb-2">Xem trước sơ đồ</Label>
            <div className="border rounded-md p-4 h-[450px] w-[580px] overflow-auto">
              {rowConfigs.length > 0 ? (
                rowConfigs.map((row, rowIndex) => (
                  <div key={rowIndex} className="mb-3">
                    <div className="flex items-center mb-1">
                      <div className="text-gray-500 text-xs mr-2">
                        Hàng {rowIndex + 1}:
                      </div>
                      <div className="text-blue-600 text-sm font-medium">
                        {row.prefix} ({row.slotCount} chỗ)
                      </div>
                    </div>
                    <div className="pb-2">
                      <div className="flex gap-2 min-w-fit">
                        {Array.from({ length: row.slotCount }).map((_, slotIndex) => (
                          <div
                            key={slotIndex}
                            className="w-12 h-16 rounded-md bg-blue-500 text-white flex items-center justify-center font-medium shadow-sm flex-shrink-0"
                          >
                            {row.prefix}{slotIndex + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Thêm hàng để xem trước sơ đồ
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}