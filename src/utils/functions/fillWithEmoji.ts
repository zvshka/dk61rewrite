import { Image, loadImage, SKRSContext2D } from '@napi-rs/canvas'
import { parse } from '@twemoji/parser'

const emojiPercent1 = 0
const emojiPercent2 = 0.9

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

function fillQuoteWithImage(
	ctx: SKRSContext2D,
	img: Image,
	x: number,
	y: number,
	currWidth: number,
	emojiSideMargin: number,
	emojiUpMargin: number,
	fontSize: number,
	baseLine: number,
	applyMargins: boolean = true
) {
	const emojiWidthCoefficient = img.height / fontSize
	const emojiWidth = img.width / emojiWidthCoefficient

	const drawX = x + currWidth + (applyMargins ? emojiSideMargin : 0)

	ctx.drawImage(
		img,
		drawX,
		y + emojiUpMargin - fontSize - baseLine,
		emojiWidth,
		fontSize
	)

	// Возвращаем ширину с учётом (или без) отступов
	return currWidth + emojiWidth + (applyMargins ? emojiSideMargin * 2 : 0)
}
export async function fillWithEmoji(ctx: SKRSContext2D, text: string, x: number, y: number) {
	if (!text) throw new Error('(discord-emoji-canvas) No Text was provided')
	if (!ctx) throw new Error('(discord-emoji-canvas) No Context was provided')
	if (x === undefined) throw new Error('(discord-emoji-canvas) No x axis was provided')
	if (y === undefined) throw new Error('(discord-emoji-canvas) No y axis was provided')

	const fontSize = Number.parseInt(ctx.font) || 16
	const emojiSideMargin = fontSize * emojiPercent1
	const emojiUpMargin = fontSize * emojiPercent2

	const entities = text
		.replaceAll('>', '> ')
		.split(' ')
		.map(splitEmoji)
		.flat()
		.join(' ')
		.trim()
		.split(' ')
		.filter(e => e.length > 0) // убираем пустые строки

	const baseLine = ctx.measureText('').alphabeticBaseline
	let currWidth = 0
	let lastWasEmoji = false // отслеживаем, был ли предыдущий элемент эмодзи

	for (const ent of entities) {
		const parsed = parse(ent)
		const regExToSearch = /<?(a:|:)\w*:(\d*)>/i
		const matched = ent.match(regExToSearch)
		const isEmoji = !!(matched || parsed.length > 0)

		// Добавляем отступ перед текстом, если до этого был эмодзи
		if (!isEmoji && lastWasEmoji) {
			currWidth += fontSize / 5
		}

		// Обработка кавычек (если нужно)
		if (ent.startsWith('«')) {
			ctx.fillText('«', x + currWidth, y)
			currWidth += ctx.measureText('«').width
		}
		if (ent.endsWith('»')) {
			// Обрабатываем » и ». отдельно
			const hasDot = ent.endsWith('».')
			const quoteText = hasDot ? '».' : '»'
			ctx.fillText(quoteText, x + currWidth, y)
			currWidth += ctx.measureText(quoteText).width
			lastWasEmoji = false
			continue
		}

		// Определяем, нужно ли применять отступы:
		// - если это эмодзи, и следующий/предыдущий элемент — тоже эмодзи → отступы не нужны
		const applyEmojiMargins = isEmoji && !lastWasEmoji // упрощённо: отступы только при смене типа

		let img: Image | null = null
		if (matched) {
			img = await loadImage(`https://cdn.discordapp.com/emojis/${matched![2]}.png`)
		} else if (parsed.length > 0) {
			img = await loadImage(parsed[0].url)
		}

		if (img !== null) {
			currWidth = fillQuoteWithImage(
				ctx,
				img,
				x,
				y,
				currWidth,
				emojiSideMargin,
				emojiUpMargin,
				fontSize,
				baseLine,
				applyEmojiMargins
			)
			lastWasEmoji = true
		} else {
			// Текст: добавляем отступ перед ним, если до этого был эмодзи
			if (lastWasEmoji && emojiSideMargin > 0) {
				currWidth += emojiSideMargin
			}
			ctx.fillText(ent, x + currWidth, y)
			currWidth += ctx.measureText(ent).width + fontSize / 5
			lastWasEmoji = false
		}
	}
}
