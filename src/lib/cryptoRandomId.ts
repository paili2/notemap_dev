export function cryptoRandomId(): string {
  // 브라우저/Node 모두에서 crypto 객체 확인
  if (typeof globalThis.crypto !== "undefined") {
    if (typeof (globalThis.crypto as Crypto).randomUUID === "function") {
      return (globalThis.crypto as Crypto).randomUUID();
    }

    // Node.js 환경에서는 crypto.getRandomValues 사용 가능
    if (typeof (globalThis.crypto as Crypto).getRandomValues === "function") {
      const arr = new Uint32Array(1);
      globalThis.crypto.getRandomValues(arr);
      return "id-" + arr[0].toString(36);
    }
  }

  // 완전 Fallback
  return "id-" + Math.random().toString(36).slice(2, 9);
}
