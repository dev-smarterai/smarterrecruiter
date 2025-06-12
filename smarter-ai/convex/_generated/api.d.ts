/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiConfigurationSeed from "../aiConfigurationSeed.js";
import type * as auth from "../auth.js";
import type * as candidates from "../candidates.js";
import type * as crons from "../crons.js";
import type * as cvAnalysis from "../cvAnalysis.js";
import type * as dashboard from "../dashboard.js";
import type * as dataImport from "../dataImport.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as init_prompts from "../init_prompts.js";
import type * as interview_access from "../interview_access.js";
import type * as interview_sessions from "../interview_sessions.js";
import type * as interviews from "../interviews.js";
import type * as interviews_seed from "../interviews_seed.js";
import type * as jobProgress from "../jobProgress.js";
import type * as jobs from "../jobs.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as objective from "../objective.js";
import type * as populateVectorDb from "../populateVectorDb.js";
import type * as prompts from "../prompts.js";
import type * as runVectorDb from "../runVectorDb.js";
import type * as talentPoolTags from "../talentPoolTags.js";
import type * as users from "../users.js";
import type * as vectorSearch from "../vectorSearch.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiConfigurationSeed: typeof aiConfigurationSeed;
  auth: typeof auth;
  candidates: typeof candidates;
  crons: typeof crons;
  cvAnalysis: typeof cvAnalysis;
  dashboard: typeof dashboard;
  dataImport: typeof dataImport;
  files: typeof files;
  http: typeof http;
  init_prompts: typeof init_prompts;
  interview_access: typeof interview_access;
  interview_sessions: typeof interview_sessions;
  interviews: typeof interviews;
  interviews_seed: typeof interviews_seed;
  jobProgress: typeof jobProgress;
  jobs: typeof jobs;
  knowledgeBase: typeof knowledgeBase;
  objective: typeof objective;
  populateVectorDb: typeof populateVectorDb;
  prompts: typeof prompts;
  runVectorDb: typeof runVectorDb;
  talentPoolTags: typeof talentPoolTags;
  users: typeof users;
  vectorSearch: typeof vectorSearch;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
