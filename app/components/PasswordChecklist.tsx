"use client";

import { Check, X } from "lucide-react";
import { passwordChecklist } from "@/lib/password-policy";

export default function PasswordChecklist({ password }: { password: string }) {
  const items = passwordChecklist(password);
  return (
    <ul className="mt-1 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          {item.ok ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          ) : (
            <X className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          )}
          <span className={item.ok ? "text-emerald-700" : undefined}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

