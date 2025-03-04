const { execSync } = require('child_process');
const path = require('path')

function getLastCommitFiles() {
  return execSync(`git ls-files --modified --others --exclude-standard`)
    .toString()
    .trim()
    .split('\n');
}

function isImage(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  return imageExtensions.includes(path.extname(file).toLowerCase());
}

function formatLabel(type, domain, name) {
  if (type === 'Vars') {
    return `> ${name}`;
  }
  
  if (domain) {
    return `> ${type} (${domain}): ${name}`;
  }

  return `> ${type}: ${name}`;
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
  return formatLabel(type, domain, name);
}

function getAllFilesDiff() {
  const modifiedFiles = getLastCommitFiles();
  let fullDiff = [];

  for (const file of modifiedFiles) {
    if (!file) continue;
    
    try {
      fullDiff.push(`diff --git a/${file} b/${file}`);
      const diff = execSync(`git diff -- "${file}"`).toString();
      fullDiff.push(...diff.split('\n'));
    } catch (error) {
      console.error(`Error getting diff for ${file}:`, error);
    }
  }

  return fullDiff;
}

function generateDiscordDiffMessages() {
  const fileToMessagesMap = new Map()
  const characterLimit = 1800 // max character amount in a single message
  let currentFile
  let message

  const lines = getAllFilesDiff();

  for (const line of lines) {
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

module.exports = { isImage, formatName, generateDiscordDiffMessages, getLastCommitFiles }