import { Buffer } from 'node:buffer'

import { Canvas, createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas'
import axios from 'axios'
import { Attachment, AttachmentBuilder, Message, MessageContextMenuCommandInteraction } from 'discord.js'

import { fillWithEmoji } from './fillWithEmoji'

export const mainTextSize = 52
export const secondaryTextSize = 42
export const globalMargin = 25

/**
 * Цитировать сообщение.
 * @param initiator
 * @param background
 * @private
 */
export async function quoteMessage(initiator: MessageContextMenuCommandInteraction | Message, background?: Attachment) {
	// Получаем полную информацию о сообщении.
	const targetMessage = initiator instanceof MessageContextMenuCommandInteraction ? initiator.targetMessage : await initiator.fetchReference()
	// Если таковой нет, то кидаем ошибку.
	if (!targetMessage) return initiator.reply('Нет сообщения для цитирования.')
	// Если сообщение не содержит текст - кидаем ошибку.
	if (!targetMessage.content || targetMessage.content.trim().length === 0) return initiator.reply('В сообщении нет текста.')

	// Создаем канвас для отрисовки
	const textCanvas = createCanvas(1000, 500)
	const textCtx = textCanvas.getContext('2d')

	// Получаем полные данные человека, который отправил цитируемое сообщение.
	const name = targetMessage.author.username

	let content = targetMessage.content.trim()
	for (const [id, user] of targetMessage.mentions.users) {
		const member = targetMessage.guild?.members.cache.get(id)
		const toReplace = member ? `@${member.displayName}` : `@${user.username}`
		content = content.replaceAll(`<@${id}>`, toReplace).replaceAll(`<@!${id}>`, toReplace)
	}

	const text = `«${content}».`
	const lines = text.split('\n')
		.map(row => getLines(textCtx, row, 880, `${mainTextSize}px Google Sans Italic`)).flat()

	const width = 1000
	const height = 155 + calcHeight(lines) + 270

	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	// Фон
	ctx.textBaseline = 'top'

	if (background) {
		const response = await axios.get(background.url, {
			responseType: 'arraybuffer',
		})
		// Получаем буфер изображения
		const imageBuffer = Buffer.from(response.data)
		const image = await loadImage(imageBuffer)
		ctx.drawImage(image, 0, 0, width, height)
		ctx.globalAlpha = 0.35
		ctx.fillStyle = `rgb(0, 0, 0)`
		ctx.fillRect(0, 0, width, height)
		ctx.globalAlpha = 1
	} else {
		ctx.fillStyle = `rgb(0, 0, 0)`
		ctx.fillRect(0, 0, width, height)
	}

	ctx.fillStyle = '#ffffff'
	ctx.font = `${mainTextSize}px Google Sans Regular`
	ctx.fillText('Цитаты великих людей', 215, 35 + globalMargin)

	ctx.font = `${mainTextSize}px "Google Sans Italic"`
	for (let i = 0; i < lines.length; i++) {
		const y = 155 + i * mainTextSize + i * 23
		const line = lines[i]
		await fillWithEmoji(ctx, line.length > 0 ? line : ' ', 60, y + globalMargin)
	}

	ctx.font = `${secondaryTextSize}px Google Sans Regular`
	ctx.fillText('©', 250, height - 180 + globalMargin)
	ctx.font = applyText(canvas, name)
	ctx.fillText(name, 280, height - 180 + globalMargin)

	const avatar = await loadImage(targetMessage.author.displayAvatarURL({ extension: 'jpg' }))
	const radius = 75
	const avatarY = height - 210
	ctx.beginPath()
	ctx.arc(135, avatarY + radius, radius, 0, Math.PI * 2, true)
	ctx.closePath()
	ctx.clip()
	ctx.drawImage(avatar, 60, avatarY, 150, 150)
	const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'quote.png' })
	if (initiator instanceof MessageContextMenuCommandInteraction) {
		await initiator.followUp({
			files: [
				attachment,
			],
		})
	} else {
		await initiator.reply({
			files: [
				attachment,
			],
		})
	}
}

/**
 * Применить текст.
 * @param canvas
 * @param text
 * @param font
 * @param fontSize
 * @private
 */
function applyText(canvas: Canvas, text: string, font = 'Google Sans Regular', fontSize = mainTextSize - 2) {
	const ctx = canvas.getContext('2d')
	ctx.textBaseline = 'top'

	do {
		// Assign the font to the context and decrement it, so it can be measured again
		ctx.font = `${fontSize -= 2}px ${font}`
		// Compare pixel width of the text to the canvas minus the approximate avatar size
	} while (ctx.measureText(text).width > canvas.width - 300)

	// Return the result to use in the actual canvas
	return ctx.font
}

/**
 * Получить линии.
 */
function getLines(ctx: SKRSContext2D, text: string, maxWidth: number, font: string) {
	const words = text.split(' ')
	const lines = []
	let currentLine = words[0]

	const tempFont = ctx.font
	ctx.font = font

	for (let i = 1; i < words.length; i++) {
		const word = words[i]
		const toMeasure = `${currentLine} ${word}`
		const width = ctx.measureText(
			toMeasure
				.replaceAll(/<?(a:|:)\w*:(\d{17}|\d{18})>/gi, 'EM')
		).width
		if (width < maxWidth) {
			currentLine += ` ${word}`
		} else {
			lines.push(currentLine)
			currentLine = word
		}
	}
	lines.push(currentLine)
	ctx.font = tempFont

	return lines
}

/**
 * Посчитать высоты линии.
 * @param lines
 */
function calcHeight(lines: string | any[]) {
	return lines.length * 52 + lines.length * 23
}
