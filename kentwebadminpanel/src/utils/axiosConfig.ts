import axios from 'axios';

// API temel URL'sini ayarla
axios.defaults.baseURL = 'http://localhost:5000';

// Debug için axios isteklerini logla
axios.interceptors.request.use(request => {
  console.log('Gönderilen istek:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Alınan yanıt:', response);
    return response;
  },
  error => {
    console.error('Hata yanıtı:', error);
    return Promise.reject(error);
  }
);

export default axios; 