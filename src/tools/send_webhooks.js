const { WebhookClient } = require('discord.js');
const { execSync } = require('child_process');
const sendCommitEmbed = require('./utils/new_commit');
const sendImagesToWebhook = require('./utils/send_images');
const isInFolder = require('./utils/in_folder');

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
    console.error('Webhook URL is not set. Please set it in your workflow secrets.');
    process.exit(1);
}

const webhookClient = new WebhookClient({ url: webhookUrl });

// Get the commit SHA from the command line arguments, default to 'HEAD'
const commitSha = process.argv[2] || 'HEAD';

async function runTasks() {
    const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    if (branchName !== 'main') {
        console.log(`Commit ${sha} is not in the 'main' branch. Skipping webhook.`);
        return;
    }

    if (!isInFolder('resource/', commitSha)) {
        console.log(`Commit ${sha} does not affect files in 'resource/'. Skipping webhook.`);
        return;
    }

    await sendCommitEmbed(commitSha, webhookClient, branchName);
    await sendImagesToWebhook(commitSha, webhookClient);
}

runTasks();