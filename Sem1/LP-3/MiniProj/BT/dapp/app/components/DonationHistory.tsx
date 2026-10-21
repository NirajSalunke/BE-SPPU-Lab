

"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
} from "../../lib/charity";

declare global {
    interface Window {
        ethereum?: any;
    }
}

type Donation = {
    donor: string;
    amount: string;
    timestamp: number;
    transactionHash: string;
};

/* Inline spinner */
function Spinner({ className = "" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={`animate-spin h-4 w-4 shrink-0 ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

export default function DonationHistory() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    /* ── All event-query logic is unchanged ─────────────────────── */
    async function loadHistory() {
        setLoading(true);
        setStatus("");

        try {
            if (!window.ethereum) {
                setStatus("Please install MetaMask.");
                return;
            }

            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (Number(network.chainId) !== 31337) {
                setStatus("Please switch MetaMask to GiveChain Local.");
                return;
            }

            const charity = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                provider
            );

            const events = await charity.queryFilter(
                charity.filters.DonationReceived(),
                0,
                "latest"
            );

            const history: Donation[] = events.flatMap((event) => {
                if (!("args" in event) || !event.args) {
                    return [];
                }

                const args = event.args;

                return [{
                    donor: String(args[0]),
                    amount: formatEther(args[1]),
                    timestamp: Number(args[2]),
                    transactionHash: event.transactionHash,
                }];
            });

            setDonations(history.reverse());
            setStatus(
                history.length > 0
                    ? "Donation history loaded from the blockchain."
                    : "No donations recorded yet."
            );
        } catch (error) {
            console.error("Failed to load donation history:", error);
            setStatus(
                "Could not load history. Check that your Hardhat node is running."
            );
        } finally {
            setLoading(false);
        }
    }
    /* ─────────────────────────────────────────────────────────── */

    /* Auto-load on mount */
    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isEmpty = !loading && donations.length === 0;
    const isError = status.toLowerCase().includes("could not") ||
                    status.toLowerCase().includes("please install") ||
                    status.toLowerCase().includes("please switch");

    return (
        <div className="flex flex-col gap-5">

            {/* Header row with refresh button */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-gc-ink">Donation History</h2>
                    <p className="text-sm text-gc-muted mt-0.5">
                        Every transaction is recorded permanently on-chain.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadHistory}
                    disabled={loading}
                    aria-label="Refresh donation history"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gc-border text-sm font-medium text-gc-jade hover:bg-gc-mint hover:border-gc-sage/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shrink-0"
                >
                    {loading ? (
                        <><Spinner className="text-gc-jade" /><span>Loading…</span></>
                    ) : (
                        <>
                            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                            <span>Refresh</span>
                        </>
                    )}
                </button>
            </div>

            {/* Error message */}
            {status && isError && (
                <p role="status" className="text-sm rounded-lg px-3 py-2 bg-red-50 border border-red-200 text-gc-error">
                    {status}
                </p>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading donations">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-gc-border bg-gc-ivory px-5 py-4 animate-pulse"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="h-7 w-24 rounded bg-gc-border" />
                                <div className="h-4 w-32 rounded bg-gc-border mt-1" />
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="h-3 w-3/4 rounded bg-gc-border" />
                                <div className="h-3 w-1/2 rounded bg-gc-border" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {isEmpty && !isError && (
                <div className="rounded-xl border border-dashed border-gc-border bg-gc-ivory px-6 py-10 text-center">
                    <p className="text-gc-ink font-medium">No donations yet</p>
                    <p className="mt-1 text-sm text-gc-muted">
                        Be the first to contribute to this campaign.
                    </p>
                </div>
            )}

            {/* Donation list */}
            {!loading && donations.length > 0 && (
                <ol className="flex flex-col gap-3" aria-label="Donation list">
                    {donations.map((donation, index) => (
                        <li
                            key={donation.transactionHash}
                            className="rounded-xl border border-gc-border bg-gc-ivory px-5 py-4 hover:border-gc-sage/60 transition-colors duration-150"
                        >
                            {/* Top row: amount + date */}
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold text-gc-forest tabular-nums">
                                        {Number(donation.amount).toFixed(4)}
                                    </span>
                                    <span className="text-sm font-medium text-gc-muted">ETH</span>
                                </div>
                                <time
                                    dateTime={new Date(donation.timestamp * 1000).toISOString()}
                                    className="text-xs text-gc-muted mt-1 shrink-0"
                                >
                                    {new Date(donation.timestamp * 1000).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </time>
                            </div>

                            {/* Donor + tx hash */}
                            <dl className="mt-3 flex flex-col gap-1.5 text-xs">
                                <div className="flex gap-2">
                                    <dt className="text-gc-muted w-10 shrink-0">From</dt>
                                    <dd className="font-mono text-gc-ink truncate" title={donation.donor}>
                                        {donation.donor.slice(0, 10)}…{donation.donor.slice(-6)}
                                    </dd>
                                </div>
                                <div className="flex gap-2">
                                    <dt className="text-gc-muted w-10 shrink-0">Tx</dt>
                                    <dd
                                        className="font-mono text-gc-ink truncate"
                                        title={donation.transactionHash}
                                    >
                                        {donation.transactionHash.slice(0, 14)}…{donation.transactionHash.slice(-6)}
                                    </dd>
                                </div>
                            </dl>

                            {/* Entry number (bottom-right, subtle) */}
                            <p className="mt-2 text-right text-xs text-gc-border select-none">
                                #{donations.length - index}
                            </p>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
