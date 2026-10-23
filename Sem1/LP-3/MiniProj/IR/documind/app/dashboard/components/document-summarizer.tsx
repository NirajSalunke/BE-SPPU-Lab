"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
    Sparkle,
    Spinner,
    Copy,
    DownloadSimple,
    Check,
    Lightning,
    WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SummaryType = "short" | "medium" | "detailed";

type SummaryResponse = {
    summary?: string;
    summaryType?: SummaryType;
    cached?: boolean;
    error?: string;
};

type DocumentSummarizerProps = {
    documentId: string;
    onSummaryCreated?: () => void;
};

const SUMMARY_OPTIONS: {
    value: SummaryType;
    label: string;
    description: string;
}[] = [
    {
        value: "short",
        label: "Short",
        description: "Quick bullet points & key takeaways",
    },
    {
        value: "medium",
        label: "Medium",
        description: "Balanced overview of all sections",
    },
    {
        value: "detailed",
        label: "Detailed",
        description: "In-depth breakdown with evidence",
    },
];

export default function DocumentSummarizer({
    documentId,
    onSummaryCreated,
}: DocumentSummarizerProps) {
    const [summaryType, setSummaryType] = useState<SummaryType>("medium");
    const [summary, setSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [cached, setCached] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleGenerateSummary() {
        setIsLoading(true);
        setError("");
        setSummary("");
        setCached(false);

        try {
            const response = await fetch("/api/documents/summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId,
                    summaryType,
                }),
            });

            const data = (await response.json()) as SummaryResponse;

            if (!response.ok) {
                throw new Error(data.error || "Could not generate the summary.");
            }

            if (typeof data.summary !== "string" || !data.summary.trim()) {
                throw new Error("The API returned an empty summary.");
            }

            setSummary(data.summary);
            setCached(data.cached === true);
            onSummaryCreated?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while generating the summary."
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError("Could not copy summary. Please allow clipboard permissions.");
        }
    }

    function handleDownload() {
        const blob = new Blob([summary], {
            type: "text/markdown;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `documind-summary-${summaryType}.md`;
        anchor.click();

        URL.revokeObjectURL(url);
    }

    return (
        <section className="space-y-4 rounded-2xl border border-border bg-card/60 p-5 sm:p-6 shadow-sm">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    AI Summarization
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    Generate an executive summary
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    Select your preferred depth. Summaries are powered by Groq and cached for fast re-access.
                </p>
            </div>

            {/* Length selector */}
            <div className="grid gap-3 sm:grid-cols-3">
                {SUMMARY_OPTIONS.map((option) => {
                    const selected = summaryType === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                                setSummaryType(option.value);
                                setSummary("");
                                setError("");
                                setCached(false);
                            }}
                            aria-pressed={selected}
                            className={cn(
                                "group rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer",
                                selected
                                    ? "border-violet-500/70 bg-violet-500/10 shadow-sm ring-1 ring-violet-500/30"
                                    : "border-border/80 bg-card/60 hover:border-border hover:bg-card hover:shadow-xs",
                                isLoading && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-sm font-semibold",
                                    selected ? "text-violet-300" : "text-foreground"
                                )}>
                                    {option.label}
                                </span>
                                {selected && (
                                    <span className="size-2 rounded-full bg-violet-400 shadow-sm" />
                                )}
                            </div>

                            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                                {option.description}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="h-10 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-violet-500/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="size-4 animate-spin" />
                            <span>Reading & Generating Summary...</span>
                        </>
                    ) : (
                        <>
                            <Sparkle className="size-4" />
                            <span>Generate {summaryType} summary</span>
                        </>
                    )}
                </Button>

                {cached && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lightning className="size-3.5 text-amber-400" />
                        <span>Instant cache retrieval</span>
                    </span>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200"
                >
                    <WarningCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
                    <p className="flex-1">{error}</p>
                </div>
            )}

            {summary && (
                <article className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 bg-muted/20">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold capitalize text-foreground">
                                    {summaryType} Summary
                                </h4>
                                <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                    Groq AI
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopy}
                                size="sm"
                                className="h-7 gap-1.5 text-xs cursor-pointer"
                            >
                                {copied ? (
                                    <>
                                        <Check className="size-3 text-emerald-400" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3 text-muted-foreground" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownload}
                                size="sm"
                                className="h-7 gap-1.5 text-xs cursor-pointer"
                            >
                                <DownloadSimple className="size-3 text-muted-foreground" />
                                <span>Markdown</span>
                            </Button>
                        </div>
                    </header>

                    <div className="space-y-3 p-5 text-xs leading-relaxed text-foreground/90 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summary}
                        </ReactMarkdown>
                    </div>
                </article>
            )}
        </section>
    );
}
