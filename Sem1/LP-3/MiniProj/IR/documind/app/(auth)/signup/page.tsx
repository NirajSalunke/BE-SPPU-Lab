import Link from "next/link";
import SignupForm from "./components/signup-form";

export default function SignupPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground selection:bg-primary/20 selection:text-primary">
            {/* Ambient glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
            >
                <div className="size-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
            </div>

            <section className="w-full max-w-md">
                <div className="mb-8 text-center sm:text-left">
                    <Link
                        href="/"
                        className="inline-flex text-2xl font-bold tracking-tight text-foreground"
                    >
                        DocuMind<span className="text-primary">.</span>
                    </Link>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/75 p-7 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-9">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Create your account
                    </h1>
                    <p className="mt-1.5 mb-8 text-xs sm:text-sm text-muted-foreground">
                        Get started with your AI document assistant.
                    </p>

                    <SignupForm />
                </div>
            </section>
        </main>
    );
}