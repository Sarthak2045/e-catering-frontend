# Railway Catering Management System

## 📱 Installation

1. **Clone the repository**
   ```bash
   cd e:\WORK\hotelManagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   
   Or run on emulator/simulator:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

## 🔐 Demo Credentials

```
Email: admin@railway.com
Password: admin123
```

## 📂 Project Structure

```
hotelManagement/
├── App.js                      # Main app component
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── babel.config.js             # Babel configuration
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.js      # Login screen
│   │   ├── DashboardScreen.js  # Dashboard with summary
│   │   ├── OrdersListScreen.js # Orders list with filters
│   │   ├── OrderDetailScreen.js # Order details & actions
│   │   ├── MenuScreen.js       # Menu management
│   │   └── ReportsScreen.js    # Reports & analytics
│   ├── context/
│   │   └── AuthContext.js      # Authentication context
│   ├── services/
│   │   └── api.js              # API service layer
│   └── theme/
│       └── theme.js            # Theme and styling
└── assets/                     # Images and icons
```
