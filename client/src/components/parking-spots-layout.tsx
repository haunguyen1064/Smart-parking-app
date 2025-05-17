import { Badge } from "@/components/ui/badge";
import { ParkingSpace } from "@/hooks/use-parking";

type ParkingSpotsLayoutProps = {
  zone: string;
  spaces: ParkingSpace[];
  selectable?: boolean;
  selectedSpaceId?: number;
  onSelectSpace?: (space: ParkingSpace) => void;
};

export default function ParkingSpotsLayout({
  zone,
  spaces,
  selectable = false,
  selectedSpaceId,
  onSelectSpace,
}: ParkingSpotsLayoutProps) {
  // Sort spaces by spot number
  const sortedSpaces = [...spaces].sort((a, b) => {
    const aNum = parseInt(a.spotNumber.replace(/\D/g, ""));
    const bNum = parseInt(b.spotNumber.replace(/\D/g, ""));
    return aNum - bNum;
  });
  
  // Split into rows of 5
  const rows: ParkingSpace[][] = [];
  for (let i = 0; i < sortedSpaces.length; i += 5) {
    rows.push(sortedSpaces.slice(i, i + 5));
  }
  
  // Get status color
  const getStatusColor = (space: ParkingSpace): string => {
    if (selectedSpaceId === space.id) return "bg-green-500";
    
    switch (space.status) {
      case "available":
        return "bg-blue-500";
      case "occupied":
        return "bg-orange-500";
      case "reserved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Get cursor style
  const getCursorStyle = (space: ParkingSpace): string => {
    if (!selectable) return "";
    
    if (space.status === "available" || selectedSpaceId === space.id) {
      return "cursor-pointer hover:opacity-90";
    }
    
    return "cursor-not-allowed opacity-80";
  };
  
  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="text-sm font-medium mb-2">Khu {zone}</div>
      
      {rows.map((row, rowIndex) => (
        <div className="grid grid-cols-5 gap-2 mb-3 last:mb-0" key={rowIndex}>
          {row.map((space) => (
            <div
              key={space.id}
              className={`${getStatusColor(space)} rounded-lg p-3 text-center text-white font-medium ${getCursorStyle(space)}`}
              onClick={() => selectable && onSelectSpace && onSelectSpace(space)}
            >
              {space.spotNumber}
            </div>
          ))}
          {/* Fill empty spots in the last row */}
          {Array.from({ length: 5 - row.length }).map((_, index) => (
            <div key={`empty-${index}`} className="rounded-lg p-3 opacity-0"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
