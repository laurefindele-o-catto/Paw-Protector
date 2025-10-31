
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoader } from "../hooks/useLoader";
import { Loader } from "../Components/Loader";

const SignupPage = () => {
    

    const { isAuthenticated, register } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("owner");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const { run: runRegister, loading: loaderLoading } = useLoader(register);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        try {
            const { success, error: errMsg } = await runRegister(username, email, password, role);
            if (success) {
                navigate('/dashboard');
            } else {
                setError(errMsg || 'Registration failed');
            }
        } catch (err) {
            setError('Registration failed');
        }
    }    

    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ backgroundColor: "#FFFDF6" }}
        >
            <div className="bg-white shadow-md rounded-lg p-8 w-80">
                <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                    Create Account
                </h2>
                {loaderLoading && <Loader />}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        disabled={loaderLoading}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        disabled={loaderLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        disabled={loaderLoading}
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                        disabled={loaderLoading}
                    >
                        <option value="owner">Owner</option>
                        <option value="vet">Veterinarian</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                        disabled={loaderLoading}
                    >
                        Sign Up
                    </button>
                </form>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                {info && <p className="mt-3 text-sm text-green-600">{info}</p>}
                <a
                    href="/login"
                    className="block text-center text-sm text-blue-600 hover:underline mt-4"
                >
                    Already have an account? Log in
                </a>
            </div>
        </div>
    );
};

export default SignupPage;