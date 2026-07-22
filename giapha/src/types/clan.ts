export interface Clan {
  id: string;
  name: string;
  description: string | null;
  origin: string | null;
  coverImageUrl: string | null;
  isPublic: number;
  accessCodeHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClanWithStats extends Clan {
  memberCount: number;
  generationCount: number;
}
