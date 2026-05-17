import toast from "react-hot-toast";

const DEFAULT_DURATION_MS = 4000;

type ToastOpts = {
  /** Optional id to replace an existing toast (dedupe rapid repeats). */
  id?: string;
  duration?: number;
};

export function toastSuccess(message: string, opts?: ToastOpts): string {
  return toast.success(message, {
    duration: opts?.duration ?? DEFAULT_DURATION_MS,
    id: opts?.id,
    style: {
      background: "#fafafa",
      color: "#18181b",
      border: "1px solid #e4e4e7",
    },
  });
}

export function toastError(message: string, opts?: ToastOpts): string {
  return toast.error(message, {
    duration: opts?.duration ?? 5500,
    id: opts?.id,
    style: {
      background: "#fef2f2",
      color: "#7f1d1d",
      border: "1px solid #fecaca",
    },
  });
}

export function toastLoading(message: string, id?: string): string {
  return toast.loading(message, { id });
}

export function toastDismiss(toastId?: string): void {
  toast.dismiss(toastId);
}
