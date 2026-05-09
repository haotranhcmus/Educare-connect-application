# Educare Connect

Hệ thống quản lý can thiệp sớm cho trẻ em có nhu cầu đặc biệt, gồm backend **Odoo 17** và ứng dụng di động **React Native / Expo**.

---

## Tổng quan kiến trúc

```
educare_connect/
├── addons/                      # Odoo 17 backend modules
│   ├── educare_base/            # Dữ liệu nền: trung tâm, chẩn đoán, lĩnh vực, mẫu bài học
│   ├── educare_security/        # Phân quyền: Admin, Supervisor, Teacher, Parent
│   ├── educare_student/         # Hồ sơ học sinh, người giám hộ, đánh giá
│   ├── educare_iep/             # Kế hoạch IEP, mục tiêu LTG/STO, thư viện mẫu
│   ├── educare_session/         # Nhật ký buổi học & kết quả trial
│   └── educare_reporting/       # Báo cáo hàng ngày gửi phụ huynh
└── EduCareConnect/              # React Native / Expo mobile app
    └── src/
        ├── api/                 # Odoo JSON-RPC API clients
        ├── components/          # Shared UI components
        ├── hooks/               # TanStack Query hooks
        ├── navigation/          # React Navigation stacks
        ├── screens/             # Màn hình (teacher/, parent/, auth/)
        ├── store/               # Zustand state (authStore)
        ├── theme/               # Màu sắc, typography, status colors
        └── types/               # TypeScript types & enums
```

---

## Luồng dữ liệu chính

```
Học sinh ──► Hồ sơ học sinh (Student Profile)
         ──► Kế hoạch IEP (active, tối đa 1 plan/học sinh)
               ──► Mục tiêu dài hạn — LTG (educare.iep.goal)
                     ──► Mục tiêu ngắn hạn — STO (educare.iep.objective)
         ──► Buổi học (Session Log)
               ──► Kết quả trial (Session Result)  ──► cập nhật % tiến độ STO
               ──► Báo cáo hàng ngày (Daily Report) ──► gửi phụ huynh
```

---

## Cài đặt Backend (Odoo 17)

### Yêu cầu hệ thống

| Thành phần   | Phiên bản  |
|--------------|------------|
| Python       | 3.12+      |
| PostgreSQL   | 14+        |
| Odoo         | 17 Community |

### Thiết lập lần đầu

```bash
# 1. Vào thư mục Odoo root
cd /home/haotranhcmus/odoo17

# 2. Kích hoạt virtual environment
source venv/bin/activate

# 3. Tạo database
createdb -U haotranhcmus educare

# 4. Cài đặt tất cả modules với seed data
python3 odoo-bin -c odoo.conf -d educare \
  -i base,educare_base,educare_security,educare_student,educare_iep,educare_session,educare_reporting \
  --stop-after-init
```

### Reset database (cài lại từ đầu)

```bash
# Ngắt kết nối hiện có và xoá DB
psql -U haotranhcmus -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='educare';"
dropdb -U haotranhcmus educare
createdb -U haotranhcmus educare

# Cài lại toàn bộ
python3 odoo-bin -c odoo.conf -d educare \
  -i base,educare_base,educare_security,educare_student,educare_iep,educare_session,educare_reporting \
  --stop-after-init
```

### Cập nhật một module

```bash
python3 odoo-bin -c odoo.conf -d educare -u <tên_module> --stop-after-init
```

### Khởi động server

```bash
python3 odoo-bin -c odoo.conf -d educare
# Odoo chạy tại: http://localhost:8069
```

---

## Tài khoản demo

Sau khi cài đặt, các tài khoản mẫu đã được tạo sẵn (`noupdate="1"`):

| Vai trò           | Email                           | Mật khẩu       |
|-------------------|---------------------------------|----------------|
| Admin             | admin.educare@example.com       | Admin@123      |
| Giám sát HCM      | supervisor.hcm@example.com      | Supervisor@123 |
| Giám sát Hà Nội   | supervisor.hanoi@example.com    | Supervisor@123 |
| Giáo viên HCM 01  | teacher.hcm01@example.com       | Teacher@123    |
| Giáo viên HCM 02  | teacher.hcm02@example.com       | Teacher@123    |
| Giáo viên HCM 03  | teacher.hcm03@example.com       | Teacher@123    |
| Giáo viên HN 01   | teacher.hanoi01@example.com     | Teacher@123    |
| Giáo viên HN 02   | teacher.hanoi02@example.com     | Teacher@123    |
| Phụ huynh 01      | parent01@example.com            | Parent@123     |
| Phụ huynh 02      | parent02@example.com            | Parent@123     |
| Phụ huynh 03      | parent03@example.com            | Parent@123     |
| Phụ huynh 04      | parent04@example.com            | Parent@123     |

> ⚠️ Mật khẩu demo yếu — **không dùng trong môi trường production**.

---

## Mô tả các module Odoo

### `educare_base`
Dữ liệu nền của toàn hệ thống:
- **`educare.center`** — thông tin chi nhánh/trung tâm, địa chỉ
- **`educare.diagnosis`** — danh mục ICD-10/DSM-5 (ASD, ADHD, Down syndrome…)
- **`educare.domain`** — lĩnh vực phát triển (Giao tiếp, Xã hội, Nhận thức, Vận động thô/tinh, Tự phục vụ, Hành vi, Học tập, Thích ứng)
- **`educare.lesson.template`** — thư viện mẫu bài học có cấu trúc (DTT, NET, Social)

### `educare_security`
Phân quyền theo vai trò với record rules:
- **Admin** — toàn quyền hệ thống
- **Supervisor** — quản lý theo trung tâm (center-scoped)
- **Teacher** — xem/sửa học sinh được giao, tạo session log và daily report
- **Parent** — chỉ xem báo cáo và tiến độ của con mình
- Self-access rule: mọi user xem được hồ sơ của chính mình

### `educare_student`
Hồ sơ học sinh:
- Thông tin cá nhân, chẩn đoán, mức độ, liên hệ khẩn cấp, người giám hộ
- Bộ đánh giá phát triển (`educare.assessment.item`) và lịch sử đánh giá

### `educare_iep`
Kế hoạch giáo dục cá nhân (IEP):
- **`educare.iep.plan`** — trạng thái: draft → active → closed; ràng buộc 1 plan active/học sinh
- **`educare.iep.goal`** (LTG) — mục tiêu dài hạn theo lĩnh vực, baseline/target
- **`educare.iep.objective`** (STO) — mục tiêu ngắn hạn SMART, mastery criteria, % tiến độ
- **`educare.iep.objective.template`** — thư viện STO theo lĩnh vực & độ tuổi
- Auto-close plan khi tất cả LTG đạt thành thạo

### `educare_session`
Nhật ký buổi học:
- **`educare.session.log`** — ngày, giáo viên, học sinh, trạng thái (scheduled/in_progress/done), mood, energy
- **`educare.session.result`** — trial-by-trial data: correct/total trials, prompt level, teaching method (DTT/NET)
- Tính toán % chính xác và xu hướng tiến bộ tự động

### `educare_reporting`
Báo cáo hàng ngày:
- **`educare.daily.report`** — tóm tắt buổi học thân thiện với phụ huynh
- Trạng thái: draft → sent → read
- Nút "Tạo báo cáo" ẩn tự động khi báo cáo đã tồn tại cho buổi học đó
- Email template gửi tự động

---

## Cài đặt Mobile App (React Native / Expo)

### Yêu cầu

| Thành phần | Phiên bản |
|------------|-----------|
| Node.js    | 18+       |
| Expo SDK   | ~54       |
| React      | 19.x      |

### Thiết lập

```bash
cd EduCareConnect
npm install
```

Tạo file `.env` trong thư mục `EduCareConnect/`:

```env
EXPO_PUBLIC_ODOO_URL=http://<server-ip>:8069
EXPO_PUBLIC_ODOO_DB=educare
```

> **Phát triển local với ngrok:**
> ```bash
> ngrok http 8069
> # Dán HTTPS URL vào EXPO_PUBLIC_ODOO_URL
> ```

### Chạy ứng dụng

```bash
cd EduCareConnect

# Dev server (quét QR bằng Expo Go)
npm start

# Android emulator
npm run android

# iOS simulator
npm run ios
```

### Luồng xác thực mobile

1. Đăng nhập → gọi Odoo JSON-RPC `authenticate`
2. Session cookie lưu vào `expo-secure-store`
3. Mỗi request gửi kèm session cookie
4. `profileApi.ts` gọi `educare.user.profile` để lấy vai trò và `center_id`
5. Navigation tự động điều hướng theo role (Teacher Stack / Parent Stack)

---

## Phân quyền & Bảo mật

| Tầng          | Cơ chế                                                      |
|---------------|-------------------------------------------------------------|
| Authentication | Odoo session-based auth qua JSON-RPC                       |
| Authorization  | Odoo groups + domain-based record rules                    |
| Data isolation | Teacher chỉ thấy học sinh của mình; Parent chỉ thấy con mình; Supervisor thấy toàn bộ trong trung tâm |
| Self-access    | Mọi user đọc được hồ sơ cá nhân của chính mình             |

---

## Tài liệu kỹ thuật

| Tài liệu                    | Đường dẫn                                   |
|-----------------------------|---------------------------------------------|
| ERD tổng quan               | `docs/01_erd/erd_overview.md`               |
| ERD từng module             | `docs/01_erd/`                              |
| Use case                    | `docs/02_usecase/`                          |
| Luồng nghiệp vụ             | `docs/03_flow/`                             |
| Wireframe                   | `docs/wireframe_markdown/`                  |
| Mobile roadmap              | `EduCareConnect/roadmap/ROADMAP.md`         |
| Mobile backend impact       | `docs/mobile_backend_impact_analysis.md`    |
| Navigation pattern          | `EduCareConnect/docs/navigation-pattern.md` |

---

## License

LGPL-3 (Odoo Community License)
