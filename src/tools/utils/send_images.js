const path = require('path');
const { isImage, formatName, getLastCommitFiles } = require('./utils')

async function processImages(bot) {
  const lastCommitFiles = getLastCommitFiles()
  console.log('Modified files in the commit:', lastCommitFiles);

  const imageFiles = lastCommitFiles.filter(isImage);

  if (imageFiles.length === 0) {
    console.log('No new images found in the commit.');
    return;
  }

  console.time(`Processing ${imageFiles.length} image(s)`);
  for (const file of imageFiles) {
    const filePath = path.resolve(file);
    const messageContent = formatName(filePath);

    bot.queueImageMessage({
      content: messageContent,
      files: [filePath]
    });
  }
  console.timeEnd(`Processing ${imageFiles.length} image(s)`);
}

module.exports = processImages;
