const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Branch = require('../src/models/Branch');

const updates = [
  { email: 'rani@gmail.com', newPass: 'ranimain', role: 'receptionist' },
  { email: 'priya@gmail.com', newPass: 'priyamain', role: 'nurse' },
  { email: 'kamal@gmail.com', newPass: 'kamalmain', role: 'billing_cashier' },
  { email: 'muskan@gmail.com', newPass: 'muskanmain', role: 'pharmacist' },
  { email: 'jk@gmail.com', newPass: 'jkmain', role: 'lab_tech' },
  { email: 'rohan@gmail.com', newPass: 'rohanmain', role: 'radiologist' },
  { email: 'pallavi@gmail.com', newPass: 'pallavimain', role: 'doctor' },
  { email: 'rajesh@gmail.com', newPass: 'rajeshmain', role: 'doctor' },
  { email: 'happysingh@gmail.com', newPass: 'happysingh', role: 'hospital_admin' },
  { email: 'ajay@gmail.com', newPass: 'ajay321', role: 'super_admin' }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const mainBranch = await Branch.findOne({ isMain: true });
  const tenant = mainBranch?.tenant;

  for (const item of updates) {
    let user = await User.findOne({ email: item.email });
    if (!user) {
      console.log(`User not found: ${item.email}`);
      continue;
    }

    user.password = item.newPass;
    if (!user.tenant && tenant) user.tenant = tenant;
    if (!user.branch && mainBranch) user.branch = mainBranch._id;

    await user.save();
    console.log(`Updated user ${user.name} (${item.email}) -> Password set to: "${item.newPass}"`);
  }

  // Verify passwords with matchPassword
  console.log('\n--- VERIFYING PASSWORDS ---');
  for (const item of updates) {
    const user = await User.findOne({ email: item.email }).select('+password');
    if (user) {
      const isMatch = await user.matchPassword(item.newPass);
      console.log(`Verify ${user.email} with "${item.newPass}": ${isMatch ? 'SUCCESS (MATCH)' : 'FAILED'}`);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
