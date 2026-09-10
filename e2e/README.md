# E2E testlar (Playwright)

Bu testlar haqiqiy Supabase backend'iga tayanadi (auth, RLS xatti-
harakati production kodga imkon qadar yaqin bo'lishi uchun mock
qilinmagan).

## Sozlash

1. `.env.local` faylida `NEXT_PUBLIC_SUPABASE_URL` va
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to'ldirilgan bo'lishi kerak
   (asosiy README.md, 1-bo'lim).
2. Testlar uchun alohida test Supabase loyihasi yoki test user
   ishlatish tavsiya etiladi — production ma'lumotlariga tegmaslik
   uchun.
3. Playwright browser binarylarini o'rnating:
   ```bash
   npx playwright install chromium
   ```

## Ishga tushirish

```bash
npx playwright test
```

## Test fayllar

- `auth.spec.ts` — signup, login, logout oqimi
- `transactions.spec.ts` — xarajat qo'shish, tahrirlash
- `dashboard.spec.ts` — dashboard yuklanishi, asosiy statistikalar
- `calendar.spec.ts` — kelajak sanani tanlab bo'lmasligi

Har bir test fayli mustaqil ishlaydigan, bir-biriga bog'liq bo'lmagan
holatda yozilgan. CI muhitida ishlatish uchun test user credentials'ni
environment variable orqali bering (`E2E_TEST_EMAIL`,
`E2E_TEST_PASSWORD`), hech qachon kodga hardcode qilmang.
