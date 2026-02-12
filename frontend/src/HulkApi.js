// hulkApi.js - API Integration for Hulk Challenge

import axios from 'axios';

// Base API URL - Update this to match your backend URL
const API_BASE_URL =import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Submit flag for Hulk challenge
 * @param {string} flag - The flag keyword (e.g., "green_smash")
 * @returns {Promise} Response from backend
 */
export const submitHulkFlag = async (flag) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/submit-flag`, {
      character: 'hulk',
      flag: flag.trim(),
      stone: 'time_stone',
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Flag submission error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit flag'
    };
  }
};

/**
 * Get user's progress on Hulk challenge
 * @param {string} userId - User ID
 * @returns {Promise} User progress data
 */
export const getHulkProgress = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/progress/hulk/${userId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Progress fetch error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch progress'
    };
  }
};

/**
 * Track user attempt on Hulk challenge
 * @param {string} userId - User ID
 * @param {string} stage - Challenge stage (chamber, wave, final)
 * @param {object} data - Additional attempt data
 */
export const trackAttempt = async (userId, stage, data = {}) => {
  try {
    await axios.post(`${API_BASE_URL}/track-attempt`, {
      userId,
      character: 'hulk',
      stage,
      ...data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Attempt tracking error:', error);
  }
};

/**
 * Verify if user has completed previous stages
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user can access current stage
 */
export const verifyStageAccess = async (userId, stage) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/verify-access/hulk/${userId}/${stage}`);
    return response.data.hasAccess;
  } catch (error) {
    console.error('Access verification error:', error);
    return false;
  }
};

export default {
  submitHulkFlag,
  getHulkProgress,
  trackAttempt,
  verifyStageAccess
};