const path = require('path');
const { isImage, formatName, getLastCommitFiles } = require('../../tools/utils/utils')

async function sendImagesToWebhook(commitSha, webhookClient) {
  // Get the list of modified files in the specified commit
  const lastCommitFiles = getLastCommitFiles(commitSha)

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
    const messageContent = formatName(filePath);

    const payload = {
      content: messageContent,
      files: [filePath],
    };

    await webhookClient.send(payload);
    console.log(`File ${fileName} sent.`);
  }
}

module.exports = sendImagesToWebhook;
