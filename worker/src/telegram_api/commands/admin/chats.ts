import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";

export async function handleAdminChats(ctx: TgContext, c: Context<HonoCustomType>) {
    const keys = await c.env.KV.list({ prefix: "tg:chat:" });
    
    let privateChats = 0;
    let groups = 0;
    let supergroups = 0;
    let totalTopics = 0;
    let totalMessages = 0;
    
    const recentChats = [];
    
    for (const key of keys.keys.slice(0, 20)) {
        const chat = await c.env.KV.get(key.name, "json") as any;
        if (!chat) continue;
        
        totalMessages += chat.message_count || 0;
        
        if (chat.type === 'private') {
            privateChats++;
            recentChats.push({
                icon: '👤',
                name: chat.username || chat.first_name || 'Unknown',
                count: chat.message_count
            });
        } else if (chat.type === 'group') {
            groups++;
            recentChats.push({
                icon: '👥',
                name: chat.title || 'Group',
                count: chat.message_count
            });
        } else if (chat.type === 'supergroup') {
            supergroups++;
            if (chat.topics) {
                totalTopics += Object.keys(chat.topics).length;
            }
            recentChats.push({
                icon: chat.is_forum ? '📌' : '👥',
                name: chat.title || 'Supergroup',
                count: chat.message_count,
                topics: chat.topics ? Object.keys(chat.topics).length : 0
            });
        }
    }
    
    const message = `💬 Bot Usage Statistics\n\n`
        + `👤 Private Chats: ${privateChats}\n`
        + `👥 Groups: ${groups}\n`
        + `👥 Supergroups: ${supergroups}\n`
        + `📌 Forum Topics: ${totalTopics}\n`
        + `💬 Total Messages: ${totalMessages}\n\n`
        + `Recent Chats:\n`
        + recentChats.slice(0, 10).map(c => 
            `${c.icon} ${c.name} (${c.count} msgs${c.topics ? `, ${c.topics} topics` : ''})`
          ).join('\n');
    
    if (ctx.callbackQuery) {
        return await ctx.editMessageText(message,
            Markup.inlineKeyboard([
                [Markup.button.callback("🔙 Back to More", "admin_more")]
            ])
        );
    }
    return await ctx.reply(message,
        Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back to More", "admin_more")]
        ])
    );
}
