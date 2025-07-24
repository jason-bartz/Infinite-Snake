# GameAnalytics Setup Instructions

## 1. Get Your GameAnalytics Keys

1. Go to [GameAnalytics.com](https://gameanalytics.com) and create an account
2. Create a new game in your dashboard
3. Get your **Game Key** and **Secret Key** from the game settings

## 2. Configure the Integration

Edit `js/analytics/game-analytics.js` and replace the placeholder keys:

```javascript
// Replace these with your actual GameAnalytics keys
GAME_KEY: 'YOUR_GAME_KEY_HERE',
SECRET_KEY: 'YOUR_SECRET_KEY_HERE',
```

## 3. Test the Integration

### Local Testing
1. Open the browser console (F12)
2. Start the game
3. You should see console logs like:
   - `[GA] GameAnalytics initialized successfully`
   - `[GA] Game mode set to: infinite`
   - `[GA] Session started`

### Events Being Tracked

#### Session Events
- Game start/end
- Session length
- Final score

#### Game Mode Events
- Mode selection (infinite, classic, discovery, points, cozy)

#### Player Events
- Deaths (with cause and position)
- Revives used
- Skin selection and unlocks

#### Progression Events
- Boss encounters and defeats
- Element discoveries
- Score milestones

#### Resource Events
- Element collection
- Power-up collection (void orbs, catalyst gems)
- Score gains from various sources

#### Design Events
- Kill streaks
- Average session metrics by game mode
- Feature usage

## 4. Privacy Consent

The integration includes a consent system:
- Consent is stored in `localStorage.analyticsConsent`
- Default is `true` (you can change this in production)
- To test consent:
  ```javascript
  // Disable analytics
  GameAnalyticsWrapper.setConsent(false);
  
  // Enable analytics
  GameAnalyticsWrapper.setConsent(true);
  ```

## 5. Verify in GameAnalytics Dashboard

1. Play the game for a few minutes
2. Go to your GameAnalytics dashboard
3. Check the "Realtime" section to see incoming events
4. Events may take a few minutes to appear

## 6. Production Considerations

1. **Consent Dialog**: Implement a proper consent dialog for GDPR compliance
2. **Build Version**: Update the `BUILD_VERSION` in the config when releasing updates
3. **Custom Dimensions**: The current setup uses:
   - Dimension 01: Game modes
   - Dimension 02: Skins/characters
   - Dimension 03: Boss types
4. **Performance**: Switch to `GameAnalytics.min.js` in production

## Troubleshooting

- **No events showing up**: Check browser console for errors
- **"SDK not found" error**: Ensure GameAnalytics.js loads before game-analytics.js
- **Keys not working**: Verify you're using the correct Game Key and Secret Key
- **Events delayed**: GameAnalytics batches events, they may take a few minutes to appear

## Analytics Best Practices

1. Don't track personally identifiable information
2. Respect user privacy settings
3. Use meaningful event names and categories
4. Monitor your usage to stay within free tier limits
5. Regularly review your analytics to improve the game