import fs from 'fs';

async function test() {
  // 1. Login
  const loginRes = await fetch('http://localhost:5005/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adminboutique@onoot.com', password: 'admin1234' }),
  });
  console.log('Login status:', loginRes.status);
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Got token:', token ? 'YES' : 'NO');

  // 2. Create a dummy video file
  const dummyVideo = Buffer.from('FAKE_MP4_HEADER_DATA_1234567890');
  const blob = new Blob([dummyVideo], { type: 'video/mp4' });
  const formData = new FormData();
  formData.append('file', blob, 'sample_test_video.mp4');

  // 3. Upload to /api/admin/upload
  const uploadRes = await fetch('http://localhost:5005/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  console.log('Upload status:', uploadRes.status);
  const text = await uploadRes.text();
  console.log('Upload response:', text);
}

test().catch(console.error);
