# STable — Implementation Progress

Tracks which of the 17 development stages (see ARCHITECTURE.md /
original spec) are done, in progress, or pending.

## Bosqichlar

- [x] 1. Architecture + DB schema — `ARCHITECTURE.md`, `supabase/migrations/001-010`
- [x] 2. Supabase Auth — Google OAuth + email/password, verify email, reset
      password, logout, session proxy (`src/proxy.ts`, `src/features/auth/*`)
- [x] 3. Onboarding + profile + 7-digit public User ID —
      `src/app/(auth)/onboarding`, `create_profile` RPC,
      `generate_public_user_id` RPC
- [x] 4. Categories — hierarchical default categories seeded
      (`006_seed_default_categories.sql`), custom category creation
      (`src/features/categories`)
- [x] 5. Accounts/wallet — `src/features/accounts`, default "Naqd"
      account created at onboarding, `/settings/accounts` management UI
- [x] 6. Transaction engine — create/edit/delete, future-date rejection
      (DB trigger + trusted server time UX), idempotency key dedup,
      balance-effect triggers (`003_transactions.sql`),
      `src/features/transactions`, search/filter/sort/pagination,
      CSV export (`/api/transactions/export`)
- [x] 7. Calendar — `/calendar` month view, day detail panel, future
      days visually and functionally disabled
- [x] 8. Dashboard — summary cards, trend chart, top categories, empty
      state (`src/features/dashboard`)
- [x] 9. Analytics — `/analytics`: monthly trend, account distribution,
      item-level breakdown, top transactions, meal stats
      (`010_analytics_rpc_functions.sql`, `src/features/analytics`)
- [x] 10. Weekly reports — `/reports` list + `/reports/[id]` detail,
      idempotent SQL generator + pg_cron schedule
      (`008_weekly_report_generation.sql`, `009_cron_and_account_deletion.sql`)
- [x] 11. Budgets — `/budgets`, create dialog, progress cards with
      warning/over-limit coloring
- [x] 12. Goals — `/goals`, create dialog, progress cards
- [x] 13. Subscriptions — `/subscriptions`, create dialog, cards
- [x] 14. PWA — manifest, service worker (network-only for data,
      cache-first for shell), install prompt, network status banner,
      generated icons/splash
- [x] 15. Capacitor Android — `android/` project added, icons/splash
      generated, `capacitor.config.ts` documented (WebView wrapper
      pointing at the deployed production URL — see README.md
      rationale)
- [x] 16. Testing — Vitest unit tests (money/date/validation, 33
      passing), Playwright E2E scaffolding (`e2e/`, requires a real
      Supabase test account to run — skipped gracefully otherwise)
- [x] 17. Production optimization / final polish — global error
      boundary, segment error boundary, ESLint/React Compiler clean
      (0 errors), full `npm run build` passes with 27 routes

## Qo'shimcha yaratilgan sahifalar (asosiy 17 bosqichdan tashqari)

- `/profile` — profil ko'rish/tahrirlash, public ID nusxalash
- `/settings` — dark mode, hisoblar, logout, delete account
- `/settings/accounts` — wallet/hisob boshqaruvi
- `/notifications` — bildirishnoma ro'yxati, o'qilgan/o'qilmagan holat

## Bilinen cheklovlar / keyingi qadamlar

- Supabase migratsiyalari hali real Supabase project'ga qo'llanilmagan
  — production'ga chiqishdan oldin `supabase db push` yoki Dashboard
  SQL Editor orqali qo'llash kerak (README.md 2-bo'lim).
- `delete-account` Edge Function kodi README'da tushuntirilgan, lekin
  haqiqiy Supabase Edge Function fayli sifatida yozilmagan —
  `supabase functions new delete-account` bilan yaratib,
  `auth.admin.deleteUser()` chaqiruvini qo'shish kerak.
- E2E testlar haqiqiy Supabase backend va test user talab qiladi —
  CI muhitida `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` orqali sozlanadi.
- `.env.local` foydalanuvchi tomonidan to'ldirilishi kerak (haqiqiy
  Supabase loyihasi bilan).
- Capacitor Android build uchun Android Studio/SDK va imzolash
  keystore'i lokal muhitda kerak bo'ladi (README.md 7-bo'lim).

## Muhim texnik eslatmalar

- shadcn/ui bu loyihada **@base-ui/react** ustida qurilgan (Radix
  emas). `asChild` yo'q — o'rniga `render={<Link .../>}` prop
  ishlatiladi. Select/Tabs `onValueChange` `string | null` qaytaradi,
  har doim null-check qiling.
- Zod v4 + react-hook-form: `.coerce`/`.default()` ishlatilgan
  schemalar uchun `z.input<>` (form values) va `z.output<>` (submit
  values) alohida export qilingan.
- Next.js 16: `middleware.ts` → `src/proxy.ts`, export nomi `proxy`.
- React Compiler (`reactCompiler: true`) yoqilgan — `useEffect` ichida
  to'g'ridan-to'g'ri `setState` chaqirish lint xatosi beradi; buning
  o'rniga lazy `useState` initializer yoki `key`-based remount
  pattern'laridan foydalanilgan (`NetworkStatusBanner`,
  `DayDetailPanel`). react-hook-form'ning `watch()` bilan bog'liq
  "incompatible library" ogohlantirishlari xavfsiz va build'ni
  to'xtatmaydi.
- Build joriy Windows muhitida ~3-4 daqiqa davom etadi (Turbopack).

## Build/test holati (oxirgi tekshiruv)

- `npm run build`: ✅ muvaffaqiyatli, 27 route, 0 TypeScript xatosi
- `npx eslint .`: ✅ 0 xato, 4 ogohlantirish (xavfsiz, izohlangan)
- `npx vitest run`: ✅ 33/33 test muvaffaqiyatli
