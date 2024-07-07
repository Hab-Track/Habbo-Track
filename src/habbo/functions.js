const fetchh = require('node-fetch')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const { XMLParser } = require('fast-xml-parser')
const swf2png = require('swf2png/src/convert_swf.js')
const { execSync } = require('child_process');

const config = {
  sockets: 100,
  domain: 'com',
  format: 'png',
  prod: false,
  output: './resource',
}

const opt = {
  agent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 24000,
    maxSockets: 100,
    scheduling: 'fifo',
  })
}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseNodeValue: false,
})

async function fileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK)
    return true
  } catch (err) {
    return false
  }
}

function fetchRaw(src) {
  return fetchh(src, opt)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Status ${response.status} for ${src}`);
      }
      return response;
    })
    .catch((err) => {
      throw err;
    });
}

async function fetchText(src) {
  const res = await fetchRaw(src)
  return await res.text()
}

async function fetchJson(src) {
  const res = await fetchRaw(src)
  return await res.json()
}


async function fetchOne(src, dst, replace = false) {
  dst = path.join(config.output, dst)
  let png_name = dst.replace('.swf', '.png')

  if ((await fileExists(dst) || await fileExists(png_name)) && replace === false) {
    return
  }  

  let res
  await fs.promises.mkdir(path.dirname(dst), { recursive: true })

  if (dst.endsWith('.swf')) {
    try {
      res = (await fetchRaw(src).then(r => r.buffer()))
      res = await swf2png(res).then(spritesheet => spritesheet.createPNGStream())
      await res.pipe(fs.createWriteStream(png_name))
      console.log(`Converted ${png_name.split("/").pop()}`)
      return
    } catch (err) {
      let name = dst.split("/").pop()
      console.error(`Unable to convert ${name}`)
    }
  }

  res = await fetchRaw(src)
  await pipeline(res.body, fs.createWriteStream(dst))
  console.log(`Downloaded ${dst.split("/").pop()}`)
}

async function fetchMany(all, replace = false) {
  await Promise.allSettled(
    all.map((v) => fetchOne(v.src, v.dst, replace)
      .catch((err) => console.error(err.message))
    )
  )
}

async function parseXml(txt) {
  return parser.parse(txt)
}


async function initConfig(argv) {
  const o = argv.o || argv.output

  if (o) config.output = o

  config.prod = (await fetchText(`https://www.habbo.${config.domain}/gamedata/external_variables/0`)).match(/flash\.client\.url=.+(flash-assets-[^/]+)/mi)[1]
}

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

module.exports = { fetchText, fetchJson, fetchOne, fetchMany, parseXml, initConfig, config, getCommitDetails,
                   getBranchName, getUserAvatar, getLastCommitFiles, isImage, formatName }
