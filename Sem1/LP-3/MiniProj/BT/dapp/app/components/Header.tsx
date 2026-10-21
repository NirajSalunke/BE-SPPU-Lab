
export default function Header() {
    return (
        <header className="sticky top-0 z-40 bg-gc-white/90 backdrop-blur-sm border-b border-gc-border">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

                {/* Brand */}
                <a
                    href="/"
                    className="flex items-center gap-2.5 group"
                    aria-label="GiveChain home"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gc-forest text-white text-sm font-bold select-none shrink-0">
                        G
                    </span>
                    <span className="text-lg font-semibold text-gc-ink tracking-tight group-hover:text-gc-jade transition-colors duration-150">
                        GiveChain
                    </span>
                </a>

                {/* Network chip */}
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gc-mint border border-gc-sage/40 text-xs font-medium text-gc-jade"
                    role="status"
                    aria-label="Connected to local blockchain network"
                >
                    <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gc-sage opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gc-jade" />
                    </span>
                    <span className="hidden sm:inline">Local Blockchain</span>
                    <span className="sm:hidden">Local</span>
                </div>

            </div>
        </header>
    );
}
