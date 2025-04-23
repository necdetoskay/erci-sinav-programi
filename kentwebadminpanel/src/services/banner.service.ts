import api from './api';
import axios from 'axios';
import { 
  Banner, 
  BannerClickStats, 
  CreateBannerRequest, 
  UpdateBannerRequest, 
  ImageUploadResponse 
} from '../types/banner.types';

const API_URL = '/banners';
const UPLOAD_URL = '/uploads/banners';

// Aktif bannerları getirme
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const response = await api.get(`${API_URL}/active`);
    return response.data.data;
  } catch (error) {
    console.error('Aktif bannerlar getirilirken hata:', error);
    return [];
  }
};

// Banner tıklama kaydı
export const trackBannerClick = async (bannerId: string): Promise<void> => {
  try {
    const referrer = document.referrer || window.location.href;
    await api.post(`${API_URL}/clicks/${bannerId}`, { referrer });
  } catch (error) {
    console.error('Banner tıklama kaydedilirken hata:', error);
    // Sessiz başarısızlık - kullanıcı deneyimini etkilemesini istemiyoruz
  }
};

// Admin: Tüm bannerları listeleme
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const response = await api.get(API_URL);
    return response.data.data;
  } catch (error) {
    console.error('Bannerlar getirilirken hata:', error);
    throw error;
  }
};

// Admin: Banner oluşturma
export const createBanner = async (bannerData: Partial<Banner>): Promise<Banner> => {
  try {
    const response = await api.post(API_URL, bannerData);
    return response.data.data;
  } catch (error) {
    console.error('Banner oluşturulurken hata:', error);
    throw error;
  }
};

// Admin: Banner resmi yükleme
export const uploadBannerImage = async (file: File): Promise<{imageUrl: string, dimensions: any}> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // FormData için özel bir header ayarı gerekebilir
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    // Doğrudan api yerine axios kullanalım çünkü FormData özel işlem gerektirebilir
    const response = await axios.post<ImageUploadResponse>(`/api${UPLOAD_URL}`, formData, { headers });
    
    return {
      imageUrl: response.data.data.imageUrl,
      dimensions: response.data.data.dimensions
    };
  } catch (error) {
    console.error('Banner resmi yüklenirken hata:', error);
    throw error;
  }
};

// Admin: Banner oluşturma ve resmi yükleme kombinasyonu
export const createBannerWithImage = async (bannerData: Partial<Banner>, imageFile: File): Promise<Banner> => {
  try {
    // Önce resmi yükle
    const uploadResponse = await uploadBannerImage(imageFile);
    
    // Sonra banner verisini güncelle ve kaydet
    const updatedBannerData: CreateBannerRequest = {
      ...bannerData,
      imageUrl: uploadResponse.imageUrl,
      metadata: {
        ...bannerData.metadata,
        dimensions: uploadResponse.dimensions
      }
    } as CreateBannerRequest;
    
    // Banner'ı oluştur
    const response = await api.post(API_URL, updatedBannerData);
    return response.data.data;
  } catch (error) {
    console.error('Banner ve resim yüklenirken hata:', error);
    throw error;
  }
};

// Admin: Banner güncelleme
export const updateBanner = async (id: string, bannerData: Partial<Banner>): Promise<Banner> => {
  try {
    const response = await api.put(`${API_URL}/${id}`, bannerData);
    return response.data.data;
  } catch (error) {
    console.error('Banner güncellenirken hata:', error);
    throw error;
  }
};

// Admin: Banner güncelleme ve resim yükleme
export const updateBannerWithImage = async (id: string, bannerData: Partial<Banner>, imageFile: File): Promise<Banner> => {
  try {
    // Önce resmi yükle
    const uploadResponse = await uploadBannerImage(imageFile);
    
    // Sonra banner verisini güncelle ve kaydet
    const updatedBannerData: UpdateBannerRequest = {
      ...bannerData,
      imageUrl: uploadResponse.imageUrl,
      metadata: {
        ...bannerData.metadata,
        dimensions: uploadResponse.dimensions
      }
    } as UpdateBannerRequest;
    
    // Banner'ı güncelle
    const response = await api.put(`${API_URL}/${id}`, updatedBannerData);
    return response.data.data;
  } catch (error) {
    console.error('Banner ve resim güncellenirken hata:', error);
    throw error;
  }
};

// Admin: Banner silme
export const deleteBanner = async (id: string): Promise<void> => {
  try {
    await api.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Banner silinirken hata:', error);
    throw error;
  }
};

// Admin: Banner istatistiklerini getirme
export const getBannerStats = async (
  bannerId?: string, 
  startDate?: string, 
  endDate?: string
): Promise<BannerClickStats> => {
  try {
    let url = `${API_URL}/stats`;
    const params: Record<string, string> = {};
    
    if (bannerId) params.bannerId = bannerId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(url, { params });
    return response.data.data;
  } catch (error) {
    console.error('Banner istatistikleri getirilirken hata:', error);
    throw error;
  }
}; 