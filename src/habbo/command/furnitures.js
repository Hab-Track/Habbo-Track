const { fetchMany, fetchJson, config } = require('../functions')
const { domains } = require('../../tools/utils/utils')

async function parse (json) {
  const all = [
    ...json.roomitemtypes.furnitype,
    ...json.wallitemtypes.furnitype,
  ]

  const map = []

  all.forEach((item) => {
    map.push(
      // { revision: item.revision, name: `${item.classname.replace('*', '_')}_icon.png` },
      { revision: item.revision, name: `${item.classname.split('*')[0]}.swf` },
    )
  })

  return new Set(map)
}

async function collectJson () {
  const all = await Promise.allSettled(
    domains.map((d) => fetchJson(`https://www.habbo.${d}/gamedata/furnidata_json/0`).then((json) => ({ domain: d, json }))))

  return all
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
}

async function handle () {
  const allJsons = await collectJson()

  for (const { domain: d, json } of allJsons) {
    const all = await parse(json)

    await fetchMany([...all].map((item) => {
      return {
        src: `https://images.habbo.com/dcr/hof_furni/${item.revision}/${item.name}`,
        dst: `furnis/${d}/${item.name}`
      }
    }))
  }
}

module.exports = handle