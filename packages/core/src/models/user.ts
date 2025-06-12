import { z } from "zod";

/**
 * User theme preferences
 */
export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * User preferences configuration
 */
export const UserPreferencesSchema = z.object({
  theme: ThemeSchema.default("system"),
  currency: z.string().length(3).default("USD"), // ISO 4217 currency codes
  dateFormat: z
    .enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
    .default("MM/DD/YYYY"),
  timezone: z.string().default("America/New_York"), // IANA timezone names
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Core user profile information
 */
export const UserProfileSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  displayName: z.string().min(1, "Display name is required").max(100),
  email: z.string().email("Valid email is required"),
  photoURL: z.string().url().optional(),
  createdAt: z.date(),
  lastLogin: z.date(),
  preferences: UserPreferencesSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * User profile creation input (for new user registration)
 */
export const CreateUserProfileSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
  lastLogin: true,
}).extend({
  preferences: UserPreferencesSchema.partial(), // All preferences optional during creation
});

export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;

/**
 * User profile update input (for profile updates)
 */
export const UpdateUserProfileSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
})
  .partial()
  .extend({
    lastLogin: z.date(), // lastLogin should always be updated
  });

export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;

/**
 * Validation functions
 */
export const validateUserProfile = (data: unknown): UserProfile => {
  return UserProfileSchema.parse(data);
};

export const validateCreateUserProfile = (data: unknown): CreateUserProfile => {
  return CreateUserProfileSchema.parse(data);
};

export const validateUpdateUserProfile = (data: unknown): UpdateUserProfile => {
  return UpdateUserProfileSchema.parse(data);
};

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "system",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  timezone: "America/New_York",
};

/**
 * Helper function to create a new user profile with defaults
 */
export const createUserProfile = (
  input: CreateUserProfile
): Omit<UserProfile, "id"> => {
  const now = new Date();

  return {
    ...input,
    preferences: {
      ...DEFAULT_USER_PREFERENCES,
      ...input.preferences,
    },
    createdAt: now,
    lastLogin: now,
  };
};
