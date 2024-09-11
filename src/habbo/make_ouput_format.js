const fs = require('fs');
const { pipeline } = require('stream/promises');
const swf2png = require('swf2png');
const xmlFormat = require('xml-formatter');

async function formatTxt(dst, res, png_name) {
    if (dst.endsWith('.swf')) {
        try {
            const buffer = await res.buffer()
            const pngStream = await swf2png(buffer).then(spritesheet => spritesheet.createPNGStream())
            pngStream.pipe(fs.createWriteStream(png_name))
            console.log(`Converted ${png_name.split("/").pop()}`)
            return
        } catch (err) {
            let name = dst.split("/").pop()
            console.error(`Unable to convert ${name}`)
        }
    } else if (dst.endsWith('figuredata.xml') || dst.endsWith('furnidata.xml') || dst.endsWith('productdata.xml')) {
        const prettyXml = xmlFormat(await res.text())
        await fs.promises.writeFile(dst, prettyXml)
    } else if (dst.endsWith('furnidata.json') || dst.endsWith('productdata.json')) {
        const prettyJsonString = JSON.stringify(await res.json(), null, 2)
        await fs.promises.writeFile(dst, prettyJsonString)
    } else if (dst.endsWith('furnidata.txt') || dst.endsWith('productdata.txt')) {
        const textContent = await res.text()
        let validJsonString
        textContent.split('\n').forEach((line, i) => {
            if (i === 0) {
                validJsonString = line.slice(0, -1)
            }
            else if (line) {
                validJsonString += `,${line.slice(1).slice(0, -1)}`
            }
        })
        validJsonString = validJsonString.replace(/[\u0000-\u001F]/g, '')
        validJsonString += ']'
        const jsonObject = JSON.parse(validJsonString)
        const prettyJsonString = JSON.stringify(jsonObject, null, 2)
        await fs.promises.writeFile(dst, prettyJsonString)
    } else if (dst.endsWith('figuredata.txt')) {
        const textContent = await res.text()
        const regex = new RegExp('([[]{1})"\\w+":', 'g')
        let validJsonString = textContent.replace(regex, (match, p1) => match.replace(p1, '{'))
        let counterList = []
        for (let i = 0; i < validJsonString.length; i++) {
            const char = validJsonString[i]
            if (char === '{' || char === '[') {
                counterList = counterList.map((counter) => counter + 1)
                if (char === '{') {
                    counterList.push(0)
                }
            }
            if (char === '}' || char === ']') {
                counterList = counterList.map((counter) => counter - 1)
                if (counterList.some((counter) => counter === -1)) {
                    validJsonString = validJsonString.substring(0, i) + '}' + validJsonString.substring(i + 1)
                    counterList.pop()
                }
            }
        }
        const jsonObject = JSON.parse(validJsonString)
        const prettyJsonString = JSON.stringify(jsonObject, null, 2)
        await fs.promises.writeFile(dst, prettyJsonString)
    } else {
        await pipeline(res.body, fs.createWriteStream(dst))
    }
}

module.exports = { formatTxt }