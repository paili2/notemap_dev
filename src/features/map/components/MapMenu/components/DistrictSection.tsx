import DistrictToggleButton from "../../top/MapQuickControls/components/DistrictToggleButton/DistrictToggleButton";

interface DistrictSectionProps {
  isDistrictOn: boolean;
  onToggleDistrict: (next: boolean) => void;
  onToggle: () => void;
}

export const DistrictSection = ({
  isDistrictOn,
  onToggleDistrict,
  onToggle,
}: DistrictSectionProps) => {
  return (
    <div className="flex flex-col">
      <div className="text-xs font-medium text-gray-500 px-2 py-1">
        지적편집도
        {/* 이 부분 근린시설이나 추가 기능 있으면 FilterSection처럼 변경하시면 될 것 같아요 */}
      </div>
      <div className="mx-3">
        <DistrictToggleButton
          pressed={isDistrictOn}
          onPress={() => {
            onToggleDistrict(!isDistrictOn);
            onToggle();
          }}
        />
      </div>
    </div>
  );
};
