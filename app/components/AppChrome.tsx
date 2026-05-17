"use client";

import { usePathname } from "next/navigation";

import AdminFab from "@/app/components/AdminFab";
import Navbar from "@/app/components/Navbar";

/**
 * Dashboard/marketing chrome. Hidden on `/embed/*` so iframe and full-page embed stay compact.
 */
export function AppChrome() {
  const path = usePathname();
  if (path?.startsWith("/embed")) {
    return null;
  }
  return (
    <>
      <Navbar />
      <AdminFab />
    </>
  );
}
