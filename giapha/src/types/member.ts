export type Gender = "male" | "female";
export type RelationshipType = "biological" | "adoptive";

export interface Member {
  id: string;
  clanId: string;
  familyName: string;
  middleName: string | null;
  givenName: string;
  fullName: string;
  alias: string | null;
  gender: Gender;
  birthDate: string | null;
  birthDateLunar: string | null;
  deathDate: string | null;
  deathDateLunar: string | null;
  isLiving: number; // 0 or 1
  photoUrl: string | null;
  biography: string | null;
  address: string | null;
  education: string | null;
  occupation: string | null;
  bloodType: string | null;
  phone: string | null;
  email: string | null;
  generation: number;
  birthOrder: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberWithRelations extends Member {
  parents: Member[];
  children: Member[];
  spouses: Member[];
  marriages: Marriage[];
}

export interface Marriage {
  id: string;
  clanId: string;
  partner1Id: string;
  partner2Id: string;
  marriageDate: string | null;
  divorceDate: string | null;
  isActive: number;
  notes: string | null;
  createdAt: string;
}

export interface ParentChildRelationship {
  id: string;
  clanId: string;
  parentId: string;
  childId: string;
  marriageId: string | null;
  relationshipType: RelationshipType;
  birthOrder: number | null;
  notes: string | null;
}

export interface MemberMedia {
  id: string;
  memberId: string;
  url: string;
  caption: string | null;
  mediaType: string;
  sortOrder: number;
  createdAt: string;
}
