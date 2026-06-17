# Educare Connect

Hệ thống quản lý can thiệp sớm toàn diện cho trẻ em có nhu cầu đặc biệt, gồm backend **Odoo 17** và ứng dụng di động đa nền tảng **React Native / Expo**. Hệ thống hỗ trợ quy trình lập kế hoạch IEP (Individualized Education Program), ghi nhật ký buổi học, theo dõi tiến độ theo từng mục tiêu, và giao tiếp trực tiếp với phụ huynh.

---

## Kiến trúc tổng quan

```
Odoo 17 Backend (9 addons)
│
├── educare_base           ← Dữ liệu nền, master data
├── educare_security       ← Phân quyền, vai trò, audit log
├── educare_student        ← Hồ sơ học sinh (Single source of truth)
├── educare_iep            ← Kế hoạch IEP, mục tiêu LTG/STO, thư viện STO
├── educare_session        ← Nhật ký buổi học, kết quả trial
├── educare_reporting      ← Báo cáo hàng ngày gửi phụ huynh
├── educare_chat           ← Chat 1-1 giữa giáo viên và phụ huynh
├── educare_notification   ← Hệ thống thông báo đẩy (Expo Push) và in-app
└── educare_ai_assistant   ← Cầu nối AI agent cho mobile app
         │
         │  JSON-RPC over HTTP
         ▼
EduCareConnect/ (React Native + Expo SDK ~54)
├── Teacher Flow  ← Quản lý học sinh, session, IEP, báo cáo, chat, AI
└── Parent Flow   ← Xem tiến độ con, báo cáo, lịch học, chat với giáo viên
```

---

## Luồng dữ liệu cốt lõi

```
Học sinh (educare.student)
  └─► Kế hoạch IEP (educare.iep.plan)  [tối đa 1 plan active/học sinh]
        └─► Mục tiêu dài hạn — LTG (educare.iep.goal)
              └─► Mục tiêu ngắn hạn — STO (educare.iep.objective)
                    │
                    │  Buổi học được tiến hành
                    ▼
              Nhật ký buổi học (educare.session.log)
                    └─► Kết quả trial (educare.session.result)
                          │
                          ├─► Cập nhật % chính xác & xu hướng tiến độ STO
                          └─► Báo cáo hàng ngày (educare.daily.report) → gửi phụ huynh
```

---

## Mô hình phân quyền

| Vai trò        | Phạm vi truy cập                                                       |
| -------------- | ---------------------------------------------------------------------- |
| **Admin**      | Toàn quyền hệ thống, mọi bản ghi                                       |
| **Supervisor** | Toàn bộ học sinh và hoạt động trong trung tâm của mình                 |
| **Teacher**    | Học sinh được giao trực tiếp (`assigned_teacher_id`, `co_teacher_ids`) |
| **Parent**     | Chỉ xem báo cáo, IEP, tiến độ của con mình (`parent_user_id`)          |

Phân quyền được thực thi đồng thời ở hai tầng: **Odoo Security Groups** (model-level) và **Record Rules** (row-level). Thay đổi quyền ở một tầng không đủ — phải cập nhật cả hai.

---

## Các module backend (Odoo 17)

### `educare_base` — Dữ liệu nền

Module nền tảng, không chứa business logic, phục vụ toàn bộ hệ thống.

| Model               | Mục đích                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `educare.center`    | Thông tin chi nhánh/trung tâm, địa chỉ, thành phố                                                                       |
| `educare.diagnosis` | Danh mục chẩn đoán ICD-10/DSM-5 (ASD, ADHD, Down, Bại não…)                                                             |
| `educare.domain`    | Lĩnh vực phát triển: Giao tiếp, Nhận thức, Vận động thô, Vận động tinh, Xã hội, Tự phục vụ, Hành vi, Học tập, Thích ứng |

---

### `educare_security` — Phân quyền & Kiểm toán

Quản lý danh tính, vai trò và lịch sử truy cập.

| Model                  | Mục đích                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| `educare.user.profile` | Hồ sơ người dùng mở rộng từ `res.users`: lưu role, center, trạng thái tài khoản |
| `educare.audit.log`    | Ghi lại mọi thao tác quan trọng theo mixin pattern                              |

**Luồng phân quyền**: khi `role` thay đổi trên `educare.user.profile`, module tự động đồng bộ user vào đúng Odoo Security Group (`educare_admin`, `educare_supervisor`, `educare_teacher`, `educare_parent`).

---

### `educare_student` — Hồ sơ học sinh

Nguồn thông tin duy nhất (single source of truth) cho mọi dữ liệu liên quan đến học sinh.

**Các nhóm thông tin chính trên `educare.student`:**

- **Định danh**: họ tên, ngày sinh, giới tính, ảnh
- **Phân công**: `assigned_teacher_id`, `co_teacher_ids`, `supervisor_id`, `center_id`, `parent_user_id`
- **Lâm sàng**: chẩn đoán chính/phụ, mức độ nặng, các điều kiện kèm theo
- **Hành vi**: hành vi thách thức, biện pháp can thiệp, công cụ hỗ trợ giao tiếp
- **Đánh giá**: bộ đánh giá phát triển ban đầu và các lần tái đánh giá

> Các module downstream (`educare_iep`, `educare_session`, `educare_reporting`) đều tham chiếu về `educare.student` thay vì tự duy trì assignment riêng.

---

### `educare_iep` — Kế hoạch giáo dục cá nhân

Triển khai toàn bộ quy trình lập kế hoạch IEP theo chuẩn SMART.

#### Cấu trúc phân cấp

```
educare.iep.plan  (1 active plan / học sinh)
  └── educare.iep.goal  [LTG — Long-Term Goal]
        └── educare.iep.objective  [STO — Short-Term Objective]
```

#### Workflow kế hoạch

| Trạng thái | Ý nghĩa                                                  |
| ---------- | -------------------------------------------------------- |
| `draft`    | Giáo viên đang soạn thảo                                 |
| `active`   | Đang triển khai; toàn bộ session result ghi vào plan này |
| `closed`   | Kết thúc (thủ công hoặc tự động khi tất cả LTG mastered) |

**Ràng buộc quan trọng**: mỗi học sinh chỉ được có 1 `active` plan tại một thời điểm. Khi activate plan mới, plan cũ tự động closed.

#### Các model hỗ trợ

| Model                            | Vai trò                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `educare.iep.framework`          | Khung chương trình (VD-EIBI, ABA, TEACHH)                                               |
| `educare.iep.priority`           | Mức độ ưu tiên mục tiêu                                                                 |
| `educare.iep.prompt.level`       | Cấp độ nhắc nhở (Independent, Verbal, Gestural, Physical…)                              |
| `educare.iep.probe.method`       | Phương pháp đo lường (DTT, NET, Probe, Observation)                                     |
| `educare.iep.objective.template` | Thư viện STO mẫu theo lĩnh vực và độ tuổi — giáo viên clone vào plan thay vì tạo từ đầu |

#### Tính toán tiến độ

- **STO**: `current_accuracy` tính từ tổng hợp `session.result` trong kỳ active
- **LTG**: % tiến độ là trung bình có trọng số từ các STO con
- **Plan**: % tổng thể tính theo trọng số LTG

---

### `educare_session` — Nhật ký buổi học

Ghi nhận đầy đủ quá trình diễn ra buổi học và kết quả từng mục tiêu.

#### `educare.session.log` — Nhật ký buổi

| Trường                           | Mô tả                                                      |
| -------------------------------- | ---------------------------------------------------------- |
| `student_id`, `teacher_id`       | Học sinh và giáo viên thực hiện                            |
| `date`, `start_time`, `end_time` | Thời gian buổi học                                         |
| `state`                          | `draft` → `scheduled` → `completed` → `done` / `cancelled` |
| `mood`, `energy_level`           | Trạng thái học sinh đầu buổi (hỗ trợ phân tích xu hướng)   |
| `session_note`                   | Ghi chú tự do của giáo viên                                |

#### `educare.session.result` — Kết quả per-objective

Mỗi `session.log` có nhiều `session.result`, mỗi result ứng với 1 STO được thực hành trong buổi.

| Trường                           | Mô tả                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `objective_id`                   | STO được thực hiện                                                                 |
| `correct_trials`, `total_trials` | Số trial đúng / tổng số trial                                                      |
| `accuracy_percent`               | Tính tự động: `correct / total × 100`                                              |
| `prompt_level_id`                | Mức nhắc nhở đã dùng                                                               |
| `teaching_method`                | Phương pháp: DTT (Discrete Trial Training) hoặc NET (Natural Environment Training) |
| `trend`                          | Xu hướng: `improving`, `stable`, `declining` (so với session trước)                |

Dữ liệu từ `session.result` là đầu vào trực tiếp để cập nhật `current_accuracy` và `progress_trend` trên `educare.iep.objective`.

---

### `educare_reporting` — Báo cáo hàng ngày

Chuyển đổi kết quả buổi học thành thông điệp thân thiện, dễ hiểu cho phụ huynh.

#### `educare.daily.report`

| Trạng thái | Ý nghĩa                                            |
| ---------- | -------------------------------------------------- |
| `draft`    | Giáo viên đang viết                                |
| `sent`     | Đã gửi đến phụ huynh (email + mobile notification) |
| `read`     | Phụ huynh đã đọc trên app                          |

**Ràng buộc**: mỗi `session.log` chỉ được gắn với tối đa 1 `daily.report` (unique constraint `session_log_id`).

**Giao tiếp phụ huynh**: khi trạng thái chuyển sang `sent`, hệ thống gửi email template đến `student.parent_user_id` và kích hoạt push notification qua `educare_notification`.

---

### `educare_chat` — Chat giáo viên ↔ phụ huynh

Hệ thống chat 1-1 theo cặp (per-pair conversation), dùng polling-based delivery.

| Model                       | Mô tả                                        |
| --------------------------- | -------------------------------------------- |
| `educare.chat.conversation` | Hội thoại giữa 2 user (giáo viên–phụ huynh)  |
| `educare.chat.message`      | Nội dung tin nhắn, timestamp, trạng thái đọc |

Module tích hợp với `educare_notification` để phát sinh badge và banner khi có tin nhắn mới. Mobile app polling endpoint `/api/chat/unread-count` để hiển thị số chưa đọc theo thời gian thực.

---

### `educare_notification` — Thông báo đẩy & in-app

Hệ thống thông báo đa kênh (push notification qua Expo Push + in-app log).

| Model                  | Mô tả                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `educare.notification` | Bản ghi mỗi thông báo: tiêu đề, nội dung, loại, trạng thái đọc |
| `educare.device.token` | Lưu Expo Push Token của từng thiết bị đã đăng ký               |

**4 sự kiện kích hoạt thông báo:**

1. Báo cáo hàng ngày được gửi (`daily_report.sent`) — gửi đến phụ huynh
2. Kế hoạch IEP được phê duyệt — gửi đến giáo viên
3. STO đạt mastery — gửi đến supervisor
4. Tin nhắn chat mới — gửi đến người nhận

Module lắng nghe qua các `inherit_*` model (`inherit_daily_report.py`, `inherit_iep_plan.py`, `inherit_iep_objective.py`, `inherit_session_log.py`) để hook vào workflow tương ứng.

---

### `educare_ai_assistant` — Trợ lý AI

Lớp cầu nối mỏng (thin bridge) giữa mobile app và Odoo AI agent, không có models hay views riêng.

**Chức năng**: nhận request từ mobile qua 3 JSON-RPC endpoint (`/api/ai/session`, `/api/ai/messages`, `/api/ai/send`), routing đến đúng `ai.agent` được cấu hình qua `ai_mobile_tools`, trả kết quả về mobile.

Giáo viên và phụ huynh có thể đặt câu hỏi về tiến độ học sinh, gợi ý hoạt động, hoặc hỏi về kế hoạch IEP trực tiếp trong app mà không cần truy cập Odoo web client.

---

## Ứng dụng di động (EduCareConnect)

### Công nghệ

| Thành phần        | Phiên bản / Thư viện                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Framework         | React Native 0.81 + Expo SDK ~54                                     |
| Ngôn ngữ          | TypeScript ~5.9                                                      |
| Server state      | TanStack Query v5 + query persistence (MMKV)                         |
| Client state      | Zustand v5 (`authStore`, `evalStore`, `parentStore`)                 |
| Navigation        | React Navigation v7 (Native Stack + Bottom Tabs + Material Top Tabs) |
| UI components     | React Native Paper v5 (Material Design 3)                            |
| Forms             | React Hook Form + Zod validation                                     |
| Charts            | react-native-gifted-charts, Victory Native, Skia                     |
| Animations        | React Native Reanimated v4 + Lottie                                  |
| Secure storage    | expo-secure-store (session cookie), MMKV (query cache)               |
| Push notification | expo-notifications (nhận) + Expo Push API (gửi từ backend)           |
| HTTP client       | Axios + JSON-RPC wrapper (`odooClient.ts`)                           |

---

### Kiến trúc API layer

Mọi giao tiếp backend đi qua `src/api/odooClient.ts`, xử lý:

- Gọi `POST /web/dataset/call_kw` (Odoo model methods)
- Gọi custom REST routes qua `callJsonRoute()`
- Tự động đính kèm session cookie từ `expo-secure-store`
- Trả về typed response

| File API             | Domain                                                |
| -------------------- | ----------------------------------------------------- |
| `authApi.ts`         | Đăng nhập, đăng xuất, session                         |
| `profileApi.ts`      | Lấy vai trò, thông tin `educare.user.profile`         |
| `studentApi.ts`      | Danh sách và chi tiết học sinh                        |
| `iepApi.ts`          | Kế hoạch IEP, LTG, STO                                |
| `sessionApi.ts`      | Nhật ký buổi học, tạo/cập nhật session                |
| `evalApi.ts`         | Ghi kết quả trial, kết thúc buổi học                  |
| `reportApi.ts`       | Tạo và xem báo cáo hàng ngày                          |
| `parentApi.ts`       | Thông tin con, lịch học, báo cáo (góc nhìn phụ huynh) |
| `chatApi.ts`         | Danh sách hội thoại, gửi/nhận tin nhắn                |
| `notificationApi.ts` | Danh sách thông báo, đánh dấu đã đọc                  |
| `aiChatApi.ts`       | Khởi tạo AI session, gửi/nhận tin nhắn AI             |
| `queryClient.ts`     | Cấu hình TanStack QueryClient, retry, stale time      |
| `queryKeys.ts`       | Tập trung toàn bộ query key factory                   |
| `queryPersister.ts`  | Persist query cache xuống MMKV để offline access      |

---

### Luồng màn hình — Teacher

```
Auth (LoginScreen)
  └─► Teacher Navigator (Bottom Tabs)
        ├── Students Tab
        │     ├── StudentListScreen      ← danh sách học sinh được giao
        │     └── StudentDetailScreen    ← hồ sơ đầy đủ (Profile / Session / IEP / Report tabs)
        │
        ├── Sessions Tab
        │     ├── SessionListScreen      ← lịch buổi học, lọc theo trạng thái
        │     ├── SessionDetailScreen    ← chi tiết buổi học
        │     ├── SessionCreateScreen    ← tạo buổi học mới
        │     ├── EvalObjectiveScreen    ← ghi kết quả trial theo từng STO
        │     └── EvalConfirmScreen      ← xác nhận kết thúc, phát hiện IEP hoàn thành
        │
        ├── Reports Tab
        │     ├── ReportListScreen       ← danh sách báo cáo đã tạo
        │     ├── ReportDetailScreen     ← xem báo cáo
        │     ├── ReportCreateScreen     ← tạo báo cáo mới từ session
        │     └── SessionPickerScreen    ← chọn session chưa có báo cáo
        │
        ├── IEP Tab
        │     ├── IepPlanDetailScreen    ← toàn bộ kế hoạch: goal list, % tiến độ tổng thể
        │     └── IepObjectiveDetailScreen ← chi tiết STO: biểu đồ xu hướng, lịch sử session
        │
        ├── Chat & Notifications
        │     ├── ConversationListScreen ← danh sách hội thoại
        │     ├── ChatRoomScreen         ← giao tiếp 1-1 với phụ huynh
        │     ├── NotificationListScreen ← thông báo hệ thống
        │     └── AiChatScreen           ← chat với AI assistant
        │
        └── Profile Tab
```

**Điểm nổi bật — `EvalConfirmScreen`**: Màn hình kết thúc buổi học hiển thị thẻ kết quả per-objective, accuracy hero card, và luồng xử lý IEP completion 3 bước khi phát hiện tất cả STO đã mastered (celebration modal → xác nhận maintenance mode → kết thúc IEP hoặc tiếp tục).

---

### Luồng màn hình — Parent

```
Auth (LoginScreen)
  └─► Parent Navigator (Bottom Tabs)
        ├── Home Tab
        │     ├── ParentHomeScreen       ← tổng quan con, upcoming session, báo cáo mới nhất
        │     └── ChildSelectorModal     ← chọn con (nếu có nhiều con)
        │
        ├── Child Tab
        │     ├── ChildListScreen        ← danh sách con
        │     ├── ChildProfileScreen     ← hồ sơ con (Profile / Progress / Timetable tabs)
        │     │     ├── ChildProfileTab  ← thông tin, chẩn đoán
        │     │     └── ChildProgressTab ← biểu đồ tiến độ theo lĩnh vực
        │     └── ChildTimetableScreen   ← lịch buổi học trong tuần
        │
        ├── Reports Tab
        │     ├── ParentReportListScreen ← danh sách báo cáo nhận được
        │     └── ParentReportDetailScreen ← nội dung báo cáo, trạng thái đọc
        │
        ├── IEP Tab
        │     └── ChildIepHistoryScreen  ← lịch sử kế hoạch IEP của con
        │
        ├── Chat Tab
        │     └── ChatRoomScreen         ← nhắn tin với giáo viên
        │
        └── Profile Tab
```

---

### State management

| Store                   | Nội dung quản lý                                                         |
| ----------------------- | ------------------------------------------------------------------------ |
| `authStore` (Zustand)   | Session user, role, center_id, auth state                                |
| `evalStore` (Zustand)   | Trạng thái tạm thời trong luồng evaluation (trial data trước khi submit) |
| `parentStore` (Zustand) | `selectedChildId` cho phụ huynh có nhiều con                             |
| TanStack Query          | Tất cả server data: caching, refetch, mutation, optimistic update        |

**Offline persistence**: TanStack Query cache được persist xuống MMKV thông qua `queryPersister.ts`. App hiển thị dữ liệu cached khi offline và sync khi có kết nối trở lại (`useOnlineStatus` + `useRequireOnline`).

---

### Custom hooks

| Hook                           | Chức năng                                             |
| ------------------------------ | ----------------------------------------------------- |
| `useStudents`                  | Danh sách và chi tiết học sinh với caching            |
| `useSessions`                  | Session list, create, update, state transitions       |
| `useEval`                      | Ghi trial data, submit kết quả, detect IEP completion |
| `useIep`                       | Plan, goal, objective data và mutations               |
| `useReports`                   | Tạo và đọc daily report                               |
| `useParent`                    | API cho parent flow (child data, timetable)           |
| `useChat`                      | Conversation list, send/receive messages              |
| `useNotification`              | Notification list, mark as read                       |
| `useAiChat`                    | AI session management, message exchange               |
| `usePushRegistration`          | Đăng ký Expo Push Token lên backend                   |
| `useLocalNotificationFallback` | Hiển thị local notification khi app foreground        |
| `useOnlineStatus`              | Theo dõi trạng thái kết nối mạng                      |

---

## Tác giả

Hao Tran — haotranhcmus@gmail.com

License: LGPL-3
