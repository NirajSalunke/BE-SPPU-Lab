
"use client";

import { useState } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../lib/charity";

declare global {
    interface Window {
        ethereum?: any;
    }
}

/* Inline spinner — no library needed */
function Spinner() {
    return (
        <svg
            aria-hidden="true"
            className="animate-spin h-4 w-4 text-gc-jade shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}

export default function CampaignInfo() {
    const [campaignName, setCampaignName] = useState("");
    const [totalDonated, setTotalDonated] = useState("");
    const [balance, setBalance] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    /* ── All contract-read logic is unchanged ──────────────────── */
    async function loadCampaign() {
        setStatus("");
        setLoading(true);

        if (!window.ethereum) {
            setStatus("Please install MetaMask.");
            setLoading(false);
            return;
        }

        try {
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (Number(network.chainId) !== 31337) {
                setStatus("Please switch MetaMask to GiveChain Local.");
                setLoading(false);
                return;
            }

            const charity = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                provider
            );

            const name = await charity.campaignName();
            const donated = await charity.totalDonated();
            const currentBalance = await charity.getBalance();

            setCampaignName(name);
            setTotalDonated(formatEther(donated));
            setBalance(formatEther(currentBalance));
            setStatus("Campaign data loaded from the blockchain!");
        } catch (error) {
            console.error("Failed to load campaign:", error);
            setStatus(
                "Could not load campaign data. Check that your Hardhat node is running and the contract is deployed."
            );
        } finally {
            setLoading(false);
        }
    }
    /* ─────────────────────────────────────────────────────────── */

    const isError = status.toLowerCase().includes("could not") ||
                    status.toLowerCase().includes("please install") ||
                    status.toLowerCase().includes("please switch");

    return (
        <div className="flex flex-col gap-5">

            {/* Campaign name + refresh button */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    {campaignName ? (
                        <h2 className="text-xl font-semibold text-gc-ink">{campaignName}</h2>
                    ) : (
                        <h2 className="text-xl font-semibold text-gc-ink">Charity Campaign</h2>
                    )}
                    <p className="text-sm text-gc-muted mt-0.5">
                        {campaignName
                            ? `Contract: ${CONTRACT_ADDRESS.slice(0, 8)}…`
                            : "Load data from the blockchain to view details."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadCampaign}
                    disabled={loading}
                    aria-label={campaignName ? "Refresh campaign data" : "Load campaign data"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gc-border text-sm font-medium text-gc-jade hover:bg-gc-mint hover:border-gc-sage/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer shrink-0"
                >
                    {loading ? (
                        <><Spinner /><span>Loading…</span></>
                    ) : (
                        <>
                            {/* Refresh icon */}
                            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                            <span>{campaignName ? "Refresh" : "Load data"}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Stats — only shown once data is loaded */}
            {campaignName && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gc-ivory border border-gc-border px-4 py-3">
                        <p className="text-xs text-gc-muted mb-1">Total donated</p>
                        <p className="text-2xl font-bold text-gc-forest tabular-nums">
                            {Number(totalDonated).toFixed(4)}
                        </p>
                        <p className="text-xs text-gc-muted mt-0.5">ETH</p>
                    </div>
                    <div className="rounded-lg bg-gc-ivory border border-gc-border px-4 py-3">
                        <p className="text-xs text-gc-muted mb-1">Contract balance</p>
                        <p className="text-2xl font-bold text-gc-forest tabular-nums">
                            {Number(balance).toFixed(4)}
                        </p>
                        <p className="text-xs text-gc-muted mt-0.5">ETH</p>
                    </div>
                </div>
            )}

            {/* Status message */}
            {status && (
                <p
                    role="status"
                    className={`text-sm rounded-lg px-3 py-2 leading-snug ${
                        isError
                            ? "bg-red-50 border border-red-200 text-gc-error"
                            : "bg-emerald-50 border border-emerald-200 text-gc-jade"
                    }`}
                >
                    {status}
                </p>
            )}
        </div>
    );
}
