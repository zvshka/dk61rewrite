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
		VOICE: {
			NAME: 'voice',
			DESCRIPTION: 'Personal temporary voice rooms',
			SETUP: {
				NAME: 'setup',
				DESCRIPTION: 'Configure the hub channel and category for personal rooms',
				SAVED: 'Saved — hub: {hub}, name template: {template}, default limit: {limit}',
			},
			RENAME: {
				NAME: 'rename',
				DESCRIPTION: 'Rename your room',
			},
			LIMIT: {
				NAME: 'limit',
				DESCRIPTION: 'Set the member limit (0 — unlimited)',
			},
			LOCK: {
				NAME: 'lock',
				DESCRIPTION: 'Close your room for everyone except permitted users',
			},
			UNLOCK: {
				NAME: 'unlock',
				DESCRIPTION: 'Open your room for everyone again',
			},
			PERMIT: {
				NAME: 'permit',
				DESCRIPTION: 'Allow a user to join your room',
			},
			DENY: {
				NAME: 'deny',
				DESCRIPTION: 'Deny a user access to your room',
			},
			KICK: {
				NAME: 'kick',
				DESCRIPTION: 'Kick a user out of your room',
			},
			OPTIONS: {
				HUB: {
					NAME: 'hub',
					DESCRIPTION: 'Hub voice channel: joining it creates a room',
				},
				CATEGORY: {
					NAME: 'category',
					DESCRIPTION: 'Category for temporary channels',
				},
				TEMPLATE: {
					NAME: 'template',
					DESCRIPTION: 'Channel name template, the member nickname is substituted automatically',
				},
				DEFAULT_LIMIT: {
					NAME: 'default_limit',
					DESCRIPTION: 'Default member limit for new rooms',
				},
				NAME: {
					NAME: 'name',
					DESCRIPTION: 'New channel name',
				},
				LIMIT: {
					NAME: 'limit',
					DESCRIPTION: 'Member limit, 0 — unlimited',
				},
				USER: {
					NAME: 'user',
					DESCRIPTION: 'User',
				},
			},
			PANEL: {
				TITLE: 'Your voice room',
				DESCRIPTION: `Owner: {owner}
Limit: {limit}
Access: {lockState}`,
				LOCKED: 'closed',
				UNLOCKED: 'open',
				UNLIMITED: 'unlimited',
				BTN_RENAME: 'Rename',
				BTN_LIMIT: 'Limit',
				BTN_LOCK: 'Close',
				BTN_UNLOCK: 'Open',
				SEL_PERMIT: 'Allow a user',
				SEL_DENY: 'Deny a user',
				SEL_KICK: 'Kick a user',
			},
			MODAL: {
				RENAME_TITLE: 'Rename room',
				RENAME_LABEL: 'New name',
				LIMIT_TITLE: 'Member limit',
				LIMIT_LABEL: 'Limit (0 — unlimited)',
			},
			ERRORS: {
				NOT_IN_ROOM: 'Join your own temporary channel first to manage it.',
				NOT_OWNER: 'Only the room owner can do that.',
				NOT_TEMP_CHANNEL: 'This is not a temporary room.',
				INVALID_NAME: 'Name must not be empty.',
				INVALID_LIMIT: 'Limit must be between {min} and {max}.',
				TARGET_IS_OWNER: 'You cannot do that to yourself.',
				USER_NOT_IN_ROOM: 'That user is not in your room.',
				MISSING_PERMISSIONS: 'I am missing permissions: {permissions}',
			},
			SUCCESS: {
				RENAMED: 'Room renamed.',
				LIMIT_SET: 'Limit updated: {limit}',
				LOCKED: 'Room closed.',
				UNLOCKED: 'Room opened.',
				PERMITTED: 'Access granted to {user}.',
				DENIED: 'Access denied to {user}.',
				KICKED: '{user} was kicked out.',
			},
		},
	},
} satisfies BaseTranslation

export default en
