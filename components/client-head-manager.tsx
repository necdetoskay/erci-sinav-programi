"use client";

import { useEffect } from 'react';
import { getSettings } from '@/lib/settings'; // Import getSettings (for type)

export function ClientHeadManager() {
  useEffect(() => {
    const fetchSettingsAndApply = async () => {
      try {
        const response = await fetch('/api/settings'); // Fetch settings client-side
        if (response.ok) {
          const data = await response.json();
          // Apply settings to document head
          if (data.applicationTitle) {
            document.title = data.applicationTitle;
          } else {
            document.title = 'Default Application Title'; // Fallback title
          }

          if (data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          } else {
            // Remove existing favicon if URL is empty
            const link = document.querySelector("link[rel~='icon']");
            if (link) {
              link.remove();
            }
          }

        } else {
          console.error('Failed to fetch settings in ClientHeadManager.');
          // Optionally set a default title or favicon on error
        }
      } catch (error) {
        console.error('Error fetching settings in ClientHeadManager:', error);
        // Optionally set a default title or favicon on error
      }
    };

    fetchSettingsAndApply();

  }, []); // Empty dependency array to run once on mount

  return null; // This component doesn't render any visible UI
}
