const { execSync } = require('child_process');
const path = require('path')

function getCommitDetails(commitSha) {
    const commitDetails = execSync(`git show -s --format="%H;%an;%s" ${commitSha}`).toString().trim();
    const [sha, authorName, subject] = commitDetails.split(';');
    return { sha, authorName, subject };
  }
  
  function getBranchName() {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }
  
  function getUserAvatar() {
    return "https://i.imgur.com/lSCFcFQ.gif"
  }
  
  function getLastCommitFiles(commitSha) {
    return execSync(`git diff-tree --no-commit-id --name-only -r ${commitSha}`)
    .toString()
    .trim()
    .split('\n');
  }
  
  function isImage(file) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    return imageExtensions.includes(path.extname(file).toLowerCase());
  }
  
  function formatName(filePath) {
    // examples: "> (com.br) 14XR1.png" and "> acc_chest_anubisbackpack.png"
    const domains = [
      'com.br', 'com.tr', 'com',
      'de', 'es', 'fi',
      'fr', 'it', 'nl'
    ]
  
    const parts = filePath.includes('/') ? filePath.split('/') : filePath.split('\\')
    const domain = domains.filter((d) => parts.includes(d)).pop()
    const name = path.basename(filePath)
    return domain ? `> (${domain}) ${name}` : `> ${name}`
  }

  module.exports = { getCommitDetails, getBranchName, getUserAvatar, getLastCommitFiles, isImage, formatName }