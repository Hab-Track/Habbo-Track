const { WebhookClient } = require('discord.js');
const sendCommitEmbed = require('./utils/new_commit');
const sendImagesToWebhook = require('./utils/send_images');
const sendVars = require('./utils/send_vars');
const argv = require('minimist')(process.argv.slice(2))

const webhook_img = process.env.WEBHOOK_IMG;
const webhook_txt = process.env.WEBHOOK_TXT;

if (!webhookUrl) {
    console.error('Webhook URL is not set. Please set it in your workflow secrets.');
    process.exit(1);
}

const webhookClient = new WebhookClient({ url: webhookUrl });

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

    await sendCommitEmbed(commitSha, webhook_txt);
    await sendVars(commitSha, webhook_txt);
    await sendImagesToWebhook(commitSha, webhook_img);
}

runTasks();