export type ContextMenuPanelProps = {
  address?: string;
  propertyId?: string;
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
};
