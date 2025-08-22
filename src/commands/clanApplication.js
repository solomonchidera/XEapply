const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Define the application questions for a CODM clan
const APPLICATION_QUESTIONS = [
    "What is your Call of Duty: Mobile in-game name (IGN)?",
    "What is your CODM User ID (UID)? (This helps us add you easily)",
    "How old are you?",
    "What are your current ranks in Multiplayer (MP) and Battle Royale (BR)? (e.g., Legendary, Grand Master)",
    "What is your preferred role or playstyle? (e.g., Slayer, Objective, Sniper, Support)",
    "How many hours per week are you available for clan activities like scrims or clan wars?",
    "Why do you want to join Xtreme E-Sports?"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply to join the Xtreme E-Sports CODM clan.'),
    async execute(interaction) {
        const applicant = interaction.user;

        try {
            const dmChannel = await applicant.createDM();
            await dmChannel.send("Hello! Let's start your application for the **Xtreme E-Sports CODM clan**. Please answer the following questions one by one.");
            await interaction.reply({ content: "I've sent you a DM to start your application!", ephemeral: true });
        } catch (error) {
            console.error(`Could not send DM to ${applicant.tag}.`, error);
            await interaction.reply({ content: "I couldn't send you a DM. Please check your privacy settings.", ephemeral: true });
            return;
        }

        const answers = [];
        const dmChannel = await applicant.createDM();

        for (const question of APPLICATION_QUESTIONS) {
            await dmChannel.send(`**${question}**`);
            const filter = m => m.author.id === applicant.id;
            try {
                const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 300_000, errors: ['time'] });
                answers.push(collected.first().content);
            } catch {
                await dmChannel.send("Application timed out. Please use `/apply` again.");
                return;
            }
        }

        await dmChannel.send("Thank you! Your application has been submitted for review.");

        const applicationChannel = await interaction.client.channels.fetch(process.env.APPLICATION_CHANNEL_ID);
        if (!applicationChannel) {
            console.error(`ERROR: Could not find the application channel.`);
            return;
        }

        const applicationEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`New CODM Clan Application: ${applicant.username}`)
            .setThumbnail(applicant.displayAvatarURL())
            .setTimestamp();

        APPLICATION_QUESTIONS.forEach((question, index) => {
            applicationEmbed.addFields({ name: question, value: answers[index] || 'No answer provided.', inline: false });
        });

        applicationEmbed.setFooter({ text: `User ID: ${applicant.id}` });

        const reviewButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`accept-${applicant.id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`reject-${applicant.id}`).setLabel('Reject').setStyle(ButtonStyle.Danger)
            );

        await applicationChannel.send({ embeds: [applicationEmbed], components: [reviewButtons] });
    },
};