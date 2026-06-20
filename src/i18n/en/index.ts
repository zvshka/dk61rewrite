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
		LLM: {
			NAME: 'llm',
			DESCRIPTION: 'Ask an AI assistant a question',
			OPTIONS: {
				SUBCOMMAND: {
					NAME: 'subcommand',
					DESCRIPTION: 'Choose an action',
				},
				QUESTION: {
					NAME: 'question',
					DESCRIPTION: 'Your question for the AI',
				},
			},
			CHOICES: {
				ASK: 'Ask',
				RESET: 'Reset',
			},
			RESET_SUCCESS: 'Conversation history has been reset.',
			NO_QUESTION: 'Please provide a question after selecting "Ask".',
			ERROR: 'Error generating response: {error}',
		},
		RSS: {
			NAME: 'rss',
			DESCRIPTION: 'Manage server RSS news feeds',
			ADD: {
				NAME: 'add',
				DESCRIPTION: 'Add a new RSS feed',
			},
			REMOVE: {
				NAME: 'remove',
				DESCRIPTION: 'Remove an RSS feed from the server',
			},
			LIST: {
				NAME: 'list',
				DESCRIPTION: 'Show all RSS feeds on the server',
			},
			CHANNEL: {
				NAME: 'channel',
				DESCRIPTION: 'Change the channel for an RSS feed',
			},
			TEST: {
				NAME: 'test',
				DESCRIPTION: 'Test an RSS feed without saving',
			},
			OPTIONS: {
				ACTION: {
					NAME: 'action',
					DESCRIPTION: 'Choose an action',
				},
				URL: {
					NAME: 'url',
					DESCRIPTION: 'RSS feed URL',
				},
				NAME: {
					NAME: 'name',
					DESCRIPTION: 'Display name for the feed',
				},
				CHANNEL: {
					NAME: 'channel',
					DESCRIPTION: 'Channel to send news to',
				},
				FEED_ID: {
					NAME: 'feed',
					DESCRIPTION: 'Feed ID to modify/remove',
				},
			},
			ADDED: 'RSS feed added successfully!',
			REMOVED: 'RSS feed removed successfully!',
			LIST_TITLE: 'Server RSS Feeds',
			NO_FEEDS: 'No RSS feeds configured on this server.',
			CHANNEL_UPDATED: 'RSS feed channel updated!',
			TEST_EMPTY: 'Feed has no entries or is invalid.',
			ERRORS: {
				NO_URL: 'Please provide an RSS feed URL.',
				NO_FEED_ID: 'Please provide a feed ID.',
				NO_CHANNEL: 'Please provide a channel.',
				UNKNOWN_ACTION: 'Unknown action. Use: add, remove, list, channel, test.',
			},
		},
	},
} satisfies BaseTranslation

export default en
