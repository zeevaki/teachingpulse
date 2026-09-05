"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Track" },
  { href: "/summary", label: "Summary" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="border-b sticky top-0 z-10 backdrop-blur"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--surface-1) 92%, transparent)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
          🩺 TeachingPulse
        </span>
        <nav className="flex gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--surface-1)" : "var(--text-secondary)",
                  background: active ? "var(--series-1)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
