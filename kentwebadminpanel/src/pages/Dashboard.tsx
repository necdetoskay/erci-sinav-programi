import React from 'react';
import { Typography, Grid, Paper, Card, CardContent, Button } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
                    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Kent Konut Yönetim Paneli
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText' 
            }}
          >
            <Typography variant="h6" component="div">
              Tamamlanan Projeler
            </Typography>
            <Typography variant="h3" component="div" sx={{ my: 2 }}>
              0
            </Typography>
            <Button 
              size="small" 
              sx={{ alignSelf: 'flex-start', color: 'primary.contrastText' }}
            >
              Detayları Görüntüle
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText'
            }}
          >
            <Typography variant="h6" component="div">
              Devam Eden Projeler
            </Typography>
            <Typography variant="h3" component="div" sx={{ my: 2 }}>
              0
            </Typography>
            <Button 
              size="small" 
              sx={{ alignSelf: 'flex-start', color: 'secondary.contrastText' }}
            >
              Detayları Görüntüle
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: 'info.main',
              color: 'info.contrastText'
            }}
          >
            <Typography variant="h6" component="div">
              Mutlu Müşteriler
            </Typography>
            <Typography variant="h3" component="div" sx={{ my: 2 }}>
              0
            </Typography>
            <Button 
              size="small" 
              sx={{ alignSelf: 'flex-start', color: 'info.contrastText' }}
            >
              Referansları Görüntüle
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="h6" component="div" sx={{ mb: 2, p: 1, borderBottom: '1px solid #eee' }}>
          Son Haberler
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">
                  Yeni Proje Lansmanı
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  2 gün önce
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">
                  Yeni Konut Projeleri
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  1 hafta önce
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Dashboard; 