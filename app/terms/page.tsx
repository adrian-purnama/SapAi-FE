import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Terms and conditions",
    description: "Terms of service for using this application.",
    path: "/terms",
  });
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-zinc-800">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-zinc-900 underline">
          Home
        </Link>
        {" · "}
        <Link href="/register" className="text-zinc-900 underline">
          Register
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900">Terms and conditions</h1>
      <p className="mt-2 text-sm text-zinc-600">Last updated: May 13, 2026</p>

      <section className="mt-8 space-y-4 text-[15px] leading-relaxed">
        <p>
          These terms govern your access to and use of this service (the &quot;Service&quot;). By creating an account or
          using the Service, you agree to these terms. If you do not agree, do not register or use the Service.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">1. Eligibility and accounts</h2>
        <p>
          You must provide accurate registration information and keep your credentials secure. You are responsible for
          activity under your account. Notify the operator promptly if you suspect unauthorized access.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">2. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Violate applicable laws or third-party rights.</li>
          <li>Attempt to probe, scan, or test the vulnerability of the Service without authorization.</li>
          <li>Overload, disrupt, or interfere with the Service or other users.</li>
          <li>Use the Service to generate or distribute unlawful, harassing, defamatory, or harmful content.</li>
          <li>Reverse engineer or attempt to extract underlying models or data except as permitted by law.</li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">3. AI-generated content</h2>
        <p>
          Outputs may be inaccurate or incomplete. You are responsible for how you use outputs, including compliance with
          your own policies and regulations. Do not rely on the Service as the sole source of professional advice.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">4. Changes and availability</h2>
        <p>
          Features, limits, and pricing may change. The Service may be modified or suspended with or without notice.
          Continued use after changes constitutes acceptance of the updated terms where required by law.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">5. Disclaimer and limitation of liability</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind, to the fullest extent permitted by
          law. To the extent permitted by law, the operator is not liable for indirect, incidental, special,
          consequential, or punitive damages, or for loss of profits, data, or goodwill.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">6. Termination</h2>
        <p>
          Access may be suspended or terminated for breach of these terms or for operational or legal reasons. You may
          stop using the Service at any time.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900">7. Contact</h2>
        <p>
          For questions about these terms, contact the administrator of this deployment using the contact details they
          provide on the site or in product communications.
        </p>
      </section>
    </main>
  );
}
