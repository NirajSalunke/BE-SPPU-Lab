
"use client";

import DocumentUploader from "./document-uploader";
import DocumentLibrary from "./document-library";

type DashboardView = "upload" | "library";

type DashboardViewsProps = {
    view: DashboardView;
    onViewChange: (view: DashboardView) => void;
};

export default function DashboardViews({ view, onViewChange }: DashboardViewsProps) {
    return (
        <div className="h-full">
            {view === "upload" ? (
                <div className="mx-auto max-w-2xl px-6 py-10">
                    <DocumentUploader onUploadComplete={() => onViewChange("library")} />
                </div>
            ) : (
                <div className="px-6 py-8">
                    <DocumentLibrary />
                </div>
            )}
        </div>
    );
}
