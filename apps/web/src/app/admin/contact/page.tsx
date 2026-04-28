'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MessageSquare,
  Mail,
  Send,
  Trash2,
  CheckCircle2,
  Circle,
  Reply,
  CornerDownLeft,
  Inbox,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Tag,
  Clock,
  MailCheck,
  AlertCircle,
} from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  replied_at: string | null;
}

type FilterTab = 'all' | 'unread' | 'replied';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchSubmissions = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await apiClient<ContactSubmission[]>('/api/admin/contact');
      setSubmissions(data);
    } catch {
      toast.error('Failed to load inbox');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const filtered = submissions.filter((s) => {
    if (filter === 'unread') return !s.is_read;
    if (filter === 'replied') return !!s.replied_at;
    return true;
  });

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const unreadCount = submissions.filter((s) => !s.is_read).length;
  const repliedCount = submissions.filter((s) => !!s.replied_at).length;

  const handleSelect = async (sub: ContactSubmission) => {
    setSelectedId(sub.id);
    setReplyText('');
    if (!sub.is_read) {
      try {
        await apiClient(`/api/admin/contact/${sub.id}/read`, {
          method: 'PATCH',
          body: JSON.stringify({ isRead: true }),
        });
        setSubmissions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, is_read: true } : s))
        );
      } catch {}
    }
  };

  const handleToggleRead = async (sub: ContactSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient(`/api/admin/contact/${sub.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: !sub.is_read }),
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, is_read: !sub.is_read } : s))
      );
    } catch {
      toast.error('Failed to update read status');
    }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await apiClient(`/api/admin/contact/${selected.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText }),
      });
      const sentAt = new Date().toISOString();
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selected.id ? { ...s, is_read: true, replied_at: sentAt } : s
        )
      );
      toast.success(`Reply sent to ${selected.email}`);
      setReplyText('');
    } catch {
      toast.error('Failed to send reply. Check SMTP config.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await apiClient(`/api/admin/contact/${selected.id}`, { method: 'DELETE' });
      setSubmissions((prev) => prev.filter((s) => s.id !== selected.id));
      setSelectedId(null);
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',     label: 'All',     count: submissions.length },
    { id: 'unread',  label: 'Unread',  count: unreadCount },
    { id: 'replied', label: 'Replied', count: repliedCount },
  ];

  return (
    <div className="space-y-6 pb-8">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
              <MessageSquare className="h-5 w-5 text-brand-red" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
              Support Inbox
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-brand-red text-white text-[10px] font-extrabold shadow-lg shadow-brand-red/30">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-base text-text-muted">
            Review and respond to messages from the community.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatPill icon={<Inbox className="h-3.5 w-3.5" />} label="Total" value={submissions.length} />
          <StatPill icon={<AlertCircle className="h-3.5 w-3.5" />} label="Unread" value={unreadCount} accent />
          <StatPill icon={<MailCheck className="h-3.5 w-3.5" />} label="Replied" value={repliedCount} green />
          <button
            onClick={() => fetchSubmissions(true)}
            disabled={refreshing}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center border border-black/10 dark:border-white/10 hover:bg-brand-red/10 hover:border-brand-red/30 hover:text-brand-red transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex gap-0 rounded-[2rem] border border-black/[0.08] dark:border-white/[0.08] bg-white/[0.4] dark:bg-[#020617]/40 backdrop-blur-3xl shadow-2xl overflow-hidden"
        style={{ minHeight: '70vh' }}
      >

        <div className="w-full sm:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col">

          <div className="flex items-center gap-1 p-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                  filter === tab.id
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-extrabold ${
                    filter === tab.id ? 'bg-white/30 text-white' : 'bg-black/10 dark:bg-white/10 text-text-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                      <Skeleton className="h-3 w-10 rounded-full ml-auto" />
                    </div>
                    <Skeleton className="h-3 w-40 rounded-full mb-1.5" />
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                <Inbox className="h-12 w-12 text-text-muted/30 mb-3" />
                <p className="text-text-muted font-medium text-sm">
                  {filter === 'unread' ? 'All caught up! No unread messages.' :
                   filter === 'replied' ? 'No replied messages yet.' :
                   'Your inbox is empty.'}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => handleSelect(sub)}
                    className={`w-full text-left p-4 border-b border-black/[0.04] dark:border-white/[0.04] transition-all relative group cursor-pointer ${
                      selectedId === sub.id
                        ? 'bg-brand-red/[0.06] border-r-2 border-r-brand-red'
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {!sub.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-red rounded-r-full" />
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-red/20 flex-shrink-0 mt-0.5">
                        {sub.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm truncate ${!sub.is_read ? 'font-bold text-text-main' : 'font-medium text-text-muted'}`}>
                            {sub.name}
                          </span>
                          <span className="text-[10px] text-text-muted/60 font-medium flex-shrink-0">
                            {relativeTime(sub.created_at)}
                          </span>
                        </div>

                        <p className={`text-xs truncate mb-1 ${!sub.is_read ? 'font-semibold text-text-main' : 'text-text-muted'}`}>
                          {sub.subject || '(No subject)'}
                        </p>

                        <p className="text-[11px] text-text-muted/70 truncate leading-relaxed">
                          {sub.message}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          {!sub.is_read && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-red/10 text-brand-red text-[9px] font-bold uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
                              New
                            </span>
                          )}
                          {sub.replied_at && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                              <MailCheck className="h-2.5 w-2.5" />
                              Replied
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleToggleRead(sub, e)}
                        onKeyDown={(e) => e.key === 'Enter' && handleToggleRead(sub, e as any)}
                        title={sub.is_read ? 'Mark as unread' : 'Mark as read'}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1 transition-opacity cursor-pointer"
                      >
                        {sub.is_read
                          ? <Circle className="h-3.5 w-3.5 text-text-muted/40 hover:text-brand-red transition-colors" />
                          : <CheckCircle2 className="h-3.5 w-3.5 text-text-muted/40 hover:text-emerald-500 transition-colors" />
                        }
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8"
              >
                <div className="h-20 w-20 rounded-3xl bg-brand-red/5 border border-brand-red/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-brand-red/30" />
                </div>
                <div>
                  <p className="text-text-main font-bold text-lg mb-1">Select a message</p>
                  <p className="text-text-muted text-sm">Click any message on the left to read and reply.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-extrabold text-text-main tracking-tight mb-1 truncate">
                        {selected.subject || '(No subject)'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-bold text-text-main">{selected.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${selected.email}`} className="hover:text-brand-red transition-colors">
                            {selected.email}
                          </a>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(selected.created_at).toLocaleDateString(undefined, { dateStyle: 'full' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selected.replied_at && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 font-bold text-[10px] uppercase tracking-wider">
                          <MailCheck className="h-3 w-3" />
                          Replied {relativeTime(selected.replied_at)}
                        </Badge>
                      )}
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-9 w-9 rounded-xl inline-flex items-center justify-center border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/20 transition-all"
                        title="Delete message"
                      >
                        {deleting
                          ? <div className="h-4 w-4 border-2 border-destructive/40 border-t-destructive rounded-full animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] mb-6">
                    <p className="text-text-main whitespace-pre-wrap leading-relaxed text-[15px]">
                      {selected.message}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
                      <div className="p-1.5 rounded-lg bg-brand-red/10 border border-brand-red/20">
                        <Reply className="h-3.5 w-3.5 text-brand-red" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Reply to</p>
                        <p className="text-sm font-bold text-text-main">{selected.name} &lt;{selected.email}&gt;</p>
                      </div>
                      <p className="text-[10px] text-text-muted/60">
                        Via outsauce.official@gmail.com
                      </p>
                    </div>

                    <div className="px-4 pt-3 pb-0">
                      <p className="text-[11px] text-text-muted/60 italic border-l-2 border-brand-red/30 pl-3 leading-relaxed line-clamp-2">
                        {selected.message}
                      </p>
                    </div>

                    <Textarea
                      ref={textareaRef}
                      placeholder="Type your professional response here…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply();
                      }}
                      className="border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 min-h-[140px] px-4 py-3 text-sm resize-none"
                    />

                    <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <span className="text-[10px] text-text-muted/50 hidden sm:flex items-center gap-1">
                        <CornerDownLeft className="h-3 w-3" />
                        Ctrl+Enter to send
                      </span>
                      <Button
                        onClick={handleReply}
                        disabled={sending || !replyText.trim()}
                        className="bg-brand-red hover:bg-brand-red/90 text-white rounded-xl h-10 px-6 shadow-lg shadow-brand-red/20 gap-2 text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                      >
                        {sending ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  accent,
  green,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
        accent
          ? 'bg-brand-red/5 border-brand-red/20 text-brand-red'
          : green
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/10 dark:border-white/10 text-text-muted'
      }`}
    >
      {icon}
      <span>{value} {label}</span>
    </div>
  );
}
