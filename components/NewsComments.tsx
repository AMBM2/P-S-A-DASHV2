"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { NewsComment } from "@/lib/types";
import { Button, Card, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export function NewsComments({ newsId, enabled }: { newsId: string; enabled: boolean }) {
  const [list, setList] = useState<NewsComment[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("news_comments")
      .select("*")
      .eq("newsId", newsId)
      .order("createdAt", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setList((data as NewsComment[]) || []);
  };

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [newsId, enabled]);

  const submit = async () => {
    if (!author.trim() || !text.trim()) return;
    const { error } = await supabase.from("news_comments").insert({
      id: crypto.randomUUID(),
      newsId,
      author: author.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
    load();
  };

  if (!enabled) return null;

  return (
    <Card className="mt-8">
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold gold-text">
        <MessageSquare size={18} /> التعليقات ({list.length})
      </h3>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="اسمك"
          className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
        />
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="اكتب تعليقك..."
            className="flex-1 rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
          />
          <Button onClick={submit} className="px-3">
            <Send size={15} />
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-zinc-500">جارٍ تحميل التعليقات...</p>
      ) : list.length === 0 ? (
        <EmptyState message="لا توجد تعليقات بعد — كن أول من يعلّق" />
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <div key={c.id} className="rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                <User size={12} className="text-gold-300" />
                <span className="font-semibold text-gold-200">{c.author}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {timeAgo(c.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}