const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Spam un message dans ce salon")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2])
    .addIntegerOption((opt) =>
      opt
        .setName("fois")
        .setDescription("Nombre de fois")
        .setMinValue(1)
        .setMaxValue(20000000)
        .setRequired(false)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Commande /spam enregistrée globalement");
  } catch (err) {
    console.error("Erreur enregistrement commandes :", err);
  }
}

// Stocke les sessions de spam en cours
const spamSessions = new Map();

async function envoyerChunk(interaction, restant, sessionId) {
  const chunk = Math.min(5, restant);

  for (let i = 0; i < chunk; i++) {
    try {
      await interaction.followUp({ content: "GET NUKED, I RAPE YOU" });
    } catch (e) {
      console.error("Erreur envoi :", e.message);
      break;
    }
    if (i < chunk - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  const nouveauRestant = restant - chunk;

  if (nouveauRestant <= 0) {
    // Tout envoyé
    spamSessions.delete(sessionId);
    await interaction.followUp({
      content: "✅ Spam terminé !",
      flags: 64,
    });
    return;
  }

  // Il reste des messages, propose le bouton Continuer
  const bouton = new ButtonBuilder()
    .setCustomId(`continuer_${sessionId}`)
    .setLabel(`Continuer (${nouveauRestant} restants)`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(bouton);

  spamSessions.set(sessionId, { restant: nouveauRestant, interaction });

  await interaction.followUp({
    content: `⏸️ Pause — encore **${nouveauRestant}** messages à envoyer.`,
    components: [row],
    flags: 64,
  });
}

client.once("clientReady", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  // Commande /spam
  if (interaction.isChatInputCommand() && interaction.commandName === "spam") {
    const fois = interaction.options.getInteger("fois") ?? 5;
    const sessionId = `${interaction.user.id}_${Date.now()}`;

    await interaction.reply({
      content: `✅ Spam lancé **${fois}x** !`,
      flags: 64,
    });

    await envoyerChunk(interaction, fois, sessionId);
    return;
  }

  // Bouton Continuer
  if (interaction.isButton() && interaction.customId.startsWith("continuer_")) {
    const sessionId = interaction.customId.replace("continuer_", "");
    const session = spamSessions.get(sessionId);

    if (!session) {
      await interaction.reply({
        content: "❌ Session expirée.",
        flags: 64,
      });
      return;
    }

    await interaction.deferUpdate();
    await envoyerChunk(session.interaction, session.restant, sessionId);
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;
