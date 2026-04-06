const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();
require("./bot");

app.get("/", (req, res) => {
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${
    process.env.CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI
  )}&response_type=code&scope=identify+guilds+guilds.join&permissions=2048`;

  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>SpamBot</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: sans-serif;
            background: #1a1a2e;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 24px;
          }
          h1 { font-size: 2.5rem; }
          p { color: #aaa; }
          a {
            padding: 14px 32px;
            background: #5865F2;
            color: white;
            border-radius: 10px;
            text-decoration: none;
            font-size: 1.1rem;
            font-weight: bold;
            transition: background 0.2s;
          }
          a:hover { background: #4752c4; }
        </style>
      </head>
      <body>
        <h1>🤖 SpamBot</h1>
        <p>Autorise le bot pour l'ajouter dans tes serveurs.</p>
        <a href="${oauthUrl}">Autoriser le bot</a>
      </body>
    </html>
  `);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Erreur : pas de code.");

  try {
    // Échange le code contre un access token
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // Récupère l'ID de l'utilisateur
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userId = userRes.data.id;
    const username = userRes.data.username;

    // Récupère les serveurs de l'utilisateur
    const guildsRes = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const guilds = guildsRes.data;

    // Fait rejoindre le bot dans chaque serveur où l'user est admin
    let joined = [];
    let skipped = [];

    for (const guild of guilds) {
      if (!(guild.permissions & 0x8)) continue; // Seulement les serveurs où il est admin
      try {
        const joinRes = await axios.put(
          `https://discord.com/api/guilds/${guild.id}/members/${userId}`,
          { access_token: accessToken },
          { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` } }
        );
        if (joinRes.status === 201) {
          joined.push(guild.name);
        } else {
          skipped.push(guild.name);
        }
      } catch (e) {
        skipped.push(guild.name);
      }
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>SpamBot - Succès</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: sans-serif;
              background: #1a1a2e;
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              gap: 16px;
              text-align: center;
              padding: 24px;
            }
            h1 { font-size: 2rem; color: #57F287; }
            .tag { color: #aaa; font-size: 0.95rem; }
            .box {
              background: #16213e;
              border-radius: 12px;
              padding: 20px 32px;
              margin-top: 8px;
              max-width: 500px;
              width: 100%;
            }
            .joined { color: #57F287; }
            .skipped { color: #aaa; font-size: 0.9rem; margin-top: 8px; }
            .tip {
              margin-top: 16px;
              background: #5865F2;
              border-radius: 10px;
              padding: 12px 24px;
              font-size: 0.95rem;
            }
          </style>
        </head>
        <body>
          <h1>✅ Bot ajouté !</h1>
          <p class="tag">Connecté en tant que <b>${username}</b></p>
          <div class="box">
            <p class="joined">🟢 Rejoint (${joined.length}) : ${
              joined.length > 0 ? joined.join(", ") : "aucun nouveau"
            }</p>
            <p class="skipped">⚪ Déjà présent / ignoré (${skipped.length}) : ${
              skipped.length > 0 ? skipped.join(", ") : "aucun"
            }</p>
          </div>
          <p class="tip">Utilise <b>/spam</b> dans n'importe quel salon de tes serveurs !</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;margin-top:100px;background:#1a1a2e;color:white;">
          <h1 style="color:#ED4245;">❌ Erreur</h1>
          <p>Une erreur est survenue lors de l'authentification.</p>
          <p style="color:#aaa;margin-top:8px;">${err.response?.data?.error_description || err.message}</p>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));
