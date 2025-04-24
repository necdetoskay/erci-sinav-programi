import React, { useState } from 'react';
import {
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  Grid,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Banner } from '../../types/banner.types';

interface BannerFormProps {
  banner?: Partial<Banner>;
  onChange?: (banner: Partial<Banner>) => void;
}

export const BannerForm: React.FC<BannerFormProps> = ({ banner = {}, onChange }) => {
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>(banner);

  const handleInputChange = (field: string, value: any) => {
    const newBanner = { ...currentBanner };
    const fields = field.split('.');
    let current: any = newBanner;

    for (let i = 0; i < fields.length - 1; i++) {
      if (!current[fields[i]]) {
        current[fields[i]] = {};
      }
      current = current[fields[i]];
    }

    current[fields[fields.length - 1]] = value;
    setCurrentBanner(newBanner);
    onChange?.(newBanner);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Hedef URL"
          fullWidth
          value={currentBanner.targetUrl || ''}
          onChange={(e) => handleInputChange('targetUrl', e.target.value)}
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
  );
}; 