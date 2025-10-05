// app/login/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      alert("Welcome back!");
      // Change this line to your desired dashboard path
      router.push("/movies"); // currently redirects to the movies page
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <form 
        onSubmit={handleLogin} 
        className="bg-gray-900 p-8 rounded-2xl shadow-lg w-96 text-white"
      >
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-2 mb-4 rounded bg-gray-800"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-2 mb-4 rounded bg-gray-800"
        />
        <button 
          type="submit" 
          className="w-full bg-red-600 py-2 rounded hover:bg-red-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}