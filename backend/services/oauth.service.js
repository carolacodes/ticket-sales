import User from "../models/user.model.js";

export async function findUserByProvider(provider, providerUserId) {
  return await User.findOne({
    oauthProviders: { $elemMatch: { provider, providerUserId } },
  });
}

export async function findUserByEmail(email) {
  return await User.findOne({ email: email.toLowerCase() });
}

export async function createUserWithProvider({
  username,
  email,
  provider,
  providerUserId,
  role,
}) {
  return await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash: null,
    role: role || "BUYER",
    emailVerified: true,
    oauthProviders: [{ provider, providerUserId }],
  });
}

export async function linkProvider(userId, provider, providerUserId) {
  return await User.findByIdAndUpdate(
    userId,
    { $addToSet: { oauthProviders: { provider, providerUserId } } },
    { new: true }
  );
}

function normalizeUsernameBase(base = "") {
  const cleaned = String(base)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
    .slice(0, 20);

  return cleaned || "user";
}

export async function generateUniqueUsername(base) {
  const normalizedBase = normalizeUsernameBase(base);

  let candidate = normalizedBase;
  let counter = 1;

  while (await User.exists({ username: candidate })) {
    const suffix = String(counter);
    const maxBaseLength = 20 - suffix.length;
    candidate = `${normalizedBase.slice(0, maxBaseLength)}${suffix}`;
    counter += 1;
  }

  return candidate;
}