import { NextResponse } from 'next/server';
import { updateSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const settingsToUpdate = await request.json();
    await updateSettings(settingsToUpdate);
    return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
