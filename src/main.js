#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const { getProd } = require('./habbo/functions')
const DiscordBot = require('./tools/discord-bot')
const processVars = require('./tools/utils/send_vars')
const processImages = require('./tools/utils/send_images')
require('dotenv').config()

process.exit = (o => code => {
    console.warn(`process.exit(${code}) was called, but intercepted`);
    console.trace()
})(process.exit);

async function processCommand(cmd, domain, bot, prod_version) {
    if (domain) {
        await require(`./habbo/command/gamedata`)(domain ,prod_version);
    }
    else {
        await require(`./habbo/command/${cmd}`)(prod_version);
    }
}

async function main() {
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error('DISCORD_BOT_TOKEN is not set in .env file');
        return;
    }
    prod_version = await getProd();
    if (!prod_version) {
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
                console.time(`Processing cmd ${cmd} (${domains.length} domains)`);
                if (cmd === 'gamedata') {
                    for (const domain of domains) {
                        await processCommand(cmd, domain, bot, prod_version);
                    }
                } else {
                    await processCommand(cmd, null, bot, prod_version);
                }
                console.timeEnd(`Processing cmd ${cmd} (${domains.length} domains)`);
            }
        } else if (command === 'gamedata') {
            console.time(`Processing gamedata (${domains.length} domains)`);
            for (const domain of domains) {
                await processCommand(command, domain, bot, prod_version);
            }
            console.timeEnd(`Processing gamedata (${domains.length} domains)`);
        } else {
            await processCommand(command, null, bot, prod_version);
        }

        await processVars(bot);
        await processImages(bot);
        console.time('Sending all messages');
        await bot.sendAllMessages();
        console.timeEnd('Sending all messages');
    } catch (err) {
        console.error("huehuebr") // I forgot this lmao
        console.error(err)
    } finally {
        process.exitCode = 0
    }
}

main()