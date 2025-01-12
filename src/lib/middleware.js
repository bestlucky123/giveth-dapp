/**
 * Authenticates a user and provides consistent error handling
 * 
 * @param {Object} user Current user object
 * @param {boolean} isStrict If true, requires full authentication
 * @param {Object} web3 Web3 instance
 * @returns {Promise<boolean>} Authentication status
 */
const authenticateUser = async (user, isStrict = false, web3) => {
  if (!user || !user.address) {
    notification.error({
      message: 'Authentication Required',
      description: 'Please sign in to continue',
    });
    return false;
  }

  try {
    const isAuthenticated = await checkAuthentication(user, web3, isStrict);
    
    if (!isAuthenticated) {
      notification.warning({
        message: 'Authentication Failed',
        description: 'Please verify your wallet connection and try again',
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    notification.error({
      message: 'Authentication Error',
      description: 'An error occurred during authentication. Please try again.',
    });
    return false;
  }
};

export { authenticateUser }; 