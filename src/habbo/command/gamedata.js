const { fetchMany } = require('../functions')

async function handle(domain, prod_version) {
    const domainSpecificUrls = [
        { src: `https://www.habbo.${domain}/gamedata/external_variables/0`, dst: `gamedata/${domain}/external_variables.txt` },
        { src: `https://www.habbo.${domain}/gamedata/external_flash_texts/0`, dst: `gamedata/${domain}/external_flash_texts.txt` },
        { src: `https://www.habbo.${domain}/gamedata/override/external_override_variables/0`, dst: `gamedata/${domain}/external_override_variables.txt` },
        { src: `https://www.habbo.${domain}/gamedata/override/external_flash_override_texts/0`, dst: `gamedata/${domain}/external_flash_override_texts.txt` },
        { src: `https://www.habbo.${domain}/gamedata/furnidata_json/0`, dst: `gamedata/${domain}/furnidata.json` },
        { src: `https://www.habbo.${domain}/gamedata/furnidata_xml/0`, dst: `gamedata/${domain}/furnidata.xml` },
        { src: `https://www.habbo.${domain}/gamedata/furnidata/0`, dst: `gamedata/${domain}/furnidata.txt` },
        { src: `https://www.habbo.${domain}/gamedata/productdata_json/0`, dst: `gamedata/${domain}/productdata.json` },
        { src: `https://www.habbo.${domain}/gamedata/productdata_xml/0`, dst: `gamedata/${domain}/productdata.xml` },
        { src: `https://www.habbo.${domain}/gamedata/productdata/0`, dst: `gamedata/${domain}/productdata.txt` },
    ]

    const commonUrls = [
        { src: `https://www.habbo.${domain}/gamedata/figuredata/0`, dst: 'gamedata/com/figuredata.xml' },
        { src: `https://images.habbo.com/gordon/${prod_version}/figuremap.xml`, dst: 'gamedata/com/figuremap.xml' },
        { src: `https://images.habbo.com/gordon/${prod_version}/effectmap.xml`, dst: 'gamedata/com/effectmap.xml' },
    ]

    // Only fetch common URLs if we're processing the default domain
    if (domain === 'com') {
        await fetchMany([...domainSpecificUrls, ...commonUrls], true)
    } else {
        await fetchMany(domainSpecificUrls, true)
    }
}

module.exports = handle