const { config } = require('../../habbo/functions')
const { execSync } = require('child_process');

const domains = config.output.includes('resource') ? [
    'com.br', 'com.tr', 'com','de', 'es', 'fi','fr', 'it', 'nl'] : ['com.br', 'com', 'es']

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

function formatName(filePath, fileName) {
    // examples: "> (com.br) 14XR1" and "> acc_chest_anubisbackpack"
    const parts = filePath.includes('/') ? filePath.split('/') : filePath.split('\\')
    const domain = domains.filter((d) => parts.includes(d)).pop()
    const name = fileName.substring(0, fileName.lastIndexOf('.'))
    return domain ? `> (${domain}) ${name}` : `> ${name}`
}

module.exports = { domains, getCommitDetails, getBranchName, getUserAvatar, getLastCommitFiles, isImage, formatName }