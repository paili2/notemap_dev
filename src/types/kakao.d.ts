export {};

declare global {
  // 전역 심볼로도 kakao를 쓸 수 있게(필요 시)
  const kakao: any;

  interface Window {
    kakao: any; // 로드 후엔 존재한다고 가정
    __kakaoMapsLoadingPromise__?: Promise<void> | null;
  }
}
