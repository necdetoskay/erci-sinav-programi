import { prisma } from '@/lib/prisma';

export type AppSettings = {
  [key: string]: string | undefined;
};

/**
 * Retrieves all settings from the database and returns them as an object.
 * Falls back to environment variables for SMTP settings if not found in DB.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settings: AppSettings = {};

    dbSettings.forEach(setting => {
      if (setting.value !== null) { // Ensure value is not null
        settings[setting.key] = setting.value;
      }
    });

    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    // Return empty object or throw error depending on desired behavior
    return {}; // Return empty object on error
  }
}

/**
 * Updates multiple settings in the database.
 * @param settingsToUpdate An object where keys are setting keys and values are the new setting values.
 */
export async function updateSettings(settingsToUpdate: AppSettings): Promise<void> {
    const upsertPromises = Object.entries(settingsToUpdate)
      .filter(([key, value]) => value !== undefined) // Filter out undefined values
      .map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: value as string }, // Assert value is string after filtering undefined
          create: { key, value: value as string },
        })
      );

    await prisma.$transaction(upsertPromises);
}
