"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    FilePdf,
    HouseSimple,
    CloudArrowUp,
    Cpu,
    SignOut,
    Spinner,
    CaretDown,
    X,
    Copy,
    Check,
    User,
    LockSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import DashboardViews from "./dashboard-views";

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    provider?: string;
    createdAt?: string;
};

type DashboardView = "upload" | "library";

type AppSidebarProps = {
    user: UserProfile;
    currentView: DashboardView;
    onViewChange: (view: DashboardView) => void;
    onOpenAccountModal: () => void;
};

function AppSidebar({
    user,
    currentView,
    onViewChange,
    onOpenAccountModal,
}: AppSidebarProps) {
    const initials = user.name
        ? user.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")
        : user.email.slice(0, 2).toUpperCase();

    const mainNav = [
        { id: "upload" as const, label: "Upload PDF", icon: CloudArrowUp },
        { id: "library" as const, label: "My Documents", icon: HouseSimple },
    ];

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
            <SidebarHeader className="p-4 border-b border-sidebar-border/60">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
                        <FilePdf className="size-5" weight="duotone" />
                    </div>
                    <div>
                        <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                            DocuMind<span className="text-primary">.</span>
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium">
                            AI Document Assistant
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                {/* Main Workspace Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-2">
                        Workspace
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="mt-1">
                        <SidebarMenu>
                            {mainNav.map(({ id, label, icon: Icon }) => (
                                <SidebarMenuItem key={id}>
                                    <SidebarMenuButton
                                        isActive={currentView === id}
                                        onClick={() => onViewChange(id)}
                                        className={cn(
                                            "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                                            currentView === id
                                                ? "bg-primary/15 text-primary font-bold shadow-xs border border-primary/25"
                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <Icon className="size-4" weight={currentView === id ? "fill" : "regular"} />
                                        <span>{label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Profile pill shifted down into sidebar footer */}
            <SidebarFooter className="p-3 border-t border-sidebar-border/60">
                <button
                    type="button"
                    onClick={onOpenAccountModal}
                    aria-label="User account details"
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card/75 py-2 px-3 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-muted active:scale-[0.99] cursor-pointer shadow-xs"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-6 shrink-0 ring-1 ring-border">
                            {user.avatarUrl && (
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                            )}
                            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-semibold text-xs text-sidebar-foreground">
                            {user.name.split(" ")[0]}
                        </span>
                    </div>
                    <CaretDown className="size-3 text-muted-foreground shrink-0" />
                </button>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}

type DashboardShellProps = {
    user?: UserProfile;
    email?: string;
    children?: React.ReactNode;
};

export default function DashboardShell({
    user: propUser,
    email: propEmail,
    children,
}: DashboardShellProps) {
    const router = useRouter();
    const [currentView, setCurrentView] = useState<DashboardView>("upload");
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    // Build normalized user profile
    const user: UserProfile = propUser ?? {
        id: "usr_active",
        name: propEmail ? propEmail.split("@")[0] : "DocuMind User",
        email: propEmail ?? "user@example.com",
        avatarUrl: null,
        provider: "email",
    };

    const initials = user.name
        ? user.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")
        : user.email.slice(0, 2).toUpperCase();

    const viewLabels: Record<DashboardView, string> = {
        upload: "Upload PDF",
        library: "My Documents",
    };

    async function handleSignOut() {
        setSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
    }

    async function handleCopyId() {
        try {
            await navigator.clipboard.writeText(user.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } catch {
            // ignore
        }
    }

    // Escape listener for Account Modal
    useEffect(() => {
        if (!showAccountModal) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setShowAccountModal(false);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showAccountModal]);

    return (
        <SidebarProvider>
            <AppSidebar
                user={user}
                currentView={currentView}
                onViewChange={setCurrentView}
                onOpenAccountModal={() => setShowAccountModal(true)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header */}
                <header
                    className={cn(
                        "flex h-14 shrink-0 items-center justify-between border-b border-border/80",
                        "bg-background/80 backdrop-blur-md px-4 sm:px-6 z-10"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                        <Separator orientation="vertical" className="h-4 bg-border/60" />
                        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                DocuMind
                            </span>
                            <span className="text-xs text-muted-foreground/60">/</span>
                            <span className="text-xs font-semibold text-foreground">
                                {viewLabels[currentView]}
                            </span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View switcher buttons */}
                        <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-1">
                            <button
                                type="button"
                                onClick={() => setCurrentView("upload")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer",
                                    currentView === "upload"
                                        ? "bg-background text-foreground shadow-xs border border-border/60"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <CloudArrowUp className="size-3.5" />
                                <span>Upload</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentView("library")}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer",
                                    currentView === "library"
                                        ? "bg-background text-foreground shadow-xs border border-border/60"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <HouseSimple className="size-3.5" />
                                <span>Documents</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-background/50">
                    {children ?? (
                        <DashboardViews
                            view={currentView}
                            onViewChange={setCurrentView}
                        />
                    )}
                </main>
            </div>

            {/* ACCOUNT DETAILS MODAL */}
            {showAccountModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="account-modal-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200"
                >
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-2xl shadow-black/40">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/60 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                    <User className="size-4" weight="bold" />
                                </div>
                                <h3
                                    id="account-modal-title"
                                    className="text-base font-bold text-foreground"
                                >
                                    Account Profile
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAccountModal(false)}
                                aria-label="Close"
                                className="flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer active:scale-95"
                            >
                                <X className="size-4" weight="bold" />
                            </button>
                        </div>

                        {/* User Profile Card */}
                        <div className="mt-5 flex items-center gap-4 rounded-xl border border-border/70 bg-muted/30 p-4">
                            <Avatar className="size-14 ring-2 ring-primary/20">
                                {user.avatarUrl && (
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-inner">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="truncate text-base font-bold text-foreground">
                                        {user.name}
                                    </h4>
                                    <span className="size-2 rounded-full bg-emerald-400" title="Active session" />
                                </div>
                                <p className="truncate text-xs text-muted-foreground mt-0.5">
                                    {user.email}
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                    <span>
                                        {user.provider === "google"
                                            ? "Google OAuth SSO"
                                            : "Verified Account"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Account & Workspace Metadata */}
                        <div className="mt-5 space-y-3">
                            <div className="rounded-xl border border-border/60 bg-card p-3 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>User ID</span>
                                    <button
                                        type="button"
                                        onClick={() => void handleCopyId()}
                                        className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:text-primary cursor-pointer"
                                        title="Click to copy ID"
                                    >
                                        <span>{user.id.slice(0, 14)}...</span>
                                        {copiedId ? (
                                            <Check className="size-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </button>
                                </div>

                                <Separator className="bg-border/40" />

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <LockSimple className="size-3 text-primary" />
                                        Storage Bucket
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        documents (Private RLS)
                                    </span>
                                </div>

                                <Separator className="bg-border/40" />

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Cpu className="size-3 text-primary" />
                                        AI Engine
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        Groq OSS-20B
                                    </span>
                                </div>

                                <Separator className="bg-border/40" />

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Plan Status</span>
                                    <span className="font-semibold text-emerald-400">
                                        Active Workspace
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                            <button
                                type="button"
                                onClick={() => setShowAccountModal(false)}
                                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleSignOut()}
                                disabled={signingOut}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive-foreground transition hover:bg-destructive/20 active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                                {signingOut ? (
                                    <>
                                        <Spinner className="size-3.5 animate-spin" />
                                        <span>Signing out...</span>
                                    </>
                                ) : (
                                    <>
                                        <SignOut className="size-3.5" weight="bold" />
                                        <span>Sign Out</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarProvider>
    );
}
