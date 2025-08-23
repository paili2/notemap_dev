import { Suspense } from "react";
import SignInPage from "@/features/auth/pages/SignInPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  );
}
