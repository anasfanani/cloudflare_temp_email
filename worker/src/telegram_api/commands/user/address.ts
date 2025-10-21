import { Context } from "hono";
import { Context as TgContext } from "telegraf";
import { CONSTANTS } from "../../../constants";
import { bindTelegramAddress, deleteTelegramAddress, jwtListToAddressData, tgUserNewAddress, unbindTelegramAddress } from "../../common";
import i18n from "../../../i18n";

export function registerAddressCommands(bot: any, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    bot.command("new", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            // @ts-ignore
            const address = ctx?.message?.text.slice("/new".length).trim();
            const res = await tgUserNewAddress(c, userId.toString(), address);
            return await ctx.reply(`${t.createSuccess}`
                + `${t.address}${res.address}\n`
                + (res.password ? `${t.password}\`${res.password}\`\n` : '')
                + `${t.credential}\`${res.jwt}\`\n`,
                {
                    parse_mode: "Markdown"
                }
            );
        } catch (e) {
            return await ctx.reply(`${t.createFailed}${(e as Error).message}`);
        }
    });

    bot.command("bind", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            // @ts-ignore
            const jwt = ctx?.message?.text.slice("/bind".length).trim();
            if (!jwt) {
                return await ctx.reply(t.pleaseInputCredential);
            }
            const address = await bindTelegramAddress(c, userId.toString(), jwt);
            return await ctx.reply(`${t.bindSuccess}`
                + `${t.address}${address}`
            );
        }
        catch (e) {
            return await ctx.reply(`${t.bindFailed}${(e as Error).message}`);
        }
    });

    bot.command("unbind", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            // @ts-ignore
            const address = ctx?.message?.text.slice("/unbind".length).trim();
            if (!address) {
                return await ctx.reply(t.pleaseInputAddress);
            }
            await unbindTelegramAddress(c, userId.toString(), address);
            return await ctx.reply(`${t.unbindSuccess}${address}`
            );
        }
        catch (e) {
            return await ctx.reply(`${t.unbindFailed}${(e as Error).message}`);
        }
    })

    bot.command("delete", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            // @ts-ignore
            const address = ctx?.message?.text.slice("/delete".length).trim();
            if (!address) {
                return await ctx.reply(t.pleaseInputAddress);
            }
            await deleteTelegramAddress(c, userId.toString(), address);
            return await ctx.reply(`${t.deleteSuccess}${address}`);
        } catch (e) {
            return await ctx.reply(`${t.deleteFailed}${(e as Error).message}`);
        }
    });

    bot.command("address", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            const jwtList = await c.env.KV.get<string[]>(`${CONSTANTS.TG_KV_PREFIX}:${userId}`, 'json') || [];
            const { addressList } = await jwtListToAddressData(c, jwtList);
            return await ctx.reply(`${t.addressList}`
                + addressList.map(a => `${t.address}${a}`).join("\n")
            );
        } catch (e) {
            return await ctx.reply(`${t.getAddressListFailed}${(e as Error).message}`);
        }
    });

    bot.command("cleaninvalidaddress", async (ctx: TgContext) => {
        const userId = ctx?.message?.from?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        try {
            const jwtList = await c.env.KV.get<string[]>(`${CONSTANTS.TG_KV_PREFIX}:${userId}`, 'json') || [];
            const { invalidJwtList } = await jwtListToAddressData(c, jwtList);
            const newJwtList = jwtList.filter(jwt => !invalidJwtList.includes(jwt));
            await c.env.KV.put(`${CONSTANTS.TG_KV_PREFIX}:${userId}`, JSON.stringify(newJwtList));
            const { addressList } = await jwtListToAddressData(c, newJwtList);
            return await ctx.reply(`${t.cleanSuccess}`
                + `${t.currentAddressList}`
                + addressList.map(a => `${t.address}${a}`).join("\n")
            );
        } catch (e) {
            return await ctx.reply(`${t.cleanFailed}${(e as Error).message}`);
        }
    });
}
