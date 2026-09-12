-- =====================================================================
-- 011_finance_experience_refresh.sql
-- Uzbek product terminology, curated expense taxonomy, profile gender,
-- and recurring-expense metadata used by the balance forecast.
-- =====================================================================

alter table public.profiles
  add column if not exists gender text null;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female'));

alter table public.categories
  add column if not exists is_recurring boolean not null default false;

-- Bring existing users onto the same two-method payment model without
-- touching balances already recorded on their accounts.
insert into public.user_accounts (user_id, name, type, balance, currency)
select p.auth_user_id, 'Naqd', 'cash', 0, coalesce(p.currency, 'UZS')
from public.profiles p
where not exists (
  select 1 from public.user_accounts a
  where a.user_id = p.auth_user_id and a.type = 'cash' and a.is_active
);

insert into public.user_accounts (user_id, name, type, balance, currency)
select p.auth_user_id, 'Karta', 'card', 0, coalesce(p.currency, 'UZS')
from public.profiles p
where not exists (
  select 1 from public.user_accounts a
  where a.user_id = p.auth_user_id and a.type = 'card' and a.is_active
);

-- Existing system expense categories remain attached to historical rows, but
-- disappear from new-entry screens. Matching slugs are reactivated below.
update public.categories
set is_active = false
where user_id is null and type = 'expense';

create or replace function public.upsert_system_category(
  p_parent_id uuid,
  p_name text,
  p_slug text,
  p_icon text,
  p_sort_order int,
  p_is_recurring boolean default false,
  p_type text default 'expense'
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.categories
  where user_id is null and slug = p_slug;

  if v_id is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type, is_default,
      is_active, sort_order, is_recurring
    ) values (
      null, p_parent_id, p_name, p_slug, p_icon, p_type, true,
      true, p_sort_order, p_is_recurring
    ) returning id into v_id;
  else
    update public.categories
    set parent_id = p_parent_id,
        name = p_name,
        icon = p_icon,
        type = p_type,
        is_default = true,
        is_active = true,
        sort_order = p_sort_order,
        is_recurring = p_is_recurring
    where id = v_id;
  end if;

  return v_id;
end;
$$;

do $$
declare
  v_root uuid;
  v_type uuid;
begin
  -- 1. Oziq-ovqat
  v_root := public.upsert_system_category(null, 'Oziq-ovqat', 'food', 'utensils', 1);
  perform public.upsert_system_category(v_root, 'Tayyor ovqat', 'food-ready', 'cooking-pot', 1, true);
  perform public.upsert_system_category(v_root, 'Uyda tayyorlangan (0 so‘m)', 'food-home-cooked', 'house', 2, true);

  -- 2. Ichimlik
  v_root := public.upsert_system_category(null, 'Ichimlik', 'drinks', 'cup-soda', 2);
  perform public.upsert_system_category(v_root, 'Mineral suv', 'drink-water', 'glass-water', 1, true);
  v_type := public.upsert_system_category(v_root, 'Gazli ichimlik', 'drink-carbonated', 'cup-soda', 2, true);
  perform public.upsert_system_category(v_type, 'Coca-Cola', 'drink-carbonated-coca-cola', 'bottle', 1, true);
  perform public.upsert_system_category(v_type, 'Fanta', 'drink-carbonated-fanta', 'bottle', 2, true);
  perform public.upsert_system_category(v_type, 'Sprite', 'drink-carbonated-sprite', 'bottle', 3, true);
  perform public.upsert_system_category(v_type, 'Pepsi', 'drink-carbonated-pepsi', 'bottle', 4, true);
  perform public.upsert_system_category(v_type, 'Chortoq', 'drink-carbonated-chortoq', 'bottle', 5, true);
  perform public.upsert_system_category(v_type, 'BonAqua', 'drink-carbonated-bonaqua', 'bottle', 6, true);
  perform public.upsert_system_category(v_type, 'Boshqa', 'drink-carbonated-other', 'ellipsis', 7, true);
  v_type := public.upsert_system_category(v_root, 'Mevali choy', 'drink-fruit-tea', 'coffee', 3, true);
  perform public.upsert_system_category(v_type, 'Lipton', 'drink-tea-lipton', 'bottle', 1, true);
  perform public.upsert_system_category(v_type, 'Time', 'drink-tea-time', 'bottle', 2, true);
  perform public.upsert_system_category(v_type, 'Arctic', 'drink-tea-arctic', 'bottle', 3, true);
  perform public.upsert_system_category(v_type, 'Boshqa', 'drink-tea-other', 'ellipsis', 4, true);
  v_type := public.upsert_system_category(v_root, 'Mevali sharbat', 'drink-juice', 'milk', 4, true);
  perform public.upsert_system_category(v_type, 'Dena', 'drink-juice-dena', 'milk', 1, true);
  perform public.upsert_system_category(v_type, 'Bliss', 'drink-juice-bliss', 'milk', 2, true);
  perform public.upsert_system_category(v_type, 'DaDa', 'drink-juice-dada', 'milk', 3, true);
  perform public.upsert_system_category(v_type, 'Santal', 'drink-juice-santal', 'milk', 4, true);
  perform public.upsert_system_category(v_type, 'Boshqa', 'drink-juice-other', 'ellipsis', 5, true);
  v_type := public.upsert_system_category(v_root, 'Energetik ichimlik', 'drink-energy', 'zap', 5, true);
  perform public.upsert_system_category(v_type, 'Flash', 'drink-energy-flash', 'zap', 1, true);
  perform public.upsert_system_category(v_type, 'Gorilla', 'drink-energy-gorilla', 'zap', 2, true);
  perform public.upsert_system_category(v_type, '18+', 'drink-energy-18-plus', 'zap', 3, true);
  perform public.upsert_system_category(v_type, 'Red Bull', 'drink-energy-red-bull', 'zap', 4, true);
  perform public.upsert_system_category(v_type, 'Monster', 'drink-energy-monster', 'zap', 5, true);
  perform public.upsert_system_category(v_type, 'Boshqa', 'drink-energy-other', 'ellipsis', 6, true);

  -- 3–14. Remaining categories
  v_root := public.upsert_system_category(null, 'Uy-joy va yashash', 'housing', 'house', 3);
  perform public.upsert_system_category(v_root, 'Ijara', 'housing-rent', 'key-round', 1, true);
  v_type := public.upsert_system_category(v_root, 'Kommunal to‘lov', 'housing-utilities', 'landmark', 2, true);
  perform public.upsert_system_category(v_type, 'Elektr', 'housing-electricity', 'zap', 1, true);
  perform public.upsert_system_category(v_type, 'Gaz', 'housing-gas', 'flame', 2, true);
  perform public.upsert_system_category(v_type, 'Suv', 'housing-water', 'droplets', 3, true);
  perform public.upsert_system_category(v_root, 'Wi-Fi', 'housing-wifi', 'wifi', 3, true);
  perform public.upsert_system_category(v_root, 'Mobil tarif', 'housing-mobile-plan', 'smartphone', 4, true);

  v_root := public.upsert_system_category(null, 'Transport', 'transport', 'bus-front', 4);
  perform public.upsert_system_category(v_root, 'Metro', 'transport-metro', 'train-front', 1, true);
  perform public.upsert_system_category(v_root, 'Avtobus', 'transport-bus', 'bus-front', 2, true);
  perform public.upsert_system_category(v_root, 'Tramvay', 'transport-tram', 'tram-front', 3, true);
  perform public.upsert_system_category(v_root, 'Taksi', 'transport-taxi', 'car-taxi-front', 4, true);

  v_root := public.upsert_system_category(null, 'Ta’lim', 'education', 'graduation-cap', 5);
  perform public.upsert_system_category(v_root, 'Kontrakt', 'education-contract', 'file-text', 1);
  perform public.upsert_system_category(v_root, 'Kurs', 'education-course', 'presentation', 2);
  perform public.upsert_system_category(v_root, 'Kitob', 'education-book', 'book-open', 3);
  perform public.upsert_system_category(v_root, 'O‘quv qurollari', 'education-supplies', 'pencil-ruler', 4, true);

  v_root := public.upsert_system_category(null, 'Texnologiya va elektronika', 'technology', 'cpu', 6);
  perform public.upsert_system_category(v_root, 'Qurilma', 'technology-device', 'laptop', 1);
  perform public.upsert_system_category(v_root, 'Aksessuar', 'technology-accessory', 'headphones', 2);
  perform public.upsert_system_category(v_root, 'Ta’mir', 'technology-repair', 'wrench', 3);

  v_root := public.upsert_system_category(null, 'Kiyim-kechak', 'clothing', 'shirt', 7);
  perform public.upsert_system_category(v_root, 'Kiyim', 'clothing-clothes', 'shirt', 1);
  perform public.upsert_system_category(v_root, 'Oyoq kiyim', 'clothing-shoes', 'footprints', 2);
  perform public.upsert_system_category(v_root, 'Aksessuar', 'clothing-accessory', 'watch', 3);

  v_root := public.upsert_system_category(null, 'Sog‘liq va tibbiyot', 'health', 'heart-pulse', 8);
  perform public.upsert_system_category(v_root, 'Shifokor', 'health-doctor', 'stethoscope', 1);
  perform public.upsert_system_category(v_root, 'Dori', 'health-medicine', 'pill', 2);
  perform public.upsert_system_category(v_root, 'Optika', 'health-optics', 'glasses', 3);
  perform public.upsert_system_category(v_root, 'Tibbiy xarajatlar', 'health-medical-expenses', 'hospital', 4);

  v_root := public.upsert_system_category(null, 'Ko‘ngilochar va dam olish', 'entertainment', 'party-popper', 9);
  perform public.upsert_system_category(v_root, 'Attraksionlar', 'entertainment-attractions', 'ferris-wheel', 1);
  perform public.upsert_system_category(v_root, 'Kino', 'entertainment-cinema', 'clapperboard', 2);
  perform public.upsert_system_category(v_root, 'Konsert', 'entertainment-concert', 'music', 3);
  perform public.upsert_system_category(v_root, 'Chempionat', 'entertainment-championship', 'trophy', 4);
  perform public.upsert_system_category(v_root, 'Karaoke', 'entertainment-karaoke', 'mic-vocal', 5);
  perform public.upsert_system_category(v_root, 'O‘yin klubi', 'entertainment-game-club', 'gamepad-2', 6);
  perform public.upsert_system_category(v_root, 'O‘yin monetalari', 'entertainment-game-currency', 'coins', 7);
  perform public.upsert_system_category(v_root, 'Dacha', 'entertainment-country-house', 'trees', 8);
  perform public.upsert_system_category(v_root, 'Boshqa xizmatlar', 'entertainment-other-services', 'sparkles', 9);

  v_root := public.upsert_system_category(null, 'Obunalar', 'subscriptions', 'refresh-cw', 10);
  perform public.upsert_system_category(v_root, 'Sun’iy intellekt', 'subscriptions-ai', 'bot', 1, true);
  perform public.upsert_system_category(v_root, 'Spotify yoki Apple Music', 'subscriptions-music', 'headphones', 2, true);
  perform public.upsert_system_category(v_root, 'ITV yoki Netflix', 'subscriptions-video', 'tv', 3, true);
  perform public.upsert_system_category(v_root, 'Sport zali', 'subscriptions-gym', 'dumbbell', 4, true);
  perform public.upsert_system_category(v_root, 'Boshqa', 'subscriptions-other', 'ellipsis', 5, true);

  v_root := public.upsert_system_category(null, 'Sayohat', 'travel', 'plane', 11);
  perform public.upsert_system_category(v_root, 'Poyezd bileti', 'travel-train-ticket', 'ticket', 1);
  perform public.upsert_system_category(v_root, 'Aviachipta', 'travel-flight-ticket', 'plane-takeoff', 2);
  perform public.upsert_system_category(v_root, 'Hostel', 'travel-hostel', 'bed-double', 3);

  v_root := public.upsert_system_category(null, 'Sovg‘a va xayriya', 'gifts', 'gift', 12);
  perform public.upsert_system_category(v_root, 'Tug‘ilgan kun sovg‘asi', 'gifts-birthday', 'cake-slice', 1);
  perform public.upsert_system_category(v_root, 'Bayram sovg‘asi', 'gifts-holiday', 'gift', 2);
  perform public.upsert_system_category(v_root, 'Gul', 'gifts-flower', 'flower-2', 3);
  perform public.upsert_system_category(v_root, 'Xayriya yoki ehson', 'gifts-charity', 'hand-heart', 4);

  v_root := public.upsert_system_category(null, 'Moliyaviy chiqimlar', 'financial-expenses', 'landmark', 13);
  perform public.upsert_system_category(v_root, 'Qarz berish', 'financial-lending', 'hand-coins', 1);
  perform public.upsert_system_category(v_root, 'Qarz qaytarish', 'financial-debt-repayment', 'badge-dollar-sign', 2);
  perform public.upsert_system_category(v_root, 'Kredit to‘lovi', 'financial-loan-payment', 'receipt-text', 3, true);

  v_root := public.upsert_system_category(null, 'Xaridlar', 'shopping', 'shopping-basket', 14);
  perform public.upsert_system_category(v_root, 'Idish yuvish vositalari', 'shopping-dishwashing', 'spray-can', 1, true);
  perform public.upsert_system_category(v_root, 'Tozalik va gigiyena vositalari', 'shopping-hygiene', 'sparkles', 2, true);
  perform public.upsert_system_category(v_root, 'Tamaki', 'shopping-tobacco', 'cigarette', 3, true);
  perform public.upsert_system_category(v_root, 'Jihoz', 'shopping-equipment', 'package', 4);

  -- Income is retained as a separate operation type, with natural Uzbek wording.
  update public.categories
  set name = 'Kirim', icon = 'circle-plus'
  where user_id is null and slug = 'income';
  update public.categories
  set name = 'Stipendiya', icon = 'graduation-cap'
  where user_id is null and slug = 'income-scholarship';
  update public.categories
  set name = 'Boshqa kirim', icon = 'circle-plus'
  where user_id is null and slug = 'income-other';
end;
$$;

drop function public.upsert_system_category(uuid, text, text, text, int, boolean, text);

-- Profile creation overload used by the refreshed onboarding flow.
create or replace function public.create_profile(
  p_full_name text,
  p_university_name text,
  p_faculty text,
  p_course text,
  p_gender text,
  p_avatar_url text,
  p_timezone text default 'Asia/Tashkent',
  p_currency text default 'UZS'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_gender not in ('male', 'female') then
    raise exception 'Invalid gender';
  end if;

  insert into public.profiles (
    auth_user_id, public_user_id, full_name, university_name,
    faculty, course, gender, avatar_url, timezone, currency
  ) values (
    auth.uid(), public.generate_public_user_id(), trim(p_full_name), trim(p_university_name),
    p_faculty, p_course, p_gender, nullif(trim(p_avatar_url), ''),
    coalesce(p_timezone, 'Asia/Tashkent'), coalesce(p_currency, 'UZS')
  ) returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.create_profile(text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_profile(text, text, text, text, text, text, text, text) to authenticated;

-- Atomic multi-item expense save. Each item becomes its own transaction so
-- cash/card balances and analytics remain exact even when methods are mixed.
create or replace function public.create_expense_batch(
  p_transaction_date date,
  p_items jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_transaction_id uuid;
  v_count int := 0;
  v_amount numeric;
  v_zero boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item ->> 'amount')::numeric;
    v_zero := coalesce((v_item ->> 'isZeroConsumption')::boolean, false);

    if v_amount < 0 or (v_amount = 0 and not v_zero) then
      raise exception 'Invalid amount';
    end if;

    if not exists (
      select 1 from public.user_accounts a
      where a.id = (v_item ->> 'accountId')::uuid
        and a.user_id = auth.uid() and a.is_active
        and a.type in ('cash', 'card')
    ) then
      raise exception 'Invalid payment account';
    end if;

    if not exists (
      select 1 from public.categories c
      where c.id = (v_item ->> 'categoryId')::uuid
        and c.type = 'expense' and c.is_active
        and (c.user_id is null or c.user_id = auth.uid())
    ) then
      raise exception 'Invalid category';
    end if;

    insert into public.transactions (
      user_id, account_id, category_id, transaction_type, amount,
      transaction_date, is_zero_consumption, note, idempotency_key
    ) values (
      auth.uid(), (v_item ->> 'accountId')::uuid, (v_item ->> 'categoryId')::uuid,
      'expense', v_amount, p_transaction_date, v_zero,
      nullif(v_item ->> 'name', ''), nullif(v_item ->> 'idempotencyKey', '')
    )
    on conflict (user_id, idempotency_key) where idempotency_key is not null
    do nothing
    returning id into v_transaction_id;

    if v_transaction_id is not null then
      insert into public.transaction_items (
        transaction_id, item_type, item_name, quantity, metadata
      ) values (
        v_transaction_id,
        coalesce(v_item ->> 'itemType', v_item ->> 'categoryId'),
        coalesce(nullif(v_item ->> 'name', ''), 'Chiqim'),
        1,
        jsonb_build_object('paymentMethod', v_item ->> 'paymentMethod')
      );
      v_count := v_count + 1;
    end if;

    v_transaction_id := null;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.create_expense_batch(date, jsonb) from public;
grant execute on function public.create_expense_batch(date, jsonb) to authenticated;
