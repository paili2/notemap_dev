export {};

declare global {
  interface Window {
    kakao?: {
      maps?: any;
    };
    __kakaoMapsLoadingPromise__?: Promise<void> | null;
  }
}
