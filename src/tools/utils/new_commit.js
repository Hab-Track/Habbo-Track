const { EmbedBuilder } = require('discord.js');
const { execSync } = require('child_process');

function getCommitDetails(commitSha) {
    const commitDetails = execSync(`git show -s --format="%H;%an;%s" ${commitSha}`).toString().trim();
    const [sha, authorName, subject] = commitDetails.split(';');
    return { sha, authorName, subject };
}

async function getUserAvatar() {
    // return "https://avatars.githubusercontent.com/u/160228172"; // Avatar on github
    return "https://i.imgur.com/lSCFcFQ.gif" // Animated avatar
}

async function sendCommitEmbed(commitSha, webhookClient, branchName) {
    const { sha, authorName, subject } = getCommitDetails(commitSha);
    const commitUrl = `https://github.com/Hab-Track/Habbo-Track/commit/${sha}`;
    const repoUrl = `https://github.com/Hab-Track/Habbo-Track`;

    const avatarUrl = await getUserAvatar();

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