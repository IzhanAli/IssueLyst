import { Suspense } from "react";
import { MyIssuesScreen } from "@/components/project/my-issues-screen";
import { ListSkeleton } from "@/components/issues/skeletons";

export default function MyIssuesPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <MyIssuesScreen />
    </Suspense>
  );
}
