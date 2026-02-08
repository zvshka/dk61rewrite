import { Category } from '@discordx/utilities'
import { GlobalFonts } from '@napi-rs/canvas'
import {
	ApplicationCommandType,
	MessageContextMenuCommandInteraction,
} from 'discord.js'
import { Client } from 'discordx'

import { ContextMenu, Discord } from '@/decorators'

import { quoteMessage } from '../../utils/functions/messageQuoting'

GlobalFonts.registerFromPath('./assets/fonts/GoogleSans-Regular.ttf', 'Google Sans Regular')
GlobalFonts.registerFromPath('./assets/fonts/GoogleSans-Italic.ttf', 'Google Sans Italic')

@Discord()
@Category('General')
export default class QuoteHandlers {

	constructor() {
	}

	@ContextMenu({
		name: 'Цитировать',
		type: ApplicationCommandType.Message,
	})
	async quoteContextHandler(
		interaction: MessageContextMenuCommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		return quoteMessage(interaction)
	}

}
