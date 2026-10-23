"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import GoogleAuthButton from "@/components/auth/google-auth-button";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDevLogin, setShowDevLogin] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setMessage(error.message);
                return;
            }

            router.replace("/dashboard");
            router.refresh();
        } catch {
            setMessage("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <GoogleAuthButton mode="signin" />

            <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-500">
                    or
                </span>
            </div>

            {!showDevLogin ? (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setShowDevLogin(true)}
                        className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-300 hover:underline"
                    >
                        Developer sign in with email & password
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400">
                            Development sign in
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowDevLogin(false)}
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
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-violet-400"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-violet-400"
                />
            </div>

            {message && (
                <p role="alert" className="text-sm text-red-400">
                    {message}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
                {loading ? "Logging in..." : "Log in"}
            </button>
                </form>
            )}

            <p className="text-center text-sm text-zinc-400">
                New to DocuMind?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-violet-300 hover:text-violet-200"
                >
                    Create an account
                </Link>
            </p>
        </div>
    );
}