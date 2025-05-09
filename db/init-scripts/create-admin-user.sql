-- Admin kullanıcısı oluşturma script'i
-- Bu script, veritabanı container'ı başladığında çalıştırılır

-- Kullanıcı tablosunun varlığını kontrol et
DO $$
BEGIN
    -- Eğer "User" tablosu varsa
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
        -- Admin kullanıcısının varlığını kontrol et
        IF NOT EXISTS (SELECT FROM "User" WHERE email = 'admin@kentkonut.com.tr') THEN
            -- Admin kullanıcısını oluştur
            -- Not: Şifre hash'i bcrypt ile oluşturulmalıdır, bu yüzden uygulama tarafında işlenecek
            RAISE NOTICE 'Admin kullanıcısı mevcut değil. Uygulama tarafından oluşturulacak.';
        ELSE
            RAISE NOTICE 'Admin kullanıcısı zaten mevcut.';
        END IF;
    ELSE
        RAISE NOTICE 'User tablosu henüz oluşturulmamış. Prisma migrate sonrası admin kullanıcısı oluşturulacak.';
    END IF;
END
$$;
