"use client";

import { useState } from "react";
import {
    BrowserProvider,
    Contract,
    parseEther,
} from "ethers";
import {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
} from "../../lib/charity";

declare global {
    interface Window {
        ethereum?: any;
    }
}

/* Inline spinner */
function Spinner() {
    return (
        <svg
            aria-hidden="true"
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

/* Classify status for colour coding */
type Phase = "idle" | "confirm" | "pending" | "success" | "error";

function getPhase(msg: string, isLoading: boolean): Phase {
    if (!msg) return "idle";
    const m = msg.toLowerCase();
    if (m.includes("confirm")) return "confirm";
    if (m.includes("waiting") || m.includes("submitted")) return "pending";
    if (m.includes("successful")) return "success";
    if (m.includes("failed") || m.includes("rejected") || m.includes("valid") ||
        m.includes("install") || m.includes("switch") || m.includes("greater"))
        return "error";
    return isLoading ? "pending" : "idle";
}

const PRESETS = ["0.01", "0.05", "0.1"] as const;

export default function DonationForm() {
    const [amount, setAmount] = useState("0.01");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    /* ── All donate() logic is completely unchanged ─────────────── */
    async function donate() {
        setStatus("");

        if (!window.ethereum) {
            setStatus("Please install MetaMask.");
            return;
        }

        let donationAmount: bigint;

        try {
            donationAmount = parseEther(amount);

            if (donationAmount <= BigInt(0)) {
                setStatus("Donation must be greater than zero.");
                return;
            }
        } catch {
            setStatus("Enter a valid ETH amount.");
            return;
        }

        setLoading(true);

        try {
            await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (Number(network.chainId) !== 31337) {
                setStatus("Please switch to GiveChain Local.");
                return;
            }

            const signer = await provider.getSigner();

            const charity = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            setStatus("Please confirm the donation in MetaMask...");

            const transaction = await charity.donate({
                value: donationAmount,
            });

            setStatus("Transaction submitted. Waiting for confirmation...");

            await transaction.wait();

            setStatus(
                `Donation successful! Transaction: ${transaction.hash}`
            );
        } catch (error) {
            console.error("Donation failed:", error);
            setStatus(
                "Donation failed or was rejected. Check MetaMask and try again."
            );
        } finally {
            setLoading(false);
        }
    }
    /* ─────────────────────────────────────────────────────────── */

    const phase = getPhase(status, loading);

    /* Extract tx hash from success message */
    const txHash = phase === "success"
        ? status.split("Transaction: ")[1] ?? ""
        : "";

    function copyHash() {
        if (!txHash) return;
        navigator.clipboard.writeText(txHash).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const phaseStyles: Record<Phase, string> = {
        idle:    "",
        confirm: "bg-amber-50 border border-amber-200 text-amber-800",
        pending: "bg-blue-50 border border-blue-200 text-blue-800",
        success: "bg-emerald-50 border border-emerald-200 text-gc-jade",
        error:   "bg-red-50 border border-red-200 text-gc-error",
    };

    return (
        <div className="flex flex-col gap-5">

            {/* Amount label + input */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="donation-amount"
                    className="text-sm font-medium text-gc-ink"
                >
                    Amount
                </label>

                {/* Preset chips */}
                <div className="flex gap-2 flex-wrap" role="group" aria-label="Preset donation amounts">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset)}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                amount === preset
                                    ? "bg-gc-forest text-white border-gc-forest"
                                    : "bg-gc-ivory text-gc-jade border-gc-sage/50 hover:bg-gc-mint hover:border-gc-sage"
                            }`}
                        >
                            {preset} ETH
                        </button>
                    ))}
                </div>

                {/* ETH input */}
                <div className="relative">
                    <input
                        id="donation-amount"
                        type="number"
                        min="0.000000000000000001"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={loading}
                        aria-label="Donation amount in ETH"
                        className="w-full rounded-lg border border-gc-border bg-gc-ivory px-4 py-2.5 pr-14 text-sm text-gc-ink placeholder:text-gc-muted focus:border-gc-jade focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gc-muted select-none">
                        ETH
                    </span>
                </div>

                <p className="text-xs text-gc-muted">
                    Uses test ETH on the local Hardhat network.
                </p>
            </div>

            {/* Donate button */}
            <button
                type="button"
                onClick={donate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg bg-gc-forest text-white text-sm font-semibold hover:bg-gc-jade active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
            >
                {loading ? (
                    <><Spinner />Processing…</>
                ) : (
                    <>
                        {/* ETH diamond glyph */}
                        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.998 1L4 13.25l7.998 4.75L20 13.25 11.998 1zm0 17.5L4 14.25 11.998 23 20 14.25l-8.002 4.25z" />
                        </svg>
                        Donate {amount} ETH
                    </>
                )}
            </button>

            {/* Status / feedback */}
            {status && phase !== "idle" && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-lg px-3 py-2.5 text-sm leading-snug ${phaseStyles[phase]}`}
                >
                    {phase === "success" && txHash ? (
                        <div className="flex flex-col gap-1.5">
                            <p className="font-semibold">Donation confirmed ✓</p>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs break-all">
                                    {txHash.slice(0, 18)}…{txHash.slice(-6)}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyHash}
                                    aria-label="Copy transaction hash"
                                    className="shrink-0 px-2 py-0.5 rounded border border-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors duration-150 cursor-pointer"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>{status}</p>
                    )}
                </div>
            )}
        </div>
    );
}
