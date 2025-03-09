require('dotenv').config();

const REGION_ROUTING = {
  // Americas
  na: 'americas.api.riotgames.com',
  br: 'americas.api.riotgames.com',
  lan: 'americas.api.riotgames.com',
  las: 'americas.api.riotgames.com',
  // Asia
  kr: 'asia.api.riotgames.com',
  jp: 'asia.api.riotgames.com',
  // Europe
  euw: 'europe.api.riotgames.com',
  eune: 'europe.api.riotgames.com',
  tr: 'europe.api.riotgames.com',
  ru: 'europe.api.riotgames.com',
  // SEA
  oce: 'sea.api.riotgames.com',
  ph2: 'sea.api.riotgames.com',
  sg2: 'sea.api.riotgames.com',
  th2: 'sea.api.riotgames.com',
  tw2: 'sea.api.riotgames.com',
  vn2: 'sea.api.riotgames.com',
};

const PLATFORM_ROUTING = {
  euw: 'euw1.api.riotgames.com',
};

const RANK_ICONS = {
  IRON: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/f8/Season_2023_-_Iron.png/revision/latest?cb=20231007195831',
  BRONZE:
    'https://static.wikia.nocookie.net/leagueoflegends/images/c/cb/Season_2023_-_Bronze.png/revision/latest?cb=20231007195824',
  SILVER:
    'https://static.wikia.nocookie.net/leagueoflegends/images/c/c4/Season_2023_-_Silver.png/revision/latest?cb=20231007195834',
  GOLD: 'https://static.wikia.nocookie.net/leagueoflegends/images/7/78/Season_2023_-_Gold.png/revision/latest?cb=20231007195829',
  PLATINUM:
    'https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Season_2023_-_Platinum.png/revision/latest?cb=20231007195833',
  EMERALD:
    'https://static.wikia.nocookie.net/leagueoflegends/images/4/4b/Season_2023_-_Emerald.png/revision/latest?cb=20231007195827',
  DIAMOND:
    'https://static.wikia.nocookie.net/leagueoflegends/images/3/37/Season_2023_-_Diamond.png/revision/latest?cb=20231007195826',
  MASTER:
    'https://static.wikia.nocookie.net/leagueoflegends/images/d/d5/Season_2023_-_Master.png/revision/latest?cb=20231007195832',
  GRANDMASTER:
    'https://static.wikia.nocookie.net/leagueoflegends/images/6/64/Season_2023_-_Grandmaster.png/revision/latest?cb=20231007195830',
  CHALLENGER:
    'https://static.wikia.nocookie.net/leagueoflegends/images/1/14/Season_2023_-_Challenger.png/revision/latest?cb=20231007195825',
};

const config = {
  RIOT_API_KEY: process.env.RIOT_API_KEY,
  REGION_ROUTING,
  PLATFORM_ROUTING,
  PORT: 3000,
  RANK_ICONS,
};

module.exports = config;
