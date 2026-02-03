# Google Sign-In Setup

## Current Status
Google Sign-In is integrated but requires a Google OAuth Client ID to work.

## Setup Instructions

### 1. Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Identity Services API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the **Client ID**

### 2. Update Frontend

Edit `frontend/src/components/SignIn.js`:

Replace:
```javascript
client_id: 'YOUR_GOOGLE_CLIENT_ID',
```

With your actual Client ID:
```javascript
client_id: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
```

### 3. Backend Integration (Optional)

For production, validate Google tokens on the backend:

**Backend Endpoint** (`POST /auth/google`):
```java
@PostMapping("/auth/google")
public ResponseEntity<?> signInWithGoogle(@RequestBody Map<String, String> request) {
    String credential = request.get("credential");
    
    // Verify token with Google
    GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(...)
        .setAudience(Collections.singletonList(CLIENT_ID))
        .build();
    
    GoogleIdToken idToken = verifier.verify(credential);
    if (idToken != null) {
        Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        
        // Check if email is @cloverinfotech.com
        if (!email.endsWith("@cloverinfotech.com")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Access restricted to Clover Infotech employees");
        }
        
        // Create/update user and return JWT
        // ...
    }
}
```

## Current Mock Behavior

- **Email/Password**: Only `@cloverinfotech.com` emails are accepted
- **Role Assignment**: 
  - `admin@cloverinfotech.com`, `hr@cloverinfotech.com`, `manager@cloverinfotech.com` → **Admin**
  - Other `@cloverinfotech.com` emails → **Employee**
  - Non-Clover emails → **Access Denied**

## Testing Without Google OAuth

For now, you can test with email/password:
- Use any email ending with `@cloverinfotech.com`
- Use any password
- Example: `test@cloverinfotech.com` / `password123`

Once you add the Google Client ID, the Google Sign-In button will work.
