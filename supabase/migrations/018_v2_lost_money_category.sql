-- STable v2: lost money is a first-class, non-recurring expense category.

do $$
declare
  v_root uuid;
  v_child uuid;
begin
  select id into v_root from public.categories
  where user_id is null and slug = 'lost-money' limit 1;

  if v_root is null then
    insert into public.categories (
      user_id, parent_id, name, slug, icon, type, is_default,
      is_active, sort_order, is_recurring
    ) values (
      null, null, 'Yo‘qotilgan pullar', 'lost-money', 'shield-alert',
      'expense', true, true, 16, false
    ) returning id into v_root;
  else
    update public.categories
    set parent_id = null, name = 'Yo‘qotilgan pullar', icon = 'shield-alert',
        type = 'expense', is_default = true, is_active = true,
        sort_order = 16, is_recurring = false
    where id = v_root;
  end if;

  select id into v_child from public.categories where user_id is null and slug = 'lost-money-scam' limit 1;
  if v_child is null then
    insert into public.categories (user_id, parent_id, name, slug, icon, type, is_default, is_active, sort_order, is_recurring)
    values (null, v_root, 'Firibgarlik orqali yo‘qotish', 'lost-money-scam', 'badge-alert', 'expense', true, true, 1, false);
  else
    update public.categories set parent_id = v_root, name = 'Firibgarlik orqali yo‘qotish', icon = 'badge-alert', type = 'expense', is_default = true, is_active = true, sort_order = 1, is_recurring = false where id = v_child;
  end if;

  select id into v_child from public.categories where user_id is null and slug = 'lost-money-dropped' limit 1;
  if v_child is null then
    insert into public.categories (user_id, parent_id, name, slug, icon, type, is_default, is_active, sort_order, is_recurring)
    values (null, v_root, 'Tushirib yo‘qotish', 'lost-money-dropped', 'circle-off', 'expense', true, true, 2, false);
  else
    update public.categories set parent_id = v_root, name = 'Tushirib yo‘qotish', icon = 'circle-off', type = 'expense', is_default = true, is_active = true, sort_order = 2, is_recurring = false where id = v_child;
  end if;

  select id into v_child from public.categories where user_id is null and slug = 'lost-money-theft' limit 1;
  if v_child is null then
    insert into public.categories (user_id, parent_id, name, slug, icon, type, is_default, is_active, sort_order, is_recurring)
    values (null, v_root, 'O‘g‘irlik oqibatida yo‘qotish', 'lost-money-theft', 'lock-keyhole-open', 'expense', true, true, 3, false);
  else
    update public.categories set parent_id = v_root, name = 'O‘g‘irlik oqibatida yo‘qotish', icon = 'lock-keyhole-open', type = 'expense', is_default = true, is_active = true, sort_order = 3, is_recurring = false where id = v_child;
  end if;

  select id into v_child from public.categories where user_id is null and slug = 'lost-money-other' limit 1;
  if v_child is null then
    insert into public.categories (user_id, parent_id, name, slug, icon, type, is_default, is_active, sort_order, is_recurring)
    values (null, v_root, 'Boshqa yo‘qotish', 'lost-money-other', 'ellipsis', 'expense', true, true, 4, false);
  else
    update public.categories set parent_id = v_root, name = 'Boshqa yo‘qotish', icon = 'ellipsis', type = 'expense', is_default = true, is_active = true, sort_order = 4, is_recurring = false where id = v_child;
  end if;
end;
$$;
