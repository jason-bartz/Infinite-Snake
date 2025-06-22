// api/test-redis.js - Debug endpoint for Redis connection
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  console.log('Test Redis endpoint called');
  
  // Log environment variables (safely)
  console.log('Environment check:');
  console.log('UPSTASH_REDIS_REST_URL exists:', !!process.env.UPSTASH_REDIS_REST_URL);
  console.log('UPSTASH_REDIS_REST_TOKEN exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
  
  if (process.env.UPSTASH_REDIS_REST_URL) {
    console.log('URL format:', process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + '...');
  }
  
  try {
    // Try method 1: fromEnv
    console.log('Attempting Redis.fromEnv()...');
    let redis;
    
    try {
      redis = Redis.fromEnv();
      console.log('Redis.fromEnv() succeeded');
    } catch (envError) {
      console.error('Redis.fromEnv() failed:', envError.message);
      
      // Try method 2: explicit initialization
      console.log('Attempting explicit initialization...');
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Missing required environment variables');
      }
      
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('Explicit initialization succeeded');
    }
    
    // Test the connection
    console.log('Testing Redis connection...');
    const testKey = 'test:connection';
    const testValue = new Date().toISOString();
    
    // Try to set a value
    await redis.set(testKey, testValue, { ex: 60 }); // Expire in 60 seconds
    console.log('Successfully set test value');
    
    // Try to get it back
    const retrieved = await redis.get(testKey);
    console.log('Successfully retrieved test value:', retrieved);
    
    // Get Redis info
    const dbSize = await redis.dbsize();
    console.log('Database size:', dbSize);
    
    return res.status(200).json({
      success: true,
      message: 'Redis connection successful!',
      test: {
        set: testValue,
        get: retrieved,
        match: testValue === retrieved,
        dbSize: dbSize
      },
      env: {
        urlExists: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenExists: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        urlPrefix: process.env.UPSTASH_REDIS_REST_URL ? 
          process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) : null
      }
    });
    
  } catch (error) {
    console.error('Redis test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      env: {
        urlExists: !!process.env.UPSTASH_REDIS_REST_URL,
        tokenExists: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        urlValue: process.env.UPSTASH_REDIS_REST_URL ? 
          process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + '...' : 'not set'
      }
    });
  }
}