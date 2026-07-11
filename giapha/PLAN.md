# Kế hoạch xây dựng ứng dụng Gia Phả (Family Tree)

## Context
Xây dựng ứng dụng web cây gia phả cho dòng họ Việt Nam, tham khảo từ giaphadaiviet.vn. MVP bao gồm: Phả đồ tương tác + Hồ sơ thành viên chi tiết.

- **Thư mục**: `D:/Projects/giapha`
- **Công nghệ**: Next.js 14 (App Router) + React + TypeScript + Turso (SQLite) + Tailwind CSS + shadcn/ui
- **MVP scope**: Phả đồ tương tác + Hồ sơ thành viên (chưa có sự kiện, bài viết, website dòng họ)

---

## Tech Stack

| Layer | Technology | Lý do |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | SSR, API routes, routing, Vercel deploy |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Nhanh, đẹp, accessible |
| Database | Turso (SQLite edge) | Edge-ready, không cần connection pool |
| ORM | Drizzle ORM | Type-safe, SQLite-native, Turso support |
| **Tree Viz** | **React Flow (@xyflow/react) + Dagre** | Custom React nodes, built-in zoom/pan/drag, tốt hơn D3 cho React |
| Export | html-to-image + jsPDF | Xuất PNG/JPG/PDF từ DOM |
| Auth (Editor) | Auth.js v5 (Credentials + Google OAuth) | Chuẩn cho Next.js, Drizzle adapter |
| Auth (Viewer) | Mã bảo mật đơn giản (password hash) | Không cần đăng ký, giống giaphadaiviet.vn |
| File Upload | Vercel Blob | Lưu ảnh, xuất file |
| Validation | Zod | Type-safe input validation |

---

## Database Schema (Turso/SQLite)

### `clans` — Dòng họ
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| name | text NOT NULL | Tên dòng họ |
| description | text | Mô tả |
| origin | text | Quê quán gốc |
| cover_image_url | text | Ảnh bìa |
| is_public | integer DEFAULT 0 | Công khai? |
| access_code_hash | text | Mã bảo mật (bcrypt, nullable) |
| created_at | text DEFAULT datetime('now') | |
| updated_at | text DEFAULT datetime('now') | |

### `members` — Thành viên
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| clan_id | text NOT NULL | FK → clans.id |
| family_name | text NOT NULL | Họ (vd: "Nguyễn") |
| middle_name | text | Tên đệm (vd: "Văn") |
| given_name | text NOT NULL | Tên (vd: "Nam") |
| full_name | text NOT NULL | Họ và tên đầy đủ |
| alias | text | Tên thường gọi / bí danh |
| gender | text NOT NULL | 'male' / 'female' |
| birth_date | text | Ngày sinh dương lịch |
| birth_date_lunar | text | Ngày sinh âm lịch |
| death_date | text | Ngày mất dương lịch |
| death_date_lunar | text | Ngày mất âm lịch (để tính giỗ) |
| is_living | integer DEFAULT 1 | Còn sống? |
| photo_url | text | Ảnh đại diện |
| biography | text | Tiểu sử |
| address | text | Địa chỉ |
| education | text | Học vấn |
| occupation | text | Nghề nghiệp |
| blood_type | text | Nhóm máu |
| phone | text | SĐT |
| email | text | Email |
| generation | integer DEFAULT 1 | Đời thứ mấy |
| birth_order | integer | Thứ tự sinh |
| notes | text | Ghi chú |
| created_at | text | |
| updated_at | text | |

### `marriages` — Hôn nhân
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| clan_id | text NOT NULL | FK → clans.id |
| partner_1_id | text NOT NULL | FK → members.id |
| partner_2_id | text NOT NULL | FK → members.id |
| marriage_date | text | Ngày cưới |
| divorce_date | text | Ngày ly hôn (nullable) |
| is_active | integer DEFAULT 1 | |
| notes | text | |
| created_at | text | |

### `parent_child_relationships` — Quan hệ cha-con
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| clan_id | text NOT NULL | FK → clans.id |
| parent_id | text NOT NULL | FK → members.id |
| child_id | text NOT NULL | FK → members.id |
| marriage_id | text | FK → marriages.id (nullable) |
| relationship_type | text DEFAULT 'biological' | 'biological' / 'adoptive' |
| birth_order | integer | Thứ tự sinh |
| notes | text | |

### `member_media` — Ảnh thành viên
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| member_id | text NOT NULL | FK → members.id |
| url | text NOT NULL | URL ảnh |
| caption | text | Mô tả |
| media_type | text DEFAULT 'photo' | |
| sort_order | integer DEFAULT 0 | |
| created_at | text | |

### `clan_editors` — Quản trị viên (tích hợp Auth.js)
| Column | Type | Notes |
|--------|------|-------|
| id | text (UUID) | PK |
| clan_id | text NOT NULL | FK → clans.id |
| user_id | text NOT NULL | FK → Auth.js user |
| role | text DEFAULT 'editor' | 'owner' / 'editor' / 'viewer' |
| joined_at | text | |

---

## Cây thư mục dự án

```
D:/Projects/giapha/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (ThemeProvider, SessionProvider)
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Tailwind + CSS variables
│   │   ├── (auth)/
│   │   │   ├── signin/page.tsx        # Đăng nhập
│   │   │   └── signup/page.tsx        # Đăng ký
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout (sidebar + header)
│   │   │   ├── page.tsx               # Danh sách dòng họ của user
│   │   │   └── clans/[clanId]/
│   │   │       ├── layout.tsx         # Clan sub-nav (Phả đồ | Thành viên | Cài đặt)
│   │   │       ├── page.tsx           # Clan overview → redirect đến tree
│   │   │       ├── tree/page.tsx      # TRANG PHẢ ĐỒ CHÍNH
│   │   │       ├── members/
│   │   │       │   ├── page.tsx       # Danh sách + search thành viên
│   │   │       │   ├── new/page.tsx   # Thêm thành viên mới
│   │   │       │   └── [memberId]/
│   │   │       │       ├── page.tsx   # Hồ sơ chi tiết
│   │   │       │       └── edit/page.tsx # Sửa thành viên
│   │   │       └── settings/page.tsx  # Cài đặt dòng họ
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── clans/
│   │       │   ├── route.ts           # GET (list), POST (create)
│   │       │   └── [clanId]/
│   │       │       ├── route.ts       # GET/PATCH/DELETE
│   │       │       ├── access/route.ts     # POST verify access code
│   │       │       ├── editors/route.ts    # GET/POST editors
│   │       │       ├── members/
│   │       │       │   ├── route.ts        # GET (list/search), POST
│   │       │       │   └── [memberId]/
│   │       │       │       ├── route.ts    # GET/PATCH/DELETE
│   │       │       │       ├── parents/route.ts
│   │       │       │       ├── spouses/route.ts
│   │       │       │       ├── children/route.ts
│   │       │       │       └── relationship-path/route.ts # GET ?targetId=X
│   │       │       └── tree/route.ts       # GET full tree data
│   │       └── upload/route.ts             # File upload (Vercel Blob)
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── header.tsx              # App header + user menu
│   │   │   ├── sidebar.tsx             # Dashboard sidebar
│   │   │   └── clan-nav.tsx            # Clan tab navigation
│   │   ├── auth/
│   │   │   ├── signin-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── access-code-form.tsx    # Nhập mã xem phả đồ
│   │   ├── clans/
│   │   │   ├── clan-card.tsx
│   │   │   ├── clan-create-dialog.tsx
│   │   │   └── clan-settings-form.tsx
│   │   ├── tree/
│   │   │   ├── family-tree.tsx         # ReactFlow wrapper chính
│   │   │   ├── family-tree-toolbar.tsx # Thanh công cụ (zoom, export, style)
│   │   │   ├── nodes/
│   │   │   │   ├── person-node.tsx     # Node thẻ thành viên (CUSTOM)
│   │   │   │   └── spouse-connector.tsx # Node nối vợ/chồng
│   │   │   ├── edges/
│   │   │   │   ├── parent-child-edge.tsx # Đường nối cha-con
│   │   │   │   └── spouse-edge.tsx     # Đường nối vợ-chồng (ngang)
│   │   │   ├── dialogs/
│   │   │   │   ├── add-member-dialog.tsx
│   │   │   │   ├── edit-member-dialog.tsx
│   │   │   │   ├── add-spouse-dialog.tsx
│   │   │   │   └── relationship-path-dialog.tsx
│   │   │   └── hooks/
│   │   │       ├── use-tree-data.ts    # Fetch + transform
│   │   │       ├── use-tree-layout.ts  # Dagre layout
│   │   │       └── use-tree-export.ts  # Export PNG/PDF
│   │   ├── members/
│   │   │   ├── member-card.tsx
│   │   │   ├── member-profile.tsx
│   │   │   ├── member-form.tsx         # Form thêm/sửa (dùng chung)
│   │   │   ├── member-search.tsx
│   │   │   └── relationship-path-viewer.tsx
│   │   ├── media/
│   │   │   ├── photo-upload.tsx
│   │   │   └── avatar.tsx
│   │   └── shared/
│   │       ├── confirm-dialog.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-state.tsx
│   │       └── loading-skeleton.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle + Turso client
│   │   │   ├── schema.ts              # Tất cả bảng Drizzle
│   │   │   └── migrations/            # SQL migrations
│   │   ├── auth/
│   │   │   ├── index.ts               # Auth.js config
│   │   │   └── auth.config.ts         # Edge-compatible config
│   │   ├── tree/
│   │   │   ├── layout.ts              # Dagre layout algorithm
│   │   │   ├── transform.ts           # DB records → React Flow nodes/edges
│   │   │   └── types.ts               # Tree-specific types
│   │   ├── utils/
│   │   │   ├── cn.ts                  # clsx + tailwind-merge
│   │   │   ├── lunar-calendar.ts      # Chuyển đổi âm/dương lịch
│   │   │   └── relationship.ts        # Tính quan hệ giữa 2 người
│   │   └── validations/
│   │       ├── clan.ts                # Zod schemas
│   │       ├── member.ts
│   │       └── marriage.ts
│   ├── hooks/
│   │   └── use-debounce.ts
│   └── types/
│       ├── clan.ts
│       ├── member.ts
│       └── tree.ts
├── public/assets/
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Kiến trúc Family Tree Visualization

### Lựa chọn: React Flow (@xyflow/react) + Dagre layout

**Tại sao React Flow thay vì D3.js thuần?**

| Tiêu chí | React Flow | D3.js + React |
|----------|-----------|---------------|
| Custom node rendering | Full React components | SVG foreignObject (hạn chế) |
| Zoom/Pan | Built-in, mượt | D3 zoom (phải wrap) |
| Kéo thả node | Native support | Phải tự code drag behavior |
| Edge styles | Custom edge components | Path generators (thủ công) |
| Performance | Viewport virtualization | Render toàn bộ SVG |
| Bundle size | ~200KB gzipped | ~100KB (nhưng code nhiều hơn) |
| Hệ sinh thái | Rất lớn, docs tốt | Lớn nhưng phức tạp |

React Flow cho phép dùng React component làm node → có thể tạo "thẻ người" đẹp với ảnh, tên, ngày tháng bằng shadcn/ui styling.

### Thuật toán bố cục (3 pha)

**Pha 1 — Build DAG**: Bắt đầu từ tổ tiên (root), duyệt parent-child relationships để xây dựng directed acyclic graph. Mỗi node được gán `rank` (thế hệ) dựa trên khoảng cách từ root. Chỉ dùng parent-child edges.

**Pha 2 — Dagre layout**: Chạy `@dagrejs/dagre` với `rankdir: 'TB'` (top-to-bottom). Dagre tính toán vị trí (x, y) cho mỗi node:
- `ranksep: 150` — khoảng cách dọc giữa các thế hệ
- `nodesep: 80` — khoảng cách ngang giữa anh chị em

**Pha 3 — Spouse edges**: Sau khi Dagre đặt vị trí, duyệt qua marriages. Với mỗi cặp vợ chồng cùng thế hệ, thêm horizontal edge. Không cần tính lại layout.

### Data Flow cho Tree

```
1. User mở /clans/[clanId]/tree
      ↓
2. Page.tsx (Server Component) fetch initial data
   GET /api/clans/[clanId]/tree?rootId=X&generations=5
   → { clan, members[], marriages[], relationships[] }
      ↓
3. Client nhận data → useTreeData hook
   members[] + marriages[] + relationships[]
   → transform.ts → React Flow nodes[] + edges[]
      ↓
4. useTreeLayout hook → Dagre tính {x, y} cho mỗi node
      ↓
5. FamilyTree render React Flow với:
   - nodeTypes: { personNode: PersonNode, spouseConnector: SpouseConnector }
   - edgeTypes: { parentChild: ParentChildEdge, spouse: SpouseEdge }
   - fitView() ban đầu
      ↓
6. Tương tác:
   - Click node → mở drawer/dialog chi tiết
   - Nút "+" trên node → dialog thêm người thân
   - Collapse/Expand → filter nodes/edges trong state
   - Drag node → update position (local state)
   - Zoom/Pan → React Flow built-in
   - Export → html-to-image chụp viewport
```

### Các tính năng tương tác trên cây

| Tính năng | Cách triển khai |
|-----------|----------------|
| Zoom/Pan | React Flow built-in + Controls component |
| Kéo thả node | React Flow built-in drag (lưu local state, "Reset Layout" để về Dagre) |
| Collapse/Expand | State: set ẩn/hiện descendant nodes → re-render |
| Thêm thành viên | Nút "+" trên node cha/mẹ → AddMemberDialog |
| Sửa nhanh | Double-click node → EditMemberDialog |
| Xem trước | Hover node → tooltip (ảnh, tên, năm sinh-mất) |
| Export PNG/JPG | html-to-image chụp .react-flow__viewport |
| Export PDF | jsPDF bọc ảnh đã chụp |
| Đổi kiểu đường nối | State: 'step' / 'smoothstep' / 'bezier' → React Flow edge type |
| Tìm & highlight | Search box → highlight + panTo node |
| Đổi hướng cây | State: 'ancestors' (đi lên) / 'descendants' (đi xuống) |

---

## API Routes

### Clans
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/clans` | Danh sách dòng họ của user |
| POST | `/api/clans` | Tạo dòng họ mới |
| GET | `/api/clans/[clanId]` | Thông tin dòng họ |
| PATCH | `/api/clans/[clanId]` | Cập nhật |
| DELETE | `/api/clans/[clanId]` | Xóa |
| POST | `/api/clans/[clanId]/access` | Xác thực mã truy cập |

### Members
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/clans/[clanId]/members?search=X&generation=N` | List/search |
| POST | `/api/clans/[clanId]/members` | Thêm thành viên |
| GET | `/api/clans/[clanId]/members/[memberId]` | Chi tiết |
| PATCH | `/api/clans/[clanId]/members/[memberId]` | Cập nhật |
| DELETE | `/api/clans/[clanId]/members/[memberId]` | Xóa |
| POST | `/api/clans/[clanId]/members/[memberId]/parents` | Set cha mẹ |
| POST | `/api/clans/[clanId]/members/[memberId]/spouses` | Thêm vợ/chồng |
| POST | `/api/clans/[clanId]/members/[memberId]/children` | Thêm con |
| GET | `/api/clans/[clanId]/members/[memberId]/relationship-path?targetId=X` | Tìm quan hệ |

### Tree
| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/api/clans/[clanId]/tree?rootId=X&generations=5&direction=down` | Full tree data |

### Upload
| Method | Route | Mô tả |
|--------|-------|-------|
| POST | `/api/upload` | Upload ảnh (Vercel Blob) |

---

## Luồng người dùng chính

### Luồng 1: Tạo dòng họ & thêm thành viên đầu tiên
1. User đăng ký/đăng nhập → vào Dashboard
2. Click "Tạo dòng họ mới" → điền tên, mô tả
3. Vào trang dòng họ → "Thêm thành viên" → điền form (tên, giới tính, ngày sinh...)
4. Thêm vài thế hệ: ông bà → cha mẹ → con cháu

### Luồng 2: Xem & tương tác với phả đồ
1. Vào tab "Phả đồ" → cây hiển thị với tổ tiên ở trên cùng
2. Zoom/pan để xem toàn bộ cây
3. Click node để xem thông tin nhanh
4. Double-click để sửa
5. Click nút "+" để thêm vợ/chồng/con

### Luồng 3: Tìm kiếm & xem hồ sơ
1. Vào tab "Thành viên" → danh sách tất cả thành viên
2. Search theo tên → click vào member card
3. Xem hồ sơ chi tiết: ảnh, ngày sinh, tiểu sử, gia đình
4. Click "Xem quan hệ với..." → chọn người khác → hiển thị đường dẫn quan hệ

### Luồng 4: Export & chia sẻ
1. Trên trang phả đồ → click "Xuất"
2. Chọn định dạng (PNG/JPG/PDF)
3. Chọn chất lượng / kích thước
4. Tải về máy

---

## Thứ tự triển khai

### Bước 1: Khởi tạo dự án (30 phút)
- `npx create-next-app@latest giapha --typescript --tailwind --eslint --app --src-dir`
- Cài deps: `drizzle-orm @libsql/client @xyflow/react @dagrejs/dagre next-auth@beta @auth/drizzle-adapter @vercel/blob html-to-image jspdf zod date-fns clsx tailwind-merge lucide-react next-themes bcryptjs`
- Cài dev deps: `drizzle-kit @types/bcryptjs`
- Setup shadcn/ui (`npx shadcn@latest init`)
- Setup Tailwind config + CSS variables

### Bước 2: Database (1 giờ)
- Viết `src/lib/db/schema.ts` — tất cả bảng Drizzle
- Viết `src/lib/db/index.ts` — Turso client
- Tạo `drizzle.config.ts`
- `npx drizzle-kit push` → tạo bảng trên Turso
- Seed data mẫu (3-4 thế hệ họ Nguyễn mẫu)

### Bước 3: Auth + Layout (1.5 giờ)
- Setup Auth.js v5 với Drizzle adapter
- Tạo signin/signup pages
- Middleware bảo vệ route
- Dashboard layout (sidebar + header)
- Clan navigation tabs

### Bước 4: CRUD Clan + Member (2 giờ)
- Clan API routes (CRUD)
- Clan UI (create dialog, settings form)
- Member API routes (CRUD + search)
- Member list page với search
- Member form (create/edit)
- Member profile page

### Bước 5: Family Tree Core (3-4 giờ) — PHỨC TẠP NHẤT
- Tree API endpoint (fetch all data)
- `transform.ts` — DB records → React Flow nodes/edges
- `layout.ts` — Dagre algorithm
- `PersonNode` component — thẻ người với ảnh, tên, năm sinh-mất, badge
- `ParentChildEdge` + `SpouseEdge` components
- `FamilyTree` component — ReactFlow instance
- Toolbar (zoom controls, fit view, edge style toggle)

### Bước 6: Tree Interactions (2 giờ)
- Collapse/expand nhánh
- Add/Edit member từ tree node (dialog)
- Kéo thả node + reset layout
- Hover preview tooltip
- Search & highlight trong tree

### Bước 7: Export + Relationship (1.5 giờ)
- Export PNG/JPG (html-to-image)
- Export PDF (jsPDF)
- Relationship path finder (thuật toán BFS/DFS trên cây)
- Relationship path dialog

### Bước 8: Polish (1.5 giờ)
- Password gate (mã bảo mật phả đồ)
- Photo upload với Vercel Blob
- Empty/loading/error states
- Responsive adjustments
- Dark mode

---

## Các thách thức kỹ thuật & giải pháp

| Thách thức | Giải pháp |
|-----------|----------|
| **Dagre không xử lý cycle** (A là cha B, B là cha A) | Validate cycle trong API trước khi save parent-child. Dùng DFS cycle detection |
| **Cây lớn (500+ người)** | Mặc định hiển thị 5 thế hệ. Lazy load thế hệ sâu hơn. Collapse mặc định các nhánh phụ |
| **Nhiều vợ/chồng** | Bảng `marriages` riêng biệt. UI hiển thị vợ/chồng theo thứ tự thời gian, nhóm con theo marriage |
| **Âm lịch → Dương lịch** | Dùng package `vietnamese-lunar-calendar` hoặc bảng tra cứu. Lưu cả 2 loại ngày |
| **Export cây lớn bị mờ** | Scale container trước khi chụp (`transform: scale(2)`) rồi scale down ảnh |

---

## Verification

1. `npm run dev` → app chạy tại http://localhost:3000
2. Đăng ký tài khoản → tạo dòng họ mới
3. Thêm 3-4 thế hệ thành viên (ông bà → cha mẹ → con cháu)
4. Vào trang Phả đồ → cây hiển thị đúng cấu trúc, có đường nối cha-con và vợ-chồng
5. Zoom/pan/collapse/expand hoạt động mượt
6. Click node → xem chi tiết, sửa, thêm người thân
7. Tìm kiếm thành viên → highlight trên cây
8. Export PNG/PDF → mở file thành công
9. Xem quan hệ giữa 2 người → hiển thị đường dẫn đúng
10. Test mã bảo mật → yêu cầu password trước khi xem phả đồ
11. Responsive trên mobile → giao diện điều chỉnh phù hợp
