"use client";

import {createContext, type ReactNode, useEffect, useState} from "react";
import type {Locale} from "@/lib";
import {DEFAULT_LOCALE} from "@/config.ts";
import determineUserLocale from "../types/locale.ts";

export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export default function LocaleContextProvider({children}: {children: ReactNode}) {
    const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
    useEffect(() => {
        determineUserLocale().then(l => setLocale(l));
    }, []);
    return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}