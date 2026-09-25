import { ChevronDown, Copy, SquareTerminal, Code2, ClipboardCheck } from "lucide-react";
import { ClaudeMark } from "@/components/brand/claude-mark";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import {
  MAX_PROMPT_CHARS,
  buildIssuePrompt,
  cliCommand,
  deepLink,
  openDeepLink,
  targetLabel,
  type ClaudeSurface,
} from "@/lib/integrations/claude-code";
import { cn } from "@/lib/utils/cn";

/**
 * Split control on the issue header: the main half opens the issue in Claude
 * Code with every field as the prompt, the caret offers the other surface and
 * clipboard fallbacks.
 */
export function SendToClaude({ issueId }: { issueId: string }) {
  const store = useStore();
  const surface = useUI((s) => s.claudeSurface);
  const target = useUI((s) => s.claudeTarget);

  const issue = store.issues.find((i) => i.id === issueId);
  if (!issue) return null;

  const prompt = (max = MAX_PROMPT_CHARS) =>
    buildIssuePrompt(issue, store, { origin: location.origin, maxChars: max });

  const send = (to: ClaudeSurface) => {
    const text = prompt();
    openDeepLink(deepLink(to, text, target));
    const where =
      to === "vscode" ? "VS Code" : to === "desktop" ? "the Claude app" : `Claude Code · ${targetLabel(target)}`;
    toast.success(`Sent ${store.project.key}-${issue.number} to ${where}`, {
      label: "Copy prompt",
      onClick: () => copy(prompt(Infinity), "Prompt copied"),
    });
  };

  const copy = (text: string, message: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(message);
  };

  const item =
    "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13.5px] font-medium hover:bg-surface-2";

  return (
    <div className="mr-1.5 flex items-center rounded-[9px] bg-surface shadow-[inset_0_0_0_1px_var(--border-strong)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--text-subtle)]">
      <Tooltip content="Open in Claude Code with every field as the prompt">
        <button
          onClick={() => send(surface)}
          className="flex h-8 items-center gap-1.5 rounded-l-[9px] pl-2.5 pr-2.5 font-display text-[12.5px] font-semibold text-text transition-colors hover:bg-surface-2"
        >
          <ClaudeMark size={13} />
          Claude Code
        </button>
      </Tooltip>
      <span className="h-4 w-px bg-border-strong" />
      <Popover
        placement="bottom-end"
        className="w-64 p-1.5"
        render={({ close }) => (
          <div>
            <button onClick={() => { send("desktop"); close(); }} className={item}>
              <ClaudeMark size={14} />
              <span className="flex-1">Open in Claude app</span>
              {surface === "desktop" && <Dot />}
            </button>
            <button onClick={() => { send("terminal"); close(); }} className={item}>
              <SquareTerminal size={15} strokeWidth={2.1} className="text-text-muted" />
              <span className="flex-1">Open in terminal</span>
              {surface === "terminal" && <Dot />}
            </button>
            <button onClick={() => { send("vscode"); close(); }} className={item}>
              <Code2 size={15} strokeWidth={2.1} className="text-text-muted" />
              <span className="flex-1">Open in VS Code</span>
              {surface === "vscode" && <Dot />}
            </button>
            <div className="mx-2 my-1 h-px bg-border" />
            <button
              onClick={() => { copy(prompt(Infinity), "Prompt copied to clipboard"); close(); }}
              className={item}
            >
              <Copy size={15} strokeWidth={2.1} className="text-text-muted" /> Copy prompt
            </button>
            <button
              onClick={() => { copy(cliCommand(prompt(Infinity), target), "Command copied to clipboard"); close(); }}
              className={item}
            >
              <ClipboardCheck size={15} strokeWidth={2.1} className="text-text-muted" /> Copy <code className="rounded-[4px] bg-surface-2 px-1 font-mono text-[12px]">claude</code> command
            </button>
            <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] leading-relaxed text-text-subtle">
              Opens in <span className="font-display font-semibold text-text-muted">{targetLabel(target)}</span>. The prompt is pre-filled, never sent
              automatically. Change the folder in Settings → Claude Code.
            </p>
          </div>
        )}
      >
        <button
          aria-label="Claude Code options"
          className={cn(
            "flex h-8 items-center rounded-r-[9px] px-1.5 text-text-subtle transition-colors hover:bg-surface-2 hover:text-text",
            "data-[state=open]:bg-surface-2 data-[state=open]:text-text",
          )}
        >
          <ChevronDown size={14} strokeWidth={2.4} />
        </button>
      </Popover>
    </div>
  );
}

const Dot = () => <span className="h-2 w-2 rounded-full bg-accent" />;
