-- Profile region selection and deeper ready-meal/course expense taxonomy.

alter table public.profiles
  add column if not exists region text null;

alter table public.profiles
  drop constraint if exists profiles_region_check;

alter table public.profiles
  add constraint profiles_region_check check (
    region is null or region in (
      'Andijon viloyati',
      'Buxoro viloyati',
      'Jizzax viloyati',
      'Qashqadaryo viloyati',
      'Navoiy viloyati',
      'Namangan viloyati',
      'Samarqand viloyati',
      'Sirdaryo viloyati',
      'Surxondaryo viloyati',
      'Toshkent viloyati',
      'Toshkent shahri',
      'Farg‘ona viloyati',
      'Xorazm viloyati',
      'Qoraqalpog‘iston Respublikasi'
    )
  );

create or replace function public.upsert_system_category_v12(
  p_parent_id uuid,
  p_name text,
  p_slug text,
  p_icon text,
  p_sort_order int,
  p_is_recurring boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.categories
  where user_id is null and slug = p_slug
  limit 1;

  if v_id is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type,
      is_default, is_active, sort_order, is_recurring
    ) values (
      null, p_parent_id, p_name, p_slug, p_icon, 'expense',
      true, true, p_sort_order, p_is_recurring
    ) returning id into v_id;
  else
    update public.categories
    set parent_id = p_parent_id,
        name = p_name,
        icon = p_icon,
        type = 'expense',
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
  v_ready uuid;
  v_course uuid;
begin
  select id into v_ready from public.categories
  where user_id is null and slug = 'food-ready' limit 1;

  if v_ready is not null then
    perform public.upsert_system_category_v12(v_ready, 'Nonushta', 'food-ready-breakfast-v2', 'sunrise', 1, true);
    perform public.upsert_system_category_v12(v_ready, 'Tushlik', 'food-ready-lunch-v2', 'sun', 2, true);
    perform public.upsert_system_category_v12(v_ready, 'Kechqurun', 'food-ready-dinner-v2', 'moon', 3, true);
    perform public.upsert_system_category_v12(v_ready, 'Oraliq', 'food-ready-snack-v2', 'cookie', 4, true);
  end if;

  select id into v_course from public.categories
  where user_id is null and slug = 'education-course' limit 1;

  if v_course is not null then
    perform public.upsert_system_category_v12(v_course, 'Aniq fanlar', 'education-course-exact-sciences', 'calculator', 1);
    perform public.upsert_system_category_v12(v_course, 'Tabiiy fanlar', 'education-course-natural-sciences', 'leaf', 2);
    perform public.upsert_system_category_v12(v_course, 'Ijtimoiy fanlar', 'education-course-social-sciences', 'users', 3);
    perform public.upsert_system_category_v12(v_course, 'Gumanitar fanlar', 'education-course-humanities', 'book-open-text', 4);
    perform public.upsert_system_category_v12(v_course, 'Ijodiy va san’at fanlari', 'education-course-creative-arts', 'palette', 5);
    perform public.upsert_system_category_v12(v_course, 'Chet tili', 'education-course-foreign-language', 'languages', 6);
    perform public.upsert_system_category_v12(v_course, 'Zamonaviy kasblar', 'education-course-modern-professions', 'laptop', 7);
  end if;
end;
$$;

-- Retire the older duplicate branches from the original taxonomy seed.
update public.categories
set is_active = false
where user_id is null
  and slug in (
    'food-ready-meal',
    'food-ready-breakfast',
    'food-ready-lunch',
    'food-ready-dinner',
    'food-ready-snack',
    'edu-course'
  );

drop function public.upsert_system_category_v12(uuid, text, text, text, int, boolean);

drop function if exists public.create_profile(text, text, text, text, text, text, text, text);

create function public.create_profile(
  p_full_name text,
  p_university_name text,
  p_faculty text,
  p_course text,
  p_gender text,
  p_avatar_url text,
  p_region text,
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

  if p_region is null then
    raise exception 'Region is required';
  end if;

  insert into public.profiles (
    auth_user_id, public_user_id, full_name, university_name,
    faculty, course, gender, avatar_url, region, timezone, currency
  ) values (
    auth.uid(), public.generate_public_user_id(), trim(p_full_name), trim(p_university_name),
    p_faculty, p_course, p_gender, nullif(trim(p_avatar_url), ''), p_region,
    coalesce(p_timezone, 'Asia/Tashkent'), coalesce(p_currency, 'UZS')
  ) returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.create_profile(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_profile(text, text, text, text, text, text, text, text, text) to authenticated;
