-- Correct the requested financial expense name without changing its stable slug.
update public.categories
set name = 'Tovon puli',
    updated_at = now()
where user_id is null
  and slug = 'financial-payment-fee';
