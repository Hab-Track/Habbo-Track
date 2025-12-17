const fs = require('fs');
const { pipeline } = require('stream/promises');
const swf2png = require('swf2png/src/convert_swf.js');
const xmlFormat = require('xml-formatter');

async function formatTxt(dst, res, png_name) {
    if (dst.endsWith('.swf')) {
        try {
            const buffer = await res.buffer();
            const pngStream = await swf2png(buffer).then(spritesheet => spritesheet.createPNGStream());
            pngStream.pipe(fs.createWriteStream(png_name));
        } catch (err) {
            console.error(`Unable to convert ${dst.split('/').pop()} to png`, err);
        }
    }
    
    else if (dst.endsWith('.json')) {
        try {
            const json = await res.json();
            const pretty = JSON.stringify(json, null, 2);
            await fs.promises.writeFile(dst, pretty);
        } catch (err) {
            console.error(`Invalid JSON, saving raw: ${dst}`);
            await pipeline(res.body, fs.createWriteStream(dst));
        }
    }
    else {
        const text = await res.text();
        try {
            const prettyXml = xmlFormat(text);
            await fs.promises.writeFile(dst, prettyXml);
        } catch (err) {
            await fs.promises.writeFile(dst, await res.text());
        }
    }
}

module.exports = { formatTxt };
