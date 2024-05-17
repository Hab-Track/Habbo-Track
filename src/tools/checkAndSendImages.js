const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Webhook URL is not set. Please set it in your workflow secrets.');
  process.exit(1);
}

// Function to check if a file is an image
function isImage(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  return imageExtensions.includes(path.extname(file).toLowerCase());
}

// Get the list of modified files in the last commit
const lastCommitFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD')
  .toString()
  .trim()
  .split('\n');

const imageFiles = lastCommitFiles.filter(isImage);

if (imageFiles.length === 0) {
  console.log('No new images found in the last commit.');
  process.exit(0);
}

// Send each image to the webhook
imageFiles.forEach(async (file) => {
  const fileName = path.basename(file);
  const fileData = fs.readFileSync(file);

  try {
    await axios.post(webhookUrl, {
      fileName: fileName,
      fileData: fileData.toString('base64')
    });
    console.log(`Successfully sent ${fileName} to the webhook.`);
  } catch (error) {
    console.error(`Failed to send ${fileName}:`, error);
  }
});
