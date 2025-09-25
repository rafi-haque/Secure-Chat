const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./src/models/user');

// Import the UserService class directly
const UserServiceClass = require('./src/services/userService');

async function debugMethod() {
  // Setup in-memory MongoDB
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  try {
    console.log('UserServiceClass type:', typeof UserServiceClass);
    console.log('UserServiceClass constructor:', UserServiceClass.constructor.name);
    
    // Create user directly through User model
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
      publicKey: 'key'
    });
    await user.save();
    
    console.log('Created user directly:', {
      id: user._id,
      email: user.email,
      username: user.username,
      isActive: user.isActive
    });
    
    // Test individual methods
    console.log('\n--- Testing findUserByEmail ---');
    const foundByEmailMethod = await UserServiceClass.findUserByEmail('test@example.com');
    console.log('findUserByEmail result:', foundByEmailMethod);
    
    console.log('\n--- Testing findByEmail ---');
    const foundByDirectMethod = await UserServiceClass.findByEmail('test@example.com');
    console.log('findByEmail result:', foundByDirectMethod);
    
    console.log('\n--- Testing updateUserStatus ---');
    const updated = await UserServiceClass.updateUserStatus(user._id, false);
    console.log('updateUserStatus result:', {
      id: updated._id,
      isActive: updated.isActive,
      lastSeen: updated.lastSeen
    });
    
    // Verify the update persisted
    const userAfterUpdate = await User.findById(user._id);
    console.log('User from DB after update:', {
      id: userAfterUpdate._id,
      isActive: userAfterUpdate.isActive
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    await mongoServer.stop();
  }
}

debugMethod().catch(console.error);