const { fetchMany, config } = require('../../functions')

async function handle () {
  await fetchMany([
    { src: `https://origins.habbo.com/gamedata/external_variables/0`, dst: 'gamedata/external_variables.txt' },
    { src: `https://origins.habbo.com/gamedata/external_texts/0`, dst: 'gamedata/external_texts.txt' },
    { src: `https://origins.habbo.com/gamedata/override/external_override_variables/0`, dst: 'gamedata/override/external_override_variables.txt' },
    { src: `https://origins.habbo.com/gamedata/override/external_flash_override_texts/0`, dst: 'gamedata/override/external_flash_override_texts.txt' },
    { src: `https://origins.habbo.com/gamedata/furnidata_json/0`, dst: 'gamedata/furnidata.json' },
    { src: `https://origins.habbo.com/gamedata/furnidata_xml/0`, dst: 'gamedata/furnidata.xml' },
    { src: `https://origins.habbo.com/gamedata/furnidata/0`, dst: 'gamedata/furnidata.txt' },
    { src: `https://origins.habbo.com/gamedata/productdata_json/0`, dst: 'gamedata/productdata.json' },
    { src: `https://origins.habbo.com/gamedata/productdata_xml/0`, dst: 'gamedata/productdata.xml' },
    { src: `https://origins.habbo.com/gamedata/productdata/0`, dst: 'gamedata/productdata.txt' },
    { src: `https://origins.habbo.com/gamedata/figuredata/0`, dst: 'gamedata/figuredata.xml' }
  ], true)
}

module.exports = handle

PRODUCTION-202406121416-664643360