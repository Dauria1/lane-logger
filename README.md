# LaneLogger

![LaneLogger Logo](assets/lane-logger.png)

LaneLogger is an Electron-based desktop application for League of Legends players that provides real-time performance statistics and tracking for you and your teammates.

## Features

- **Performance Tracking**: Monitor your daily and overall performance statistics
- **Rank Display**: See your current rank, LP, and win rate at a glance
- **Lane Analysis**: Track performance across different lanes
- **OP.GG Integration**: Easily import summoner names from OP.GG multisearch URLs
- **Overlay Mode**: Displays stats in a compact, always-on-top window for viewing during games
- **Region Support**: Works across all major League of Legends regions

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Riot Games API Key (get one at [Riot Developer Portal](https://developer.riotgames.com/))

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/lane-logger.git
cd lane-logger
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with your Riot API key:

```
RIOT_API_KEY=your-api-key-here
```

4. Start the application

```bash
npm start
```

## Usage

1. Enter an OP.GG multisearch URL containing the summoner names you want to track
2. Select your region
3. Choose which lanes to display in the overlay
4. Click "View Stats" to open the overlay window
5. The overlay will display and cycle through your stats automatically
6. Click "Refresh" to update stats manually

## Development

### Available Scripts

- `npm start` - Run the application
- `npm run lint` - Check for code issues
- `npm run lint:fix` - Automatically fix linting issues
- `npm run format` - Format code according to Prettier rules
- `npm run dev` - Run in development mode
- `npm run debug-main` - Debug the main Electron process
- `npm run debug-renderer` - Debug the renderer process
- `npm run dist` - Build distributable packages

### Project Structure

- `main.js` - Main Electron process
- `index.html` - Main configuration window
- `overlay.html` - Stats overlay window
- `riotService.js` - API integration with Riot Games
- `server.js` - Local server for stats processing
- `config.js` - Application configuration

## Legal Disclaimer

LaneLogger isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Riot Games API](https://developer.riotgames.com/) for providing the League of Legends data
- [Electron](https://www.electronjs.org/) for the framework
- [OP.GG](https://op.gg/) for summoner lookup inspiration
