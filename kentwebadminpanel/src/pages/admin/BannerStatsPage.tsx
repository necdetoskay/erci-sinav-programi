import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Banner } from '../../components/banner/BannerSlider';
import { getAllBanners, getBannerStats } from '../../services/banner.service';
import { format, subDays } from 'date-fns';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface StatsData {
  totalClicks: number;
  deviceBreakdown: {
    deviceType: string;
    count: number;
  }[];
  hourlyDistribution: {
    hour: number;
    count: number;
  }[];
}

const BannerStatsPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Bannerları yükle
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await getAllBanners();
        setBanners(data);
      } catch (error) {
        console.error('Bannerları yüklerken hata:', error);
      }
    };

    loadBanners();
  }, []);

  // İstatistikleri getir
  const fetchStats = async () => {
    setLoading(true);
    try {
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      
      const data = await getBannerStats(
        selectedBannerId === 'all' ? undefined : selectedBannerId,
        formattedStartDate,
        formattedEndDate
      );
      
      setStatsData(data);
    } catch (error) {
      console.error('İstatistikleri yüklerken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Banner seçimini işle
  const handleBannerChange = (event: SelectChangeEvent) => {
    setSelectedBannerId(event.target.value);
  };

  // Grafik verileri
  const deviceChartData = {
    labels: statsData?.deviceBreakdown.map(item => 
      item.deviceType.charAt(0).toUpperCase() + item.deviceType.slice(1)) || [],
    datasets: [
      {
        label: 'Cihaz Dağılımı',
        data: statsData?.deviceBreakdown.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const hourlyChartData = {
    labels: statsData?.hourlyDistribution.map(item => `${item.hour}:00`) || [],
    datasets: [
      {
        label: 'Saatlik Tıklama Dağılımı',
        data: statsData?.hourlyDistribution.map(item => item.count) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Banner İstatistikleri
      </Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="banner-select-label">Banner</InputLabel>
              <Select
                labelId="banner-select-label"
                value={selectedBannerId}
                label="Banner"
                onChange={handleBannerChange}
              >
                <MenuItem value="all">Tüm Bannerlar</MenuItem>
                {banners.map((banner) => (
                  <MenuItem key={banner.id} value={banner.id}>
                    {banner.metadata?.altText || `Banner ${banner.order}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={startDate}
                onChange={(date) => setStartDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Bitiş Tarihi"
                value={endDate}
                onChange={(date) => setEndDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchStats}
              fullWidth
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'İstatistikleri Getir'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {statsData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Toplam Tıklama" />
              <CardContent>
                <Typography variant="h3" align="center">
                  {statsData.totalClicks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Saatlik Tıklama Dağılımı" />
              <CardContent>
                <Bar data={hourlyChartData} options={{ maintainAspectRatio: false }} height={300} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Cihaz Dağılımı" />
              <CardContent>
                <Pie data={deviceChartData} options={{ maintainAspectRatio: false }} height={300} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {!statsData && !loading && (
        <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body1">
            Filtreleri seçip "İstatistikleri Getir" butonuna tıklayarak banner istatistiklerini görüntüleyebilirsiniz.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BannerStatsPage; 