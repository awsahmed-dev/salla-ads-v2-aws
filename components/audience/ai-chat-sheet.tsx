"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Send,
  Wand2,
  RefreshCw,
  ArrowRight,
  User,
  CheckCircle2,
  Users,
} from "lucide-react";
import { parseChatPrompt, type ChatResult, type Customer } from "@/lib/audience/rfdm";
import { SallaTip } from "@/components/audience/salla-tip";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  result?: ChatResult;
}

interface AIChatSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: Customer[];
  totalCustomers: number;
  /** Called when the merchant saves the generated audience. */
  onSave: (args: { name: string; prompt: string; result: ChatResult }) => void;
  /** If provided, prefill the input (from command bar). */
  initialPrompt?: string;
}

const PROMPT_SUGGESTIONS = [
  "Users who bought 3 months ago but haven't since",
  "VIP customers in UAE who spent over 2000 SAR",
  "Cash-on-delivery buyers with 3+ orders",
  "High-value customers who used a coupon",
  "Cart abandoners in the last 7 days",
  "Mada-only buyers who haven't purchased in 60 days",
];

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

export function AIChatSheet({
  open,
  onOpenChange,
  customers,
  totalCustomers,
  onSave,
  initialPrompt,
}: AIChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0 && !initialPrompt) {
      setMessages([
        {
          id: "intro",
          role: "ai",
          content:
            "Describe the audience you want in plain language — I'll build it, show you a preview, and you can save it to your library.",
        },
      ]);
    }
  }, [open, messages.length, initialPrompt]);

  useEffect(() => {
    if (initialPrompt && open) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, open]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const lastResult = [...messages].reverse().find((m) => m.result)?.result;

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const userMsg: Message = { id: `m${Date.now()}`, role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    // Simulate a brief "thinking" delay for UX
    setTimeout(() => {
      const result = parseChatPrompt(content, customers);
      const scaled = Math.round((result.matched / Math.max(customers.length, 1)) * totalCustomers);
      const scaledResult: ChatResult = { ...result, matched: scaled };

      const aiMsg: Message = {
        id: `m${Date.now() + 1}`,
        role: "ai",
        content: scaledResult.rationale,
        result: scaledResult,
      };
      setMessages((m) => [...m, aiMsg]);
      setPending(false);

      // Seed a name from the prompt
      if (!audienceName) {
        const short = content.length > 48 ? content.slice(0, 45) + "…" : content;
        setAudienceName(short.charAt(0).toUpperCase() + short.slice(1));
      }
    }, 500);
  }

  function handleSave() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || !lastResult) return;
    onSave({
      name: audienceName || lastUser.content.slice(0, 50),
      prompt: lastUser.content,
      result: lastResult,
    });
    // reset
    setMessages([]);
    setAudienceName("");
    setInput("");
    onOpenChange(false);
  }

  function handleReset() {
    setMessages([
      {
        id: "intro",
        role: "ai",
        content:
          "Describe the audience you want in plain language — I'll build it, show you a preview, and you can save it to your library.",
      },
    ]);
    setAudienceName("");
    setInput("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Wand2 className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">Audience Studio</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Build an audience with natural language — refine by chatting.
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 text-xs text-muted-foreground"
              onClick={handleReset}
            >
              <RefreshCw className="size-3" />
              New chat
            </Button>
          </div>
        </SheetHeader>

        {/* Message thread */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && initialPrompt && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Press <kbd className="rounded border border-border bg-white px-1">Enter</kbd> to send your prompt.
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user"
                    ? "bg-[#004956] text-white"
                    : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                )}
              >
                {m.role === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-[#004956] text-white"
                    : "bg-muted/40 text-foreground"
                )}
              >
                <p className="leading-snug">{m.content}</p>

                {/* Result preview */}
                {m.result && (
                  <div className="mt-3 space-y-2 rounded-xl border border-border bg-white p-3">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-foreground">Audience preview</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold tabular-nums text-[#004956]">
                        {formatNumber(m.result.matched)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        customers · {((m.result.matched / totalCustomers) * 100).toFixed(1)}% of your base
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Conditions</p>
                      <div className="flex flex-wrap gap-1">
                        {m.result.conditions.map((c, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="rounded-full border-violet-200 bg-violet-50 px-1.5 py-0 text-[9px] font-mono font-medium text-violet-700"
                          >
                            {c.field} {c.op} {String(c.value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="size-3.5" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-muted/40 px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: "0.1s" }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          )}

          {/* Suggestion chips (only when no real conversation yet) */}
          {messages.filter((m) => m.role === "user").length === 0 && !pending && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Try one of these</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <SallaTip kind="note" compact className="mt-3">
                I work with the data your store already has — orders, total spending, payment method, country, and dates. Things outside those (e.g. age, gender, product brand) won't match yet.
              </SallaTip>
            </div>
          )}
        </div>

        {/* Save bar */}
        {lastResult && (
          <div className="border-t border-border bg-muted/20 px-5 py-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0 text-[#004956]" />
              <Input
                value={audienceName}
                onChange={(e) => setAudienceName(e.target.value)}
                placeholder="Name this audience"
                className="h-9 flex-1 bg-white text-sm"
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!audienceName.trim()}
                className="gap-1 bg-[#004956] text-white hover:bg-[#003e4a]"
              >
                Save
                <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border bg-white px-5 py-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe an audience…"
            className="h-10 flex-1 text-sm"
            autoFocus={open}
            disabled={pending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || pending}
            className="h-10 gap-1 bg-gradient-to-r from-violet-500 to-purple-600 px-3 text-white hover:from-violet-600 hover:to-purple-700"
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
