import { z } from "zod";

// ==================== Clan ====================
export const createClanSchema = z.object({
  name: z.string().min(2, "Tên dòng họ phải có ít nhất 2 ký tự").max(200),
  description: z.string().max(1000).optional(),
  origin: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  accessCode: z.string().min(4).max(20).optional(),
});

export const updateClanSchema = createClanSchema.partial();

export const verifyAccessCodeSchema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã bảo mật"),
});

// ==================== Member ====================
export const createMemberSchema = z.object({
  clanId: z.string().uuid(),
  familyName: z.string().min(1, "Họ không được để trống").max(50),
  middleName: z.string().max(50).optional(),
  givenName: z.string().min(1, "Tên không được để trống").max(50),
  alias: z.string().max(100).optional(),
  gender: z.enum(["male", "female"]),
  birthDate: z.string().optional(), // ISO date string
  birthDateLunar: z.string().optional(),
  deathDate: z.string().optional(),
  deathDateLunar: z.string().optional(),
  isLiving: z.boolean().default(true),
  photoUrl: z.string().url().optional(),
  biography: z.string().max(5000).optional(),
  address: z.string().max(500).optional(),
  education: z.string().max(500).optional(),
  occupation: z.string().max(500).optional(),
  bloodType: z.string().max(5).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  generation: z.number().int().min(1).default(1),
  birthOrder: z.number().int().optional(),
  notes: z.string().max(2000).optional(),

  // Relationships (optional, for creation with parents)
  parentId: z.string().uuid().optional(),
  spouseId: z.string().uuid().optional(),
});

export const updateMemberSchema = createMemberSchema
  .omit({ clanId: true })
  .partial();

export const memberSearchSchema = z.object({
  search: z.string().optional(),
  generation: z.coerce.number().int().optional(),
  gender: z.enum(["male", "female"]).optional(),
  living: z.coerce.boolean().optional(),
});

// ==================== Marriage ====================
export const createMarriageSchema = z.object({
  clanId: z.string().uuid(),
  partner1Id: z.string().uuid(),
  partner2Id: z.string().uuid(),
  marriageDate: z.string().optional(),
  divorceDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateMarriageSchema = createMarriageSchema
  .omit({ clanId: true, partner1Id: true, partner2Id: true })
  .partial();

// ==================== Parent Child ====================
export const setParentChildSchema = z.object({
  clanId: z.string().uuid(),
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  marriageId: z.string().uuid().optional(),
  relationshipType: z.enum(["biological", "adoptive"]).default("biological"),
  birthOrder: z.number().int().optional(),
  notes: z.string().max(500).optional(),
});

// ==================== Tree Query ====================
export const treeQuerySchema = z.object({
  rootId: z.string().uuid().optional(),
  generations: z.coerce.number().int().min(1).max(20).default(5),
  direction: z.enum(["up", "down"]).default("down"),
});
