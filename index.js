const fetch = require('node-fetch');

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;


/* Log bot in */
bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});
bot.on('message', msg => {
	if (msg.content.startsWith('!deck ')) {
		const deckcode = msg.content.substr(6, msg.content.length - 1);
		embedd.setImage('https://lor.gg/storage/share_images/deck/${deckcode}`-full.png);
		// Add LOR.GG link
		embedd.addField('LOR.GG Link',`https://lor.gg/deck/${deckcode}`);
		msg.channel.send(embedd);
	}
});
