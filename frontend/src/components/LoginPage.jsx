import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import img from "../assets/login.webp";
import img2 from "../assets/logo.png"
import axios from 'axios';

// Configure axios with your backend URL
const API_URL = 'https://67e301ce909f4618a5ed2dd9--cozy-cascaron-ce6d5e.netlify.app/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    personName: '',
    businessName: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      personName: '',
      businessName: '',
    });
    setEmailError('');
    setPasswordError('');
    setServerError('');
  };

  const validateBusinessEmail = (email) => {
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'];
    const domain = email.split('@')[1];
    return domain && !publicDomains.includes(domain.toLowerCase());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Validate email when it changes
    if (name === 'email' && value.includes('@')) {
      if (!validateBusinessEmail(value)) {
        setEmailError('Only business email addresses are allowed. Public domains are not accepted.');
      } else {
        setEmailError('');
      }
    }

    // Validate password confirmation
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      if (name === 'confirmPassword' && value !== formData.password) {
        setPasswordError('Passwords do not match');
      } else if (name === 'password' && value !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    // Email validation
    if (!formData.email.includes('@') || !validateBusinessEmail(formData.email)) {
      setEmailError('Please enter a valid business email address');
      return;
    }
    
    // Password validation for signup
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      if (isLogin) {
        // Handle login
        const response = await axios.post(`${API_URL}/login`, {
          email: formData.email,
          password: formData.password
        });
        
        // Save user data to localStorage if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Redirect to dashboard or home page
        navigate('/dashboard');
      } else {
        // Handle signup
        await axios.post(`${API_URL}/signup`, {
          email: formData.email,
          password: formData.password,
          personName: formData.personName,
          businessName: formData.businessName
        });
        
        // Show success and switch to login
        alert('Registration successful! Please log in.');
        setIsLogin(true);
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setEmailError('Please enter your email to reset password');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(`${API_URL}/reset-password`, { email: formData.email });
      alert('If your email is registered, you will receive password reset instructions.');
    } catch (error) {
      console.error('Password reset error:', error);
      setServerError('Unable to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col ">
      {/* Logo and Company Name - Visible on all devices */}
      <div className='h-20' >
      <img src={img2} alt="logo" className='h-full md:px-32' />
      </div>
      <div className="bg-white p-4 md:hidden text-center">
        <h1 className='text-2xl font-semibold logo'>Off-Highway Parts Depot</h1>
        <h2 className='text-xl font-semibold logo'>Drivetrain Products</h2>
        <div className='bg-blue-500 mt-2'>
          <img 
            src={img} 
            alt="Construction equipment by the beach" 
            className="w-full object-cover h-32"
          />    
        </div>
      </div>

      {/* Main content */}
      
      <div className="flex-grow flex flex-col md:flex-row items-start overflow-hidden md:px-24">
     
        {/* Background image section - Only visible on md and larger screens */}
        <div className="hidden md:block p-10 md:w-3/5 lg:w-3/4 flex items-center justify-center relative">
          <h1 className='lg:text-5xl text-2xl md:text-4xl my-4 font-semibold logo'>Off-Highway Parts Depot</h1>
          <h2 className='lg:text-4xl text-2xl md:text-3xl my-4 font-semibold logo'>Drivetrain Products</h2>
          <div className='bg-blue-500'>
            <img 
              src={img} 
              alt="Construction equipment by the beach" 
              className="w-full h-1/2 object-cover"
            />    
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/30 to-navy-900/70">
            <div className="absolute bottom-16 left-16 text-white">
              <div className="text-5xl font-bold leading-tight">
                {/* <span className="text-blue-600">building a</span><br />
                <span className="text-green-400">comfortable</span><br />
                <span className="text-blue-600">tomorrow</span> */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Login/Signup form container */}
        <div className="w-full md:w-2/5 lg:w-1/2 flex items-center justify-center p-4 md:p-0 bg-white">
          <div className="w-full max-w-md p-6 lg:p-10 bg-white rounded-lg">
            <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
              {isLogin ? "Dealer Portal - LOGIN" : "Dealer Portal - SIGN UP"}
            </h1>
            
            {serverError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{serverError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="person-name">
                      Your Name
                    </label>
                    <input
                      id="person-name"
                      name="personName"
                      type="text"
                      value={formData.personName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required={!isLogin}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="business-name">
                      Business Name
                    </label>
                    <input
                      id="business-name"
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required={!isLogin}
                      placeholder="Enter your company name"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                  Business Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  placeholder="Enter your business email"
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    passwordError && !isLogin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              {!isLogin && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={!isLogin}
                    placeholder="Confirm your password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              )}
              
              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Save
                    </label>
                  </div>
                  
                  <div className="text-sm">
                    <button 
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-blue-600 hover:text-blue-800 flex items-center group transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Password Find
                    </button>
                  </div>
                </div>
              )}
              
              {isLogin && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 text-sm">language</span>
                  <select className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>English</option>
                    <option>Korean</option>
                  </select>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full text-white bg-blue-500 py-3 px-4 rounded-md hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium shadow-md"
                disabled={loading}
              >
                {loading ? (
                  "Processing..."
                ) : (
                  isLogin ? "Login" : "Sign Up"
                )}
              </button>
              
              {isLogin && (
                <p className="text-sm text-red-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  If you can't login or error, please click this.
                </p>
              )}
              
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-sm text-gray-500">or</span>
                </div>
              </div>
              
              <p className="text-center">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={toggleForm}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </p>
              
              {!isLogin && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> Only business email addresses are allowed. 
                    Personal email domains (Gmail, Yahoo, etc.) are not accepted. This helps us 
                    maintain the professional integrity of our dealer network.
                  </p>
                </div>
              )}
            </form>
            
            {isLogin && (
              <p className="mt-8 text-xs text-gray-500">
                Our website is optimized for Chrome and Internet Explorer 11 or Above.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 py-4 px-6 text-center text-xs text-gray-600 border-t">
        <div className="max-w-7xl flex flex-col md:flex-row items-center justify-center md:justify-between">
          <div>
            Copyright © 2025 mechaical Co., Ltd. All Rights Reserved.
          </div>
          <div className="mt-2 md:mt-0">
            <Link to="/home" className="text-blue-600 hover:text-blue-800 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;