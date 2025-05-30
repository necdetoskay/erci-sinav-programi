// Yapay zeka provider tipi
export interface Provider {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  createdAt?: Date;
  updatedAt?: Date;
  models?: Model[];
}

// Yapay zeka model tipi
export interface Model {
  id: string;
  name: string;
  details: string;
  apiCode: string; // API kodu (microsoft/phi-4-reasoning-plus:free gibi)
  orderIndex: number; // Tabloda gösterim sırası
  isEnabled: boolean; // Etkinleştirme/devre dışı bırakma durumu
  providerId: string;
  provider?: Provider;
  createdAt?: Date;
  updatedAt?: Date;
}
