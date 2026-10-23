import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PAGES = 100;
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 250;

function splitText(text: string): string[] {
    const chunks: string[] = [];
    const normalized = text.replace(/\s+/g, " ").trim();

    let start = 0;

    while (start < normalized.length) {
        let end = Math.min(start + CHUNK_SIZE, normalized.length);

        if (end < normalized.length) {
            const boundary = normalized.lastIndexOf(" ", end);

            if (boundary > start + CHUNK_SIZE * 0.6) {
                end = boundary;
            }
        }

        const chunk = normalized.slice(start, end).trim();

        if (chunk) {
            chunks.push(chunk);
        }

        if (end >= normalized.length) {
            break;
        }

        start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }

    return chunks;
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: authData, error: authError } =
        await supabase.auth.getClaims();

    const userId = authData?.claims?.sub;

    if (authError || typeof userId !== "string") {
        return NextResponse.json(
            { error: "Please log in to process documents." },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const documentId = body?.documentId;

    if (
        typeof documentId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            documentId
        )
    ) {
        return NextResponse.json(
            { error: "A valid document ID is required." },
            { status: 400 }
        );
    }

    const { data: document, error: documentError } = await supabase
        .from("documents")
        .select("id, user_id, storage_path, file_size, status")
        .eq("id", documentId)
        .eq("user_id", userId)
        .single();

    if (documentError || !document) {
        return NextResponse.json(
            { error: "Document not found or access denied." },
            { status: 404 }
        );
    }

    if (document.status === "ready") {
        return NextResponse.json(
            { error: "This document has already been processed." },
            { status: 409 }
        );
    }

    if (
        !document.storage_path.startsWith(`${userId}/`) ||
        document.file_size <= 0 ||
        document.file_size > MAX_FILE_SIZE
    ) {
        return NextResponse.json(
            { error: "The document path or file size is invalid." },
            { status: 400 }
        );
    }

    try {
        await supabase
            .from("documents")
            .update({
                status: "processing",
                updated_at: new Date().toISOString(),
            })
            .eq("id", documentId)
            .eq("user_id", userId);

        const { data: file, error: downloadError } = await supabase.storage
            .from("documents")
            .download(document.storage_path);

        if (downloadError || !file) {
            throw new Error("Could not download the PDF from private storage.");
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error("The PDF exceeds the 20 MB limit.");
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const signature = String.fromCharCode(...bytes.slice(0, 5));

        if (signature !== "%PDF-") {
            throw new Error("The uploaded file is not a valid PDF.");
        }

        const pdf = await getDocumentProxy(bytes);

        if (pdf.numPages > MAX_PAGES) {
            throw new Error("PDFs with more than 100 pages aren't supported yet.");
        }

        const { totalPages, text } = await extractText(pdf);

        const pageTexts = Array.isArray(text) ? text : [text];

        const chunks: Array<{
            document_id: string;
            user_id: string;
            chunk_index: number;
            page_number: number;
            content: string;
        }> = [];

        for (const [pageIndex, pageText] of pageTexts.entries()) {
            for (const content of splitText(pageText)) {
                chunks.push({
                    document_id: documentId,
                    user_id: userId,
                    chunk_index: chunks.length,
                    page_number: pageIndex + 1,
                    content,
                });
            }
        }

        if (chunks.length === 0) {
            throw new Error(
                "No selectable text was found. Scanned PDFs need OCR, which we'll add later."
            );
        }

        const { error: deleteError } = await supabase
            .from("document_chunks")
            .delete()
            .eq("document_id", documentId)
            .eq("user_id", userId);

        if (deleteError) {
            throw new Error("Could not prepare the document text for saving.");
        }

        for (let i = 0; i < chunks.length; i += 100) {
            const batch = chunks.slice(i, i + 100);

            const { error: insertError } = await supabase
                .from("document_chunks")
                .insert(batch);

            if (insertError) {
                throw new Error("Could not save the extracted text.");
            }
        }

        const { error: updateError } = await supabase
            .from("documents")
            .update({
                status: "ready",
                page_count: totalPages,
                updated_at: new Date().toISOString(),
            })
            .eq("id", documentId)
            .eq("user_id", userId);

        if (updateError) {
            throw new Error("Text was extracted, but the document status could not be updated.");
        }

        return NextResponse.json({
            success: true,
            documentId,
            pageCount: totalPages,
            chunksCreated: chunks.length,
        });
    } catch (error) {
        await supabase
            .from("documents")
            .update({
                status: "failed",
                updated_at: new Date().toISOString(),
            })
            .eq("id", documentId)
            .eq("user_id", userId);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "An error occurred while processing the PDF.",
            },
            { status: 422 }
        );
    }
}
