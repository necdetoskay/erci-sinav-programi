import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Alert,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link,
  MobileStepper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PreviewIcon from '@mui/icons-material/Preview';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import SwipeableViews from 'react-swipeable-views';
import { autoPlay } from 'react-swipeable-views-utils';

import {
  getBannerGroup,
  getBanners,
  deleteBanner,
  reorderBanners
} from '../../services/bannerService';
import { BannerGroup, Banner } from '../../types/banner.types';
import { BannerImageEditor } from '../../components/banner/BannerImageEditor';

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

// Define possible API response types
interface ApiResponse {
  data?: Banner[];
  items?: Banner[];
  banners?: Banner[];
  results?: Banner[];
  [key: string]: any;
}

const BannerGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<BannerGroup | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [groupPreviewDialogOpen, setGroupPreviewDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Helper function to extract banner array from API response
  const extractBannersFromResponse = (response: any): Banner[] => {
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object') {
      // Cast to ApiResponse to access potential properties
      const apiResponse = response as ApiResponse;
      
      if (Array.isArray(apiResponse.data)) {
        return apiResponse.data;
      } else if (Array.isArray(apiResponse.items)) {
        return apiResponse.items;
      } else if (Array.isArray(apiResponse.banners)) {
        return apiResponse.banners;
      } else if (Array.isArray(apiResponse.results)) {
        return apiResponse.results;
      }
    }
    
    // Default to empty array if we can't find banners
    console.error('Banners data is not in expected format:', response);
    return [];
  };

  useEffect(() => {
    if (groupId) {
      console.log('Banner Group Detail - Loading group:', groupId);
      loadGroupData(groupId);
    } else {
      console.error('Banner Group Detail - No groupId provided in URL');
      setSnackbar({
        open: true,
        message: 'Banner grup ID parametresi eksik.',
        severity: 'error'
      });
    }
  }, [groupId]);

  const loadGroupData = async (id: string) => {
    setLoading(true);
    try {
      console.log('Fetching banner group:', id);
      
      // Group details
      const groupData = await getBannerGroup(id);
      console.log('Received group data:', groupData);
      setGroup(groupData);
      
      // Banner list
      console.log('Fetching banners for group:', id);
      const bannersData = await getBanners(id);
      console.log('Received banners data:', bannersData);
      
      // Extract banners array using helper function
      setBanners(extractBannersFromResponse(bannersData));
    } catch (error) {
      console.error('Error loading group data:', error);
      
      // Log API errors more thoroughly
      if (axios.isAxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      
      setSnackbar({
        open: true,
        message: 'Grup bilgileri yüklenirken bir hata oluştu.',
        severity: 'error'
      });
      
      // Always use mock data in development for testing
      console.log('Using mock data for testing');
      setGroup({
        id,
        name: 'Ana Sayfa Sliderları',
        description: 'Web sitesi ana sayfasında görünen banner sliderları',
        defaultDimensions: {
          width: 1920,
          height: 1080,
          aspectRatio: '16:9'
        },
        defaultSettings: {
          animationType: 'fade',
          backgroundColor: 'transparent',
          progressBar: {
            show: true,
            position: 'bottom',
            style: 'linear',
            color: 'primary',
            thickness: 3
          }
        },
        bannersCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
        
      setBanners([
        {
          id: '1',
          groupId: id,
          imageUrl: 'https://via.placeholder.com/1920x1080',
          targetUrl: 'https://example.com/promo1',
          order: 0,
          startDate: new Date().toISOString(),
          endDate: null,
          isActive: true,
          metadata: {
            animationType: 'fade',
            backgroundColor: 'transparent',
            altText: 'Promosyon Banner 1',
            seo: {
              title: 'Özel Fırsat',
              description: 'Sınırlı süreli fırsatlar'
            },
            dimensions: {
              width: 1920,
              height: 1080,
              aspectRatio: '16:9'
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          groupId: id,
          imageUrl: 'https://via.placeholder.com/1920x1080/0000FF/FFFFFF',
          targetUrl: 'https://example.com/promo2',
          order: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          isActive: true,
          metadata: {
            animationType: 'slide',
            backgroundColor: '#0000FF',
            altText: 'Promosyon Banner 2',
            seo: {
              title: 'Yeni Ürünler',
              description: 'Yeni gelen ürünlerimiz'
            },
            dimensions: {
              width: 1920,
              height: 1080,
              aspectRatio: '16:9'
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBannerDialog = (banner?: Banner) => {
    if (banner) {
      setSelectedBanner(banner);
    } else {
      setSelectedBanner(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBanner(null);
  };

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Bu bannerı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteBanner(id);
        setSnackbar({
          open: true,
          message: 'Banner başarıyla silindi.',
          severity: 'success'
        });
        if (groupId) {
          const bannersData = await getBanners(groupId);
          setBanners(extractBannersFromResponse(bannersData));
        }
      } catch (error) {
        console.error('Error deleting banner:', error);
        setSnackbar({
          open: true,
          message: 'Banner silinirken bir hata oluştu.',
          severity: 'error'
        });
      }
    }
  };

  const handleReorderBanner = async (bannerId: string, newOrder: number) => {
    try {
      const currentIndex = banners.findIndex(b => b.id === bannerId);
      if (currentIndex === -1 || newOrder < 0 || newOrder >= banners.length) {
        return;
      }

      // Create a new array with reordered banners
      const reorderedBanners = [...banners]
        .filter(b => b.id !== bannerId) // Remove the banner we're moving
        .sort((a, b) => a.order - b.order); // Sort by order
      
      // Insert the banner at the new position
      reorderedBanners.splice(newOrder, 0, banners[currentIndex]);
      
      // Update orders
      const updatedBanners = reorderedBanners.map((banner, index) => ({
        ...banner,
        order: index
      }));
      
      // Update state
      setBanners(updatedBanners);
      
      // Send to server
      await reorderBanners(updatedBanners.map(b => b.id));
      
      setSnackbar({
        open: true,
        message: 'Banner sıralaması güncellendi.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error reordering banners:', error);
      setSnackbar({
        open: true,
        message: 'Banner sıralaması güncellenirken bir hata oluştu.',
        severity: 'error'
      });
      // Reload to get the original order
      if (groupId) {
        const bannersData = await getBanners(groupId);
        setBanners(extractBannersFromResponse(bannersData));
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (sourceIndex === targetIndex) return;
    
    // Get the banner that's being moved
    const movedBanner = banners[sourceIndex];
    
    // Call reorder with the bannerId and new position
    await handleReorderBanner(movedBanner.id, targetIndex);
  };

  const handlePreviewBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setPreviewDialogOpen(true);
  };

  const handleGroupPreview = () => {
    setActiveStep(0);
    setGroupPreviewDialogOpen(true);
  };

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep + 1) % banners.length);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => (prevActiveStep - 1 + banners.length) % banners.length);
  };

  const handleBackToGroups = () => {
    navigate('/admin/banner-groups');
  };

  const handleAddBanner = () => {
    navigate(`/admin/banner-group/${groupId}/add`);
  };

  const handleEditBanner = (banner: Banner) => {
    navigate(`/admin/banner-group/${groupId}/edit/${banner.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Banner grubu bulunamadı.</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToGroups}
          sx={{ mt: 2 }}
        >
          Gruplara Dön
        </Button>
      </Box>
    );
  }

  const sortedBanners = [...banners].sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackToGroups} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {group.name}
        </Typography>
      </Box>

      {/* Group Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Grup Bilgileri
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {group.description || 'Bu grup için açıklama bulunmuyor.'}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Oluşturulma:</strong> {group.createdAt ? format(new Date(group.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Son Güncelleme:</strong> {group.updatedAt ? format(new Date(group.updatedAt), 'dd.MM.yyyy HH:mm') : '-'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Banner Boyutları
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${group.defaultDimensions?.width || 0} x ${group.defaultDimensions?.height || 0}px`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`Oran: ${group.defaultDimensions?.aspectRatio || '16:9'}`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`Animasyon: ${group.defaultSettings?.animationType || 'fade'}`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/admin/banner-groups/edit/${group.id}`)}
                >
                  Grup Ayarlarını Düzenle
                </Button>
                {banners.length > 0 && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<SlowMotionVideoIcon />}
                    onClick={handleGroupPreview}
                  >
                    Grup Önizleme
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Banner List */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Bannerlar ({banners.length})
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleAddBanner}
        >
          Yeni Banner Ekle
        </Button>
      </Box>

      {banners.length === 0 ? (
        <Alert severity="info">
          Bu grupta henüz banner bulunmuyor. "Yeni Banner Ekle" butonu ile banner ekleyebilirsiniz.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px">Sıra</TableCell>
                <TableCell>Resim</TableCell>
                <TableCell>Hedef URL</TableCell>
                <TableCell>Tarih Aralığı</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBanners.map((banner, index) => (
                <TableRow 
                  key={banner.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  sx={{ 
                    cursor: 'grab',
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {banner.order}
                      <Box sx={{ ml: 1 }}>
                        <IconButton 
                          size="small" 
                          disabled={index === 0}
                          onClick={() => handleReorderBanner(banner.id, index - 1)}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          disabled={index === banners.length - 1}
                          onClick={() => handleReorderBanner(banner.id, index + 1)}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      component="img"
                      src={banner.imageUrl}
                      alt={banner.metadata?.altText || `Banner ${index + 1}`}
                      sx={{ 
                        width: 120, 
                        height: 67, // 16:9 for 120px width
                        objectFit: 'cover',
                        borderRadius: 1 
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={banner.targetUrl} target="_blank">
                      {banner.targetUrl}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(banner.startDate), 'dd/MM/yyyy')}
                    {' - '}
                    {banner.endDate 
                      ? format(parseISO(banner.endDate), 'dd/MM/yyyy') 
                      : 'Süresiz'}
                  </TableCell>
                  <TableCell>
                    {banner.isActive ? (
                      <Chip 
                        label="Aktif" 
                        color="success" 
                        size="small"
                        variant="filled"
                      />
                    ) : (
                      <Chip 
                        label="Pasif" 
                        color="default" 
                        size="small"
                        variant="filled"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handlePreviewBanner(banner)}
                      title="Önizleme"
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleEditBanner(banner)}
                      title="Düzenle"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteBanner(banner.id)}
                      title="Sil"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Single Banner Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Banner Önizleme
        </DialogTitle>
        <DialogContent>
          {selectedBanner && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <img 
                  src={selectedBanner.imageUrl} 
                  alt={selectedBanner.metadata?.altText || 'Banner'} 
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Hedef URL:</Typography>
                  <Link href={selectedBanner.targetUrl} target="_blank">
                    {selectedBanner.targetUrl}
                  </Link>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Durum:</Typography>
                  <Typography>
                    {selectedBanner.isActive ? 'Aktif' : 'Pasif'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Tarih Aralığı:</Typography>
                  <Typography>
                    {format(parseISO(selectedBanner.startDate), 'dd/MM/yyyy')}
                    {' - '}
                    {selectedBanner.endDate 
                      ? format(parseISO(selectedBanner.endDate), 'dd/MM/yyyy') 
                      : 'Süresiz'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Boyutlar:</Typography>
                  <Typography>
                    {selectedBanner.metadata?.dimensions?.width}x{selectedBanner.metadata?.dimensions?.height}px
                    ({selectedBanner.metadata?.dimensions?.aspectRatio})
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Kapat
          </Button>
          {selectedBanner && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setPreviewDialogOpen(false);
                handleEditBanner(selectedBanner);
              }}
            >
              Düzenle
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Banner Group Preview Dialog */}
      <Dialog
        open={groupPreviewDialogOpen}
        onClose={() => setGroupPreviewDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Banner Grup Önizleme: {group.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {sortedBanners.length > 0 && (
              <>
                <Box 
                  sx={{ 
                    backgroundColor: group.defaultSettings?.backgroundColor || 'transparent', 
                    width: '100%',
                    borderRadius: 1
                  }}
                >
                  <AutoPlaySwipeableViews
                    axis="x"
                    index={activeStep}
                    onChangeIndex={handleStepChange}
                    enableMouseEvents
                    interval={5000}
                  >
                    {sortedBanners.map((banner, index) => (
                      <Box key={banner.id} sx={{ position: 'relative', display: 'block', overflow: 'hidden' }}>
                        <Box
                          component={Link}
                          href={banner.targetUrl}
                          target="_blank"
                          sx={{ 
                            display: 'block',
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                        >
                          <Box
                            component="img"
                            src={banner.imageUrl}
                            alt={banner.metadata?.altText || `Banner ${index + 1}`}
                            sx={{
                              height: 'auto',
                              width: '100%',
                              display: 'block',
                              maxHeight: '70vh',
                              objectFit: 'contain',
                              margin: '0 auto'
                            }}
                          />
                          {banner.metadata?.altText && (
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                width: '100%', 
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                padding: 1
                              }}
                            >
                              <Typography variant="caption">
                                {banner.metadata.altText}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </AutoPlaySwipeableViews>

                  {group.defaultSettings?.progressBar?.show && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: `${group.defaultSettings.progressBar.thickness || 3}px`,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(activeStep + 1) * (100 / sortedBanners.length)}%`,
                          height: '100%',
                          backgroundColor: group.defaultSettings.progressBar.color === 'primary' ? 'primary.main' : 'secondary.main',
                          transition: 'width 0.5s'
                        }}
                      />
                    </Box>
                  )}

                  <MobileStepper
                    steps={sortedBanners.length}
                    position="static"
                    activeStep={activeStep}
                    nextButton={
                      <Button
                        size="small"
                        onClick={handleNext}
                      >
                        İleri
                        <KeyboardArrowRight />
                      </Button>
                    }
                    backButton={
                      <Button
                        size="small"
                        onClick={handleBack}
                      >
                        <KeyboardArrowLeft />
                        Geri
                      </Button>
                    }
                  />
                </Box>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Banner Bilgileri
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Hedef URL:</Typography>
                      <Link href={sortedBanners[activeStep].targetUrl} target="_blank">
                        {sortedBanners[activeStep].targetUrl}
                      </Link>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Durum:</Typography>
                      <Typography>
                        {sortedBanners[activeStep].isActive ? 'Aktif' : 'Pasif'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Tarih Aralığı:</Typography>
                      <Typography>
                        {format(parseISO(sortedBanners[activeStep].startDate), 'dd/MM/yyyy')}
                        {' - '}
                        {sortedBanners[activeStep].endDate 
                          ? format(parseISO(sortedBanners[activeStep].endDate), 'dd/MM/yyyy') 
                          : 'Süresiz'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Sıra:</Typography>
                      <Typography>
                        {activeStep + 1} / {sortedBanners.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupPreviewDialogOpen(false)}>
            Kapat
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setGroupPreviewDialogOpen(false);
              handleEditBanner(sortedBanners[activeStep]);
            }}
          >
            Bu Bannerı Düzenle
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BannerGroupDetailPage; 