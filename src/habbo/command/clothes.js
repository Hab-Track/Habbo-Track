const { fetchText, fetchMany, parseXml } = require('../functions')

async function parse (txt) {
  const all = await parseXml(txt)
  return new Set(
    all.map.lib.map((item) => item['@_id'])
  )
}

async function handle () {
  const txt = await fetchText(`https://images.habbo.com/gordon/${prod_version}/figuremapv2.xml`)
  const all = await parse(txt)

  await fetchMany([...all].map((item) => {
    return {
      src: `https://images.habbo.com/gordon/${prod_version}/${item}.swf`,
      dst: `clothes/${item}.swf`
    }
  }))
}

module.exports = handle