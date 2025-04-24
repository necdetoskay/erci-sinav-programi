import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { 
  getBannerGroups, 
  createBannerGroup, 
  updateBannerGroup, 
  deleteBannerGroup 
} from '../../services/bannerService';
import { 
  BannerGroup, 
  CreateBannerGroupRequest, 
  UpdateBannerGroupRequest,
  BannerProgressBarConfig,
  BannerDimensions
} from '../../types/banner.types';

type DialogMode = 'create' | 'edit';

const BannerGroupManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<BannerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [currentGroup, setCurrentGroup] = useState<CreateBannerGroupRequest | (UpdateBannerGroupRequest & { id: string })>({
    name: '',
    description: '',
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
    }
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await getBannerGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading banner groups:', error);
      setSnackbar({
        open: true,
        message: 'Banner grupları yüklenirken bir hata oluştu.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: DialogMode, group?: BannerGroup) => {
    setDialogMode(mode);
    if (mode === 'edit' && group) {
      const { id, ...groupData } = group;
      setCurrentGroup({ ...groupData, id });
    } else {
      setCurrentGroup({
        name: '',
        description: '',
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
        }
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    // Reset form
    setCurrentGroup({
      name: '',
      description: '',
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
      }
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentGroup.name) {
      errors.name = 'Grup adı zorunludur';
    }

    if (!currentGroup.defaultDimensions?.width) {
      errors['defaultDimensions.width'] = 'Genişlik zorunludur';
    }

    if (!currentGroup.defaultDimensions?.height) {
      errors['defaultDimensions.height'] = 'Yükseklik zorunludur';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setCurrentGroup(prev => {
      const newGroup = { ...prev };
      
      // Handle nested properties
      if (field.includes('.')) {
        const [parent, child, subChild] = field.split('.');
        if (subChild) {
          // For fields like defaultSettings.progressBar.show
          newGroup[parent] = {
            ...newGroup[parent],
            [child]: {
              ...newGroup[parent]?.[child],
              [subChild]: value
            }
          };
        } else {
          // For fields like defaultDimensions.width
          newGroup[parent] = {
            ...newGroup[parent],
            [child]: value
          };
        }
      } else {
        // Handle top level fields
        newGroup[field] = value;
      }
      
      return newGroup;
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (dialogMode === 'create') {
        await createBannerGroup(currentGroup as CreateBannerGroupRequest);
        setSnackbar({
          open: true,
          message: 'Banner grubu başarıyla oluşturuldu.',
          severity: 'success'
        });
      } else {
        if ('id' in currentGroup) {
          const { id, ...updateData } = currentGroup;
          await updateBannerGroup(id, updateData);
          setSnackbar({
            open: true,
            message: 'Banner grubu başarıyla güncellendi.',
            severity: 'success'
          });
        } else {
          throw new Error('Banner grubunun ID bilgisi bulunamadı.');
        }
      }
      handleCloseDialog();
      loadGroups();
    } catch (error) {
      console.error('Error saving banner group:', error);
      setSnackbar({
        open: true,
        message: 'Banner grubu kaydedilirken bir hata oluştu.',
        severity: 'error'
      });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm('Bu banner grubunu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteBannerGroup(id);
        setSnackbar({
          open: true,
          message: 'Banner grubu başarıyla silindi.',
          severity: 'success'
        });
        loadGroups();
      } catch (error) {
        console.error('Error deleting banner group:', error);
        setSnackbar({
          open: true,
          message: 'Banner grubu silinirken bir hata oluştu.',
          severity: 'error'
        });
      }
    }
  };

  const handleViewBanners = (groupId: string) => {
    navigate(`/admin/banners?groupId=${groupId}`);
  };

  // Calculate aspect ratio when width or height changes
  useEffect(() => {
    if (
      currentGroup.defaultDimensions?.width && 
      currentGroup.defaultDimensions?.height
    ) {
      const width = currentGroup.defaultDimensions.width;
      const height = currentGroup.defaultDimensions.height;
      const gcd = calculateGCD(width, height);
      const aspectRatio = `${width/gcd}:${height/gcd}`;
      
      handleInputChange('defaultDimensions.aspectRatio', aspectRatio);
    }
  }, [
    currentGroup.defaultDimensions?.width, 
    currentGroup.defaultDimensions?.height
  ]);

  // Calculate greatest common divisor for aspect ratio
  const calculateGCD = (a: number, b: number): number => {
    return b === 0 ? a : calculateGCD(b, a % b);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Banner Grupları</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Yeni Grup Ekle
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grup Adı</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Boyutlar</TableCell>
                <TableCell>Oran</TableCell>
                <TableCell>Banner Sayısı</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Henüz bir banner grubu oluşturulmamış.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description || '-'}</TableCell>
                    <TableCell>{`${group.defaultDimensions.width}x${group.defaultDimensions.height}px`}</TableCell>
                    <TableCell>{group.defaultDimensions.aspectRatio}</TableCell>
                    <TableCell>{group.bannersCount || 0}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleViewBanners(group.id)}
                        title="Bannerları Görüntüle"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleOpenDialog('edit', group)}
                        title="Düzenle"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Sil"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Yeni Banner Grubu Ekle' : 'Banner Grubu Düzenle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Grup Adı"
                fullWidth
                value={currentGroup.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Açıklama"
                fullWidth
                value={currentGroup.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Varsayılan Boyutlar
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Genişlik (px)"
                type="number"
                fullWidth
                value={currentGroup.defaultDimensions?.width || ''}
                onChange={(e) => handleInputChange('defaultDimensions.width', parseInt(e.target.value))}
                error={!!formErrors['defaultDimensions.width']}
                helperText={formErrors['defaultDimensions.width']}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Yükseklik (px)"
                type="number"
                fullWidth
                value={currentGroup.defaultDimensions?.height || ''}
                onChange={(e) => handleInputChange('defaultDimensions.height', parseInt(e.target.value))}
                error={!!formErrors['defaultDimensions.height']}
                helperText={formErrors['defaultDimensions.height']}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="En-Boy Oranı"
                fullWidth
                value={currentGroup.defaultDimensions?.aspectRatio || ''}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Varsayılan Ayarlar
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Animasyon Tipi</InputLabel>
                <Select
                  value={currentGroup.defaultSettings?.animationType || 'fade'}
                  onChange={(e) => handleInputChange('defaultSettings.animationType', e.target.value)}
                  label="Animasyon Tipi"
                >
                  <MenuItem value="fade">Fade</MenuItem>
                  <MenuItem value="slide">Slide</MenuItem>
                  <MenuItem value="zoom">Zoom</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Arka Plan Rengi"
                fullWidth
                value={currentGroup.defaultSettings?.backgroundColor || 'transparent'}
                onChange={(e) => handleInputChange('defaultSettings.backgroundColor', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                İlerleme Çubuğu Ayarları
              </Typography>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Göster</InputLabel>
                <Select
                  value={currentGroup.defaultSettings?.progressBar?.show ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('defaultSettings.progressBar.show', e.target.value === 'true')}
                  label="Göster"
                >
                  <MenuItem value="true">Evet</MenuItem>
                  <MenuItem value="false">Hayır</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Pozisyon</InputLabel>
                <Select
                  value={currentGroup.defaultSettings?.progressBar?.position || 'bottom'}
                  onChange={(e) => handleInputChange('defaultSettings.progressBar.position', e.target.value)}
                  label="Pozisyon"
                >
                  <MenuItem value="top">Üst</MenuItem>
                  <MenuItem value="bottom">Alt</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Stil</InputLabel>
                <Select
                  value={currentGroup.defaultSettings?.progressBar?.style || 'linear'}
                  onChange={(e) => handleInputChange('defaultSettings.progressBar.style', e.target.value)}
                  label="Stil"
                >
                  <MenuItem value="linear">Çizgisel</MenuItem>
                  <MenuItem value="circular">Dairesel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Renk</InputLabel>
                <Select
                  value={currentGroup.defaultSettings?.progressBar?.color || 'primary'}
                  onChange={(e) => handleInputChange('defaultSettings.progressBar.color', e.target.value)}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === 'create' ? 'Oluştur' : 'Güncelle'}
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

export default BannerGroupManagementPage; 