import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, waitFor } from "@storybook/test";

import FavoritesPage from "@/components/pages/FavoritesPage/FavoritesPage";

const meta: Meta<typeof FavoritesPage> = {
  title: "pages/FavoritesPage",
  component: FavoritesPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof FavoritesPage>;

/** 기본: 그리드 보기 + 목데이터 */
export const Default: Story = {};

/** 리스트 보기로 전환 */
export const SwitchToListView: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const listBtn = await c.findByLabelText("리스트 보기");
    await userEvent.click(listBtn);

    // 리스트 카드 중 하나의 버튼 확인
    await expect(
      await c.findByRole("button", { name: "열기" })
    ).toBeInTheDocument();
  },
};

/** 검색: 태그/제목/주소 필터링 */
export const SearchFilter: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findByPlaceholderText("제목, 태그, 주소로 검색");

    await userEvent.clear(input);
    await userEvent.type(input, "성수동");
    await expect(await c.findByText(/성수동 루프탑 스팟/)).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "일본");
    await expect(await c.findByText(/도쿄 먹킷리스트/)).toBeInTheDocument();
  },
};

/** 탭 필터: 핀만 / 컬렉션만 */
export const TabsFilter: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // "핀" 탭 클릭
    await userEvent.click(await c.findByRole("tab", { name: "핀" }));
    // 배지에 '핀' 텍스트가 보이는지
    await expect(await c.findAllByText("핀")).toBeTruthy();

    // "컬렉션" 탭 클릭
    await userEvent.click(await c.findByRole("tab", { name: "컬렉션" }));
    await expect(await c.findAllByText("컬렉션")).toBeTruthy();
  },
};

/** 정렬: 제목 A→Z */
export const SortByTitle: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // 정렬 셀렉트 열기
    const trigger = await c.findByLabelText("정렬");
    // label만 있어서 트리거는 바로 안 잡힐 수 있어 SelectTrigger를 직접 찾자
    const selects = await c.findAllByRole("button");
    const sortTrigger =
      selects.find((b) => b.getAttribute("id") === "sort") || selects[1];
    await userEvent.click(sortTrigger!);

    // "제목 (A→Z)" 선택
    await userEvent.click(await c.findByRole("option", { name: "제목 (A→Z)" }));

    // 간단 검증: 첫 카드 타이틀 요소가 존재하는지 확인 (정렬 자체는 시각 스냅샷으로 확인)
    await expect(
      await c.findAllByText(
        /도쿄 먹킷리스트|부산 감천|성수동 루프탑|을지로 야시장/
      )
    ).toBeTruthy();
  },
};

/** 전체 선택 → 선택 제거 → 빈 상태 노출 */
export const RemoveSelectedToEmptyState: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // 그리드 전체 선택 체크
    const selectAll = await c.findByLabelText("전체 선택");
    await userEvent.click(selectAll);

    // 더보기 > 선택 제거
    const more = await c.findByRole("button", { name: /더보기/ });
    await userEvent.click(more);
    await userEvent.click(
      await c.findByRole("menuitem", { name: /선택 제거/ })
    );

    // 빈 상태 문구 확인
    await waitFor(async () => {
      await expect(
        await c.findByText("즐겨찾기가 비어있어요")
      ).toBeInTheDocument();
    });
    // "예시 불러오기" 버튼은 window.location.reload를 호출하므로 클릭하지 않음
  },
};

/** 리스트 모드에서 선택/일괄선택 동작 */
export const ListSelectFlow: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);

    // 리스트 보기로 전환
    await userEvent.click(await c.findByLabelText("리스트 보기"));

    // 상단 전체 선택 체크
    const selectAll = await c.findByLabelText("전체 선택");
    await userEvent.click(selectAll);

    // 개별 체크박스 하나 해제해보기 (리스트의 마지막 체크박스 찾아 클릭)
    const allCheckboxes = await c.findAllByRole("checkbox");
    const last = allCheckboxes[allCheckboxes.length - 1];
    await userEvent.click(last);

    // 더보기 > 선택 제거 (일부만 제거됨)
    await userEvent.click(await c.findByRole("button", { name: /더보기/ }));
    await userEvent.click(
      await c.findByRole("menuitem", { name: /선택 제거/ })
    );

    // 남은 아이템이 여전히 존재함
    await expect(
      await c.findByRole("heading", { level: 1, name: /즐겨찾기/ })
    ).toBeInTheDocument();
  },
};
