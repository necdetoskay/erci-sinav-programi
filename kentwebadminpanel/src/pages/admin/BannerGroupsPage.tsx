import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { getBannerGroups, createBannerGroup, updateBannerGroup, deleteBannerGroup, loadBannerGroups } from '../../services/bannerService';
import { BannerGroup, CreateBannerGroupRequest, UpdateBannerGroupRequest } from '../../types/banner.types';

type DialogMode = 'create' | 'edit';

const BannerGroupsPage: React.FC = () => {
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
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [error, setError] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError(false);
    
    try {
      // Directly load banner groups from API
      const groups = await loadBannerGroups();
      setGroups(groups);
    } catch (error: any) {
      console.error('Error loading banner groups:', error);
      setSnackbar({
        open: true,
        message: error.response?.status === 404 
          ? 'Banner grupları API endpoint\'i bulunamadı.' 
          : 'Banner grupları yüklenirken bir hata oluştu.',
        severity: 'error'
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

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
      const newGroup = { ...prev } as any; // Use type assertion for flexible property access
      
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
      
      // Convert back to the original type
      return newGroup as typeof prev;
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

  const handleViewGroup = (groupId: string) => {
    navigate(`/admin/banner-group/${groupId}`);
  };

  const handleEditGroup = (group: BannerGroup) => {
    handleOpenDialog('edit', group);
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

  // Add a retry button and message when data loading fails
  const renderErrorState = () => {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {snackbar.message}
        </Alert>
        <Button 
          variant="contained" 
          onClick={loadGroups}
          startIcon={<RefreshIcon />}
        >
          Tekrar Dene
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 0, width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        mb: 2,
        pl: 2,
        pr: 2,
        pt: 2 
      }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Banner Grupları</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ alignSelf: 'flex-start' }}
        >
          Yeni Grup Ekle
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        renderErrorState()
      ) : groups.length === 0 ? (
        <Alert severity="info" sx={{ mx: 2 }}>
          Henüz banner grubu bulunmuyor. Yeni bir grup eklemek için "Yeni Grup Ekle" butonuna tıklayın.
        </Alert>
      ) : (
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ width: '100%', mb: 2, boxShadow: 'none', bgcolor: 'transparent' }}>
            <List sx={{ width: '100%', padding: 0, py: 2 }}>
              {groups.map((group, index) => (
                <React.Fragment key={group.id}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      px: 3,
                      transition: 'all 0.2s ease',
                      backgroundColor: 'white',
                      borderRadius: 1,
                      mb: 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      '&:hover': {
                        bgcolor: '#e3f2fd',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2.5
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewGroup(group.id)}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                        <IconButton 
                          size="medium" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewGroup(group.id);
                          }}
                          title="Görüntüle"
                          sx={{ color: 'primary.main' }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          size="medium" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          title="Düzenle"
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="medium" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          title="Sil"
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Box 
                      sx={{ 
                        display: 'flex',
                        width: '100%',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Thumbnail */}
                      <Paper
                        elevation={0}
                        sx={{ 
                          width: 100, 
                          height: 70, 
                          mr: 2, 
                          bgcolor: 'rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        <Box 
                          sx={{ 
                            bgcolor: group.defaultSettings?.backgroundColor || 'transparent',
                            border: '1px dashed rgba(0,0,0,0.2)',
                            width: '70%',
                            height: '70%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'text.secondary'
                          }}
                        >
                          {group.defaultDimensions?.width}x{group.defaultDimensions?.height}
                        </Box>
                      </Paper>

                      {/* Content */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                            {group.name}
                          </Typography>
                          <Chip 
                            label={`${group.bannersCount || 0} Banner`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label="Aktif" 
                            size="small" 
                            color="success"
                            variant="outlined"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {group.description || 'Bu grup için bir açıklama bulunmuyor.'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${group.defaultDimensions?.width}x${group.defaultDimensions?.height}`} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'background.paper', 
                              border: '1px solid rgba(0,0,0,0.1)',
                              height: 22,
                              '& .MuiChip-label': { px: 1, py: 0, fontSize: '0.7rem' }
                            }}
                          />
                          <Chip 
                            label={group.defaultSettings?.animationType || 'fade'} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'background.paper', 
                              border: '1px solid rgba(0,0,0,0.1)',
                              height: 22,
                              '& .MuiChip-label': { px: 1, py: 0, fontSize: '0.7rem' }
                            }}
                          />
                          {group.defaultSettings?.progressBar?.show && (
                            <Chip 
                              label="Progress Bar" 
                              size="small"
                              sx={{ 
                                bgcolor: 'background.paper', 
                                border: '1px solid rgba(0,0,0,0.1)',
                                height: 22,
                                '& .MuiChip-label': { px: 1, py: 0, fontSize: '0.7rem' }
                              }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            Son Güncelleme: {group.updatedAt ? format(new Date(group.updatedAt), 'dd.MM.yyyy HH:mm') : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
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

export default BannerGroupsPage; 