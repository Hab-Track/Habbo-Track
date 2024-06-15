const { execSync } = require('child_process');

async function isInFolder(folderName, commitSha) {
    const commitFiles = execSync(`git diff-tree --no-commit-id --name-only -r ${commitSha}`)
        .toString()
        .trim()
        .split('\n');

    return commitFiles.some(file => file.startsWith(folderName))
}

module.exports = isInFolder;