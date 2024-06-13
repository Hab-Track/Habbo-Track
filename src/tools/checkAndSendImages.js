const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { WebhookClient } = require('discord.js');

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Webhook URL is not set. Please set it in your workflow secrets.');
  process.exit(1);
}

const webhookClient = new WebhookClient({ url: webhookUrl });

// Get the commit SHA from the command line arguments, default to 'HEAD'
const commitSha = process.argv[2] || 'HEAD';

function isImage(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  return imageExtensions.includes(path.extname(file).toLowerCase());
}

// Get the list of modified files in the specified commit
const lastCommitFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${commitSha}`)
  .toString()
  .trim()
  .split('\n');

console.log('Modified files in the commit:', lastCommitFiles);

const imageFiles = lastCommitFiles.filter(isImage);

if (imageFiles.length === 0) {
  console.log('No new images found in the commit.');
  process.exit(0);
}

// Remove the file extension and format the name
function formatName(filePath) {
  const resourceIndex = filePath.indexOf('resource');
  const pathAfterResource = resourceIndex !== -1 ? filePath.substring(resourceIndex + 'resource'.length + 1) : filePath;
  return pathAfterResource.substring(0, pathAfterResource.lastIndexOf('.')) || pathAfterResource;
}

// Send each image to the webhook
imageFiles.forEach(async (file) => {
  const fileName = path.basename(file);
  const filePath = path.resolve(file);

  try {
    const messageContent = `> ${formatName(filePath)}`;

    const payload = {
      content: messageContent,
      files: [filePath],
    };

    await webhookClient.send(payload);
    console.log(`File ${fileName} sent.`);
  } catch (error) {
    console.error(`Error sending ${fileName}: `, error);
  }
});