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
  Slider
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
} from '@mui/icons-material';
import { Banner } from '../../components/banner/BannerSlider';
import { 
  getAllBanners, 
  createBanner, 
  updateBanner, 
  deleteBanner,
  createBannerWithImage,
  updateBannerWithImage,
} from '../../services/banner.service';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BannerSlider from '../../components/banner/BannerSlider';
import BannerPreview from '../../components/banner/BannerPreview';

const BannerManagementPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [showPreview, setShowPreview] = useState(false);

  // Banner verilerini yükle
  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Bannerları yüklerken hata:', error);
      enqueueSnackbar('Bannerlar yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Dialog işlemleri
  const handleOpenDialog = (mode: 'create' | 'edit', banner?: Banner) => {
    setDialogMode(mode);
    setCurrentBanner(mode === 'create' ? {
      isActive: true,
      order: banners.length,
      metadata: {
        animationType: 'fade',
        backgroundColor: '#000000',
        altText: '',
        seo: {
          title: '',
          description: ''
        },
        dimensions: {
          width: 0,
          height: 0,
          aspectRatio: '16:9'
        }
      }
    } : { ...banner });
    setOpenDialog(true);
    setFormErrors({});
    setImageFile(null);
    setImagePreview(mode === 'edit' && banner?.imageUrl ? banner.imageUrl : null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBanner({});
    setImageFile(null);
    setImagePreview(null);
  };

  // Dosya seçme
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageFile(file);
      
      // Önizleme oluştur
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Dosya seçme alanını aç
  const handleOpenFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Form alanlarını doğrulama
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

  // Form gönderme
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Resim yükleme varsa
      if (imageFile) {
        if (dialogMode === 'create') {
          await createBannerWithImage(currentBanner, imageFile);
          enqueueSnackbar('Banner ve resim başarıyla oluşturuldu', { variant: 'success' });
        } else {
          if (currentBanner.id) {
            await updateBannerWithImage(currentBanner.id, currentBanner, imageFile);
            enqueueSnackbar('Banner ve resim başarıyla güncellendi', { variant: 'success' });
          }
        }
      } else {
        // Sadece veri güncelleme
        if (dialogMode === 'create') {
          await createBanner(currentBanner);
          enqueueSnackbar('Banner başarıyla oluşturuldu', { variant: 'success' });
        } else {
          if (currentBanner.id) {
            await updateBanner(currentBanner.id, currentBanner);
            enqueueSnackbar('Banner başarıyla güncellendi', { variant: 'success' });
          }
        }
      }
      handleCloseDialog();
      loadBanners();
    } catch (error) {
      console.error('Banner kaydedilirken hata:', error);
      enqueueSnackbar('Banner kaydedilirken bir hata oluştu', { variant: 'error' });
    }
  };

  // Banner silme
  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Bu banner\'ı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteBanner(id);
        enqueueSnackbar('Banner başarıyla silindi', { variant: 'success' });
        loadBanners();
      } catch (error) {
        console.error('Banner silinirken hata:', error);
        enqueueSnackbar('Banner silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  // Banner sıralama
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
    
    // Swap orders
    const temp = updatedBanners[index].order;
    updatedBanners[index].order = updatedBanners[newIndex].order;
    updatedBanners[newIndex].order = temp;
    
    // Swap positions in array
    [updatedBanners[index], updatedBanners[newIndex]] = [updatedBanners[newIndex], updatedBanners[index]];
    
    setBanners(updatedBanners);
    
    try {
      // Update both banners in the database
      await updateBanner(updatedBanners[index].id, { order: updatedBanners[index].order });
      await updateBanner(updatedBanners[newIndex].id, { order: updatedBanners[newIndex].order });
      enqueueSnackbar('Banner sıralaması güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Banner sıralaması güncellenirken hata:', error);
      enqueueSnackbar('Sıralama güncellenirken bir hata oluştu', { variant: 'error' });
      loadBanners(); // Revert to original state
    }
  };

  // Form alanı değişikliği
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      
      if (subChild) {
        setCurrentBanner({
          ...currentBanner,
          [parent]: {
            ...currentBanner[parent as keyof typeof currentBanner],
            [child]: {
              ...(currentBanner[parent as keyof typeof currentBanner] as any)?.[child],
              [subChild]: value
            }
          }
        });
      } else {
        setCurrentBanner({
          ...currentBanner,
          [parent]: {
            ...currentBanner[parent as keyof typeof currentBanner],
            [child]: value
          }
        });
      }
    } else {
      setCurrentBanner({
        ...currentBanner,
        [field]: value
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Banner Yönetimi</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Yeni Banner Ekle
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<VisibilityIcon />}
          onClick={() => setShowPreview(true)}
          disabled={banners.length === 0}
        >
          Önizleme
        </Button>
      </Box>

      {loading ? (
        <Typography>Yükleniyor...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Görsel</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Sıra</TableCell>
                <TableCell>Başlangıç</TableCell>
                <TableCell>Bitiş</TableCell>
                <TableCell>Hedef URL</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <Box 
                      component="img" 
                      src={banner.imageUrl} 
                      alt={banner.metadata?.altText || 'Banner'}
                      sx={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={banner.isActive ? 'Aktif' : 'Pasif'} 
                      color={banner.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell>{new Date(banner.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'Süresiz'}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 150, 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {banner.targetUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleReorderBanner(banner.id, 'up')}
                        disabled={banners.indexOf(banner) === 0}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleReorderBanner(banner.id, 'down')}
                        disabled={banners.indexOf(banner) === banners.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Banner Ekleme/Düzenleme Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Yeni Banner Ekle' : 'Banner Düzenle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  height: 250,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5'
                }}
              >
                {imagePreview ? (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Banner önizleme"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <ImageIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={handleOpenFileSelect}
                  sx={{ mt: 2 }}
                >
                  Resim Yükle
                </Button>
                {formErrors.imageUrl && (
                  <FormHelperText error>{formErrors.imageUrl}</FormHelperText>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Hedef URL"
                    fullWidth
                    value={currentBanner.targetUrl || ''}
                    onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                    error={!!formErrors.targetUrl}
                    helperText={formErrors.targetUrl}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Başlangıç Tarihi"
                        value={currentBanner.startDate ? new Date(currentBanner.startDate) : new Date()}
                        onChange={(date) => handleInputChange('startDate', date)}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Bitiş Tarihi (Opsiyonel)"
                        value={currentBanner.endDate ? new Date(currentBanner.endDate) : null}
                        onChange={(date) => handleInputChange('endDate', date)}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sıra"
                    type="number"
                    fullWidth
                    value={currentBanner.order || 0}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value, 10))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentBanner.isActive === undefined ? true : currentBanner.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      />
                    }
                    label="Aktif"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Ek Bilgiler
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Alt Text"
                    fullWidth
                    value={currentBanner.metadata?.altText || ''}
                    onChange={(e) => handleInputChange('metadata.altText', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Animasyon Tipi</InputLabel>
                    <Select
                      value={currentBanner.metadata?.animationType || 'fade'}
                      onChange={(e) => handleInputChange('metadata.animationType', e.target.value)}
                      label="Animasyon Tipi"
                    >
                      <MenuItem value="fade">Fade</MenuItem>
                      <MenuItem value="slide">Slide</MenuItem>
                      <MenuItem value="zoom">Zoom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Arkaplan Rengi"
                    fullWidth
                    value={currentBanner.metadata?.backgroundColor || '#000000'}
                    onChange={(e) => handleInputChange('metadata.backgroundColor', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="SEO Başlık"
                    fullWidth
                    value={currentBanner.metadata?.seo?.title || ''}
                    onChange={(e) => handleInputChange('metadata.seo.title', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="SEO Açıklama"
                    fullWidth
                    value={currentBanner.metadata?.seo?.description || ''}
                    onChange={(e) => handleInputChange('metadata.seo.description', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Progress Bar Ayarları
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentBanner.metadata?.progressBar?.show ?? true}
                        onChange={(e) =>
                          handleInputChange('metadata.progressBar.show', e.target.checked)
                        }
                      />
                    }
                    label="Progress Bar Göster"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Pozisyon</InputLabel>
                    <Select
                      value={currentBanner.metadata?.progressBar?.position ?? 'bottom'}
                      onChange={(e) =>
                        handleInputChange('metadata.progressBar.position', e.target.value)
                      }
                      label="Pozisyon"
                    >
                      <MenuItem value="top">Üst</MenuItem>
                      <MenuItem value="bottom">Alt</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Stil</InputLabel>
                    <Select
                      value={currentBanner.metadata?.progressBar?.style ?? 'linear'}
                      onChange={(e) =>
                        handleInputChange('metadata.progressBar.style', e.target.value)
                      }
                      label="Stil"
                    >
                      <MenuItem value="linear">Doğrusal</MenuItem>
                      <MenuItem value="circular">Dairesel</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Renk</InputLabel>
                    <Select
                      value={currentBanner.metadata?.progressBar?.color ?? 'primary'}
                      onChange={(e) =>
                        handleInputChange('metadata.progressBar.color', e.target.value)
                      }
                      label="Renk"
                    >
                      <MenuItem value="primary">Ana Renk</MenuItem>
                      <MenuItem value="secondary">İkincil Renk</MenuItem>
                      <MenuItem value="success">Başarı</MenuItem>
                      <MenuItem value="error">Hata</MenuItem>
                      <MenuItem value="info">Bilgi</MenuItem>
                      <MenuItem value="warning">Uyarı</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Kalınlık</Typography>
                  <Slider
                    value={currentBanner.metadata?.progressBar?.thickness ?? 4}
                    onChange={(_, value) =>
                      handleInputChange('metadata.progressBar.thickness', value)
                    }
                    min={2}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
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

      {/* Önizleme Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Banner Önizleme</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 500 }}>
            <BannerSlider banners={[currentBanner as Banner]} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
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