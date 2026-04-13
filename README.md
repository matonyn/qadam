# Qadam 🚶‍♂️🦕

## React Native / Expo

## Requirements 🚀

- Node.js 18+ (чем новее, тем быстрее билдишь )
- Expo CLI (`npm install -g expo-cli`) — магия тут
- iOS Симулятор (Mac) или Android Эмулятор, или просто телефон с **Expo Go** (настало время сканировать qr-коды ДЭЭЭМН)

---

## Запуск / install and RUN 🦾

```bash
npm install      # сначала корми зависимости
npx expo start   # теперь можно в путь!
```

Потом в терминале —  
жми `i` (iOS), `a` (Android),  
или сканируй огненный QR КОД (туда его прилепим)

---

## Project Structure 🗂️

```
src/
├── components/ui/       # Кнопки, инпуты, радость
├── constants/theme.ts   # Цвета дня и ночи, отступы, шрифты
├── data/mockData.ts     # Вся мифическая "бэкенд" дата тут пока что
├── i18n/                # EN / KZ / RU — видна что хотим мир
├── navigation/          # Вкладки + стеки навигации
├── screens/
│   ├── auth/            # Welcome, Login, Register, Забыл пароль?
│   └── main/            # Дом, Карта, События, Академия, Профиль и т.д.
├── services/api.ts      # Все API функции (типо работают, но не факт 👀)
├── stores/authStore.ts  # Zustand для аутентификации и юзер настроек
└── types/index.ts       # TypeScript типчики и триксы
```

---

## What's Done )

- Полная навигация (вкладки, стеки, заморочки)
- Аутентификация: войти, зарегаться, забыть пароль (или себя 👽)
- Переключение тем: тёмная / светлая / системная
- Переключение языков: EN / KZ / RU
- `expo-secure-store`
- Карта кампуса с маркерами корпусов, поиск, галочка “Доступно?”
- Детали зданий: комнаты, отзывы, навигатор в ЯндексКарты (ну почти)
- Список событий, детали, RSVP ("буду — не буду")
- Студ.скидки + фильтр по категориям, можно скопировать промик
- Аудитории: доступность, шумомер и бронирование
- Отзывы писать можно! (не только ментально…)
- Академия: GPA-карточка, курсы, калькулятор GPA
- Планер: красиво по неделям
- Профиль + редакция
- Уведомления (настоящие фейковые!)
- Настройки (язык, тема, уведомления, доступность)

## Backend API

HTTP клиент: `src/services/api.ts`. Контракт ответов: **`qadam-api-spec.json`**.

### Если видишь `Network error` / `Network request failed`

1. **Бэкенд слушает все интерфейсы:**  
   `uvicorn app.main:app --host 0.0.0.0 --port 8000` (из папки `qadam-backend`).
2. **Expo Go на телефоне:** в корне проекта создай `.env` (см. `.env.example`):
   `EXPO_PUBLIC_API_URL=http://ТВОЙ_LAN_IP:8000`  
   Узнать IP (Mac, Wi‑Fi): `ipconfig getifaddr en0`. Телефон и компьютер в одной сети.
3. **Перезапусти Metro с очисткой кэша:** `npx expo start -c` (иначе `.env` не подхватится).
4. **Без `.env`:** по умолчанию iOS Simulator / web → `localhost:8000`, Android Emulator → `10.0.2.2:8000`. На физическом устройстве `localhost` не сработает.
5. **Сборка iOS (не Expo Go):** в `app.json` уже включено `NSAllowsLocalNetworking` для HTTP к локальной сети.

### Step-by-step (экраны и моки)

**1. Токены уже в `api.ts`** (`tokenManager` + `Authorization`).

**2. Меняй stubs на нормальные вызовы**

Сейчас функции выглядят вот так (претендуют на излишнюю простоту):

```ts
getBuildings: async () => {
  // TODO: Replace with actual API call
  // return apiRequest('/maps/buildings');
  return [];
},
```

Меняешь на реальный запрос (старое удаляешь):

```ts
getBuildings: async () => {
  return apiRequest('/maps/buildings');
},
```

**3. Подключай экраны к API**

Сейчас экраны берут данные напрямую из `mockData`.  
Переходи на реальный API внутри `useEffect`! Вот примерчик для MapScreen:

```ts
// Было
import { mockBuildings } from "../../data/mockData";

// Стало
const [buildings, setBuildings] = useState([]);
useEffect(() => {
  api.maps.getBuildings().then(setBuildings);
}, []);
```

**4. Login — забирай токен и юзера**

В `authStore` есть action `login(user)`. После API вызова:

```ts
const { data } = await api.auth.login(email, password);
useAuthStore.getState().login(data.user);
// не забудь куда-то надёжно прятать data.accessToken + data.refreshToken
```

**5. Первыми подключаем эти эндпоинты:**

| Приоритет | Endpoint                                               | Зачем нужно?                    |
| --------- | ------------------------------------------------------ | ------------------------------- |
| 1         | `POST /auth/login`                                     | Без этого app — картонка!       |
| 2         | `POST /auth/register`                                  | Ну вдруг захочешь новых друзей  |
| 3         | `GET /maps/buildings`                                  | Карта и Home падут без данных   |
| 4         | `GET /events`                                          | Иначе никуда не сходишь...      |
| 5         | `GET /academic/courses` + `GET /academic/plan`         | Академия ждёт оценки            |
| 6         | `GET /study-rooms` + `POST /study-rooms/:id/book`      | Где учить линал?                |
| 7         | `GET /discounts`                                       | Бюджет важен!                   |
| 8         | `GET /reviews` + `POST /reviews`                       | Фидбек двигатель прогресса      |
| 9         | `POST /routing/calculate`                              | Навигация, иначе заблудишься... |
| 10        | `GET /notifications` + `PATCH /notifications/read-all` | Не пропусти ничего!             |

---

## Стек ⛓️💃

| За что     | Чем пользуемся                     |
| ---------- | ---------------------------------- |
| Framework  | React Native + Expo SDK 54         |
| Language   | TypeScript                         |
| Navigation | React Navigation 6                 |
| State      | Zustand 4.5 + persist middleware   |
| Storage    | expo-secure-store                  |
| Maps       | react-native-maps + google + apple |
| Icons      | @expo/vector-icons (Ionicons 👀)   |
| i18n       | Собственный хук ☝🏻🤓               |
