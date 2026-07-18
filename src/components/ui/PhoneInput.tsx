"use client";

import React from "react";
import { cn } from "@/lib/utils";

const COUNTRIES = [
    { code: "+880", name: "BD" },
    { code: "+1", name: "US" },
    { code: "+91", name: "IN" },
    { code: "+44", name: "UK" },
    { code: "+61", name: "AU" },
    { code: "+92", name: "PK" },
    { code: "+971", name: "AE" },
    { code: "+966", name: "SA" },
    { code: "+49", name: "DE" },
    { code: "+33", name: "FR" },
    { code: "+65", name: "SG" },
    { code: "+60", name: "MY" },
];

interface PhoneInputProps {
    value?: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
    disabled?: boolean;
}

function parsePhoneNumber(val: string) {
    if (!val) return { countryCode: "+880", localNumber: "" };

    const sortedCountries = [...COUNTRIES].sort(
        (a, b) => b.code.length - a.code.length,
    );

    for (const country of sortedCountries) {
        if (val.startsWith(country.code)) {
            return {
                countryCode: country.code,
                localNumber: val.slice(country.code.length),
            };
        }
    }

    if (val.startsWith("+")) {
        return { countryCode: "+1", localNumber: val.slice(1) };
    }

    return { countryCode: "+880", localNumber: val };
}

export function PhoneInput({
    value = "",
    onChange,
    id,
    className,
    disabled,
}: PhoneInputProps) {
    const { countryCode, localNumber } = parsePhoneNumber(value);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextCountry = e.target.value;
        onChange(localNumber ? `${nextCountry}${localNumber}` : "");
    };

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = e.target.value;

        if (nextValue.startsWith("+")) {
            const parsed = parsePhoneNumber(nextValue);
            onChange(`${parsed.countryCode}${parsed.localNumber}`);
            return;
        }

        const digits = nextValue.replace(/\D/g, "");
        onChange(digits ? `${countryCode}${digits}` : "");
    };

    return (
        <div className={cn("flex w-full gap-2", className)}>
            <select
                value={countryCode}
                onChange={handleCountryChange}
                disabled={disabled}
                className="h-10 w-[104px] rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            >
                {COUNTRIES.map((country) => (
                    <option
                        key={country.code}
                        value={country.code}
                        className="bg-card text-foreground"
                    >
                        {country.name} {country.code}
                    </option>
                ))}
            </select>
            <input
                id={id}
                type="tel"
                placeholder="1712345678"
                value={localNumber}
                onChange={handleLocalChange}
                disabled={disabled}
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
        </div>
    );
}
