import { connectDB } from './src/lib/mongoose.js';
import { Admin } from './src/models/Admin.js';

async function listAdmins() {
  await connectDB();
  const admins = await Admin.find({}).lean();
  console.log('Admins in DB:', admins);
  process.exit(0);
}

listAdmins();
