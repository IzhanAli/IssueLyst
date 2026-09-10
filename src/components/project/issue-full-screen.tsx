"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IssueDetail } from "@/components/issues/detail/issue-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store";
import { useHydrated } from "@/lib/store/hooks";

export function IssueFullScreen() {
  const params = useParams<{ issueKey: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const issues = useStore((s) => s.issues);

  const number = Number(String(params.issueKey).split("-").pop());
  const issue = issues.find((i) => i.number === number);

  if (!hydrated) return null;

  if (!issue) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-11 items-center border-b border-border px-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/project/engineering/list")}>
            <ArrowLeft size={15} /> Back to issues
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState title="Issue not found" description={`No issue matches ${params.issueKey}.`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-border px-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/app/project/engineering/list")}>
          <ArrowLeft size={15} /> Issues
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <IssueDetail issueId={issue.id} variant="page" />
      </div>
    </div>
  );
}
