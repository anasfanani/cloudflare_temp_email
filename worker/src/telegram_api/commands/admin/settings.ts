import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../../constants";
import { TelegramSettings } from "../../settings";

export async function handleAdminSettings(ctx: TgContext, c: Context<HonoCustomType>) {
    const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    const message = `⚙️ Bot Settings\n\n`
        + `Allow List: ${settings?.enableAllowList ? '✅ Enabled' : '❌ Disabled'} (${settings?.allowList?.length || 0} users)\n`
        + `Admin List: ${settings?.adminList?.length || 0} admins\n`
        + `Global Mail Push: ${settings?.enableGlobalMailPush ? '✅ Enabled' : '❌ Disabled'} (${settings?.globalMailPushList?.length || 0} users)\n`
        + `Mini App URL: ${settings?.miniAppUrl ? '✅ Set' : '❌ Not set'}\n\n`
        + `Chat Types:\n`
        + `👤 Private: ${settings?.allowPrivateChat !== false ? '✅' : '❌'}\n`
        + `👥 Group: ${settings?.allowGroupChat ? '✅' : '❌'}\n`
        + `👥 Supergroup: ${settings?.allowSuperGroupChat ? '✅' : '❌'}\n`;
    
    const buttons = [
        [
            Markup.button.callback(
                settings?.enableAllowList ? '🔓 Disable Allow List' : '🔒 Enable Allow List',
                'setting_toggle_allowlist'
            )
        ],
        [
            Markup.button.callback(
                settings?.enableGlobalMailPush ? '🔕 Disable Mail Push' : '🔔 Enable Mail Push',
                'setting_toggle_mailpush'
            )
        ],
        [
            Markup.button.callback(
                settings?.allowPrivateChat !== false ? '👤 Disable Private' : '👤 Enable Private',
                'setting_toggle_private'
            ),
            Markup.button.callback(
                settings?.allowGroupChat ? '👥 Disable Group' : '👥 Enable Group',
                'setting_toggle_group'
            )
        ],
        [
            Markup.button.callback(
                settings?.allowSuperGroupChat ? '👥 Disable Supergroup' : '👥 Enable Supergroup',
                'setting_toggle_supergroup'
            )
        ],
        [
            Markup.button.callback('👥 Manage Allow List', 'setting_manage_allowlist'),
            Markup.button.callback('👨‍💼 Manage Admins', 'setting_manage_admins')
        ],
        [
            Markup.button.callback('📧 Manage Push List', 'setting_manage_pushlist')
        ],
        [
            Markup.button.callback('🔙 Back to More', 'admin_more')
        ]
    ];
    
    if (ctx.callbackQuery) {
        return await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
    }
    return await ctx.reply(message, Markup.inlineKeyboard(buttons));
}
