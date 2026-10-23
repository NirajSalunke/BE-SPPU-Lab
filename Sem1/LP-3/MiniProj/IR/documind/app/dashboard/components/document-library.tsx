"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import DocumentSummarizer from "./document-summarizer";
import DocumentChat from "./document-chat";
import {
    FilePdf,
    ArrowSquareOut,
    Spinner,
    Clock,
    WarningCircle,
    Sparkle,
    ChatCircleText,
    FileText,
    ArrowsClockwise,
    X,
    ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type DocumentRow = {
    id: string;
    original_filename: string;
    storage_path: string;
    file_size: number;
    status: "uploaded" | "processing" | "ready" | "failed";
    page_count: number | null;
    created_at: string;
    updated_at: string;
};

type SummaryRow = {
    id: string;
    summary_type: "short" | "medium" | "detailed";
    content: string;
    model_name: string | null;
    created_at: string;
};

type WorkspaceTab = "chat" | "summarize" | "saved";

function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
}

function StatusBadge({ status }: { status: DocumentRow["status"] }) {
    switch (status) {
        case "ready":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ready
                </span>
            );
        case "processing":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    <Spinner className="size-3 animate-spin text-amber-400" />
                    Processing
                </span>
            );
        case "failed":
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                    <span className="size-1.5 rounded-full bg-red-400" />
                    Failed
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground" />
                    {status}
                </span>
            );
    }
}

export default function DocumentLibrary() {
    const [documents, setDocuments] = useState<DocumentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState("");

    // Workspace Popover State
    const [activeDocument, setActiveDocument] = useState<DocumentRow | null>(null);
    const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("chat");

    const [summaries, setSummaries] = useState<SummaryRow[]>([]);
    const [loadingSummariesFor, setLoadingSummariesFor] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState("");

    const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
    const [signedPdfFor, setSignedPdfFor] = useState<string | null>(null);
    const [openingPdfFor, setOpeningPdfFor] = useState<string | null>(null);

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        setLoadingError("");

        try {
            const supabase = createClient();
            const { data: authData, error: authError } = await supabase.auth.getUser();

            if (authError || !authData.user) {
                throw new Error("Please log in to view your documents.");
            }

            const { data, error } = await supabase
                .from("documents")
                .select(
                    "id, original_filename, storage_path, file_size, status, page_count, created_at, updated_at"
                )
                .eq("user_id", authData.user.id)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) {
                throw new Error(error.message);
            }

            setDocuments((data ?? []) as DocumentRow[]);
        } catch (error) {
            setLoadingError(
                error instanceof Error ? error.message : "Could not load your documents."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function fetchInitialDocuments() {
            try {
                const supabase = createClient();
                const { data: authData, error: authError } = await supabase.auth.getUser();

                if (authError || !authData.user) {
                    throw new Error("Please log in to view your documents.");
                }

                const { data, error } = await supabase
                    .from("documents")
                    .select(
                        "id, original_filename, storage_path, file_size, status, page_count, created_at, updated_at"
                    )
                    .eq("user_id", authData.user.id)
                    .order("created_at", { ascending: false })
                    .limit(100);

                if (error) {
                    throw new Error(error.message);
                }

                if (isMounted) {
                    setDocuments((data ?? []) as DocumentRow[]);
                }
            } catch (error) {
                if (isMounted) {
                    setLoadingError(
                        error instanceof Error ? error.message : "Could not load your documents."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void fetchInitialDocuments();

        return () => {
            isMounted = false;
        };
    }, []);

    const loadSummaries = useCallback(async (documentId: string) => {
        setLoadingSummariesFor(documentId);
        setSummaryError("");

        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("summaries")
                .select("id, summary_type, content, model_name, created_at")
                .eq("document_id", documentId)
                .order("created_at", { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            setSummaries((data ?? []) as SummaryRow[]);
        } catch (error) {
            setSummaryError(
                error instanceof Error ? error.message : "Could not load summaries."
            );
        } finally {
            setLoadingSummariesFor(null);
        }
    }, []);

    const openWorkspace = useCallback(
        async (document: DocumentRow) => {
            setActiveDocument(document);
            setWorkspaceTab("chat");
            setSignedPdfUrl(null);
            setSignedPdfFor(null);
            setOpeningPdfFor(null);
            await loadSummaries(document.id);
        },
        [loadSummaries]
    );

    const closeWorkspace = useCallback(() => {
        setActiveDocument(null);
        setSummaries([]);
        setSummaryError("");
        setSignedPdfUrl(null);
        setSignedPdfFor(null);
        setOpeningPdfFor(null);
    }, []);

    // Handle Escape key and lock body scroll when workspace popover is active
    useEffect(() => {
        if (!activeDocument) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeWorkspace();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [activeDocument, closeWorkspace]);

    const createPdfLink = useCallback(async (document: DocumentRow) => {
        setOpeningPdfFor(document.id);

        try {
            const supabase = createClient();

            const { data, error } = await supabase.storage
                .from("documents")
                .createSignedUrl(document.storage_path, 60);

            if (error || !data?.signedUrl) {
                throw new Error(error?.message || "Could not generate a signed link.");
            }

            setSignedPdfUrl(data.signedUrl);
            setSignedPdfFor(document.id);
        } catch {
            // Keep error localized if link generation fails
        } finally {
            setOpeningPdfFor(null);
        }
    }, []);

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                        <FileText className="size-3.5 text-primary" />
                        <span>Document Storage</span>
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        Document Library
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Select any PDF document to open its workspace for instant summarization and chat.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadDocuments()}
                    disabled={loading}
                    className="gap-2 cursor-pointer rounded-xl border-border hover:bg-muted/60"
                >
                    <ArrowsClockwise className={cn("size-3.5", loading && "animate-spin")} />
                    <span>{loading ? "Refreshing..." : "Refresh Library"}</span>
                </Button>
            </div>

            {loadingError && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive-foreground"
                >
                    <WarningCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                    <p className="flex-1 font-medium">{loadingError}</p>
                </div>
            )}

            {!loading && !loadingError && documents.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-inner">
                        <FilePdf className="size-7" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                        Your library is empty
                    </h3>
                    <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                        Upload your first PDF document to parse text and start generating summaries and chatting.
                    </p>
                </div>
            )}

            {/* Document Card Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((document) => (
                    <article
                        key={document.id}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/75 p-5 shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 shadow-sm transition-transform group-hover:scale-105">
                                    <FilePdf className="size-6" weight="duotone" />
                                </div>
                                <StatusBadge status={document.status} />
                            </div>

                            <h3
                                className="mt-4 font-semibold text-foreground text-sm tracking-tight line-clamp-2"
                                title={document.original_filename}
                            >
                                {document.original_filename}
                            </h3>

                            <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                    {document.page_count != null
                                        ? `${document.page_count} pages`
                                        : "Pages unknown"}
                                </span>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size)}</span>
                            </div>

                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                                <Clock className="size-3.5" />
                                <span>{formatDate(document.created_at)}</span>
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border/60">
                            <button
                                type="button"
                                onClick={() => void openWorkspace(document)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-4 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-98 cursor-pointer shadow-xs"
                            >
                                <ChatCircleText className="size-4" weight="bold" />
                                <span>Open Workspace</span>
                                <ArrowRight className="size-3.5 ml-auto" weight="bold" />
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            {/* FULL-SCREEN WORKSPACE POPOVER */}
            {activeDocument && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="workspace-title"
                    className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-2xl animate-in fade-in-0 duration-200"
                >
                    {/* Top Workspace Bar */}
                    <header className="shrink-0 border-b border-border/80 bg-card/60 backdrop-blur-md px-4 py-3 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Left: Document details */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400">
                                    <FilePdf className="size-5" weight="duotone" />
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2
                                            id="workspace-title"
                                            className="truncate text-sm sm:text-base font-bold text-foreground"
                                            title={activeDocument.original_filename}
                                        >
                                            {activeDocument.original_filename}
                                        </h2>
                                        <StatusBadge status={activeDocument.status} />
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>
                                            {activeDocument.page_count != null
                                                ? `${activeDocument.page_count} pages`
                                                : "Pages unknown"}
                                        </span>
                                        <span>•</span>
                                        <span>{formatFileSize(activeDocument.file_size)}</span>
                                        <span>•</span>
                                        {signedPdfUrl && signedPdfFor === activeDocument.id ? (
                                            <a
                                                href={signedPdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-2"
                                            >
                                                <span>View PDF</span>
                                                <ArrowSquareOut className="size-3" />
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => void createPdfLink(activeDocument)}
                                                disabled={openingPdfFor === activeDocument.id}
                                                className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer disabled:opacity-50"
                                            >
                                                {openingPdfFor === activeDocument.id ? (
                                                    <Spinner className="size-3 animate-spin" />
                                                ) : (
                                                    <ArrowSquareOut className="size-3" />
                                                )}
                                                <span>
                                                    {openingPdfFor === activeDocument.id
                                                        ? "Creating link..."
                                                        : "Open PDF"}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Center: Tabs Switcher */}
                            <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-1">
                                <button
                                    type="button"
                                    onClick={() => setWorkspaceTab("chat")}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer",
                                        workspaceTab === "chat"
                                            ? "bg-background text-foreground shadow-xs border border-border/60"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <ChatCircleText className="size-3.5" weight="bold" />
                                    <span>Chatbot</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setWorkspaceTab("summarize")}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer",
                                        workspaceTab === "summarize"
                                            ? "bg-background text-foreground shadow-xs border border-border/60"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sparkle className="size-3.5" weight="bold" />
                                    <span>Summarizer</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setWorkspaceTab("saved")}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer",
                                        workspaceTab === "saved"
                                            ? "bg-background text-foreground shadow-xs border border-border/60"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <FileText className="size-3.5" weight="bold" />
                                    <span>Saved Summaries</span>
                                    {summaries.length > 0 && (
                                        <span className="ml-0.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                                            {summaries.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Right: Close Cross Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={closeWorkspace}
                                    title="Close (Esc)"
                                    aria-label="Close workspace"
                                    className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer shadow-xs"
                                >
                                    <X className="size-5" weight="bold" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Popover Workspace Content Area */}
                    <div
                        className={cn(
                            "flex-1",
                            workspaceTab === "chat"
                                ? "min-h-0 flex flex-col p-3 sm:p-4 md:p-6 overflow-hidden"
                                : "overflow-y-auto p-4 sm:p-6 md:p-8"
                        )}
                    >
                        <div
                            className={cn(
                                "mx-auto max-w-5xl w-full",
                                workspaceTab === "chat"
                                    ? "flex-1 min-h-0 flex flex-col overflow-hidden"
                                    : ""
                            )}
                        >
                            {activeDocument.status !== "ready" && (
                                <div
                                    role="alert"
                                    className="mb-4 shrink-0 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200"
                                >
                                    <WarningCircle className="size-5 shrink-0 text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-sm text-amber-100">
                                            Document is {activeDocument.status}
                                        </p>
                                        <p className="mt-1 leading-relaxed text-amber-200/80">
                                            This document is still being extracted. Once ready,
                                            AI summarization and document chat will be active.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 1: Chatbot */}
                            {workspaceTab === "chat" && (
                                <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in-50 duration-150">
                                    <DocumentChat
                                        documentId={activeDocument.id}
                                        documentName={activeDocument.original_filename}
                                    />
                                </div>
                            )}

                            {/* TAB 2: Summarizer */}
                            {workspaceTab === "summarize" && (
                                <div className="animate-in fade-in-50 duration-150 space-y-6">
                                    <DocumentSummarizer
                                        documentId={activeDocument.id}
                                        onSummaryCreated={() =>
                                            void loadSummaries(activeDocument.id)
                                        }
                                    />

                                    {summaries.length > 0 && (
                                        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-xs text-muted-foreground">
                                                You have{" "}
                                                <strong className="text-foreground">
                                                    {summaries.length}
                                                </strong>{" "}
                                                saved{" "}
                                                {summaries.length === 1
                                                    ? "summary"
                                                    : "summaries"}{" "}
                                                for this document.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setWorkspaceTab("saved")}
                                                className="text-xs h-8 cursor-pointer rounded-lg border-border"
                                            >
                                                View Saved Summaries →
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: Saved Summaries */}
                            {workspaceTab === "saved" && (
                                <div className="animate-in fade-in-50 duration-150 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-foreground">
                                                Saved Summaries
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                All past summaries generated for{" "}
                                                {activeDocument.original_filename}.
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setWorkspaceTab("summarize")}
                                            className="text-xs h-8 gap-1.5 cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                        >
                                            <Sparkle className="size-3.5" />
                                            <span>Generate New Summary</span>
                                        </Button>
                                    </div>

                                    {loadingSummariesFor === activeDocument.id && (
                                        <p
                                            role="status"
                                            className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground"
                                        >
                                            <Spinner className="size-4 animate-spin text-primary" />
                                            Loading saved summaries...
                                        </p>
                                    )}

                                    {summaryError && (
                                        <div
                                            role="alert"
                                            className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground"
                                        >
                                            {summaryError}
                                        </div>
                                    )}

                                    {loadingSummariesFor !== activeDocument.id &&
                                        !summaryError &&
                                        summaries.length === 0 && (
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center">
                                                <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                                                    <Sparkle className="size-6" weight="duotone" />
                                                </div>
                                                <h4 className="mt-4 text-sm font-semibold text-foreground">
                                                    No summaries generated yet
                                                </h4>
                                                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                                    Generate an executive summary with your desired
                                                    depth (Short, Medium, or Detailed).
                                                </p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => setWorkspaceTab("summarize")}
                                                    className="mt-4 text-xs h-8.5 cursor-pointer rounded-xl"
                                                >
                                                    Create First Summary
                                                </Button>
                                            </div>
                                        )}

                                    <div className="space-y-3">
                                        {summaries.map((item) => (
                                            <article
                                                key={item.id}
                                                className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 p-5 shadow-sm space-y-3"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                                                            {item.summary_type}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            • {formatDate(item.created_at)}
                                                        </span>
                                                        {item.model_name && (
                                                            <span className="text-[11px] font-mono text-muted-foreground/70">
                                                                ({item.model_name})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-xs sm:text-sm leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-4">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {item.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
