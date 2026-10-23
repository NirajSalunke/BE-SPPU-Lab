"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import DocumentSummarizer from "./document-summarizer";
import {
    FilePdf,
    CloudArrowUp,
    CheckCircle,
    WarningCircle,
    X,
    Sparkle,
    Spinner,
    ArrowRight,
    LockSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type UploadResult = {
    documentId: string;
    pageCount: number;
    chunksCreated: number;
};

type ProcessResponse = {
    error?: string;
    pageCount?: number;
    chunksCreated?: number;
};

type DocumentUploaderProps = {
    onUploadComplete?: () => void;
};

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stageText, setStageText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<UploadResult | null>(null);

    function validateAndSetFile(candidate: File) {
        setError(null);
        setResult(null);

        if (!candidate.name.toLowerCase().endsWith(".pdf")) {
            setError("Only PDF files are supported. Please select a valid .pdf document.");
            return;
        }

        if (candidate.size === 0) {
            setError("The selected file is empty (0 bytes). Please select a valid document.");
            return;
        }

        if (candidate.size > MAX_FILE_SIZE) {
            setError("The file exceeds the 20 MB limit. Please select a smaller PDF.");
            return;
        }

        setFile(candidate);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const candidate = event.target.files?.[0];
        if (candidate) {
            validateAndSetFile(candidate);
        }
    }

    function handleDrag(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === "dragenter" || event.type === "dragover") {
            setDragActive(true);
        } else if (event.type === "dragleave") {
            setDragActive(false);
        }
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);

        const dropped = event.dataTransfer.files?.[0];
        if (dropped) {
            validateAndSetFile(dropped);
        }
    }

    function removeSelectedFile() {
        setFile(null);
        setError(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            setError("Please choose a PDF document first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setProgress(15);
        setStageText("Checking authenticated session...");

        const supabase = createClient();

        let storagePath: string | null = null;
        let documentId: string | null = null;
        let userId: string | null = null;
        let uploaded = false;
        let documentSaved = false;

        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();

            if (authError || !authData.user) {
                throw new Error("Your session expired. Please sign in again.");
            }

            userId = authData.user.id;
            documentId = crypto.randomUUID();

            const safeFilename =
                file.name.replace(/[^\w.-]+/g, "_").slice(-120) || "document.pdf";

            storagePath = `${userId}/${documentId}/${safeFilename}`;

            setProgress(40);
            setStageText("Uploading PDF to private encrypted storage...");

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(storagePath, file, {
                    contentType: "application/pdf",
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            uploaded = true;

            setProgress(65);
            setStageText("Saving document record in database...");

            const { error: insertError } = await supabase.from("documents").insert({
                id: documentId,
                user_id: userId,
                original_filename: file.name,
                storage_path: storagePath,
                mime_type: "application/pdf",
                file_size: file.size,
                status: "uploaded",
            });

            if (insertError) {
                throw new Error(insertError.message);
            }

            documentSaved = true;

            setProgress(85);
            setStageText("Extracting selectable text & chunking with page indices...");

            const response = await fetch("/api/documents/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ documentId }),
            });

            const data = (await response.json()) as ProcessResponse;

            if (!response.ok) {
                throw new Error(data.error || "PDF extraction failed. Ensure the PDF contains selectable text.");
            }

            if (typeof data.pageCount !== "number" || typeof data.chunksCreated !== "number") {
                throw new Error("Invalid response received from text processing service.");
            }

            setProgress(100);
            setStageText("Document ready! Loading workspace...");

            setResult({
                documentId,
                pageCount: data.pageCount,
                chunksCreated: data.chunksCreated,
            });

            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            if (onUploadComplete) {
                setTimeout(() => onUploadComplete(), 1500);
            }
        } catch (err) {
            // Clean up uncommitted storage / record
            if (!documentSaved) {
                if (uploaded && storagePath) {
                    try {
                        await supabase.storage.from("documents").remove([storagePath]);
                    } catch {
                        // ignore cleanup errors
                    }
                }

                if (documentId && userId) {
                    try {
                        await supabase
                            .from("documents")
                            .delete()
                            .eq("id", documentId)
                            .eq("user_id", userId);
                    } catch {
                        // ignore cleanup errors
                    }
                }
            }

            setError(err instanceof Error ? err.message : "An unexpected error occurred during upload.");
            setProgress(0);
            setStageText("");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    <Sparkle className="size-3.5" />
                    <span>AI Document Ingestion</span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Upload a PDF document
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Upload your document to parse page-aware text, unlock multi-length summaries, and chat with grounded citations.
                </p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                {/* Hidden native input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="sr-only"
                    id="documind-pdf-input"
                />

                {!file ? (
                    /* Dropzone when no file selected */
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        className={cn(
                            "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
                            dragActive
                                ? "border-violet-400 bg-violet-500/10 shadow-lg shadow-violet-500/10 scale-[1.01]"
                                : "border-border/80 bg-card/60 hover:border-violet-500/50 hover:bg-card hover:shadow-md"
                        )}
                    >
                        {/* Glow and icon */}
                        <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/20 to-violet-500/5 text-violet-300 shadow-inner transition-transform group-hover:scale-105">
                            <CloudArrowUp className="size-8 transition-transform group-hover:-translate-y-0.5" />
                        </div>

                        <p className="text-base font-semibold text-foreground">
                            Drop your PDF here, or{" "}
                            <span className="text-violet-400 underline underline-offset-4 group-hover:text-violet-300">
                                browse from computer
                            </span>
                        </p>

                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Supports text-based PDF documents up to 20 MB
                        </p>

                        {/* Security badges */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground/80">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1">
                                <LockSimple className="size-3.5 text-violet-400" />
                                Private Storage
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1">
                                <FilePdf className="size-3.5 text-red-400" />
                                Page-Aware
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1">
                                <CheckCircle className="size-3.5 text-emerald-400" />
                                Instant Parsing
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Selected File Preview Card */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 shadow-sm">
                                    <FilePdf className="size-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {file.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatBytes(file.size)}</span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 text-emerald-400">
                                            <span className="size-1.5 rounded-full bg-emerald-400" />
                                            Ready to extract
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={removeSelectedFile}
                                disabled={loading}
                                aria-label="Remove selected PDF"
                                className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Submit Action */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 gap-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-all cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Spinner className="size-4 animate-spin" />
                                    <span>Processing PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkle className="size-4" />
                                    <span>Upload and Extract Text</span>
                                    <ArrowRight className="size-4 ml-auto" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>

            {/* Error Message */}
            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
                >
                    <WarningCircle className="size-5 shrink-0 text-red-400 mt-0.5" />
                    <p className="flex-1">{error}</p>
                </div>
            )}

            {/* Upload & Processing Progress Bar */}
            {loading && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-foreground">
                            <Spinner className="size-3.5 animate-spin text-violet-400" />
                            {stageText}
                        </span>
                        <span className="text-violet-400 font-mono">{progress}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300 ease-out rounded-full shadow-sm"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Success Result */}
            {result && (
                <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-200 shadow-sm">
                        <CheckCircle className="size-5 shrink-0 text-emerald-400 mt-0.5" />
                        <div className="flex-1 space-y-1">
                            <p className="font-semibold text-emerald-300">
                                Document successfully processed
                            </p>
                            <p className="text-xs text-emerald-200/80">
                                Extracted {result.pageCount} pages and generated {result.chunksCreated} page-aware text chunks.
                            </p>
                            <p className="text-xs text-muted-foreground pt-1">
                                Switching to your document library...
                            </p>
                        </div>
                    </div>

                    <DocumentSummarizer documentId={result.documentId} />
                </div>
            )}
        </div>
    );
}
