const fetchh = require('node-fetch')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { pipeline } = require('stream/promises')
const { XMLParser } = require('fast-xml-parser')
const swf2png = require('swf2png/src/convert_swf.js')
const xmlFormat = require('xml-formatter')

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

  let res = await fetchRaw(src)
  await fs.promises.mkdir(path.dirname(dst), { recursive: true })

  if (dst.endsWith('.swf')) {
    try {
      const buffer = await res.buffer()
      const pngStream = await swf2png(buffer).then(spritesheet => spritesheet.createPNGStream())
      pngStream.pipe(fs.createWriteStream(png_name))
      console.log(`Converted ${png_name.split("/").pop()}`)
      return
    } catch (err) {
      let name = dst.split("/").pop()
      console.error(`Unable to convert ${name}`)
    }
  } else if (dst.endsWith('figuredata.xml') || dst.endsWith('furnidata.xml') || dst.endsWith('productdata.xml')) {
    const prettyXml = xmlFormat(await res.text())
    await fs.promises.writeFile(dst, prettyXml)
  } else if (dst.endsWith('furnidata.json') || dst.endsWith('productdata.json')) {
    const prettyJsonString = JSON.stringify(await res.json(), null, 2)
    await fs.promises.writeFile(dst, prettyJsonString)
  } else if (dst.endsWith('furnidata.txt') || dst.endsWith('productdata.txt')) {
    const textContent = await res.text()
    let validJsonString
    textContent.split('\n').forEach((line, i) => {
      if (i === 0) {
        validJsonString = line.slice(0, -1) 
      }
      else if (line) {
        validJsonString += `,${line.slice(1).slice(0, -1)}`
      }
    })
    validJsonString = validJsonString.replace(/[\u0000-\u001F]/g, '')
    validJsonString += ']'
    const jsonObject = JSON.parse(validJsonString)
    const prettyJsonString = JSON.stringify(jsonObject, null, 2)
    await fs.promises.writeFile(dst, prettyJsonString)
  } else if (dst.endsWith('figuredata.txt')) {
    const textContent = await res.text()
    const regex = new RegExp('([[]{1})"\\w+":', 'g')
    let validJsonString = textContent.replace(regex, (match, p1) => match.replace(p1, '{'))
    let counterList = []
    for (let i = 0; i < validJsonString.length; i++) {
      const char = validJsonString[i]
      if (char === '{' || char === '[') {
        counterList = counterList.map((counter) => counter + 1)
        if (char === '{') {
          counterList.push(0)
        }
      }
      if (char === '}' || char === ']') {
        counterList = counterList.map((counter) => counter - 1)
        if (counterList.some((counter) => counter === -1)) {
          validJsonString = validJsonString.substring(0, i) + '}' + validJsonString.substring(i + 1)
          counterList.pop()
        }
      }
    }
    const jsonObject = JSON.parse(validJsonString)
    const prettyJsonString = JSON.stringify(jsonObject, null, 2)
    await fs.promises.writeFile(dst, prettyJsonString)
  } else {
    await pipeline(res.body, fs.createWriteStream(dst))
  }

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

module.exports = { fetchText, fetchJson, fetchOne, fetchMany, parseXml, initConfig, config }