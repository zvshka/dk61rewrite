import { loadImage, SKRSContext2D } from '@napi-rs/canvas'
import { parse } from '@twemoji/parser'

function splitEmoji(string: string) {
	let toReturn = ''
	for (const symbol of string) {
		if (/\p{Emoji_Presentation}/gu.test(symbol)) {
			toReturn += ` ${symbol} `
		} else {
			toReturn += symbol
		}
	}

	return toReturn.trim()
}
export async function fillWithEmoji(ctx: SKRSContext2D, text: string, x: number, y: number) {
	if (!text) throw new Error('(discord-emoji-canvas) No Text was provided')
	if (!ctx) throw new Error(`(discord-emoji-canvas) No Context was provided`)
	if (!x) throw new Error(`(discord-emoji-canvas) No x axis was provided`)
	if (!y) throw new Error(`(discord-emoji-canvas) No y axis was provided`)
	// starting function from here
	const emojiPercent1 = 0.1
	const emojiPercent2 = 0.7
	const fontSize = Number.parseInt(ctx.font)
	const emojiSideMargin = fontSize * emojiPercent1
	const emojiUpMargin = fontSize * emojiPercent2
	const entity = text
		.replace('>', '> ')
		.split(' ')
		.map(splitEmoji)
		.flat()
		.join(' ')
		.trim()
		.split(' ')

	const baseLine = ctx.measureText('').alphabeticBaseline
	let currWidth = 0
	for (let i = 0; i < entity.length; i++) {
		// starting loop
		const ent = entity[i] // getting current word or emoji
		const parsed = parse(ent) // parsing to check later if emote is an twemoji
		const regExToSearch = /<?(a:|:)\w*:(\d*)>/
		const matched = ent.match(regExToSearch)
		if (matched) {
			if (ent.startsWith('«')) {
				ctx.fillText('«', x + currWidth, y)
				currWidth += ctx.measureText('«').width + fontSize / 5
			}
			const img = await loadImage(
				`https://cdn.discordapp.com/emojis/${matched![2]}.png`
			)
			ctx.drawImage(
				img,
				x + currWidth + emojiSideMargin,
				y + emojiUpMargin - fontSize - baseLine,
				fontSize,
				fontSize
			)
			currWidth += fontSize + emojiSideMargin * 2 + fontSize / 5
			if (ent.endsWith('».')) {
				ctx.fillText('».', x + currWidth, y)
				currWidth += ctx.measureText('».').width + fontSize / 5
			}
		} else if (parsed.length > 0) {
			if (ent.startsWith('«')) {
				ctx.fillText('«', x + currWidth, y)
				currWidth += ctx.measureText('«').width + fontSize / 5
			}
			// checking if twemoji or not
			const img = await loadImage(parsed[0].url)
			ctx.drawImage(
				img,
				x + currWidth + emojiSideMargin,
				y + emojiUpMargin - fontSize - baseLine,
				fontSize,
				fontSize
			)
			currWidth += fontSize + emojiSideMargin * 2 + fontSize / 5
			if (ent.endsWith('».')) {
				ctx.fillText('».', x + currWidth, y)
				currWidth += ctx.measureText('».').width + fontSize / 5
			}
		} else {
			// if string
			ctx.fillText(ent, x + currWidth, y)
			currWidth += ctx.measureText(ent).width + fontSize / 5
		}
	}
}
