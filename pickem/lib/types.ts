export type ClientGame = {
  id: string;
  season: number;
  week: number;
  homeAbbr: string;
  homeName: string;
  homeLogo: string | null;
  awayAbbr: string;
  awayName: string;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  winnerAbbr: string | null;
  shortDetail: string;
  locked: boolean;
};

export type ClientStanding = {
  playerId: number;
  name: string;
  paid: boolean;
  correct: number;
  decided: number;
  totalPicks: number;
  weekCorrect: number;
};

export type Player = { id: number; name: string; paid: boolean };
