import { Context } from "hono";
import { registerStartCommand } from "./start";
import { registerAddressCommands } from "./address";
import { registerMailCommand } from "./mail";

export function registerUserCommands(bot: any, c: Context<HonoCustomType>) {
    registerStartCommand(bot, c);
    registerAddressCommands(bot, c);
    const { queryMail } = registerMailCommand(bot, c);
    return { queryMail };
}
