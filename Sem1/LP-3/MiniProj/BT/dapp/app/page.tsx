
import Header from "./components/Header";
import Footer from "./components/Footer";
import ConnectWallet from "./components/ConnectWallet";
import CampaignInfo from "./components/CampaignInfo";
import DonationForm from "./components/DonationForm";
import DonationHistory from "./components/DonationHistory";

export default function Home() {
  return (
    <div className="min-h-screen bg-gc-ivory flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section aria-label="Introduction" className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gc-forest leading-[1.15]">
            Every donation,<br />on the record.
          </h1>
          <p className="mt-4 text-base text-gc-muted leading-relaxed max-w-[58ch]">
            A transparent charity platform powered by smart contracts.
            Donate test ETH and verify every transaction directly on-chain —
            no central database, no hidden ledger.
          </p>
        </section>

        {/* ── Wallet ───────────────────────────────────────────────── */}
        <section
          aria-label="Wallet connection"
          className="bg-gc-white rounded-xl border border-gc-border shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gc-sage mb-1">
                Your Wallet
              </p>
              <h2 className="text-xl font-semibold text-gc-ink">
                Connect to participate
              </h2>
              <p className="mt-1 text-sm text-gc-muted">
                Connect MetaMask on the GiveChain Local network (chain&nbsp;31337).
              </p>
            </div>
            <ConnectWallet />
          </div>
        </section>

        {/* ── Campaign + Donation grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section
            aria-label="Campaign information"
            className="bg-gc-white rounded-xl border border-gc-border shadow-sm p-6 flex flex-col gap-4"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gc-sage">
              The Campaign
            </p>
            <CampaignInfo />
          </section>

          <section
            aria-label="Make a donation"
            className="bg-gc-white rounded-xl border border-gc-border shadow-sm p-6 flex flex-col gap-4"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gc-sage">
              Make an Impact
            </p>
            <DonationForm />
          </section>
        </div>

        {/* ── Donation history ─────────────────────────────────────── */}
        <section
          aria-label="Donation history"
          className="bg-gc-white rounded-xl border border-gc-border shadow-sm p-6 flex flex-col gap-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gc-sage">
            Verifiable Transactions
          </p>
          <DonationHistory />
        </section>

      </main>

      <Footer />
    </div>
  );
}
