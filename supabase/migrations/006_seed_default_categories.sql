-- =====================================================================
-- 006_seed_default_categories.sql
-- Default system categories (user_id = null). Reproducible across
-- environments. Slugs are stable, English/latin-transliterated for URL
-- and code safety; display names are in Uzbek (Latin script) per spec.
-- =====================================================================

-- Helper: insert a top-level category and return its id
do $$
declare
  v_food uuid;
  v_food_ready uuid;
  v_food_drinks uuid;
  v_food_grocery uuid;
  v_housing uuid;
  v_communication uuid;
  v_transport uuid;
  v_education uuid;
  v_tech uuid;
  v_clothing uuid;
  v_health uuid;
  v_entertainment uuid;
  v_subscriptions uuid;
  v_travel uuid;
  v_gifts uuid;
  v_finance uuid;
  v_household uuid;
  v_personal_care uuid;
  v_sport uuid;
  v_documents uuid;
  v_other uuid;
  v_income uuid;
begin
  -- 01. Oziq-ovqat va ichimliklar
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Oziq-ovqat va ichimliklar', 'food-and-drinks', '🍽', 'expense', true, 1)
    returning id into v_food;

  insert into public.categories (parent_id, name, slug, icon, type, is_default, sort_order)
    values (v_food, 'Tayyor ovqat', 'food-ready-meal', '🍛', 'expense', true, 1)
    returning id into v_food_ready;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_food_ready, 'Nonushta', 'food-ready-breakfast', 'expense', true, 1),
    (v_food_ready, 'Tushlik', 'food-ready-lunch', 'expense', true, 2),
    (v_food_ready, 'Kechki ovqat', 'food-ready-dinner', 'expense', true, 3),
    (v_food_ready, 'Oraliq ovqat', 'food-ready-snack', 'expense', true, 4);

  insert into public.categories (parent_id, name, slug, icon, type, is_default, sort_order)
    values (v_food, 'Ichimlik', 'food-drinks', '🥤', 'expense', true, 2)
    returning id into v_food_drinks;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_food_drinks, 'Mineral suv', 'drink-mineral-water', 'expense', true, 1),
    (v_food_drinks, 'Gazli ichimlik', 'drink-soda', 'expense', true, 2),
    (v_food_drinks, 'Mevali choy', 'drink-fruit-tea', 'expense', true, 3),
    (v_food_drinks, 'Mevali sharbat', 'drink-juice', 'expense', true, 4),
    (v_food_drinks, 'Energetik', 'drink-energy', 'expense', true, 5),
    (v_food_drinks, 'Oddiy choy', 'drink-tea', 'expense', true, 6),
    (v_food_drinks, 'Kofe', 'drink-coffee', 'expense', true, 7),
    (v_food_drinks, 'Boshqa', 'drink-other', 'expense', true, 8);

  insert into public.categories (parent_id, name, slug, icon, type, is_default, sort_order)
    values (v_food, 'Ro''zg''orlik', 'food-grocery', '🛒', 'expense', true, 3)
    returning id into v_food_grocery;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_food_grocery, 'Oziq-ovqat mahsulotlari', 'grocery-products', 'expense', true, 1),
    (v_food_grocery, 'Yarim tayyor mahsulot', 'grocery-semi-finished', 'expense', true, 2),
    (v_food_grocery, 'Choy/shakar', 'grocery-tea-sugar', 'expense', true, 3),
    (v_food_grocery, 'Ziravor', 'grocery-spices', 'expense', true, 4),
    (v_food_grocery, 'Oshxona mahsulotlari', 'grocery-kitchen-supplies', 'expense', true, 5),
    (v_food_grocery, 'Boshqa', 'grocery-other', 'expense', true, 6);

  -- 02. Uy-joy va yashash
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Uy-joy va yashash', 'housing', '🏠', 'expense', true, 2)
    returning id into v_housing;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_housing, 'Ijara', 'housing-rent', 'expense', true, 1),
    (v_housing, 'Kommunal to''lov', 'housing-utilities', 'expense', true, 2),
    (v_housing, 'Elektr', 'housing-electricity', 'expense', true, 3),
    (v_housing, 'Gaz', 'housing-gas', 'expense', true, 4),
    (v_housing, 'Suv', 'housing-water', 'expense', true, 5),
    (v_housing, 'Issiqlik', 'housing-heating', 'expense', true, 6),
    (v_housing, 'Wi-Fi', 'housing-wifi', 'expense', true, 7),
    (v_housing, 'Boshqa', 'housing-other', 'expense', true, 8);

  -- 03. Aloqa
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Aloqa', 'communication', '📱', 'expense', true, 3)
    returning id into v_communication;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_communication, 'Mobile tarif', 'comm-mobile-plan', 'expense', true, 1),
    (v_communication, 'Mobil internet', 'comm-mobile-internet', 'expense', true, 2),
    (v_communication, 'SMS', 'comm-sms', 'expense', true, 3),
    (v_communication, 'Qo''ng''iroq', 'comm-call', 'expense', true, 4),
    (v_communication, 'SIM/eSIM', 'comm-sim', 'expense', true, 5),
    (v_communication, 'Rouming', 'comm-roaming', 'expense', true, 6),
    (v_communication, 'Boshqa', 'comm-other', 'expense', true, 7);

  -- 04. Transport
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Transport', 'transport', '🚕', 'expense', true, 4)
    returning id into v_transport;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_transport, 'Metro', 'transport-metro', 'expense', true, 1),
    (v_transport, 'Avtobus', 'transport-bus', 'expense', true, 2),
    (v_transport, 'Tramvay', 'transport-tram', 'expense', true, 3),
    (v_transport, 'Taksi', 'transport-taxi', 'expense', true, 4),
    (v_transport, 'Poyezd', 'transport-train', 'expense', true, 5),
    (v_transport, 'Samokat', 'transport-scooter', 'expense', true, 6),
    (v_transport, 'Velosiped', 'transport-bike', 'expense', true, 7),
    (v_transport, 'Boshqa', 'transport-other', 'expense', true, 8);

  -- 05. Ta'lim
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Ta''lim', 'education', '🎓', 'expense', true, 5)
    returning id into v_education;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_education, 'Kontrakt', 'edu-contract', 'expense', true, 1),
    (v_education, 'Kurs', 'edu-course', 'expense', true, 2),
    (v_education, 'Kitob', 'edu-book', 'expense', true, 3),
    (v_education, 'Elektron kitob', 'edu-ebook', 'expense', true, 4),
    (v_education, 'O''quv qurollari', 'edu-supplies', 'expense', true, 5),
    (v_education, 'Print', 'edu-print', 'expense', true, 6),
    (v_education, 'Kserokopiya', 'edu-photocopy', 'expense', true, 7),
    (v_education, 'Imtihon', 'edu-exam', 'expense', true, 8),
    (v_education, 'Sertifikat', 'edu-certificate', 'expense', true, 9),
    (v_education, 'Boshqa', 'edu-other', 'expense', true, 10);

  -- 06. Texnologiya va elektronika
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Texnologiya va elektronika', 'technology', '💻', 'expense', true, 6)
    returning id into v_tech;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_tech, 'Qurilma', 'tech-device', 'expense', true, 1),
    (v_tech, 'Aksessuar', 'tech-accessory', 'expense', true, 2),
    (v_tech, 'Ta''mir', 'tech-repair', 'expense', true, 3),
    (v_tech, 'Dasturiy ta''minot', 'tech-software', 'expense', true, 4),
    (v_tech, 'Domain', 'tech-domain', 'expense', true, 5),
    (v_tech, 'Hosting', 'tech-hosting', 'expense', true, 6),
    (v_tech, 'AI/API', 'tech-ai-api', 'expense', true, 7),
    (v_tech, 'Cloud', 'tech-cloud', 'expense', true, 8),
    (v_tech, 'Boshqa', 'tech-other', 'expense', true, 9);

  -- 07. Kiyim-kechak
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Kiyim-kechak', 'clothing', '👕', 'expense', true, 7)
    returning id into v_clothing;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_clothing, 'Kiyim', 'clothing-clothes', 'expense', true, 1),
    (v_clothing, 'Oyoq kiyim', 'clothing-shoes', 'expense', true, 2),
    (v_clothing, 'Aksessuar', 'clothing-accessory', 'expense', true, 3),
    (v_clothing, 'Ta''mirlash', 'clothing-repair', 'expense', true, 4),
    (v_clothing, 'Tozalash/Kiyim yuvish', 'clothing-cleaning', 'expense', true, 5),
    (v_clothing, 'Boshqa', 'clothing-other', 'expense', true, 6);

  -- 08. Sog'liq va tibbiyot
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Sog''liq va tibbiyot', 'health', '🏥', 'expense', true, 8)
    returning id into v_health;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_health, 'Shifokor', 'health-doctor', 'expense', true, 1),
    (v_health, 'Dori', 'health-medicine', 'expense', true, 2),
    (v_health, 'Optika', 'health-optics', 'expense', true, 3),
    (v_health, 'Stomatolog', 'health-dentist', 'expense', true, 4),
    (v_health, 'Analiz', 'health-analysis', 'expense', true, 5),
    (v_health, 'Tibbiy xarajatlar', 'health-medical-expenses', 'expense', true, 6),
    (v_health, 'Boshqa', 'health-other', 'expense', true, 7);

  -- 09. Ko'ngilochar va dam olish
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Ko''ngilochar va dam olish', 'entertainment', '🎮', 'expense', true, 9)
    returning id into v_entertainment;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_entertainment, 'Atraksionlar', 'ent-attractions', 'expense', true, 1),
    (v_entertainment, 'Kino', 'ent-cinema', 'expense', true, 2),
    (v_entertainment, 'Konsert', 'ent-concert', 'expense', true, 3),
    (v_entertainment, 'Sport tadbiri / Chempionat', 'ent-sport-event', 'expense', true, 4),
    (v_entertainment, 'Karaoke', 'ent-karaoke', 'expense', true, 5),
    (v_entertainment, 'Game Club', 'ent-game-club', 'expense', true, 6),
    (v_entertainment, 'O''yin monetalari', 'ent-game-coins', 'expense', true, 7),
    (v_entertainment, 'Dacha', 'ent-dacha', 'expense', true, 8),
    (v_entertainment, 'Bowling', 'ent-bowling', 'expense', true, 9),
    (v_entertainment, 'Bilyard', 'ent-billiards', 'expense', true, 10),
    (v_entertainment, 'Teatr', 'ent-theatre', 'expense', true, 11),
    (v_entertainment, 'Muzey', 'ent-museum', 'expense', true, 12),
    (v_entertainment, 'Boshqa xizmatlar', 'ent-other', 'expense', true, 13);

  -- 10. Obunalar
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Obunalar', 'subscriptions', '🔄', 'expense', true, 10)
    returning id into v_subscriptions;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_subscriptions, 'AI', 'sub-ai', 'expense', true, 1),
    (v_subscriptions, 'Spotify / Apple Music', 'sub-music', 'expense', true, 2),
    (v_subscriptions, 'ITV / Netflix', 'sub-video', 'expense', true, 3),
    (v_subscriptions, 'Sport zal', 'sub-gym', 'expense', true, 4),
    (v_subscriptions, 'Cloud', 'sub-cloud', 'expense', true, 5),
    (v_subscriptions, 'Software', 'sub-software', 'expense', true, 6),
    (v_subscriptions, 'Gaming', 'sub-gaming', 'expense', true, 7),
    (v_subscriptions, 'Boshqa', 'sub-other', 'expense', true, 8);

  -- 11. Sayohat
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Sayohat', 'travel', '✈️', 'expense', true, 11)
    returning id into v_travel;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_travel, 'Poyezd bileti', 'travel-train-ticket', 'expense', true, 1),
    (v_travel, 'Aviachipta', 'travel-flight-ticket', 'expense', true, 2),
    (v_travel, 'Avtobus bileti', 'travel-bus-ticket', 'expense', true, 3),
    (v_travel, 'Hostel', 'travel-hostel', 'expense', true, 4),
    (v_travel, 'Mehmonxona', 'travel-hotel', 'expense', true, 5),
    (v_travel, 'Bagaj', 'travel-baggage', 'expense', true, 6),
    (v_travel, 'Transfer', 'travel-transfer', 'expense', true, 7),
    (v_travel, 'Sayohat ovqati', 'travel-food', 'expense', true, 8),
    (v_travel, 'Sayohat tadbiri', 'travel-activity', 'expense', true, 9),
    (v_travel, 'Boshqa', 'travel-other', 'expense', true, 10);

  -- 12. Sovg'a va yaqinlarga
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Sovg''a va yaqinlarga', 'gifts', '🎁', 'expense', true, 12)
    returning id into v_gifts;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_gifts, 'Tug''ilgan kun sovg''asi', 'gift-birthday', 'expense', true, 1),
    (v_gifts, 'Bayram sovg''asi', 'gift-holiday', 'expense', true, 2),
    (v_gifts, 'Gul', 'gift-flowers', 'expense', true, 3),
    (v_gifts, 'Oila', 'gift-family', 'expense', true, 4),
    (v_gifts, 'Do''st', 'gift-friend', 'expense', true, 5),
    (v_gifts, 'Xayriya / Ehson', 'gift-charity', 'expense', true, 6),
    (v_gifts, 'Boshqa', 'gift-other', 'expense', true, 7);

  -- 13. Moliyaviy operatsiyalar (transfer-type category tree)
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Moliyaviy operatsiyalar', 'finance-ops', '💳', 'transfer', true, 13)
    returning id into v_finance;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_finance, 'Qarz berish', 'finance-loan-given', 'transfer', true, 1),
    (v_finance, 'Qarz qaytarib olish', 'finance-loan-collected', 'transfer', true, 2),
    (v_finance, 'Qarz olish', 'finance-debt-taken', 'transfer', true, 3),
    (v_finance, 'Qarz qaytarish', 'finance-debt-repaid', 'transfer', true, 4),
    (v_finance, 'Kredit to''lovi', 'finance-credit-payment', 'transfer', true, 5),
    (v_finance, 'Bank komissiyasi', 'finance-bank-fee', 'transfer', true, 6),
    (v_finance, 'Pul o''tkazmasi', 'finance-transfer', 'transfer', true, 7),
    (v_finance, 'Valyuta almashtirish', 'finance-currency-exchange', 'transfer', true, 8),
    (v_finance, 'Boshqa', 'finance-other', 'transfer', true, 9);

  -- 14. Uy-ro'zg'or va xaridlar
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Uy-ro''zg''or va xaridlar', 'household', '🛒', 'expense', true, 14)
    returning id into v_household;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_household, 'Idish yuvish vositalari', 'house-dishwashing', 'expense', true, 1),
    (v_household, 'Tozalash vositalari', 'house-cleaning-supplies', 'expense', true, 2),
    (v_household, 'Gigiyena vositalari', 'house-hygiene', 'expense', true, 3),
    (v_household, 'Kir yuvish vositalari', 'house-laundry', 'expense', true, 4),
    (v_household, 'Tualet vositalari', 'house-toilet-supplies', 'expense', true, 5),
    (v_household, 'Jihoz', 'house-appliance', 'expense', true, 6),
    (v_household, 'Oshxona buyumlari', 'house-kitchenware', 'expense', true, 7),
    (v_household, 'Boshqa', 'house-other', 'expense', true, 8);

  -- 15. Shaxsiy parvarish
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Shaxsiy parvarish', 'personal-care', '🧴', 'expense', true, 15)
    returning id into v_personal_care;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_personal_care, 'Shampun', 'care-shampoo', 'expense', true, 1),
    (v_personal_care, 'Sovun', 'care-soap', 'expense', true, 2),
    (v_personal_care, 'Tish pastasi', 'care-toothpaste', 'expense', true, 3),
    (v_personal_care, 'Tish cho''tkasi', 'care-toothbrush', 'expense', true, 4),
    (v_personal_care, 'Dezodorant', 'care-deodorant', 'expense', true, 5),
    (v_personal_care, 'Parfyum', 'care-perfume', 'expense', true, 6),
    (v_personal_care, 'Krem', 'care-cream', 'expense', true, 7),
    (v_personal_care, 'Soch parvarishi', 'care-hair-care', 'expense', true, 8),
    (v_personal_care, 'Soch oldirish', 'care-haircut', 'expense', true, 9),
    (v_personal_care, 'Sartarosh', 'care-barber', 'expense', true, 10),
    (v_personal_care, 'Boshqa', 'care-other', 'expense', true, 11);

  -- 16. Sport
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Sport', 'sport', '🏋️', 'expense', true, 16)
    returning id into v_sport;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_sport, 'Sport zal', 'sport-gym', 'expense', true, 1),
    (v_sport, 'Futbol', 'sport-football', 'expense', true, 2),
    (v_sport, 'Tennis', 'sport-tennis', 'expense', true, 3),
    (v_sport, 'Suzish', 'sport-swimming', 'expense', true, 4),
    (v_sport, 'Basketbol', 'sport-basketball', 'expense', true, 5),
    (v_sport, 'Sport inventari', 'sport-equipment', 'expense', true, 6),
    (v_sport, 'Sport kiyimi', 'sport-clothing', 'expense', true, 7),
    (v_sport, 'Trener', 'sport-coach', 'expense', true, 8),
    (v_sport, 'Turnir', 'sport-tournament', 'expense', true, 9),
    (v_sport, 'Boshqa', 'sport-other', 'expense', true, 10);

  -- 17. Hujjat va davlat xizmatlari
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Hujjat va davlat xizmatlari', 'documents', '🧾', 'expense', true, 17)
    returning id into v_documents;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_documents, 'Pasport', 'doc-passport', 'expense', true, 1),
    (v_documents, 'ID karta', 'doc-id-card', 'expense', true, 2),
    (v_documents, 'Foto', 'doc-photo', 'expense', true, 3),
    (v_documents, 'Print', 'doc-print', 'expense', true, 4),
    (v_documents, 'Skan', 'doc-scan', 'expense', true, 5),
    (v_documents, 'Kserokopiya', 'doc-photocopy', 'expense', true, 6),
    (v_documents, 'Notarius', 'doc-notary', 'expense', true, 7),
    (v_documents, 'Davlat boji', 'doc-state-fee', 'expense', true, 8),
    (v_documents, 'Visa', 'doc-visa', 'expense', true, 9),
    (v_documents, 'Jarima', 'doc-fine', 'expense', true, 10),
    (v_documents, 'Boshqa', 'doc-other', 'expense', true, 11);

  -- 18. Boshqa
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Boshqa', 'other', '❓', 'expense', true, 18)
    returning id into v_other;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_other, 'Boshqa', 'other-misc', 'expense', true, 1),
    (v_other, 'Aniqlanmagan', 'other-unspecified', 'expense', true, 2);

  -- Daromadlar (income categories)
  insert into public.categories (name, slug, icon, type, is_default, sort_order)
    values ('Daromad', 'income', '💰', 'income', true, 19)
    returning id into v_income;
  insert into public.categories (parent_id, name, slug, type, is_default, sort_order) values
    (v_income, 'Oylik', 'income-salary', 'income', true, 1),
    (v_income, 'Stipendiya', 'income-scholarship-stipend', 'income', true, 2),
    (v_income, 'Freelance', 'income-freelance', 'income', true, 3),
    (v_income, 'Part-time', 'income-part-time', 'income', true, 4),
    (v_income, 'Bonus', 'income-bonus', 'income', true, 5),
    (v_income, 'Mukofot', 'income-award', 'income', true, 6),
    (v_income, 'Biznes', 'income-business', 'income', true, 7),
    (v_income, 'Investitsiya', 'income-investment', 'income', true, 8),
    (v_income, 'Foiz', 'income-interest', 'income', true, 9),
    (v_income, 'Ota-onadan pul', 'income-from-parents', 'income', true, 10),
    (v_income, 'Grant', 'income-grant', 'income', true, 11),
    (v_income, 'Scholarship', 'income-scholarship', 'income', true, 12),
    (v_income, 'Sovg''a sifatida pul', 'income-gift-money', 'income', true, 13),
    (v_income, 'Qarz qaytarilishi', 'income-debt-returned', 'income', true, 14),
    (v_income, 'Boshqa daromad', 'income-other', 'income', true, 15);
end $$;
