import React, { useState, useEffect } from "react";
import { 
  Users, BookOpen, UserCheck, BarChart3, Settings, 
  Plus, Edit, Trash2, Check, X, ShieldAlert, 
  Unlock, Lock, Video, PlusCircle, Trash, AlertCircle, HelpCircle
} from "lucide-react";
import { AccessLevel, LevelNames, User, Lesson, QuizSubmission, LevelUpRequest, QuizQuestion } from "../types";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"students" | "lessons" | "requests" | "scores" | "config">("students");
  
  // Data states
  const [students, setStudents] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [requests, setRequests] = useState<LevelUpRequest[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [passingScore, setPassingScore] = useState<number>(80);
  
  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal/Form states for Students
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentForm, setStudentForm] = useState({
    username: "",
    fullName: "",
    password: "",
    level: AccessLevel.L1,
    isLocked: false
  });

  // Modal/Form states for Lessons
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    content: string;
    level: AccessLevel;
    youtubeUrl: string;
    quiz: QuizQuestion[];
  }>({
    title: "",
    content: "",
    level: AccessLevel.L1,
    youtubeUrl: "",
    quiz: []
  });

  // Fetch all administration data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [stdRes, lesRes, reqRes, subRes, cfgRes] = await Promise.all([
        fetch("/api/admin/students", { headers }),
        fetch("/api/lessons", { headers }),
        fetch("/api/admin/requests", { headers }),
        fetch("/api/admin/submissions", { headers }),
        fetch("/api/config", { headers })
      ]);

      if (!stdRes.ok || !lesRes.ok || !reqRes.ok || !subRes.ok || !cfgRes.ok) {
        throw new Error("Lỗi khi tải dữ liệu từ server.");
      }

      const stdData = await stdRes.json();
      const lesData = await lesRes.json();
      const reqData = await reqRes.json();
      const subData = await subRes.json();
      const cfgData = await cfgRes.json();

      setStudents(stdData);
      setLessons(lesData);
      setRequests(reqData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSubmissions(subData.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      setPassingScore(cfgData.passingScore);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // --- Student Actions ---
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.username.trim() || !studentForm.fullName.trim()) {
      showFeedback("Vui lòng nhập tên đăng nhập và họ tên học viên.", true);
      return;
    }

    try {
      const isEdit = !!editingStudent;
      const url = isEdit ? `/api/admin/students/${editingStudent.id}` : "/api/admin/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(studentForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi lưu học viên.");

      showFeedback(isEdit ? "Cập nhật học viên thành công!" : "Thêm học viên mới thành công!");
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setStudentForm({
        username: "",
        fullName: "",
        password: "",
        level: AccessLevel.L1,
        isLocked: false
      });
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  const handleEditStudent = (student: User) => {
    setEditingStudent(student);
    setStudentForm({
      username: student.username,
      fullName: student.fullName,
      password: "", // Leave blank if no change
      level: student.level,
      isLocked: student.isLocked
    });
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa học viên này? Thao tác này cũng sẽ xóa toàn bộ lịch sử nộp bài và yêu cầu nâng cấp liên quan.")) return;

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa học viên.");
      }
      showFeedback("Đã xóa học viên thành công.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  const handleToggleLockStudent = async (student: User) => {
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isLocked: !student.isLocked })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể cập nhật trạng thái khóa.");
      }
      showFeedback(student.isLocked ? "Đã mở khóa học viên." : "Đã khóa học viên.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // --- Lesson & Quiz Actions ---
  const handleAddQuestionToForm = () => {
    const newQ: QuizQuestion = {
      id: "new-q-" + Date.now() + "-" + lessonForm.quiz.length,
      question: "Câu hỏi mới",
      options: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      correctOptionIndex: 0
    };
    setLessonForm({
      ...lessonForm,
      quiz: [...lessonForm.quiz, newQ]
    });
  };

  const handleRemoveQuestionFromForm = (index: number) => {
    const quizCopy = [...lessonForm.quiz];
    quizCopy.splice(index, 1);
    setLessonForm({ ...lessonForm, quiz: quizCopy });
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const quizCopy = [...lessonForm.quiz];
    quizCopy[index] = { ...quizCopy[index], [field]: value };
    setLessonForm({ ...lessonForm, quiz: quizCopy });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const quizCopy = [...lessonForm.quiz];
    const optsCopy = [...quizCopy[qIdx].options];
    optsCopy[optIdx] = val;
    quizCopy[qIdx].options = optsCopy;
    setLessonForm({ ...lessonForm, quiz: quizCopy });
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim() || !lessonForm.content.trim()) {
      showFeedback("Vui lòng điền đủ Tiêu đề và Nội dung bài học.", true);
      return;
    }

    try {
      const isEdit = !!editingLesson;
      const url = isEdit ? `/api/lessons/${editingLesson.id}` : "/api/lessons";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(lessonForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gặp lỗi khi lưu bài học.");

      showFeedback(isEdit ? "Cập nhật bài học thành công!" : "Tạo bài học mới thành công!");
      setIsLessonModalOpen(false);
      setEditingLesson(null);
      setLessonForm({
        title: "",
        content: "",
        level: AccessLevel.L1,
        youtubeUrl: "",
        quiz: []
      });
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content: lesson.content,
      level: lesson.level,
      youtubeUrl: lesson.youtubeUrl || "",
      quiz: lesson.quiz || []
    });
    setIsLessonModalOpen(true);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;

    try {
      const res = await fetch(`/api/lessons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa bài học.");
      }
      showFeedback("Đã xóa bài học thành công.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // --- Request Actions ---
  const handleApproveRequest = async (id: string) => {
    const comment = window.prompt("Nhập phản hồi phê duyệt (không bắt buộc):", "Chúc mừng bạn đã thăng cấp thành công!");
    if (comment === null) return; // User cancelled prompt

    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể phê duyệt yêu cầu.");
      }
      showFeedback("Đã phê duyệt yêu cầu nâng cấp.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  const handleRejectRequest = async (id: string) => {
    const comment = window.prompt("Nhập lý do từ chối (bắt buộc):", "Cần cải thiện thêm điểm số trắc nghiệm bài test cấp hiện tại.");
    if (!comment) {
      if (comment === "") showFeedback("Phải điền lý do khi từ chối yêu cầu.", true);
      return;
    }

    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể từ chối yêu cầu.");
      }
      showFeedback("Đã từ chối yêu cầu.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // --- Configuration Actions ---
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passingScore })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lỗi cập nhật cấu hình.");
      }
      showFeedback("Cập nhật điểm chốt đạt bài test thành công!");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // Helper count for pending requests
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-inner">
              SA
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Super Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Hệ thống quản trị LMS cấp 1 - 5</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">
              Xin chào, <strong className="text-white">Admin</strong>
            </span>
            <button
              onClick={onLogout}
              className="py-1.5 px-3 bg-slate-800 hover:bg-red-900 border border-slate-700 hover:border-red-800 rounded-lg text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-emerald-800">{success}</span>
          </div>
        )}

        {/* Tab Navigation & Stats Bento Box */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Menu Sidebar Block */}
          <div className="bg-white p-4 rounded-3xl shadow-xs border border-slate-200/50 flex flex-col gap-1.5 h-fit">
            <p className="text-xs font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
              Bảng điều khiển
            </p>
            <button
              onClick={() => setActiveTab("students")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === "students"
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Học viên ({students.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("lessons")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === "lessons"
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Bài học & Test ({lessons.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === "requests"
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5" />
                <span>Yêu cầu lên cấp</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold text-xs py-0.5 px-2 rounded-full shadow-xs animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("scores")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === "scores"
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Điểm số bài test ({submissions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                activeTab === "config"
                  ? "bg-emerald-50 text-emerald-700 shadow-inner"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Cấu hình chung</span>
            </button>
          </div>

          {/* Tab Content Block */}
          <div className="md:col-span-3 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/50 min-h-[500px]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                <p className="text-sm">Đang đồng bộ dữ liệu hệ thống...</p>
              </div>
            )}

            {!loading && (
              <>
                {/* 1. STUDENTS TAB */}
                {activeTab === "students" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Quản lý Học viên</h3>
                        <p className="text-xs text-slate-500">Thêm học viên, sửa thông tin, khóa hoặc cấp cấp quyền học tập trực tiếp</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStudent(null);
                          setStudentForm({
                            username: "",
                            fullName: "",
                            password: "123",
                            level: AccessLevel.L1,
                            isLocked: false
                          });
                          setIsStudentModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm học viên
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="px-6 py-4">Họ và tên / Username</th>
                            <th className="px-6 py-4">Cấp quyền hiện tại</th>
                            <th className="px-6 py-4">Trạng thái tài khoản</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                Chưa có học viên nào trong hệ thống. Hãy nhấp nút "Thêm học viên" ở trên.
                              </td>
                            </tr>
                          ) : (
                            students.map(student => (
                              <tr key={student.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-900">{student.fullName}</div>
                                  <div className="text-xs text-slate-500 font-mono">@{student.username}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {LevelNames[student.level]}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {student.isLocked ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                      <Lock className="h-3 w-3" /> Đã Khóa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <Unlock className="h-3 w-3" /> Đang Hoạt động
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <button
                                    onClick={() => handleToggleLockStudent(student)}
                                    title={student.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                    className={`p-1.5 rounded-lg border transition-all inline-flex items-center ${
                                      student.isLocked 
                                        ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" 
                                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {student.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleEditStudent(student)}
                                    title="Sửa học viên"
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-all inline-flex items-center"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(student.id)}
                                    title="Xóa học viên"
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 transition-all inline-flex items-center"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. LESSONS TAB */}
                {activeTab === "lessons" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Danh sách bài học & Test trắc nghiệm</h3>
                        <p className="text-xs text-slate-500">Thiết lập nội dung đào tạo 5 cấp, nhúng video YouTube và thiết kế câu hỏi trắc nghiệm</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingLesson(null);
                          setLessonForm({
                            title: "",
                            content: "",
                            level: AccessLevel.L1,
                            youtubeUrl: "",
                            quiz: []
                          });
                          setIsLessonModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Tạo bài học mới
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {lessons.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                          Chưa có bài học nào được tạo. Hãy nhấn nút "Tạo bài học mới".
                        </div>
                      ) : (
                        // Sort lessons by level
                        [...lessons].sort((a,b) => a.level - b.level).map(lesson => (
                          <div key={lesson.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {LevelNames[lesson.level]}
                                </span>
                                {lesson.youtubeUrl && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                                    <Video className="h-3 w-3" /> YouTube Video
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {lesson.quiz ? lesson.quiz.length : 0} câu trắc nghiệm
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-base">{lesson.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1">{lesson.content}</p>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleEditLesson(lesson)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Edit className="h-3.5 w-3.5" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg text-xs font-semibold transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Xóa
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. REQUESTS TAB */}
                {activeTab === "requests" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Phê duyệt Yêu cầu Xin lên cấp</h3>
                      <p className="text-xs text-slate-500">Xử lý các nguyện vọng thăng cấp từ học viên khi đã hoàn thành nội dung hiện tại</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="px-6 py-4">Học viên</th>
                            <th className="px-6 py-4">Từ cấp</th>
                            <th className="px-6 py-4">Xin nâng lên</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Phê duyệt / Từ chối</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {requests.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                Chưa có bất kỳ yêu cầu xin nâng cấp nào.
                              </td>
                            </tr>
                          ) : (
                            requests.map(req => (
                              <tr key={req.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-900">{req.studentName}</div>
                                  <div className="text-[11px] text-slate-400">Yêu cầu lúc: {new Date(req.createdAt).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-semibold text-slate-600">
                                    {LevelNames[req.currentLevel]}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    {LevelNames[req.requestedLevel]}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {req.status === "pending" && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                      Đang Chờ Duyệt
                                    </span>
                                  )}
                                  {req.status === "approved" && (
                                    <div className="space-y-0.5">
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Đã Đồng Ý
                                      </span>
                                      {req.comment && <div className="text-[10px] text-slate-500 font-medium italic">"{req.comment}"</div>}
                                    </div>
                                  )}
                                  {req.status === "rejected" && (
                                    <div className="space-y-0.5">
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                                        Từ Chối
                                      </span>
                                      {req.comment && <div className="text-[10px] text-red-500 font-medium italic">Lý do: "{req.comment}"</div>}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {req.status === "pending" ? (
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => handleApproveRequest(req.id)}
                                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-2 rounded-lg transition-all"
                                      >
                                        <Check className="h-3.5 w-3.5" /> Duyệt
                                      </button>
                                      <button
                                        onClick={() => handleRejectRequest(req.id)}
                                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold py-1 px-2 rounded-lg transition-all"
                                      >
                                        <X className="h-3.5 w-3.5" /> Từ chối
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Đã xử lý xong</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. SCORES TAB */}
                {activeTab === "scores" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Lịch sử Điểm Số & Nộp Bài Test</h3>
                      <p className="text-xs text-slate-500">Giám sát điểm kiểm tra tự động của học viên ở các bài học</p>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="px-6 py-4">Học viên</th>
                            <th className="px-6 py-4">Bài học</th>
                            <th className="px-6 py-4">Cấp</th>
                            <th className="px-6 py-4">Điểm số</th>
                            <th className="px-6 py-4">Đánh giá</th>
                            <th className="px-6 py-4">Ngày làm test</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {submissions.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                Chưa có học viên nào tham gia làm test trắc nghiệm bài học.
                              </td>
                            </tr>
                          ) : (
                            submissions.map(sub => (
                              <tr key={sub.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-slate-900">{sub.studentName}</td>
                                <td className="px-6 py-4 max-w-xs truncate" title={sub.lessonTitle}>
                                  {sub.lessonTitle}
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-slate-500">Cấp {sub.level}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-sm font-bold ${sub.passed ? "text-emerald-700" : "text-red-700"}`}>
                                    {sub.score}%
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {sub.passed ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      Đạt (Pass)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                      Chưa Đạt (Fail)
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                  {new Date(sub.submittedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. CONFIG TAB */}
                {activeTab === "config" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Cấu hình Hệ thống LMS</h3>
                      <p className="text-xs text-slate-500">Điều chỉnh các thông số vận hành chung của hệ thống lớp học</p>
                    </div>

                    <form onSubmit={handleUpdateConfig} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50 max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Điểm số chốt đạt (%) của bài kiểm tra
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={passingScore}
                            onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
                            className="block w-28 px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-center font-bold"
                          />
                          <span className="text-slate-600 font-bold">%</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Học viên đạt số điểm từ ngưỡng này trở lên sẽ được tính là đạt (Pass) bài học đó. Hiện tại mặc định: 80%.
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Lưu cấu hình
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* --- STUDENT MODAL --- */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? "Sửa thông tin Học viên" : "Thêm Học viên mới"}
              </h3>
              <button 
                onClick={() => setIsStudentModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStudent}
                  value={studentForm.username}
                  onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                  placeholder="Ví dụ: hocvien_moi"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu {editingStudent && <span className="text-slate-400 lowercase">(bỏ trống nếu không đổi)</span>}
                </label>
                <input
                  type="text"
                  required={!editingStudent}
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder={editingStudent ? "Không thay đổi" : "Mật khẩu đăng nhập..."}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cấp độ bắt đầu được duyệt học
                </label>
                <select
                  value={studentForm.level}
                  onChange={(e) => setStudentForm({ ...studentForm, level: parseInt(e.target.value) as AccessLevel })}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value={AccessLevel.L1}>Cấp 1: Customer (Mặc định)</option>
                  <option value={AccessLevel.L2}>Cấp 2: New starter</option>
                  <option value={AccessLevel.L3}>Cấp 3: Junior</option>
                  <option value={AccessLevel.L4}>Cấp 4: Senior</option>
                  <option value={AccessLevel.L5}>Cấp 5: Core leader</option>
                </select>
              </div>

              {editingStudent && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="lockCheckbox"
                    checked={studentForm.isLocked}
                    onChange={(e) => setStudentForm({ ...studentForm, isLocked: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="lockCheckbox" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-amber-500" /> Khóa tài khoản của học viên này
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-xs transition-colors"
                >
                  Lưu học viên
                </button>
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LESSON & QUIZ MODAL --- */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 my-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLesson ? "Sửa nội dung Bài Học & Quiz" : "Thiết kế Bài Học Mới"}
              </h3>
              <button 
                onClick={() => setIsLessonModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLessonSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tiêu đề bài học
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Nhập tiêu đề bài học..."
                    className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Thuộc Cấp độ
                  </label>
                  <select
                    value={lessonForm.level}
                    onChange={(e) => setLessonForm({ ...lessonForm, level: parseInt(e.target.value) as AccessLevel })}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value={AccessLevel.L1}>Cấp 1: Customer</option>
                    <option value={AccessLevel.L2}>Cấp 2: New starter</option>
                    <option value={AccessLevel.L3}>Cấp 3: Junior</option>
                    <option value={AccessLevel.L4}>Cấp 4: Senior</option>
                    <option value={AccessLevel.L5}>Cấp 5: Core leader</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đường dẫn video YouTube
                </label>
                <input
                  type="url"
                  value={lessonForm.youtubeUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })}
                  placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nội dung chi tiết bài học (Lý thuyết)
                </label>
                <textarea
                  required
                  rows={4}
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Nhập văn bản hướng dẫn học tập, lý thuyết, tài liệu chỉ dẫn..."
                  className="block w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm"
                ></textarea>
              </div>

              {/* Dynamic quiz designer */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-600" />
                    Thiết kế bài kiểm tra trắc nghiệm ({lessonForm.quiz.length} câu)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionToForm}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-2.5 rounded-lg transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Thêm câu hỏi
                  </button>
                </div>

                <div className="space-y-4">
                  {lessonForm.quiz.map((q, qIdx) => (
                    <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionFromForm(qIdx)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa câu hỏi này"
                      >
                        <Trash className="h-4 w-4" />
                      </button>

                      <div>
                        <span className="text-xs font-bold text-slate-500">Câu hỏi {qIdx + 1}:</span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..."
                          className="block w-full mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(65 + oIdx)}:</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                              placeholder={`Đáp án ${oIdx + 1}`}
                              className="block w-full px-2.5 py-1 border border-slate-300 rounded-lg text-slate-950 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                        <span className="text-xs font-semibold text-slate-600">Đáp án chính xác:</span>
                        <select
                          value={q.correctOptionIndex}
                          onChange={(e) => handleQuestionChange(qIdx, "correctOptionIndex", parseInt(e.target.value))}
                          className="px-2 py-1 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value={0}>Lựa chọn A</option>
                          <option value={1}>Lựa chọn B</option>
                          <option value={2}>Lựa chọn C</option>
                          <option value={3}>Lựa chọn D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Lưu bài học
                </button>
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
