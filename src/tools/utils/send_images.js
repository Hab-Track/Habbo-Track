const path = require('path');
const { isImage, formatName, getLastCommitFiles, getLastCommitSha } = require('./utils')

async function processImages(bot) {
    const lastCommitFiles = getLastCommitFiles(getLastCommitSha())
  console.log('Modified files in the commit:', lastCommitFiles);

  const imageFiles = lastCommitFiles.filter(isImage);

  if (imageFiles.length === 0) {
    console.log('No new images found in the commit.');
    return;
  }

  for (const file of imageFiles) {
    const filePath = path.resolve(file);
    const messageContent = formatName(filePath);

    bot.queueImageMessage({
      content: messageContent,
      files: [filePath]
    });
  }
}

module.exports = processImages;
