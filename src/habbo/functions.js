const fetchh = require('node-fetch')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { XMLParser } = require('fast-xml-parser')
const { formatTxt } = require('./make_ouput_format')

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
      console.error(err.message);
    });
}

async function fetchText(src) {
  const res = await fetchRaw(src)
  if (!res) {
    throw new Error(`Failed to fetch ${src}`)
  }

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

  let res = await fetchRaw(src)
  await fs.promises.mkdir(path.dirname(dst), { recursive: true })

  await formatTxt(dst, res, png_name)

  console.log(`Downloaded ${dst.split("/").pop()}`)
}

async function fetchMany(all, replace = false) {
  await Promise.allSettled(
    all.map((v) => fetchOne(v.src, v.dst, replace)
      .catch((err) => console.error(err))
    )
  )
}

async function parseXml(txt) {
  return parser.parse(txt)
}


async function initConfig(argv) {
  const o = argv.o || argv.output

  if (o) config.output = o

  try {
    config.prod = (await fetchText(`https://www.habbo.${config.domain}/gamedata/external_variables/0`)).match(/flash\.client\.url=.+(flash-assets-[^/]+)/mi)[1]
    return true
  } catch (err) {
    console.error(err)
    console.error("Cant get config prod, maybe habbo down")
    return false
  }
}

module.exports = { fetchText, fetchJson, fetchOne, fetchMany, parseXml, initConfig, config }