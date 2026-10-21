"use client";
import { useState } from "react";
import { BrowserProvider } from "ethers";

declare global {
    interface Window {
        ethereum?: any;
    }
}

/* Classify the status string so we can colour it correctly. */
function statusVariant(msg: string): "success" | "error" | "info" | null {
    if (!msg) return null;
    const lower = msg.toLowerCase();
    if (lower.includes("successfully") || lower.includes("connected")) return "success";
    if (
        lower.includes("failed") ||
        lower.includes("wrong") ||
        lower.includes("not detected") ||
        lower.includes("please install")
    )
        return "error";
    return "info";
}

export default function ConnectWallet() {
    const [account, setAccount] = useState("");
    const [status, setStatus] = useState("");

    /* ── All logic below is unchanged ──────────────────────────── */
    async function connectWallet() {
        setStatus("");

        if (!window.ethereum) {
            setStatus("MetaMask was not detected. Please install or unlock it.");
            return;
        }

        try {
            await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (network.chainId !== BigInt(31337)) {
                setAccount("");
                setStatus(
                    "Wrong network. Please switch MetaMask to GiveChain Local."
                );
                return;
            }

            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setAccount(address);
            setStatus("Connected successfully to GiveChain Local!");
        } catch (error) {
            console.error("Wallet connection failed:", error);
            setStatus("Connection failed. Please try again.");
        }
    }
    /* ─────────────────────────────────────────────────────────── */

    const variant = statusVariant(status);

    const statusClasses: Record<NonNullable<typeof variant>, string> = {
        success: "bg-emerald-50 border border-emerald-200 text-gc-jade",
        error:   "bg-red-50 border border-red-200 text-gc-error",
        info:    "bg-blue-50 border border-blue-200 text-blue-700",
    };

    return (
        <div className="flex flex-col items-start gap-3">

            {/* Connected pill or connect button */}
            {account ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gc-border bg-gc-ivory">
                    <span className="h-2 w-2 rounded-full bg-gc-jade shrink-0" aria-hidden="true" />
                    <span className="font-mono text-sm text-gc-ink">
                        {account.slice(0, 6)}&hellip;{account.slice(-4)}
                    </span>
                    <span className="ml-1 text-xs text-gc-muted">(connected)</span>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={connectWallet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gc-forest text-white text-sm font-semibold hover:bg-gc-jade active:opacity-90 transition-colors duration-150 cursor-pointer"
                >
                    {/* MetaMask fox icon (inline SVG, no dependency) */}
                    <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 35 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                    >
                        <path d="M32.958.667 19.81 10.173l2.4-5.668L32.958.667Z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.042.667 15.074 10.26l-2.283-5.755L2.042.667Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M28.23 23.533l-3.49 5.338 7.47 2.057 2.143-7.274-6.123-.121ZM1.664 23.654l2.13 7.274 7.457-2.057-3.476-5.338-6.111.121Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m11.088 14.49-2.08 3.143 7.408.338-.25-7.974-5.078 4.493ZM23.912 14.49l-5.145-4.58-.17 8.06 7.408-.337-2.093-3.143ZM11.251 28.871l4.47-2.163-3.854-3.01-.616 5.173ZM19.279 26.708l4.457 2.163-.603-5.172-3.854 3.009Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m23.736 28.871-4.457-2.163.357 2.907-.04 1.224 4.14-1.968ZM11.251 28.871l4.153 1.968-.027-1.224.344-2.907-4.47 2.163Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m15.457 21.772-3.71-1.09 2.62-1.2 1.09 2.29ZM19.543 21.772l1.09-2.29 2.633 1.2-3.723 1.09Z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m11.251 28.871.63-5.338-4.107.121 3.477 5.217ZM23.12 23.533l.617 5.338 3.476-5.217-4.093-.121ZM26.005 17.633l-7.408.337.69 3.802 1.09-2.29 2.633 1.2 3.995-3.049ZM11.747 20.682l2.62-1.2 1.077 2.29.703-3.802-7.408-.337 3.008 3.049Z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m9.008 17.633 3.107 6.059-.104-3.01-3.003-3.049ZM22.997 20.682l-.117 3.01 3.12-6.059-3.003 3.049ZM16.415 17.97l-.703 3.802.876 4.52.197-5.958-.37-2.364ZM18.585 17.97l-.357 2.35.184 5.972.877-4.52-.704-3.802Z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m19.543 21.772-.877 4.52.63.432 3.854-3.01.117-3.01-3.724 1.068ZM11.747 20.682l.104 3.01 3.854 3.01.63-.433-.876-4.52-3.712-1.067Z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m19.596 30.839.04-1.224-.33-.285h-4.9l-.316.285.027 1.224-4.153-1.968 1.454 1.19 2.947 2.044h5.04l2.96-2.044 1.44-1.19-4.21 1.968Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m19.279 26.708-.63-.432h-3.7l-.63.432-.344 2.907.316-.285h4.9l.33.285-.243-2.907Z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M33.517 10.76 34.667.667l-1.71 10.093-9.146 8.21 7.707-8.21ZM.333.667l1.163 10.093L.333.667Zm10.876 17.966-7.706 8.21L.333.667l10.876 17.966Z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Connect MetaMask
                </button>
            )}

            {/* Status message */}
            {status && variant && (
                <p
                    role="status"
                    className={`text-sm rounded-lg px-3 py-2 leading-snug ${statusClasses[variant]}`}
                >
                    {status}
                </p>
            )}
        </div>
    );
}
