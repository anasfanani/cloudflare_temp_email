import { Context } from "hono";
import { CONSTANTS } from "../constants";
import { SharedKV } from "../shared-kv";

export class TelegramSettings {
    enableAllowList: boolean;
    allowList: string[];
    miniAppUrl: string;
    enableGlobalMailPush: boolean;
    globalMailPushList: string[];
    adminList: string[];

    constructor(
        enableAllowList: boolean, allowList: string[], miniAppUrl: string,
        enableGlobalMailPush: boolean, globalMailPushList: string[],
        adminList: string[] = []
    ) {
        this.enableAllowList = enableAllowList;
        this.allowList = allowList;
        this.miniAppUrl = miniAppUrl;
        this.enableGlobalMailPush = enableGlobalMailPush;
        this.globalMailPushList = globalMailPushList;
        this.adminList = adminList;
    }
}

async function getTelegramSettings(c: Context<HonoCustomType>): Promise<Response> {
    const kv = new SharedKV(c);
    const settings = await kv.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    return c.json(settings || new TelegramSettings(false, [], "", false, [], []));
}


async function saveTelegramSettings(c: Context<HonoCustomType>): Promise<Response> {
    const kv = new SharedKV(c);
    const settings = await c.req.json<TelegramSettings>();
    await kv.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
    return c.json({ success: true })
}

export default {
    getTelegramSettings,
    saveTelegramSettings,
}
