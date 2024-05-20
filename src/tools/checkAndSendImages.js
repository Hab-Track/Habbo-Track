const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Webhook URL is not set. Please set it in your workflow secrets.');
  process.exit(1);
}

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

// Function to remove the file extension
function formatName(filePath) {
  const resourceIndex = filePath.indexOf('resource');
  const pathAfterResource = resourceIndex !== -1 ? filePath.substring(resourceIndex + 'resource'.length + 1) : filePath;
  return pathAfterResource.substring(0, pathAfterResource.lastIndexOf('.')) || pathAfterResource;
}


// Send each image to the webhook
imageFiles.forEach(async (file) => {
  const fileName = path.basename(file);
  const filePath = path.resolve(file);
  const fileContent = fs.readFileSync(filePath);

  const formData = new FormData();
  formData.append('content', `> ${formatName(filePath)}`);
  formData.append('file1', fileContent, fileName);

  try {
    await axios.post(webhookUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
    });
    console.log(`Successfully sent ${fileName} to the webhook.`);
  } catch (error) {
    console.error(`Failed to send ${fileName}:`, error.response ? error.response.data : error.message);
  }
});