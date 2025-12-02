export interface FooterButtonsProps {
  onClose: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
  isSaving?: boolean;
}
