import { z } from 'zod';
import type { components } from './generated';

const identifier = z.string().min(1).max(128);

export const apiDescriptionSchema = z.object({
  service: z.literal('FleetIQ'),
  version: z.literal('v1'),
}) satisfies z.ZodType<components['schemas']['ApiDescription']>;

export const assetPageSchema = z.object({
  assets: z
    .array(
      z.object({
        id: identifier,
        tenant_id: identifier,
        name: z.string().min(1),
        asset_type: z.object({
          id: identifier,
          version: z.number().int().min(1).max(4_294_967_295),
        }),
      }),
    )
    .max(100),
  next_after: identifier.nullable(),
}) satisfies z.ZodType<components['schemas']['AssetPage']>;

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
}) satisfies z.ZodType<components['schemas']['Problem']>;

export type ApiDescription = z.infer<typeof apiDescriptionSchema>;
export type AssetPage = z.infer<typeof assetPageSchema>;
export type Problem = z.infer<typeof problemSchema>;

/** Parse untrusted discovery payloads before app code reads them. */
export function parseApiDescription(value: unknown): ApiDescription {
  return apiDescriptionSchema.parse(value);
}

/** Parse untrusted catalogue payloads; generated wire types alone cannot validate data. */
export function parseAssetPage(value: unknown): AssetPage {
  return assetPageSchema.parse(value);
}

/** Parse the common problem shape while allowing compatible future fields. */
export function parseProblem(value: unknown): Problem {
  return problemSchema.parse(value);
}
