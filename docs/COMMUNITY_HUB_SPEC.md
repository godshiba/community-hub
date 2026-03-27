# Community Management Hub - Техническая Спецификация

## 📋 Обзор проекта

**Назначение:** Десктопное приложение для управления комьюнити на multiple платформах (Discord, Telegram, Twitter) с локальным хранением данных.

**Платформы:** Windows, macOS, Linux  
**Tech Stack:** React + Electron + Node.js + SQLite  
**Язык:** TypeScript  
**База данных:** SQLite (локально)  

---

## 🎯 Основные модули

### 1. Analytics Dashboard 📊
**Функционал:**
- Real-time статистика по Discord (члены, активность, топ-контрибьютеры)
- Real-time статистика по Telegram (подписчики, сообщения, активность)
- Real-time статистика по Twitter (фолловеры, твиты, engagement)
- Графики роста по времени (день, неделя, месяц)
- Сравнение метрик между платформами
- Экспорт статистики (CSV, PDF)

**API интеграции:**
- Discord.js (для чтения данных)
- Telegram Bot API
- Twitter API v2

**Frontend компоненты:**
- Dashboard главная страница
- Chart components (Chart.js или Recharts)
- Stats cards
- Date range picker
- Export buttons

**Database:**
```sql
-- Таблица для хранения статистики
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY,
  platform TEXT, -- discord, telegram, twitter
  metric_name TEXT, -- members, active_users, engagement_rate
  metric_value REAL,
  timestamp DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для хранения API ключей
CREATE TABLE api_credentials (
  id INTEGER PRIMARY KEY,
  platform TEXT UNIQUE,
  token TEXT,
  secret TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. Multi-Platform Scheduler 📱
**Функционал:**
- Написание одного поста → отправка на Discord, Telegram, Twitter
- Планировщик (отложенная отправка)
- Поддержка медиа (изображения, видео, документы)
- Очередь постов
- История постов с статусом
- Редактирование запланированных постов
- Отмена отправки

**Frontend компоненты:**
- Rich text editor (для контента)
- Media uploader
- Platform toggle (выбор куда отправлять)
- Date/time picker для scheduling
- Queue/History таблица

**Database:**
```sql
CREATE TABLE scheduled_posts (
  id INTEGER PRIMARY KEY,
  title TEXT,
  content TEXT,
  platforms TEXT, -- JSON: ['discord', 'telegram', 'twitter']
  media_paths TEXT, -- JSON array
  scheduled_time DATETIME,
  sent_time DATETIME,
  status TEXT, -- pending, sent, failed, draft
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_history (
  id INTEGER PRIMARY KEY,
  post_id INTEGER,
  platform TEXT,
  platform_message_id TEXT,
  success BOOLEAN,
  error_text TEXT,
  sent_at DATETIME,
  FOREIGN KEY(post_id) REFERENCES scheduled_posts(id)
);
```

---

### 3. Moderation Tools 🛡️
**Функционал:**
- Список участников со статусами (active, inactive, banned, warned)
- Warning система (give warning, remove warning)
- Ban/Unban пользователей
- Reputation/Score система (автоматическое начисление/вычитание)
- Отслеживание нарушений
- Bulk actions (ban multiple users)
- Экспорт списка пользователей

**Frontend компоненты:**
- Users table с filters
- User profile modal
- Warning/Ban dialog
- Reputation score display
- Bulk action toolbar

**Database:**
```sql
CREATE TABLE community_members (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  platform TEXT, -- discord, telegram, twitter
  platform_user_id TEXT,
  join_date DATETIME,
  status TEXT, -- active, inactive, banned, warned
  reputation_score INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  notes TEXT,
  last_activity DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_warnings (
  id INTEGER PRIMARY KEY,
  member_id INTEGER,
  reason TEXT,
  given_by TEXT,
  given_at DATETIME,
  resolved BOOLEAN,
  resolved_at DATETIME,
  FOREIGN KEY(member_id) REFERENCES community_members(id)
);

CREATE TABLE member_actions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER,
  action_type TEXT, -- warn, ban, unban, mute
  reason TEXT,
  executed_by TEXT,
  executed_at DATETIME,
  FOREIGN KEY(member_id) REFERENCES community_members(id)
);
```

---

### 4. Event Manager 🎉
**Функционал:**
- Создание событий (название, описание, дата/время, место)
- Отправка анонсов на платформы
- RSVP система (Yes/No/Maybe)
- Напоминания (за день, за час)
- Экспорт списка участников
- Event history с attendance tracking

**Frontend компоненты:**
- Event creation form
- Event list/calendar view
- RSVP modal
- Notification settings
- Attendance report

**Database:**
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME,
  event_time TIME,
  location TEXT,
  platform TEXT, -- discord, telegram, twitter
  capacity INTEGER,
  status TEXT, -- draft, published, ongoing, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_rsvps (
  id INTEGER PRIMARY KEY,
  event_id INTEGER,
  user_id TEXT,
  username TEXT,
  platform TEXT,
  response TEXT, -- yes, no, maybe
  responded_at DATETIME,
  FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE TABLE event_reminders (
  id INTEGER PRIMARY KEY,
  event_id INTEGER,
  reminder_time DATETIME,
  sent BOOLEAN,
  sent_at DATETIME,
  FOREIGN KEY(event_id) REFERENCES events(id)
);
```

---

### 5. Community Health Report 📈
**Функционал:**
- Автоматический анализ данных комьюнити
- Metrics: growth rate, engagement rate, member retention, toxicity index
- Recommendations для улучшения
- Генерация PDF отчётов
- Scheduling автоматических отчётов

**Report includes:**
- Summary (период, основные цифры)
- Growth metrics
- Engagement analysis
- Member health
- Top contributors
- Recommendations
- Trend analysis

**Frontend компоненты:**
- Report generator modal
- Report preview
- Export to PDF button
- Schedule report settings
- Report history

---

## 🏗️ Архитектура приложения

### Folder Structure
```
community-hub/
├── public/
├── src/
│   ├── main/
│   │   ├── index.ts (Electron main process)
│   │   ├── ipc/
│   │   │   ├── analytics.ts
│   │   │   ├── scheduler.ts
│   │   │   ├── moderation.ts
│   │   │   ├── events.ts
│   │   │   └── reports.ts
│   │   ├── services/
│   │   │   ├── discord.service.ts
│   │   │   ├── telegram.service.ts
│   │   │   ├── twitter.service.ts
│   │   │   └── database.service.ts
│   │   └── utils/
│   │
│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Scheduler.tsx
│   │   │   ├── Moderation.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── Charts/
│   │   │   ├── Tables/
│   │   │   ├── Forms/
│   │   │   └── Modals/
│   │   ├── hooks/
│   │   ├── store/ (Redux или Context API)
│   │   ├── services/
│   │   │   └── ipc-client.ts
│   │   └── styles/
│   │
│   └── shared/
│       └── types.ts
│
├── database/
│   └── migrations/
├── package.json
└── tsconfig.json
```

---

## 🔌 IPC Communication (Electron)

### Main ↔ Renderer Communication

**Channels:**
```typescript
// Analytics
ipc.invoke('analytics:getStats', { platform, period })
ipc.invoke('analytics:exportStats', { format, data })

// Scheduler
ipc.invoke('scheduler:createPost', { content, platforms, scheduledTime })
ipc.invoke('scheduler:getQueue')
ipc.invoke('scheduler:cancelPost', { postId })
ipc.invoke('scheduler:sendPost', { postId })

// Moderation
ipc.invoke('moderation:getMembers', { filters })
ipc.invoke('moderation:warnUser', { userId, reason })
ipc.invoke('moderation:banUser', { userId, reason })

// Events
ipc.invoke('events:create', { eventData })
ipc.invoke('events:getRSVPs', { eventId })
ipc.invoke('events:exportAttendees', { eventId, format })

// Reports
ipc.invoke('reports:generate', { period, includeMetrics })
ipc.invoke('reports:exportPDF', { reportData })
```

---

## 🔐 API Credentials Management

**Безопасное хранилище:**
- Encrypt credentials перед сохранением в SQLite
- Использовать Electron's `safeStorage` API
- Не хранить в plain text

**Credentials needed:**
```
Discord:
  - Bot Token
  - Guild ID (для каждого сервера)

Telegram:
  - Bot Token
  - Chat/Channel ID

Twitter:
  - API Key
  - API Secret
  - Bearer Token
```

---

## 🎨 UI/UX Design Guidelines

**Color Scheme:**
- Primary: #5865F2 (Discord blue)
- Secondary: #0088cc (Telegram blue)
- Accent: #1DA1F2 (Twitter blue)
- Dark mode by default

**Components Library:**
- shadcn/ui для базовых компонентов
- Tailwind CSS для стилизации
- Recharts для графиков

**Typography:**
- Headings: Inter Bold
- Body: Inter Regular
- Code: JetBrains Mono

---

## 📦 Dependencies

### Core
- electron
- react
- react-dom
- typescript

### API & Services
- discord.js
- telegram-bot-api
- twitter-api-v2
- better-sqlite3 (для SQLite)

### UI
- recharts (для графиков)
- shadcn/ui
- tailwindcss
- lucide-react (icons)

### Utils
- date-fns (для работы с датами)
- lodash
- uuid
- crypto (встроен в Node.js)

### Dev
- electron-builder
- electron-dev-utils
- concurrently

---

## 🚀 Развёртывание & Build

**Build commands:**
```json
{
  "scripts": {
    "start": "concurrently npm:start:main npm:start:renderer",
    "start:main": "cross-env NODE_ENV=development electron .",
    "start:renderer": "react-scripts start",
    "build": "npm run build:renderer && npm run build:electron",
    "build:renderer": "react-scripts build",
    "build:electron": "electron-builder",
    "package": "npm run build && npm run build:electron",
    "make": "electron-builder"
  }
}
```

**Output:** .exe (Windows), .dmg (macOS), .AppImage (Linux)

---

## 📊 Database Schema Summary

**Таблицы:**
1. `platform_stats` - статистика по платформам
2. `api_credentials` - API ключи (encrypted)
3. `scheduled_posts` - очередь постов
4. `post_history` - история отправленных постов
5. `community_members` - список участников
6. `member_warnings` - предупреждения
7. `member_actions` - история действий модератора
8. `events` - события
9. `event_rsvps` - регистрации на события
10. `event_reminders` - напоминания о событиях

---

## ✅ Quality Checklist

### Phase 1: Setup & Architecture
- [ ] Electron проект инициализирован
- [ ] React + TypeScript setup
- [ ] SQLite база инициализирована
- [ ] IPC bridge создан
- [ ] Folder structure готов

### Phase 2: Analytics Module
- [ ] Discord API интеграция
- [ ] Telegram API интеграция
- [ ] Twitter API интеграция
- [ ] Dashboard UI
- [ ] Charts & stats display
- [ ] Data export функционал

### Phase 3: Scheduler Module
- [ ] Post creation UI
- [ ] Platform selection
- [ ] Media upload
- [ ] Scheduling logic
- [ ] Queue management
- [ ] Post history

### Phase 4: Moderation Module
- [ ] Members database
- [ ] Member list UI
- [ ] Warning system
- [ ] Ban/Unban functionality
- [ ] Reputation tracking
- [ ] Bulk actions

### Phase 5: Events Module
- [ ] Event creation form
- [ ] RSVP system
- [ ] Reminders
- [ ] Export functionality
- [ ] Calendar view

### Phase 6: Reports Module
- [ ] Data aggregation logic
- [ ] Report generation
- [ ] PDF export
- [ ] Schedule reports
- [ ] Report history

### Phase 7: Polish & Testing
- [ ] UI/UX refinement
- [ ] Dark/light theme
- [ ] Performance optimization
- [ ] Error handling
- [ ] Testing (unit, integration)
- [ ] Documentation

---

## 📝 Notes

- **Локальное хранилище:** Все данные в SQLite на машине пользователя
- **Безопасность:** Encrypt sensitive data, use Electron's safeStorage
- **Performance:** Debounce API calls, implement caching
- **Error handling:** Graceful degradation, user-friendly error messages
- **Scalability:** Думать о том, что юзер может иметь много серверов/чатов
