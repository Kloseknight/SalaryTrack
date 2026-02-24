
# 💼 SalaryTrack Pro
### Private Career Financial Ledger & Trajectory Audit

SalaryTrack Pro is a high-performance, private Progressive Web App (PWA) designed for tracking lifetime salary progression. Optimized for iOS, it uses local storage for sovereign data control and Google Gemini for automated document digitizing.

## 🚀 Live Deployment Instructions

This app is ready for Vercel and GitHub.

### 1. Repository Setup
```bash
git init
git add .
git commit -m "Deployment release"
# Connect to your SalaryTrack repo
git remote add origin https://github.com/your-username/SalaryTrack.git
git push -u origin main
```

### 2. Vercel Hosting
- Link your GitHub repository to [Vercel](https://vercel.com).
- **Environment Variables**: Add `GEMINI_API_KEY` in the project settings. This key must be a valid Google Gemini API Key.
- Deploy.

### 3. iOS "Native" Installation
1. Open your Vercel URL in **Safari** on iPhone.
2. Tap the **Share** button.
3. Select **"Add to Home Screen"**.
4. The app will launch without a browser address bar, respecting the safe area insets for a full-screen experience.

## 🛡 Security & Privacy
- **Zero Database**: Your salary data is stored in your device's `localStorage`.
- **AI Processing**: Images are processed transiently via the Gemini API to extract text. No images are stored on any server by this application.
- **Portability**: Use the **Export Archive** feature on the dashboard to save a JSON backup to your Files app or iCloud Drive.

## 🛠 Strategic Features
- **Metric Dictionary**: Interactive definitions of Momentum, Hourly Value, and Keep Rate.
- **Future Wealth Projection**: Estimates lifetime career yield based on current velocity.
- **Comparative Deltas**: Automatic period-over-period performance auditing.
