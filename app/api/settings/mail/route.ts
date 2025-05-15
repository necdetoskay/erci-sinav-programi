import { NextResponse } from 'next/server';
import { updateSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const settingsToUpdate = await request.json();
    
    // Validate required fields
    if (!settingsToUpdate.SMTP_HOST) {
      return NextResponse.json({ message: 'SMTP host is required' }, { status: 400 });
    }
    
    if (!settingsToUpdate.SMTP_PORT) {
      return NextResponse.json({ message: 'SMTP port is required' }, { status: 400 });
    }
    
    if (!settingsToUpdate.EMAIL_FROM) {
      return NextResponse.json({ message: 'Sender email is required' }, { status: 400 });
    }
    
    // If auth is enabled, validate auth fields
    if (settingsToUpdate.SMTP_AUTH_ENABLED === 'true') {
      if (!settingsToUpdate.SMTP_USER) {
        return NextResponse.json({ message: 'SMTP username is required when auth is enabled' }, { status: 400 });
      }
      
      if (!settingsToUpdate.SMTP_PASS) {
        return NextResponse.json({ message: 'SMTP password is required when auth is enabled' }, { status: 400 });
      }
    }
    
    await updateSettings(settingsToUpdate);
    return NextResponse.json({ message: 'Mail settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating mail settings:', error);
    return NextResponse.json({ message: 'Error updating mail settings' }, { status: 500 });
  }
}
