import {
  PLATFORM_IDS,
  type LinkMap,
  type PlatformId,
  isHttpsUrl,
  validateEmail,
  validatePhone,
  validatePlatformLink,
} from './platforms';

export interface ProfileInput {
  displayName: string;
  headline: string;
  company: string;
  location: string;
  bio: string;
  phone: string;
  contactEmail: string;
  profilePhoto: string;
  coverPhoto: string;
  links: LinkMap;
}

export function emptyLinks(): Record<PlatformId, string> {
  return PLATFORM_IDS.reduce(
    (links, id) => {
      links[id] = '';
      return links;
    },
    {} as Record<PlatformId, string>,
  );
}

export function validateProfile(input: ProfileInput): {
  errors: Record<string, string>;
  links: LinkMap;
} {
  const errors: Record<string, string> = {};
  const displayName = input.displayName.trim();
  if (!displayName) errors.displayName = 'Name is required.';
  else if (displayName.length > 80) errors.displayName = 'Name must be 80 characters or fewer.';
  if (input.headline.trim().length > 80) errors.headline = 'Headline must be 80 characters or fewer.';
  if (input.company.trim().length > 80) errors.company = 'Company must be 80 characters or fewer.';
  if (input.location.trim().length > 80) errors.location = 'Location must be 80 characters or fewer.';
  if (input.bio.trim().length > 600) errors.bio = 'Bio must be 600 characters or fewer.';

  const phone = validatePhone(input.phone);
  if (!phone.ok) errors.phone = phone.error;
  const email = validateEmail(input.contactEmail);
  if (!email.ok) errors.contactEmail = email.error;

  if (!isHttpsUrl(input.profilePhoto.trim())) {
    errors.profilePhoto = 'Profile photo must be an https image URL.';
  }
  if (!isHttpsUrl(input.coverPhoto.trim())) {
    errors.coverPhoto = 'Cover photo must be an https image URL.';
  }

  const links: LinkMap = {};
  for (const id of PLATFORM_IDS) {
    const result = validatePlatformLink(id, input.links[id] ?? '');
    if (!result.ok) errors[`links.${id}`] = result.error;
    else if (!result.empty) links[id] = result.href;
  }

  return { errors, links };
}
