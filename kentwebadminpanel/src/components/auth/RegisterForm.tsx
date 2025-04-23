import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../../services/auth.service';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  Avatar,
  Grid,
  Alert,
  Link
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Form doğrulama şeması
const registerSchema = z.object({
  first_name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  last_name: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  password_confirm: z.string()
}).refine((data) => data.password === data.password_confirm, {
  message: "Şifreler eşleşmiyor",
  path: ["password_confirm"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirm: ''
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Use the register function from auth.service
      await apiRegister(data);
      
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Register error:', err);
      
      // Display friendly error message based on error status
      if (err.code === 'ERR_NETWORK') {
        setError('Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.');
      } else if (err.response?.status === 500) {
        setError('Sunucu hatası: Veritabanı bağlantısı sağlanamadı. Lütfen sistem yöneticinizle iletişime geçin.');
      } else if (err.response?.status === 400 && err.response?.data?.message?.includes('Email already in use')) {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.response?.data?.message) {
        setError(err.response?.data?.message);
      } else {
        setError('Kayıt yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          p: 4
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Hesap Oluştur
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                required
                fullWidth
                id="first_name"
                label="İsim"
                autoFocus
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
                {...register('first_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="last_name"
                label="Soyisim"
                autoComplete="family-name"
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
                {...register('last_name')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="E-posta Adresi"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="password"
                label="Şifre"
                type="password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="password_confirm"
                label="Şifre Tekrar"
                type="password"
                error={!!errors.password_confirm}
                helperText={errors.password_confirm?.message}
                {...register('password_confirm')}
              />
            </Grid>
          </Grid>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Zaten bir hesabınız var mı? Giriş yapın
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterForm; 