"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
    mode?: "signin" | "signup";
    className?: string;
};

export default function GoogleAuthButton({
    mode = "signin",
    className,
}: GoogleAuthButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleGoogleSignIn() {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
            }
        } catch {
            setError("Failed to initiate Google sign-in. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="w-full space-y-2">
            <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={loading}
                className={
                    className ??
                    "inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-muted/60 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted hover:border-border active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                }
            >
                {loading ? (
                    <svg
                        className="size-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="size-5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.2C.7 9.6 0 12.2 0 15s.7 5.4 1.9 7.8l3.7-2.9z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.3 7.5 23 12 23z"
                        />
                    </svg>
                )}
                <span>
                    {loading
                        ? "Connecting to Google..."
                        : mode === "signup"
                        ? "Sign up with Google"
                        : "Continue with Google"}
                </span>
            </button>

            {error && (
                <p role="alert" className="text-center text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
