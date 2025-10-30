
import { Link } from 'react-router-dom';
const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#FFFDF6" }}>
      <div className="bg-white shadow-md rounded-lg p-8 w-80">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Welcome Back
        </h2>
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Login
          </button>
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