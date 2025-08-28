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
