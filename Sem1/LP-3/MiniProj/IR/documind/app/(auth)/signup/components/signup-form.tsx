"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import GoogleAuthButton from "@/components/auth/google-auth-button";

export default function SignupForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDevSignup, setShowDevSignup] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const supabase = createClient();

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setMessage(error.message);
                return;
            }

            if (data.session) {
                router.replace("/dashboard");
                router.refresh();
                return;
            }

            setMessage("Check your email to confirm your account.");
        } catch {
            setMessage("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <GoogleAuthButton mode="signup" />

            <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-500">
                    or
                </span>
            </div>

            {!showDevSignup ? (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setShowDevSignup(true)}
                        className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-300 hover:underline"
                    >
                        Developer sign up with email & password
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400">
                            Development sign up
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowDevSignup(false)}
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                            Hide
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none transition focus:border-violet-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="At least 8 characters"
                            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none transition focus:border-violet-400"
                        />
                    </div>

                    {message && (
                        <p role="status" className="text-sm text-violet-300">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>
            )}

            <p className="text-center text-sm text-zinc-400">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-violet-300 hover:text-violet-200"
                >
                    Log in
                </Link>
            </p>
        </div>
    );
}