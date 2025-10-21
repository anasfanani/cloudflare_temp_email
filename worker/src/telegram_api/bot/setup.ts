import { Context } from "hono";
import { Telegraf } from "telegraf";
import { getJsonObjectValue } from '../../utils';
import { UserFromGetMe } from "telegraf/types";
import { setupMiddleware } from "./middleware";
import { registerUserCommands } from "../commands/user";
import { registerAdminCommands } from "../commands/admin";
import { registerCallbacks } from "../handlers/callbacks";

export function newTelegramBot(c: Context<HonoCustomType>, token: string): Telegraf {
    const bot = new Telegraf(token);
    const botInfo = getJsonObjectValue<UserFromGetMe>(c.env.TG_BOT_INFO);
    
    if (botInfo) {
        bot.botInfo = botInfo;
    }

    // Setup middleware (auth, tracking)
    setupMiddleware(bot, c);

    // Register user commands
    const { queryMail } = registerUserCommands(bot, c);

    // Register admin commands
    registerAdminCommands(bot, c);

    // Register callbacks (buttons)
    registerCallbacks(bot, c, queryMail);

    return bot;
}
