import {createClient} from "../supabase/client.ts";

export type RemoteSettings = {
    kill_switch?: { enabled: boolean; message: string };
    session_notif?: SessionNotif;
    [key: string]: any;
};

export interface SessionNotif {
    enabled: boolean;
    message: string;
    startTime: string;
    endTime: string;
    duration: number;
}

/**
 * Fetches the Remote Settings from the Supabase site_settings table.
 *
 * Must be called from the client!
 *
 * @returns The Remote Settings
 */
export async function determineRemoteSettings() {
    let remoteSettings: RemoteSettings;
    const supabase = createClient()!

    // Use a locally defined variable to allow for immediate manipulation. If we used the remoteSettings in state
    // it would still be `{}` until the next render loop.
    const resp = await supabase
        .from("site_settings")
        .select("*");
    if (!resp || resp.error) {
        throw resp ? resp.error : new Error("Site settings fetch returned " + resp);
    }
    const data: {
        id: string;
        display_name: string;
        value: string;
    }[] = resp.data;
    // Settings are not returned as an object, but as an array of table rows. Convert it to an object.
    remoteSettings = {};
    data.forEach((setting) => {
        remoteSettings[setting.id] = setting.value;
    });

    return remoteSettings;
}