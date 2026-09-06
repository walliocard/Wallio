"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Icons } from "./icons";
import type { Marchand } from "@/lib/loyalty";
import WallioIcon from "@/components/WallioIcon";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/dashboard",                   label: "Accueil",       Icon: Icons.Home,     mobile: true  },
  { href: "/dashboard/scanner",           label: "Scanner",       Icon: Icons.Camera,   mobile: true  },
  { href: "/dashboard/clients",           label: "Clients",       Icon: Icons.Users,    mobile: true  },
  { href: "/dashboard/notifications",     label: "Notifs",        Icon: Icons.Bell,     mobile: true  },
  { href: "/dashboard/carte",             label: "Ma carte",      Icon: Icons.Card,     mobile: false },
  { href: "/dashboard/reglages",          label: "Réglages",      Icon: Icons.Settings, mobile: true  },
];

function active(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardNav({ marchand }: { marchand: Marchand }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Sidebar tablet/desktop ── */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col md:w-[72px] lg:w-[240px]"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(30px)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center h-16 px-4 lg:px-5 flex-shrink-0 gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <WallioIcon size={32} />
          <span className="hidden lg:block font-semibold text-[15px] tracking-tight" style={{ color: "var(--fg)" }}>
            Wallio
          </span>
        </div>

        {/* Merchant info */}
        <div
          className="hidden lg:block px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--fg-tertiary)" }}>
            Établissement
          </p>
          <p className="text-[13px] font-medium truncate" style={{ color: "var(--fg)" }}>
            {marchand.nom}
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const isActive = active(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group"
                style={{
                  background: isActive ? "var(--wallio-gradient)" : "transparent",
                  color: isActive ? "white" : "var(--fg-secondary)",
                  boxShadow: isActive ? "0 2px 12px rgba(139,92,246,0.25)" : "none",
                }}
              >
                <span className="flex-shrink-0">
                  <Icon size={18} />
                </span>
                <span className="hidden lg:block text-[13.5px] font-medium">
                  {label}
                </span>
                {/* Tooltip tablet only */}
                <span
                  className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
                  style={{ background: "var(--fg)", color: "var(--bg)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Theme + Logout */}
        <div className="flex-shrink-0 px-2 lg:px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="hidden lg:flex justify-center">
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut(auth)}
            className="relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-all duration-150 group"
            style={{ color: "var(--fg-tertiary)" }}
          >
            <span className="flex-shrink-0"><Icons.LogOut size={18} /></span>
            <span className="hidden lg:block text-[13.5px] font-medium">Déconnexion</span>
            <span className="lg:hidden absolute left-[calc(100%+8px)] px-2.5 py-1.5 rounded-lg text-[12px] font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg"
              style={{ background: "var(--fg)", color: "var(--bg)" }}>
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* ── Bottom nav mobile ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(30px)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV.filter(n => n.mobile).map(({ href, label, Icon }) => {
          const isActive = active(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-150"
              style={{ color: isActive ? "#8B5CF6" : "var(--fg-tertiary)" }}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
