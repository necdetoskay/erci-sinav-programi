import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

export type AppSettings = {
  [key: string]: string | undefined;
};

/**
 * Retrieves global settings from the database and returns them as an object.
 * Falls back to environment variables for SMTP settings if not found in DB.
 */
export async function getGlobalSettings(): Promise<AppSettings> {
  try {
    // Tüm global ayarları getir
    const dbSettings = await prisma.globalSetting.findMany();

    const settings: AppSettings = {};

    dbSettings.forEach(setting => {
      if (setting.value !== null) { // Ensure value is not null
        settings[setting.key] = setting.value;
      }
    });

    // Fallback to environment variables for essential SMTP settings if not in DB
    const smtpKeys: (keyof AppSettings)[] = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'EMAIL_FROM'];
    smtpKeys.forEach(key => {
        if (!settings[key]) {
            const envValue = process.env[key];
            if (envValue) {
                settings[key] = envValue;
            }
        }
    });

    return settings;
  } catch (error) {
    console.error("Error fetching global settings:", error);
    // Fallback to environment variables
    const settings: AppSettings = {};
    const smtpKeys: (keyof AppSettings)[] = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'EMAIL_FROM'];
    smtpKeys.forEach(key => {
        const envValue = process.env[key];
        if (envValue) {
            settings[key] = envValue;
        }
    });
    console.warn("Falling back to environment variables for SMTP settings due to database error.");
    return settings;
  }
}

/**
 * Retrieves user-specific settings from the database.
 * @param userId The ID of the user whose settings to retrieve.
 */
export async function getUserSettings(userId: string): Promise<AppSettings> {
  try {
    // Kullanıcıya özgü ayarları getir
    const userSettings = await prisma.userSetting.findMany({
      where: { userId }
    });

    const settings: AppSettings = {};

    userSettings.forEach(setting => {
      if (setting.value !== null) {
        settings[setting.key] = setting.value;
      }
    });

    return settings;
  } catch (error) {
    console.error(`Error fetching settings for user ${userId}:`, error);
    return {};
  }
}

/**
 * Retrieves combined settings (global + user-specific) for a user.
 * User settings override global settings with the same key.
 * @param userId The ID of the user whose settings to retrieve.
 */
export async function getSettings(userId?: string): Promise<AppSettings> {
  // Önce global ayarları al
  const globalSettings = await getGlobalSettings();
  console.log("Global settings:", globalSettings);

  // Eğer userId belirtilmişse, kullanıcı ayarlarını al ve global ayarları override et
  if (userId) {
    const userSettings = await getUserSettings(userId);
    console.log(`User settings for ${userId}:`, userSettings);

    // Global ayarları ve kullanıcı ayarlarını birleştir
    const combinedSettings = { ...globalSettings, ...userSettings };
    console.log(`Combined settings for ${userId}:`, combinedSettings);

    return combinedSettings;
  }

  // Sadece global ayarları döndür
  return globalSettings;
}

/**
 * Updates multiple global settings in the database.
 * @param settingsToUpdate An object where keys are setting keys and values are the new setting values.
 */
export async function updateGlobalSettings(settingsToUpdate: AppSettings): Promise<void> {
    const upsertPromises = Object.entries(settingsToUpdate)
      .filter(([key, value]) => value !== undefined) // Filter out undefined values
      .map(([key, value]) =>
        prisma.globalSetting.upsert({
          where: { key },
          update: { value: value as string }, // Assert value is string after filtering undefined
          create: {
            key,
            value: value as string
          },
        })
      );

    await prisma.$transaction(upsertPromises);
}

/**
 * Updates multiple user-specific settings in the database.
 * @param userId The ID of the user whose settings to update.
 * @param settingsToUpdate An object where keys are setting keys and values are the new setting values.
 */
export async function updateUserSettings(userId: string, settingsToUpdate: AppSettings): Promise<void> {
    const upsertPromises = Object.entries(settingsToUpdate)
      .filter(([key, value]) => value !== undefined) // Filter out undefined values
      .map(([key, value]) =>
        prisma.userSetting.upsert({
          where: {
            userId_key: {
              userId,
              key
            }
          },
          update: { value: value as string }, // Assert value is string after filtering undefined
          create: {
            userId,
            key,
            value: value as string
          },
        })
      );

    await prisma.$transaction(upsertPromises);
}

/**
 * Updates settings based on context (global or user-specific).
 * @param settingsToUpdate An object where keys are setting keys and values are the new setting values.
 * @param userId Optional user ID. If provided, updates user-specific settings.
 */
export async function updateSettings(settingsToUpdate: AppSettings, userId?: string): Promise<void> {
    if (userId) {
        await updateUserSettings(userId, settingsToUpdate);
    } else {
        await updateGlobalSettings(settingsToUpdate);
    }
}
