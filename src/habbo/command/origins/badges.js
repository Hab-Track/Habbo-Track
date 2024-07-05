const { fetchText, fetchMany, config } = require('../../functions')
const { domains } = require('../../../tools/utils/utils')

const regexOne = /^badge_(?:name|desc)_([^=]+)=/gmi
const regexTwo = /^(.*)_badge_(?:name|desc).*=/gmi

async function parse (txt) {
  const match = [
    ...txt.matchAll(regexOne),
    ...txt.matchAll(regexTwo),
  ]

  return new Set(
    match.map((match) => match[1].trim())
  )
}

async function collectText () {
  const all = await Promise.allSettled(
    domains.map((d) => fetchText(`https://origins.habbo.${d}/gamedata/external_texts/0`).then((text) => ({ domain: d, text })))
  )

  return all
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
}

async function handle () {
  const allTexts = await collectText()

  for (const { domain: d, text } of allTexts) {
    const all = await parse(text)

    await fetchMany([...all].map((code) => {
      return {
        src: `https://images.habbo.com/c_images/album1584/${code}.${config.format}`,
        dst: `badges/${d}/${code}.${config.format}`
      }
    }))
  }
}

module.exports = handle