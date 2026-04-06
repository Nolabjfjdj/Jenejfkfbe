const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName("spam")
    .setDescription("Spam un message dans ce salon")
    .addIntegerOption((opt) =>
      opt
        .setName("fois")
        .setDescription("Nombre de fois (max 20)")
        .setMinValue(1)
        .setMaxValue(20)
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

client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "spam") return;

  const fois = interaction.options.getInteger("fois") ?? 5;

  await interaction.reply({
    content: `✅ Spam lancé **${fois}x** !`,
    ephemeral: true,
  });

  for (let i = 0; i < fois; i++) {
    await interaction.channel.send("LEMESSAGE");
    if (i < fois - 1) await new Promise((r) => setTimeout(r, 1000));
  }
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;
