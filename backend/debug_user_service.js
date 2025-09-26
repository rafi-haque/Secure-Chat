const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./src/models/user');

// Clear require cache to get fresh userService
delete require.cache[require.resolve('./src/services/userService')];
const userService = require('./src/services/userService');

async function debugUserService() {
  // Setup in-memory MongoDB
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  try {
    console.log('Testing user service...');
    
    // Test 1: Create and find user by email
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
      publicKey: 'key'
    };

    console.log('Creating user...');
    const createdUser = await userService.createUser(userData);
    console.log('Created user:', {
      id: createdUser._id,
      username: createdUser.username,
      email: createdUser.email,
      isActive: createdUser.isActive
    });

    console.log('Finding user by email...');
    
    // First check all users in DB
    const allUsers = await User.find({});
    console.log('All users in DB:', allUsers.map(u => ({ email: u.email, username: u.username })));
    
    // Try direct findByEmail method
    console.log('Trying findByEmail directly...');
    const foundByEmail = await userService.findByEmail('test@example.com');
    console.log('Direct findByEmail result:', foundByEmail ? {
      id: foundByEmail._id,
      username: foundByEmail.username,
      email: foundByEmail.email
    } : 'NULL');
    
    // Debug the findUserByEmail method
    console.log('userService:', typeof userService);
    console.log('userService.findByEmail:', typeof userService.findByEmail);
    console.log('userService.findUserByEmail:', typeof userService.findUserByEmail);
    
    // Try through alias
    try {
      console.log('Calling findUserByEmail...');
      const foundUser = await userService.findUserByEmail('test@example.com');
      console.log('Result type:', typeof foundUser);
      console.log('Result value:', foundUser);
      console.log('Result === null:', foundUser === null);
      console.log('Result === undefined:', foundUser === undefined);
      console.log('Boolean(foundUser):', Boolean(foundUser));
      
      console.log('Found user via findUserByEmail:', foundUser ? {
        id: foundUser._id,
        username: foundUser.username, 
        email: foundUser.email,
        isActive: foundUser.isActive
      } : 'NULL');
    } catch (error) {
      console.log('Error in findUserByEmail:', error.message);
      console.log('Stack:', error.stack);
    }

    // Test 2: Update user status
    console.log('Updating user status to false...');
    const updatedUser = await userService.updateUserStatus(createdUser._id, false);
    console.log('Updated user:', {
      id: updatedUser._id,
      username: updatedUser.username,
      isActive: updatedUser.isActive
    });

    // Test 3: Get online users
    console.log('Getting online users...');
    const onlineUsers = await userService.getOnlineUsers();
    console.log('Online users count:', onlineUsers.length);
    console.log('Online users:', onlineUsers);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    await mongoServer.stop();
  }
}

debugUserService().catch(console.error);