/**
 * Passport Configuration for OAuth
 * Handles Google OAuth 2.0 authentication strategy
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { randomBytes } from 'crypto';
import { User } from '../models/index.js';

// Google OAuth credentials from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('[Google OAuth] Authentication successful:', profile.id);
          
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const fullName = profile.displayName;
          const googleId = profile.id;
          
          if (!email) {
            return done(new Error('No email provided by Google'), null);
          }

          // Check if user exists with this email
          let user = await User.findOne({ email });

          if (user) {
            // User exists - update Google ID if not set
            if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
              console.log('[Google OAuth] Updated existing user with Google ID:', user._id);
            }
          } else {
            // Create new user with Google account
            user = await User.create({
              email,
              fullName,
              googleId,
              userType: 'student', // Default to student for Google sign-ups
              isVerified: true, // Google accounts are pre-verified
              verifiedAt: new Date(),
              password: randomBytes(16).toString('hex'), // Cryptographically random — not used for login
            });
            
            console.log('[Google OAuth] Created new user:', user._id);
          }

          // Update online status and last login
          await User.findByIdAndUpdate(user._id, {
            isOnline: true,
            lastActiveAt: new Date(),
            lastLoginAt: new Date()
          });

          return done(null, user);
        } catch (error) {
          console.error('[Google OAuth] Error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('[Passport] Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Serialize user to session (not used for JWT but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (not used for JWT but required by Passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
