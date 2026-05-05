/**
 * Real audience-API surface for each ad platform.
 *
 * Every operation here maps 1:1 to a public API endpoint. The mock
 * implementations are pure stubs (console + delay) so the UI works
 * end-to-end, but the *signatures* and *constraints* are real.
 *
 * When the backend is wired, swap the `mock*` functions for real
 * fetch calls — no UI changes required.
 */

import type { AdPlatform } from "@/lib/audience/rfdm";

/* ──────────────────────────────────────────────────────────────── */
/*  Real platform constants                                          */
/* ──────────────────────────────────────────────────────────────── */

export interface PlatformApiSpec {
  platform: AdPlatform;
  /** Display name */
  label: string;
  /** Custom Audience create endpoint */
  createEndpoint: string;
  /** Lookalike create endpoint (or null if same as create) */
  lookalikeEndpoint: string;
  /** Endpoint to add hashed user identifiers to an existing audience */
  addUsersEndpoint: string;
  /** Min source size to build a lookalike from this audience */
  lookalikeMinSeedSize: number;
  /** Min audience size to deliver in a campaign */
  minDeliverySize: number;
  /** Lookalike ratio/spec modes available on this platform */
  lookalikeModes: string[];
  /** Hashed identifier types accepted on upload */
  identifierTypes: string[];
  /** Where to set this as an exclusion in a campaign */
  exclusionField: string;
}

export const PLATFORM_API_SPECS: Record<AdPlatform, PlatformApiSpec> = {
  meta: {
    platform: "meta",
    label: "Meta",
    // https://developers.facebook.com/docs/marketing-api/audiences/reference/custom-audience
    createEndpoint: "POST /act_{ad_account_id}/customaudiences",
    lookalikeEndpoint: "POST /act_{ad_account_id}/customaudiences (subtype=LOOKALIKE)",
    addUsersEndpoint: "POST /{custom_audience_id}/users",
    lookalikeMinSeedSize: 100,        // Meta accepts 100; quality ~1k+
    minDeliverySize: 1000,
    lookalikeModes: ["1%", "2%", "3%", "4%", "5%", "6%-10%"],
    identifierTypes: ["EMAIL", "PHONE", "FN", "LN", "GEN", "MADID", "EXTERN_ID"],
    exclusionField: "excluded_custom_audiences (on adset)",
  },
  google: {
    platform: "google",
    label: "Google Ads",
    // https://developers.google.com/google-ads/api/docs/remarketing/audience-types/customer-match
    createEndpoint: "UserListService.MutateUserLists (CRM_BASED_USER_LIST)",
    lookalikeEndpoint: "UserListService.MutateUserLists (LookalikeUserListMetadata)",
    addUsersEndpoint: "OfflineUserDataJobService.AddOperations",
    lookalikeMinSeedSize: 1000,
    minDeliverySize: 1000,
    lookalikeModes: ["NARROW", "BALANCED", "BROAD"],
    identifierTypes: ["hashed_email", "hashed_phone_number", "mobile_id", "third_party_user_id", "address_info"],
    exclusionField: "excluded_user_lists (on ad group)",
  },
  snapchat: {
    platform: "snapchat",
    label: "Snapchat",
    // https://marketingapi.snapchat.com/docs/#custom-audiences
    createEndpoint: "POST /adaccounts/{ad_account_id}/segments",
    lookalikeEndpoint: "POST /adaccounts/{ad_account_id}/segments (creation_spec.lookalike)",
    addUsersEndpoint: "POST /segments/{segment_id}/users",
    lookalikeMinSeedSize: 1000,
    minDeliverySize: 1000,
    lookalikeModes: ["BALANCE", "REACH", "SIMILARITY"],
    identifierTypes: ["EMAIL_SHA256", "PHONE_SHA256", "MOBILE_AD_ID_SHA256"],
    exclusionField: "excluded_segments (on ad squad)",
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok",
    // https://business-api.tiktok.com/portal/docs?id=1739940563606529
    createEndpoint: "POST /open_api/v1.3/dmp/custom_audience/create/",
    lookalikeEndpoint: "POST /open_api/v1.3/dmp/custom_audience/lookalike/create/",
    addUsersEndpoint: "POST /open_api/v1.3/dmp/custom_audience/file/upload/",
    lookalikeMinSeedSize: 1000,
    minDeliverySize: 1000,
    lookalikeModes: ["NARROW", "BALANCED", "BROAD"],
    identifierTypes: ["EMAIL_SHA256", "PHONE_NUMBER_SHA256", "IDFA_SHA256", "GAID_SHA256"],
    exclusionField: "excluded_audience_ids (on ad group)",
  },
  dv360: {
    platform: "dv360",
    label: "YouTube / DV360",
    // https://developers.google.com/display-video/api/reference/rest/v3/firstAndThirdPartyAudiences
    createEndpoint: "firstAndThirdPartyAudiences.create (CUSTOMER_MATCH_CONTACT_INFO_LIST)",
    lookalikeEndpoint: "Inherited from Google Ads Customer Match",
    addUsersEndpoint: "firstAndThirdPartyAudiences.editCustomerMatchMembers",
    lookalikeMinSeedSize: 1000,
    minDeliverySize: 1000,
    lookalikeModes: ["NARROW", "BALANCED", "BROAD"],
    identifierTypes: ["hashed_email", "hashed_phone_number", "mobile_device_id"],
    exclusionField: "excluded_first_and_third_party_audience_group",
  },
};

/* ──────────────────────────────────────────────────────────────── */
/*  Operation types — these are the only real things you can do      */
/*  to an audience from inside the audience manager.                 */
/* ──────────────────────────────────────────────────────────────── */

export interface SyncRequest {
  audienceId: string;
  platforms: AdPlatform[];
}

export interface BuildLookalikeRequest {
  seedAudienceId: string;
  /** Country (ISO-2) for lookalike geo */
  country: string;
  /** Mode — values vary by platform; one of the `lookalikeModes` constants. */
  mode: string;
  platform: AdPlatform;
}

export interface ExportRequest {
  audienceId: string;
  /** "csv" with hashed identifiers — the only format accepted everywhere */
  format: "csv";
}

export interface ExclusionRequest {
  audienceId: string;
  /** When true, this audience is added to every future campaign as exclusion. */
  enable: boolean;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Mock implementations — replace with real fetch in production.    */
/*  Signatures & constraints stay identical.                         */
/* ──────────────────────────────────────────────────────────────── */

export async function mockSyncToPlatforms(req: SyncRequest): Promise<{ ok: true; pushed: AdPlatform[] }> {
  await delay(700);
  // eslint-disable-next-line no-console
  console.log(`[audience-api] sync ${req.audienceId} →`, req.platforms.map((p) => `${p}: ${PLATFORM_API_SPECS[p].createEndpoint}`));
  return { ok: true, pushed: req.platforms };
}

export async function mockBuildLookalike(req: BuildLookalikeRequest): Promise<{ ok: true; newAudienceId: string }> {
  await delay(900);
  const spec = PLATFORM_API_SPECS[req.platform];
  // eslint-disable-next-line no-console
  console.log(`[audience-api] lookalike via ${spec.lookalikeEndpoint}`, req);
  return { ok: true, newAudienceId: `lal_${Date.now()}` };
}

export async function mockExportCsv(req: ExportRequest): Promise<{ ok: true; downloadUrl: string }> {
  await delay(400);
  // eslint-disable-next-line no-console
  console.log(`[audience-api] export ${req.audienceId} format=${req.format}`);
  return { ok: true, downloadUrl: `/api/audiences/${req.audienceId}/export.csv` };
}

export async function mockToggleExclusion(req: ExclusionRequest): Promise<{ ok: true; enabled: boolean }> {
  await delay(300);
  // eslint-disable-next-line no-console
  console.log(`[audience-api] exclusion ${req.audienceId} enable=${req.enable}`);
  return { ok: true, enabled: req.enable };
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ──────────────────────────────────────────────────────────────── */
/*  Constraint helpers — used by the UI to disable/warn on actions   */
/* ──────────────────────────────────────────────────────────────── */

/** Can we build a lookalike from this seed on this platform? */
export function canBuildLookalike(audienceSize: number, platform: AdPlatform): { ok: boolean; reason?: string } {
  const spec = PLATFORM_API_SPECS[platform];
  if (audienceSize < spec.lookalikeMinSeedSize) {
    return {
      ok: false,
      reason: `Seed must have at least ${spec.lookalikeMinSeedSize.toLocaleString()} matched users on ${spec.label}.`,
    };
  }
  return { ok: true };
}

/** Will the audience deliver in a campaign on this platform? */
export function canDeliver(audienceSize: number, platform: AdPlatform): { ok: boolean; reason?: string } {
  const spec = PLATFORM_API_SPECS[platform];
  if (audienceSize < spec.minDeliverySize) {
    return {
      ok: false,
      reason: `Below ${spec.minDeliverySize.toLocaleString()} minimum on ${spec.label}.`,
    };
  }
  return { ok: true };
}
