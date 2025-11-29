"use client";
import NumbersView from "../sections/NumbersView/NumbersView";

// null 가능성까지 받아주기
type MaybeNumStr = string | number | null | undefined;

export default function NumbersViewContainer({
  totalBuildings,
  totalFloors,
  totalHouseholds,
  remainingHouseholds,
}: {
  totalBuildings?: MaybeNumStr;
  totalFloors?: MaybeNumStr;
  totalHouseholds?: MaybeNumStr;
  remainingHouseholds?: MaybeNumStr;
}) {
  // null은 undefined로 치환해서 하위 컴포넌트 기대 타입(string | number | undefined)에 맞춤
  const norm = (v: MaybeNumStr): string | number | undefined =>
    v === null ? undefined : v;

  return (
    <NumbersView
      totalBuildings={norm(totalBuildings)}
      totalFloors={norm(totalFloors)}
      totalHouseholds={norm(totalHouseholds)}
      remainingHouseholds={norm(remainingHouseholds)}
    />
  );
}
