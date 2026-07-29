import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserTitle(title?: string[] | string | null): string {
    if (!title) return "";
    if (Array.isArray(title)) {
        return title.filter(Boolean).join(" & ");
    }
    return String(title);
}

export function parseUserTitle(titleInput?: string[] | string | null): string[] {
    if (!titleInput) return [];
    if (Array.isArray(titleInput)) {
        return titleInput.map((s) => s.trim()).filter(Boolean);
    }
    return String(titleInput)
        .split("&")
        .map((s) => s.trim())
        .filter(Boolean);
}
