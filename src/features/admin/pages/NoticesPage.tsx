"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Table, SearchBar, processTableData } from "@/features/table";
import type { TableColumn, TableData } from "@/features/table/types/table";
import Link from "next/link";
import { getNotices, NoticeListResponse } from "../api/notices";
import { useToast } from "@/hooks/use-toast";

// 공지사항 데이터 타입 (API 응답과 일치)
interface NoticeData extends TableData {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

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
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const { toast } = useToast();

  // 공지사항 목록 로드
  const loadNotices = async () => {
    try {
      const noticeData = await getNotices();
      setNotices(noticeData);
    } catch (error) {
      console.error("공지사항 목록 로드 실패:", error);
      // API 실패 시 빈 배열로 설정
      setNotices([]);

      toast({
        title: "공지사항 목록 로드 실패",
        description: "백엔드 서버를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotices(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // 데이터 처리
  const { processedData, pagination } = useMemo(() => {
    return processTableData(notices, {
      searchTerm,
      searchKeys: ["title", "author"],
      currentPage,
      listsPerPage: 10,
    });
  }, [notices, searchTerm, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (row: NoticeData, index: number) => {
    console.log("공지사항 클릭:", row, index);
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
          총 {notices.length}개의 공지사항
        </div>
        <Link href="/admin/notices/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />새 공지사항
          </Button>
        </Link>
      </div>

      <Table
        data={processedData}
        columns={columns}
        pagination={pagination}
        loading={isLoadingNotices}
        emptyMessage="공지사항이 없습니다."
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
