/* eslint-disable */
import type { BaseTranslation } from '../i18n-types'

const en = {
	GUARDS: {
		DISABLED_COMMAND: 'This command is currently disabled.',
		MAINTENANCE: 'This bot is currently in maintenance mode.',
		GUILD_ONLY: 'This command can only be used in a server.',
		NSFW: 'This command can only be used in a NSFW channel.',
	},
	ERRORS: {
		UNKNOWN: 'An unknown error occurred.',
	},
	SHARED: {
		NO_COMMAND_DESCRIPTION: 'No description provided.',
	},
	PROPOSAL_ERROR: {
		NOT_PROPOSAL: 'This is not a proposal.',
		NOT_FOUND: 'Proposal not found.',
		ENDED: 'Voting has already ended.',
		EMPTY_FIELDS: 'Fill in all fields.',
		CHANNEL_INVALID: 'The proposal channel no longer exists.',
		ALREADY_VOTED_FOR: 'You have already voted for this proposal.',
		ALREADY_VOTED_AGAINST: 'You have already voted against this proposal.',
		NOT_VOTED: 'You are not voted yet.',
	},
	COMMANDS: {
		QUOTE: {
			NAME: 'Quote',
			DESCRIPTION: 'Message quoting.',
		},
		SETTINGS: {
			NAME: 'settings',
			OPTIONS: {
				STARBOARD_CHANNEL: 'Starboard channel',
				STARBOARD_EMOJI: 'Emoji for starboard',
				STARBOARD_COUNT: 'Emoji count',
				QUOTES_PREFIX: 'Prefix for quoting',
				PROPOSAL_CHANNEL: 'Channel for sending proposals',
			},
			EMBED: {
				DESCRIPTION: 'Settings updated successfully!',
			},
		},
		INVITE: {
			NAME: 'invite',
			DESCRIPTION: 'Invite the bot to your server!',
			EMBED: {
				TITLE: 'Invite me on your server!',
				DESCRIPTION: '[Click here]({link}) to invite me!',
			},
		},
		PREFIX: {
			NAME: 'prefix',
			DESCRIPTION: 'Change the prefix of the bot.',
			OPTIONS: {
				PREFIX: {
					NAME: 'new_prefix',
					DESCRIPTION: 'The new prefix of the bot.',
				},
			},
			EMBED: {
				DESCRIPTION: 'Prefix changed to `{prefix:string}`.',
			},
		},
		MAINTENANCE: {
			DESCRIPTION: 'Set the maintenance mode of the bot.',
			EMBED: {
				DESCRIPTION: 'Maintenance mode set to `{state:string}`.',
			},
		},
		STATS: {
			NAME: 'stats',
			DESCRIPTION: 'Get some stats about the bot.',
			HEADERS: {
				COMMANDS: 'Commands',
				GUILDS: 'Guild',
				ACTIVE_USERS: 'Active Users',
				USERS: 'Users',
			},
		},
		HELP: {
			NAME: 'help',
			DESCRIPTION: 'Get global help about the bot and its commands',
			EMBED: {
				TITLE: 'Help panel',
				CATEGORY_TITLE: '{category:string} Commands',
			},
			SELECT_MENU: {
				TITLE: 'Select a category',
				CATEGORY_DESCRIPTION: '{category:string} commands',
			},
		},
		PING: {
			DESCRIPTION: 'Pong!',
			MESSAGE: '{member:string} Pong! The message round-trip took {time:number}ms.{heartbeat:string}',
		},
		PROPOSAL: {
			NAME: 'proposal',
			DESCRIPTION: 'Create a new proposal for community voting',
			OPTIONS: {
				TOPIC: {
					NAME: 'topic',
					DESCRIPTION: 'The topic of your proposal',
				},
			},
			NO_CHANNEL: 'No proposal channel is configured for this server. Contact an administrator.',
			MODAL: {
				TITLE: 'New Proposal',
				TOPIC: 'Proposal topic',
				DESCRIPTION: 'Proposal text',
			},
			SUCCESS: 'Proposal successfully created and sent to the proposal channel!',
		},
	},
} satisfies BaseTranslation

export default en
