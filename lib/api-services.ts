// API servis fonksiyonları

// AI Provider API servisleri
export const providerService = {
  // Tüm provider'ları getir
  getAll: async () => {
    const response = await fetch('/api/ai-providers');
    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }
    return response.json();
  },

  // Belirli bir provider'ı getir
  getById: async (id: string) => {
    const response = await fetch(`/api/ai-providers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider');
    }
    return response.json();
  },

  // Yeni provider ekle
  create: async (data: { name: string; description?: string; apiKey: string }) => {
    const response = await fetch('/api/ai-providers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create provider');
    }

    return response.json();
  },

  // Provider güncelle
  update: async (id: string, data: { name?: string; description?: string; apiKey?: string }) => {
    const response = await fetch(`/api/ai-providers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update provider');
    }

    return response.json();
  },

  // Provider sil
  delete: async (id: string) => {
    const response = await fetch(`/api/ai-providers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete provider');
    }

    return response.json();
  },
};

// AI Model API servisleri
export const modelService = {
  // Tüm modelleri getir (opsiyonel providerId ile filtreleme)
  getAll: async (providerId?: string) => {
    const url = providerId
      ? `/api/ai-models?providerId=${providerId}`
      : '/api/ai-models';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    return response.json();
  },

  // Belirli bir modeli getir
  getById: async (id: string) => {
    const response = await fetch(`/api/ai-models/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch model');
    }
    return response.json();
  },

  // Yeni model ekle
  create: async (data: {
    name: string;
    details?: string;
    codeName: string;
    providerId: string;
    orderIndex?: number;
    isEnabled?: boolean;
  }) => {
    const response = await fetch('/api/ai-models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create model');
    }

    return response.json();
  },

  // Model güncelle
  update: async (id: string, data: {
    name?: string;
    details?: string;
    codeName?: string;
    providerId?: string;
    orderIndex?: number;
    isEnabled?: boolean;
  }) => {
    const response = await fetch(`/api/ai-models/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update model');
    }

    return response.json();
  },

  // Model sil
  delete: async (id: string) => {
    const response = await fetch(`/api/ai-models/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete model');
    }

    return response.json();
  },
};
