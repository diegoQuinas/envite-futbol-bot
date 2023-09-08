"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const express_1 = __importDefault(require("express"));
const textEffects_1 = require("./textEffects");
// Create a bot using the Telegram token
const bot = new grammy_1.Bot(process.env.TELEGRAM_TOKEN || '');
// Handle the /yo command to greet the user
bot.command('yo', (ctx) => { var _a; return ctx.reply(`Yo ${(_a = ctx.from) === null || _a === void 0 ? void 0 : _a.username}`); });
const allEffects = [
    {
        code: 'w',
        label: 'Monospace',
    },
    {
        code: 'b',
        label: 'Bold',
    },
    {
        code: 'i',
        label: 'Italic',
    },
    {
        code: 'd',
        label: 'Doublestruck',
    },
    {
        code: 'o',
        label: 'Circled',
    },
    {
        code: 'q',
        label: 'Squared',
    },
];
const effectCallbackCodeAccessor = (effectCode) => `effect-${effectCode}`;
const effectsKeyboardAccessor = (effectCodes) => {
    const effectsAccessor = (effectCodes) => effectCodes.map((code) => allEffects.find((effect) => effect.code === code));
    const effects = effectsAccessor(effectCodes);
    const keyboard = new grammy_1.InlineKeyboard();
    return keyboard;
};
const textEffectResponseAccessor = (originalText, modifiedText) => `Original: ${originalText}` +
    (modifiedText ? `\nModified: ${modifiedText}` : '');
const parseTextEffectResponse = (response) => {
    const originalText = response.match(/Original: (.*)/)[1];
    const modifiedTextMatch = response.match(/Modified: (.*)/);
    let modifiedText;
    if (modifiedTextMatch)
        modifiedText = modifiedTextMatch[1];
    if (!modifiedTextMatch)
        return { originalText };
    else
        return { originalText, modifiedText };
};
bot.command('effect', (ctx) => ctx.reply(textEffectResponseAccessor(ctx.match), {
    reply_markup: effectsKeyboardAccessor(allEffects.map((effect) => effect.code)),
}));
// Handle inline queries
const queryRegEx = /effect (monospace|bold|italic) (.*)/;
bot.inlineQuery(queryRegEx, async (ctx) => {
    var _a;
    const fullQuery = ctx.inlineQuery.query;
    const fullQueryMatch = fullQuery.match(queryRegEx);
    if (!fullQueryMatch)
        return;
    const effectLabel = fullQueryMatch[1];
    const originalText = fullQueryMatch[2];
    const effectCode = (_a = allEffects.find((effect) => effect.label.toLowerCase() === effectLabel.toLowerCase())) === null || _a === void 0 ? void 0 : _a.code;
    const modifiedText = (0, textEffects_1.applyTextEffect)(originalText, effectCode);
    await ctx.answerInlineQuery([
        {
            type: 'article',
            id: 'text-effect',
            title: 'Text Effects',
            input_message_content: {
                message_text: `Original: ${originalText}
Modified: ${modifiedText}`,
                parse_mode: 'HTML',
            },
            reply_markup: new grammy_1.InlineKeyboard().switchInline('Share', fullQuery),
            url: 'http://t.me/EludaDevSmarterBot',
            description: 'Create stylish Unicode text, all within Telegram.',
        },
    ], { cache_time: 30 * 24 * 3600 } // one month in seconds
    );
});
// Return empty result list for other queries.
bot.on('inline_query', (ctx) => ctx.answerInlineQuery([]));
// Handle text effects from the effect keyboard
for (const effect of allEffects) {
    const allEffectCodes = allEffects.map((effect) => effect.code);
    bot.callbackQuery(effectCallbackCodeAccessor(effect.code), async (ctx) => {
        var _a;
        const { originalText } = parseTextEffectResponse(((_a = ctx.msg) === null || _a === void 0 ? void 0 : _a.text) || '');
        const modifiedText = (0, textEffects_1.applyTextEffect)(originalText, effect.code);
        await ctx.editMessageText(textEffectResponseAccessor(originalText, modifiedText), {
            reply_markup: effectsKeyboardAccessor(allEffectCodes.filter((code) => code !== effect.code)),
        });
    });
}
// Handle the /about command
const aboutUrlKeyboard = new grammy_1.InlineKeyboard().url('Host your own bot for free.', 'https://cyclic.sh/');
// Suggest commands in the menu
bot.api.setMyCommands([
    { command: 'yo', description: 'Be greeted by the bot' },
    {
        command: 'effect',
        description: 'Apply text effects on the text. (usage: /effect [text])',
    },
]);
// Handle all other messages and the /start command
const introductionMessage = `Hello! I'm a Telegram bot.
I'm powered by Cyclic, the next-generation serverless computing platform.

<b>Commands</b>
/yo - Be greeted by me
/effect [text] - Show a keyboard to apply text effects to [text]`;
const replyWithIntro = (ctx) => ctx.reply(introductionMessage, {
    reply_markup: aboutUrlKeyboard,
    parse_mode: 'HTML',
});
bot.catch((ctx) => {
    console.log(ctx.message);
});
bot.command('start', replyWithIntro);
bot.on('message', replyWithIntro);
// Start the server
if (process.env.NODE_ENV === 'production') {
    // Use Webhooks for the production server
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, grammy_1.webhookCallback)(bot, 'express'));
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Bot listening on port ${PORT}`);
    });
}
else {
    // Use Long Polling for development
    bot.start();
}
