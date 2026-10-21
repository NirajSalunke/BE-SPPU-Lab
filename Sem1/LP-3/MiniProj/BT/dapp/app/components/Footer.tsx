export default function Footer() {
    return (
        <footer className="border-t border-gc-border bg-gc-white mt-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gc-ink">GiveChain</p>
                    <p className="text-xs text-gc-muted">
                        Built on Ethereum-compatible smart contracts · College mini-project
                    </p>
                </div>

                <p className="text-xs font-medium text-gc-warning bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Local Hardhat network · Test ETH only · Not real money
                </p>
            </div>
        </footer>
    );
}
