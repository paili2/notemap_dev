import DistrictToggleButton from "./common/controls/DistrictToggleButton";

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
