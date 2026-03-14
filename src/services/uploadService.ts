import axios from 'axios';

export interface UploadResult {
  url: string;
  filename: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('请先登录');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post('/api/uploads/image', formData, {
    headers: {
      Authorization: `Bearer ${token}`
      // 不设置 Content-Type，让 axios 自动设置 multipart boundary
    }
  });

  return response.data.data;
};
