import { toast } from "@/hooks/use-toast";

/**
 * 전역 어디서든 간단히 사용할 수 있는 토스트 헬퍼
 */
export const toastBus = {
  /** ✅ 성공 알림 */
  success(message: string) {
    toast({
      title: "✅ 성공",
      description: message,
    });
  },

  /** ❌ 에러 알림 */
  error(message: string) {
    toast({
      title: "❌ 오류",
      description: message,
      variant: "destructive",
    });
  },

  /** 💬 일반 정보 알림 */
  info(message: string) {
    toast({
      title: "ℹ️ 알림",
      description: message,
    });
  },
};
