/* eslint-disable */
import type { Translation } from '../i18n-types'

const ru = {
	GUARDS: {
		DISABLED_COMMAND: 'Эта команда на данный момент не доступна.',
		MAINTENANCE: 'Бот закрыт на техническое обслуживание.',
		GUILD_ONLY: 'Эту команду можно использовать только на сервере.',
		NSFW: 'Эта команда доступна только в чатах 18+.',
	},
	ERRORS: {
		UNKNOWN: 'Произошла непонятная ошибка.',
	},
	SHARED: {
		NO_COMMAND_DESCRIPTION: 'Описание отсутствует.',
	},
	PROPOSAL_ERROR: {
		NOT_PROPOSAL: 'Это не голосование.',
		NOT_FOUND: 'Голосование не найдено.',
		ENDED: 'Голосование уже завершено.',
		EMPTY_FIELDS: 'Заполните все поля.',
		CHANNEL_INVALID: 'Канал для голосовалки больше не существует.',
		ALREADY_VOTED_FOR: 'Вы уже проголосовали за это предложение.',
		ALREADY_VOTED_AGAINST: 'Вы уже проголосовали против этого предложения.',
	},
	COMMANDS: {
		QUOTE: {
			NAME: 'Цитировать',
			DESCRIPTION: 'Цитирование сообщения.',
		},
		SETTINGS: {
			OPTIONS: {
				STARBOARD_CHANNEL: 'Канал доски почета',
				STARBOARD_EMOJI: 'Реакция для доски почета',
				STARBOARD_COUNT: 'Необходимое количество',
				QUOTES_PREFIX: 'Префикс для цитат',
				PROPOSAL_CHANNEL: 'Канал для отправки голосовалок',
			},
			EMBED: {
				DESCRIPTION: 'Настройки успешно обновлены!',
			},
		},
		INVITE: {
			DESCRIPTION: 'Пригласить бота на свой сервер!',
			EMBED: {
				TITLE: 'Хочешь видеть меня у себя на сервере?',
				DESCRIPTION: '[Жми здесь]({link}) чтобы добавить бота!',
			},
		},
		PREFIX: {
			NAME: 'prefix',
			DESCRIPTION: 'Изменить префикс для бота.',
			OPTIONS: {
				PREFIX: {
					NAME: 'new_prefix',
					DESCRIPTION: 'Новый префикс для бота.',
				},
			},
			EMBED: {
				DESCRIPTION: 'Префикс бота изменен на `{prefix}`.',
			},
		},
		MAINTENANCE: {
			DESCRIPTION: 'Установить режим технического обслуживания бота.',
			EMBED: {
				DESCRIPTION: 'Режим Технического Обслуживания установлен на `{state}`.',
			},
		},
		STATS: {
			DESCRIPTION: 'Получить статистику по боту.',
			HEADERS: {
				COMMANDS: 'Команды',
				GUILDS: 'Сервера',
				ACTIVE_USERS: 'Активные пользователи',
				USERS: 'Пользователи',
			},
		},
		HELP: {
			DESCRIPTION: 'Глобальная справка по боту и его командам',
			EMBED: {
				TITLE: 'Панель помощи',
				CATEGORY_TITLE: '{category} команды',
			},
			SELECT_MENU: {
				TITLE: 'Выбери категорию',
				CATEGORY_DESCRIPTION: '{category} команды',
			},
		},
		PING: {
			DESCRIPTION: 'Тук-тук!',
			MESSAGE: '{member} Что нужно? Было потрачено {time} миллисекунд на генерацию ответа. {heartbeat}',
		},
		PROPOSAL: {
			NAME: 'proposal',
			DESCRIPTION: 'Создать новое предложение для голосования',
			OPTIONS: {
				TOPIC: {
					NAME: 'topic',
					DESCRIPTION: 'Тема предложения',
				},
			},
			NO_CHANNEL: 'В этом сервере не настроен канал для голосовалки. Обратитесь к администратору.',
			MODAL: {
				TITLE: 'Новое предложение',
				TOPIC: 'Тема предложения',
				DESCRIPTION: 'Текст предложения',
			},
			SUCCESS: 'Предложение успешно создано и отправлено в канал голосовалки!',
		},
	},
} satisfies Translation

export default ru
