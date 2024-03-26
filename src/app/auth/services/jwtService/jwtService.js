import RabitUtils from '@rabit/utils/RabitUtils';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import jwtServiceConfig from './jwtServiceConfig';

/* eslint-disable camelcase */

class JwtService extends RabitUtils.EventEmitter {
  init() {
    this.setInterceptors();
    this.handleAuthentication();
  }

  setInterceptors = () => {
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (err) => {
        return new Promise((resolve, reject) => {
          if (err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
            // if you ever get an unauthorized response, logout the user
            this.emit('onAutoLogout', 'Invalid access_token');
            this.setSession(null);
          }
          throw err;
        });
      }
    );
  };

  handleAuthentication = () => {
    const access_token = this.getAccessToken();

    if (!access_token) {
      this.emit('onNoAccessToken');

      return;
    }

    if (this.isAuthTokenValid(access_token)) {
      this.setSession(access_token);
      
      this.emit('onAutoLogin', true);
    } else {
      this.setSession(null);
      this.emit('onAutoLogout', 'access_token expired');
    }
  };

  createUser = (data) => {
    return new Promise((resolve, reject) => {
      axios.post(jwtServiceConfig.signUp, data).then((response) => {
        if (response.data.user) {
          this.setSession(response.data.access_token);
          resolve(response.data.user);
          this.emit('onLogin', response.data.user);
        } else {
          reject(response.data.error);
        }
      });
    });
  };

  signInWithEmailAndPassword = (email, password) => {
    return new Promise((resolve, reject) => {
      axios
        .get(jwtServiceConfig.signIn, {
          data: {
            email,
            password,
          },
        })
        .then((response) => {
          console.log(response)
          if (response.data.user) {
            this.setSession(response.data.access_token);
            resolve(response.data.user);
            this.emit('onLogin', response.data.user);
            console.log(response.data.user)
          } else {
            reject(response.data.error);
            }
        });
    });
  };

  signInWithToken = () => {
    return new Promise((resolve, reject) => {
      try {
        var storedData = localStorage.getItem('user');
  
        if (storedData) {
          let user = JSON.parse(storedData);
          let User = {
            uid: user.uid,
            role: user.role,
            data: {
              accessToken: user.data.accessToken,
              displayName: user.data.displayName,
            }
          };
          this.emit('onLogin', User);
        } else {
          axios.get(jwtServiceConfig.accessToken, {
              data: {
                access_token: this.getAccessToken(),
              },
            })
            .then((response) => {
              if (response.data.user) {
                this.setSession(response.data.access_token);
                resolve(response.data.user);
              } else {
                this.logout();
                reject(new Error('Failed to login with token.'));
              }
            })
            .catch((error) => {
              this.logout();
              reject(new Error('Failed to login with token.'));
            });
        }
      } catch (error) {
        console.error('Error occurred:', error);
        reject(error);
      }
    });
  };
  

  updateUserData = (user) => {
    return axios.post(jwtServiceConfig.updateUser, {
      user,
    });
  };

  setSession = (access_token) => {
    if (access_token) {
      localStorage.setItem('jwt_access_token', access_token);
      axios.defaults.headers.common.Authorization = `Bearer ${access_token}`;
    } else {
      localStorage.removeItem('jwt_access_token');
      delete axios.defaults.headers.common.Authorization;
    }
  };

  logout = () => {
    this.setSession(null);
    this.emit('onLogout', 'Logged out');
  };

  isAuthTokenValid = (access_token) => {
    if (!access_token) {
      return false;
    }
    const decoded = jwtDecode(access_token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      console.warn('access token expired');
      return false;
    }

    return true;
  };

  getAccessToken = () => {
    const jwtAccessToken = window.localStorage.getItem('jwt_access_token');
    const googleAccessToken = window.localStorage.getItem('google_access_token');
    
    if (jwtAccessToken) {
        // Return JWT token if it exists
        return jwtAccessToken;
    } else if (googleAccessToken) {
        // Return Google token if JWT token doesn't exist
        return googleAccessToken;
    } else {
        // Return null if neither token exists
        return null;
    }
  };
}

const instance = new JwtService();

export default instance;
