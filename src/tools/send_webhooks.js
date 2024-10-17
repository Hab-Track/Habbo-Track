const { WebhookClient } = require('discord.js');
const sendCommitEmbed = require('./utils/new_commit');
const sendImagesToWebhook = require('./utils/send_images');
const sendVars = require('./utils/send_vars');
const argv = require('minimist')(process.argv.slice(2))

const webhook_img = process.env.WEBHOOK_IMG;
const webhook_txt = process.env.WEBHOOK_TXT;

if (!webhook_img || !webhook_txt) {
    const missing = [];
    if (!webhook_img) missing.push('WEBHOOK_IMG');
    if (!webhook_txt) missing.push('WEBHOOK_TXT');
    console.error(
        `${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not set. Please set ${missing.length > 1 ? 'them' : 'it'} in your workflow secrets.`
    );
    process.exit(1);
}

const webhookClient_img = new WebhookClient({ url: webhook_img });
const webhookClient_txt = new WebhookClient({ url: webhook_txt });

// Get the commit SHA from the command line arguments, default to 'HEAD'
let commitSha = 'HEAD';
if (process.argv[2] !== '--dir') {
    commitSha = process.argv[2]
}

async function runTasks() {
    let dir;
    const d = argv.dir;

    if (d) {
        dir = d;
    }
    else {
        throw new Error('No directory specified. Please specify a directory with the --dir flag.');
    }

    // await sendCommitEmbed(commitSha, webhookClient_txt);
    await sendImagesToWebhook(commitSha, webhookClient_img);
    await sendVars(commitSha, webhookClient_txt);
}

runTasks();
