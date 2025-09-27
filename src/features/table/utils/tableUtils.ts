import type {
  TableData,
  TableSort,
  TableFilter,
  TablePagination,
} from "../types/table";

/* 데이터를 페이지네이션에 따라 슬라이스 */
export const paginateData = <T extends TableData>(
  data: T[],
  currentPage: number,
  listsPerPage: number
): T[] => {
  const startIndex = (currentPage - 1) * listsPerPage;
  const endIndex = startIndex + listsPerPage;
  return data.slice(startIndex, endIndex);
};

/* 데이터 정렬 */
export const sortData = <T extends TableData>(
  data: T[],
  sort: TableSort
): T[] => {
  return [...data].sort((a, b) => {
    const aValue = a[sort.key];
    const bValue = b[sort.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sort.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return sort.direction === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    return 0;
  });
};

/* 데이터 필터링 */
export const filterData = <T extends TableData>(
  data: T[],
  filters: TableFilter[]
): T[] => {
  if (!filters.length) return data;

  return data.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.key];
      if (value === null || value === undefined) return false;

      const stringValue = String(value).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      return stringValue.includes(filterValue);
    });
  });
};

/* 페이지네이션 정보 계산 */
export const calculatePagination = (
  totalLists: number,
  currentPage: number,
  listsPerPage: number
): TablePagination => {
  const totalPages = Math.ceil(totalLists / listsPerPage);

  return {
    currentPage: Math.max(1, Math.min(currentPage, totalPages)),
    totalPages,
    totalLists,
    listsPerPage,
  };
};

/* 페이지 번호 배열 생성 (현재 페이지 주변의 페이지들) */
export const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 10
): (number | string)[] => {
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisiblePages / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const pages: (number | string)[] = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push("...");
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push("...");
    }
    pages.push(totalPages);
  }

  return pages;
};

/* 데이터 검색 */
export const searchData = <T extends TableData>(
  data: T[],
  searchTerm: string,
  searchKeys: string[]
): T[] => {
  if (!searchTerm.trim()) return data;

  const term = searchTerm.toLowerCase();

  return data.filter((row) => {
    return searchKeys.some((key) => {
      const value = row[key];
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(term);
    });
  });
};

/* 테이블 데이터 처리 (정렬, 필터링, 페이지네이션) */
export const processTableData = <T extends TableData>(
  data: T[],
  options: {
    sort?: TableSort;
    filters?: TableFilter[];
    searchTerm?: string;
    searchKeys?: string[];
    currentPage?: number;
    listsPerPage?: number;
  }
): {
  processedData: T[];
  pagination: TablePagination;
} => {
  let processedData = [...data];

  // 검색
  if (options.searchTerm && options.searchKeys) {
    processedData = searchData(
      processedData,
      options.searchTerm,
      options.searchKeys
    );
  }

  // 필터링
  if (options.filters) {
    processedData = filterData(processedData, options.filters);
  }

  // 정렬
  if (options.sort) {
    processedData = sortData(processedData, options.sort);
  }

  // 페이지네이션 계산
  const totalLists = processedData.length;
  const currentPage = options.currentPage || 1;
  const listsPerPage = options.listsPerPage || 10;
  const pagination = calculatePagination(totalLists, currentPage, listsPerPage);

  // 데이터 슬라이스
  const paginatedData = paginateData(processedData, currentPage, listsPerPage);

  return {
    processedData: paginatedData,
    pagination,
  };
};
