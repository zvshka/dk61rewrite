import { env } from '@/env'
import { getPrefixFromMessage } from '@/utils/functions'

import { GeneralConfigType } from '../utils/types/configs'

export const generalConfig: GeneralConfigType = {

	name: 'DK61', // the name of your bot
	description: '', // the description of your bot
	defaultLocale: 'ru', // default language of the bot, must be a valid locale
	ownerId: env.BOT_OWNER_ID,
	timezone: 'Europe/Moscow', // default TimeZone to well format and localize dates (logs, stats, etc)

	defaultPrefix: '.',
	simpleCommandsPrefix: message => getPrefixFromMessage(message), // default prefix for simple command messages (old way to do commands on discord)
	quoting: '\\',
	automaticDeferring: true, // enable or not the automatic deferring of the replies of the bot on the command interactions

	// useful links
	links: {
		invite: 'https://discord.com/oauth2/authorize?client_id=595909192678768652&scope=bot',
		supportServer: 'Сам себе помоги (❁´◡`❁)',
		gitRemoteRepo: 'https://github.com/zvshka/dk61rewrite',
	},

	automaticUploadImagesToImgur: false, // enable or not the automatic assets upload

	devs: [], // discord IDs of the devs that are working on the bot (you don't have to put the owner's id here)

	// define the bot activities (phrases under its name). Types can be: PLAYING, LISTENING, WATCHING, STREAMING
	activities: [
		{
			text: 'Хофлена на мыло!',
			type: 'PLAYING',
		},
		{
			text: 'Фотки чурочки фруктовой',
			type: 'STREAMING',
		},
	],

}

// global colors
export const colorsConfig = {
	primary: '#2F3136',
}
