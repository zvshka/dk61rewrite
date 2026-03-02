import { Image, loadImage, SKRSContext2D } from '@napi-rs/canvas'
import { parse } from '@twemoji/parser'

// starting function from here
const emojiPercent1 = 0.1
const emojiPercent2 = 0.7

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

function fillQuoteText(
	ctx: SKRSContext2D,
	img: Image,
	x: number,
	y: number,
	currWidth: number,
	emojiSideMargin: number,
	emojiUpMargin: number,
	fontSize: number,
	baseLine: number
) {
	const emojiWidthCoefficient = img.height / fontSize
	const emojiWidth = img.width / emojiWidthCoefficient
	ctx.drawImage(
		img,
		x + currWidth + emojiSideMargin,
		y + emojiUpMargin - fontSize - baseLine,
		emojiWidth,
		fontSize
	)

	currWidth += emojiWidth + emojiSideMargin * 2 + fontSize / 5

	return currWidth
}

export async function fillWithEmoji(ctx: SKRSContext2D, text: string, x: number, y: number) {
	if (!text) throw new Error('(discord-emoji-canvas) No Text was provided')
	if (!ctx) throw new Error(`(discord-emoji-canvas) No Context was provided`)
	if (!x) throw new Error(`(discord-emoji-canvas) No x axis was provided`)
	if (!y) throw new Error(`(discord-emoji-canvas) No y axis was provided`)
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
		if (ent.startsWith('«')) {
			ctx.fillText('«', x + currWidth, y)
			currWidth += ctx.measureText('«').width + fontSize / 5
		}
		if (ent.endsWith('».')) {
			ctx.fillText('».', x + currWidth, y)
			currWidth += ctx.measureText('».').width + fontSize / 5
		}
		if (matched) {
			const img = await loadImage(
				`https://cdn.discordapp.com/emojis/${matched![2]}.png`
			)
			currWidth = fillQuoteText(ctx, img, x, y, currWidth, emojiSideMargin, emojiUpMargin, fontSize, baseLine)
		} else if (parsed.length > 0) {
			// checking if twemoji or not
			const img = await loadImage(parsed[0].url)
			currWidth = fillQuoteText(ctx, img, x, y, currWidth, emojiSideMargin, emojiUpMargin, fontSize, baseLine)
		} else {
			// if string
			ctx.fillText(ent, x + currWidth, y)
			currWidth += ctx.measureText(ent).width + fontSize / 5
		}
	}
}
