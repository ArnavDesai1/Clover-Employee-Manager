# 🍀 Clover Infotech Employee Manager - Run Instructions

## Quick Start

### Option 1: Automatic (Recommended)
Double-click these files in any file explorer window:

1. **Backend**: `backend\employee-service\start-backend.bat`
   - Wait for it to show "Tomcat started on port 8080"
   
2. **Frontend**: `frontend\start-frontend.bat`  
   - Wait for it to show "Compiled successfully!"

3. **Open Browser**: Go to `http://localhost:3000`

### Option 2: Manual Start

#### Terminal 1 - Backend:
```powershell
cd "backend\employee-service"
.\mvnw spring-boot:run
```
Wait for: "Tomcat started on port 8080"

#### Terminal 2 - Frontend:
```powershell
cd frontend
npm start
```
Wait for: "Compiled successfully!"

#### Then open: `http://localhost:3000`

---

## Database Requirement
Make sure MySQL is running:
```powershell
Get-Service MySQL80 | Start-Service  # Windows MySQL Service
```

---

##  What You Should See

### Frontend (http://localhost:3000):
- 🍀 Clover Infotech Employee Manager (header with company logo)
- Blue Axis Bank-style theme
- "Employee Directory" showing existing employees
- **Arnav** (ID: 1, Role: Intern) should be visible

### API (http://localhost:8080/employees):
```json
[
  {
    "id": 1,
    "name": "Arnav",
    "role": "Intern",
    "birthdate": null,
    "gender": null,
    ...
  }
]
```

---

## Features Available

✅ **Employee Management**:
- View all employees
- Add new employee with full details
- Edit existing employees
- Delete employees

✅ **Employee Fields**:
- Name, Role, Birthdate
- Gender, Hobbies (multi-choice)
- Address (Line 1, Line 2, City, State, PIN)
- PAN, Address Proof Type
- Profile Picture upload
- Address Proof document upload

✅ **File Operations**:
- Upload profile pictures
- Upload address proof documents
- Download/view uploaded files

---

## Troubleshooting

### "Network Error" on Frontend

**Solution 1**: Restart backend
```powershell
# Kill all Java processes
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart backend
cd backend\employee-service
.\mvnw spring-boot:run
```

**Solution 2**: Check MySQL
```powershell
Get-Service MySQL80 | Status  # Should show "Running"
```

**Solution 3**: Check ports
```powershell
netstat -ano | findstr "8080\|3000"  # Should show listening connections
```

### "Failed to compile" error
```powershell
cd frontend
del -r node_modules package-lock.json
npm install
npm start
```

---

## API Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/employees` | List all employees |
| GET | `/employees/{id}` | Get single employee |
| POST | `/employees` | Create employee |
| PUT | `/employees/{id}` | Update employee |
| DELETE | `/employees/{id}` | Delete employee |
| POST | `/employees/{id}/profile-picture` | Upload photo |
| POST | `/employees/{id}/address-proof` | Upload document |
| GET | `/employees/{id}/profile-picture` | Download photo |
| GET | `/employees/{id}/address-proof` | Download document |

---

**Backend**: http://localhost:8080
**Frontend**: http://localhost:3000

Made for Clover Infotech ✨
