require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('KTX bot alive'));
app.listen(process.env.PORT || 3000);

const SHEET_URL = process.env.SHEET_URL;
const SHEET_KEY = process.env.SHEET_KEY;
const BACKGROUND_URL = process.env.BACKGROUND_URL;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function getBalance(id) {
  const res = await fetch(`${SHEET_URL}?action=get&id=${id}&key=${SHEET_KEY}`);
  return await res.text();
}

client.once('ready', async () => {
  console.log('Bot online: ' + client.user.tag);
  await client.application.commands.create({
    name: 'rank',
    description: 'اعرض كارت الرانك',
    options: [{ name: 'user', description: 'العضو', type: 6, required: false }]
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'rank') return;

  await interaction.deferReply();
  const user = interaction.options.getUser('user') || interaction.user;
  const coins = await getBalance(user.id);

  const width = 900, height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bg = await loadImage(BACKGROUND_URL);
  ctx.drawImage(bg, 0, 0, width, height);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, width, height);

  const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 150, 80, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 70, 70, 160, 160);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(user.username, 270, 130);
  ctx.font = '28px sans-serif';
  ctx.fillText(`💰 KTX Coins: ${Number(coins).toLocaleString('en-US')}`, 270, 190);

  const buffer = canvas.toBuffer('image/png');
  await interaction.editReply({ files: [{ attachment: buffer, name: 'rank.png' }] });
});

client.login(process.env.DISCORD_TOKEN);
