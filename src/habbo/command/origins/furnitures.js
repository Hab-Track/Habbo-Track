const { fetchMany, fetchJson } = require('../../functions')

async function parse (json) {
  const all = [
    ...json.roomitemtypes.furnitype,
    ...json.wallitemtypes.furnitype,
  ]

  const map = []

  all.forEach((item) => {
    map.push(
      { revision: item.revision, name: `${item.classname.split('*')[0]}.swf` }
    )
  })

  return new Set(map)
}

async function handle () {
  const json = await fetchJson(`https://origins.habbo.com/gamedata/furnidata_json/0`)
  const all = await parse(json)

  await fetchMany([...all].map((item) => {
    return {
      src: `https://images.habbo.com/dcr/hof_furni/${item.revision}/${item.name}`,
      dst: `furnis/${item.name}`
    }
  }))
}

module.exports = handle