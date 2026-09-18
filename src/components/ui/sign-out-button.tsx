"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ title, className }: { title?: string; className?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      title={title}
      className={className ?? "flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary hover:bg-field"}
    >
      <LogOut size={18} strokeWidth={2.75} />
    </button>
  );
}
