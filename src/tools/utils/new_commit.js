const { EmbedBuilder } = require('discord.js');
const { getCommitDetails, getUserAvatar, getBranchName } = require('../../habbo/functions')

async function sendCommitEmbed(commitSha, webhookClient) {
    const { sha, authorName, subject } = getCommitDetails(commitSha);
    const commitUrl = `https://github.com/Hab-Track/Habbo-Track/commit/${sha}`;
    const repoUrl = `https://github.com/Hab-Track/Habbo-Track`;

    const branchName = getBranchName();
    const avatarUrl = getUserAvatar();

    const embed = new EmbedBuilder()
        .setAuthor({ name: authorName, iconURL: avatarUrl })
        .setTitle(`[${repoUrl.split('/').slice(-1).join('/')}:${branchName}] 1 new commit`)
        .setURL(repoUrl + "/tree/" + branchName)
        .setDescription(`[\`${sha.substring(0, 7)}\`](${commitUrl}) ${subject} - ${authorName}`)
        .setColor(0x9a00fa);

    await webhookClient.send({ embeds: [embed] });
    console.log(`Commit embed for ${sha} sent.`);
}

module.exports = sendCommitEmbed;