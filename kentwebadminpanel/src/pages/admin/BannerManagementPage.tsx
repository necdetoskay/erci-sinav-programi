import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Snackbar,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Banner, CreateBannerRequest, UpdateBannerRequest, BannerGroup } from '../../types/banner.types';
import { 
  getBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner,
  uploadBannerImage,
  reorderBanners,
  getBannerGroups,
  getBannerGroup,
  loadBanners
} from '../../services/bannerService';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BannerSlider from '../../components/banner/BannerSlider';
import BannerPreview from '../../components/banner/BannerPreview';
import { BannerImageProcessor } from '../../components/banner/BannerImageProcessor';
import { BannerImageEditor } from '../../components/banner/BannerImageEditor';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import trLocale from 'date-fns/locale/tr';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

type DialogMode = 'create' | 'edit';

const BannerManagementPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupIdFromUrl = queryParams.get('groupId');
  const { isAuthenticated, logout } = useAuth();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [currentBanner, setCurrentBanner] = useState<CreateBannerRequest | (UpdateBannerRequest & { id: string })>({
    groupId: groupIdFromUrl || '',
    imageUrl: '',
    targetUrl: '',
    order: 0,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    isActive: true,
    metadata: {
      animationType: 'fade',
      backgroundColor: 'transparent',
      altText: '',
      seo: {
        title: '',
        description: '',
      },
      dimensions: {
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
      },
      progressBar: {
        show: true,
        position: 'bottom',
        style: 'linear',
        color: 'primary',
        thickness: 3,
      },
    },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [error, setError] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    setError(false);
    
    try {
      if (!isAuthenticated) {
        console.error('User is not authenticated');
        logout();
        navigate('/login');
        return;
      }
      
      const banners = await loadBanners(groupIdFromUrl || undefined);
      setBanners(banners);
    } catch (error: any) {
      console.error('Error loading banners:', error);
      
      if (error.response && error.response.status === 401) {
        setSnackbar({
          open: true,
          message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          severity: 'error'
        });
        logout();
        navigate('/login');
        return;
      }
      
      setSnackbar({
        open: true,
        message: error.response?.status === 404 
          ? 'Banner API endpoint\'i bulunamadı.' 
          : 'Bannerlar yüklenirken bir hata oluştu.',
        severity: 'error'
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    return () => {
      setCurrentBanner(undefined);
    };
  }, [groupIdFromUrl]);

  const handleOpenDialog = (mode: DialogMode, banner?: Banner) => {
    setDialogMode(mode);
    if (mode === 'edit' && banner) {
      const { id, ...bannerData } = banner;
      setCurrentBanner({ ...bannerData, id });
      setImagePreview(banner.imageUrl);
    } else {
      setCurrentBanner({
        groupId: groupIdFromUrl || '',
        imageUrl: '',
        targetUrl: '',
        order: banners.length,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
        metadata: {
          animationType: 'fade',
          backgroundColor: 'transparent',
          altText: '',
          seo: {
            title: '',
            description: '',
          },
          dimensions: {
            width: 1920,
            height: 1080,
            aspectRatio: '16:9',
          },
          progressBar: {
            show: true,
            position: 'bottom',
            style: 'linear',
            color: 'primary',
            thickness: 3,
          },
        },
      });
    }
    setImageFile(null);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBanner({
      groupId: groupIdFromUrl || '',
      imageUrl: '',
      targetUrl: '',
      order: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      isActive: true,
      metadata: {
        animationType: 'fade',
        backgroundColor: 'transparent',
        altText: '',
        seo: {
          title: '',
          description: '',
        },
        dimensions: {
          width: 1920,
          height: 1080,
          aspectRatio: '16:9',
        },
        progressBar: {
          show: true,
          position: 'bottom',
          style: 'linear',
          color: 'primary',
          thickness: 3,
        },
      },
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!imageFile && !currentBanner.imageUrl?.trim()) {
      errors.imageUrl = 'Banner resmi gereklidir';
    }
    
    if (!currentBanner.targetUrl?.trim()) {
      errors.targetUrl = 'Hedef URL gereklidir';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (dialogMode === 'create') {
        if (imageFile) {
          await createBanner(currentBanner as CreateBannerRequest);
        } else {
          await createBanner(currentBanner as CreateBannerRequest);
        }
        enqueueSnackbar('Banner başarıyla oluşturuldu', { variant: 'success' });
      } else {
        if ('id' in currentBanner) {
          const { id, ...updateData } = currentBanner;
          if (imageFile) {
            await updateBanner(id, updateData);
          } else {
            await updateBanner(id, updateData);
          }
          enqueueSnackbar('Banner başarıyla güncellendi', { variant: 'success' });
        } else {
          throw new Error('Banner ID is missing for update operation');
        }
      }
      
      await fetchBanners();
      handleCloseDialog();
    } catch (error) {
      console.error('Banner kaydedilirken hata:', error);
      enqueueSnackbar('Banner kaydedilirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
  };

  const handleProcessed = async (processedImages: {
    desktop: File;
    tablet: File;
    mobile: File;
  }) => {
    try {
      const uploadResponse = await uploadBannerImage(processedImages.desktop);
      
      setCurrentBanner(prev => ({
        ...prev,
        imageUrl: uploadResponse.imageUrl,
        metadata: {
          ...prev.metadata,
          dimensions: uploadResponse.dimensions
        }
      }));

      await Promise.all([
        uploadBannerImage(processedImages.tablet),
        uploadBannerImage(processedImages.mobile)
      ]);

      setIsProcessing(false);
      setSelectedFile(null);
      enqueueSnackbar('Resimler başarıyla yüklendi', { variant: 'success' });
    } catch (error) {
      console.error('Resimler yüklenirken hata:', error);
      enqueueSnackbar('Resimler yüklenirken bir hata oluştu', { variant: 'error' });
      setIsProcessing(false);
      setSelectedFile(null);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setCurrentBanner((prev) => {
      const newBanner = { ...prev };
      
      const fields = field.split('.');
      let current: any = newBanner;
      
      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) {
          current[fields[i]] = {};
        }
        current = current[fields[i]];
      }
      
      current[fields[fields.length - 1]] = value;
      return newBanner;
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Bu banner\'ı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteBanner(id);
        enqueueSnackbar('Banner başarıyla silindi', { variant: 'success' });
        fetchBanners();
      } catch (error) {
        console.error('Banner silinirken hata:', error);
        enqueueSnackbar('Banner silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const handleReorderBanner = async (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedBanners = [...banners];
    
    const temp = updatedBanners[index].order;
    updatedBanners[index].order = updatedBanners[newIndex].order;
    updatedBanners[newIndex].order = temp;
    
    [updatedBanners[index], updatedBanners[newIndex]] = [updatedBanners[newIndex], updatedBanners[index]];
    
    setBanners(updatedBanners);
    
    try {
      await updateBanner(updatedBanners[index].id, { order: updatedBanners[index].order });
      await updateBanner(updatedBanners[newIndex].id, { order: updatedBanners[newIndex].order });
      enqueueSnackbar('Banner sıralaması güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Banner sıralaması güncellenirken hata:', error);
      enqueueSnackbar('Sıralama güncellenirken bir hata oluştu', { variant: 'error' });
      fetchBanners();
    }
  };

  const handlePreviewOpen = () => {
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  const getPreviewBanner = (): Banner => {
    return {
      id: 'preview',
      imageUrl: currentBanner.imageUrl || '',
      order: currentBanner.order || 0,
      startDate: currentBanner.startDate || new Date().toISOString(),
      endDate: currentBanner.endDate || null,
      targetUrl: currentBanner.targetUrl || '',
      isActive: currentBanner.isActive === undefined ? true : currentBanner.isActive,
      metadata: {
        animationType: currentBanner.metadata?.animationType || 'fade',
        backgroundColor: currentBanner.metadata?.backgroundColor || 'transparent',
        altText: currentBanner.metadata?.altText || '',
        seo: {
          title: currentBanner.metadata?.seo?.title || '',
          description: currentBanner.metadata?.seo?.description || ''
        },
        dimensions: {
          width: currentBanner.metadata?.dimensions?.width || 1920,
          height: currentBanner.metadata?.dimensions?.height || 1080,
          aspectRatio: currentBanner.metadata?.dimensions?.aspectRatio || '16:9'
        },
        progressBar: {
          show: currentBanner.metadata?.progressBar?.show ?? true,
          position: (currentBanner.metadata?.progressBar?.position || 'bottom') as 'top' | 'bottom',
          style: (currentBanner.metadata?.progressBar?.style || 'linear') as 'linear' | 'circular',
          color: (currentBanner.metadata?.progressBar?.color || 'primary') as 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
          thickness: currentBanner.metadata?.progressBar?.thickness || 3
        }
      }
    };
  };

  const renderErrorState = () => {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {snackbar.message}
        </Alert>
        <Button 
          variant="contained" 
          onClick={fetchBanners}
          startIcon={<RefreshIcon />}
        >
          Tekrar Dene
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {groupIdFromUrl ? 'Grup Banner Yönetimi' : 'Banner Yönetimi'}
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            sx={{ mr: 1 }}
          >
            Yeni Banner Ekle
          </Button>
          {groupIdFromUrl && (
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/banner-groups')}
            >
              Gruplara Dön
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        renderErrorState()
      ) : banners.length === 0 ? (
        <Alert severity="info">
          Henüz banner bulunmuyor. Yeni bir banner eklemek için "Yeni Banner Ekle" butonuna tıklayın.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">Sıra</TableCell>
                <TableCell>Görsel</TableCell>
                <TableCell>Hedef URL</TableCell>
                <TableCell width="120">Başlangıç</TableCell>
                <TableCell width="120">Bitiş</TableCell>
                <TableCell width="80">Durum</TableCell>
                <TableCell width="120">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell>
                    <img 
                      src={banner.imageUrl} 
                      alt="Banner" 
                      style={{ width: '120px', height: '40px', objectFit: 'cover' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={banner.targetUrl} target="_blank" rel="noopener">
                      {banner.targetUrl}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(new Date(banner.startDate), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    {banner.endDate ? format(new Date(banner.endDate), 'dd.MM.yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={banner.isActive ? 'Aktif' : 'Pasif'} 
                      color={banner.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', banner)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteBanner(banner.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Yeni Banner Ekle' : 'Banner Düzenle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Banner Resmi
              </Typography>
              <BannerImageEditor
                banner={currentBanner}
                onImageChange={handleFileSelect}
                onCropChange={(crop) => {
                  setCurrentBanner(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      crop
                    }
                  }));
                }}
                onZoomChange={(zoom) => {
                  setCurrentBanner(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      zoom
                    }
                  }));
                }}
              />
              {formErrors.image && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formErrors.image}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Banner Bilgileri
              </Typography>
              
              <TextField
                label="Hedef URL"
                value={currentBanner.targetUrl || ''}
                onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                fullWidth
                placeholder="https://example.com/sayfa"
                sx={{ mb: 2 }}
                error={!!formErrors.targetUrl}
                helperText={formErrors.targetUrl}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            İptal
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={handlePreviewClose} maxWidth="lg" fullWidth>
        <DialogTitle>Banner Önizleme</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 500 }}>
            <BannerSlider banners={[getPreviewBanner()]} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewClose} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {showPreview && (
        <BannerPreview
          banners={banners.filter(banner => banner.isActive)}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Box>
  );
};

export default BannerManagementPage; 