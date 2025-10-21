import { Context } from "hono";
import { registerAdminCommand } from "./menu";

export function registerAdminCommands(bot: any, c: Context<HonoCustomType>) {
    registerAdminCommand(bot, c);
}

export { handleAdminStats } from "./stats";
export { handleAdminUsers } from "./users";
export { handleAdminBroadcast } from "./broadcast";
export { handleAdminSettings } from "./settings";
export { handleAdminChats } from "./chats";
