import mongoose from 'mongoose';
import { User } from '../shared/mongoose-schema.js';

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/loco_payroll';

mongoose.connect(mongoUrl).then(async () => {
  console.log('Connected to MongoDB');
  
  // Find emp User
  const empUser = await User.findOne({ username: 'emp' });
  if (empUser) {
    console.log('emp User found:');
    console.log('Username:', empUser.username);
    console.log('Name:', empUser.name);
    console.log('_id:', empUser._id.toString());
  } else {
    console.log('emp User not found');
  }
  
  // Also check emp3
  const emp3User = await User.findOne({ username: 'emp3' });
  if (emp3User) {
    console.log('\nemp3 User found:');
    console.log('Username:', emp3User.username);
    console.log('Name:', emp3User.name);
    console.log('_id:', emp3User._id.toString());
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
