import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('=== KHỞI ĐỘNG KỊCH BẢN KIỂM THỬ TỰ ĐỘNG FRONTEND ===');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Thiết lập khung nhìn màn hình máy tính chuẩn
  await page.setViewport({ width: 1440, height: 900 });

  const browserErrors = [];
  const browserLogs = [];

  // Lắng nghe các lỗi JS Uncaught phát sinh trên trình duyệt
  page.on('pageerror', (err) => {
    console.error('🚨 [LỖI JS TRÌNH DUYỆT]:', err.toString());
    browserErrors.push(err.toString());
  });

  // Lắng nghe các console log (Warning/Error/Log)
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    // Bỏ qua các log thông thường của Vite HMR để tránh rác log
    if (text.includes('[vite]') || text.includes('Vite hot reload')) return;
    
    if (type === 'error') {
      console.error(`❌ [Console Error]: ${text}`);
      browserErrors.push(text);
    } else if (type === 'warning') {
      console.warn(`⚠️ [Console Warning]: ${text}`);
    } else {
      console.log(`💬 [Console Log]: ${text}`);
    }
    browserLogs.push({ type, text });
  });

  try {
    const url = 'http://localhost:5173';
    console.log(`Navigating to Frontend dev server: ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 1. Chờ màn hình WelcomeScreen xuất hiện và click nút "Bắt đầu trải nghiệm"
    console.log('Waiting for WelcomeScreen button...');
    await page.waitForSelector('button.btn-welcome-start', { timeout: 10000 });
    console.log('Clicking "Bắt đầu trải nghiệm" button...');
    await page.click('button.btn-welcome-start');
    
    // Chờ animation chuyển cảnh kết thúc
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Chờ trang chủ load và chụp ảnh màn hình trang chủ
    await page.waitForSelector('.chat-workspace', { timeout: 10000 });
    console.log('✔ Trang chủ tải thành công. Chụp ảnh màn hình trang chủ...');
    await page.screenshot({ path: 'screenshot_1_home.png' });

    // 2. Kiểm thử nhập câu hỏi và click gửi chat
    console.log('Giả lập nhập câu hỏi chat...');
    const chatInputSelector = 'textarea.chat-textarea-control';
    await page.waitForSelector(chatInputSelector);
    await page.focus(chatInputSelector);
    
    const questionText = 'Quy trình vận hành eKYC tại SHB được phê duyệt bởi ai?';
    await page.keyboard.type(questionText);
    
    console.log('Bấm nút gửi câu hỏi (Submit Chat)...');
    const sendButtonSelector = 'button.btn-chat-send-submit';
    await page.waitForSelector(sendButtonSelector);
    await page.click(sendButtonSelector);

    // Chờ 6 giây để stream phản hồi từ Llama-3.3-70B thật trả về đầy đủ
    console.log('Đang chờ RAG Chatbot stream câu trả lời...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('Chụp ảnh màn hình cuộc hội thoại sau phản hồi...');
    await page.screenshot({ path: 'screenshot_2_chat_response.png' });

    // 3. Kiểm thử click mở dropdown chọn model
    console.log('Click mở dropdown chọn mô hình AI (Model Selector)...');
    const modelSelectorSelector = 'button.btn-chat-model-selector-trigger';
    await page.waitForSelector(modelSelectorSelector);
    await page.click(modelSelectorSelector);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Chụp ảnh màn hình dropdown chọn model...');
    await page.screenshot({ path: 'screenshot_3_model_selector.png' });

    // Đóng dropdown
    await page.click(modelSelectorSelector);

    // 4. Kiểm thử chuyển sang tab Khám phá đồ thị (Graph Tab)
    console.log('Giả lập click chuyển sang Tab Đồ thị Tri thức...');
    // Tìm button trong Sidebar nav menu chứa chữ hoặc icon thứ 2 (Khám phá Đồ thị)
    const navItems = await page.$$('.nav-menu-item');
    if (navItems.length >= 2) {
      await navItems[1].click(); // Click nút thứ hai (tab graph)
      console.log('Chờ đồ thị React Flow kết xuất...');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      console.log('Chụp ảnh màn hình Đồ thị Tri thức...');
      await page.screenshot({ path: 'screenshot_4_graph_workspace.png' });
    } else {
      console.warn('Không tìm thấy nút menu Đồ thị trong Sidebar.');
    }

    console.log('=== KẾT THÚC KỊCH BẢN KIỂM THỬ UI ===');
  } catch (error) {
    console.error('🚨 Kịch bản test gặp lỗi nghiêm trọng:', error);
    browserErrors.push(error.toString());
  } finally {
    await browser.close();
  }

  // Tổng hợp báo cáo kiểm thử
  console.log('\n================ BÁO CÁO KIỂM THỬ FRONTEND ================');
  console.log(`- Tổng số console log thu được: ${browserLogs.length}`);
  console.log(`- Tổng số lỗi Javascript phát hiện: ${browserErrors.length}`);
  
  if (browserErrors.length > 0) {
    console.error('\n❌ PHÁT HIỆN LỖI JS/CONSOLE TRONG QUÁ TRÌNH KIỂM THỬ:');
    browserErrors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`);
    });
    process.exit(1);
  } else {
    console.log('\n✔ THÀNH CÔNG: Frontend hoạt động HOÀN HẢO sạch lỗi 100%! Không phát hiện lỗi console hay JS crash.');
    process.exit(0);
  }
})();
