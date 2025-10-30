import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
const LoginPage = () => {
  const {isAuthenticated, loading, login} = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('');

  const handleSubmit = async(e)=>{
    e.preventDefault();
    const {success, error: errMsg} = await login(identifier, password);
    if(success) navigate('/dashboard');
    else setError(errMsg || 'Login Failed')
  }
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#FFFDF6" }}>
      <div className="bg-white shadow-md rounded-lg p-8 w-80">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Welcome Back
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            required
            name='identifier'
            value={identifier}
            onChange={e=>setIdentifier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            name='password'
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </form>
         <Link
          to="/signup"
          className="block text-center text-sm text-blue-600 hover:underline mt-4"
        >
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;