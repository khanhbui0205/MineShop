# SETUP GUIDE - EMERALD REALM (MINESHOP)

## 1. Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or on Atlas)
- npm or yarn

## 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Rename `.env.example` to `.env`.
   - Update `MONGODB_URI` with your MongoDB connection string.
   - Change `JWT_SECRET` to a secure random string.
4. Run the backend:
   - Development Mode: `npm run dev`
   - Production Mode: `npm start`

## 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

## 4. Production Deployment (Ubuntu VPS)

### Backend Deployment
1. Install Node.js and MongoDB on the VPS.
2. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
3. Clone the project and set up `.env` as described above.
4. Start backend with PM2:
   ```bash
   pm2 start server.js --name mineshop-backend
   ```

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. The static files will be in `frontend/dist`.

### Nginx Reverse Proxy Configuration
1. Install Nginx: `sudo apt install nginx`
2. Configure site: `/etc/nginx/sites-available/mineshop`
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /path/to/mineshop/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Enable and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mineshop /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 5. Persistence with PM2
To ensure the backend restarts after a reboot:
```bash
pm2 save
pm2 startup
```
