# Deploy Employee Manager (Vercel + Render)

Deploy the **frontend** on Vercel and the **backend** on Render. Do the backend first so you have its URL for the frontend.

---

## Prerequisites

- Code pushed to **GitHub** (or GitLab).
- **GitHub account** (for Vercel + Render).

---

## Part 1: Deploy backend on Render

### 1. Create a PostgreSQL database (Render)

1. Go to [render.com](https://render.com) → Sign up / Log in.
2. **New +** → **PostgreSQL**.
3. Name: `employee-manager-db` (or any).
4. Region: choose closest to you.
5. **Create Database**.
6. Wait until it’s **Available**. Open it → **Info** tab.
7. Copy:
   - **Internal Database URL** (use this on Render; looks like `postgres://user:pass@host:5432/dbname`).
   - Or use **Host**, **Port**, **Database**, **User**, **Password** to build a JDBC URL:
     `jdbc:postgresql://HOST:5432/DATABASE?user=USER&password=PASSWORD&sslmode=require`

### 2. Create Web Service (backend)

1. **New +** → **Web Service**.
2. Connect your **GitHub** repo (the one with this project).
3. Settings:
   - **Name:** `employee-manager-api` (or any).
   - **Region:** same as DB.
   - **Root Directory:** `backend/employee-service`
   - **Runtime:** `Java`.
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/employee-service-0.0.1-SNAPSHOT.jar`
     (If the JAR name is different, check `target/` after a build and use that name.)
4. **Environment** (Environment Variables). Add:

   | Key | Value |
   |-----|--------|
   | `SPRING_DATASOURCE_URL` | Your PostgreSQL JDBC URL, e.g. `jdbc:postgresql://host:5432/dbname?user=user&password=pass&sslmode=require` (from Render Postgres **Info**; use Internal URL and convert to JDBC, or build from Host/Database/User/Password). |
   | `SPRING_DATASOURCE_USERNAME` | Postgres user from Render. |
   | `SPRING_DATASOURCE_PASSWORD` | Postgres password from Render. |
   | `APP_FRONTEND_URL` | Your **Vercel** frontend URL (e.g. `https://your-app.vercel.app`). Set this **after** you deploy the frontend; you can add it later and redeploy. |
   | `MAIL_USERNAME` | (Optional) Gmail for sending reset emails. |
   | `MAIL_PASSWORD` | (Optional) Gmail App Password. |

5. **Create Web Service**. Wait for first deploy (can take 5–15 min).
6. Copy your backend URL, e.g. `https://employee-manager-api.onrender.com` (no trailing slash).

**Converting Render Internal DB URL to JDBC**

- Render gives: `postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require`
- JDBC form: `jdbc:postgresql://HOST:5432/DATABASE?user=USER&password=PASSWORD&sslmode=require`
  (Replace USER, PASSWORD, HOST, DATABASE; often port is 5432.)

---

## Part 2: Deploy frontend on Vercel

### 1. Import project

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in (with GitHub).
2. **Add New** → **Project** → Import your GitHub repo.
3. **Configure Project:**
   - **Root Directory:** set to `frontend` (click **Edit**, choose `frontend`).
   - **Framework Preset:** Create React App (usually auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `build` (default for CRA).

### 2. Environment variable

- **Environment Variables** → Add:
  - **Name:** `REACT_APP_API_URL`
  - **Value:** Your Render backend URL, e.g. `https://employee-manager-api.onrender.com` (no trailing slash).

### 3. Deploy

- Click **Deploy**. Wait 1–3 minutes.
- Your app will be at `https://your-project.vercel.app`.

### 4. Point backend to frontend (reset emails)

- In **Render** → your Web Service → **Environment** → add or update:
  - `APP_FRONTEND_URL` = `https://your-project.vercel.app`
- **Save** → Render will redeploy. Now password-reset emails will use this link.

---

## Part 3: Google Sign-In (optional)

If you use Google Sign-In:

1. **Google Cloud Console** → your OAuth client → **Authorized JavaScript origins** add:
   - `https://your-project.vercel.app`
2. **Authorized redirect URIs** add the same if you use redirect flow.

---

## Summary

| Where | What |
|-------|------|
| **Render** | Backend (Web Service) + PostgreSQL. Set `SPRING_DATASOURCE_*`, `APP_FRONTEND_URL`, optional `MAIL_*`. |
| **Vercel** | Frontend. Set `REACT_APP_API_URL` = Render backend URL. |

After deploy, open the Vercel URL. First request after Render free-tier spin-down may take 30–60 seconds.
