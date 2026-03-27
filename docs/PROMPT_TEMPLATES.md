# 🎯 Шаблоны Промптов для Community Management Hub

Используй эти промпты как основу, подставляя свои значения. Claude будет понимать контекст вашего проекта.

---

## 1️⃣ ИНИЦИАЛИЗАЦИЯ ПРОЕКТА

### Промпт: Создание Electron + React + TypeScript проекта

```
Я разрабатываю десктопное приложение "Community Management Hub" на Electron + React + TypeScript.

Мне нужно:
1. Инициализировать новый Electron проект с React
2. Настроить TypeScript конфигурацию
3. Создать базовую folder structure
4. Добавить необходимые dependencies (react, typescript, sqlite3, discord.js, telegram-bot-api, twitter-api-v2, recharts, tailwindcss, shadcn/ui)
5. Создать main Electron process файл
6. Создать App.tsx для React UI

Требования:
- Использовать React для UI
- TypeScript везде
- SQLite для локальной базы данных
- Поддержка hot reload для разработки
- Dark mode по умолчанию

Создай полный setup с package.json, tsconfig, и основными файлами.
```

---

## 2️⃣ DATABASE & MIGRATIONS

### Промпт: Создание SQLite схемы и миграций

```
У меня есть следующие таблицы для Community Management Hub:

1. platform_stats - статистика по платформам
2. api_credentials - API ключи (должны быть encrypted)
3. scheduled_posts - очередь постов
4. post_history - история отправленных постов
5. community_members - список участников
6. member_warnings - предупреждения
7. member_actions - история действий
8. events - события
9. event_rsvps - регистрации
10. event_reminders - напоминания

Мне нужно:
1. Написать SQL CREATE TABLE statements для всех таблиц
2. Создать файл миграции
3. Создать database.service.ts который:
   - Инициализирует SQLite
   - Запускает миграции
   - Предоставляет методы для CRUD операций
   - Использует Electron's safeStorage для encryption credentials

Используй better-sqlite3 для синхронных операций.
```

---

## 3️⃣ API INTEGRATION

### Промпт: Интеграция Discord API

```
Я разрабатываю Community Management Hub и нужна интеграция с Discord.

Создай discord.service.ts который:

1. Подключается к Discord используя Bot Token
2. Предоставляет методы:
   - getGuildStats(guildId) - получить статистику сервера (members, active users, channels)
   - getMembers(guildId) - получить список членов
   - getMemberInfo(guildId, userId) - инфо о конкретном участнике
   - sendMessage(channelId, message, media?) - отправить сообщение
   - editMessage(channelId, messageId, newContent) - редактировать
   - deleteMessage(channelId, messageId) - удалить
   - getUsersActivity(guildId, period) - активность пользователей
   - getTopContributors(guildId) - топ участников

3. Обработка ошибок и retry logic
4. Кеширование данных (30 сек)
5. TypeScript types для всех responses

Используй discord.js library.
```

### Промпт: Интеграция Telegram API

```
Создай telegram.service.ts для Community Management Hub:

1. Подключение через Bot Token
2. Методы:
   - getChat(chatId) - инфо о чате
   - getChatMembers(chatId) - список членов
   - sendMessage(chatId, text, media?) - отправить
   - editMessage(chatId, messageId, newText) - редактировать
   - deleteMessage(chatId, messageId) - удалить
   - getUpdates(period) - сообщения за период
   - getMemberStats(chatId) - статистика участников
   - pinMessage(chatId, messageId) - закрепить

3. Polling или webhook setup для получения обновлений
4. Error handling и reconnection logic
5. TypeScript types

Используй telegram-bot-api или node-telegram-bot-api.
```

### Промпт: Интеграция Twitter API

```
Создай twitter.service.ts для интеграции с Twitter (X):

1. Использовать Twitter API v2
2. Методы:
   - getProfile() - мой профиль
   - getTweets(period) - твиты за период
   - getFollowers() - фолловеры
   - getEngagement() - engagement метрики
   - postTweet(text, media?, replyTo?) - отправить твит
   - deleteTweet(tweetId) - удалить
   - getMetrics(tweetId) - метрики твита
   - getHashtagStats(hashtag) - статистика по хештегу

3. Authentication через Bearer Token
4. Rate limiting handling
5. Error handling
6. TypeScript types

Используй twitter-api-v2 package.
```

---

## 4️⃣ IPC COMMUNICATION

### Промпт: Создание IPC моста

```
У меня есть Electron app с main process и renderer (React).

Создай services/ipc-client.ts в renderer части, которая:
1. Предоставляет методы для вызова main process
2. Использует ipc.invoke() для асинхронных операций
3. Имеет методы для всех операций:
   - Analytics (getStats, exportStats)
   - Scheduler (createPost, getQueue, cancelPost, sendPost)
   - Moderation (getMembers, warnUser, banUser)
   - Events (create, getRSVPs, export)
   - Reports (generate, exportPDF)

4. Type-safe responses
5. Error handling
6. Loading states

Также создай main/ipc/index.ts который регистрирует все IPC handlers в main process.
```

---

## 5️⃣ ANALYTICS MODULE

### Промпт: Создание Analytics Dashboard

```
Создай Analytics модуль для Community Management Hub:

1. В src/renderer/pages/Dashboard.tsx:
   - Header с период picker (day, week, month)
   - Grid с stats cards (total members, growth rate, engagement, activity)
   - Графики:
     * Member growth chart (line chart)
     * Activity heatmap
     * Platform comparison (bar chart)
     * Top contributors (table)
   - Export кнопка (CSV, PDF)

2. Hooks для fetching data:
   - useAnalytics() - получить все stats
   - useChartData() - данные для графиков
   - useExport() - экспорт функционал

3. Components:
   - StatsCard.tsx
   - GrowthChart.tsx
   - ActivityHeatmap.tsx
   - PlatformComparison.tsx
   - TopContributors.tsx
   - ExportButton.tsx

4. Использовать Recharts для графиков
5. Tailwind CSS + shadcn/ui
6. Responsive design
7. Dark mode support
```

---

## 6️⃣ SCHEDULER MODULE

### Промпт: Создание Multi-Platform Scheduler

```
Создай Scheduler модуль:

1. В src/renderer/pages/Scheduler.tsx:
   - Форма для создания поста:
     * Rich text editor для контента
     * Media uploader (изображения, видео)
     * Platform toggle (Discord, Telegram, Twitter)
     * Date/time picker для scheduling
     * Schedule button
   
   - Очередь постов (Queue tab):
     * Таблица с pending постами
     * Status (pending, scheduled, sent, failed)
     * Actions (edit, delete, send now)
   
   - История постов (History tab):
     * Отправленные посты
     * Результаты отправки по платформам
     * Timestamp, content preview

2. Components:
   - PostEditor.tsx (rich text editor)
   - MediaUploader.tsx
   - PlatformSelector.tsx
   - ScheduleForm.tsx
   - PostQueue.tsx
   - PostHistory.tsx

3. Функционал:
   - Сохранение drafts
   - Preview поста
   - Scheduling logic (send в нужное время)
   - Retry logic при ошибках
   - Bulk scheduling

4. Database интеграция для сохранения постов
5. Time zone support
6. Notifications при успешной отправке
```

---

## 7️⃣ MODERATION MODULE

### Промпт: Создание Moderation Tools

```
Создай Moderation модуль:

1. В src/renderer/pages/Moderation.tsx:
   - Фильтры:
     * Platform (Discord, Telegram, Twitter)
     * Status (active, inactive, banned, warned)
     * Join date range
     * Reputation score range
   
   - Members table с колонками:
     * Username
     * Platform
     * Join date
     * Status (badge)
     * Warnings count
     * Reputation score
     * Last activity
     * Actions (edit, warn, ban)
   
   - Member profile modal:
     * User info
     * Warning history
     * Action history
     * Reputation tracking
     * Add warning button
     * Ban/Unban button

2. Components:
   - MembersTable.tsx
   - MemberFilters.tsx
   - MemberProfile.tsx
   - WarningDialog.tsx
   - BanDialog.tsx
   - ReputationScore.tsx

3. Функционал:
   - Bulk warn/ban actions
   - Auto-sync members из Discord/Telegram
   - Warning escalation (3 warnings = ban)
   - Reputation calculation
   - Export members list (CSV)
   - Search по username

4. Real-time updates при добавлении новых членов
5. History логирование всех действий
```

---

## 8️⃣ EVENTS MODULE

### Промпт: Создание Event Manager

```
Создай Events модуль:

1. В src/renderer/pages/Events.tsx:
   - Event creation form:
     * Title, description
     * Date/time
     * Location (опционально)
     * Platform (где анонсировать)
     * Capacity (опционально)
     * Reminder settings (за день, за час)
   
   - Event list/calendar view:
     * Calendar компонент (upcoming events)
     * List view (с фильтрами)
     * Event cards с базовой инфой
   
   - Event detail modal:
     * Full info
     * RSVP stats (yes/no/maybe)
     * Attendees list
     * Export attendees (CSV)
     * Send reminder button

2. Components:
   - EventForm.tsx
   - EventCalendar.tsx
   - EventList.tsx
   - EventDetail.tsx
   - RSVPDialog.tsx
   - AttendeesList.tsx
   - ReminderSettings.tsx

3. Функционал:
   - RSVP система
   - Автоматические напоминания
   - Отправка анонса на все платформы
   - Tracking attendance
   - Event cancellation
   - Export attendees
   - Event analytics (show rate, attendance rate)

4. Notifications для напоминаний
5. Интеграция с Discord events (если есть)
```

---

## 9️⃣ REPORTS MODULE

### Промпт: Создание Community Health Report

```
Создай Reports модуль:

1. В src/renderer/pages/Reports.tsx:
   - Report generator:
     * Period picker (week, month, quarter)
     * Metrics selector (growth, engagement, retention, etc)
     * Generate button
   
   - Report viewer:
     * Summary section (period, key metrics)
     * Growth analysis (graphs)
     * Engagement analysis
     * Member health (retention rate, churn)
     * Top contributors
     * Recommendations section
     * Export to PDF button

2. Компоненты отчёта:
   - ReportGenerator.tsx
   - ReportSummary.tsx
   - GrowthAnalysis.tsx
   - EngagementAnalysis.tsx
   - MemberHealthReport.tsx
   - Recommendations.tsx

3. Расчёты:
   - Growth rate: (current - previous) / previous * 100
   - Engagement rate: active_users / total_users
   - Retention rate: (users_at_end - new_users) / users_at_start
   - Recommendations based on trends

4. PDF export:
   - Красивое форматирование
   - Графики в PDF
   - Branding (лого, цвета)

5. Report scheduling (автоматически генерировать еженедельно/ежемесячно)
6. Report history (сохранение старых отчётов)
```

---

## 🔟 SETTINGS & CONFIG

### Промпт: Создание Settings страницы

```
Создай Settings модуль:

1. В src/renderer/pages/Settings.tsx:
   - API Credentials:
     * Discord token input (masked)
     * Telegram token input (masked)
     * Twitter API keys input (masked)
     * Test connection buttons
     * Save/Update buttons
   
   - App Settings:
     * Theme (dark/light)
     * Notifications toggle
     * Auto-sync frequency
     * Data retention policy
     * Language (EN/RU)
   
   - Database:
     * Export database (backup)
     * Clear history (с подтверждением)
     * Data usage
   
   - About:
     * App version
     * License
     * GitHub link
     * Check for updates

2. Components:
   - CredentialInput.tsx
   - AppSettings.tsx
   - DatabaseTools.tsx
   - About.tsx

3. Функционал:
   - Encryption credentials перед сохранением
   - Validation при сохранении
   - Connection testing
   - Settings persistence в SQLite
   - Clear indication что сохранилось
```

---

## 1️⃣1️⃣ UI COMPONENTS

### Промпт: Создание переиспользуемых компонентов

```
Создай набор базовых UI компонентов для Community Management Hub:

1. Используй shadcn/ui и Tailwind CSS

2. Компоненты:
   - Sidebar.tsx (боковая навигация)
   - TopNav.tsx (верхняя навигация с theme toggle)
   - StatsCard.tsx (для статистики)
   - DataTable.tsx (переиспользуемая таблица)
   - Modal.tsx (модальные окна)
   - Tabs.tsx (табы)
   - Select.tsx (выпадающие списки)
   - DatePicker.tsx (выбор даты)
   - TimePicker.tsx (выбор времени)
   - PlatformBadge.tsx (badge для Discord/Telegram/Twitter)
   - StatusBadge.tsx (для статусов)
   - LoadingSpinner.tsx
   - ErrorBoundary.tsx

3. Стилизация:
   - Dark mode по умолчанию
   - Color scheme: Discord/Telegram/Twitter colors
   - Consistent spacing и sizing
   - Smooth animations и transitions
   - Responsive дизайн

4. Все компоненты с TypeScript типами
5. Reusable и composable
```

---

## 1️⃣2️⃣ TESTING & DEBUGGING

### Промпт: Добавление Error Handling и Logging

```
Добавь comprehensive error handling и logging в Community Management Hub:

1. Logger утилита (src/shared/logger.ts):
   - Log levels: debug, info, warn, error
   - Логирование в файл (logs/)
   - Console output в разработке
   - Timestamps и level indicators

2. Error handling:
   - Global error boundary в React
   - Try-catch блоки во всех API calls
   - User-friendly error messages
   - Error recovery suggestions
   - Graceful degradation

3. API error handling:
   - Retry logic для failed requests
   - Exponential backoff
   - Timeout handling
   - Rate limit handling

4. Database error handling:
   - Connection errors
   - Migration errors
   - Query errors

5. Monitoring:
   - Track API call performance
   - Database query times
   - Memory usage monitoring
   - Crash reporting
```

---

## СОВЕТЫ ПО ИСПОЛЬЗОВАНИЮ ЭТИХ ПРОМПТОВ

### 1. Контекст
Перед каждым промптом ты можешь добавить:
```
Контекст:
- Я разрабатываю Community Management Hub (Electron + React + TypeScript)
- Используемые библиотеки: [list]
- Database: SQLite
- Цель: Управлять комьюнити на Discord, Telegram, Twitter
```

### 2. Детализация
Если результат не совпадает с ожиданиями:
```
Неправильно. Нужно:
- [Уточнение 1]
- [Уточнение 2]
- [Уточнение 3]

Примеры как должно выглядеть: [показать примеры]
```

### 3. Итеративная разработка
```
Готово! Теперь:
1. Добавь [фича 1]
2. Улучши [что-то]
3. Интегрируй [API]

Начни с [самое важное]
```

### 4. Отладка
```
Эта часть не работает: [код]

Ошибка: [текст ошибки]

Что может быть не так?
```

---

## ПРИМЕРЫ РЕАЛЬНЫХ ПРОМПТОВ

### Пример 1: Быстрое улучшение компонента
```
Dashboard.tsx выглядит скучно. Мне нужно:
- Добавить больше визуала
- Анимации при загрузке данных
- Лучшие цвета (используй Discord/Telegram/Twitter colors)
- Hover эффекты на cards
- Легче читать текст

Улучши компонент, сохраняя структуру.
```

### Пример 2: Добавление фичи
```
В Scheduler'е нужна функция редактирования запланированных постов.

Нужно:
1. Edit button в каждом посте в queue
2. Modal с редактированием content, platforms, time
3. Сохранение в database
4. Validation что пост еще не отправлен
5. Notification при успешном сохранении

Начни с компонента.
```

### Пример 3: Отладка ошибки
```
При нажатии "Send Post" ничего не происходит.

IPC invoke вызывается? Да.
Main process handler есть? Не уверен.

Помоги отладить:
1. Добавь логирование на обоих сторонах
2. Проверь что IPC handler зарегистрирован
3. Проверь error handling
4. Покажи что может быть не так
```

---

## ✨ ЛУЧШИЕ ПРАКТИКИ

1. **Помни контекст:** Указывай что ты разрабатываешь Community Management Hub
2. **Будь специфичным:** Вместо "сделай красивее" → "сделай на базе Design System с этими цветами"
3. **Показывай результаты:** Если что-то не совпадает с ожиданиями, покажи результат и скажи что не так
4. **Итеративная разработка:** Лучше делать маленькие шаги, чем один большой промпт
5. **Документируй:** После каждого промпта спроси Claude объяснить что он сделал
6. **Тестируй:** Проверяй что работает локально перед тем как идти дальше
7. **Версионируй:** Делай commits после каждого модуля
