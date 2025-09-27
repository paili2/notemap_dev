"use client";

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Table, SearchBar, processTableData } from "@/features/table";
import type { TableColumn, TableData } from "@/features/table/types/table";

// 공지사항 데이터 타입
interface NoticeData extends TableData {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

// 예시 데이터입니다
const mockNotices: NoticeData[] = [
  {
    id: 1,
    title: "시스템 점검 안내",
    author: "김관리",
    createdAt: "2024-01-20",
  },
  {
    id: 2,
    title: "신규 기능 업데이트",
    author: "박개발",
    createdAt: "2024-01-19",
  },
  {
    id: 3,
    title: "직원 교육 일정",
    author: "이인사",
    createdAt: "2024-01-18",
  },
  {
    id: 4,
    title: "휴가 신청 절차 변경",
    author: "최인사",
    createdAt: "2024-01-17",
  },
  {
    id: 5,
    title: "사무실 이전 안내",
    author: "정총무",
    createdAt: "2024-01-16",
  },
  {
    id: 6,
    title: "보안 정책 업데이트",
    author: "한보안",
    createdAt: "2024-01-15",
  },
  {
    id: 7,
    title: "연말 행사 안내",
    author: "윤총무",
    createdAt: "2024-01-14",
  },
  {
    id: 8,
    title: "프로젝트 진행 상황",
    author: "강PM",
    createdAt: "2024-01-13",
  },
  {
    id: 9,
    title: "사내 복지 제도 안내",
    author: "서인사",
    createdAt: "2024-01-12",
  },
  {
    id: 10,
    title: "보안 교육 일정",
    author: "조보안",
    createdAt: "2024-01-11",
  },
  {
    id: 11,
    title: "사무용품 구매 안내",
    author: "임총무",
    createdAt: "2024-01-10",
  },
  {
    id: 12,
    title: "팀 빌딩 행사",
    author: "오총무",
    createdAt: "2024-01-09",
  },
  {
    id: 13,
    title: "시스템 업데이트 완료",
    author: "송개발",
    createdAt: "2024-01-08",
  },
  {
    id: 14,
    title: "회의실 예약 시스템 변경",
    author: "배IT",
    createdAt: "2024-01-07",
  },
  {
    id: 15,
    title: "연말 정산 안내",
    author: "홍회계",
    createdAt: "2024-01-06",
  },
  {
    id: 16,
    title: "신규 직원 온보딩 프로그램",
    author: "문인사",
    createdAt: "2024-01-05",
  },
  {
    id: 17,
    title: "사무실 청소 일정 변경",
    author: "양총무",
    createdAt: "2024-01-04",
  },
  {
    id: 18,
    title: "IT 장비 교체 안내",
    author: "백IT",
    createdAt: "2024-01-03",
  },
  {
    id: 19,
    title: "월간 보고서 작성 가이드",
    author: "노PM",
    createdAt: "2024-01-02",
  },
  {
    id: 20,
    title: "사내 동아리 활동 안내",
    author: "구총무",
    createdAt: "2024-01-01",
  },
];

// 컬럼 정의 (번호, 제목, 작성자, 작성일)
const columns: TableColumn<NoticeData>[] = [
  {
    key: "id",
    label: "번호",
    width: "80px",
    align: "center",
  },
  {
    key: "title",
    label: "제목",
    render: (value) => (
      <div className="font-medium text-gray-900 truncate">{value}</div>
    ),
  },
  {
    key: "author",
    label: "작성자",
    width: "120px",
    align: "center",
  },
  {
    key: "createdAt",
    label: "작성일",
    width: "120px",
    align: "center",
    render: (value) => new Date(value).toLocaleDateString("ko-KR"),
  },
];

export function NoticesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 데이터 처리
  const { processedData, pagination } = useMemo(() => {
    return processTableData(mockNotices, {
      searchTerm,
      searchKeys: ["title", "author"],
      currentPage,
      listsPerPage: 10,
    });
  }, [mockNotices, searchTerm, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (row: NoticeData, index: number) => {
    console.log("공지사항 클릭:", row, index);
  };

  const handleCreateNotice = () => {
    console.log("공지사항 등록");
  };

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        <div className="w-80">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="제목, 작성자로 검색..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          총 {mockNotices.length}개의 공지사항
        </div>
        <Button
          onClick={handleCreateNotice}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />새 공지사항
        </Button>
      </div>

      <Table
        data={processedData}
        columns={columns}
        pagination={pagination}
        loading={loading}
        emptyMessage="공지사항이 없습니다."
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
