import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../data/auth";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(name, password);
    if (!res.success) return setError(res.message || "Invalid credentials");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#b81212] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md md:max-w-5xl bg-[#f2f2f2] shadow-2xl rounded-xl md:rounded-none overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0 md:min-h-[540px]">
        <div className="bg-[#c8c8c8] px-5 py-7 md:px-8 md:py-10 flex flex-col justify-center">
          <h2 className="text-black text-lg md:text-xl tracking-wide font-semibold mb-7 md:mb-10">MEMBER LOGIN</h2>

          <form onSubmit={submit} className="space-y-4 md:space-y-5">
            <div className="border-b border-[#d5d5d5] pb-2 flex items-center gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-base md:text-sm text-black placeholder:text-[#3f3f3f] outline-none" placeholder="Username" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111111" className="w-4 h-4"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" /></svg>
            </div>

            {/* email removed - login uses username + password only */}

            <div className="border-b border-[#d5d5d5] pb-2 flex items-center gap-2">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-base md:text-sm text-black placeholder:text-[#3f3f3f] outline-none" placeholder="Type Your Password" />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-black hover:text-[#333]" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111111" className="w-4 h-4"><path d="M3.53 2.47a.75.75 0 10-1.06 1.06l2.2 2.2A12.5 12.5 0 001.12 11.3a1.75 1.75 0 000 1.4C2.75 16.4 6.53 20 12 20a11.9 11.9 0 006.25-1.7l2.22 2.23a.75.75 0 101.06-1.06L3.53 2.47zM12 18.5c-4.85 0-8.2-3.18-9.5-6 .67-1.46 1.73-2.94 3.3-4.09l1.84 1.84a3.75 3.75 0 005 5l1.88 1.88A10.17 10.17 0 0112 18.5z" /><path d="M12 5.5c4.85 0 8.2 3.18 9.5 6-.41.9-.95 1.82-1.66 2.7a.75.75 0 101.16.95c.82-1.02 1.45-2.07 1.88-3.05a1.75 1.75 0 000-1.4C21.25 7.6 17.47 4 12 4c-1.58 0-3.03.3-4.34.8a.75.75 0 10.53 1.4A10.74 10.74 0 0112 5.5z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#111111" className="w-4 h-4"><path d="M12 5.5c4.85 0 8.2 3.18 9.5 6-1.3 2.82-4.65 6-9.5 6s-8.2-3.18-9.5-6c1.3-2.82 4.65-6 9.5-6zm0-1.5C6.53 4 2.75 7.6 1.12 11.3a1.75 1.75 0 000 1.4C2.75 16.4 6.53 20 12 20s9.25-3.6 10.88-7.3a1.75 1.75 0 000-1.4C21.25 7.6 17.47 4 12 4zm0 3.75A3.75 3.75 0 1015.75 11 3.75 3.75 0 0012 7.75zm0 1.5A2.25 2.25 0 1112 13.75 2.25 2.25 0 0112 9.25z" /></svg>}
              </button>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <button className="w-full bg-[#b81212] hover:bg-[#960f0f] text-white text-sm font-semibold py-3 md:py-2 rounded-full transition-colors">LOGIN</button>
          </form>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80')" }} />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 h-full px-12 py-14 flex flex-col justify-between text-white">
            <h1 className="text-4xl font-extrabold leading-tight tracking-wide">TANDOORI WINGS</h1>
            <div className="pb-10">
              <p className="text-xl text-white/90">Perfect Place to</p>
              <p className="text-2xl font-semibold">Get Delicious Foods</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
