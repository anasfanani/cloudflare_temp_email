import { Context } from "hono";
import { commonParseMail } from "../../common";
import i18n from "../../i18n";

export async function parseMail(
    parsedEmailContext: ParsedEmailContext,
    address: string, 
    created_at: string | undefined | null,
    lang: string = "en",
    c?: Context<HonoCustomType>
) {
    const t = i18n.getTelegramMessages(lang);
    if (!parsedEmailContext.rawEmail) {
        return {};
    }
    try {
        const parsedEmail = await commonParseMail(parsedEmailContext);
        let parsedText = parsedEmail?.text || "";
        if (parsedText.length && parsedText.length > 1000) {
            parsedText = parsedEmail?.text.substring(0, 1000) + t.messageTooLong;
        }
        return {
            isHtml: false,
            mail: `${t.from}${parsedEmail?.sender || t.noSender}\n`
                + `${t.to}${address}\n`
                + (created_at ? `${t.date}${created_at}\n` : "")
                + `${t.subject}${parsedEmail?.subject}\n`
                + `${t.content}${parsedText || t.parseFailed}`
        };
    } catch (e) {
        return {
            isHtml: false,
            mail: `${t.parseMailFailed}${(e as Error).message}`
        };
    }
}
