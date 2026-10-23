
"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
    Sparkle,
    ChatCircle,
    Plus,
    Spinner,
    WarningCircle,
    ArrowsClockwise,
    ArrowUp,
    Copy,
    Check,
    Lightning,
    BookOpen,
    ArrowUpRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatUiMessage = {
    id: string;
    role: ChatRole;
    content: string;
    citations: number[];
    pending?: boolean;
};

type Conversation = {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
};

type StoredMessage = {
    id: string;
    role: string;
    content: string;
    citations: unknown;
    created_at: string;
};

type ChatApiResponse = {
    error?: string;
    conversations?: Conversation[];
    messages?: StoredMessage[];
};

type DocumentChatProps = {
    documentId: string;
    documentName?: string;
};

function parseCitations(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(
        value.filter(
            (item): item is number =>
                typeof item === "number" &&
                Number.isInteger(item) &&
                item > 0
        )
    )];
}

function mapStoredMessages(rows: StoredMessage[]): ChatUiMessage[] {
    return rows.flatMap((row): ChatUiMessage[] => {
        if (row.role !== "user" && row.role !== "assistant") {
            return [];
        }

        return [{
            id: row.id,
            role: row.role,
            content: row.content,
            citations: parseCitations(row.citations),
        }];
    });
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function DocumentChat({
    documentId,
    documentName,
}: DocumentChatProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatUiMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [failedQuestion, setFailedQuestion] = useState<string | null>(null);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea up to max height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
    }, [draft]);

    const handleCopy = (id: string, text: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId((curr) => (curr === id ? null : curr));
        }, 2000);
    };

    const documentChatUrl =
        `/api/documents/chat?documentId=${encodeURIComponent(documentId)}`;

    const fetchConversationMessages = useCallback(
        async (id: string) => {
            const response = await fetch(
                `${documentChatUrl}&conversationId=${encodeURIComponent(id)}`,
                { cache: "no-store" }
            );

            const data = (await response.json()) as ChatApiResponse;

            if (!response.ok) {
                throw new Error(data.error || "Could not load this conversation.");
            }

            return mapStoredMessages(data.messages ?? []);
        },
        [documentChatUrl]
    );

    const refreshConversationList = useCallback(async () => {
        const response = await fetch(documentChatUrl, { cache: "no-store" });
        const data = (await response.json()) as ChatApiResponse;

        if (!response.ok) {
            throw new Error(data.error || "Could not refresh conversations.");
        }

        setConversations(data.conversations ?? []);
    }, [documentChatUrl]);

    useEffect(() => {
        let cancelled = false;

        async function loadInitialConversation() {
            setLoadingHistory(true);
            setError("");

            try {
                const response = await fetch(documentChatUrl, {
                    cache: "no-store",
                });

                const data = (await response.json()) as ChatApiResponse;

                if (!response.ok) {
                    throw new Error(data.error || "Could not load chat history.");
                }

                const list = data.conversations ?? [];

                if (cancelled) {
                    return;
                }

                setConversations(list);

                const latest = list[0];

                if (!latest) {
                    setConversationId(null);
                    setMessages([]);
                    return;
                }

                setConversationId(latest.id);

                const loadedMessages =
                    await fetchConversationMessages(latest.id);

                if (!cancelled) {
                    setMessages(loadedMessages);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Could not load chat history."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }
        }

        void loadInitialConversation();

        return () => {
            cancelled = true;
        };
    }, [documentChatUrl, fetchConversationMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function openConversation(id: string) {
        if (isSending || loadingHistory) {
            return;
        }

        setConversationId(id);
        setMessages([]);
        setError("");
        setNotice("");
        setLoadingHistory(true);

        try {
            const loadedMessages = await fetchConversationMessages(id);
            setMessages(loadedMessages);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load this conversation."
            );
        } finally {
            setLoadingHistory(false);
        }
    }

    function startNewConversation() {
        if (isSending) {
            return;
        }

        setConversationId(null);
        setMessages([]);
        setDraft("");
        setError("");
        setNotice("");
    }

    async function sendQuestion(question: string) {
        if (!question || isSending || loadingHistory) {
            return;
        }

        const userMessageId = crypto.randomUUID();
        const assistantMessageId = crypto.randomUUID();

        const optimisticUserMessage: ChatUiMessage = {
            id: userMessageId,
            role: "user",
            content: question,
            citations: [],
        };

        const optimisticAssistantMessage: ChatUiMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            citations: [],
            pending: true,
        };

        setMessages((previous) => [
            ...previous,
            optimisticUserMessage,
            optimisticAssistantMessage,
        ]);

        setDraft("");
        setError("");
        setNotice("");
        setFailedQuestion(null);
        setIsSending(true);

        let responseAccepted = false;

        try {
            const response = await fetch("/api/documents/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId,
                    message: question,
                    ...(conversationId ? { conversationId } : {}),
                }),
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as {
                    error?: string;
                };

                throw new Error(
                    data.error || "Could not send your message."
                );
            }

            responseAccepted = true;

            const returnedConversationId =
                response.headers.get("X-Conversation-Id");

            const activeId = returnedConversationId ?? conversationId;

            if (activeId) {
                setConversationId(activeId);
            }

            const citationHeader =
                response.headers.get("X-Citation-Pages") ?? "";

            const retrievedPages = citationHeader
                .split(",")
                .map((value) => Number(value.trim()))
                .filter(
                    (value) =>
                        Number.isInteger(value) && value > 0
                );

            if (!response.body) {
                throw new Error("The server did not return a response stream.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                if (chunk) {
                    setMessages((previous) =>
                        previous.map((message) =>
                            message.id === assistantMessageId
                                ? {
                                    ...message,
                                    content: message.content + chunk,
                                    citations: retrievedPages,
                                }
                                : message
                        )
                    );
                }
            }

            const finalChunk = decoder.decode();
            setMessages((previous) =>
                previous.map((message) =>
                    message.id === assistantMessageId
                        ? {
                            ...message,
                            content: finalChunk ? message.content + finalChunk : message.content,
                            citations: retrievedPages,
                            pending: false,
                        }
                        : message
                )
            );

            await refreshConversationList();

            setNotice("Message sent.");
        } catch (err) {
            setFailedQuestion(question);
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while chatting."
            );

            setMessages((previous) =>
                previous.flatMap((message) => {
                    if (
                        message.id === assistantMessageId &&
                        !message.content
                    ) {
                        return [];
                    }

                    if (
                        !responseAccepted &&
                        message.id === userMessageId
                    ) {
                        return [];
                    }

                    if (message.id === assistantMessageId) {
                        return [{ ...message, pending: false }];
                    }

                    return [message];
                })
            );
        } finally {
            setIsSending(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await sendQuestion(draft.trim());
    }

    const activeConversation = conversations.find((c) => c.id === conversationId);

    return (
        <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header / Sub-bar */}
            <header className="shrink-0 border-b border-border/60 px-5 py-3 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-xs">
                        <ChatCircle className="size-4.5" weight="duotone" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground tracking-tight">
                                {activeConversation ? activeConversation.title : "Document AI Assistant"}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                Grounded
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={startNewConversation}
                        disabled={isSending}
                        className="gap-1.5 h-8 rounded-lg border-border hover:bg-muted/80 text-xs font-medium"
                    >
                        <Plus className="size-3.5" weight="bold" />
                        New chat
                    </Button>
                </div>
            </header>

            {/* Recent conversation history bar if conversations exist */}
            {conversations.length > 0 && (
                <div className="shrink-0 border-b border-border/40 px-5 py-2 bg-muted/20 flex items-center gap-2 overflow-x-auto scrollbar-none">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 mr-1">
                        History:
                    </span>
                    {conversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            type="button"
                            disabled={isSending || loadingHistory}
                            onClick={() => void openConversation(conversation.id)}
                            className={cn(
                                "max-w-48 shrink-0 truncate rounded-md border px-2.5 py-1 text-xs transition-all disabled:opacity-50",
                                conversationId === conversation.id
                                    ? "border-primary/50 bg-primary/10 text-primary font-medium shadow-xs"
                                    : "border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                            )}
                            title={`${conversation.title} • ${formatDate(conversation.updated_at)}`}
                        >
                            {conversation.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages Scroll Area */}
            <div
                aria-label="Conversation messages"
                aria-live="polite"
                className="flex-1 min-h-0 space-y-5 overflow-y-auto p-4 sm:p-6"
            >
                {loadingHistory && (
                    <div role="status" className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                        <Spinner className="size-5 animate-spin text-primary" />
                        <span>Loading conversation...</span>
                    </div>
                )}

                {!loadingHistory && messages.length === 0 && (
                    <div className="flex min-h-[360px] flex-col items-center justify-center text-center px-4 py-8">
                        <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/20 to-primary/5 text-primary shadow-lg shadow-primary/10">
                            <Sparkle className="size-7" weight="duotone" />
                            <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-xl -z-10" />
                        </div>

                        <h4 className="text-lg font-semibold tracking-tight text-foreground">
                            Chat with this document
                        </h4>

                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                            Ask about specific findings, methodologies, numerical figures, or conclusions. Answers are synthesized and cited directly from the PDF pages.
                        </p>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
                            <button
                                type="button"
                                onClick={() => void sendQuestion("What are the key findings and main takeaways of this document?")}
                                disabled={isSending}
                                className="group relative rounded-xl border border-border/70 bg-card/60 p-3.5 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 text-left disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        <Lightning className="size-3.5" weight="duotone" />
                                    </div>
                                    <ArrowUpRight className="size-3.5 text-muted-foreground/50 transition group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                                <h5 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                    Key Takeaways
                                </h5>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                    Core conclusions, findings & primary takeaways.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => void sendQuestion("Summarize the methodology, data sets, and technical approach.")}
                                disabled={isSending}
                                className="group relative rounded-xl border border-border/70 bg-card/60 p-3.5 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 text-left disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        <BookOpen className="size-3.5" weight="duotone" />
                                    </div>
                                    <ArrowUpRight className="size-3.5 text-muted-foreground/50 transition group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                                <h5 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                    Methodology & Data
                                </h5>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                    Explain models, datasets, or experimental steps.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => void sendQuestion("What are the key limitations, risks, or caveats mentioned in this document?")}
                                disabled={isSending}
                                className="group relative rounded-xl border border-border/70 bg-card/60 p-3.5 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 text-left disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        <WarningCircle className="size-3.5" weight="duotone" />
                                    </div>
                                    <ArrowUpRight className="size-3.5 text-muted-foreground/50 transition group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                                <h5 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                    Limitations & Risks
                                </h5>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                    Identified risks, caveats, or constraints.
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex gap-3",
                            message.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        {message.role === "assistant" && (
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/20 shadow-xs mt-0.5">
                                <Sparkle className="size-4" weight="duotone" />
                            </div>
                        )}

                        <div
                            className={cn(
                                "group relative transition-all",
                                message.role === "user"
                                    ? "max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 px-4 py-3 text-white shadow-md shadow-violet-950/25"
                                    : "flex-1 max-w-[92%] sm:max-w-[88%] rounded-2xl rounded-tl-xs border border-border/75 bg-card/85 p-4 sm:p-5 text-foreground shadow-sm"
                            )}
                        >
                            {message.role === "assistant" && (
                                <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                                    <span className="text-[11px] font-semibold text-foreground/90">
                                        DocuMind Assistant
                                    </span>

                                    {message.content && !message.pending && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(message.id, message.content)}
                                            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition rounded px-1.5 py-0.5 hover:bg-muted"
                                            title="Copy answer"
                                        >
                                            {copiedId === message.id ? (
                                                <>
                                                    <Check className="size-3 text-emerald-400" weight="bold" />
                                                    <span className="text-[10px] text-emerald-400">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3" />
                                                    <span className="text-[10px]">Copy</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {message.pending && !message.content && (
                                <div className="flex items-center gap-2.5 py-2 text-xs text-muted-foreground">
                                    <Spinner className="size-4 animate-spin text-primary" />
                                    <span>Synthesizing answer from document chunks...</span>
                                </div>
                            )}

                            {message.content && (
                                <div
                                    className={cn(
                                        "break-words text-sm leading-relaxed",
                                        message.role === "user"
                                            ? "text-white/95"
                                            : "text-foreground/90 [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-3 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
                                    )}
                                >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                    {message.pending && (
                                        <span className="inline-block size-2 rounded-full bg-primary animate-pulse ml-1 align-middle" />
                                    )}
                                </div>
                            )}

                            {message.role === "assistant" &&
                                message.citations &&
                                message.citations.length > 0 && (
                                    <div className="mt-3.5 border-t border-border/50 pt-2.5 flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
                                            <BookOpen className="size-3 text-primary" />
                                            Sources:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {message.citations.map((page) => (
                                                <span
                                                    key={page}
                                                    className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary shadow-xs"
                                                >
                                                    Page {page}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {message.role === "user" && (
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 shadow-xs mt-0.5 text-[11px] font-bold">
                                You
                            </div>
                        )}
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div
                    role="alert"
                    className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground sm:mx-6"
                >
                    <div className="flex items-center gap-2">
                        <WarningCircle className="size-4 shrink-0 text-destructive" weight="fill" />
                        <p className="flex-1 font-medium">{error}</p>
                    </div>
                    {failedQuestion && !isSending && (
                        <button
                            type="button"
                            onClick={() => void sendQuestion(failedQuestion)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/20 px-2.5 py-1 text-xs font-semibold text-destructive-foreground transition hover:bg-destructive/30 active:scale-95"
                        >
                            <ArrowsClockwise className="size-3.5" />
                            Retry
                        </button>
                    )}
                </div>
            )}

            {notice && !error && (
                <p
                    role="status"
                    className="px-6 pb-2 text-[11px] font-medium text-muted-foreground"
                >
                    {notice}
                </p>
            )}

            {/* Modern Chat Input Dock */}
            <div className="shrink-0 border-t border-border/50 bg-background/40 backdrop-blur-md p-3.5 sm:p-4">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex flex-col rounded-2xl border border-border/80 bg-card/95 shadow-xl shadow-black/25 transition-all duration-200 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10 focus-within:shadow-[0_0_25px_rgba(124,58,237,0.12)]"
                >
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!isSending && !loadingHistory && draft.trim()) {
                                    void sendQuestion(draft.trim());
                                }
                            }
                        }}
                        placeholder="Ask anything about this document..."
                        rows={1}
                        maxLength={4000}
                        disabled={isSending || loadingHistory}
                        className="w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 leading-relaxed font-normal min-h-[48px] max-h-44"
                    />

                    <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1.5 border-t border-border/40 mt-1">
                        <div className="flex items-center gap-2 select-none">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                                <Sparkle className="size-3" weight="fill" />
                                <span className="truncate max-w-[160px] sm:max-w-xs">{documentName || "PDF"}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                                <span>Press</span>
                                <kbd className="inline-flex items-center justify-center rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs">
                                    ↵ Enter
                                </kbd>
                                <span>to send</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {draft.length > 200 && (
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                    {draft.length}/4000
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={isSending || loadingHistory || !draft.trim()}
                                aria-label="Send message"
                                className={cn(
                                    "group/btn relative flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 select-none",
                                    draft.trim() && !isSending
                                        ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 border border-violet-400/30 hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                        : "bg-muted/40 border border-border/60 text-muted-foreground/60 cursor-not-allowed"
                                )}
                            >
                                {isSending ? (
                                    <>
                                        <Spinner className="size-3.5 animate-spin text-primary" />
                                        <span>Thinking...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send</span>
                                        <ArrowUp
                                            className={cn(
                                                "size-3.5 transition-transform duration-150",
                                                draft.trim() ? "group-hover/btn:-translate-y-0.5" : "text-muted-foreground/50"
                                            )}
                                            weight="bold"
                                        />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}
