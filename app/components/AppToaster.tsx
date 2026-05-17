"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: 16 }}
      toastOptions={{
        duration: 4000,
        className: "text-sm shadow-lg",
      }}
    />
  );
}
