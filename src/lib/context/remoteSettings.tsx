"use client";

import {createContext, type ReactNode, useEffect, useState} from "react";
import {determineRemoteSettings, type RemoteSettings} from "../types/remoteSettings.ts";
import {DEFAULT_REMOTE_SETTINGS} from "@/config.ts";

export const RemoteSettingsContext = createContext<RemoteSettings>(DEFAULT_REMOTE_SETTINGS)

export default function RemoteSettingsContextProvider({children}: {children: ReactNode}) {
    const [remoteSettings, setRemoteSettings] = useState<RemoteSettings>(DEFAULT_REMOTE_SETTINGS)
    useEffect(() => {
        determineRemoteSettings().then(rs => setRemoteSettings(rs));
    }, []);

    return <RemoteSettingsContext.Provider value={remoteSettings}>{children}</RemoteSettingsContext.Provider>;
}