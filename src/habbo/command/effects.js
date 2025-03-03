const { fetchText, fetchMany, parseXml } = require('../functions')

async function parse (txt) {
  const all = await parseXml(txt)
  return new Set(
    all.map.effect.map((item) => item['@_lib'])
  )
}

async function handle (prod_version) {
  const txt = await fetchText(`https://images.habbo.com/gordon/${prod_version}/effectmap.xml`)
  const all = await parse(txt)

  await fetchMany([...all].map((item) => {
    return {
      src: `https://images.habbo.com/gordon/${prod_version}/${item}.swf`,
      dst: `effects/${item}.swf`
    }
  }))
}

module.exports = handle