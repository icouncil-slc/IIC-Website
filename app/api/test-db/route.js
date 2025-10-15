// app/api/test-db/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('TEST: Attempting to connect to DB...');
    await dbConnect();
    console.log('TEST: DB connection successful.');
    console.log('TEST: Searching for admin with email from .env.local:', process.env.ADMIN_EMAIL);
    console.log('TEST: Attempting to find admin user...');
    const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminUser) {
      console.log('TEST: Admin user FOUND:', adminUser);
      return NextResponse.json({ 
        status: 'Success', 
        message: 'Successfully connected to DB and found admin user.',
        user: adminUser 
      });
    } else {
      console.log('TEST: Admin user NOT found in DB.');
      return NextResponse.json({ 
        status: 'Error', 
        message: 'Connected to DB, but could not find the admin user.' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('DB Connection Test FAILED:', error);
    return NextResponse.json({ 
      status: 'Error', 
      message: 'Failed to connect to the database.', 
      error: error.message 
    }, { status: 500 });
  }
}
