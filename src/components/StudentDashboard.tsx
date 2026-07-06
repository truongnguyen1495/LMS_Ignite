import React, { useState, useEffect } from "react";
import { 
  GraduationCap, BookOpen, Lock, Unlock, Play, HelpCircle, 
  CheckCircle2, XCircle, ChevronRight, Award, History, ArrowRight,
  AlertCircle, MessageSquare, Sparkles, RefreshCw
} from "lucide-react";
import { AccessLevel, LevelNames, User, Lesson, QuizSubmission, LevelUpRequest } from "../types";

interface StudentDashboardProps {
  token: string;
  user: User;
  onLogout: () => void;
  onRefreshProfile: () => void;
}

export default function StudentDashboard({ token, user, onLogout, onRefreshProfile }: StudentDashboardProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [history, setHistory] = useState<QuizSubmission[]>([]);
  const [requests, setRequests] = useState<LevelUpRequest[]>([]);
  const [systemConfig, setSystemConfig] = useState({ passingScore: 80 });

  // Detail lesson viewing state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    submitted: boolean;
    score: number;
    passed: boolean;
    passingScore: number;
    submission: QuizSubmission;
  } | null>(null);

  // General loading & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // active level tier view filter
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<AccessLevel>(user.level);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [lesRes, histRes, reqRes, configRes] = await Promise.all([
        fetch("/api/lessons", { headers }),
        fetch("/api/student/history", { headers }),
        fetch("/api/student/requests", { headers }),
        fetch("/api/config", { headers })
      ]);

      if (!lesRes.ok || !histRes.ok || !reqRes.ok || !configRes.ok) {
        throw new Error("Lỗi tải dữ liệu học tập từ máy chủ.");
      }

      const lesData = await lesRes.json();
      const histData = await histRes.json();
      const reqData = await reqRes.json();
      const configData = await configRes.json();

      setLessons(lesData);
      setHistory(histData.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      setRequests(reqData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSystemConfig(configData);
    } catch (err: any) {
      setError(err.message || "Không thể đồng bộ dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Synchronize student profile from backend when request might have been processed
  const handleSyncProfile = () => {
    onRefreshProfile();
    fetchData();
    showFeedback("Đã đồng bộ thông tin cấp học.");
  };

  // YouTube link parser
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Open Lesson details with direct security checks
  const handleOpenLesson = async (lessonId: string) => {
    setLessonLoading(true);
    setError(null);
    setSelectedLesson(null);
    setQuizAnswers({});
    setQuizResult(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể mở bài học.");
      }
      setSelectedLesson(data);
    } catch (err: any) {
      showFeedback(err.message, true);
    } finally {
      setLessonLoading(false);
    }
  };

  // Submit test
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    const totalQuestions = selectedLesson.quiz.length;
    const answersArray: number[] = [];
    
    // Validate all answered
    for (let i = 0; i < totalQuestions; i++) {
      const ans = quizAnswers[selectedLesson.quiz[i].id];
      if (ans === undefined) {
        showFeedback(`Vui lòng hoàn thành câu hỏi trắc nghiệm số ${i + 1}.`, true);
        return;
      }
      answersArray.push(ans);
    }

    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersArray })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gặp lỗi khi chấm điểm.");
      }

      setQuizResult({
        submitted: true,
        score: data.submission.score,
        passed: data.submission.passed,
        passingScore: data.passingScore,
        submission: data.submission
      });
      showFeedback(data.submission.passed ? "Chúc mừng bạn đã ĐẠT bài kiểm tra này!" : "Tiếc quá, bạn chưa đạt điểm tối thiểu. Hãy thử lại nhé!");
      fetchData(); // Refresh history
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // Request level-up to Admin
  const handleRequestLevelUp = async () => {
    if (user.level >= AccessLevel.L5) return;
    try {
      const res = await fetch("/api/student/request-levelup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu.");
      }
      showFeedback("Đã gửi yêu cầu thăng cấp thành công! Vui lòng chờ Super Admin phê duyệt.");
      fetchData();
    } catch (err: any) {
      showFeedback(err.message, true);
    }
  };

  // Levels for map loop
  const levelsArray = [
    AccessLevel.L1,
    AccessLevel.L2,
    AccessLevel.L3,
    AccessLevel.L4,
    AccessLevel.L5
  ];

  // Check if a specific level is unlocked for the user
  const isLevelUnlocked = (lvl: AccessLevel): boolean => {
    return user.level >= lvl;
  };

  // Latest pending request
  const pendingRequest = requests.find(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Học Viên Dashboard</h1>
              <p className="text-xs text-emerald-300/85">Cổng học tập & phân quyền 5 cấp</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-emerald-900/60 border border-emerald-800 rounded-xl px-3 py-1 text-xs font-semibold text-emerald-200 flex items-center gap-2">
              <span>Cấp học:</span>
              <strong className="text-white font-bold">{LevelNames[user.level]}</strong>
            </div>
            <button
              onClick={handleSyncProfile}
              title="Đồng bộ cấp học"
              className="p-1.5 bg-emerald-900/60 border border-emerald-800 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onLogout}
              className="py-1.5 px-3 bg-emerald-900 hover:bg-red-950 border border-emerald-800 hover:border-red-900 rounded-lg text-xs font-semibold text-emerald-100 hover:text-white transition-all cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left column: Level Navigation & Submissions History */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          
          {/* Level Progress Tracker Card */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/50 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tiến trình 5 Cấp học</h3>
              <p className="text-xs text-slate-500">Tất cả cấp độ đào tạo, cấp chưa mở khóa sẽ hiển thị khóa</p>
            </div>

            <div className="space-y-2">
              {levelsArray.map((lvl) => {
                const unlocked = isLevelUnlocked(lvl);
                const isCurrent = user.level === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedLevelFilter(lvl);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isCurrent 
                        ? "bg-emerald-50 border-emerald-200 shadow-xs" 
                        : selectedLevelFilter === lvl
                        ? "bg-slate-50 border-slate-300"
                        : "bg-white border-slate-200/60 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {unlocked ? (
                        <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 shrink-0">
                          <Unlock className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div>
                        <div className={`text-xs font-bold ${unlocked ? "text-slate-900" : "text-slate-400"}`}>
                          {LevelNames[lvl]}
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700">Cấp học hiện tại</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                );
              })}
            </div>

            {/* Level up action box */}
            {user.level < 5 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Sparkles className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs text-amber-900">
                    Bạn đã sẵn sàng để lên <strong>{LevelNames[(user.level + 1) as AccessLevel]}</strong>? Hãy hoàn thành các bài học bên dưới và gửi yêu cầu đến Admin.
                  </div>
                </div>

                {pendingRequest ? (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <span className="text-xs font-bold text-indigo-700 flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 bg-indigo-600 rounded-full animate-ping" />
                      Đang đợi phê duyệt từ Admin
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Yêu cầu nâng lên {LevelNames[pendingRequest.requestedLevel]} đang chờ duyệt.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestLevelUp}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Gửi yêu cầu thăng cấp ngay
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Level up Requests history / rejection notice */}
          {requests.length > 0 && (
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lịch sử yêu cầu thăng cấp
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {requests.map(req => (
                  <div key={req.id} className="p-2.5 rounded-xl border border-slate-100 text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Lên {LevelNames[req.requestedLevel]}</span>
                      {req.status === "pending" && <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm">Chờ duyệt</span>}
                      {req.status === "approved" && <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">Đã duyệt</span>}
                      {req.status === "rejected" && <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-sm">Từ chối</span>}
                    </div>
                    {req.comment && (
                      <div className="p-1.5 bg-slate-50 text-[11px] text-slate-600 italic rounded-md flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-slate-400" />
                        <span>"{req.comment}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Scores */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/50 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <History className="h-4 w-4" />
                Lịch sử bài test của bạn
              </h4>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Bạn chưa thực hiện bài kiểm tra trắc nghiệm nào.
                </p>
              ) : (
                history.map(hist => (
                  <div key={hist.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-50/40">
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 truncate">{hist.lessonTitle}</div>
                      <div className="text-[10px] text-slate-400">{new Date(hist.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-bold ${hist.passed ? "text-emerald-600" : "text-red-500"}`}>
                        {hist.score}%
                      </div>
                      <span className={`text-[9px] px-1 py-0.5 rounded-sm font-semibold ${hist.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {hist.passed ? "Đạt" : "Chưa Đạt"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right column: Main Workspace (Lesson selector or active Lesson viewer) */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          {/* Main Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-emerald-800">{success}</span>
            </div>
          )}

          {/* If a lesson is currently chosen to study */}
          {selectedLesson ? (
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/50 space-y-6">
              {/* Back to lessons list button */}
              <button
                onClick={() => setSelectedLesson(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                ← Quay lại danh sách bài học
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {LevelNames[selectedLesson.level]}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedLesson.title}
                </h2>
              </div>

              {/* YouTube Video Player Embed Section */}
              {getYouTubeEmbedUrl(selectedLesson.youtubeUrl) ? (
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedLesson.youtubeUrl)!}
                    title={selectedLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : selectedLesson.youtubeUrl ? (
                <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                  Không thể giải mã link video YouTube. Vui lòng bấm vào đây để xem trực tiếp: 
                  <a href={selectedLesson.youtubeUrl} target="_blank" rel="noreferrer" className="underline font-bold">Xem trên YouTube</a>
                </div>
              ) : null}

              {/* Lesson Theory Content Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Nội dung lý thuyết bài học
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.content}
                </div>
              </div>

              {/* Quiz Testing Section */}
              {selectedLesson.quiz && selectedLesson.quiz.length > 0 ? (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-4.5 w-4.5 text-emerald-600" />
                      Bài kiểm tra trắc nghiệm ({selectedLesson.quiz.length} câu)
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold">
                      Điểm đạt tối thiểu: <strong className="text-slate-950 font-bold">{systemConfig.passingScore}%</strong>
                    </span>
                  </div>

                  <form onSubmit={handleQuizSubmit} className="space-y-5">
                    {selectedLesson.quiz.map((q, qIdx) => {
                      const isAnswered = quizAnswers[q.id] !== undefined;
                      return (
                        <div key={q.id} className="p-4 bg-slate-50/60 border border-slate-200/60 rounded-2xl space-y-3">
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="text-emerald-700 font-bold mr-1">Câu {qIdx + 1}:</span>
                            {q.question}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[q.id] === oIdx;
                              const isCorrectAnswer = q.correctOptionIndex === oIdx;
                              
                              // Visual status styling after submission
                              let optionBg = "bg-white hover:bg-slate-50 border-slate-200 text-slate-800";
                              if (isSelected) {
                                optionBg = "bg-emerald-50 border-emerald-500 text-emerald-950 font-medium";
                              }

                              if (quizResult?.submitted) {
                                if (isCorrectAnswer) {
                                  optionBg = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold";
                                } else if (isSelected) {
                                  optionBg = "bg-red-100 border-red-500 text-red-950";
                                } else {
                                  optionBg = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  type="button"
                                  disabled={!!quizResult?.submitted}
                                  onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: oIdx })}
                                  key={oIdx}
                                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${optionBg}`}
                                >
                                  <span>
                                    <strong className="mr-1.5 uppercase font-mono">{String.fromCharCode(65 + oIdx)}.</strong>
                                    {opt}
                                  </span>
                                  {quizResult?.submitted && isCorrectAnswer && (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                                  )}
                                  {quizResult?.submitted && isSelected && !isCorrectAnswer && (
                                    <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {quizResult ? (
                      <div className={`p-5 rounded-2xl border text-center space-y-3 ${
                        quizResult.passed 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                          : "bg-red-50 border-red-200 text-red-900"
                      }`}>
                        <div className="flex justify-center">
                          {quizResult.passed ? (
                            <Award className="h-10 w-10 text-emerald-600 animate-bounce" />
                          ) : (
                            <AlertCircle className="h-10 w-10 text-red-500" />
                          )}
                        </div>
                        <h4 className="text-base font-bold">
                          Kết quả: {quizResult.score}% Điểm ({quizResult.passed ? "ĐẠT" : "CHƯA ĐẠT"})
                        </h4>
                        <p className="text-xs font-semibold max-w-md mx-auto leading-relaxed">
                          {quizResult.passed 
                            ? `Xuất sắc! Bạn đã vượt qua bài test trắc nghiệm thành công (Điểm tối thiểu cần đạt là ${quizResult.passingScore}%). Bạn có thể tiếp tục học bài học khác hoặc gửi yêu cầu xin thăng cấp nếu đã hoàn tất!`
                            : `Rất tiếc! Điểm số của bạn chưa đạt ngưỡng tối thiểu ${quizResult.passingScore}%. Hãy đọc lại lý thuyết và xem kỹ video hướng dẫn phía trên để làm lại bài nhé.`}
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizResult(null);
                            }}
                            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                          >
                            Làm lại bài test
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Nộp bài chấm điểm trực tiếp
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 text-indigo-800 text-xs rounded-xl flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                  Bài học này chỉ chứa lý thuyết & video, không yêu cầu làm bài kiểm tra trắc nghiệm.
                </div>
              )}
            </div>
          ) : (
            // Default list of lessons filtered by selectedLevelFilter
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/50 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {LevelNames[selectedLevelFilter]}
                </h3>
                <p className="text-xs text-slate-500">
                  {isLevelUnlocked(selectedLevelFilter) 
                    ? "Bạn đã mở khóa cấp học này. Chọn một bài học bên dưới để bắt đầu học tập." 
                    : "Cấp học này hiện đang bị khóa. Hãy hoàn thiện cấp hiện tại và gửi yêu cầu thăng cấp đến Admin để mở khóa."}
                </p>
              </div>

              {lessonLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {lessons.filter(l => l.level === selectedLevelFilter).length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      Chưa có nội dung bài học nào được thiết kế cho cấp học này.
                    </div>
                  ) : (
                    lessons.filter(l => l.level === selectedLevelFilter).map(lesson => {
                      const locked = lesson.isLocked || !isLevelUnlocked(selectedLevelFilter);
                      return (
                        <div
                          key={lesson.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            locked 
                              ? "bg-slate-50 border-slate-200 text-slate-400" 
                              : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80 hover:border-emerald-300 text-slate-800"
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                              {locked ? <Lock className="h-4 w-4 text-slate-400" /> : <Unlock className="h-4 w-4 text-emerald-600" />}
                              {lesson.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{lesson.content}</p>
                          </div>

                          <div className="self-end sm:self-center shrink-0">
                            {locked ? (
                              <span className="text-xs font-bold text-slate-400 bg-slate-200/60 px-3 py-1.5 rounded-xl border border-slate-200">
                                Đã bị khóa
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenLesson(lesson.id)}
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                Vào Học Ngay
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
