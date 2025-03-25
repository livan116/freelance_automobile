// app.mjs
import express, { Router } from "express";
import serverless from "serverless-http";
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import fs from 'fs';

import { Client } from 'basic-ftp';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = Router();
router.get("/hello", (req, res) => res.send("Hello World!"));

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(bodyParser.json());

// Improved logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// FTP Configuration
const ftpConfig = {
  host: "ftp.zfparts.us",
  port: 21,
  user: "dev@offhighwaypartsdepot.com",
  password: "I6*xh%ww{wL(",
  secure: false
};

// Function to ensure users directory exists
async function ensureUserDirectoryExists(client) {
  try {
    const currentDir = await client.pwd();
    console.log(`Currently in directory: ${currentDir}`);
    
    try {
      await client.cd('users');
      return true;
    } catch (cdErr) {
      console.log(`Users directory doesn't exist, creating it...`);
      try {
        await client.mkdir('users');
        await client.cd('users');
        return true;
      } catch (mkdirErr) {
        console.error(`Failed to create users directory: ${mkdirErr.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error ensuring users directory: ${error.message}`);
    return false;
  }
}

// Function to check if users.csv exists and create it if not
async function ensureUsersCSVExists(client) {
  const tempFilePath = path.join(process.cwd(), 'temp_users_csv_check.csv');
  
  try {
    const files = await client.list();
    const csvExists = files.some(file => file.name === 'users.csv');
    
    if (!csvExists) {
      console.log("users.csv does not exist, creating it...");
      const headers = "email,password,personName,businessName,createdAt\n";
      fs.writeFileSync(tempFilePath, headers);
      
      await client.uploadFrom(tempFilePath, 'users.csv');
      console.log("Created users.csv with headers");
    } else {
      console.log("users.csv already exists");
    }
    return true;
  } catch (error) {
    console.error(`Error ensuring users.csv exists: ${error.message}`);
    return false;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Function to append user data to CSV file
async function appendUserToCSV(userData) {
    const client = new Client();
  client.ftp.verbose = true;
  
  let tempDownloadPath = path.join(process.cwd(), `temp_users_${Date.now()}.csv`);
  let tempUploadPath = path.join(process.cwd(), `temp_users_upload_${Date.now()}.csv`);
  
  try {
    console.log("Connecting to FTP server...");
    await client.access({
      ...ftpConfig,
      secureOptions: { rejectUnauthorized: false }
    });
    
    const userDirExists = await ensureUserDirectoryExists(client);
    if (!userDirExists) {
      throw new Error("Failed to ensure users directory exists");
    }
    
    await ensureUsersCSVExists(client);
    
    console.log("Downloading current users.csv...");
    await client.downloadTo(tempDownloadPath, 'users.csv');
    
    let currentContent = fs.readFileSync(tempDownloadPath, 'utf8');
    const csvRow = `${userData.email},${userData.password},${userData.personName.replace(/,/g, ';')},${userData.businessName.replace(/,/g, ';')},${userData.createdAt}\n`;
    currentContent += csvRow;
    
    fs.writeFileSync(tempUploadPath, currentContent);
    
    console.log("Uploading updated users.csv...");
    await client.uploadFrom(tempUploadPath, 'users.csv');
    
    console.log("User data successfully appended to CSV");
    return true;
  } catch (error) {
    console.error('Error appending user to CSV:', error);
    throw error;
  } finally {
    [tempDownloadPath, tempUploadPath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted temporary file: ${filePath}`);
      }
    });
    
    try {
      await client.close();
      console.log("FTP connection closed");
    } catch (closeErr) {
      console.error("Error closing FTP connection:", closeErr);
    }
  }
}

// Function to get all users from CSV
async function getAllUsersFromCSV() {
    const client = new Client();

  client.ftp.verbose = true;
  
  let tempFilePath = path.join(process.cwd(), `temp_users_download_${Date.now()}.csv`);
  
  try {
    console.log("Connecting to FTP to retrieve users...");
    await client.access({
      ...ftpConfig,
      secureOptions: { rejectUnauthorized: false }
    });
    
    try {
      await client.cd('users');
    } catch (err) {
      console.log("Users directory doesn't exist yet");
      return [];
    }
    
    const files = await client.list();
    const csvExists = files.some(file => file.name === 'users.csv');
    
    if (!csvExists) {
      console.log("users.csv doesn't exist yet");
      return [];
    }
    
    console.log("Downloading users.csv...");
    await client.downloadTo(tempFilePath, 'users.csv');
    
    const fileContent = fs.readFileSync(tempFilePath, 'utf8');
    const rows = fileContent.split('\n').filter(row => row.trim() !== '');
    
    const headers = rows[0].split(',');
    const users = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',');
      if (values.length >= 5) {
        users.push({
          email: values[0],
          password: values[1],
          personName: values[2],
          businessName: values[3],
          createdAt: values[4]
        });
      }
    }
    
    console.log(`Retrieved ${users.length} users from CSV`);
    return users;
  } catch (error) {
    console.error('Error getting users from CSV:', error);
    throw error;
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log("Deleted temporary download file");
    }
    
    try {
      await client.close();
      console.log("FTP connection closed");
    } catch (closeErr) {
      console.error("Error closing FTP connection:", closeErr);
    }
  }
}

// Function to find user by email
async function findUserByEmail(email) {
  try {
    console.log(`Looking for user with email: ${email}`);
    const users = await getAllUsersFromCSV();
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log(user ? `User found: ${user.email}` : "User not found");
    
    return user;
  } catch (err) {
    console.error('Error finding user by email:', err);
    throw err;
  }
}

// Signup endpoint
router.post('/api/signup', async (req, res) => {
  try {
    console.log("Received signup request");
    
    const { email, password, personName, businessName } = req.body;
    console.log(`Signup attempt for: ${email}`);
    
    if (!email || !password || !personName || !businessName) {
      console.log("Signup validation failed: Missing required fields");
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`Invalid email format: ${email}`);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'];
    const domain = email.split('@')[1];
    if (!domain || publicDomains.includes(domain.toLowerCase())) {
      console.log(`Rejected public email domain: ${domain}`);
      return res.status(400).json({ error: 'Only business email addresses are allowed' });
    }
    
    console.log("Checking if user already exists...");
    let existingUser;
    try {
      existingUser = await findUserByEmail(email);
    } catch (findError) {
      console.error("Error checking existing user:", findError);
      existingUser = null;
    }
    
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = {
      email,
      password: hashedPassword,
      personName,
      businessName,
      createdAt: new Date().toISOString()
    };
    
    console.log("User object created, saving to CSV via FTP...");
    await appendUserToCSV(newUser);
    console.log(`User saved successfully: ${email}`);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
});

// Login endpoint
router.post('/api/login', async (req, res) => {
  try {
    console.log("Received login request");
    
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    if (!email || !password) {
      console.log("Login validation failed: Missing email or password");
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    console.log("Searching for user...");
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    console.log("Verifying password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password verification failed");
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    console.log(`User logged in successfully: ${email}`);
    const { password: _, ...userData } = user;
    
    res.json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error during login', details: error.message });
  }
});

// Password reset endpoint
router.post('/api/reset-password', async (req, res) => {
  try {
    console.log("Received password reset request");
    const { email } = req.body;
    
    if (!email) {
      console.log("Password reset validation failed: Missing email");
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log("Searching for user...");
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`User not found for password reset: ${email}`);
      return res.json({ message: 'If your email is registered, password reset instructions will be sent' });
    }
    
    console.log(`Password reset requested for: ${email}`);
    res.json({ message: 'If your email is registered, password reset instructions will be sent' });
  } catch (error) {
    console.error('Password reset error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error during password reset', details: error.message });
  }
});

// Test FTP connection endpoint
router.get('/api/test-ftp', async (req, res) => {
    const client = new Client();


  client.ftp.verbose = true;
  
  try {
    console.log("Testing FTP connection...");
    await client.access({
      ...ftpConfig,
      secureOptions: { rejectUnauthorized: false }
    });
    
    const currentDir = await client.pwd();
    
    let usersExists = false;
    try {
      await client.cd('users');
      usersExists = true;
      
      const files = await client.list();
      
      res.json({
        status: 'success',
        message: 'FTP connection successful',
        details: {
          currentDirectory: currentDir,
          usersDirectoryExists: usersExists,
          fileCount: files.length,
          files: files.map(f => ({
            name: f.name,
            type: f.type === 1 ? 'file' : 'directory',
            size: f.size,
            date: f.date
          }))
        }
      });
    } catch (cdErr) {
      res.json({
        status: 'partial',
        message: 'FTP connection successful, but users directory does not exist',
        details: {
          currentDirectory: currentDir,
          usersDirectoryExists: false,
          error: cdErr.message
        }
      });
    }
  } catch (error) {
    console.error('FTP test error details:', error);
    res.status(500).json({
      status: 'error',
      message: 'FTP connection failed',
      error: error.message
    });
  } finally {
    client.close();
  }
});

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/", router);

export const handler = serverless(app);