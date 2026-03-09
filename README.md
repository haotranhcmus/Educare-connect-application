# Educare Connect

Hệ thống quản lý giáo dục can thiệp sớm sử dụng Odoo backend và React Native mobile app.

## Modules

- educare_base
- educare_student
- educare_iep
- educare_session

---

# Testing Guide — Module `educare_base`

> Module: `educare_base` v17.0.1.0.0  
> Mục đích: Kiểm tra CRUD đầy đủ cho 5 models: Center, Diagnosis, Domain, Lesson Template, Activity

---

## 1. Cài đặt / Upgrade Module

```bash
# Lần đầu cài đặt
./odoo-bin -i educare_base -d educare_dev --stop-after-init

# Upgrade (sau khi sửa code)
./odoo-bin -u educare_base -d educare_dev --stop-after-init

# Start server
./odoo-bin -d educare_dev
```

Sau khi start, truy cập: **http://localhost:8069**

---

## 2. Verify Seed Data Đã Load

Sau khi install, kiểm tra các menu sau có data không:

| Menu path                                   | Model                     | Số records seed |
| ------------------------------------------- | ------------------------- | --------------- |
| Educare → Master Data → Development Domains | `educare.domain`          | 9               |
| Educare → Master Data → Diagnoses           | `educare.diagnosis`       | 12              |
| Educare → Master Data → Centers             | `educare.center`          | 5               |
| Educare → Master Data → Lesson Templates    | `educare.lesson.template` | 6               |

Nếu menu **Educare** không xuất hiện → vào Settings → Activate Developer Mode → reload trang.

---

## 3. Data Mẫu Để Test CRUD Thủ Công

> **Lưu ý:** Các data dưới đây có code/tên **khác hoàn toàn** với seed data, nên bạn có thể nhập thoải mái mà không bị lỗi "duplicate code". Sau khi test xong, để nguyên cũng không ảnh hưởng seed data.

---

### 3.1 Centers — `educare.center`

> Menu: **Educare → Master Data → Centers → New**

| #   | Center Name            | Code    | Phone          | Email                  | Address                                |
| --- | ---------------------- | ------- | -------------- | ---------------------- | -------------------------------------- |
| 1   | Educare Hải Phòng      | HP-01   | 0225-3826-1111 | haiphong@educare.vn    | 100 Lê Lợi, Ngô Quyền, Hải Phòng       |
| 2   | Educare Nha Trang      | NT-01   | 0258-3827-2222 | nhatrang@educare.vn    | 200 Trần Phú, Nha Trang, Khánh Hòa     |
| 3   | Educare Huế            | HUE-01  | 0234-3828-3333 | hue@educare.vn         | 300 Lê Duẩn, Thành phố Huế             |
| 4   | Educare Vũng Tàu       | VT-01   | 0254-3829-4444 | vungtau@educare.vn     | 400 Thùy Vân, Vũng Tàu, BR-VT          |
| 5   | Educare Long An        | LA-01   | 0272-3830-5555 | longan@educare.vn      | 500 Hùng Vương, Tân An, Long An        |
| 6   | Educare Đồng Nai       | DNAI-01 | 0251-3831-6666 | dongnai@educare.vn     | 600 Phạm Văn Thuận, Biên Hòa, Đồng Nai |
| 7   | Educare Quảng Nam      | QNam-01 | 0235-3832-7777 | quangnam@educare.vn    | 700 Trần Cao Vân, Tam Kỳ, Quảng Nam    |
| 8   | Educare Bắc Ninh       | BN-01   | 0222-3833-8888 | bacninh@educare.vn     | 800 Lý Thái Tổ, Bắc Ninh               |
| 9   | Educare Thái Nguyên    | TN-01   | 0208-3834-9999 | thainguyen@educare.vn  | 900 Lương Ngọc Quyến, TP Thái Nguyên   |
| 10  | Educare Cần Giờ (Test) | CG-TEST | 0909-000-001   | cangio.test@educare.vn | Khu du lịch Cần Giờ, TP.HCM            |
| 11  | Educare Quận 7         | HCM-Q7  | 028-3840-0011  | q7@educare.vn          | 11 Nguyễn Thị Thập, Quận 7, TP.HCM     |
| 12  | Educare Gò Vấp         | HCM-GV  | 028-3841-0012  | govap@educare.vn       | 12 Quang Trung, Gò Vấp, TP.HCM         |

**Test cases:**

- [ ] Create: Tạo record mới, điền đủ fields
- [ ] Update: Sửa phone, email → verify chatter ghi lại thay đổi
- [ ] Delete: Xóa record CG-TEST
- [ ] Archive: Archive 1 record → verify banner đỏ "Archived" xuất hiện
- [ ] Unarchive: Từ ⚙️ Action menu → Unarchive
- [ ] Search filter: Filter "Active" / "Inactive"
- [ ] Group by: Group by Manager

---

### 3.2 Diagnoses — `educare.diagnosis`

> Menu: **Educare → Master Data → Diagnoses → New**

| #   | Name                                  | Code       | Category     | ICD-10 | DSM-5  | Sequence |
| --- | ------------------------------------- | ---------- | ------------ | ------ | ------ | -------- |
| 1   | Rối Loạn Lo Âu                        | ANXIETY    | behavioral   | F41.1  | 300.02 | 200      |
| 2   | Hội Chứng Angelman                    | ANGELMAN   | genetic      | Q93.5  |        | 210      |
| 3   | Hội Chứng Prader-Willi                | PRADER     | genetic      | Q87.1  |        | 220      |
| 4   | Rối Loạn Xử Lý Thính Giác             | APD        | sensory      | H93.25 |        | 230      |
| 5   | Bại Liệt (Spina Bifida)               | SPINA      | neurological | Q05    |        | 240      |
| 6   | Rối Loạn Giao Tiếp Xã Hội             | SCD        | autism       | F80.89 | 315.39 | 250      |
| 7   | Chứng Khó Đọc (Dyslexia)              | DYSLEXIA   | speech       | F81.0  | 315.00 | 260      |
| 8   | Chứng Khó Viết (Dysgraphia)           | DYSGRAPHIA | speech       | F81.81 | 315.2  | 270      |
| 9   | Chứng Khó Tính Toán (Dyscalculia)     | DYSCALC    | speech       | F81.2  | 315.1  | 280      |
| 10  | Hội Chứng Tourette                    | TOURETTE   | neurological | F95.2  | 307.23 | 290      |
| 11  | Rối Loạn Phát Triển Lan Tỏa (PDD-NOS) | PDDNOS     | autism       | F84.9  | 299.80 | 300      |
| 12  | Bại Não Thể Co Cứng                   | CP_SPASTIC | neurological | G80.1  |        | 310      |

**Test cases:**

- [ ] Create: Tạo mới với category = "genetic"
- [ ] Drag-sort: Kéo thả sequence handle trong tree để re-order
- [ ] Filter by category: Test từng filter trong search view
- [ ] Group by category: Verify grouping và số đếm đúng
- [ ] Archive / Unarchive một diagnosis

---

### 3.3 Development Domains — `educare.domain`

> Tất cả 9 domains đã được seed. Đây là **master data cố định**, không nên xóa.  
> Chỉ test Update và kéo thả sequence.

**Test cases:**

- [ ] Update: Sửa description của domain COMM
- [ ] Update color: Đổi color qua color_picker cho domain COGNITIVE
- [ ] Drag sort: Kéo thả để đổi thứ tự trong tree
- [ ] Archive / Unarchive domain ADAPTIVE

---

### 3.4 Lesson Templates — `educare.lesson.template`

> Menu: **Educare → Master Data → Lesson Templates → New**

| #   | Name                             | Code        | Domain        | Difficulty   | Duration (min) | Source        |
| --- | -------------------------------- | ----------- | ------------- | ------------ | -------------- | ------------- |
| 1   | Nhận Diện Cảm Xúc Cơ Bản         | T-SOCIAL-02 | Social        | beginner     | 30             | original      |
| 2   | Kỹ Năng Chào Hỏi                 | T-SOCIAL-03 | Social        | beginner     | 20             | ablls_r       |
| 3   | Chia Sẻ Đồ Chơi                  | T-SOCIAL-04 | Social        | intermediate | 45             | original      |
| 4   | Đặt Tên Hành Động (Action Verbs) | T-COMM-03   | Communication | beginner     | 30             | vbmapp        |
| 5   | Hiểu Đại Từ Nhân Xưng            | T-COMM-04   | Communication | intermediate | 30             | ablls_r       |
| 6   | Ghép Hình 4 Mảnh                 | T-COG-02    | Cognitive     | beginner     | 25             | twinkl        |
| 7   | Xếp Chuỗi Theo Thứ Tự            | T-COG-03    | Cognitive     | intermediate | 35             | twinkl        |
| 8   | Đánh Răng Đúng Cách              | T-SELF-02   | Self-Care     | intermediate | 20             | original      |
| 9   | Mặc Áo Tự Lập                    | T-SELF-03   | Self-Care     | advanced     | 30             | attainment    |
| 10  | Giảm Hành Vi Tự Kích Thích       | T-BEH-02    | Behavior      | intermediate | 45             | original      |
| 11  | Chịu Đựng Sự Thay Đổi Thói Quen  | T-BEH-03    | Behavior      | advanced     | 45             | autism_helper |
| 12  | Cầm Bút Đúng Tư Thế              | T-FM-01     | Fine Motor    | beginner     | 20             | twinkl        |

**Test cases:**

- [ ] Create template T-SOCIAL-02 kèm activity lines (xem bảng 3.5 bên dưới)
- [ ] Edit inline activity trong tree editable="bottom"
- [ ] Click vào dòng activity → verify form popup mở đúng
- [ ] Drag sort activities qua sequence handle
- [ ] Filter by difficulty: Beginner / Intermediate / Advanced
- [ ] Group by domain, by source
- [ ] Verify `activity_count` cập nhật sau khi thêm/xóa activity

---

### 3.5 Activities — Test qua Template Form

> Khi tạo **T-SOCIAL-02 "Nhận Diện Cảm Xúc Cơ Bản"**, thêm các activities sau trong tab **Activities**:

| Seq | Activity Name                         | Type       | Duration | Prompt Level | Reinforcement Type      |
| --- | ------------------------------------- | ---------- | -------- | ------------ | ----------------------- |
| 10  | Khởi Động — Nhìn Tranh Cảm Xúc        | academic   | 5        | verbal       | Verbal praise           |
| 20  | DTT — Nhận Diện Vui / Buồn / Tức / Sợ | dtt        | 12       | gestural     | Token + praise          |
| 30  | NET — Nhận Diện Cảm Xúc Trong Truyện  | net        | 8        | verbal       | Tiếp cận sách yêu thích |
| 40  | Role Play — Biểu Diễn Cảm Xúc         | social     | 10       | verbal       | High-five + sticker     |
| 50  | Tổng Kết & Token Exchange             | transition | 5        | independent  | Reinforcer ưa thích     |

---

## 4. Test Validation & Constraints

### 4.1 Duplicate Code

Thử tạo Center với code **HN-01** (đã có trong seed data).  
→ **Kỳ vọng:** Lỗi "The center code must be unique."

### 4.2 Age Range Constraint

Trong Lesson Template, set **Min Age = 60**, **Max Age = 24** (max < min).  
→ **Kỳ vọng:** Lỗi "Target age max must be greater than or equal to target age min."

### 4.3 Required Fields

Tạo Lesson Template không chọn **Development Domain**.  
→ **Kỳ vọng:** Không save được, field domain_id highlight đỏ.

---

## 5. Test Archive/Unarchive

1. Mở **Center "Educare Cần Giờ (Test)"**
2. ⚙️ → **Archive** → Confirm
3. Record biến mất khỏi danh sách
4. Search → **Filters → Inactive** → Record hiện lại với banner đỏ "Archived"
5. Mở record → ⚙️ → **Unarchive** → Banner biến mất

---

## 6. Checklist Tổng

```
SEED DATA
[✓] 9 Development Domains
[✓] 12 Diagnoses
[✓] 5 Centers
[✓] 6 Lesson Templates + activities

CRUD
[ ] Center: Create / Read / Update / Delete / Archive
[ ] Diagnosis: Create / Drag-sort / Filter / Group
[ ] Domain: Update / Drag-sort / Archive-Unarchive
[ ] Lesson Template: Create với activities / Edit inline / Filter / Group
[ ] Activity: Thêm/xóa qua template form / Popup form / Drag sort

CONSTRAINTS
[ ] Duplicate code → hiện lỗi
[ ] Age range invalid → hiện lỗi
[ ] Required field missing → field highlight đỏ

SEARCH & FILTER
[ ] Text search hoạt động
[ ] Category/difficulty/source filters hoạt động
[ ] Group by hoạt động
[ ] Active / Inactive filter hoạt động
```

- educare_progress
- educare_reporting
- educare_dashboard
- educare_ai
- educare_mobile_api

## Setup

```bash
pip install -r requirements.txt
```
