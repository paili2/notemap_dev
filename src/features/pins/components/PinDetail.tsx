"use client";

import React from "react";
import { usePin } from "../hooks/usePin";
import { PinDirection } from "../pin";

export default function PinDetail({ id }: { id: string }) {
  const { data, isLoading, isError, error } = usePin(id);

  if (isLoading) return <div>불러오는 중…</div>;
  if (isError) return <div>에러: {(error as any)?.message ?? "요청 실패"}</div>;

  if (!data) return <div>응답이 비었습니다.</div>;
  if (!data.ok) {
    if (data.reason === "not-found") return <div>핀을 찾을 수 없습니다.</div>;
    return <div>에러: {data.message ?? "요청 실패"}</div>;
  }

  const pin = data.pin;

  return (
    <div>
      <h2>핀 #{pin.id}</h2>
      <p>
        좌표: {pin.lat}, {pin.lng}
      </p>
      <p>주소: {pin.addressLine ?? "-"}</p>
      <p>
        지역: {pin.province ?? "-"} {pin.city ?? "-"} {pin.district ?? "-"}
      </p>
      <p>엘리베이터: {pin.hasElevator ? "있음" : "없음"}</p>

      {pin.options && (
        <div>
          <h3>옵션</h3>
          <pre>{JSON.stringify(pin.options, null, 2)}</pre>
        </div>
      )}
      {pin.directions && (
        <div>
          <h3>방향</h3>
          <ul>
            {pin.directions.map((d: PinDirection, i: number) => (
              <li key={i}>{d.direction}</li>
            ))}
          </ul>
        </div>
      )}
      {pin.areaGroups && (
        <div>
          <h3>면적그룹</h3>
          <pre>{JSON.stringify(pin.areaGroups, null, 2)}</pre>
        </div>
      )}
      {pin.units && (
        <div>
          <h3>세대(타입)</h3>
          <pre>{JSON.stringify(pin.units, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
