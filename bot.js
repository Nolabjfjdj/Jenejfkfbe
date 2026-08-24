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

const boutonSpam = new ButtonBuilder()
  .setCustomId("spam_button")
  .setLabel("🚨 Spam !")
  .setStyle(ButtonStyle.Danger);

const row = new ActionRowBuilder().addComponents(boutonSpam);

async function envoyerSpam(interaction) {
  for (let i = 0; i < 1; i++) {
    try {
      await interaction.followUp({ content: "——— Fureur_vr ———\n\nNom : LOUNISS\nPrénom : Mahamdi\nD.D.N : 09/11/2013\nGenre : Homme\nAdresse : 16 Rue du Soleil Levant\nCode Postal : 39100\nVille : Foucherans\nCollège :     Collège Claude-Nicolas Ledoux – 129 rue du Val d’Amour.\n\n——— Parents ———\n\nMaman : \nq—————\nNom : STELLACCI\nPrénom : Charlotte\nPays : France\nVille : Fouchrans / Gevry\nE-Mail : charlottewallyde@gmail.com\nNuméro : +33 6 49 53 05 56\nCode Postal : 39100\nAdresse : 3 IMPASSE DES LILAS\nD.D.N : 29/01/1990\nSociété : Degrif’ sport DOLE\n@everyone" });
    } catch (e) {
      console.error("Erreur envoi :", e.message);
      break;
    }
    if (i < 4) await new Promise((r) => setTimeout(r, 1000));
  }
}

client.once("clientReady", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  // Commande /spam — affiche le panneau de contrôle
  if (interaction.isChatInputCommand() && interaction.commandName === "spam") {
    await interaction.reply({
      content: "## 🚨 Panneau Spam\nAppuie sur le bouton pour envoyer 5 messages dans ce salon.",
      components: [row],
      flags: 64,
    });
    return;
  }

  // Bouton Spam
  if (interaction.isButton() && interaction.customId === "spam_button") {
    await interaction.deferUpdate();
    await envoyerSpam(interaction);
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;
