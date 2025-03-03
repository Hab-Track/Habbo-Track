const { fetchMany, config } = require('../functions')

async function handle() {
    const domainSpecificUrls = [
        { src: `https://www.habbo.${config.domain}/gamedata/external_variables/0`, dst: `gamedata/${config.domain}/external_variables.txt` },
        { src: `https://www.habbo.${config.domain}/gamedata/external_flash_texts/0`, dst: `gamedata/${config.domain}/external_flash_texts.txt` },
        { src: `https://www.habbo.${config.domain}/gamedata/override/external_override_variables/0`, dst: `gamedata/${config.domain}/external_override_variables.txt` },
        { src: `https://www.habbo.${config.domain}/gamedata/override/external_flash_override_texts/0`, dst: `gamedata/${config.domain}/external_flash_override_texts.txt` },
        { src: `https://www.habbo.${config.domain}/gamedata/furnidata_json/0`, dst: `gamedata/${config.domain}/furnidata.json` },
        { src: `https://www.habbo.${config.domain}/gamedata/furnidata_xml/0`, dst: `gamedata/${config.domain}/furnidata.xml` },
        { src: `https://www.habbo.${config.domain}/gamedata/furnidata/0`, dst: `gamedata/${config.domain}/furnidata.txt` },
        { src: `https://www.habbo.${config.domain}/gamedata/productdata_json/0`, dst: `gamedata/${config.domain}/productdata.json` },
        { src: `https://www.habbo.${config.domain}/gamedata/productdata_xml/0`, dst: `gamedata/${config.domain}/productdata.xml` },
        { src: `https://www.habbo.${config.domain}/gamedata/productdata/0`, dst: `gamedata/${config.domain}/productdata.txt` },
    ]

    const commonUrls = [
        { src: `https://www.habbo.${config.domain}/gamedata/figuredata/0`, dst: 'gamedata/com/figuredata.xml' },
        { src: `https://images.habbo.com/gordon/${config.prod}/figuremap.xml`, dst: 'gamedata/com/figuremap.xml' },
        { src: `https://images.habbo.com/gordon/${config.prod}/effectmap.xml`, dst: 'gamedata/com/effectmap.xml' },
    ]

    // Only fetch common URLs if we're processing the default domain
    if (config.domain === 'com') {
        await fetchMany([...domainSpecificUrls, ...commonUrls], true)
    } else {
        await fetchMany(domainSpecificUrls, true)
    }
}

module.exports = handle