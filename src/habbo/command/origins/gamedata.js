const { fetchMany, config } = require('../../functions')
const { domains } = require('../../../tools/utils/utils')

async function handle () {
  domains.forEach((d) => {
    fetchMany([
      { src: `https://origins.habbo.${d}/gamedata/external_variables/0`, dst: `gamedata/${d}/external_variables.txt` },
      { src: `https://origins.habbo.${d}/gamedata/external_texts/0`, dst: `gamedata/${d}/external_texts.txt` },
      { src: `https://origins.habbo.${d}/gamedata/override/external_override_variables/0`, dst: `gamedata/${d}/override/external_override_variables.txt` },
      { src: `https://origins.habbo.${d}/gamedata/override/external_flash_override_texts/0`, dst: `gamedata/${d}/override/external_flash_override_texts.txt` },
      { src: `https://origins.habbo.${d}/gamedata/furnidata_json/0`, dst: `gamedata/${d}/furnidata.json` },
      { src: `https://origins.habbo.${d}/gamedata/furnidata_xml/0`, dst: `gamedata/${d}/furnidata.xml` },
      { src: `https://origins.habbo.${d}/gamedata/furnidata/0`, dst: `gamedata/${d}/furnidata.txt` },
      { src: `https://origins.habbo.${d}/gamedata/productdata_json/0`, dst: `gamedata/${d}/productdata.json` },
      { src: `https://origins.habbo.${d}/gamedata/productdata_xml/0`, dst: `gamedata/${d}/productdata.xml` },
      { src: `https://origins.habbo.${d}/gamedata/productdata/0`, dst: `gamedata/${d}/productdata.txt` },
      { src: `https://origins.habbo.${d}/gamedata/figuredata/0`, dst: `gamedata/${d}/figuredata.txt` }
    ], true)
  })
}

module.exports = handle