"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const SettingsPage = () => {
  const [emailServer, setEmailServer] = useState('');
  const [emailPort, setEmailPort] = useState('');
  const [emailUsername, setEmailUsername] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      SMTP_HOST: emailServer,
      SMTP_PORT: emailPort,
      SMTP_USER: emailUsername,
      SMTP_PASS: emailPassword,
      EMAIL_FROM: emailFrom,
    };
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        console.log('Settings saved successfully!');
        // TODO: Add user feedback (e.g., a toast notification)
      } else {
        console.error('Failed to save settings.');
        // TODO: Add user feedback for error
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Add user feedback for error
    }
  };

  const handleSendTestEmail = async () => {
    const settings = {
      SMTP_HOST: emailServer,
      SMTP_PORT: emailPort,
      SMTP_USER: emailUsername,
      SMTP_PASS: emailPassword,
      EMAIL_FROM: emailFrom,
    };

    try {
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        console.log('Test email sent successfully!');
        // TODO: Add user feedback (e.g., a toast notification)
      } else {
        const errorData = await response.json();
        console.error('Failed to send test email:', errorData.error);
        // TODO: Add user feedback for error
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      // TODO: Add user feedback for error
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Email Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="emailServer">Email Server</Label>
          <Input id="emailServer" type="text" placeholder="smtp.example.com" value={emailServer} onChange={(e) => setEmailServer(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="emailPort">Email Port</Label>
          <Input id="emailPort" type="number" placeholder="587" value={emailPort} onChange={(e) => setEmailPort(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="emailUsername">Email Username</Label>
          <Input id="emailUsername" type="text" placeholder="username@example.com" value={emailUsername} onChange={(e) => setEmailUsername(e.target.value)} />
        </div>
        <div className="relative">
          <Label htmlFor="emailPassword">Email Password</Label>
          <Input id="emailPassword" type={showPassword ? "text" : "password"} placeholder="Password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-3 mt-6 text-sm leading-5"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div>
          <Label htmlFor="emailFrom">Email From Address</Label>
          <Input id="emailFrom" type="email" placeholder="noreply@example.com" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} />
        </div>
        <Button type="submit">Save Changes</Button>
        <Button type="button" onClick={handleSendTestEmail}>Send Test Email</Button>
      </form>
    </div>
  );
};

export default SettingsPage;
