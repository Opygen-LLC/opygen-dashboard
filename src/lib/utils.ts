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

export function formatTime12Hour(timeStr?: string | null): string {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${h}:${m} ${ampm}`;
}

export function formatFollowupDateTime(
    date?: string | Date | null,
    time?: string | null,
    options?: { includeWeekday?: boolean }
): string {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const dateStr = d.toLocaleDateString(undefined, {
        ...(options?.includeWeekday ? { weekday: "long" } : {}),
        year: "numeric",
        month: options?.includeWeekday ? "long" : "short",
        day: "numeric",
    });

    if (time && time.trim() !== "") {
        return `${dateStr} at ${formatTime12Hour(time)}`;
    }

    const hours = d.getHours();
    const minutes = d.getMinutes();
    if (hours !== 0 || minutes !== 0) {
        const timeFormatted = d.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        return `${dateStr} at ${timeFormatted}`;
    }

    return dateStr;
}
