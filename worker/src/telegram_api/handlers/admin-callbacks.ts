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
            // Get all users from KV (stored as tg:chat:userId)
            const chatKeys = await c.env.KV.list({ prefix: "tg:chat:" });
            const userIds = [];
            
            for (const key of chatKeys.keys) {
                const chat = await c.env.KV.get(key.name, "json") as any;
                if (chat && chat.type === 'private') {
                    const userId = key.name.replace('tg:chat:', '');
                    userIds.push(userId);
                }
            }
            
            const currentPushList = settings?.globalMailPushList || [];
            
            // Build buttons for users
            const userButtons = userIds.map(id => {
                const isInList = currentPushList.includes(id);
                return [Markup.button.callback(
                    `${isInList ? '✅' : '☐'} User ${id}`,
                    `setting_pushlist_toggle_${id}`
                )];
            });
            
            await ctx.editMessageText(
                `📧 Global Mail Push List\n\n`
                + `Current: ${currentPushList.length} users\n\n`
                + `Select users to add or remove:\n`
                + `(✅ = enabled, ☐ = disabled)`,
                Markup.inlineKeyboard([
                    ...userButtons,
                    [Markup.button.callback('⬅️ Back to Settings', 'admin_settings')]
                ])
            );
            break;
        }
    }
    
    // Handle pushlist toggle (starts with "pushlist_toggle_")
    if (action.startsWith("pushlist_toggle_")) {
        const chatId = action.replace("pushlist_toggle_", "");
        const currentList = settings?.globalMailPushList || [];
        
        if (currentList.includes(chatId)) {
            // Remove from list
            settings.globalMailPushList = currentList.filter(id => id !== chatId);
        } else {
            // Add to list
            settings.globalMailPushList = [...currentList, chatId];
        }
        
        await c.env.KV.put(CONSTANTS.TG_KV_SETTINGS_KEY, JSON.stringify(settings));
        
        // Refresh the manage_pushlist view
        await handleSettingCallbacks(ctx, c, "setting_manage_pushlist");
        return await ctx.answerCbQuery(`Updated push list`);
    }
    
    return await ctx.answerCbQuery();
}
