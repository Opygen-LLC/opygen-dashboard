"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ReactPhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
    value?: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
    disabled?: boolean;
}

export function PhoneInput({
    value = "",
    onChange,
    id,
    className,
    disabled,
}: PhoneInputProps) {
    return (
        <div className={cn("w-full relative", className)}>
            <ReactPhoneInput
                id={id}
                international
                defaultCountry="BD"
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground transition-all ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {/* Custom CSS to override the package's default styling so it matches Shadcn UI */}
            <style jsx global>{`
                .PhoneInput {
                    display: flex;
                    align-items: center;
                    width: 100%;
                }
                .PhoneInputInput {
                    flex: 1;
                    min-width: 0;
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 14px;
                    color: inherit;
                    margin-left: 8px;
                }
                .PhoneInputInput:focus {
                    outline: none;
                }
                .PhoneInputCountry {
                    margin-right: 8px;
                    padding-right: 8px;
                    border-right: 1px solid hsl(var(--border));
                }
                .PhoneInputCountrySelectArrow {
                    margin-left: 6px;
                }
            `}</style>
        </div>
    );
}
