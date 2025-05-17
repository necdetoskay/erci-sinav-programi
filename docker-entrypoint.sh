#!/bin/bash
set -ex

# Log başlangıcı
echo "Starting docker-entrypoint.sh script..."

# Host IP adresini algılama
# Docker network gateway IP'sini kullanarak host IP'sine erişim
HOST_IP=$(ip route | grep default | awk '{print $3}')
echo "Detected Host IP: $HOST_IP"

# Eğer HOST_IP boşsa veya algılanamazsa, alternatif yöntem deneyin
if [ -z "$HOST_IP" ]; then
  echo "Could not detect Host IP using default method, trying alternative..."
  HOST_IP=$(ip route show | grep -E '(default|src)' | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1)
  echo "Alternative Host IP detection result: $HOST_IP"
fi

# Yine başarısız olursa, Docker DNS'i kullanın
if [ -z "$HOST_IP" ]; then
  echo "Still could not detect Host IP, using Docker host.docker.internal..."
  HOST_IP="host.docker.internal"
  echo "Using Docker DNS: $HOST_IP"
fi

# PUBLIC_SERVER_URL değişkenini kontrol et
if [ -z "$PUBLIC_SERVER_URL" ] || [[ "$PUBLIC_SERVER_URL" == *"localhost"* ]]; then
  # Port numarasını al (varsayılan: 3001)
  PORT=${APP_PORT:-3001}

  # Yeni PUBLIC_SERVER_URL oluştur
  export PUBLIC_SERVER_URL="http://$HOST_IP:$PORT"
  echo "Setting PUBLIC_SERVER_URL to: $PUBLIC_SERVER_URL"
else
  echo "Using provided PUBLIC_SERVER_URL: $PUBLIC_SERVER_URL"
fi

# NEXT_PUBLIC_APP_URL değişkenini ayarla (client tarafı için)
export NEXT_PUBLIC_APP_URL="$PUBLIC_SERVER_URL"
echo "Setting NEXT_PUBLIC_APP_URL to: $NEXT_PUBLIC_APP_URL"

# PUBLIC_SERVER_URL değerini veritabanına kaydet
echo "Saving PUBLIC_SERVER_URL to database..."
# Veritabanı bağlantısı kurulduktan sonra çalıştırılacak
save_public_server_url() {
  echo "Saving PUBLIC_SERVER_URL ($PUBLIC_SERVER_URL) to database..."
  # Prisma client ile GlobalSetting tablosuna kaydet
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    async function savePublicServerUrl() {
      try {
        await prisma.globalSetting.upsert({
          where: { key: 'PUBLIC_SERVER_URL' },
          update: { value: '$PUBLIC_SERVER_URL' },
          create: { key: 'PUBLIC_SERVER_URL', value: '$PUBLIC_SERVER_URL' }
        });
        console.log('PUBLIC_SERVER_URL saved to database successfully');
      } catch (error) {
        console.error('Error saving PUBLIC_SERVER_URL to database:', error);
      } finally {
        await prisma.$disconnect();
      }
    }

    savePublicServerUrl();
  "
}

# Veritabanı bağlantısı için bekleme
echo "Waiting for database to be ready..."

# PostgreSQL bağlantısını kontrol etme fonksiyonu
check_postgres() {
  echo "Checking PostgreSQL connection..."
  # DATABASE_URL'den host, port, user, password ve database bilgilerini çıkar
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/^postgresql:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/^postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:\([^\/]*\)\/.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/^postgresql:\/\/[^:]*:[^@]*@[^:]*:[^\/]*\/\([^?]*\).*/\1/p')

  if [ -n "$DB_USER" ] && [ -n "$DB_PASS" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
    echo "Trying to connect to PostgreSQL at $DB_HOST:$DB_PORT..."

    # PostgreSQL'e bağlanmayı dene
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
      echo "Successfully connected to PostgreSQL!"
      return 0
    else
      echo "Failed to connect to PostgreSQL. Retrying in 5 seconds..."
      return 1
    fi
  else
    echo "Could not parse DATABASE_URL. Using default wait method."
    sleep 5
    return 1
  fi
}

# PostgreSQL'in hazır olmasını bekle
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if check_postgres; then
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "WARNING: Maximum retry count reached. Proceeding anyway, but database might not be ready."
fi

# Prisma şemasını oluştur
echo "Running Prisma schema push..."
npx prisma db push --accept-data-loss

# Alternatif olarak migrate komutunu da çalıştırabiliriz
echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Prisma migrate failed, but we already pushed the schema, so continuing..."

# PUBLIC_SERVER_URL değerini veritabanına kaydet
save_public_server_url

# Admin kullanıcısı oluşturma script'ini çalıştırma
echo "Skipping admin user creation during build process..."
echo "Admin users should be created manually or during development with 'npm run predev'"

# Orijinal komutu çalıştır
echo "Starting application with command: $@"
exec "$@"
