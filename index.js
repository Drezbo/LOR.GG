const { DeckEncoder } = require('runeterra');
const fetch = require('node-fetch');

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

const data = { 
	cards: [], 	// All cards
	core: {}, 	// Core data globals
	regions: {},// Region text with emojis by region abbreviation, e.g. { 'SH': `${SH_Emoji} Shurima` }
	emojis: {} 	// All the emojis the bot has access to
};

/* Fetch cards */
fetch('https://dd.b.pvp.net/latest/set1/en_us/data/set1-en_us.json')
.then(res => res.text())
.then(text => JSON.parse(text))
.then(json => {
	data.cards.push(...json);
	console.log('loaded set 1.');
});
fetch('https://dd.b.pvp.net/latest/set2/en_us/data/set2-en_us.json')
.then(res => res.text())
.then(text => JSON.parse(text))
.then(json => {
	data.cards.push(...json);
	console.log('Loaded set 2.');
});
fetch('https://dd.b.pvp.net/latest/set3/en_us/data/set3-en_us.json')
.then(res => res.text())
.then(text => JSON.parse(text))
.then(json => {
	data.cards.push(...json);
	console.log('Loaded set 3.');
});
fetch('https://dd.b.pvp.net/latest/set4/en_us/data/set4-en_us.json')
.then(res => res.text())
.then(text => JSON.parse(text))
.then(json => {
	data.cards.push(...json);
	console.log('Loaded set 4.');
});

/* Log bot in */
bot.login(TOKEN).then(() =>
	// We wait until login to fetch core data so we can use the emojis when generating region text.
	fetch('https://dd.b.pvp.net/latest/core/en_us/data/globals-en_us.json')
	.then(res => res.text())
	.then(text => JSON.parse(text))
	.then(json => {
		data.core = json;
		data.emojis = Object.fromEntries(data.core.regions.map(region => [ region.abbreviation, bot.emojis.cache.find(item => item.name === region.abbreviation) ]));
		data.regions = Object.fromEntries(data.core.regions.map(region => [ region.abbreviation, `${data.emojis[region.abbreviation]} ${region.name}` ]));
		console.log('loaded core data.');
	})
);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

// Sorts cards by cost then by name
function sortCards(a, b) {
	if (a.data.cost !== b.data.cost) {
		return a.data.cost - b.data.cost;
	}
	if (a.data.name < b.data.name) {
		return -1;
	}
	if (a.data.name > b.data.name) {
		return 1;
	}
	return 0;
}

bot.on('message', msg => {
	if (msg.content.startsWith('!deck ')) {
		// Convert deckcode to deck
		const deckcode = msg.content.substr(6, msg.content.length - 1);
		const deck = DeckEncoder.decode(deckcode);
		
		const embedd = new Discord.MessageEmbed().setColor('#000000');
		
		// Get regions
		const regions = [...new Set(deck.map(card => card.faction.shortCode))];
		// embedd.setTitle(regions.map(region => data.regions[region]).join('\r\n'));
		embedd.addField(regions.map(region => data.regions[region]).join('\r\n'), '\u200B', false);
		// for (const region of regions) {
			// embedd.addField(data.regions[region], '\u200B', false);
		// }
		
		// Group by type
		const cardData = deck.map(card => ({ card, data: data.cards.find(dc => dc.cardCode === card.code) }));
		const types = {};
		for (const c of cardData) {
			let type = c.data.supertype || c.data.type;
			if (type === 'Unit') { type = 'Follower'; }
			if (!types[type]) { types[type] = []; }
			types[type].push(c);
		}
		
		// embedd.setImage('https://cdn-lor.mobalytics.gg/production/images/cards-preview/04IO005.webp');
		
		// Generate printout of cards
		const keys = ['Champion', 'Follower', 'Spell', 'Landmark'];
		for (const key of keys) {
			if (!types[key]) { continue; }
			const type = types[key].sort(sortCards);
			embedd.addField(key, type.map(cd => `\`${cd.card.count}×\`${bot.emojis.cache.find(item => item.name === cd.card.faction.shortCode.toLowerCase())}${cd.data.name}`).join('\r\n'), true);
		}
		
		// Add mobalytics link
		embedd.addField('Mobalytics Link',`https://lor.mobalytics.gg/decks/code/${deckcode}`);
		
		msg.channel.send(embedd);
	}
});
