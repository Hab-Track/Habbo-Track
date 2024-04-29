const fetchh = require('node-fetch')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const { XMLParser } = require('fast-xml-parser')
const swf2png = require('swf2png/src/convert_swf.js')
const { name } = require('swf-parser/errors/incomplete-stream')

const config = {
  sockets: 100,
  domain: 'com',
  format: 'png',
  revision: false,
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
      return response;
    })
    .catch((err) => {
      console.log("Unable to fetch -", err);
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

  if (await fileExists(dst) && replace === false) {
    return `skipped: ${src}`
  }

  let buffer = (await fetchRaw(src).then(r => r.buffer()))

  if (dst.endsWith('.swf')) {
    try {
      res = await swf2png(buffer)
      dst.replace('.swf', '.png')
    } catch (err) {
      let name = dst.split("/").pop()
      return `Unable to convert ${name}`
    }
  }

  await fs.promises.mkdir(path.dirname(dst), { recursive: true })
  await pipeline(buffer, fs.createWriteStream(dst))

  return `${dst.split("/").pop()} ${src}`
}

async function fetchMany(all, replace = false) {
  await Promise.allSettled(
    all.map((v) => fetchOne(v.src, v.dst, replace)
      .then(console.log)
      .catch((err) => console.log(err.message))
    )
  )
}

async function parseXml(txt) {
  return parser.parse(txt)
}


async function initConfig(argv) {
  const c = argv.c || argv.command
  const d = argv.d || argv.domain
  const s = argv.s || argv.sockets
  const f = argv.f || argv.format
  const r = argv.r || argv.revision
  const o = argv.o || argv.output

  if (d) config.domain = d
  if (s) config.sockets = s
  if (r) config.revision = r
  if (o) config.output = o

  if (c === 'badges' && f === 'gif') {
    config.format = 'gif'
  }

  config.prod = (await fetchText(`https://www.habbo.${config.domain}/gamedata/external_variables/0`)).match(/flash\.client\.url=.+(flash-assets-[^/]+)/mi)[1]
}

module.exports = { fetchText, fetchJson, fetchOne, fetchMany, parseXml, initConfig, config }
