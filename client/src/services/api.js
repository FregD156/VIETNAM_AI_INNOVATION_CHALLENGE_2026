/**
 * api.js
 * Wrapper fetch dùng chung cho toàn bộ dự án
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://api.compliance.shb.com.vn');

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `API error with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  get: async (endpoint, headers = {}) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      return await handleResponse(response);
    } catch (error) {
      console.error(`GET request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint, body, headers = {}) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error(`POST request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  upload: async (endpoint, file, onProgress, headers = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Lưu ý: Đối với uploading có progress bar, fetch thông thường không hỗ trợ trực tiếp.
      // Dưới đây là cách triển khai sử dụng XMLHttpRequest để hỗ trợ track progress.
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}${endpoint}`);

        // Set headers
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });

        // Track upload progress
        if (xhr.upload && onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      console.error(`Upload request failed for ${endpoint}:`, error);
      throw error;
    }
  }
};
