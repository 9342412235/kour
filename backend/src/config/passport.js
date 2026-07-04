import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { query } from '../db/pool.js';

dotenv.config();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email;
          const avatarUrl = profile.photos?.[0]?.value || null;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('Google account has no email'), null);
          }

          // Try to find existing user by google_id or email
          const existing = await query(
            'SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
            [googleId, email]
          );

          let user;
          if (existing.rows.length > 0) {
            const upd = await query(
              `UPDATE users SET google_id = $1, name = $2, avatar_url = $3
               WHERE id = $4 RETURNING *`,
              [googleId, name, avatarUrl, existing.rows[0].id]
            );
            user = upd.rows[0];
          } else {
            // New Google sign-ins are always created as customers. Staff
            // accounts (admin/warehouse/support/blogger) are
            // created exclusively by an Admin — no email auto-promotion.
            const ins = await query(
              `INSERT INTO users (google_id, email, name, avatar_url, role)
               VALUES ($1,$2,$3,$4,'customer') RETURNING *`,
              [googleId, email, name, avatarUrl]
            );
            user = ins.rows[0];
          }

          if (user.status === 'disabled') {
            return done(null, false, { message: 'Account disabled' });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials not configured. Google sign-in is disabled.');
}

// We use stateless JWT auth, but passport still needs (de)serialize for the
// OAuth handshake's brief session.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
