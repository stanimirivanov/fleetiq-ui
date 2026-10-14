import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import type { SchemaError } from "effect/Schema"
import * as Schema from "effect/Schema"
import type * as HttpClient from "effect/http/HttpClient"
import * as HttpClientError from "effect/http/HttpClientError"
import * as HttpClientRequest from "effect/http/HttpClientRequest"
import * as HttpClientResponse from "effect/http/HttpClientResponse"
// non-recursive definitions
export type TenantAction = "access.manage" | "metadata.manage" | "metadata.read"
export const TenantAction = Schema.Literals(["access.manage", "metadata.manage", "metadata.read"]).annotate({ "description": "An exact granted tenant action; no action implies another.", "identifier": "TenantAction" })
export type Problem = { readonly "type": string, readonly "title": string, readonly "status": number } & { readonly [x: string]: Schema.Json }
export const Problem = Schema.StructWithRest(Schema.Struct({ "type": Schema.String, "title": Schema.String, "status": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(400).annotate({ "expected": "a value greater than or equal to 400" })).check(Schema.isLessThanOrEqualTo(599).annotate({ "expected": "a value less than or equal to 599" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Minimum application/problem+json shape. Future compatible problems may include optional fields.", "identifier": "Problem" })
export type ApiDescription = { readonly "service": "FleetIQ", readonly "version": "v1" } & { readonly [x: string]: Schema.Json }
export const ApiDescription = Schema.StructWithRest(Schema.Struct({ "service": Schema.Literal("FleetIQ"), "version": Schema.Literal("v1") }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "ApiDescription" })
export type AssetTypeRef = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const AssetTypeRef = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeRef" })
export type ExternalIdentifier = { readonly "kind": string, readonly "authority": string | null, readonly "value": string } & { readonly [x: string]: Schema.Json }
export const ExternalIdentifier = Schema.StructWithRest(Schema.Struct({ "kind": Schema.String.annotate({ "description": "Identifier namespace, such as manufacturer.serial-number." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "authority": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Optional issuing authority within this tenant-owned namespace." }), "value": Schema.String.annotate({ "description": "External identifier value; no kind is assumed universal." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Tenant-owned typed external identifier.", "identifier": "ExternalIdentifier" })
export type RelationshipTypeRef = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeRef = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Relationship-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact immutable relationship-type version.", "identifier": "RelationshipTypeRef" })
export type EffectiveInterval = { readonly "start_ms": number, readonly "end_ms": number | null } & { readonly [x: string]: Schema.Json }
export const EffectiveInterval = Schema.StructWithRest(Schema.Struct({ "start_ms": Schema.Number.annotate({ "description": "Inclusive physical effective start in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "end_ms": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })), Schema.Null]).annotate({ "description": "Exclusive physical effective end; null means open-ended.", "format": "int64" }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Half-open physical time interval [start_ms, end_ms).", "identifier": "EffectiveInterval" })
export type SignalSource = { readonly "device_asset_id": string, readonly "endpoint_id": string, readonly "signal_id": string } & { readonly [x: string]: Schema.Json }
export const SignalSource = Schema.StructWithRest(Schema.Struct({ "device_asset_id": Schema.String.annotate({ "description": "Communication-device asset ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoint_id": Schema.String.annotate({ "description": "Source endpoint ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "signal_id": Schema.String.annotate({ "description": "Decoded source signal ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact device endpoint and source signal tuple.", "identifier": "SignalSource" })
export type PropertyReference = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const PropertyReference = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Property definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact immutable property-definition version.", "identifier": "PropertyReference" })
export type PropertyDefinition = { readonly "id": string, readonly "version": number, readonly "name": string, readonly "value_kind": "boolean" | "integer" | "decimal" | "text", readonly "canonical_unit": string | null } & { readonly [x: string]: Schema.Json }
export const PropertyDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable property definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "value_kind": Schema.Literals(["boolean", "integer", "decimal", "text"]), "canonical_unit": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), Schema.Null]).annotate({ "description": "Canonical configured unit, or null if this property is unitless." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "PropertyDefinition" })
export type RelationshipTypeDefinition = { readonly "id": string, readonly "version": number, readonly "name": string } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable relationship-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "RelationshipTypeDefinition" })
export type OperatorSession = { readonly "actor_id": string, readonly "expires_at_ms": number }
export const OperatorSession = Schema.Struct({ "actor_id": Schema.String.annotate({ "description": "Internal actor established at sign-in, with its current identity mapping revalidated." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "expires_at_ms": Schema.Number.annotate({ "description": "Absolute expiry in Unix epoch milliseconds; no sliding renewal.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })) }).annotate({ "identifier": "OperatorSession" })
export type OperatorTenant = { readonly "tenant_id": string, readonly "actions": ReadonlyArray<TenantAction> }
export const OperatorTenant = Schema.Struct({ "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "actions": Schema.Array(TenantAction).annotate({ "description": "Explicit current grants ordered by action name; never reusable authorization." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxLength(3).annotate({ "expected": "a value with a length of at most 3" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })) }).annotate({ "identifier": "OperatorTenant" })
export type AssetSummary = { readonly "id": string, readonly "tenant_id": string, readonly "name": string, readonly "asset_type": AssetTypeRef } & { readonly [x: string]: Schema.Json }
export const AssetSummary = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "asset_type": AssetTypeRef }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetSummary" })
export type Asset = { readonly "id": string, readonly "tenant_id": string, readonly "name": string, readonly "asset_type": AssetTypeRef, readonly "external_identifiers": ReadonlyArray<ExternalIdentifier> } & { readonly [x: string]: Schema.Json }
export const Asset = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Internal FleetIQ asset identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "asset_type": AssetTypeRef, "external_identifiers": Schema.Array(ExternalIdentifier) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact asset identity with its pinned type and external identifiers.", "identifier": "Asset" })
export type Relationship = { readonly "id": string, readonly "tenant_id": string, readonly "revision": string, readonly "recorded_at_ms": number, readonly "relationship_type": RelationshipTypeRef, readonly "source_asset_id": string, readonly "target_asset_id": string, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const Relationship = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Stable relationship identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "revision": Schema.String.annotate({ "description": "Positive u64 revision serialized as decimal text to preserve JavaScript precision." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "recorded_at_ms": Schema.Number.annotate({ "description": "When FleetIQ learned this revision, in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "relationship_type": RelationshipTypeRef, "source_asset_id": Schema.String.annotate({ "description": "Directed source asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "target_asset_id": Schema.String.annotate({ "description": "Directed target asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One recorded revision of a directed asset relationship.", "identifier": "Relationship" })
export type SignalTarget = { readonly "asset_id": string, readonly "property": PropertyReference } & { readonly [x: string]: Schema.Json }
export const SignalTarget = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Observed target asset ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "property": PropertyReference }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Semantically attributed target asset and exact property version.", "identifier": "SignalTarget" })
export type AssetTypeDefinition = { readonly "id": string, readonly "version": number, readonly "name": string, readonly "supported_properties": ReadonlyArray<PropertyReference> } & { readonly [x: string]: Schema.Json }
export const AssetTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable asset-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "supported_properties": Schema.Array(PropertyReference).annotate({ "description": "Ordered exact property-definition references." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeDefinition" })
export type OperatorTenantPage = { readonly "tenants": ReadonlyArray<OperatorTenant>, readonly "next_after": string | null }
export const OperatorTenantPage = Schema.Struct({ "tenants": Schema.Array(OperatorTenant).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Last emitted tenant ID when another tenant exists; otherwise null." }) }).annotate({ "identifier": "OperatorTenantPage" })
export type AssetPage = { readonly "assets": ReadonlyArray<AssetSummary>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetPage = Schema.StructWithRest(Schema.Struct({ "assets": Schema.Array(AssetSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive cursor for the next page, or null when no next page exists." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetPage" })
export type RelationshipSnapshot = { readonly "asset_id": string, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "relationships": ReadonlyArray<Relationship>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const RelationshipSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Queried current-catalogue asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "relationships": Schema.Array(Relationship).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable relationship-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal relationship page for an asset.", "identifier": "RelationshipSnapshot" })
export type SignalBinding = { readonly "id": string, readonly "tenant_id": string, readonly "revision": string, readonly "recorded_at_ms": number, readonly "source": SignalSource, readonly "target": SignalTarget, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const SignalBinding = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Stable signal-binding identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "revision": Schema.String.annotate({ "description": "Positive u64 revision serialized as decimal text to preserve JavaScript precision." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "recorded_at_ms": Schema.Number.annotate({ "description": "When FleetIQ learned this revision, in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "source": SignalSource, "target": SignalTarget, "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One recorded signal-to-asset-property attribution revision.", "identifier": "SignalBinding" })
export type AssetBindingSnapshot = { readonly "asset_id": string, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Queried target asset in the current catalogue." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable binding-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal signal-binding page targeting an asset.", "identifier": "AssetBindingSnapshot" })
export type SourceBindingSnapshot = { readonly "source": SignalSource, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const SourceBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "source": SignalSource, "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable binding-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal signal-binding page for an exact source signal.", "identifier": "SourceBindingSnapshot" })
// schemas
export type ListOperatorTenantsParams = { readonly "limit"?: number, readonly "after"?: string }
export const ListOperatorTenantsParams = Schema.Struct({ "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type ListOperatorTenants200 = OperatorTenantPage
export const ListOperatorTenants200 = OperatorTenantPage
export type ListOperatorTenants400 = Problem
export const ListOperatorTenants400 = Problem
export type ListOperatorTenants401 = Problem
export const ListOperatorTenants401 = Problem
export type ListOperatorTenants500 = Problem
export const ListOperatorTenants500 = Problem
export type GetApiVersion200 = ApiDescription
export const GetApiVersion200 = ApiDescription
export type ListAssetsParams = { readonly "limit"?: number, readonly "after"?: string }
export const ListAssetsParams = Schema.Struct({ "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type ListAssets200 = AssetPage
export const ListAssets200 = AssetPage
export type ListAssets400 = Problem
export const ListAssets400 = Problem
export type ListAssets401 = Problem
export const ListAssets401 = Problem
export type ListAssets403 = Problem
export const ListAssets403 = Problem
export type ListAssets500 = Problem
export const ListAssets500 = Problem
export type GetAsset200 = Asset
export const GetAsset200 = Asset
export type GetAsset400 = Problem
export const GetAsset400 = Problem
export type GetAsset401 = Problem
export const GetAsset401 = Problem
export type GetAsset403 = Problem
export const GetAsset403 = Problem
export type GetAsset404 = Problem
export const GetAsset404 = Problem
export type GetAsset500 = Problem
export const GetAsset500 = Problem
export type ListAssetRelationshipsParams = { readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "limit"?: number, readonly "after"?: string }
export const ListAssetRelationshipsParams = Schema.Struct({ "effective_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds when the physical relationship or binding must apply. Intervals are half-open.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds through which recorded revisions are known; a correction may change a later snapshot.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.annotate({ "description": "Exclusive cursor." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type ListAssetRelationships200 = RelationshipSnapshot
export const ListAssetRelationships200 = RelationshipSnapshot
export type ListAssetRelationships400 = Problem
export const ListAssetRelationships400 = Problem
export type ListAssetRelationships401 = Problem
export const ListAssetRelationships401 = Problem
export type ListAssetRelationships403 = Problem
export const ListAssetRelationships403 = Problem
export type ListAssetRelationships404 = Problem
export const ListAssetRelationships404 = Problem
export type ListAssetRelationships500 = Problem
export const ListAssetRelationships500 = Problem
export type ListAssetSignalBindingsParams = { readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "limit"?: number, readonly "after"?: string }
export const ListAssetSignalBindingsParams = Schema.Struct({ "effective_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds when the physical relationship or binding must apply. Intervals are half-open.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds through which recorded revisions are known; a correction may change a later snapshot.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.annotate({ "description": "Exclusive cursor." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type ListAssetSignalBindings200 = AssetBindingSnapshot
export const ListAssetSignalBindings200 = AssetBindingSnapshot
export type ListAssetSignalBindings400 = Problem
export const ListAssetSignalBindings400 = Problem
export type ListAssetSignalBindings401 = Problem
export const ListAssetSignalBindings401 = Problem
export type ListAssetSignalBindings403 = Problem
export const ListAssetSignalBindings403 = Problem
export type ListAssetSignalBindings404 = Problem
export const ListAssetSignalBindings404 = Problem
export type ListAssetSignalBindings500 = Problem
export const ListAssetSignalBindings500 = Problem
export type ListSourceSignalBindingsParams = { readonly "device_asset_id": string, readonly "endpoint_id": string, readonly "signal_id": string, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "limit"?: number, readonly "after"?: string }
export const ListSourceSignalBindingsParams = Schema.Struct({ "device_asset_id": Schema.String.annotate({ "description": "Communication-device asset ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoint_id": Schema.String.annotate({ "description": "Device endpoint ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "signal_id": Schema.String.annotate({ "description": "Decoded source signal ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds when the physical relationship or binding must apply. Intervals are half-open.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Signed Unix milliseconds through which recorded revisions are known; a correction may change a later snapshot.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.annotate({ "description": "Exclusive cursor." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type ListSourceSignalBindings200 = SourceBindingSnapshot
export const ListSourceSignalBindings200 = SourceBindingSnapshot
export type ListSourceSignalBindings400 = Problem
export const ListSourceSignalBindings400 = Problem
export type ListSourceSignalBindings401 = Problem
export const ListSourceSignalBindings401 = Problem
export type ListSourceSignalBindings403 = Problem
export const ListSourceSignalBindings403 = Problem
export type ListSourceSignalBindings500 = Problem
export const ListSourceSignalBindings500 = Problem
export type GetAssetTypeDefinition200 = AssetTypeDefinition
export const GetAssetTypeDefinition200 = AssetTypeDefinition
export type GetAssetTypeDefinition400 = Problem
export const GetAssetTypeDefinition400 = Problem
export type GetAssetTypeDefinition401 = Problem
export const GetAssetTypeDefinition401 = Problem
export type GetAssetTypeDefinition403 = Problem
export const GetAssetTypeDefinition403 = Problem
export type GetAssetTypeDefinition404 = Problem
export const GetAssetTypeDefinition404 = Problem
export type GetAssetTypeDefinition500 = Problem
export const GetAssetTypeDefinition500 = Problem
export type GetPropertyDefinition200 = PropertyDefinition
export const GetPropertyDefinition200 = PropertyDefinition
export type GetPropertyDefinition400 = Problem
export const GetPropertyDefinition400 = Problem
export type GetPropertyDefinition401 = Problem
export const GetPropertyDefinition401 = Problem
export type GetPropertyDefinition403 = Problem
export const GetPropertyDefinition403 = Problem
export type GetPropertyDefinition404 = Problem
export const GetPropertyDefinition404 = Problem
export type GetPropertyDefinition500 = Problem
export const GetPropertyDefinition500 = Problem
export type GetRelationshipTypeDefinition200 = RelationshipTypeDefinition
export const GetRelationshipTypeDefinition200 = RelationshipTypeDefinition
export type GetRelationshipTypeDefinition400 = Problem
export const GetRelationshipTypeDefinition400 = Problem
export type GetRelationshipTypeDefinition401 = Problem
export const GetRelationshipTypeDefinition401 = Problem
export type GetRelationshipTypeDefinition403 = Problem
export const GetRelationshipTypeDefinition403 = Problem
export type GetRelationshipTypeDefinition404 = Problem
export const GetRelationshipTypeDefinition404 = Problem
export type GetRelationshipTypeDefinition500 = Problem
export const GetRelationshipTypeDefinition500 = Problem
export type BeginOperatorLogin401 = Problem
export const BeginOperatorLogin401 = Problem
export type BeginOperatorLogin405 = Problem
export const BeginOperatorLogin405 = Problem
export type BeginOperatorLogin500 = Problem
export const BeginOperatorLogin500 = Problem
export type CompleteOperatorLoginParams = { readonly "code"?: string, readonly "state": string, readonly "error"?: string }
export const CompleteOperatorLoginParams = Schema.Struct({ "code": Schema.optionalKey(Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(4096).annotate({ "expected": "a string with at most 4096 code points" }))), "state": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(512).annotate({ "expected": "a string with at most 512 code points" })), "error": Schema.optionalKey(Schema.String) })
export type CompleteOperatorLogin400 = Problem
export const CompleteOperatorLogin400 = Problem
export type CompleteOperatorLogin401 = Problem
export const CompleteOperatorLogin401 = Problem
export type CompleteOperatorLogin405 = Problem
export const CompleteOperatorLogin405 = Problem
export type CompleteOperatorLogin500 = Problem
export const CompleteOperatorLogin500 = Problem
export type GetOperatorSession200 = OperatorSession
export const GetOperatorSession200 = OperatorSession
export type GetOperatorSession401 = Problem
export const GetOperatorSession401 = Problem
export type GetOperatorSession405 = Problem
export const GetOperatorSession405 = Problem
export type GetOperatorSession500 = Problem
export const GetOperatorSession500 = Problem
export type EndOperatorSessionParams = { readonly "Origin": string, readonly "X-FleetIQ-CSRF": "1" }
export const EndOperatorSessionParams = Schema.Struct({ "Origin": Schema.String, "X-FleetIQ-CSRF": Schema.Literal("1") })
export type EndOperatorSession401 = Problem
export const EndOperatorSession401 = Problem
export type EndOperatorSession403 = Problem
export const EndOperatorSession403 = Problem
export type EndOperatorSession405 = Problem
export const EndOperatorSession405 = Problem
export type EndOperatorSession500 = Problem
export const EndOperatorSession500 = Problem

export interface OperationConfig {
  /**
   * Whether or not the response should be included in the value returned from
   * an operation.
   *
   * If set to `true`, a tuple of `[A, HttpClientResponse]` will be returned,
   * where `A` is the success type of the operation.
   *
   * If set to `false`, only the success type of the operation will be returned.
   */
  readonly includeResponse?: boolean | undefined
}

/**
 * A utility type which optionally includes the response in the return result
 * of an operation based upon the value of the `includeResponse` configuration
 * option.
 */
export type WithOptionalResponse<A, Config extends OperationConfig | undefined> = Config extends {
  readonly includeResponse: true
} ? [A, HttpClientResponse.HttpClientResponse]
  : Config extends { readonly includeResponse?: false | undefined } | undefined ? A
  : A | [A, HttpClientResponse.HttpClientResponse]

export const make = (
  httpClient: HttpClient.HttpClient,
  options: {
    readonly transformClient?: ((client: HttpClient.HttpClient) => Effect.Effect<HttpClient.HttpClient>) | undefined
  } = {}
): FleetIqApi => {
  const unexpectedStatus = (response: HttpClientResponse.HttpClientResponse) =>
    Effect.flatMap(
      Effect.orElseSucceed(response.json, () => "Unexpected status code"),
      (description) =>
        Effect.fail(
          new HttpClientError.HttpClientError({
            reason: new HttpClientError.StatusCodeError({
              request: response.request,
              response,
              description: typeof description === "string" ? description : JSON.stringify(description),
            }),
          }),
        ),
    )
  const withResponse = <Config extends OperationConfig>(config: Config | undefined) => (
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<any, any>,
  ): (request: HttpClientRequest.HttpClientRequest) => Effect.Effect<any, any> => {
    const withOptionalResponse = (
      config?.includeResponse
        ? (response: HttpClientResponse.HttpClientResponse) => Effect.map(f(response), (a) => [a, response])
        : (response: HttpClientResponse.HttpClientResponse) => f(response)
    ) as any
    return options?.transformClient
      ? (request) =>
          Effect.flatMap(
            Effect.flatMap(options.transformClient!(httpClient), (client) => client.execute(request)),
            withOptionalResponse
          )
      : (request) => Effect.flatMap(httpClient.execute(request), withOptionalResponse)
  }
  const __encodePathParam = encodeURIComponent
  const __makePathRequest = (
    method: (url: string) => HttpClientRequest.HttpClientRequest,
    parameters: ReadonlyArray<string>,
    getPath: () => string,
  ) => Effect.suspend(() => {
    const fail = (description: string, cause?: unknown) => Effect.fail(
      new HttpClientError.HttpClientError({
        reason: new HttpClientError.InvalidUrlError({
          request: method(""),
          cause,
          description,
        }),
      }),
    )
    if (parameters.some((value) => value === "" || /^(?:\.|%2e){1,2}$/i.test(value))) {
      return fail("Path parameters must be non-empty and cannot be dot segments")
    }
    let path: string
    try {
      path = getPath()
    } catch (cause) {
      return fail("Failed to encode path parameter", cause)
    }
    if (path.split("/").some((segment) => /^(?:\.|%2e){1,2}$/i.test(segment))) {
      return fail("Request paths cannot contain dot segments")
    }
    return Effect.succeed(method(path))
  })
  const decodeSuccess =
    <Schema extends Schema.Constraint>(schema: Schema) =>
    (response: HttpClientResponse.HttpClientResponse) =>
      HttpClientResponse.schemaBodyJson(schema)(response)
  const decodeError =
    <const Tag extends string, Schema extends Schema.Constraint>(tag: Tag, schema: Schema) =>
    (response: HttpClientResponse.HttpClientResponse) =>
      Effect.flatMap(
        HttpClientResponse.schemaBodyJson(schema)(response),
        (cause) => Effect.fail(FleetIqApiError(tag, cause, response)),
      )
  return {
    httpClient,
    "listOperatorTenants": (options: Parameters<FleetIqApi["listOperatorTenants"]>[0]) => HttpClientRequest.get("/api/v1/me/tenants").pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListOperatorTenants200),
      "400": decodeError("ListOperatorTenants400", ListOperatorTenants400),
      "401": decodeError("ListOperatorTenants401", ListOperatorTenants401),
      "500": decodeError("ListOperatorTenants500", ListOperatorTenants500),
      orElse: unexpectedStatus
    }))
    ),
    "getApiVersion": (options: Parameters<FleetIqApi["getApiVersion"]>[0]) => HttpClientRequest.get("/api/v1").pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetApiVersion200),
      orElse: unexpectedStatus
    }))
    ),
    "listAssets": (tenantId, options: Parameters<FleetIqApi["listAssets"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListAssets200),
      "400": decodeError("ListAssets400", ListAssets400),
      "401": decodeError("ListAssets401", ListAssets401),
      "403": decodeError("ListAssets403", ListAssets403),
      "500": decodeError("ListAssets500", ListAssets500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getAsset": (tenantId, assetId, options: Parameters<FleetIqApi["getAsset"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetAsset200),
      "400": decodeError("GetAsset400", GetAsset400),
      "401": decodeError("GetAsset401", GetAsset401),
      "403": decodeError("GetAsset403", GetAsset403),
      "404": decodeError("GetAsset404", GetAsset404),
      "500": decodeError("GetAsset500", GetAsset500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listAssetRelationships": (tenantId, assetId, options: Parameters<FleetIqApi["listAssetRelationships"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/relationships").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListAssetRelationships200),
      "400": decodeError("ListAssetRelationships400", ListAssetRelationships400),
      "401": decodeError("ListAssetRelationships401", ListAssetRelationships401),
      "403": decodeError("ListAssetRelationships403", ListAssetRelationships403),
      "404": decodeError("ListAssetRelationships404", ListAssetRelationships404),
      "500": decodeError("ListAssetRelationships500", ListAssetRelationships500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listAssetSignalBindings": (tenantId, assetId, options: Parameters<FleetIqApi["listAssetSignalBindings"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/signal-bindings").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListAssetSignalBindings200),
      "400": decodeError("ListAssetSignalBindings400", ListAssetSignalBindings400),
      "401": decodeError("ListAssetSignalBindings401", ListAssetSignalBindings401),
      "403": decodeError("ListAssetSignalBindings403", ListAssetSignalBindings403),
      "404": decodeError("ListAssetSignalBindings404", ListAssetSignalBindings404),
      "500": decodeError("ListAssetSignalBindings500", ListAssetSignalBindings500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listSourceSignalBindings": (tenantId, options: Parameters<FleetIqApi["listSourceSignalBindings"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/signal-bindings").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "device_asset_id": options.params["device_asset_id"] as any, "endpoint_id": options.params["endpoint_id"] as any, "signal_id": options.params["signal_id"] as any, "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListSourceSignalBindings200),
      "400": decodeError("ListSourceSignalBindings400", ListSourceSignalBindings400),
      "401": decodeError("ListSourceSignalBindings401", ListSourceSignalBindings401),
      "403": decodeError("ListSourceSignalBindings403", ListSourceSignalBindings403),
      "500": decodeError("ListSourceSignalBindings500", ListSourceSignalBindings500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getAssetTypeDefinition": (tenantId, typeId, version, options: Parameters<FleetIqApi["getAssetTypeDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, typeId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/asset-types/" + __encodePathParam(typeId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetAssetTypeDefinition200),
      "400": decodeError("GetAssetTypeDefinition400", GetAssetTypeDefinition400),
      "401": decodeError("GetAssetTypeDefinition401", GetAssetTypeDefinition401),
      "403": decodeError("GetAssetTypeDefinition403", GetAssetTypeDefinition403),
      "404": decodeError("GetAssetTypeDefinition404", GetAssetTypeDefinition404),
      "500": decodeError("GetAssetTypeDefinition500", GetAssetTypeDefinition500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getPropertyDefinition": (tenantId, propertyId, version, options: Parameters<FleetIqApi["getPropertyDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, propertyId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetPropertyDefinition200),
      "400": decodeError("GetPropertyDefinition400", GetPropertyDefinition400),
      "401": decodeError("GetPropertyDefinition401", GetPropertyDefinition401),
      "403": decodeError("GetPropertyDefinition403", GetPropertyDefinition403),
      "404": decodeError("GetPropertyDefinition404", GetPropertyDefinition404),
      "500": decodeError("GetPropertyDefinition500", GetPropertyDefinition500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getRelationshipTypeDefinition": (tenantId, typeId, version, options: Parameters<FleetIqApi["getRelationshipTypeDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, typeId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/relationship-types/" + __encodePathParam(typeId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetRelationshipTypeDefinition200),
      "400": decodeError("GetRelationshipTypeDefinition400", GetRelationshipTypeDefinition400),
      "401": decodeError("GetRelationshipTypeDefinition401", GetRelationshipTypeDefinition401),
      "403": decodeError("GetRelationshipTypeDefinition403", GetRelationshipTypeDefinition403),
      "404": decodeError("GetRelationshipTypeDefinition404", GetRelationshipTypeDefinition404),
      "500": decodeError("GetRelationshipTypeDefinition500", GetRelationshipTypeDefinition500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "beginOperatorLogin": (options: Parameters<FleetIqApi["beginOperatorLogin"]>[0]) => HttpClientRequest.get("/api/v1/auth/login").pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "401": decodeError("BeginOperatorLogin401", BeginOperatorLogin401),
      "405": decodeError("BeginOperatorLogin405", BeginOperatorLogin405),
      "500": decodeError("BeginOperatorLogin500", BeginOperatorLogin500),
      "303": () => Effect.void,
      orElse: unexpectedStatus
    }))
    ),
    "completeOperatorLogin": (options: Parameters<FleetIqApi["completeOperatorLogin"]>[0]) => HttpClientRequest.get("/api/v1/auth/callback").pipe(
      HttpClientRequest.setUrlParams({ "code": options.params["code"] as any, "state": options.params["state"] as any, "error": options.params["error"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "400": decodeError("CompleteOperatorLogin400", CompleteOperatorLogin400),
      "401": decodeError("CompleteOperatorLogin401", CompleteOperatorLogin401),
      "405": decodeError("CompleteOperatorLogin405", CompleteOperatorLogin405),
      "500": decodeError("CompleteOperatorLogin500", CompleteOperatorLogin500),
      "303": () => Effect.void,
      orElse: unexpectedStatus
    }))
    ),
    "getOperatorSession": (options: Parameters<FleetIqApi["getOperatorSession"]>[0]) => HttpClientRequest.get("/api/v1/auth/session").pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetOperatorSession200),
      "401": decodeError("GetOperatorSession401", GetOperatorSession401),
      "405": decodeError("GetOperatorSession405", GetOperatorSession405),
      "500": decodeError("GetOperatorSession500", GetOperatorSession500),
      orElse: unexpectedStatus
    }))
    ),
    "endOperatorSession": (options: Parameters<FleetIqApi["endOperatorSession"]>[0]) => HttpClientRequest.post("/api/v1/auth/logout").pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params["X-FleetIQ-CSRF"] ?? undefined }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "401": decodeError("EndOperatorSession401", EndOperatorSession401),
      "403": decodeError("EndOperatorSession403", EndOperatorSession403),
      "405": decodeError("EndOperatorSession405", EndOperatorSession405),
      "500": decodeError("EndOperatorSession500", EndOperatorSession500),
      "204": () => Effect.void,
      orElse: unexpectedStatus
    }))
    )
  }
}

export interface FleetIqApi {
  readonly httpClient: HttpClient.HttpClient
  /**
* Returns only active tenants with explicit current grants for the authenticated active actor. Actions are advisory UI hints, never authorization evidence; every operation rechecks policy. Platform grants imply no tenant access. Order is ascending tenant ID. Pages observe fresh policy independently, without cross-request snapshot guarantees. Missing or inactive browser identities return 401; no grants returns an empty 200 page. Available only with configured browser or workload authentication.
*/
readonly "listOperatorTenants": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params?: typeof ListOperatorTenantsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof ListOperatorTenants200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListOperatorTenants400", typeof ListOperatorTenants400.Type> | FleetIqApiError<"ListOperatorTenants401", typeof ListOperatorTenants401.Type> | FleetIqApiError<"ListOperatorTenants500", typeof ListOperatorTenants500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params?: typeof ListOperatorTenantsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof ListOperatorTenants200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListOperatorTenants400", typeof ListOperatorTenants400.Type> | FleetIqApiError<"ListOperatorTenants401", typeof ListOperatorTenants401.Type> | FleetIqApiError<"ListOperatorTenants500", typeof ListOperatorTenants500.Type>>;
  }
  /**
* Discover the active API major version
*/
readonly "getApiVersion": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetApiVersion200.Type, Config>, HttpClientError.HttpClientError | SchemaError>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetApiVersion200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError>;
  }
  /**
* The authenticated operator or configured workload identity must have current metadata.read access for the selected tenant. The route is absent without complete browser or workload identity configuration. A cursor traversal is not a cross-request snapshot.
*/
readonly "listAssets": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof ListAssets200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssets400", typeof ListAssets400.Type> | FleetIqApiError<"ListAssets401", typeof ListAssets401.Type> | FleetIqApiError<"ListAssets403", typeof ListAssets403.Type> | FleetIqApiError<"ListAssets500", typeof ListAssets500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof ListAssets200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssets400", typeof ListAssets400.Type> | FleetIqApiError<"ListAssets401", typeof ListAssets401.Type> | FleetIqApiError<"ListAssets403", typeof ListAssets403.Type> | FleetIqApiError<"ListAssets500", typeof ListAssets500.Type>>;
  }
  /**
* Returns asset identity, its exact pinned asset-type version, and tenant-owned typed external identifiers. A missing asset returns 404.
*/
readonly "getAsset": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetAsset200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAsset400", typeof GetAsset400.Type> | FleetIqApiError<"GetAsset401", typeof GetAsset401.Type> | FleetIqApiError<"GetAsset403", typeof GetAsset403.Type> | FleetIqApiError<"GetAsset404", typeof GetAsset404.Type> | FleetIqApiError<"GetAsset500", typeof GetAsset500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetAsset200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAsset400", typeof GetAsset400.Type> | FleetIqApiError<"GetAsset401", typeof GetAsset401.Type> | FleetIqApiError<"GetAsset403", typeof GetAsset403.Type> | FleetIqApiError<"GetAsset404", typeof GetAsset404.Type> | FleetIqApiError<"GetAsset500", typeof GetAsset500.Type>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. Both directed source and target roles are returned. The asset must exist in the current catalogue; only edges are bitemporal.
*/
readonly "listAssetRelationships": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetRelationshipsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof ListAssetRelationships200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetRelationships400", typeof ListAssetRelationships400.Type> | FleetIqApiError<"ListAssetRelationships401", typeof ListAssetRelationships401.Type> | FleetIqApiError<"ListAssetRelationships403", typeof ListAssetRelationships403.Type> | FleetIqApiError<"ListAssetRelationships404", typeof ListAssetRelationships404.Type> | FleetIqApiError<"ListAssetRelationships500", typeof ListAssetRelationships500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetRelationshipsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<typeof ListAssetRelationships200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetRelationships400", typeof ListAssetRelationships400.Type> | FleetIqApiError<"ListAssetRelationships401", typeof ListAssetRelationships401.Type> | FleetIqApiError<"ListAssetRelationships403", typeof ListAssetRelationships403.Type> | FleetIqApiError<"ListAssetRelationships404", typeof ListAssetRelationships404.Type> | FleetIqApiError<"ListAssetRelationships500", typeof ListAssetRelationships500.Type>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. The selected latest-known binding revision must target this asset. The asset must exist in the current catalogue.
*/
readonly "listAssetSignalBindings": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetSignalBindingsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof ListAssetSignalBindings200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetSignalBindings400", typeof ListAssetSignalBindings400.Type> | FleetIqApiError<"ListAssetSignalBindings401", typeof ListAssetSignalBindings401.Type> | FleetIqApiError<"ListAssetSignalBindings403", typeof ListAssetSignalBindings403.Type> | FleetIqApiError<"ListAssetSignalBindings404", typeof ListAssetSignalBindings404.Type> | FleetIqApiError<"ListAssetSignalBindings500", typeof ListAssetSignalBindings500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetSignalBindingsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<typeof ListAssetSignalBindings200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetSignalBindings400", typeof ListAssetSignalBindings400.Type> | FleetIqApiError<"ListAssetSignalBindings401", typeof ListAssetSignalBindings401.Type> | FleetIqApiError<"ListAssetSignalBindings403", typeof ListAssetSignalBindings403.Type> | FleetIqApiError<"ListAssetSignalBindings404", typeof ListAssetSignalBindings404.Type> | FleetIqApiError<"ListAssetSignalBindings500", typeof ListAssetSignalBindings500.Type>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. The exact device asset, endpoint, and signal tuple selects a source; an unregistered signal can validly return an empty page.
*/
readonly "listSourceSignalBindings": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof ListSourceSignalBindingsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof ListSourceSignalBindings200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListSourceSignalBindings400", typeof ListSourceSignalBindings400.Type> | FleetIqApiError<"ListSourceSignalBindings401", typeof ListSourceSignalBindings401.Type> | FleetIqApiError<"ListSourceSignalBindings403", typeof ListSourceSignalBindings403.Type> | FleetIqApiError<"ListSourceSignalBindings500", typeof ListSourceSignalBindings500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof ListSourceSignalBindingsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<typeof ListSourceSignalBindings200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListSourceSignalBindings400", typeof ListSourceSignalBindings400.Type> | FleetIqApiError<"ListSourceSignalBindings401", typeof ListSourceSignalBindings401.Type> | FleetIqApiError<"ListSourceSignalBindings403", typeof ListSourceSignalBindings403.Type> | FleetIqApiError<"ListSourceSignalBindings500", typeof ListSourceSignalBindings500.Type>>;
  }
  /**
* Read an exact immutable type version. Property references retain definition order and point to exact immutable versions.
*/
readonly "getAssetTypeDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetAssetTypeDefinition200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAssetTypeDefinition400", typeof GetAssetTypeDefinition400.Type> | FleetIqApiError<"GetAssetTypeDefinition401", typeof GetAssetTypeDefinition401.Type> | FleetIqApiError<"GetAssetTypeDefinition403", typeof GetAssetTypeDefinition403.Type> | FleetIqApiError<"GetAssetTypeDefinition404", typeof GetAssetTypeDefinition404.Type> | FleetIqApiError<"GetAssetTypeDefinition500", typeof GetAssetTypeDefinition500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetAssetTypeDefinition200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAssetTypeDefinition400", typeof GetAssetTypeDefinition400.Type> | FleetIqApiError<"GetAssetTypeDefinition401", typeof GetAssetTypeDefinition401.Type> | FleetIqApiError<"GetAssetTypeDefinition403", typeof GetAssetTypeDefinition403.Type> | FleetIqApiError<"GetAssetTypeDefinition404", typeof GetAssetTypeDefinition404.Type> | FleetIqApiError<"GetAssetTypeDefinition500", typeof GetAssetTypeDefinition500.Type>>;
  }
  /**
* Read the exact value kind and optional canonical unit; this endpoint performs no measurement conversion.
*/
readonly "getPropertyDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, propertyId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetPropertyDefinition200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyDefinition400", typeof GetPropertyDefinition400.Type> | FleetIqApiError<"GetPropertyDefinition401", typeof GetPropertyDefinition401.Type> | FleetIqApiError<"GetPropertyDefinition403", typeof GetPropertyDefinition403.Type> | FleetIqApiError<"GetPropertyDefinition404", typeof GetPropertyDefinition404.Type> | FleetIqApiError<"GetPropertyDefinition500", typeof GetPropertyDefinition500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, propertyId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetPropertyDefinition200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyDefinition400", typeof GetPropertyDefinition400.Type> | FleetIqApiError<"GetPropertyDefinition401", typeof GetPropertyDefinition401.Type> | FleetIqApiError<"GetPropertyDefinition403", typeof GetPropertyDefinition403.Type> | FleetIqApiError<"GetPropertyDefinition404", typeof GetPropertyDefinition404.Type> | FleetIqApiError<"GetPropertyDefinition500", typeof GetPropertyDefinition500.Type>>;
  }
  /**
* Returns the stable name of the exact immutable directed relationship type version.
*/
readonly "getRelationshipTypeDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetRelationshipTypeDefinition200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetRelationshipTypeDefinition400", typeof GetRelationshipTypeDefinition400.Type> | FleetIqApiError<"GetRelationshipTypeDefinition401", typeof GetRelationshipTypeDefinition401.Type> | FleetIqApiError<"GetRelationshipTypeDefinition403", typeof GetRelationshipTypeDefinition403.Type> | FleetIqApiError<"GetRelationshipTypeDefinition404", typeof GetRelationshipTypeDefinition404.Type> | FleetIqApiError<"GetRelationshipTypeDefinition500", typeof GetRelationshipTypeDefinition500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetRelationshipTypeDefinition200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetRelationshipTypeDefinition400", typeof GetRelationshipTypeDefinition400.Type> | FleetIqApiError<"GetRelationshipTypeDefinition401", typeof GetRelationshipTypeDefinition401.Type> | FleetIqApiError<"GetRelationshipTypeDefinition403", typeof GetRelationshipTypeDefinition403.Type> | FleetIqApiError<"GetRelationshipTypeDefinition404", typeof GetRelationshipTypeDefinition404.Type> | FleetIqApiError<"GetRelationshipTypeDefinition500", typeof GetRelationshipTypeDefinition500.Type>>;
  }
  /**
* Creates a short-lived bound OIDC authorization-code attempt. Browser identity must be configured. No request-selected issuer, client, callback, or return URL is supported.
*/
readonly "beginOperatorLogin": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"BeginOperatorLogin401", typeof BeginOperatorLogin401.Type> | FleetIqApiError<"BeginOperatorLogin405", typeof BeginOperatorLogin405.Type> | FleetIqApiError<"BeginOperatorLogin500", typeof BeginOperatorLogin500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"BeginOperatorLogin401", typeof BeginOperatorLogin401.Type> | FleetIqApiError<"BeginOperatorLogin405", typeof BeginOperatorLogin405.Type> | FleetIqApiError<"BeginOperatorLogin500", typeof BeginOperatorLogin500.Type>>;
  }
  /**
* Requires __Host-fleetiq-login from the initiating browser. Atomically consumes the matching state once before code exchange, validates signed provider identity and resolves a provisioned active actor. Provider roles or email never provision access.
*/
readonly "completeOperatorLogin": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof CompleteOperatorLoginParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CompleteOperatorLogin400", typeof CompleteOperatorLogin400.Type> | FleetIqApiError<"CompleteOperatorLogin401", typeof CompleteOperatorLogin401.Type> | FleetIqApiError<"CompleteOperatorLogin405", typeof CompleteOperatorLogin405.Type> | FleetIqApiError<"CompleteOperatorLogin500", typeof CompleteOperatorLogin500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof CompleteOperatorLoginParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CompleteOperatorLogin400", typeof CompleteOperatorLogin400.Type> | FleetIqApiError<"CompleteOperatorLogin401", typeof CompleteOperatorLogin401.Type> | FleetIqApiError<"CompleteOperatorLogin405", typeof CompleteOperatorLogin405.Type> | FleetIqApiError<"CompleteOperatorLogin500", typeof CompleteOperatorLogin500.Type>>;
  }
  /**
* Revalidates session expiry and the current external-identity mapping to the actor established at login. Returns no provider claims, tokens, or tenant grants.
*/
readonly "getOperatorSession": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<typeof GetOperatorSession200.Type, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetOperatorSession401", typeof GetOperatorSession401.Type> | FleetIqApiError<"GetOperatorSession405", typeof GetOperatorSession405.Type> | FleetIqApiError<"GetOperatorSession500", typeof GetOperatorSession500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<typeof GetOperatorSession200.Type, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetOperatorSession401", typeof GetOperatorSession401.Type> | FleetIqApiError<"GetOperatorSession405", typeof GetOperatorSession405.Type> | FleetIqApiError<"GetOperatorSession500", typeof GetOperatorSession500.Type>>;
  }
  /**
* Requires exact configured Origin and X-FleetIQ-CSRF: 1. Deletes the stored session and browser-bound pending login attempts, then clears cookies; success is idempotent when no session is present. Existing in-flight reads may complete.
*/
readonly "endOperatorSession": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof EndOperatorSessionParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"EndOperatorSession401", typeof EndOperatorSession401.Type> | FleetIqApiError<"EndOperatorSession403", typeof EndOperatorSession403.Type> | FleetIqApiError<"EndOperatorSession405", typeof EndOperatorSession405.Type> | FleetIqApiError<"EndOperatorSession500", typeof EndOperatorSession500.Type>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof EndOperatorSessionParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"EndOperatorSession401", typeof EndOperatorSession401.Type> | FleetIqApiError<"EndOperatorSession403", typeof EndOperatorSession403.Type> | FleetIqApiError<"EndOperatorSession405", typeof EndOperatorSession405.Type> | FleetIqApiError<"EndOperatorSession500", typeof EndOperatorSession500.Type>>;
  }
}

export interface FleetIqApiError<Tag extends string, E> {
  readonly _tag: Tag
  readonly request: HttpClientRequest.HttpClientRequest
  readonly response: HttpClientResponse.HttpClientResponse
  readonly cause: E
}

class FleetIqApiErrorImpl extends Data.Error<{
  _tag: string
  cause: any
  request: HttpClientRequest.HttpClientRequest
  response: HttpClientResponse.HttpClientResponse
}> {}

export const FleetIqApiError = <Tag extends string, E>(
  tag: Tag,
  cause: E,
  response: HttpClientResponse.HttpClientResponse,
): FleetIqApiError<Tag, E> =>
  new FleetIqApiErrorImpl({
    _tag: tag,
    cause,
    response,
    request: response.request,
  }) as any
