import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../constants";
import { TelegramSettings } from "../settings";
import { handleAdminStats, handleAdminUsers, handleAdminSettings, handleAdminChats } from "../commands/admin";
import i18n from "../../i18n";

export async function handleAdminCallbacks(ctx: TgContext, c: Context<HonoCustomType>, data: string) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    const userId = ctx.callbackQuery?.message?.chat?.id;
    if (!userId) {
        return await ctx.answerCbQuery("Unable to get user info");
    }
    
    const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    if (!settings?.adminList?.includes(userId.toString())) {
        return await ctx.answerCbQuery(t.adminOnly);
    }
    
    const action = data.replace("admin_", "");
    
    switch (action) {
        case "stats":
            await handleAdminStats(ctx, c);
            break;
        case "users":
            await handleAdminUsers(ctx, c);
            break;
        case "broadcast":
            await ctx.editMessageText(
                "📢 Broadcast Message\n\n"
                + "Please use: /admin broadcast <your message>\n\n"
                + "Example: /admin broadcast Hello everyone!",
                Markup.inlineKeyboard([
                    [Markup.button.callback("🔙 Back to Menu", "admin_menu")]
                ])
            );
            break;
        case "settings":
            await handleAdminSettings(ctx, c);
            break;
        case "chats":
            await handleAdminChats(ctx, c);
            break;
        case "menu":
            await ctx.editMessageText(
                "⚡ Quick Actions:",
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback("📊 Stats", "admin_stats"),
                        Markup.button.callback("👥 Users", "admin_users"),
                        Markup.button.callback("📢 Broadcast", "admin_broadcast")
                    ],
                    [
                        Markup.button.callback("⚙️ More Options...", "admin_more")
                    ],
                    [
                        Markup.button.callback("❌ Exit", "admin_exit")
                    ]
                ])
            );
            break;
        case "exit":
            await ctx.editMessageText("👋 Admin panel closed. Type /admin to reopen.");
            break;
        case "more":
            await ctx.editMessageText(
                "⚙️ More Admin Options:",
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback("⚙️ Settings", "admin_settings"),
                        Markup.button.callback("💬 Chats", "admin_chats")
                    ],
                    [
                        Markup.button.callback("🔄 Refresh", "admin_refresh")
                    ],
                    [
                        Markup.button.callback("🔙 Back to Menu", "admin_menu")
                    ]
                ])
            );
            break;
        case "refresh":
        case "back":
            await ctx.editMessageText(
                "⚡ Quick Actions:",
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback("📊 Stats", "admin_stats"),
                        Markup.button.callback("👥 Users", "admin_users"),
                        Markup.button.callback("📢 Broadcast", "admin_broadcast")
                    ],
                    [
                        Markup.button.callback("⚙️ More Options...", "admin_more")
                    ],
                    [
                        Markup.button.callback("❌ Exit", "admin_exit")
                    ]
                ])
            );
            break;
    }
    
    return await ctx.answerCbQuery();
}

export async function handleSettingCallbacks(ctx: TgContext, c: Context<HonoCustomType>, data: string) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    const userId = ctx.callbackQuery?.message?.chat?.id;
    if (!userId) {
        return await ctx.answerCbQuery("Unable to get user info");
    }
    
    const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    if (!settings?.adminList?.includes(userId.toString())) {
        return await ctx.answerCbQuery(t.adminOnly);
    }
    
    const action = data.replace("setting_", "");
    
    switch (action) {
        case "toggle_allowlist":
            settings.enableAllowList = !settings.enableAllowList;
            await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
            await handleAdminSettings(ctx, c);
            await ctx.answerCbQuery(`Allow List ${settings.enableAllowList ? 'Enabled' : 'Disabled'}`);
            break;
        case "toggle_mailpush":
            settings.enableGlobalMailPush = !settings.enableGlobalMailPush;
            await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
            await handleAdminSettings(ctx, c);
            await ctx.answerCbQuery(`Mail Push ${settings.enableGlobalMailPush ? 'Enabled' : 'Disabled'}`);
            break;
        case "toggle_private":
            settings.allowPrivateChat = settings.allowPrivateChat === false ? true : false;
            await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
            await handleAdminSettings(ctx, c);
            await ctx.answerCbQuery(`Private Chat ${settings.allowPrivateChat !== false ? 'Enabled' : 'Disabled'}`);
            break;
        case "toggle_group":
            settings.allowGroupChat = !settings.allowGroupChat;
            await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
            await handleAdminSettings(ctx, c);
            await ctx.answerCbQuery(`Group Chat ${settings.allowGroupChat ? 'Enabled' : 'Disabled'}`);
            break;
        case "toggle_supergroup":
            settings.allowSuperGroupChat = !settings.allowSuperGroupChat;
            await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
            await handleAdminSettings(ctx, c);
            await ctx.answerCbQuery(`Supergroup Chat ${settings.allowSuperGroupChat ? 'Enabled' : 'Disabled'}`);
            break;
        case "manage_allowlist": {
            const allowListText = settings?.allowList?.length 
                ? settings.allowList.map(id => `• ${id}`).join('\n')
                : 'No users in allow list';
            await ctx.editMessageText(
                `👥 Allow List (${settings?.allowList?.length || 0} users)\n\n${allowListText}\n\n`
                + `💡 Use the web admin panel to add/remove users`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Back to Settings', 'admin_settings')]
                ])
            );
            break;
        }
        case "manage_admins": {
            const adminListText = settings?.adminList?.length 
                ? settings.adminList.map(id => `• ${id}`).join('\n')
                : 'No admins configured';
            await ctx.editMessageText(
                `👨‍💼 Admin List (${settings?.adminList?.length || 0} admins)\n\n${adminListText}\n\n`
                + `💡 Use the web admin panel to add/remove admins`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Back to Settings', 'admin_settings')]
                ])
            );
            break;
        }
        case "manage_pushlist": {
            const pushListText = settings?.globalMailPushList?.length 
                ? settings.globalMailPushList.map(id => `• ${id}`).join('\n')
                : 'No users in push list';
            await ctx.editMessageText(
                `📧 Global Mail Push List (${settings?.globalMailPushList?.length || 0} users)\n\n${pushListText}\n\n`
                + `💡 Use the web admin panel to add/remove users`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅️ Back to Settings', 'admin_settings')]
                ])
            );
            break;
        }
    }
    
    return await ctx.answerCbQuery();
}
