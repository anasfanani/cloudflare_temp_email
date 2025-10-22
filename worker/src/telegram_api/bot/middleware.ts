import { Context } from "hono";
import { Context as TgContext } from "telegraf";
import { CONSTANTS } from "../../constants";
import { TelegramSettings } from "../settings";
import i18n from "../../i18n";
import { SharedKV } from "../../shared-kv";

export async function setupMiddleware(bot: any, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    bot.use(async (ctx: TgContext, next: any) => {
        const userId = ctx?.message?.from?.id || ctx.callbackQuery?.from?.id;
        const chatType = ctx.chat?.type;
        
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }

        const kv = new SharedKV(c);
        const settings = await kv.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
        
        // Check if user is admin - admins always have access
        const isAdmin = settings?.adminList?.includes(userId.toString());
        
        // Check chat type restrictions (admins bypass this)
        if (!isAdmin) {
            if (chatType !== 'private') {
                return await ctx.reply("❌ Only private chats are supported");
            }
        }
        
        // If allowList is enabled and user is not admin, check allowList
        if (settings?.enableAllowList && !isAdmin
            && !settings.allowList.includes(userId.toString())
        ) {
            return await ctx.reply(t.noPermission);
        }
        
        // Track chat usage
        await trackChatUsage(ctx, c);
        
        try {
            await next();
        } catch (error) {
            console.error(`Error: ${error}`);
            return await ctx.reply(`Error: ${error}`);
        }
    });
}

async function trackChatUsage(ctx: TgContext, c: Context<HonoCustomType>) {
    try {
        const chatId = ctx.chat?.id;
        const chatType = ctx.chat?.type;
        const topicId = ctx.message?.message_thread_id;
        
        if (!chatId) return;
        
        const kv = new SharedKV(c);
        const key = `tg:chat:${chatId}`;
        const existing = await kv.get(key, "json") as any || {};
        
        const now = new Date().toISOString();
        const messageCount = (existing.message_count || 0) + 1;
        
        // Throttle writes: only update every 10 messages or if new chat
        if (!existing.first_seen || messageCount % 10 === 0) {
            const chatData: any = {
                type: chatType,
                first_seen: existing.first_seen || now,
                last_active: now,
                message_count: messageCount
            };
            
            // Add user-specific data for private chats
            if (chatType === 'private') {
                chatData.username = ctx.from?.username;
                chatData.first_name = ctx.from?.first_name;
                chatData.last_name = ctx.from?.last_name;
            }
            
            // Add group-specific data
            if (chatType === 'group' || chatType === 'supergroup') {
                chatData.title = ctx.chat?.title;
                chatData.username = (ctx.chat as any)?.username;
                chatData.is_forum = (ctx.chat as any)?.is_forum;
                
                // Track topics for forum groups
                if (topicId) {
                    chatData.topics = existing.topics || {};
                    chatData.topics[topicId] = {
                        first_seen: chatData.topics[topicId]?.first_seen || now,
                        last_active: now,
                        message_count: (chatData.topics[topicId]?.message_count || 0) + 1
                    };
                }
            }
            
            await kv.put(key, JSON.stringify(chatData));
        }
    } catch (e) {
        console.error(`Failed to track chat: ${e}`);
    }
}
