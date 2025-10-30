import React, { useState } from "react";
import { Link } from "react-router-dom";
const SignupPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            // Handle success or error (e.g., show message, redirect)
            console.log(data);
        } catch (error) {
            console.error("Signup error:", error);
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
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <button
                        type="submit"
                        className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Sign Up
                    </button>
                </form>
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