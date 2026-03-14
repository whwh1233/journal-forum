import axios from 'axios';

// 文件上传直连后端，绕过 Vite 代理，避免系统代理干扰 multipart 请求
const UPLOAD_BASE = import.meta.env.DEV ? 'http://127.0.0.1:3001' : '';

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

  const response = await axios.post(`${UPLOAD_BASE}/api/uploads/image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.data;
};
