import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Signal to Startup',
  description: 'Privacy Policy for Signal to Startup by EntrepAIneur.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-16">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-3 border-b border-border/10 pb-8">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Legal</p>
          <h1 className="text-4xl font-serif italic font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted">Last updated: January 1, 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-[15px] leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Overview</h2>
            <p className="text-muted">
              Signal to Startup (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is operated by EntrepAIneur. This
              Privacy Policy describes what data we collect, how we use it, and what choices
              you have. We are committed to protecting your privacy and handling your data
              with transparency.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Data We Collect</h2>
            <p className="text-muted">We collect the following categories of data:</p>
            <ul className="list-disc list-inside space-y-2 text-muted pl-2">
              <li>
                <strong className="text-foreground">Google Profile</strong> — your name, email
                address, and profile photo, obtained when you sign in with Google.
              </li>
              <li>
                <strong className="text-foreground">Saved Opportunities</strong> — business
                ideas and execution plans you save to your Pipeline.
              </li>
              <li>
                <strong className="text-foreground">Analysis History</strong> — records of
                signals you have analyzed, including the input text and AI-generated results.
              </li>
              <li>
                <strong className="text-foreground">Usage Data</strong> — basic interaction
                data such as which features you use, used solely to improve the service.
              </li>
            </ul>
            <p className="text-muted">
              We do not collect payment information, government IDs, or sensitive personal
              data beyond what is listed above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. How We Use Your Data</h2>
            <p className="text-muted">Your data is used to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted pl-2">
              <li>Authenticate you and maintain your session across devices.</li>
              <li>Store and display your saved opportunities and analysis history.</li>
              <li>Personalize your experience based on your selected market mode and niche.</li>
              <li>Improve Signal to Startup features and performance.</li>
            </ul>
            <p className="text-muted">
              We do not use your data to train AI models, build advertising profiles, or make
              automated decisions that have legal or significant effects on you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Data Storage</h2>
            <p className="text-muted">
              Your data is stored in <strong className="text-foreground">Google Firebase Firestore</strong>,
              a cloud database operated by Google LLC. Firebase Firestore is subject to
              Google&apos;s security standards and compliance certifications (SOC 2, ISO 27001).
              Data is stored in the United States unless otherwise configured.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
            <p className="text-muted">Signal to Startup uses the following third-party services:</p>
            <div className="space-y-4 pl-2">
              <div>
                <p className="font-medium text-foreground text-sm">Google Firebase</p>
                <p className="text-muted text-sm">Authentication and database storage. Subject to Google&apos;s Privacy Policy.</p>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Google Gemini AI</p>
                <p className="text-muted text-sm">
                  Powers the AI analysis engine. Input text you submit for analysis is sent to
                  Google&apos;s Gemini API. We do not send identifying personal information to
                  Gemini — only the signal text and contextual parameters (location, niche,
                  market mode) you provide.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">RSS News Feeds</p>
                <p className="text-muted text-sm">
                  Live feed content is fetched from public RSS feeds (TechCrunch, BBC,
                  Guardian, and others). No personal data is shared with these sources.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. No Data Sales</h2>
            <p className="text-muted">
              We do not sell, rent, trade, or share your personal data with advertisers,
              data brokers, or any third party for commercial purposes. Your data is used
              exclusively to operate and improve Signal to Startup.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Cookies &amp; Local Storage</h2>
            <p className="text-muted">
              We use browser local storage to remember your onboarding state and preferences
              (such as whether you have completed the onboarding guide). We do not use
              third-party tracking cookies or advertising pixels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. Your Rights &amp; Data Deletion</h2>
            <p className="text-muted">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted pl-2">
              <li>Access the personal data we hold about you.</li>
              <li>Delete individual analyses at any time from within the app.</li>
              <li>Request complete deletion of your account and all associated data.</li>
              <li>Withdraw consent for data processing at any time by stopping use of the service.</li>
            </ul>
            <p className="text-muted">
              To request full account deletion, email us at{' '}
              <a href="mailto:support@entrepaineur.com" className="text-primary hover:underline">
                support@entrepaineur.com
              </a>
              . We will process your request within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">9. Children&apos;s Privacy</h2>
            <p className="text-muted">
              Signal to Startup is not directed at children under the age of 13. We do not
              knowingly collect personal data from children. If you believe a child has
              provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">10. Changes to This Policy</h2>
            <p className="text-muted">
              We may update this Privacy Policy from time to time. We will post the revised
              version on this page with an updated date. Continued use of Signal to Startup
              after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">11. Contact Us</h2>
            <p className="text-muted">
              If you have questions, concerns, or requests regarding this Privacy Policy or
              your data, contact us at:
            </p>
            <p className="text-muted pl-2">
              <strong className="text-foreground">EntrepAIneur</strong><br />
              <a href="mailto:support@entrepaineur.com" className="text-primary hover:underline">
                support@entrepaineur.com
              </a>
            </p>
          </section>

        </div>

        {/* Back link */}
        <div className="border-t border-border/10 pt-8">
          <Link href="/" className="text-xs font-mono uppercase tracking-widest text-muted hover:text-foreground transition-colors">
            ← Back to Signal to Startup
          </Link>
        </div>

      </div>
    </main>
  );
}
