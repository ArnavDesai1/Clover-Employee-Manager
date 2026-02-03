# Authentication System

## Overview
The Employee Manager application now includes authentication similar to ChatGPT's sign-in flow. Users must sign in before accessing employee records.

## Features

### Frontend
- **Profile Icon**: Circle avatar in navbar (shows initials when signed in, user icon when not)
- **Dropdown Menu**: Click profile icon to see:
  - View Profile (shows user details)
  - Sign Out
- **Sign In Page**: Clean, professional sign-in form
- **Protected Routes**: All employee pages require authentication
- **Auto-redirect**: Unauthenticated users are redirected to sign-in page

### Current Implementation (Mock)
- Currently uses mock authentication (accepts any email/password)
- User data stored in localStorage
- Ready for backend integration

## Backend Integration

### To Connect Real Authentication:

1. **Update `frontend/src/services/authAPI.js`**:
   ```javascript
   signIn: async (email, password) => {
     return axiosInstance.post('/auth/signin', { email, password });
   }
   ```

2. **Backend Endpoints Needed**:
   - `POST /auth/signin` - Validate credentials, return JWT + user info
   - `POST /auth/signout` - Invalidate token
   - `GET /auth/me` - Validate token, return current user

## Restricting Access to Clover Employees Only

### Option 1: Email Domain Validation (Recommended)
In your backend `/auth/signin` endpoint:

```java
// Example Spring Boot
@PostMapping("/auth/signin")
public ResponseEntity<?> signIn(@RequestBody SignInRequest request) {
    String email = request.getEmail();
    
    // Check if email domain is @cloverinfotech.com
    if (!email.endsWith("@cloverinfotech.com")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body("Access restricted to Clover Infotech employees only");
    }
    
    // Validate credentials against database
    User user = userService.findByEmail(email);
    if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body("Invalid credentials");
    }
    
    // Generate JWT token
    String token = jwtService.generateToken(user);
    
    return ResponseEntity.ok(new SignInResponse(token, user));
}
```

### Option 2: Whitelist Database
Create a `users` or `employees` table with:
- `email` (unique)
- `password_hash`
- `role` (Admin, HR, Manager, etc.)
- `is_active` (boolean)

Only users in this table can sign in.

### Option 3: LDAP/Active Directory Integration
For enterprise environments, integrate with your organization's LDAP/AD:
- Validate credentials against LDAP
- Check if user belongs to "Clover Infotech" group
- Map LDAP groups to application roles

### Option 4: OAuth/SSO (Future)
- Integrate with company SSO provider (e.g., Azure AD, Okta)
- Only allow users from Clover Infotech tenant
- Automatic role mapping from SSO claims

## Security Best Practices

1. **JWT Tokens**: Use secure, HTTP-only cookies or store tokens securely
2. **Password Hashing**: Use BCrypt or Argon2 in backend
3. **Rate Limiting**: Limit sign-in attempts to prevent brute force
4. **HTTPS**: Always use HTTPS in production
5. **Token Expiry**: Set reasonable JWT expiration times
6. **Refresh Tokens**: Implement refresh token rotation

## Files Created

- `frontend/src/context/AuthContext.js` - Auth state management
- `frontend/src/components/ProfileIcon.js` - Profile dropdown component
- `frontend/src/components/ProfileIcon.css` - Profile icon styles
- `frontend/src/components/SignIn.js` - Sign-in page
- `frontend/src/components/SignIn.css` - Sign-in styles
- `frontend/src/components/ProtectedRoute.js` - Route protection wrapper
- `frontend/src/services/authAPI.js` - Auth API service (ready for backend)

## Usage

Users will:
1. See sign-in page when not authenticated
2. Click profile icon (if visible) to sign in
3. Enter email/password
4. Access employee records after successful sign-in
5. Click profile icon → Sign Out to log out

The app automatically redirects to sign-in when accessing protected routes without authentication.
