import { Suspense } from "react";
import { ListScreen } from "@/components/project/list-screen";
import { ListSkeleton } from "@/components/issues/skeletons";

export default function ListPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ListScreen />
    </Suspense>
  );
}
