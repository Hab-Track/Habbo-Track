const { generateDiscordDiffMessages, formatName } = require('./utils')

async function processVars(bot) {
    const fileToMessagesMap = generateDiscordDiffMessages()

    for (const [file, messages] of fileToMessagesMap.entries()) {
        if (file.endsWith('furnidata.xml') ||
            file.endsWith('furnidata.txt') ||
            file.endsWith('productdata.xml') ||
            file.endsWith('productdata.txt')) {
            continue
        }

        let messageContent

        for (const message of messages) {
            if (!messageContent) {
                messageContent = `${formatName(file)}\n${message}`
            }
            else {
                messageContent = message
            }

            bot.queueTextMessage({ content: messageContent }, file);
        }
    }
}

module.exports = processVars;