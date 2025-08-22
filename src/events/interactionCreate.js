const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
    },
};

async function handleButtonInteraction(interaction) {
    const [action, applicantId] = interaction.customId.split('-');
    const applicant = await interaction.client.users.fetch(applicantId).catch(() => null);

    if (!applicant) {
        return interaction.reply({ content: "Could not find the original applicant.", ephemeral: true });
    }

    const originalEmbed = interaction.message.embeds[0];
    const editedEmbed = EmbedBuilder.from(originalEmbed);
    
    const disabledButtons = new ActionRowBuilder()
        .addComponents(
            ButtonBuilder.from(interaction.message.components[0].components[0]).setDisabled(true),
            ButtonBuilder.from(interaction.message.components[0].components[1]).setDisabled(true)
        );

    if (action === 'accept') {
        editedEmbed
            .setColor(0x57F287) // Green
            .addFields({ name: "Status", value: `✅ Accepted by ${interaction.user.toString()}`, inline: false });
        
        await interaction.update({ embeds: [editedEmbed], components: [disabledButtons] });

        try {
            await applicant.send(`🎉 Congratulations! Your application to the **Xtreme E-Sports CODM clan** has been **accepted**! Welcome.`);
        } catch (error) {
            await interaction.followUp({ content: `Could not DM ${applicant.toString()}, they may have DMs disabled.`, ephemeral: true });
        }

    } else if (action === 'reject') {
        editedEmbed
            .setColor(0xED4245) // Red
            .addFields({ name: "Status", value: `❌ Rejected by ${interaction.user.toString()}`, inline: false });

        await interaction.update({ embeds: [editedEmbed], components: [disabledButtons] });

        try {
            await applicant.send(`Thank you for your interest in the **Xtreme E-Sports CODM clan**. After careful review, we have decided not to move forward with your application at this time. We wish you the best of luck.`);
        } catch (error) {
            await interaction.followUp({ content: `Could not DM ${applicant.toString()}, they may have DMs disabled.`, ephemeral: true });
        }
    }
}