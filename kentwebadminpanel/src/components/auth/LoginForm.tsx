import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../services/auth.service';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container,
  FormControlLabel,
  Checkbox,
  Avatar,
  Alert,
  Link,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Form doğrulama şeması
const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  rememberMe: z.boolean().optional()
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
      rememberMe: !!localStorage.getItem('rememberedEmail')
    },
  });
  
  // Kimlik doğrulama durumu değiştiğinde dashboard'a yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Remember me seçeneği işaretliyse email'i kaydet
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Real API login instead of mock
      const response = await apiLogin({
        email: data.email,
        password: data.password
      });
      
      // On successful login, update context with token and user data
      login(response.accessToken, response.refreshToken, {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role
      });
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Display friendly error message based on error status
      if (err.code === 'ERR_NETWORK') {
        setError(
          <span>
            Sunucu bağlantısı kurulamadı. Lütfen şunları kontrol edin:
            <ul>
              <li>API sunucusu çalışıyor mu (port 5000)?</li>
              <li>Vite sunucusu çalışıyor mu (port 5173 veya 5174)?</li>
              <li>Vite.config.ts dosyasında proxy ayarları doğru mu?</li>
            </ul>
          </span>
        );
      } else if (err.response?.status === 500) {
        setError('Sunucu hatası: Veritabanı bağlantısı sağlanamadı. Lütfen sistem yöneticinizle iletişime geçin.');
      } else if (err.response?.status === 401) {
        setError('Kullanıcı adı veya şifre hatalı.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Kent Konut Admin Panel
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresi"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox 
                color="primary" 
                {...register('rememberMe')}
                onChange={(e) => setValue('rememberMe', e.target.checked)}
              />
            }
            label="Beni hatırla"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
          
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Şifrenizi mi unuttunuz?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Hesabınız yok mu? Kayıt olun"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginForm; 