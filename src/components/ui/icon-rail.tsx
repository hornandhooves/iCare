"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface IconRailProps {
  labels: { agenda: string; clientes: string; signOut: string };
  initials: string;
}

export function IconRail({ labels, initials }: IconRailProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: "/agenda", label: labels.agenda, icon: Calendar },
    { href: "/clientes", label: labels.clientes, icon: Users },
  ];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex w-[76px] flex-none flex-col items-center gap-1 bg-surface py-4 shadow-[1px_0_0_var(--color-hairline)]">
      <div className="mb-3 h-8 w-8 flex-none rounded-[11px] bg-primary" aria-hidden />
      <div className="flex flex-1 flex-col items-center gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-14 flex-col items-center gap-1 rounded-[14px] py-2 text-[9.5px] font-bold ${
                active ? "bg-primary text-white" : "text-text-tertiary hover:bg-field"
              }`}
            >
              <Icon size={18} strokeWidth={2.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={signOut}
        title={labels.signOut}
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary hover:bg-field"
      >
        <LogOut size={18} strokeWidth={2.75} />
      </button>
      <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#E0E1E6] text-[10.5px] font-bold text-[#60646C]">
        {initials}
      </div>
    </nav>
  );
}
