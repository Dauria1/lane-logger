const axios = require('axios');
const config = require('./config');

class RiotApiService {
  // Add to RiotApiService class
  constructor(region = 'euw') {
    this.API_KEY = process.env.RIOT_API_KEY;
    if (!this.API_KEY) {
      throw new Error('RIOT_API_KEY environment variable is required');
    }
    this.lastRequestTime = 0;
    this.REQUEST_DELAY = 1200;
    this.cache = new Map();
    this.CACHE_TTL = 60 * 1000;
    this.setRegion(region);
  }

  async makeRequest(url) {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    const response = await axios.get(url);

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response,
    });

    return response;
  }

  setRegion(region) {
    const apiDomain = config.REGION_ROUTING[region.toLowerCase()];
    const platformApiDomain = config.PLATFORM_ROUTING[region.toLowerCase()];

    if (!apiDomain) throw new Error(`Invalid region: ${region}`);

    this.API_BASE_URL = `https://${apiDomain}`;
    this.PLATFORM_API_BASE_URL = `https://${platformApiDomain}`;
  }

  parseSummonerName(summonerName) {
    const [name, tag] = summonerName.split('#');
    return { name: name.trim(), tag: tag.trim() };
  }

  parseSummonerNamesFromURL(url) {
    try {
      if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
        throw new Error('Invalid URL format');
      }

      const parsedUrl = new URL(url);

      if (!parsedUrl.hostname.includes('op.gg')) {
        throw new Error('URL must be from op.gg domain');
      }

      const summoners = parsedUrl.searchParams.get('summoners');
      if (!summoners) throw new Error('No summoners found in URL');

      return summoners.split(',').map(summonerString => {
        const decodedString = decodeURIComponent(summonerString);
        return decodedString.replace(/[<>]/g, '');
      });
    } catch (error) {
      console.error('Error parsing summoner names:', error);
      return [];
    }
  }

  getTimeRange(date) {
    const startTime = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );

    const endTime = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
    );

    return {
      start: Math.floor(startTime.getTime() / 1000),
      end: Math.floor(endTime.getTime() / 1000),
    };
  }

  async fetchSummonerData(puuid) {
    const { data } = await this.makeRequest(
      `${this.PLATFORM_API_BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${this.API_KEY}`
    );
    return data;
  }

  async getRankData(summonerId) {
    const { data } = await this.makeRequest(
      `${this.PLATFORM_API_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${this.API_KEY}`
    );
    if (!data || data.length === 0) {
      return {
        tier: 'UNRANKED',
        leaguePoints: 0,
        wins: 0,
        losses: 0,
      };
    }
    return data[0];
  }

  async getChallengerRank(summonerId) {
    const { data } = await this.makeRequest(
      `${this.PLATFORM_API_BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${this.API_KEY}`
    );
    return data.entries.findIndex(entry => entry.summonerId === summonerId) + 1;
  }

  async fetchPUUID(summonerName) {
    try {
      const { name, tag } = this.parseSummonerName(summonerName);
      const { data } = await this.makeRequest(
        `${
          this.API_BASE_URL
        }/riot/account/v1/accounts/by-riot-id/${name.toLowerCase()}/${tag}?api_key=${this.API_KEY}`
      );
      return data.puuid;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`Summoner not found: ${summonerName}`);
        return null;
      }
      throw error;
    }
  }

  async fetchRecentMatches(puuid, date = new Date()) {
    const { start, end } = this.getTimeRange(date);
    console.log({ puuid, start, end });
    const { data } = await this.makeRequest(
      `${this.API_BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${start}&endTime=${end}&start=0&count=100&api_key=${this.API_KEY}`
      // `${this.API_BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${start}&endTime=${end}&queue=420&start=0&count=100&api_key=${this.API_KEY}`
    );
    console.log({ data });
    return data;
  }

  async fetchMatchDetails(matchId) {
    try {
      const { data } = await this.makeRequest(
        `${this.API_BASE_URL}/lol/match/v5/matches/${matchId}?api_key=${this.API_KEY}`
      );
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  async getMatchesDetails(matchIds) {
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < matchIds.length; i += batchSize) {
      const batch = matchIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(id => this.fetchMatchDetails(id)));
      results.push(...batchResults);
    }

    return results;
  }

  processMatchData(matches, puuid) {
    const matchResults = matches
      .map(match => {
        const participant = match.info.participants.find(p => p.puuid === puuid);
        if (!participant || match.info.participants[0].gameEndedInEarlySurrender) {
          return null;
        }

        const teammates = match.info.participants.filter(p => p.teamId === participant.teamId);
        const lanes = this.processLaneData(teammates);

        return {
          participant,
          team: lanes,
          matchId: match.metadata.matchId,
          timestamp: match.info.gameEndTimestamp,
        };
      })
      .filter(Boolean);

    const winLoss = this.calculateWinLoss(matches, puuid);
    return { matchResults, winLoss };
  }

  processLaneData(teammates) {
    const lanes = {
      TOP: { lane: 'TOP', players: [] },
      JUNGLE: { lane: 'JUNGLE', players: [] },
      MIDDLE: { lane: 'MIDDLE', players: [] },
      BOTTOM: { lane: 'BOTTOM', players: [] },
    };

    teammates.forEach(player => {
      const lane = player.individualPosition === 'UTILITY' ? 'BOTTOM' : player.individualPosition;
      if (lanes[lane]) {
        lanes[lane].players.push(player);
      }
    });

    return lanes;
  }

  calculateWinLoss(matches, puuid) {
    const results = matches
      .map(match => match.info.participants.find(p => p.puuid === puuid)?.win)
      .filter(result => result !== undefined);

    const wins = results.filter(Boolean).length;
    return { WIN: wins, LOSS: results.length - wins };
  }

  async fetchSummonerStats(summonerName) {
    try {
      const puuid = await this.fetchPUUID(summonerName);
      if (!puuid) return null;

      const summonerData = await this.fetchSummonerData(puuid);
      if (!summonerData) return null;

      const matchIds = await this.fetchRecentMatches(puuid);
      const matches = await this.getMatchesDetails(matchIds);
      const { matchResults, winLoss } = this.processMatchData(matches, puuid);

      const rankData = await this.getRankData(summonerData.id);

      const stats = {
        summonerName,
        matchResults,
        winLoss,
        rank: rankData.tier === 'CHALLENGER' ? await this.getChallengerRank(summonerData.id) : null,
        lp: rankData.leaguePoints,
        wins: rankData.wins,
        losses: rankData.losses,
        winPercentage: `${((rankData.wins / (rankData.wins + rankData.losses)) * 100).toFixed(0)}%`,
        rankIcon: config.RANK_ICONS[rankData.tier],
      };

      return stats;
    } catch (error) {
      console.error(`Error fetching stats for ${summonerName}:`, error);
      return null;
    }
  }

  async getKDAStats(summonerNamesUrl) {
    const summonerNames = this.parseSummonerNamesFromURL(summonerNamesUrl);
    console.log(`Processing summoners: ${summonerNames.join(', ')}`);

    const summonersData = await Promise.all(
      summonerNames.map(name => this.fetchSummonerStats(name))
    );
    return this.aggregateKDAData(summonersData.filter(Boolean));
  }

  findMostRecentAccount(summonersData) {
    let mostRecentAccount = null;
    let latestTimestamp = 0;

    console.log(
      'Finding most recent account among:',
      summonersData.map(acc => acc.summonerName)
    );
    summonersData.forEach(account => {
      account.matchResults.forEach(match => {
        // Get the game end timestamp from the participant data
        const timestamp = match.timestamp;
        console.log(`Checking timestamp for ${account.summonerName}:`, timestamp);
        if (timestamp && timestamp > latestTimestamp) {
          console.log(
            `New most recent account found: ${account.summonerName} with timestamp ${timestamp}`
          );
          latestTimestamp = timestamp;
          mostRecentAccount = account;
        }
      });
    });

    return mostRecentAccount;
  }

  aggregateKDAData(summonersData) {
    // Find the account with the most recent game
    const mostRecentAccount = this.findMostRecentAccount(summonersData);

    if (!mostRecentAccount) {
      console.log('No recent account found');
      return null;
    }

    // Do the normal aggregation with the most recent account's display info
    const kdaData = summonersData.reduce(
      (acc, { matchResults, winLoss }) => {
        acc.dailyWinLoss.WIN += winLoss.WIN;
        acc.dailyWinLoss.LOSS += winLoss.LOSS;

        matchResults.forEach(match => {
          this.updateKDAStats(acc, match);
        });

        return acc;
      },
      {
        dailyWinLoss: { WIN: 0, LOSS: 0 },
        dailyKDA: { kills: 0, deaths: 0, assists: 0 },
        lanes: {},
        // Use the most recent account's display information
        summonerName: mostRecentAccount.summonerName,
        rank: mostRecentAccount.rank,
        rankIcon: mostRecentAccount.rankIcon,
        lp: mostRecentAccount.lp,
        // Still aggregate these stats across all accounts
        wins: summonersData.reduce((total, current) => total + current?.wins, 0),
        losses: summonersData.reduce((total, current) => total + current?.losses, 0),
        winPercentage:
          (
            (summonersData.reduce((total, current) => total + current?.wins, 0) /
              summonersData.reduce(
                (total, current) => total + current?.wins + current?.losses,
                0
              )) *
            100
          ).toFixed(0) + '%',
      }
    );

    return kdaData;
  }

  updateKDAStats(stats, match) {
    const { participant, team } = match;

    // Update personal KDA
    stats.dailyKDA.kills += participant.kills;
    stats.dailyKDA.deaths += participant.deaths;
    stats.dailyKDA.assists += participant.assists;

    // Update lane KDA
    Object.entries(team).forEach(([lane, data]) => {
      if (!stats.lanes[lane]) {
        stats.lanes[lane] = { kills: 0, deaths: 0, assists: 0 };
      }

      const laneStats = data.players.reduce(
        (acc, player) => ({
          kills: acc.kills + (player?.kills || 0),
          deaths: acc.deaths + (player?.deaths || 0),
          assists: acc.assists + (player?.assists || 0),
        }),
        { kills: 0, deaths: 0, assists: 0 }
      );

      stats.lanes[lane].kills += laneStats.kills;
      stats.lanes[lane].deaths += laneStats.deaths;
      stats.lanes[lane].assists += laneStats.assists;
    });
  }
}

module.exports = RiotApiService;
