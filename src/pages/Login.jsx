import React from 'react';

export default function Login() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <div className="bg-white border border-[#c2c7d0] rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00375e]">ForenScreen</h1>
          <p className="text-sm text-[#42474f] mt-2">Forensic Unit Login</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10"
              placeholder="officer@department.gov"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#00375e] text-white font-medium rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
