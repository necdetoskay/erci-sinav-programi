import { NextResponse } from 'next/server';
import { updateSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma'; // Import prisma

export async function GET() {
  try {
    // Fetch the settings record (assuming there's only one)
    const settings = await prisma.setting.findFirst();

    if (!settings) {
      return NextResponse.json({ message: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      applicationTitle,
      defaultLanguage,
      timeZone,
      defaultExamDuration,
      defaultPassingScore,
      enableQuestionRandomization,
      showCorrectAnswersAfterExam,
      allowNewUserRegistration,
      requireAdminApprovalForNewUsers,
      defaultUserRole,
      minimumPasswordLength,
      requireSpecialCharactersInPasswords,
      sessionTimeoutDuration,
      openRouterApiKey,
      openRouterModelName,
      groqApiKey,
      groqModelName,
      faviconUrl, // Extract faviconUrl
      // Extract new AI settings fields
      aiApiKey,
      aiModels,
    } = await request.json();

    const settingsToUpdate = {
      applicationTitle,
      defaultLanguage,
      timeZone,
      defaultExamDuration,
      defaultPassingScore,
      enableQuestionRandomization,
      showCorrectAnswersAfterExam,
      allowNewUserRegistration,
      requireAdminApprovalForNewUsers,
      defaultUserRole,
      minimumPasswordLength,
      requireSpecialCharactersInPasswords,
      sessionTimeoutDuration,
      faviconUrl, // Include faviconUrl in the update object
      // Include new AI settings in the update object
      aiApiKey,
      aiModels,
      // Remove old AI settings from the update object
      // openRouterApiKey,
      // openRouterModelName,
      // groqApiKey,
      // groqModelName,
    };

    await updateSettings(settingsToUpdate);
    return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
