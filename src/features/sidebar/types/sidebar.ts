export interface SubListItem {
  id: string;
  title: string;
}

export interface FavorateListItem {
  id: string;
  title: string;
  subItems: SubListItem[];
}

export interface ListItem {
  id: string;
  title: string;

  /** 좌표 보정키: 답사예정 핀의 위치 기반 예약 식별용 (id 변경 대비) */
  posKey?: string;
}

export interface SidebarSectionProps {
  title: string;
  items: ListItem[];
  nestedItems?: FavorateListItem[];
  onItemsChange: (items: ListItem[]) => void;
  onDeleteItem: (id: string) => void;
  onNestedItemsChange?: (items: FavorateListItem[]) => void;
  onDeleteNestedItem?: (id: string) => void;
  onDeleteSubItem?: (parentId: string, subId: string) => void;
}

export interface ToggleSidebarProps {
  isSidebarOn: boolean;
  onToggleSidebar: () => void;
}
