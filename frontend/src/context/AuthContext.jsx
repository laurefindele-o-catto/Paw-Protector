import { createContext, useContext, useEffect, useState } from "react"
import apiConfig from '../config/apiConfig.js'

const AuthContext = createContext();

export const useAuth = ()=>{
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const AuthProvider = ({children})=>{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(()=>{
        const checkAuth = async()=>{
            const storedToken = localStorage.getItem('token');
            if(storedToken){
                try {
                    const response = await fetch(`${apiConfig.baseURL}/api/auth/verify-token`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });

                    if(response.ok){
                        const userData = await response.json();
                        setUser(userData.user);
                        setToken(storedToken);
                    }else{
                        localStorage.removeItem('token');
                        setToken(null);
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        }
        checkAuth();
    }, []);


    const login = async (identifier, password) => {
        try {
            const response = await fetch(`${apiConfig.baseURL}${apiConfig.auth.login}`, {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({identifier, password})
            })

            if(response.ok){
                const userData = await response.json();
                setUser(userData.user);
                setToken(userData.tokens.accessToken);
                localStorage.setItem('token', userData.tokens.accessToken);
                localStorage.setItem('user', JSON.stringify(userData.user));
                return {success: true}
            }else{
                const errorData = await response.json();
                return {success: false, error: errorData.error}
            }
        } catch (error) {
            return { success: false, error: 'Login failed' };
        }
    }

    const register = async (username, email, password, role) => {
        
        try {
            if(localStorage.getItem('user')){
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
            const response = await fetch(`${apiConfig.baseURL}${apiConfig.auth.register}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    role
                })
            });

            const data = await response.json();

            if(response.ok){
                // if (data?.tokens?.accessToken) {
                //     setUser(data.user);
                //     setToken(data.tokens.accessToken);
                //     localStorage.setItem('token', data.tokens.accessToken);
                //     localStorage.setItem('user', JSON.stringify(data.user));
                // }
                return {
                    success: true,
                    message: data.message,
                    requiresVerification: data.user?.requires_verification === true
                }
            }else{
                return { 
                    success: false, 
                    error: data.error || data.message
                };
            }
        } catch (error) {
            return { success: false, error: 'Registration failed' };
        }
    }

    const logout = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const storedToken = localStorage.getItem('token');
            if (storedUser && storedToken) {
                await fetch(`${apiConfig.baseURL}${apiConfig.auth.logout(storedUser.id)}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });
            }

            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (error) {
            return { 
                success: false, 
                error: 'Logout failed' ,
                message: error
            };
        }
    }

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}