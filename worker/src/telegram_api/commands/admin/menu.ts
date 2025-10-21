import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../../constants";
import { TelegramSettings } from "../../settings";
import i18n from "../../../i18n";
import { handleAdminStats } from "./stats";
import { handleAdminUsers } from "./users";
import { handleAdminBroadcast } from "./broadcast";
import { handleAdminSettings } from "./settings";

export function registerAdminCommand(bot: any, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    bot.command("admin", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        
        const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
        if (!settings?.adminList?.includes(userId.toString())) {
            return await ctx.reply(t.adminOnly);
        }

        try {
            // @ts-ignore
            const args = ctx?.message?.text.split(" ");
            const subcommand = args[1];

            if (!subcommand) {
                // Show interactive menu
                return await ctx.reply(
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
            }

            switch (subcommand) {
                case "stats":
                    return await handleAdminStats(ctx, c);
                case "users":
                    return await handleAdminUsers(ctx, c);
                case "broadcast":
                    return await handleAdminBroadcast(ctx, c, args.slice(2).join(" "));
                case "settings":
                    return await handleAdminSettings(ctx, c);
                default:
                    return await ctx.reply(t.invalidAdminCommand);
            }
        } catch (e) {
            return await ctx.reply(`Error: ${(e as Error).message}`);
        }
    });
}
