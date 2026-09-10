# STable — Architecture Document

## 1. Maqsad

STable — talabalar va oddiy foydalanuvchilar uchun shaxsiy moliyaviy nazorat
platformasi (Personal Financial Analytics Platform). MVP arxitekturasi:

```
Next.js (App Router, TS strict)
   + Supabase (Postgres, Auth, RLS, Edge Functions, pg_cron)
   + Cloudflare Pages (frontend hosting)
   + PWA (installable, offline-resilient)
   + Capacitor (Android APK/AAB wrapper, keyingi bosqich)
```

Hech qanday alohida backend server, microservice, Docker cluster, Redis,
Kafka yoki shunga o'xshash qo'shimcha infra ishlatilmaydi (120-band).

## 2. Yuqori darajadagi diagram

```
┌─────────────────────────────┐
│  Browser / PWA / Android    │
│  Next.js (Client + Server   │
│  Components, RSC, Route     │
│  Handlers only for glue)    │
└──────────────┬───────────────┘
               │ supabase-js (anon key, RLS-protected)
               ▼
┌─────────────────────────────┐
│         Supabase            │
│  ┌───────────────────────┐  │
│  │ Postgres (RLS)        │  │
│  │ - profiles            │  │
│  │ - user_accounts       │  │
│  │ - categories          │  │
│  │ - transactions ...    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Auth (Google, Email)  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Edge Functions         │  │
│  │ - weekly-report        │  │
│  │ - delete-account        │  │
│  │ - generate-public-id    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ pg_cron                │  │
│  │ - trigger weekly report│  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

Frontend to'g'ridan-to'g'ri Supabase bilan `supabase-js` orqali gaplashadi
(anon key, RLS orqali himoyalangan). Service-role key faqat Edge Function
ichida ishlatiladi, hech qachon client bundle'ga chiqmaydi.

Next.js Route Handlers (`src/app/api/*`) faqat quyidagi hollarda ishlatiladi:
- Edge Function chaqirishni proxy qilish kerak bo'lganda (masalan CORS/auth
  cookie forwarding uchun),
- Server-side ishonchli vaqt manbasini olish uchun (`/api/time`).

Business logic imkon qadar:
1. Postgres funksiyalari / RPC (aggregatsiya, balans hisob-kitobi),
2. RLS policies (access control),
3. Zod validation (frontend + edge function ikkalasida ham) orqali amalga
   oshiriladi.

## 3. Auth flow

```
Landing → Login sahifasi → [Google OAuth | Email+Password]
   → Supabase Auth session yaratiladi (httpOnly cookie, SSR-aware)
   → profiles jadvalida yozuv bor-yo'qligi tekshiriladi
        → yo'q bo'lsa → Onboarding (ism, universitet, ixtiyoriy fieldlar)
             → public_user_id generatsiya qilinadi (server-side, RPC)
        → bor bo'lsa → Dashboard
```

- Session: `@supabase/ssr` orqali cookie-based session, middleware orqali
  himoyalangan route guard.
- Email verification, password reset: Supabase Auth built-in flow +
  custom `/auth/callback`, `/auth/reset-password` sahifalari.
- Public User ID: `generate_public_user_id()` Postgres funksiyasi orqali
  server-side generatsiya qilinadi (collision bo'lsa qayta urinadi, UNIQUE
  constraint bilan himoyalangan). Client hech qachon o'zi ID tanlamaydi.

## 4. Ishonchli vaqt manbasi (server time)

- `src/app/api/time/route.ts` — Next.js route handler, `Date.now()` server
  process vaqtidan qaytaradi (Vercel/Cloudflare Workers muhitida bu OS clock,
  amalda NTP-sync qilingan bo'ladi — bu browser local clock'idan ishonchliroq).
- Qo'shimcha ishonch uchun `lib/time/serverTime.ts` worldtimeapi.org kabi
  tashqi time API'ga fallback qiladi (agar ishlamasa, joriy server vaqtiga
  tushadi — graceful degradation, hech qachon crash bo'lmaydi).
- **Muhim**: Kelajak sanani bloklash faqat frontendda emas — bu server-side
  ham amalga oshiriladi:
  - Postgres `CHECK` constraint: `transaction_date <= (now() AT TIME ZONE
    user_timezone)::date` — bu funksiya orqali amalga oshiriladi, chunki
    `CHECK` constraintlar `now()` kabi volatile funksiyalarni to'g'ridan-to'g'ri
    qabul qilmaydi. Shu sababli bu qoida `BEFORE INSERT/UPDATE` trigger orqali
    amalga oshiriladi (`enforce_no_future_date()`), bu server clock asosida
    tekshiradi va xato sanani reject qiladi.

## 5. Database schema (qisqacha, batafsili migrations/ papkasida)

Asosiy jadvallar (barchasi `public` schema, RLS yoqilgan):

- `profiles` — 1:1 `auth.users`, `public_user_id` (7 xonali unique)
- `user_accounts` — wallet/hisoblar (Naqd, Uzcard, ...)
- `categories` — hierarchical (parent_id), system (`user_id IS NULL`) yoki
  custom
- `transactions` — asosiy yozuv (expense/income/transfer/loan/debt_repayment/
  refund)
- `transaction_items` — multi-select itemlar (ichimliklar va h.k.)
- `tags`, `transaction_tags` — many-to-many teglar
- `budgets`, `budget_periods` — byudjet va davr bo'yicha progress
- `goals` — moliyaviy maqsadlar
- `subscriptions` — recurring to'lovlar (Netflix va h.k.)
- `weekly_reports`, `report_items` — haftalik hisobotlar va breakdown
- `notifications` — in-app bildirishnomalar

To'liq DDL: `supabase/migrations/*.sql`.

## 6. RLS strategiyasi

Har bir user-owned jadvalda:
```sql
alter table public.<table> enable row level security;

create policy "select_own" on public.<table>
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.<table>
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.<table>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete_own" on public.<table>
  for delete using (auth.uid() = user_id);
```

`categories` uchun qo'shimcha policy: system categories (`user_id IS NULL`)
hammaga `SELECT` uchun ochiq, lekin `INSERT/UPDATE/DELETE` faqat egasi uchun
(yoki umuman client tomondan yo'q — faqat seed orqali).

`weekly_reports` va `report_items` — faqat `service_role` yoza oladi (Edge
Function), user faqat `SELECT` qila oladi.

## 7. Weekly report scheduling

- pg_cron job: har dushanba 00:05 (Asia/Tashkent asosida UTC'ga
  konvertatsiya qilingan cron expression) da Supabase Edge Function
  `weekly-report-generator`ni HTTP orqali chaqiradi (`pg_net` yoki
  `net.http_post`).
- Edge Function barcha userlar bo'yicha o'tgan haftaning (Dushanba–Yakshanba)
  hisobotini generatsiya qiladi:
  - `weekly_reports(user_id, week_start, week_end)` UNIQUE constraint —
    duplicate oldini oladi (`ON CONFLICT DO NOTHING` / idempotent recovery).
  - Status: `pending → processing → completed | failed`.
  - Agar bir hafta uchun report yo'q bo'lib qolsa (masalan cron bir marta
    ishlamagan), keyingi execution barcha "missing" haftalarni topib,
    ularni ham generatsiya qiladi (idempotent backfill query).
- Report tayyor bo'lgach `notifications` jadvaliga yozuv qo'shiladi.

## 8. Money precision

- Barcha pul ustunlari: `numeric(18,2)`.
- Frontendda hisob-kitob JS `number` bilan emas, `lib/money/` ichidagi
  helper funksiyalar orqali (butun so'm sifatida, chunki UZS'da tiyin
  ishlatilmaydi — lekin ustun `numeric(18,2)` umumiy valyuta kelajakda
  qo'shilishi uchun saqlanadi). Aggregatsiya har doim SQL tomonda (`SUM`)
  bajariladi, JS floating-point orqali emas.

## 9. Folder structure

```
src/
  app/                    # Next.js App Router
    (auth)/login, signup, onboarding, auth/callback, reset-password
    (app)/dashboard, transactions, calendar, reports, budgets, goals,
          profile, settings, analytics
    api/time/route.ts
  components/             # generic UI (shadcn-based)
  features/
    auth/
    dashboard/
    transactions/
    calendar/
    categories/
    accounts/
    reports/
    budgets/
    goals/
    subscriptions/
    notifications/
  lib/
    supabase/             # client.ts, server.ts, middleware.ts
    calculations/         # money, date, weekly-period, aggregation helpers
    validators/           # zod schemas
    utils/
  hooks/
  types/                  # generated Supabase types + domain types
supabase/
  migrations/
  functions/              # edge functions
  config.toml
```

## 10. Deploy

- Frontend: Cloudflare Pages (`@cloudflare/next-on-pages` yoki Next.js
  static-friendly build). Supabase klient env var'lar orqali (`NEXT_PUBLIC_*`).
- Backend: Supabase (Free Plan uyg'un resource-efficient dizayn: pagination,
  indexlar, kam invocation).
- Android: Capacitor `android/` papkasi orqali, keyingi bosqichda qo'shiladi.

Bu hujjat loyihaning "single source of truth" arxitektura qarori bo'lib
xizmat qiladi. Keyingi bosqichlarda (Auth, Categories, Transactions, ...)
shu arxitekturaga mos ravishda kod yoziladi.
