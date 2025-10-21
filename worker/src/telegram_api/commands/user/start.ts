import { Context } from "hono";
import { Context as TgContext } from "telegraf";
import { getDomains, getStringValue } from '../../../utils';
import i18n from "../../../i18n";
import { getCommands } from "../../bot/commands";

export function registerStartCommand(bot: any, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);
    const COMMANDS = getCommands(lang);

    bot.command("start", async (ctx: TgContext) => {
        const prefix = getStringValue(c.env.PREFIX)
        const domains = getDomains(c);
        return await ctx.reply(
            t.welcome
            + (prefix ? `${t.currentPrefix}${prefix}\n` : '')
            + `${t.currentDomains}${JSON.stringify(domains)}\n`
            + t.pleaseUseCommands
            + COMMANDS.map(c => `/${c.command}: ${c.description}`).join("\n")
        );
    });
}
