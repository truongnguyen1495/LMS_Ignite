import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard";
import { User, UserRole } from "./types";
import { GraduationCap, LogOut } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("lms_token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user details
  const fetchCurrentUser = async (sessionToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });

      if (!response.ok) {
        // Token might be stale/invalid
        handleLogout();
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err: any) {
      console.error("Error fetching current user", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token]);

  const handleLoginSuccess = (sessionToken: string, loggedInUser: User) => {
    localStorage.setItem("lms_token", sessionToken);
    setToken(sessionToken);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("lms_token");
    setToken(null);
    setUser(null);
  };

  const handleRefreshProfile = () => {
    if (token) {
      fetchCurrentUser(token);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md animate-bounce mb-4">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-800 animate-pulse">
          Đang khởi động hệ thống phân quyền LMS...
        </p>
      </div>
    );
  }

  // If not logged in, render the login page
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Route to the appropriate dashboard depending on role
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard token={token} onLogout={handleLogout} />;
  } else if (user.role === UserRole.STUDENT) {
    return (
      <StudentDashboard
        token={token}
        user={user}
        onLogout={handleLogout}
        onRefreshProfile={handleRefreshProfile}
      />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 max-w-sm">
        <h3 className="text-lg font-bold text-slate-900">Không Thể Xác Định Vai Trò</h3>
        <p className="text-xs text-slate-500">
          Tài khoản của bạn thiếu cấu hình quyền truy cập (Role). Vui lòng thử đăng nhập bằng tài khoản Admin.
        </p>
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Trở lại Đăng nhập
        </button>
      </div>
    </div>
  );
}
