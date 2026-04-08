# 🔐 Authentication & Authorization System

## Giải thích Authentication và Authorization

### **Authentication (Xác thực)**
Là quá trình **xác minh danh tính** của người dùng - "Bạn là ai?"

**Ví dụ thực tế:**
- Đăng nhập bằng username/password
- Quét vân tay, Face ID
- Nhận mã OTP từ điện thoại

**Trong ứng dụng MyWords:**
- Người dùng đăng ký tài khoản với email/password
- Đăng nhập để nhận JWT token
- Token này chứng minh "tôi là chủ tài khoản này"

### **Authorization (Phân quyền)**
Là quá trình **kiểm tra quyền hạn** - "Bạn được phép làm gì?"

**Ví dụ thực tế:**
- Admin có thể xóa bài viết, user thường thì không
- Chỉ chủ sở hữu nhật ký mới xem/edit được
- User free vs user premium có tính năng khác nhau

**Trong ứng dụng MyWords:**
- Chỉ người đã đăng nhập mới xem được nhật ký của mình
- Mỗi user chỉ thấy dữ liệu của chính họ
- API `/api/auth/me` yêu cầu token hợp lệ

---

## Cách hoạt động của hệ thống JWT

```
┌─────────────┐      ┌──────────┐      ┌─────────────┐
│   Client    │      │  Server  │      │  Database   │
│  (Browser)  │      │  (Node)  │      │   (SQLite)  │
└──────┬──────┘      └────┬─────┘      └──────┬──────┘
       │                  │                   │
       │ 1. REGISTER      │                   │
       │─────────────────>│                   │
       │                  │ 2. Hash password  │
       │                  │──────────────────>│
       │                  │ 3. Save user      │
       │                  │<──────────────────│
       │ 4. Success       │                   │
       │<─────────────────│                   │
       │                  │                   │
       │ 5. LOGIN         │                   │
       │─────────────────>│                   │
       │                  │ 6. Verify password│
       │                  │──────────────────>│
       │                  │ 7. Generate JWT   │
       │                  │                   │
       │ 8. Return token  │                   │
       │<─────────────────│                   │
       │                  │                   │
       │ 9. Request with token               │
       │─────────────────>│                   │
       │                  │ 10. Verify token  │
       │                  │ 11. Get user data │
       │                  │──────────────────>│
       │ 12. Response     │                   │
       │<─────────────────│                   │
```

---

## Các API đã triển khai

### **Public Routes** (Không cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |

### **Protected Routes** (Cần JWT token)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| PUT | `/api/auth/password` | Đổi mật khẩu |
| DELETE | `/api/auth/account` | Xóa tài khoản |

---

## Test API với curl

### 1. Đăng ký tài khoản
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mywords_user",
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "user@example.com",
    "password": "password123"
  }'
```

Response sẽ trả về `token`:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "mywords_user", "email": "user@example.com" }
}
```

### 3. Gọi API cần authentication
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Thử gọi mà không có token (sẽ lỗi)
```bash
curl -X GET http://localhost:3000/api/auth/me
# Response: {"error":"Access denied. No token provided."}
```

---

## Bảo mật

### ✅ Những gì đã implement:
1. **Password hashing** với bcrypt (salt rounds = 10)
2. **JWT tokens** với thời gian hết hạn 7 ngày
3. **Input validation**:
   - Password tối thiểu 6 ký tự
   - Email format hợp lệ
   - Username/email không trùng
4. **Middleware authentication** bảo vệ routes
5. **Environment variables** cho JWT secret

### ⚠️ Lưu ý cho production:
1. **Đổi JWT_SECRET** trong `.env` thành chuỗi ngẫu nhiên mạnh
   ```bash
   openssl rand -base64 32
   ```
2. **Dùng HTTPS** để encrypt traffic
3. **Rate limiting** để chống brute force
4. **Refresh tokens** để tăng security
5. **Logout mechanism** (blacklist tokens)

---

## Cấu trúc file mới

```
/workspace
├── src/
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── models/
│   │   ├── Journal.js
│   │   └── User.js          # User model + auth logic
│   ├── controllers/
│   │   ├── journalController.js
│   │   └── authController.js # Auth endpoints logic
│   └── routes/
│       ├── journal.js
│       └── auth.js          # Auth routes
├── config/
│   └── config.js            # Added jwtSecret
├── .env                     # Environment variables
├── .env.example             # Template for .env
└── server.js                # Updated with auth routes
```

---

##下一步建议

Để hoàn thiện hệ thống authentication, bạn nên:

1. **Frontend integration**: Thêm login/register UI vào `public/index.html`
2. **Token storage**: Lưu token trong localStorage/httpOnly cookie
3. **Auto-login**: Check token validity khi load trang
4. **Session management**: Refresh token trước khi hết hạn
5. **Protect journal routes**: Chỉ cho user xem nhật ký của chính họ
