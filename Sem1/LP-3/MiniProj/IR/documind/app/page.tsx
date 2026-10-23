import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
    Sparkle,
    ChatCircle,
    ShieldCheck,
    ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

async function AuthCheck() {
    await connection();
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims?.sub) {
        redirect("/dashboard");
    }

    return null;
}

export default function Home() {
    return (
        <>
            <Suspense fallback={null}>
                <AuthCheck />
            </Suspense>
            <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground selection:bg-primary/20 selection:text-primary">
                {/* Subtle ambient lighting */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
                >
                    <div className="size-[500px] rounded-full bg-violet-600/15 blur-[140px]" />
                </div>

                <div className="w-full max-w-3xl text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary shadow-xs">
                        <Sparkle className="size-3.5" weight="fill" />
                        <span>AI-Powered Document Intelligence</span>
                    </div>

                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
                        DocuMind<span className="text-primary">.</span>
                    </h1>

                    <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto">
                        Upload private PDFs, generate instant multi-depth summaries, and converse with your documents using grounded AI.
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-indigo-500 active:scale-98"
                        >
                            <span>Get Started</span>
                            <ArrowRight className="size-4" weight="bold" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card/60 px-6 text-sm font-medium text-muted-foreground backdrop-blur-sm transition hover:border-border hover:bg-card hover:text-foreground active:scale-98"
                        >
                            Sign in
                        </Link>
                    </div>

                    {/* Features grid */}
                    <dl className="mt-16 grid gap-4 text-left sm:grid-cols-3">
                        {[
                            {
                                icon: ShieldCheck,
                                term: "Private & Secure",
                                detail:
                                    "Your documents are stored privately in user-scoped storage. Only you have access.",
                            },
                            {
                                icon: Sparkle,
                                term: "Multi-depth Summaries",
                                detail:
                                    "Generate short briefs, medium executive overviews, or deep detailed analyses on demand.",
                            },
                            {
                                icon: ChatCircle,
                                term: "Grounded Chat",
                                detail:
                                    "Ask complex questions with answers streamed in real-time and cited back to specific PDF pages.",
                            },
                        ].map(({ icon: Icon, term, detail }) => (
                            <div
                                key={term}
                                className="group relative rounded-2xl border border-border/70 bg-card/60 p-5.5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/90"
                            >
                                <div className="mb-3.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                    <Icon className="size-5" weight="duotone" />
                                </div>
                                <dt className="text-sm font-semibold text-foreground">
                                    {term}
                                </dt>
                                <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                    {detail}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </main>
        </>
    );
}
