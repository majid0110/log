// English and Russian text for the whole site. No React in this file, so tests and helpers can use it.

export type Lang = 'en' | 'ru'

const en = {
  // sign-in and setup
  'app.tagline': 'Your own record of the days you worked.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.wait': 'Please wait…',
  'auth.signIn': 'Sign in',
  'auth.create': 'Create my account',
  'auth.first': 'First time? Create your account',
  'auth.have': 'I already have an account',
  'auth.created': 'Account created. Check your email to confirm it, then sign in.',
  'common.error': 'Something went wrong.',
  'common.saving': 'Saving…',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.cancel': 'Cancel',
  'setup.title': 'Almost there',
  'setup.a': 'This site is built but not yet connected to its database. Add',
  'setup.and': 'and',
  'setup.b': 'as repository secrets, then re-run the deploy. See the README.',

  // navigation and shell
  'nav.today': 'Today',
  'nav.calendar': 'Calendar',
  'nav.history': 'History',
  'nav.salary': 'Salary',
  'nav.main': 'Main',
  'aria.theme': 'Switch theme',
  'aria.signOut': 'Sign out',
  'aria.prevMonth': 'Previous month',
  'aria.nextMonth': 'Next month',
  'aria.language': 'Language',
  'credit': 'Designed & built by',
  'toast.entry': 'Saved. Entry time recorded.',
  'toast.exit': 'Saved. Exit time recorded.',
  'toast.saved': 'Saved.',
  'toast.deleted': 'Day deleted.',
  'toast.failed': 'Could not save.',
  'err.load': 'Could not load your records.',
  'err.duplicate': 'That day is already recorded.',
  'err.exitAfter': 'The exit time must be after the entry time, and within 24 hours of it.',
  'err.needSetup': 'The database needs the latest setup. Run supabase/schema.sql in the Supabase SQL Editor, then reload.',
  'unit.h': 'h',
  'unit.m': 'm',
  'unit.perHour': '/ hour',

  // today
  'home.newMonth': 'New month, same rate?',
  'home.rateStill': 'Your rate is still {rate} {cur}/hour. Tap to confirm or change it.',
  'home.btnIn': 'I Worked Today',
  'home.btnOut': 'Record Exit',
  'home.btnDone': 'Done for today',
  'home.subIn': 'Tap to record your entry time',
  'home.subOut': 'In at {time} · working {dur}',
  'home.subDone': 'Recorded for today',
  'home.openWrong': 'This shift started on {date}. Wrong? Edit it',
  'home.daysWorked': 'days worked in {month}',
  'home.daysTotal': 'days recorded in total',
  'home.salarySoFar': 'Salary so far, {month} {period}',
  'home.paidDays': '{dur} paid · {days}',
  'home.setRate': 'Set your hourly rate',

  // add / edit a day
  'modal.edit': 'Edit day',
  'modal.add': 'Add a day',
  'modal.date': 'Date the shift started',
  'modal.entry': 'Entry time',
  'modal.exit': 'Exit time',
  'modal.overnight': 'The exit is earlier than the entry, so this shift ends the next day.',
  'modal.noExit': 'No exit time yet: this day is not counted in your salary until you add one.',
  'modal.note': 'Note (optional)',
  'modal.notePh': 'e.g. Face scanner showed absent',
  'modal.confirmDelete': 'Yes, delete this day',

  // history and calendar
  'hist.add': 'Add missed day',
  'hist.export': 'Export for Excel',
  'hist.exportDesc': 'Date, day, entry, exit, hours, lunch, night hours and notes.',
  'hist.thisMonth': 'This month',
  'hist.everything': 'Everything',
  'hist.empty': 'No days recorded yet. Tap “I Worked Today” on the Today tab.',
  'hist.timesMissing': '{wd} · times missing, tap to add',
  'hist.noExit': '{wd} · in {in} · no exit yet',
  'hist.times': '{wd} · {in} → {out}{next}',
  'hist.paid': '{dur} paid',
  'hist.night': '{dur} night',
  'cal.dow': 'M,T,W,T,F,S,S',
  'cal.tap': 'Tap a day to add, edit or remove it.',
  'cal.workedAria': ', worked',

  // salary
  'salary.paidTwice': 'Paid twice a month',
  'rate.title': 'Hourly rate · {month}',
  'rate.none': 'Not set yet',
  'rate.carried': 'Carried over from an earlier month. Change it if it is different now.',
  'rate.change': 'Change',
  'rate.set': 'Set rate',
  'rate.label': 'Rate per hour',
  'rate.currency': 'Currency (optional)',
  'rate.currencyPh': 'e.g. ₽ or PKR',
  'rate.applies': 'Applies to {month} and later months, until you change it again.',
  'rate.saveBtn': 'Save rate',
  'rate.errNumber': 'Enter the hourly rate as a number, for example 12.50',
  'rate.errSave': 'Could not save the rate.',
  'period.salary': 'Salary',
  'period.salaryBonus': 'Salary + bonus',
  'period.failed': 'Could not load this period. Make sure the latest database setup has been run.',
  'period.days': 'Days worked',
  'period.paidHours': 'Paid hours (after lunch)',
  'period.night': 'Night hours',
  'period.base': 'Base pay',
  'period.nightExtra': 'Night extra (+30%)',
  'period.bonus': 'Bonus',
  'period.bonusInput': 'Bonus (not fixed, type it in)',
  'period.saveBonus': 'Save bonus',
  'period.total': 'Total',
  'period.totalBonus': 'Total with bonus',
  'period.setRateHint': 'Set your hourly rate above to see the pay.',
  'period.bonusErr': 'Enter the bonus as a number, or leave it empty.',
  'period.bonusSaveErr': 'Could not save the bonus.',
  'rules.title': 'How pay is calculated',
  'rules.1': 'Hours are from your entry time to your exit time.',
  'rules.2': 'Unpaid lunch is taken off automatically: 30 min for a shift of up to 8 hours, 45 min for over 8 and under 12 hours, and 60 min for 12 hours or more.',
  'rules.3': 'Hours between 22:00 and 07:00 earn an extra 30% of your hourly rate. Lunch is taken from daytime hours first.',
  'rules.4': 'Pay = paid hours × hourly rate, plus the night extra. The second period adds the bonus you type in.',
  'rules.5': 'Days with an entry time but no exit time are not counted until you add the exit time.',

  // CSV export
  'csv.date': 'Date',
  'csv.day': 'Day',
  'csv.entry': 'Entry time',
  'csv.exit': 'Exit time',
  'csv.worked': 'Hours worked',
  'csv.lunch': 'Lunch break (min)',
  'csv.paid': 'Paid hours',
  'csv.night': 'Night hours',
  'csv.notes': 'Notes',
} as const

export type Key = keyof typeof en

const ru: Record<Key, string> = {
  'app.tagline': 'Ваш личный учёт отработанных дней.',
  'auth.email': 'Эл. почта',
  'auth.password': 'Пароль',
  'auth.wait': 'Подождите…',
  'auth.signIn': 'Войти',
  'auth.create': 'Создать аккаунт',
  'auth.first': 'Впервые здесь? Создайте аккаунт',
  'auth.have': 'У меня уже есть аккаунт',
  'auth.created': 'Аккаунт создан. Подтвердите почту по письму, затем войдите.',
  'common.error': 'Что-то пошло не так.',
  'common.saving': 'Сохранение…',
  'common.save': 'Сохранить',
  'common.delete': 'Удалить',
  'common.cancel': 'Отмена',
  'setup.title': 'Почти готово',
  'setup.a': 'Сайт собран, но ещё не подключён к базе данных. Добавьте',
  'setup.and': 'и',
  'setup.b': 'как секреты репозитория и заново запустите деплой. Подробности в README.',

  'nav.today': 'Сегодня',
  'nav.calendar': 'Календарь',
  'nav.history': 'История',
  'nav.salary': 'Зарплата',
  'nav.main': 'Главное меню',
  'aria.theme': 'Сменить тему',
  'aria.signOut': 'Выйти',
  'aria.prevMonth': 'Предыдущий месяц',
  'aria.nextMonth': 'Следующий месяц',
  'aria.language': 'Язык',
  'credit': 'Дизайн и разработка:',
  'toast.entry': 'Сохранено. Время входа записано.',
  'toast.exit': 'Сохранено. Время выхода записано.',
  'toast.saved': 'Сохранено.',
  'toast.deleted': 'День удалён.',
  'toast.failed': 'Не удалось сохранить.',
  'err.load': 'Не удалось загрузить записи.',
  'err.duplicate': 'Этот день уже записан.',
  'err.exitAfter': 'Время выхода должно быть позже времени входа и не позже чем через 24 часа.',
  'err.needSetup': 'Базе данных нужна последняя настройка. Выполните supabase/schema.sql в SQL Editor Supabase и перезагрузите страницу.',
  'unit.h': 'ч',
  'unit.m': 'м',
  'unit.perHour': '/ час',

  'home.newMonth': 'Новый месяц, та же ставка?',
  'home.rateStill': 'Ваша ставка по-прежнему {rate} {cur}/час. Нажмите, чтобы подтвердить или изменить.',
  'home.btnIn': 'Я отработал сегодня',
  'home.btnOut': 'Записать выход',
  'home.btnDone': 'На сегодня всё',
  'home.subIn': 'Нажмите, чтобы записать время входа',
  'home.subOut': 'Вход в {time} · в работе {dur}',
  'home.subDone': 'Записано на сегодня',
  'home.openWrong': 'Эта смена началась {date}. Ошибка? Изменить',
  'home.daysWorked': 'дней отработано · {month}',
  'home.daysTotal': 'дней записано всего',
  'home.salarySoFar': 'Зарплата на сегодня, {month} {period}',
  'home.paidDays': '{dur} к оплате · {days}',
  'home.setRate': 'Укажите почасовую ставку',

  'modal.edit': 'Изменить день',
  'modal.add': 'Добавить день',
  'modal.date': 'Дата начала смены',
  'modal.entry': 'Время входа',
  'modal.exit': 'Время выхода',
  'modal.overnight': 'Выход раньше входа, поэтому смена заканчивается на следующий день.',
  'modal.noExit': 'Времени выхода пока нет: день не учитывается в зарплате, пока вы его не добавите.',
  'modal.note': 'Заметка (необязательно)',
  'modal.notePh': 'например: сканер показал отсутствие',
  'modal.confirmDelete': 'Да, удалить этот день',

  'hist.add': 'Добавить пропущенный день',
  'hist.export': 'Экспорт для Excel',
  'hist.exportDesc': 'Дата, день, вход, выход, часы, обед, ночные часы и заметки.',
  'hist.thisMonth': 'Этот месяц',
  'hist.everything': 'Всё',
  'hist.empty': 'Пока нет записей. Нажмите «Я отработал сегодня» на вкладке «Сегодня».',
  'hist.timesMissing': '{wd} · нет времени, нажмите, чтобы добавить',
  'hist.noExit': '{wd} · вход {in} · выхода нет',
  'hist.times': '{wd} · {in} → {out}{next}',
  'hist.paid': '{dur} к оплате',
  'hist.night': '{dur} ночью',
  'cal.dow': 'П,В,С,Ч,П,С,В',
  'cal.tap': 'Нажмите на день, чтобы добавить, изменить или удалить его.',
  'cal.workedAria': ', отработан',

  'salary.paidTwice': 'Выплата дважды в месяц',
  'rate.title': 'Почасовая ставка · {month}',
  'rate.none': 'Пока не задана',
  'rate.carried': 'Перенесена с прошлых месяцев. Измените, если она теперь другая.',
  'rate.change': 'Изменить',
  'rate.set': 'Задать ставку',
  'rate.label': 'Ставка в час',
  'rate.currency': 'Валюта (необязательно)',
  'rate.currencyPh': 'например ₽ или PKR',
  'rate.applies': 'Действует для месяца «{month}» и последующих, пока вы её не измените.',
  'rate.saveBtn': 'Сохранить ставку',
  'rate.errNumber': 'Введите ставку числом, например 12,50',
  'rate.errSave': 'Не удалось сохранить ставку.',
  'period.salary': 'Зарплата',
  'period.salaryBonus': 'Зарплата + премия',
  'period.failed': 'Не удалось загрузить период. Убедитесь, что выполнена последняя настройка базы данных.',
  'period.days': 'Отработано дней',
  'period.paidHours': 'Оплачиваемые часы (после обеда)',
  'period.night': 'Ночные часы',
  'period.base': 'Основная оплата',
  'period.nightExtra': 'Ночная надбавка (+30%)',
  'period.bonus': 'Премия',
  'period.bonusInput': 'Премия (не фиксирована, введите вручную)',
  'period.saveBonus': 'Сохранить премию',
  'period.total': 'Итого',
  'period.totalBonus': 'Итого с премией',
  'period.setRateHint': 'Задайте почасовую ставку выше, чтобы увидеть оплату.',
  'period.bonusErr': 'Введите премию числом или оставьте поле пустым.',
  'period.bonusSaveErr': 'Не удалось сохранить премию.',
  'rules.title': 'Как считается оплата',
  'rules.1': 'Часы считаются от времени входа до времени выхода.',
  'rules.2': 'Обед вычитается автоматически: 30 мин при смене до 8 часов включительно, 45 мин при смене больше 8 и меньше 12 часов, 60 мин при 12 часах и более.',
  'rules.3': 'Часы с 22:00 до 07:00 оплачиваются с надбавкой 30% к почасовой ставке. Обед сначала вычитается из дневных часов.',
  'rules.4': 'Оплата = оплачиваемые часы × почасовая ставка плюс ночная надбавка. Ко второму периоду добавляется введённая вами премия.',
  'rules.5': 'Дни со временем входа, но без времени выхода не учитываются, пока вы не добавите выход.',

  'csv.date': 'Дата',
  'csv.day': 'День',
  'csv.entry': 'Время входа',
  'csv.exit': 'Время выхода',
  'csv.worked': 'Отработано часов',
  'csv.lunch': 'Обед (мин)',
  'csv.paid': 'Оплачиваемые часы',
  'csv.night': 'Ночные часы',
  'csv.notes': 'Заметки',
}

// Texts that depend on a number (Russian has separate forms for 1, 2-4 and 5+).
type Forms = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>

const enPlural = {
  days: { one: '{n} day', other: '{n} days' },
  daysWorked: { one: '{n} day worked', other: '{n} days worked' },
  openDays: {
    one: '{n} day has an entry time but no exit time, so it is not counted yet.',
    other: '{n} days have an entry time but no exit time, so they are not counted yet.',
  },
} satisfies Record<string, Forms>

export type PluralKey = keyof typeof enPlural

const ruPlural: Record<PluralKey, Forms> = {
  days: { one: '{n} день', few: '{n} дня', many: '{n} дней', other: '{n} дня' },
  daysWorked: {
    one: '{n} день отработан',
    few: '{n} дня отработано',
    many: '{n} дней отработано',
    other: '{n} дня отработано',
  },
  openDays: {
    one: '{n} день со временем входа, но без времени выхода: он пока не учитывается.',
    few: '{n} дня со временем входа, но без времени выхода: они пока не учитываются.',
    many: '{n} дней со временем входа, но без времени выхода: они пока не учитываются.',
    other: '{n} дня со временем входа, но без времени выхода: они пока не учитываются.',
  },
}

const TEXT: Record<Lang, Record<Key, string>> = { en, ru }
const PLURAL: Record<Lang, Record<PluralKey, Forms>> = { en: enPlural, ru: ruPlural }

export const DICTIONARIES = { en, ru, enPlural, ruPlural }

// ---- Current language ------------------------------------------------------

const STORAGE_KEY = 'dayline-lang'

const detect = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ru' || saved === 'en') return saved
  } catch {
    /* no storage available: fall through */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

let current: Lang = detect()
const listeners = new Set<() => void>()

export const getLang = (): Lang => current

export const setLang = (lang: Lang): void => {
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* private mode: the choice just lasts for this visit */
  }
  listeners.forEach((fn) => fn())
}

export const subscribeLang = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Locale used for dates and numbers. */
export const locale = (): string => (current === 'ru' ? 'ru-RU' : 'en-GB')

type Params = Record<string, string | number>

const fill = (text: string, params?: Params): string =>
  params ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : text

export const t = (key: Key, params?: Params): string => fill(TEXT[current][key], params)

/** A text with a number in it, in the right grammatical form: tp('days', 3) -> "3 days" / "3 дня". */
export const tp = (key: PluralKey, n: number, params?: Params): string => {
  const forms = PLURAL[current][key]
  const category = new Intl.PluralRules(locale()).select(n)
  return fill(forms[category] ?? forms.other, { n, ...params })
}
