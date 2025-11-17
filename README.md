# WeUnityX - React Native Social Media App

WeUnityX is a modern React Native social media application built with Expo and Firebase backend integration.

## Features

- **Authentication**: Sign up, sign in, password reset with Firebase Auth
- **Home Feed**: Posts, stories, and social interactions
- **Events**: Create and manage social events with location
- **Messaging**: Real-time chat with users
- **Profiles**: User profiles and settings
- **Search**: Discover users and content
- **Notifications**: Push notifications for activities

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Navigation**: React Navigation v6
- **UI**: React Native Paper + Custom Components
- **Maps**: React Native Maps
- **Notifications**: Expo Notifications

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up Firebase:

   - Create a Firebase project
   - Add your Firebase config to `src/config/firebase.js`
   - Enable Authentication, Firestore, and Storage

3. Start the development server:

   ```bash
   npm start
   ```

4. Run on your device:
   - Install Expo Go app
   - Scan the QR code

## Project Structure

```
src/
├── components/        # Reusable UI components
├── screens/          # App screens
├── navigation/       # Navigation configuration
├── constants/        # Constants and theme
├── utils/           # Utility functions
├── config/          # Firebase and app configuration
└── assets/          # Images, icons, and media
```

## Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Enable Storage for file uploads
5. Add your Firebase configuration to the app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
