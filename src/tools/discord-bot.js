const { Client } = require('discord.js');
const channels = require('../config/channels');
const path = require('path');

class DiscordBot {
    constructor() {
        this.client = new Client({
            intents: ['Guilds', 'GuildMessages']
        });
        this.messageQueue = {
            commits: [],
            images: [],
            text: new Map()
        };
    }

    async initialize() {
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
        this.channels = {
            images: await this.client.channels.fetch(channels.images),
            text: new Map()
        };

        for (const [domain, channelId] of Object.entries(channels.text)) {
            this.channels.text.set(domain, await this.client.channels.fetch(channelId));
        }

        console.log('Bot initialized');
    }

    queueTextMessage(message, filePath) {
        const pathParts = filePath.split(path.sep);
        const domainIndex = pathParts.indexOf('gamedata') + 1;

        if (domainIndex > 0 && domainIndex < pathParts.length) {
            const domain = pathParts[domainIndex];
            if (!this.messageQueue.text.has(domain)) {
                this.messageQueue.text.set(domain, []);
            }
            this.messageQueue.text.get(domain).push(message);
        }
    }

    queueImageMessage(message) {
        this.messageQueue.images.push(message);
    }

    async sendTextToChannel(channel, messages, domain) {
        if (channel.isThread() && channel.archived) {
            console.log(`Unarchiving thread for ${domain}...`);
            await channel.setArchived(false);
        }

        for (const message of messages) {
            await channel.send(message);
        }
    }

    async sendAllMessages() {
        try {
            for (const message of this.messageQueue.images) {
                await this.channels.images.send(message);
            }

            for (const [domain, messages] of this.messageQueue.text.entries()) {
                const channel = this.channels.text.get(domain);
                if (channel) {
                    console.log(`Sending messages for domain: ${domain}`);
                    await this.sendTextToChannel(channel, messages, domain);
                }
            }

            console.log('All messages sent successfully');
        } catch (error) {
            console.error('Error sending messages:', error);
        } finally {
            await this.client.destroy();
        }
    }
}

module.exports = DiscordBot;