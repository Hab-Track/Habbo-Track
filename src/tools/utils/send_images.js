const path = require('path');
const { execSync } = require('child_process');

function isImage(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  return imageExtensions.includes(path.extname(file).toLowerCase());
}

function formatName(filePath) {
  const resourceIndex = filePath.indexOf('resource');
  const pathAfterResource = resourceIndex !== -1 ? filePath.substring(resourceIndex + 'resource'.length + 1) : filePath;
  return pathAfterResource.substring(0, pathAfterResource.lastIndexOf('.')) || pathAfterResource;
}

async function sendImagesToWebhook(commitSha, webhookClient) {
  // Get the list of modified files in the specified commit
  const lastCommitFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${commitSha}`)
    .toString()
    .trim()
    .split('\n');

  console.log('Modified files in the commit:', lastCommitFiles);

  const imageFiles = lastCommitFiles.filter(isImage);

  if (imageFiles.length === 0) {
    console.log('No new images found in the commit.');
    return;
  }

  // Send each image to the webhook
  for (const file of imageFiles) {
    const fileName = path.basename(file);
    const filePath = path.resolve(file);
    const messageContent = `> ${formatName(filePath)}`;

    const payload = {
      content: messageContent,
      files: [filePath],
    };

    await webhookClient.send(payload);
    console.log(`File ${fileName} sent.`);
  }
}

module.exports = sendImagesToWebhook;