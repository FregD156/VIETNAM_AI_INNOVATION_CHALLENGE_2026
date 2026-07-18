const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Helper function to read mock data safely
const readMockFile = (filename) => {
  const filePath = path.join(__dirname, '../client/src/mocks', filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading mock file ${filename}:`, err);
    return null;
  }
};

// 1. GET /api/graph - Trả về cấu trúc đồ thị Neo4j thô
app.get('/api/graph', (req, res) => {
  const graphData = readMockFile('mockGraphData.json');
  if (graphData) {
    res.json(graphData);
  } else {
    res.status(500).json({ error: 'Cannot load graph data' });
  }
});

// 2. POST /api/chat - Cung cấp chatbot pháp quy có phân tích từ khóa
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const chatResponses = readMockFile('mockChatResponse.json');
  
  if (!chatResponses) {
    return res.status(500).json({ error: 'Cannot load chat responses' });
  }

  const query = (message || '').toLowerCase();
  let responseData = chatResponses[0]; // Mặc định là eKYC

  if (query.includes('hạn mức') || query.includes('vay') || query.includes('tín chấp') || query.includes('online')) {
    responseData = chatResponses[1]; // Vay online hạn mức xung đột
  } else if (query.includes('sổ tiết kiệm') || query.includes('tiền gửi') || query.includes('tất toán') || query.includes('gửi tiết kiệm')) {
    responseData = chatResponses[2]; // Tất toán sổ tiết kiệm
  }

  // Giả lập độ trễ xử lý mạng nhẹ
  setTimeout(() => {
    res.json(responseData);
  }, 800);
});

// 3. POST /api/admin/upload - Mô phỏng tải văn bản PDF lên hệ thống RAG
app.post('/api/admin/upload', (req, res) => {
  const diffData = readMockFile('mockDiffData.json');
  
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Tài liệu đã được tải lên và trích xuất vector thành công',
      preview: diffData
    });
  }, 1500);
});

// 4. POST /api/admin/crm-sync - Mô phỏng đồng bộ CRM
app.post('/api/admin/crm-sync', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      status: 'synced',
      syncTime: new Date().toISOString(),
      crmRecordId: `crm_rec_${Math.floor(Math.random() * 100000)}`
    });
  }, 1000);
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SHB Graph-RAG Backend Server is running!`);
  console.log(`🔗 Local API Base URL:  http://localhost:${PORT}/api`);
  console.log(`🔗 Production Domain:   https://api.compliance.shb.com.vn/api`);
  console.log(`=======================================================`);
});
