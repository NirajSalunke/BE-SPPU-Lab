"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleLogout() {
        setLoading(true);
        setMessage("");

        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        router.replace("/login");
        router.refresh();
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:opacity-60"
            >
                {loading ? "Logging out..." : "Log out"}
            </button>

            {message && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                    {message}
                </p>
            )}
        </div>
    );
}