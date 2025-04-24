import api from './api';
import { 
  Banner, 
  CreateBannerRequest, 
  UpdateBannerRequest, 
  BannerGroup,
  CreateBannerGroupRequest,
  UpdateBannerGroupRequest
} from '../types/banner.types';

// Banner ile ilgili işlemler
export const getBanners = async (groupId?: string): Promise<Banner[]> => {
  const url = groupId 
    ? `/banners?groupId=${groupId}` 
    : `/banners`;
  const response = await api.get(url);
  return response.data;
};

export const getBanner = async (id: string): Promise<Banner> => {
  const response = await api.get(`/banners/${id}`);
  return response.data;
};

export const createBanner = async (banner: CreateBannerRequest): Promise<Banner> => {
  const response = await api.post(`/banners`, banner);
  return response.data;
};

export const updateBanner = async (id: string, banner: UpdateBannerRequest): Promise<Banner> => {
  const response = await api.put(`/banners/${id}`, banner);
  return response.data;
};

export const deleteBanner = async (id: string): Promise<void> => {
  await api.delete(`/banners/${id}`);
};

export const uploadBannerImage = async (file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/banners/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const reorderBanners = async (bannerIds: string[]): Promise<void> => {
  await api.post(`/banners/reorder`, { bannerIds });
};

// Banner Grup işlemleri
export const getBannerGroups = async (): Promise<BannerGroup[]> => {
  const response = await api.get(`/banner-groups`);
  return response.data;
};

export const getBannerGroup = async (id: string): Promise<BannerGroup> => {
  const response = await api.get(`/banner-groups/${id}`);
  return response.data;
};

export const createBannerGroup = async (group: CreateBannerGroupRequest): Promise<BannerGroup> => {
  const response = await api.post(`/banner-groups`, group);
  return response.data;
};

export const updateBannerGroup = async (id: string, group: UpdateBannerGroupRequest): Promise<BannerGroup> => {
  const response = await api.put(`/banner-groups/${id}`, group);
  return response.data;
};

export const deleteBannerGroup = async (id: string): Promise<void> => {
  await api.delete(`/banner-groups/${id}`);
};

// Loads banner groups directly from API with no fallback
export const loadBannerGroups = async (): Promise<BannerGroup[]> => {
  const response = await api.get(`/banner-groups`);
  return response.data;
};

// Loads banners directly from API with no fallback
export const loadBanners = async (groupId?: string): Promise<Banner[]> => {
  const url = groupId ? `/banners?groupId=${groupId}` : `/banners`;
  const response = await api.get(url);
  return response.data;
}; 