const { fetchText, fetchMany, config } = require('../functions')

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
  const domain = [
    'com.br', 'com.tr', 'com',
    'de', 'es', 'fi',
    'fr', 'it', 'nl'
  ]

  const all = await Promise.allSettled(
    domain.map((d) => fetchText(`https://www.habbo.${d}/gamedata/external_flash_texts/0`).then((text) => ({ domain: d, text })))
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