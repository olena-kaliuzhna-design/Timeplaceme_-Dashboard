# Метрики та контракт даних

Усі періоди рахуються в днях UTC. Порівняння завжди йде з попереднім періодом такої ж довжини.

## Адмінка

| Метрика | Формула | Джерело |
|---|---|---|
| First experiences delivered | кількість `attendance_confirmed` за період | queue funnel events |
| Gifted spots taken (fill rate) | taken ÷ (taken + available) по подарованих місцях на подіях у періоді | tickets |
| Demand we couldn’t serve | `no_match_found` ÷ `get_clicked` | queue funnel |
| Active guests | користувачі з будь-якою сесією за 30 днів ÷ усі користувачі | users.last_active |
| People waiting (по місту) | queue entries зі статусом `waiting`, згруповані за location; без локації — «Unknown» | queue |
| Open gifted spots (по місту) | вільні місця на майбутніх подіях, згруповані за містом адреси | tickets + addresses |
| Partner status | **At risk:** offered > 0, taken = 0, подій у майбутньому немає · **Healthy:** taken > 0 · **Upcoming:** є майбутня подія, taken = 0 · **Not started:** offered = 0 | events, tickets |

### Що потрапляє в «Needs your attention»

| Правило | Важливість |
|---|---|
| `queue_matching_enabled = false` | crit |
| у черзі є людина зі статусом waiting понад 14 днів, а в її місті немає пропозиції | crit |
| у партнера At risk | warn |
| квиток Taken, подія вже минула, а intent досі `Awaiting` | warn |
| повідомлення в Contacts непрочитане понад 3 дні | warn |
| ≥ 3 голоси в City votes з одного IP за 10 хвилин | info |
| будь-який крок воронки більший за попередній (перевірка якості даних) | info |

## Партнер

| Метрика | Формула |
|---|---|
| First-time guests who came | квитки партнера зі статусом Arrived за період |
| Spots you gifted / fill rate | створені подаровані місця; taken ÷ gifted |
| Showed up | arrived ÷ taken (no-show рахується окремо) |
| Came back *(нова)* | гості, що відповіли «так» на питання у Woof «Повернетеся?» або яких партнер позначив як «повернувся» |
| Woof rating | середня оцінка Woof по подіях партнера |
| People who saw you | показів подій партнера на день (impressions) |

## Контракт JSON

Форма об'єкта — точнісінько як у `data/admin-data.js` і `data/partner-data.js`. Ендпоінти:

- `GET /backend/dashboard.json?period=30d` → `ADMIN_DATA`
- `GET /customers/dashboard.json?period=30d` → `PARTNER_DATA.active` (або `newPartner`, якщо опублікованих подій немає)
