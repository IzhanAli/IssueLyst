import { Suspense } from "react";
import { InboxScreen } from "@/components/inbox/inbox-screen";

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxScreen />
    </Suspense>
  );
}
