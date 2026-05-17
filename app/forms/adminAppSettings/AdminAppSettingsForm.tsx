"use client";

import { FormEvent, useState } from "react";
import type { AppSettingsPayload } from "./useAdminAppSettings";
import { useAdminAppSettings } from "./useAdminAppSettings";

type FieldsProps = {
  defaults: AppSettingsPayload;
  saving: boolean;
  onSave: (next: AppSettingsPayload) => Promise<void>;
};

function AdminAppSettingsFields({
  defaults,
  saving,
  onSave,
}: FieldsProps) {
  const [appName, setAppName] = useState(defaults.appName);
  const [openRegistration, setOpenRegistration] = useState(defaults.openRegistration);
  const [openLogin, setOpenLogin] = useState(defaults.openLogin);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(defaults.brandLogoUrl);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [removeBrandLogo, setRemoveBrandLogo] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      appName: appName.trim(),
      openRegistration,
      openLogin,
      brandLogoFile,
      removeBrandLogo,
      brandLogoUrl,
    });
  }

  async function onLogoChosen(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }

    setUploadError("");
    setBrandLogoFile(file);
    setRemoveBrandLogo(false);
    setSelectedFileName(file.name);
    setBrandLogoUrl(URL.createObjectURL(file));
  }

  function clearLogo() {
    setUploadError("");
    setBrandLogoFile(null);
    setSelectedFileName("");
    setRemoveBrandLogo(true);
    setBrandLogoUrl(null);
  }

  return (
    <form
      className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-xl border border-zinc-300 bg-white p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="text-lg font-semibold">Application settings</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Shown on sign-in pages, navbar, and used to gate access.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Logo</span>
        <div className="flex flex-wrap items-center gap-3">
          {brandLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- dynamic GridFS URLs */
            <img
              src={brandLogoUrl}
              alt=""
              className="h-12 max-w-[200px] rounded border border-zinc-200 object-contain"
            />
          ) : (
            <span className="text-sm text-zinc-500">No logo</span>
          )}
          <label className="cursor-pointer rounded-lg border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-50">
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => void onLogoChosen(e)}
              disabled={saving}
            />
          </label>
          {(brandLogoUrl || selectedFileName) ? (
            <button type="button" className="text-sm text-red-700 underline" onClick={clearLogo}>
              Remove logo (save to apply)
            </button>
          ) : null}
        </div>
        {selectedFileName ? <p className="text-xs text-zinc-500">Selected: {selectedFileName}</p> : null}
        {uploadError ? <p className="text-sm text-red-700">{uploadError}</p> : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-zinc-700" htmlFor="admin-app-name">
          App name
        </label>
        <input
          id="admin-app-name"
          className="h-10 rounded-lg border border-zinc-300 px-3"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          maxLength={120}
          required
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={openRegistration}
          onChange={(e) => setOpenRegistration(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Open registration
      </label>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={openLogin}
          onChange={(e) => setOpenLogin(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Open login
      </label>

      <button
        type="submit"
        disabled={saving}
        className="h-[42px] rounded-lg bg-zinc-900 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export default function AdminAppSettingsForm() {
  const { loading, saving, loadError, settings, saveSettings } = useAdminAppSettings();

  if (loading || !settings) {
    return (
      <div className="rounded-xl border border-zinc-300 bg-white p-6">
        {loadError ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-zinc-600">Could not load settings.</p>
          </div>
        ) : (
          <p className="text-zinc-600">Loading settings…</p>
        )}
      </div>
    );
  }

  const merged: AppSettingsPayload = {
    appName: settings.appName,
    openRegistration: settings.openRegistration,
    openLogin: settings.openLogin,
    brandLogoFile: null,
    removeBrandLogo: false,
    brandLogoUrl: settings.brandLogoUrl,
  };

  const formKey = [
    merged.appName,
    String(merged.openRegistration),
    String(merged.openLogin),
    merged.brandLogoUrl ?? "no-logo",
  ].join("|");

  return (
    <AdminAppSettingsFields
      key={formKey}
      defaults={merged}
      saving={saving}
      onSave={saveSettings}
    />
  );
}
