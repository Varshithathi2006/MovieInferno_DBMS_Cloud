// app/signup/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else if (data.user) {
      // The user account is created. Now, let's update your custom 'users' table.
      // This is the "automatic" update you wanted.
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({ id: data.user.id, email: data.user.email });
      
      if (userError) {
        alert(userError.message);
      } else {
        alert("Account created successfully! Please check your email to confirm.");
        router.push("/login"); // Redirect the user to the login page
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <form 
        onSubmit={handleSignup} 
        className="bg-gray-900 p-8 rounded-2xl shadow-lg w-96 text-white"
      >
        <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-2 mb-4 rounded bg-gray-800"
          disabled={loading}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-2 mb-4 rounded bg-gray-800"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="w-full bg-red-600 py-2 rounded hover:bg-red-700"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}