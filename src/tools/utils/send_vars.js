const { generateDiscordDiffMessages, formatName } = require('./utils')

async function sendVars(commitSha, webhookClient) {
    const fileToMessagesMap = generateDiscordDiffMessages(commitSha)

    for (const [file, messages] of fileToMessagesMap.entries()) {
        let messageContent

        for (const message of messages) {
            if (!messageContent) {
                messageContent = `${formatName(file)}\n${message}`
            }
            else {
                messageContent = message
            }

            await webhookClient.send({ content: messageContent })
        }
    }
}

module.exports = sendVars