import i18n from "../../i18n";

export const getCommands = (lang: string) => {
    const t = i18n.getTelegramMessages(lang);
    return [
        { command: "start", description: t.commands.start },
        { command: "new", description: t.commands.new },
        { command: "address", description: t.commands.address },
        { command: "bind", description: t.commands.bind },
        { command: "unbind", description: t.commands.unbind },
        { command: "delete", description: t.commands.delete },
        { command: "mails", description: t.commands.mails },
        { command: "cleaninvalidaddress", description: t.commands.cleaninvalidaddress },
        { command: "admin", description: t.commands.admin },
    ];
}

export async function initTelegramBotCommands(bot: any, lang: string = "en") {
    const COMMANDS = getCommands(lang);
    await bot.telegram.setMyCommands(COMMANDS);
}
