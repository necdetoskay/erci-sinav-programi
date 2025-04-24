export interface BannerDimensions {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface BannerSEO {
  title: string;
  description: string;
}

export interface BannerMetadata {
  animationType?: string;
  backgroundColor?: string;
  altText?: string;
  seo?: {
    title?: string;
    description?: string;
  };
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  progressBar?: {
    show: boolean;
    position: 'top' | 'bottom';
    style: 'linear' | 'circular';
    color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    thickness: number;
  };
}

export interface BannerGroup {
  id: string;
  name: string;
  description?: string;
  defaultDimensions: BannerDimensions;
  defaultSettings?: {
    animationType?: string;
    backgroundColor?: string;
    progressBar?: BannerProgressBarConfig;
  };
  bannersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBannerGroupRequest {
  name: string;
  description?: string;
  defaultDimensions: BannerDimensions;
  defaultSettings?: {
    animationType?: string;
    backgroundColor?: string;
    progressBar?: BannerProgressBarConfig;
  };
}

export interface UpdateBannerGroupRequest {
  name?: string;
  description?: string;
  defaultDimensions?: BannerDimensions;
  defaultSettings?: {
    animationType?: string;
    backgroundColor?: string;
    progressBar?: BannerProgressBarConfig;
  };
}

export interface Banner {
  id: string;
  groupId: string;
  imageUrl: string;
  order: number;
  startDate: string;
  endDate?: string | null;
  targetUrl: string;
  isActive: boolean;
  metadata?: BannerMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerClickStats {
  totalClicks: number;
  deviceBreakdown: {
    deviceType: string;
    count: number;
  }[];
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];
}

export interface CreateBannerRequest {
  groupId: string;
  imageUrl: string;
  order: number;
  startDate: string;
  endDate?: string | null;
  targetUrl: string;
  isActive: boolean;
  metadata?: BannerMetadata;
}

export interface UpdateBannerRequest {
  imageUrl?: string;
  order?: number;
  startDate?: string | Date;
  endDate?: string | Date | null;
  targetUrl?: string;
  isActive?: boolean;
  metadata?: Partial<BannerMetadata>;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    imageUrl: string;
    dimensions: BannerDimensions;
    processedImage: any;
  };
}

export interface BannerProgressBarConfig {
  show: boolean;
  position: 'top' | 'bottom';
  style: 'linear' | 'circular';
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  thickness: number;
} 