const { WebhookClient } = require('discord.js');
const sendCommitEmbed = require('./utils/new_commit');
const sendImagesToWebhook = require('./utils/send_images');

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
    console.error('Webhook URL is not set. Please set it in your workflow secrets.');
    process.exit(1);
}

const webhookClient = new WebhookClient({ url: webhookUrl });

// Get the commit SHA from the command line arguments, default to 'HEAD'
const commitSha = process.argv[2] || 'HEAD';

async function runTasks() {
    await sendCommitEmbed(commitSha, webhookClient);
    await sendImagesToWebhook(commitSha, webhookClient);
}

runTasks();