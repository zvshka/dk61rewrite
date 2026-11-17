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
		NOT_VOTED: 'Вы еще не голосовали.',
	},
	COMMANDS: {
		QUOTE: {
			NAME: 'Цитировать',
			DESCRIPTION: 'Цитирование сообщения.',
		},
		SETTINGS: {
			NAME: 'настройки',
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
			NAME: 'приглашение',
			DESCRIPTION: 'Пригласить бота на свой сервер!',
			EMBED: {
				TITLE: 'Хочешь видеть меня у себя на сервере?',
				DESCRIPTION: '[Жми здесь]({link}) чтобы добавить бота!',
			},
		},
		PREFIX: {
			NAME: 'префикс',
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
			NAME: 'статистика',
			DESCRIPTION: 'Получить статистику по боту.',
			HEADERS: {
				COMMANDS: 'Команды',
				GUILDS: 'Сервера',
				ACTIVE_USERS: 'Активные пользователи',
				USERS: 'Пользователи',
			},
		},
		HELP: {
			NAME: 'помощь',
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
			NAME: 'предложение',
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
		VOICE: {
			NAME: 'voice',
			DESCRIPTION: 'Персональные временные голосовые комнаты',
			SETUP: {
				NAME: 'setup',
				DESCRIPTION: 'Настроить канал-хаб и категорию для персональных комнат',
				SAVED: 'Сохранено - хаб: {hub}, шаблон имени: {template}, лимит по умолчанию: {limit}',
			},
			RENAME: {
				NAME: 'rename',
				DESCRIPTION: 'Переименовать свою комнату',
			},
			LIMIT: {
				NAME: 'limit',
				DESCRIPTION: 'Задать лимит участников (0 - без лимита)',
			},
			LOCK: {
				NAME: 'lock',
				DESCRIPTION: 'Закрыть комнату для всех, кроме разрешённых',
			},
			UNLOCK: {
				NAME: 'unlock',
				DESCRIPTION: 'Снова открыть комнату для всех',
			},
			PERMIT: {
				NAME: 'permit',
				DESCRIPTION: 'Разрешить пользователю вход в свою комнату',
			},
			DENY: {
				NAME: 'deny',
				DESCRIPTION: 'Запретить пользователю вход в свою комнату',
			},
			KICK: {
				NAME: 'kick',
				DESCRIPTION: 'Выгнать пользователя из своей комнаты',
			},
			RESET: {
				NAME: 'reset',
				DESCRIPTION: 'Сбросить комнату к настройкам сервера и забыть сохранённые настройки',
			},
			DELETE: {
				NAME: 'delete',
				DESCRIPTION: 'Удалить свою комнату сразу, не дожидаясь автовыхода',
			},
			OPTIONS: {
				HUB: {
					NAME: 'hub',
					DESCRIPTION: 'Канал-хаб: вход в него создаёт комнату',
				},
				CATEGORY: {
					NAME: 'category',
					DESCRIPTION: 'Категория для временных каналов',
				},
				TEMPLATE: {
					NAME: 'template',
					DESCRIPTION: 'Шаблон имени канала, ник участника подставляется автоматически',
				},
				DEFAULT_LIMIT: {
					NAME: 'default_limit',
					DESCRIPTION: 'Лимит участников по умолчанию для новых комнат',
				},
				NAME: {
					NAME: 'name',
					DESCRIPTION: 'Новое имя канала',
				},
				LIMIT: {
					NAME: 'limit',
					DESCRIPTION: 'Лимит участников, 0 - без лимита',
				},
				USER: {
					NAME: 'user',
					DESCRIPTION: 'Пользователь',
				},
			},
			PANEL: {
				TITLE: 'Ваша голосовая комната',
				DESCRIPTION: `Владелец: {owner}
Лимит: {limit}
Доступ: {lockState}`,
				LOCKED: 'закрыта',
				UNLOCKED: 'открыта',
				UNLIMITED: 'без лимита',
				BTN_RENAME: 'Переименовать',
				BTN_LIMIT: 'Лимит',
				BTN_LOCK: 'Закрыть',
				BTN_UNLOCK: 'Открыть',
				BTN_RESET: 'Сброс',
				BTN_DELETE: 'Удалить',
				SEL_PERMIT: 'Разрешить пользователю',
				SEL_DENY: 'Запретить пользователю',
				SEL_KICK: 'Выгнать пользователя',
			},
			MODAL: {
				RENAME_TITLE: 'Переименование комнаты',
				RENAME_LABEL: 'Новое имя',
				LIMIT_TITLE: 'Лимит участников',
				LIMIT_LABEL: 'Лимит (0 - без лимита)',
			},
			ERRORS: {
				NOT_IN_ROOM: 'Сначала зайди в свою временную комнату - управление доступно только из неё.',
				NOT_OWNER: 'Это может сделать только владелец комнаты.',
				NOT_TEMP_CHANNEL: 'Это не временная комната.',
				INVALID_NAME: 'Имя не может быть пустым.',
				INVALID_LIMIT: 'Лимит должен быть от {min} до {max}.',
				TARGET_IS_OWNER: 'Это нельзя сделать с самим собой.',
				USER_NOT_IN_ROOM: 'Этого пользователя нет в твоей комнате.',
				MISSING_PERMISSIONS: 'Мне не хватает прав: {permissions}',
			},
			SUCCESS: {
				RENAMED: 'Комната переименована.',
				LIMIT_SET: 'Лимит обновлён: {limit}',
				LOCKED: 'Комната закрыта.',
				UNLOCKED: 'Комната открыта.',
				PERMITTED: 'Доступ разрешён: {user}',
				DENIED: 'Доступ запрещён: {user}',
				KICKED: '{user} выгнан из комнаты.',
				RESET: 'Комната сброшена к настройкам сервера.',
				DELETED: 'Комната удалена.',
			},
		},
	},
} satisfies Translation

export default ru
