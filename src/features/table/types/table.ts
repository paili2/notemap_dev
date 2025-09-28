// 테이블 기본 컬럼
export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface TableData<T = any> {
  id: string | number;
  [key: string]: any;
}

export interface TablePagination {
  currentPage: number;
  totalPages: number;
  totalLists: number;
  listsPerPage: number;
}
// 정렬
export interface TableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableFilter {
  key: string;
  value: string;
}
// 테이블 기본구조(속성)
export interface TableProps<T extends TableData = TableData> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: TablePagination;
  sort?: TableSort;
  filters?: TableFilter[];
  loading?: boolean;
  emptyMessage?: string;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  onFilter?: (filters: TableFilter[]) => void;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

export interface TableHeaderProps<T = any> {
  columns: TableColumn<T>[];
  sort?: TableSort;
  onSort?: (key: string, direction: "asc" | "desc") => void;
}

export interface TableBodyProps<T extends TableData = TableData> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
}

export interface PaginationProps {
  pagination: TablePagination;
  onPageChange: (page: number) => void;
  className?: string;
}
