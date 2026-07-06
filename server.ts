import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AccessLevel, UserRole, User, Lesson, QuizSubmission, LevelUpRequest, SystemConfig } from "./src/types.js";

// Helper for file paths
const DB_FILE = path.join(process.cwd(), "db.json");

// Default database structure
interface Database {
  users: (User & { password?: string })[];
  lessons: Lesson[];
  quizSubmissions: QuizSubmission[];
  levelUpRequests: LevelUpRequest[];
  config: SystemConfig;
}

const defaultDb: Database = {
  users: [
    {
      id: "u-admin",
      username: "admin",
      fullName: "Super Admin",
      role: UserRole.ADMIN,
      level: AccessLevel.L5,
      isLocked: false,
      password: "admin",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-student1",
      username: "student1",
      fullName: "Nguyễn Văn Học",
      role: UserRole.STUDENT,
      level: AccessLevel.L1,
      isLocked: false,
      password: "123",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-student2",
      username: "student2",
      fullName: "Trần Thị Mai",
      role: UserRole.STUDENT,
      level: AccessLevel.L2,
      isLocked: false,
      password: "123",
      createdAt: new Date().toISOString()
    }
  ],
  lessons: [
    {
      id: "l-c1",
      title: "Cấp 1: Chào mừng Khách hàng mới (Customer Guide)",
      content: "Chào mừng bạn đến với Cấp 1! Ở bài học này chúng ta tìm hiểu quy định, giá trị cốt lõi và các cam kết phục vụ khách hàng chu đáo nhất.",
      level: AccessLevel.L1,
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      quiz: [
        {
          id: "q-1-1",
          question: "Đâu là ưu tiên hàng đầu của chúng tôi đối với Customer?",
          options: [
            "Lợi nhuận công ty",
            "Trải nghiệm và sự hài lòng của khách hàng",
            "Tốc độ bán hàng bất chấp chất lượng",
            "Tiết kiệm chi phí vận hành tối đa"
          ],
          correctOptionIndex: 1
        },
        {
          id: "q-1-2",
          question: "Cấp 1 của hệ thống LMS có tên gọi là gì?",
          options: [
            "Customer",
            "New starter",
            "Junior",
            "Senior"
          ],
          correctOptionIndex: 0
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "l-c2",
      title: "Cấp 2: Quy trình làm việc chuẩn cho Thành viên mới (New Starter)",
      content: "Nội dung bài học hướng dẫn cách làm việc phối hợp nội bộ, sử dụng công cụ quản lý công việc chuẩn và giao tiếp hiệu quả.",
      level: AccessLevel.L2,
      youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      quiz: [
        {
          id: "q-2-1",
          question: "Khi bắt đầu một nhiệm vụ mới, New starter cần làm gì trước tiên?",
          options: [
            "Tự ý quyết định mọi bước mà không cần hỏi",
            "Tìm hiểu quy trình chuẩn và trao đổi với quản lý trực tiếp",
            "Để nhiệm vụ đó trôi qua không cần làm",
            "Chờ đợi đến khi có người nhắc nhở nhiều lần"
          ],
          correctOptionIndex: 1
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "l-c3",
      title: "Cấp 3: Kỹ năng quản lý công việc của Junior",
      content: "Bài học cung cấp phương pháp quản lý thời gian, cách báo cáo tiến độ và chủ động xử lý các vấn đề phát sinh trong phạm vi công việc.",
      level: AccessLevel.L3,
      youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      quiz: [
        {
          id: "q-3-1",
          question: "Phương pháp báo cáo tiến độ công việc hiệu quả nhất là gì?",
          options: [
            "Im lặng cho đến khi hoàn thành xong toàn bộ",
            "Cập nhật định kỳ theo tiến độ và báo cáo ngay khi gặp khó khăn (blocker)",
            "Chỉ báo cáo khi quản lý yêu cầu gay gắt",
            "Đổ lỗi cho các thành viên khác khi chậm trễ"
          ],
          correctOptionIndex: 1
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "l-c4",
      title: "Cấp 4: Vai trò định hướng và Quản lý nhóm (Senior Level)",
      content: "Học phần đặc biệt huấn luyện về kỹ năng quản trị nhân sự, điều phối dự án và giải quyết mâu thuẫn trong đội ngũ.",
      level: AccessLevel.L4,
      youtubeUrl: "https://www.youtube.com/watch?v=X03_bNenrKQ",
      quiz: [
        {
          id: "q-4-1",
          question: "Khi xảy ra mâu thuẫn giữa các thành viên trong nhóm, một Senior nên giải quyết thế nào?",
          options: [
            "Bỏ qua xem như không có gì xảy ra",
            "Lắng nghe đa chiều từ các bên, tổ chức đối thoại cởi mở dựa trên tinh thần xây dựng",
            "Phạt nặng cả hai bên ngay lập tức không cần giải thích",
            "Đứng về phía người thân thiết hơn với mình"
          ],
          correctOptionIndex: 1
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "l-c5",
      title: "Cấp 5: Tầm nhìn Chiến lược và Lãnh đạo Cốt cán (Core Leader)",
      content: "Nội dung nâng cao nhất dành cho các vị trí quản trị cao cấp, hoạch định chiến lược kinh doanh và phát triển bền vững hệ thống.",
      level: AccessLevel.L5,
      youtubeUrl: "https://www.youtube.com/watch?v=tgbNymZ7vqY",
      quiz: [
        {
          id: "q-5-1",
          question: "Mục tiêu cốt lõi của một Core Leader là gì?",
          options: [
            "Chỉ làm việc cá nhân thật giỏi",
            "Đào tạo phát triển đội ngũ kế cận và hoạch định tương lai phát triển bền vững cho hệ thống",
            "Giữ kín mọi kinh nghiệm không chia sẻ cho ai",
            "Quản lý chi tiết từng lỗi nhỏ của nhân viên hàng ngày"
          ],
          correctOptionIndex: 1
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  quizSubmissions: [],
  levelUpRequests: [],
  config: {
    passingScore: 80
  }
};

// Database state management helper
function loadDb(): Database {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      return defaultDb;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning defaults", err);
    return defaultDb;
  }
}

function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to authenticate requests via Authorization header token (User ID is the token)
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const db = loadDb();
      const user = db.users.find(u => u.id === token);
      if (user) {
        if (user.isLocked) {
          return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa." });
        }
        (req as any).user = user;
      }
    }
    next();
  });

  // Helper to check role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập chức năng này (Yêu cầu Admin)." });
    }
    next();
  };

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập." });
    }
    next();
  };

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Authentication
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập." });
    }

    const db = loadDb();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: "Tên đăng nhập không đúng." });
    }

    if (user.isLocked) {
      return res.status(403).json({ error: "Tài khoản này đã bị khóa bởi Admin." });
    }

    // Verify simple password
    const expectedPassword = user.password || "123456";
    if (password !== expectedPassword) {
      return res.status(401).json({ error: "Mật khẩu không chính xác." });
    }

    // Return simple user info with "token" (which is their user ID)
    const { password: _, ...safeUser } = user;
    res.json({
      user: safeUser,
      token: user.id
    });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });

  // 2. System Config
  app.get("/api/config", requireAuth, (req, res) => {
    const db = loadDb();
    res.json(db.config);
  });

  app.post("/api/config", requireAuth, requireAdmin, (req, res) => {
    const { passingScore } = req.body;
    if (typeof passingScore !== "number" || passingScore < 0 || passingScore > 100) {
      return res.status(400).json({ error: "Điểm chốt đạt phải là số từ 0 đến 100." });
    }
    const db = loadDb();
    db.config.passingScore = passingScore;
    saveDb(db);
    res.json({ success: true, config: db.config });
  });

  // 3. Admin: Student Management
  app.get("/api/admin/students", requireAuth, requireAdmin, (req, res) => {
    const db = loadDb();
    const students = db.users
      .filter(u => u.role === UserRole.STUDENT)
      .map(({ password, ...u }) => u);
    res.json(students);
  });

  app.post("/api/admin/students", requireAuth, requireAdmin, (req, res) => {
    const { username, fullName, level, password, isLocked } = req.body;
    if (!username || !fullName) {
      return res.status(400).json({ error: "Thiếu thông tin tên đăng nhập hoặc họ tên học viên." });
    }

    const db = loadDb();
    const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống." });
    }

    const newStudent: User & { password?: string } = {
      id: "u-" + Date.now(),
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: UserRole.STUDENT,
      level: level || AccessLevel.L1,
      isLocked: !!isLocked,
      password: password || "123456",
      createdAt: new Date().toISOString()
    };

    db.users.push(newStudent);
    saveDb(db);

    const { password: _, ...safeStudent } = newStudent;
    res.json(safeStudent);
  });

  app.put("/api/admin/students/:id", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { fullName, level, password, isLocked, username } = req.body;

    const db = loadDb();
    const userIndex = db.users.findIndex(u => u.id === id && u.role === UserRole.STUDENT);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy học viên." });
    }

    // If changing username, check duplicates
    if (username) {
      const cleanUsername = username.toLowerCase().trim();
      const duplicate = db.users.find(u => u.id !== id && u.username.toLowerCase() === cleanUsername);
      if (duplicate) {
        return res.status(400).json({ error: "Tên đăng nhập mới đã tồn tại." });
      }
      db.users[userIndex].username = cleanUsername;
    }

    if (fullName !== undefined) db.users[userIndex].fullName = fullName.trim();
    if (level !== undefined) db.users[userIndex].level = level;
    if (password !== undefined && password !== "") db.users[userIndex].password = password;
    if (isLocked !== undefined) db.users[userIndex].isLocked = isLocked;

    saveDb(db);

    const { password: _, ...safeStudent } = db.users[userIndex];
    res.json(safeStudent);
  });

  app.delete("/api/admin/students/:id", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = loadDb();
    const index = db.users.findIndex(u => u.id === id && u.role === UserRole.STUDENT);
    if (index === -1) {
      return res.status(404).json({ error: "Không tìm thấy học viên." });
    }

    db.users.splice(index, 1);
    // clean up student's submissions and requests
    db.quizSubmissions = db.quizSubmissions.filter(s => s.studentId !== id);
    db.levelUpRequests = db.levelUpRequests.filter(r => r.studentId !== id);

    saveDb(db);
    res.json({ success: true });
  });

  // 4. Admin: Quiz submissions monitoring
  app.get("/api/admin/submissions", requireAuth, requireAdmin, (req, res) => {
    const db = loadDb();
    res.json(db.quizSubmissions);
  });

  // 5. Admin: Level-up Requests monitoring
  app.get("/api/admin/requests", requireAuth, requireAdmin, (req, res) => {
    const db = loadDb();
    res.json(db.levelUpRequests);
  });

  app.post("/api/admin/requests/:id/approve", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;

    const db = loadDb();
    const requestIndex = db.levelUpRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Yêu cầu nâng cấp không tồn tại." });
    }

    const request = db.levelUpRequests[requestIndex];
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Yêu cầu này đã được xử lý từ trước." });
    }

    // Approve logic
    request.status = "approved";
    request.processedAt = new Date().toISOString();
    request.comment = comment || "Đã phê duyệt lên cấp thành công.";

    // Update student's actual level
    const studentIndex = db.users.findIndex(u => u.id === request.studentId);
    if (studentIndex !== -1) {
      db.users[studentIndex].level = request.requestedLevel;
    }

    saveDb(db);
    res.json({ success: true, request });
  });

  app.post("/api/admin/requests/:id/reject", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;

    const db = loadDb();
    const requestIndex = db.levelUpRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Yêu cầu nâng cấp không tồn tại." });
    }

    const request = db.levelUpRequests[requestIndex];
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Yêu cầu này đã được xử lý từ trước." });
    }

    request.status = "rejected";
    request.processedAt = new Date().toISOString();
    request.comment = comment || "Yêu cầu bị từ chối.";

    saveDb(db);
    res.json({ success: true, request });
  });

  // 6. Lessons & Quizzes (Shared list, detailed with backend authorization check)
  app.get("/api/lessons", requireAuth, (req: any, res) => {
    const db = loadDb();
    // All users see all 5 levels of lessons, but wait, the prompt says:
    // "Tất cả học viên đều thấy đủ 5 cấp."
    // "Cấp chưa được quyền vẫn hiển thị nhưng bị khóa."
    // "Học viên được cấp quyền đến cấp nào thì xem được nội dung từ Cấp 1 đến cấp đó."
    // So the list of lessons is returned with the quiz details and video link scrubbed/hidden if they don't have access!
    // This protects data over the network while allowing them to see the lesson exists.
    const isStudent = req.user.role === UserRole.STUDENT;
    const studentLevel = req.user.level;

    const safeLessons = db.lessons.map(lesson => {
      const isLocked = isStudent && lesson.level > studentLevel;
      if (isLocked) {
        // Scrub content and test details to prevent leaking
        return {
          id: lesson.id,
          title: lesson.title,
          level: lesson.level,
          isLocked: true,
          createdAt: lesson.createdAt
        };
      } else {
        return {
          ...lesson,
          isLocked: false
        };
      }
    });

    res.json(safeLessons);
  });

  // Detail lesson check (Direct link protection!)
  app.get("/api/lessons/:id", requireAuth, (req: any, res) => {
    const { id } = req.params;
    const db = loadDb();
    const lesson = db.lessons.find(l => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: "Không tìm thấy bài học." });
    }

    // Backend Permission Check: Ensure direct links to unauthorized levels are blocked
    const isStudent = req.user.role === UserRole.STUDENT;
    if (isStudent && lesson.level > req.user.level) {
      return res.status(403).json({
        error: "Bạn không có quyền truy cập bài học này. Vui lòng hoàn thành các bài học ở cấp hiện tại và xin nâng cấp.",
        isLocked: true
      });
    }

    res.json(lesson);
  });

  // Admin Create/Edit/Delete Lessons
  app.post("/api/lessons", requireAuth, requireAdmin, (req, res) => {
    const { title, content, level, youtubeUrl, quiz } = req.body;
    if (!title || !content || !level) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ Tiêu đề, Nội dung và Cấp độ bài học." });
    }

    const db = loadDb();
    const newLesson: Lesson = {
      id: "l-" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      level: parseInt(level),
      youtubeUrl: youtubeUrl || "",
      quiz: Array.isArray(quiz) ? quiz.map((q: any, i: number) => ({
        id: "q-" + Date.now() + "-" + i,
        question: q.question,
        options: q.options || [],
        correctOptionIndex: parseInt(q.correctOptionIndex) || 0
      })) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.lessons.push(newLesson);
    saveDb(db);
    res.json(newLesson);
  });

  app.put("/api/lessons/:id", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, content, level, youtubeUrl, quiz } = req.body;

    const db = loadDb();
    const index = db.lessons.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Bài học không tồn tại." });
    }

    if (title !== undefined) db.lessons[index].title = title.trim();
    if (content !== undefined) db.lessons[index].content = content.trim();
    if (level !== undefined) db.lessons[index].level = parseInt(level);
    if (youtubeUrl !== undefined) db.lessons[index].youtubeUrl = youtubeUrl;
    if (quiz !== undefined) {
      db.lessons[index].quiz = quiz.map((q: any, i: number) => ({
        id: q.id || ("q-" + Date.now() + "-" + i),
        question: q.question,
        options: q.options || [],
        correctOptionIndex: parseInt(q.correctOptionIndex) || 0
      }));
    }
    db.lessons[index].updatedAt = new Date().toISOString();

    saveDb(db);
    res.json(db.lessons[index]);
  });

  app.delete("/api/lessons/:id", requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = loadDb();
    const index = db.lessons.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Bài học không tồn tại." });
    }

    db.lessons.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  });

  // 7. Student Quiz Submission
  app.post("/api/lessons/:id/submit", requireAuth, (req: any, res) => {
    const { id } = req.params;
    const { answers } = req.body; // e.g. [1, 0, 2]

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Câu trả lời không hợp lệ." });
    }

    const db = loadDb();
    const lesson = db.lessons.find(l => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: "Không tìm thấy bài học." });
    }

    // Backend authorization check
    if (req.user.role === UserRole.STUDENT && lesson.level > req.user.level) {
      return res.status(403).json({ error: "Bạn không thể làm kiểm tra của cấp chưa được mở khóa." });
    }

    // Auto-grade
    let correctCount = 0;
    const questions = lesson.quiz;
    if (questions.length === 0) {
      return res.status(400).json({ error: "Bài học này không có bài test trắc nghiệm." });
    }

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= db.config.passingScore;

    const submission: QuizSubmission = {
      id: "sub-" + Date.now(),
      studentId: req.user.id,
      studentName: req.user.fullName,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      level: lesson.level,
      answers,
      score,
      passed,
      submittedAt: new Date().toISOString()
    };

    db.quizSubmissions.push(submission);
    saveDb(db);

    res.json({
      success: true,
      submission,
      passingScore: db.config.passingScore
    });
  });

  // 8. Student level-up requests
  app.get("/api/student/requests", requireAuth, (req: any, res) => {
    const db = loadDb();
    const requests = db.levelUpRequests.filter(r => r.studentId === req.user.id);
    res.json(requests);
  });

  app.post("/api/student/request-levelup", requireAuth, (req: any, res) => {
    const db = loadDb();
    const student = req.user;

    if (student.role !== UserRole.STUDENT) {
      return res.status(400).json({ error: "Chỉ học viên mới được quyền xin lên cấp." });
    }

    if (student.level >= AccessLevel.L5) {
      return res.status(400).json({ error: "Bạn đang ở cấp cao nhất (Cấp 5: Core leader)." });
    }

    // Check if there is already a pending request
    const pendingRequest = db.levelUpRequests.find(r => r.studentId === student.id && r.status === "pending");
    if (pendingRequest) {
      return res.status(400).json({ error: "Bạn đang có một yêu cầu xin lên cấp chờ Admin phê duyệt." });
    }

    const requestedLevel = (student.level + 1) as AccessLevel;

    const newRequest: LevelUpRequest = {
      id: "req-" + Date.now(),
      studentId: student.id,
      studentName: student.fullName,
      currentLevel: student.level,
      requestedLevel,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    db.levelUpRequests.push(newRequest);
    saveDb(db);

    res.json({ success: true, request: newRequest });
  });

  app.get("/api/student/history", requireAuth, (req: any, res) => {
    const db = loadDb();
    const history = db.quizSubmissions.filter(s => s.studentId === req.user.id);
    res.json(history);
  });

  // --- DEV & PRODUCTION BUILD CONFIGURATION ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LMS SERVER] running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start fullstack server", error);
});
