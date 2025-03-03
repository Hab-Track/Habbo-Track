#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { getProd, config } = require('./habbo/functions')
const DiscordBot = require('./tools/discord-bot')
const processVars = require('./tools/utils/send_vars')
const processImages = require('./tools/utils/send_images')
require('dotenv').config()

process.exit = (o => code => {
    console.warn(`process.exit(${code}) was called, but intercepted`);
    console.trace()
})(process.exit);

async function processCommand(cmd, domain, bot) {
    if (domain) {
        config.domain = domain;
    }
    await require(`./command/${cmd}`)();
    await processVars(bot);
    if (cmd !== 'gamedata') {
        await processImages(bot);
    }
}

async function main() {
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error('DISCORD_BOT_TOKEN is not set in .env file');
        return;
    }
    if (!await getProd()) {
        return;
    }

    const command = argv.c || argv.command
    const customDomain = argv.d || argv.domain
    const domains = customDomain ? [customDomain] : [
        'com.br', 'com.tr', 'com',
        'de', 'es', 'fi',
        'fr', 'it', 'nl'
    ]
    const commands = ['gamedata', 'badges', 'clothes', 'effects', 'furnitures']

    try {
        const bot = new DiscordBot();
        await bot.initialize();

        if (!command) {
            for (const cmd of commands) {
                if (cmd === 'gamedata') {
                    for (const domain of domains) {
                        await processCommand(cmd, domain, bot);
                    }
                } else {
                    await processCommand(cmd, null, bot);
                }
            }
        } else if (command === 'gamedata') {
            for (const domain of domains) {
                await processCommand(command, domain, bot);
            }
        } else {
            await processCommand(command, null, bot);
        }

        await bot.sendAllMessages();
    } catch (err) {
        console.error("huehuebr") // I forgot this lmao
        console.error(err)
    } finally {
        process.exitCode = 0
    }
}

main()