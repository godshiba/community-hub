# 🚀 QUICK START GUIDE: Community Management Hub

**Этот гайд поможет тебе начать разработку за 30 минут.**

---

## ⚡ ШАГ 1: Подготовка (5 минут)

### 1.1 Создай новую папку проекта
```bash
mkdir community-hub
cd community-hub
git init
```

### 1.2 Создай README
```bash
# Community Management Hub

A desktop app for managing communities across Discord, Telegram, and Twitter.

## Tech Stack
- Electron + React + TypeScript
- SQLite (local storage)
- Discord.js, Telegram Bot API, Twitter API v2

## Status
🚧 In Development

## Features
- [ ] Analytics Dashboard
- [ ] Multi-Platform Scheduler
- [ ] Moderation Tools
- [ ] Event Manager
- [ ] Community Health Reports
```

### 1.3 Создай папку структуру
```bash
mkdir -p src/{main,renderer,shared}
mkdir -p database
mkdir -p docs
mkdir -p assets
```

---

## 🎯 ШАГ 2: Первый Промпт для Claude (10 минут)

### ПРОМПТ #1: Инициализация проекта

**Скопируй и отправь это Claude:**

```
Я начинаю разрабатывать "Community Management Hub" - десктопное приложение на Electron + React + TypeScript для управления комьюнити на Discord, Telegram и Twitter.

Это первый шаг. Мне нужно:

1. Инициализировать Electron + React проект с нуля (или используя boilerplate)
2. Настроить TypeScript (strict mode)
3. Создать базовую folder structure:
   - src/main/ (Electron main process)
   - src/renderer/ (React UI)
   - src/shared/ (types, interfaces)

4. package.json с scripts:
   - npm start (dev mode с hot reload)
   - npm build (production build)

5. Базовое приложение которое:
   - Открывает Electron window
   - Показывает React компонент "Hello World"
   - Имеет горячий перезагрузку при изменении кода

После этого я смогу запустить npm start и разрабатывать дальше.

Создай код для всего этого, я готов запустить.
```

**После ответа Claude:**
```bash
# Скопируй файлы которые Claude создал
# Они будут в его ответе в виде блоков кода

npm install
npm start
```

---

## 🔧 ШАГ 3: Сделай первый Commit (5 минут)

```bash
git add .
git commit -m "feat: initialize electron + react + typescript project"
git tag v0.0.1
```

---

## 📚 ШАГ 4: Понимание Workflow

### Как это работает:

1. **Ты пишешь промпт** с описанием что нужно сделать
2. **Claude создаёт код** (файлы, компоненты, сервисы)
3. **Ты копируешь код** в свой проект
4. **Ты тестируешь** локально
5. **Ты делаешь commit** если всё работает

### Пример типичного цикла:

```
ТЫ: "Создай Settings страницу с формой для Discord токена"
     ↓
CLAUDE: [Создаёт Settings.tsx, components, etc]
     ↓
ТЫ: [Копируешь код]
     ↓
ТЫ: npm start → проверяешь в браузере
     ↓
ТЫ: git commit -m "feat: add settings page"
```

---

## 💡 ШАГ 5: Шаблон Промпта для каждого модуля

### Скопируй этот шаблон и адаптируй для своих нужд:

```
Я разрабатываю Community Management Hub (Electron + React + TypeScript, SQLite).

Сейчас я работаю над [НАЗВАНИЕ МОДУЛЯ].

Нужно создать:

1. [КОМПОНЕНТ 1]:
   - [ФИЧА 1]
   - [ФИЧА 2]

2. [КОМПОНЕНТ 2]:
   - [ФИЧА 1]

3. [СЕРВИС]:
   - [МЕТОД 1]
   - [МЕТОД 2]

Database таблицы:
- [ТАБЛИЦА 1]
- [ТАБЛИЦА 2]

IPC handlers:
- [HANDLER 1]
- [HANDLER 2]

Используй:
- React для UI
- Tailwind CSS для стилей
- shadcn/ui для компонентов
- TypeScript везде

Создай полный, рабочий код который я смогу скопировать.
```

---

## 📋 ПРИМЕРЫ РЕАЛЬНЫХ ПРОМПТОВ

### ПРИМЕР 1: Settings страница

```
Я разрабатываю Community Management Hub.

Нужна Settings страница с формой для сохранения API credentials:

1. src/renderer/pages/Settings.tsx:
   - Форма с полями:
     * Discord Bot Token (masked input)
     * Telegram Bot Token (masked input)
     * Twitter Bearer Token (masked input)
   - Buttons:
     * Test Connection (для каждого поля)
     * Save Credentials
   - Validation перед сохранением
   - Success message при сохранении
   - Error message если что-то пошло не так

2. IPC handler в main/ipc:
   - validateToken(platform, token)
   - saveCredentials(credentials)
   - loadCredentials()

3. Используй:
   - shadcn/ui Input, Button, Alert компоненты
   - Tailwind CSS для стилей
   - TypeScript для типов

Создай полный код для Settings страницы и IPC handlers.
```

### ПРИМЕР 2: Dashboard компонент

```
Я разрабатываю Community Management Hub (Electron + React).

Нужен Dashboard с основной статистикой:

1. src/renderer/pages/Dashboard.tsx:
   - Header с текущей датой
   - 4 stats cards:
     * Total Members (число)
     * Growth Rate (% со стрелкой ↑/↓)
     * Active Users (число)
     * Engagement Rate (%)

2. Компоненты:
   - StatsCard.tsx - переиспользуемая карточка
   - PeriodPicker.tsx - выбор периода (day/week/month)

3. Функционал:
   - Получать данные через IPC (ipc.invoke('analytics:getStats'))
   - Loading state (skeleton loader)
   - Error state
   - Auto-refresh каждые 30 секунд

4. Стилизация:
   - Dark mode по умолчанию
   - Discord blue colors (#5865F2)
   - Responsive grid (1 col mobile, 2 cols tablet, 4 cols desktop)

Используй Tailwind CSS и shadcn/ui.
```

---

## 🎓 ПОЛНЫЙ ПРИМЕР: От промпта к коду

### Сценарий: Создаём Settings страницу

**ШАГ 1: Напиши промпт**

```
[Промпт из ПРИМЕРА 1 выше]
```

**ШАГ 2: Claude создаёт файлы**

Claude вернёт что-то вроде:

```typescript
// src/renderer/pages/Settings.tsx
import React from 'react'

export default function Settings() {
  // код здесь
}
```

**ШАГ 3: Ты копируешь файлы**

Создай файлы в своём проекте:
```bash
touch src/renderer/pages/Settings.tsx
touch src/renderer/components/CredentialInput.tsx
touch src/renderer/components/StatsCard.tsx
# И т.д.
```

**ШАГ 4: Копируешь код из Claude**

Отправь в свои файлы весь код который Claude создал.

**ШАГ 5: Тестируешь**

```bash
npm start
# Перейди на Settings страницу
# Проверь что форма отображается
# Проверь что работает валидация
```

**ШАГ 6: Делаешь commit**

```bash
git add src/renderer/pages/Settings.tsx src/renderer/components/
git commit -m "feat: add settings page with credential form"
```

---

## 🚀 FOLLOWING THE PLAN

После первого промпта, следуй DEVELOPMENT_PLAN.md:

**Фаза 1 (Неделя 1-2):**
1. ✅ Electron + React инициализация
2. SQLite setup
3. UI Framework (Tailwind + shadcn)
4. Navigation
5. IPC bridge
6. Settings страница

**Фаза 2 (Неделя 3-4):**
1. Discord интеграция
2. Telegram интеграция
3. Twitter интеграция
4. API Status dashboard
5. Error handling

И т.д...

---

## ❓ TIPS ДЛЯ РАБОТЫ С CLAUDE

### 1. Если результат не совпадает с ожиданиями:

```
Это не совсем то. Нужно:
- [Что не так 1]
- [Что не так 2]
- [Как должно быть]

Попробуй ещё раз.
```

### 2. Если нужно добавить фичу:

```
Отлично! Теперь добавь:
- [Фича 1]
- [Фича 2]

Начни с [самая важная фича].
```

### 3. Если нужно отладить ошибку:

```
При нажатии кнопки появляется ошибка:
[Текст ошибки]

Код выглядит так:
[Покажи часть кода]

Что может быть не так?
```

### 4. Если хочешь объяснение:

```
Объясни что происходит в этом коде:
[Код]

Как это работает?
```

---

## 📁 ФАЙЛЫ КОТОРЫЕ Я СОЗДАЛ ДЛЯ ТЕБЯ

1. **COMMUNITY_HUB_SPEC.md** - Полная техническая спецификация
2. **PROMPT_TEMPLATES.md** - Шаблоны промптов для каждого модуля
3. **DEVELOPMENT_PLAN.md** - Пошаговый план разработки (8-12 недель)
4. **THIS FILE** - Quick Start Guide (ты читаешь это)

**Используй их как справочник!**

---

## 🎯 NEXT STEPS

### Прямо сейчас:

1. Скопируй все 4 файла (.md) в свой проект
2. Создай папку docs/ и положи туда
3. Используй PROMPT_TEMPLATES.md для написания промптов
4. Следуй DEVELOPMENT_PLAN.md для структуры разработки

### Завтра:

1. Отправь первый промпт Claude (Инициализация проекта)
2. Получи код
3. Установи dependencies (npm install)
4. Запусти (npm start)
5. Сделай первый commit

### На неделю:

Следуй Phase 1 из DEVELOPMENT_PLAN.md и делай по одному модулю в день.

---

## ⚡ БЫСТРЫЙ СТАРТ: КОПИРУЙ-ВСТАВЬ ПРОМПТ

Если ты хочешь начать прямо сейчас, скопируй этот промпт и отправь Claude:

```
Мне нужно создать Community Management Hub - десктопное приложение на Electron для управления комьюнити.

Это первый шаг. Создай полный setup проекта:

1. Инициализировать Electron + React + TypeScript
2. Folder structure (src/main, src/renderer, src/shared)
3. package.json с npm start, npm build
4. Базовое приложение (Electron window + React UI)
5. Hot reload для разработки

После этого я буду разрабатывать модули по одному.

Создай все файлы которые нужны (package.json, tsconfig.json, src/main/index.ts, src/renderer/App.tsx, etc).
```

---

## 📞 ПОМОЩЬ

Если что-то не работает:

1. Прочитай ошибку
2. Скопируй её в промпт для Claude
3. Отправь код который вызывает ошибку
4. Скажи Claude помочь с отладкой

Claude умеет отлаживать и найдёт проблему.

---

## 🎉 ВСЕ ГОТОВО!

Теперь у тебя есть:

✅ Техническая спецификация (SPEC.md)  
✅ Шаблоны промптов (PROMPT_TEMPLATES.md)  
✅ План разработки (DEVELOPMENT_PLAN.md)  
✅ Quick Start Guide (этот файл)  

**Начни с ПЕРВОГО ПРОМПТА и разрабатывай модуль за модулем!**

Удачи! 🚀

---

## 📚 ССЫЛКИ

- [COMMUNITY_HUB_SPEC.md](./docs/COMMUNITY_HUB_SPEC.md) - Техническая спецификация
- [PROMPT_TEMPLATES.md](./docs/PROMPT_TEMPLATES.md) - Шаблоны промптов
- [DEVELOPMENT_PLAN.md](./docs/DEVELOPMENT_PLAN.md) - План разработки
- [Electron docs](https://www.electronjs.org/docs)
- [React docs](https://react.dev)
- [Tailwind docs](https://tailwindcss.com/docs)

---

*Автор гайда: Claude AI*  
*Для: Community Management Hub*  
*Дата: 2026*
