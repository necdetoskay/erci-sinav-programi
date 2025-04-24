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
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PreviewIcon from '@mui/icons-material/Preview';
import { format, parseISO } from 'date-fns';

import {
  getBannerGroup,
  getBanners,
  deleteBanner,
  reorderBanners
} from '../../services/bannerService';
import { BannerGroup, Banner } from '../../types/banner.types';
import { BannerImageEditor } from '../../components/banner/BannerImageEditor';

const BannerGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<BannerGroup | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (groupId) {
      loadGroupData(groupId);
    }
  }, [groupId]);

  const loadGroupData = async (id: string) => {
    setLoading(true);
    try {
      // Group details
      const groupData = await getBannerGroup(id);
      setGroup(groupData);
      
      // Banner list
      const bannersData = await getBanners(id);
      setBanners(bannersData);
    } catch (error) {
      console.error('Error loading group data:', error);
      setSnackbar({
        open: true,
        message: 'Grup bilgileri yüklenirken bir hata oluştu.',
        severity: 'error'
      });
      
      // Mock data for testing when backend is not ready
      if (!group) {
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
      }
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
          setBanners(bannersData);
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
        setBanners(bannersData);
      }
    }
  };

  const handlePreviewBanner = (banner: Banner) => {
    setSelectedBanner(banner);
    setPreviewDialogOpen(true);
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
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/admin/banner-groups/edit/${group.id}`)}
                >
                  Grup Ayarlarını Düzenle
                </Button>
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
                <TableCell>Resim</TableCell>
                <TableCell>Hedef URL</TableCell>
                <TableCell>Tarih Aralığı</TableCell>
                <TableCell>Sıra</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {banners
                .sort((a, b) => a.order - b.order)
                .map((banner, index) => (
                  <TableRow key={banner.id}>
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

      {/* Banner Preview Dialog */}
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