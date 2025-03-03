const { execSync, spawnSync } = require('child_process');
const path = require('path')

function getLastCommitSha() {
  return execSync('git rev-parse HEAD').toString().trim();
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
  // examples: "> Badge (com.br): 14XR1" and "> Clothe: acc_chest_anubisbackpack"
  const domains = [
    'com.br', 'com.tr', 'com',
    'de', 'es', 'fi',
    'fr', 'it', 'nl'
  ]

  const types = {
    badges: 'Badge',
    clothes: 'Clothe',
    effects: 'Effect',
    furnis: 'Furni',
    gamedata: 'Vars'
  }

  const parts = filePath.includes('/') ? filePath.split('/') : filePath.split('\\')
  const domain = domains.filter((d) => parts.includes(d)).pop()
  const type = types[Object.keys(types).filter((type) => parts.includes(type)).pop()]
  const name = path.basename(filePath).substring(0, path.basename(filePath).lastIndexOf('.'))
  return domain ? `> ${type} (${domain}): ${name}` : type === 'Vars' ? `> ${name}` : `> ${type}: ${name}`
}

function getCommitLines(commitSha) {
  try {
    const result = spawnSync('git', ['show', commitSha]);
    return result.stdout.toString().trim().split('\n');
  } catch (error) {
    console.error(`Error executing git show: ${error.message}`);
    return [];
  }
}

function generateDiscordDiffMessages(commitSha) {
  const fileToMessagesMap = new Map()
  const characterLimit = 1800 // max character amount in a single message
  let currentFile
  let message
  const commitLines = getCommitLines(commitSha)
  for (const line of commitLines) {
    const match = line.match(/diff --git a\/([^ ]+)/)
    if (match) {
      if (message?.length > 7) {
        message += '\n```'
        fileToMessagesMap.get(currentFile).push(message)
      }

      fileToMessagesMap.set(match[1], [])
      currentFile = match[1]
      message = '```diff'
    }

    if ((line.startsWith('+') || line.startsWith('-')) && !(line.startsWith('+++') || line.startsWith('---'))) {
      if (message.length + line.length >= characterLimit) {
        message += '\n```';
        fileToMessagesMap.get(currentFile).push(message);
        message = '```diff';
      }
      message += `\n${line}`;
    }
  }

  if (message?.length > 7) {
    message += '\n```'
    fileToMessagesMap.get(currentFile).push(message)
  }

  return fileToMessagesMap
}

module.exports = { isImage, formatName, generateDiscordDiffMessages, getLastCommitSha, getLastCommitFiles }
