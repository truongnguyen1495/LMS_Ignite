import React, { useState } from "react";
import { GraduationCap, Shield, User as UserIcon, Lock, ArrowRight, AlertCircle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-950">
          Hệ Thống LMS 5 Cấp
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Phiên bản MVP rút gọn • Quản lý học viên & Bài học phân quyền
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Tên đăng nhập
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập vào hệ thống"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Seed/Test Credentials Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Tài khoản dùng thử (MVP Seed)
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  Quyền Super Admin
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin", "admin")}
                  className="w-full flex justify-between items-center text-left py-1 px-2 hover:bg-white rounded-lg text-xs font-medium text-slate-700 hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                >
                  <span>User: <strong className="text-slate-950 font-mono">admin</strong> / Pass: <strong className="text-slate-950 font-mono">admin</strong></span>
                  <span className="text-emerald-600">Chọn</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-600" />
                  Quyền Học viên (Student)
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student1", "123")}
                    className="flex justify-between items-center text-left py-1 px-2 hover:bg-white rounded-lg text-xs font-medium text-slate-700 hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                  >
                    <span>Cấp 1: <strong className="text-slate-950 font-mono">student1</strong> / Pass: <strong className="text-slate-950 font-mono">123</strong></span>
                    <span className="text-emerald-600">Chọn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student2", "123")}
                    className="flex justify-between items-center text-left py-1 px-2 hover:bg-white rounded-lg text-xs font-medium text-slate-700 hover:shadow-xs transition-all border border-transparent hover:border-slate-200"
                  >
                    <span>Cấp 2: <strong className="text-slate-950 font-mono">student2</strong> / Pass: <strong className="text-slate-950 font-mono">123</strong></span>
                    <span className="text-emerald-600">Chọn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
