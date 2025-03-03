const fetchh = require('node-fetch')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { XMLParser } = require('fast-xml-parser')
const { formatTxt } = require('./make_ouput_format')

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
  return await res.text()
}

async function fetchJson(src) {
  const res = await fetchRaw(src)
  return await res.json()
}


async function fetchOne(src, dst, replace = false) {
  dst = path.join("./resource", dst)
  let png_name = dst.replace('.swf', '.png')

  if ((await fileExists(dst) || await fileExists(png_name)) && replace === false) {
    return
  }

  let res = await fetchRaw(src)

  if (res) {
    await fs.promises.mkdir(path.dirname(dst), { recursive: true })
    await formatTxt(dst, res, png_name)

    console.log(`Downloaded ${dst}`)
  }
}

async function fetchMany(all, replace = false) {
  await Promise.allSettled(
    all.map((v) => fetchOne(v.src, v.dst, replace)
      .catch((err) => {
        if (!err.message?.includes('Status 404')) {
          console.error(err)
        }
      })
    )
  )
}

async function parseXml(txt) {
  return parser.parse(txt)
}

async function getProd() {
  try {
    let ext_var = await fetchText(`https://www.habbo.com/gamedata/external_variables/0`)
    prod_version = ext_var.match(/flash\.client\.url=.+(flash-assets-[^/]+)/mi)[1]
    return prod_version
  }
  catch (e) {
    console.error("Cant get config prod, maybe habbo down")
    return
  }
}

module.exports = { fetchText, fetchJson, fetchOne, fetchMany, parseXml, getProd }