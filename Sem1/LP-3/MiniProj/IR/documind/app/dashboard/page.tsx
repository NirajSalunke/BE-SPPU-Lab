
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import DashboardShell from "./components/dashboard-shell";

export const metadata: Metadata = {
    title: "Dashboard",
};

function DashboardLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <p className="text-sm text-muted-foreground">
                Loading your workspace…
            </p>
        </div>
    );
}

async function DashboardContent() {
    await connection();

    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.getUser();

    if (error || !authData?.user) {
        redirect("/login");
    }

    const user = authData.user;
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

    let displayName = "";
    if (typeof metadata.full_name === "string" && metadata.full_name.trim()) {
        displayName = metadata.full_name.trim();
    } else if (typeof metadata.name === "string" && metadata.name.trim()) {
        displayName = metadata.name.trim();
    } else if (typeof metadata.user_name === "string" && metadata.user_name.trim()) {
        displayName = metadata.user_name.trim();
    }

    if (!displayName && user.email) {
        const cleanName = user.email
            .split("@")[0]
            .replace(/[0-9]+/g, "")
            .replace(/[._-]+/g, " ")
            .trim();

        if (cleanName) {
            displayName = cleanName
                .split(" ")
                .filter(Boolean)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
        }
    }

    const email = user.email ?? "Signed-in user";
    const avatarUrl =
        typeof metadata.avatar_url === "string"
            ? metadata.avatar_url
            : typeof metadata.picture === "string"
            ? metadata.picture
            : null;

    const userData = {
        id: user.id,
        name: displayName || "DocuMind User",
        email,
        avatarUrl,
        provider: (user.app_metadata?.provider as string) ?? "email",
        createdAt: user.created_at ?? "",
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <DashboardShell user={userData} email={email} />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </Suspense>
    );
}
