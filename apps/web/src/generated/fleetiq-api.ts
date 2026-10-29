import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import type { SchemaError } from "effect/Schema"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import * as Sse from "effect/encoding/Sse"
import * as HttpClient from "effect/http/HttpClient"
import * as HttpClientError from "effect/http/HttpClientError"
import * as HttpClientRequest from "effect/http/HttpClientRequest"
import * as HttpClientResponse from "effect/http/HttpClientResponse"
// non-recursive definitions
export type SignalSource = { readonly "device_asset_id": string, readonly "endpoint_id": string, readonly "signal_id": string } & { readonly [x: string]: Schema.Json }
export const SignalSource = Schema.StructWithRest(Schema.Struct({ "device_asset_id": Schema.String.annotate({ "description": "Communication-device asset ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoint_id": Schema.String.annotate({ "description": "Source endpoint ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "signal_id": Schema.String.annotate({ "description": "Decoded source signal ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact device endpoint and source signal tuple.", "identifier": "SignalSource" })
export type PropertyReference = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const PropertyReference = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Property definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact immutable property-definition version.", "identifier": "PropertyReference" })
export type EffectiveInterval = { readonly "start_ms": number, readonly "end_ms": number | null } & { readonly [x: string]: Schema.Json }
export const EffectiveInterval = Schema.StructWithRest(Schema.Struct({ "start_ms": Schema.Number.annotate({ "description": "Inclusive physical effective start in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "end_ms": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })), Schema.Null]).annotate({ "description": "Exclusive physical effective end; null means open-ended.", "format": "int64" }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Half-open physical time interval [start_ms, end_ms).", "identifier": "EffectiveInterval" })
export type Problem = { readonly "type": string, readonly "title": string, readonly "status": number } & { readonly [x: string]: Schema.Json }
export const Problem = Schema.StructWithRest(Schema.Struct({ "type": Schema.String, "title": Schema.String, "status": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(400).annotate({ "expected": "a value greater than or equal to 400" })).check(Schema.isLessThanOrEqualTo(599).annotate({ "expected": "a value less than or equal to 599" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Minimum application/problem+json shape. Future compatible problems may include optional fields.", "identifier": "Problem" })
export type RevisionSource = { readonly "device_asset_id": string, readonly "endpoint_id": string, readonly "signal_id": string }
export const RevisionSource = Schema.Struct({ "device_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "endpoint_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "signal_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })) }).annotate({ "identifier": "RevisionSource" })
export type RevisionProperty = { readonly "id": string, readonly "version": number }
export const RevisionProperty = Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }).annotate({ "identifier": "RevisionProperty" })
export type RevisionEffectiveInterval = { readonly "start_ms": number, readonly "end_ms"?: number | null }
export const RevisionEffectiveInterval = Schema.Struct({ "start_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "end_ms": Schema.optionalKey(Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })), Schema.Null]).annotate({ "format": "int64" })) }).annotate({ "description": "Half-open physical interval [start_ms,end_ms); null/omitted end is unbounded. A finite end must be strictly after start; enforced by domain construction.", "identifier": "RevisionEffectiveInterval" })
export type MetadataRevisionResult = { readonly "outcome": "appended" | "already_appended", readonly "id": string, readonly "revision": string, readonly "recorded_by": string, readonly "recorded_at_ms": number }
export const MetadataRevisionResult = Schema.Struct({ "outcome": Schema.Literals(["appended", "already_appended"]), "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "revision": Schema.String.annotate({ "description": "Canonical positive u64 decimal text." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "recorded_by": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "recorded_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })) }).annotate({ "identifier": "MetadataRevisionResult" })
export type AdministrationIdentifier = string
export const AdministrationIdentifier = Schema.String.annotate({ "description": "Exact opaque domain identifier; no surrounding whitespace or control characters." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "u")).annotate({ "expected": "a string matching the RegExp ^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "identifier": "AdministrationIdentifier" }))
export type SemanticDefinitionName = string
export const SemanticDefinitionName = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(200).annotate({ "expected": "a string with at most 200 code points" })).check(Schema.isPattern(new RegExp("^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "u")).annotate({ "expected": "a string matching the RegExp ^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "identifier": "SemanticDefinitionName" }))
export type RevisionRelationshipType = { readonly "id": string, readonly "version": number }
export const RevisionRelationshipType = Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }).annotate({ "identifier": "RevisionRelationshipType" })
export type ProjectionCounter = string
export const ProjectionCounter = Schema.String.annotate({ "description": "Exact nonnegative decimal counter backed by signed 64-bit storage; never a JavaScript floating-point number. Compare numerically and only inside the same tenant projection." }).check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^(0|[1-9][0-9]*)$", "identifier": "ProjectionCounter" }))
export type HistoryMillis = string
export const HistoryMillis = Schema.String.annotate({ "description": "Exact signed 64-bit Unix milliseconds as a canonical decimal string; range is validated by the server." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)$", "identifier": "HistoryMillis" }))
export type FleetLocationMapping = { readonly "latitude": { readonly "id": string, readonly "version": number }, readonly "longitude": { readonly "id": string, readonly "version": number }, readonly "encoding": "degrees" | "e7" }
export const FleetLocationMapping = Schema.Struct({ "latitude": Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), "longitude": Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), "encoding": Schema.Literals(["degrees", "e7"]) }).annotate({ "identifier": "FleetLocationMapping" })
export type AssetTypeRef = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const AssetTypeRef = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeRef" })
export type HistoryToken = string
export const HistoryToken = Schema.String.annotate({ "description": "Versioned opaque key, not a credential. Do not decode or edit; grants and scope are rechecked on every request." }).check(Schema.isMaxCodePoints(8192).annotate({ "expected": "a string with at most 8192 code points" })).check(Schema.isPattern(new RegExp("^v1\\.[0-9a-f]+$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.[0-9a-f]+$", "identifier": "HistoryToken" }))
export type HistoryValue = { readonly "kind": "boolean", readonly "value": boolean } | { readonly "kind": "integer", readonly "value": string } | { readonly "kind": "decimal", readonly "value": string } | { readonly "kind": "text", readonly "value": string }
export const HistoryValue = Schema.Union([Schema.Struct({ "kind": Schema.Literal("boolean"), "value": Schema.Boolean }), Schema.Struct({ "kind": Schema.Literal("integer"), "value": Schema.String.check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)$" })) }), Schema.Struct({ "kind": Schema.Literal("decimal"), "value": Schema.String.check(Schema.isPattern(new RegExp("^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$", "u")).annotate({ "expected": "a string matching the RegExp ^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$" })) }), Schema.Struct({ "kind": Schema.Literal("text"), "value": Schema.String })], { mode: "oneOf" }).annotate({ "description": "Integer and decimal values are strings to preserve precision in browser clients. Decimal exponents are permitted. No unit conversion is performed.", "identifier": "HistoryValue" })
export type PropertyLiveStream = string
export const PropertyLiveStream = Schema.String.annotate({ "description": "UTF-8 SSE wire stream with blank-line-delimited events. Event data schemas are declared in the response x-fleetiq-event-data map. Only snapshot/replace events assign an opaque id. Parse complete events independently of HTTP chunk boundaries and id/data ordering.", "identifier": "PropertyLiveStream" })
export type TenantAction = "access.manage" | "metadata.manage" | "metadata.read" | "protocol.manage" | "telemetry.read"
export const TenantAction = Schema.Literals(["access.manage", "metadata.manage", "metadata.read", "protocol.manage", "telemetry.read"]).annotate({ "description": "An exact granted tenant action; no action implies another.", "identifier": "TenantAction" })
export type ApiDescription = { readonly "service": "FleetIQ", readonly "version": "v1" } & { readonly [x: string]: Schema.Json }
export const ApiDescription = Schema.StructWithRest(Schema.Struct({ "service": Schema.Literal("FleetIQ"), "version": Schema.Literal("v1") }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "ApiDescription" })
export type ExternalIdentifier = { readonly "kind": string, readonly "authority": string | null, readonly "value": string } & { readonly [x: string]: Schema.Json }
export const ExternalIdentifier = Schema.StructWithRest(Schema.Struct({ "kind": Schema.String.annotate({ "description": "Identifier namespace, such as manufacturer.serial-number." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "authority": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Optional issuing authority within this tenant-owned namespace." }), "value": Schema.String.annotate({ "description": "External identifier value; no kind is assumed universal." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Tenant-owned typed external identifier.", "identifier": "ExternalIdentifier" })
export type RelationshipTypeRef = { readonly "id": string, readonly "version": number } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeRef = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Relationship-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact immutable relationship-type version.", "identifier": "RelationshipTypeRef" })
export type PropertyDefinition = { readonly "id": string, readonly "version": number, readonly "name": string, readonly "value_kind": "boolean" | "integer" | "decimal" | "text", readonly "canonical_unit": string | null } & { readonly [x: string]: Schema.Json }
export const PropertyDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable property definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "value_kind": Schema.Literals(["boolean", "integer", "decimal", "text"]), "canonical_unit": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), Schema.Null]).annotate({ "description": "Canonical configured unit, or null if this property is unitless." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "PropertyDefinition" })
export type RelationshipTypeDefinition = { readonly "id": string, readonly "version": number, readonly "name": string } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable relationship-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "RelationshipTypeDefinition" })
export type OperatorSession = { readonly "actor_id": string, readonly "expires_at_ms": number }
export const OperatorSession = Schema.Struct({ "actor_id": Schema.String.annotate({ "description": "Internal actor established at sign-in, with its current identity mapping revalidated." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "expires_at_ms": Schema.Number.annotate({ "description": "Absolute expiry in Unix epoch milliseconds; no sliding renewal.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })) }).annotate({ "identifier": "OperatorSession" })
export type ProtocolRouteSelection = { readonly "package_id": string, readonly "package_version": string, readonly "world": "runtime-v1" | "identity-v1" }
export const ProtocolRouteSelection = Schema.Struct({ "package_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "package_version": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "world": Schema.Literals(["runtime-v1", "identity-v1"]) }).annotate({ "identifier": "ProtocolRouteSelection" })
export type ProtocolPackageRelease = { readonly "package_id": string, readonly "package_version": string, readonly "artifact_sha256": string, readonly "artifact_size_bytes": number }
export const ProtocolPackageRelease = Schema.Struct({ "package_id": Schema.String, "package_version": Schema.String, "artifact_sha256": Schema.String.check(Schema.isPattern(new RegExp("^[a-f0-9]{64}$", "u")).annotate({ "expected": "a string matching the RegExp ^[a-f0-9]{64}$" })), "artifact_size_bytes": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(8388608).annotate({ "expected": "a value less than or equal to 8388608" })) }).annotate({ "identifier": "ProtocolPackageRelease" })
export type IngestionDiagnosticCoverage = { readonly "frame_limit": 64, readonly "output_limit_per_frame": 64, readonly "source_limit": 128, readonly "frames_truncated": boolean, readonly "observations_truncated": boolean, readonly "sources_truncated": boolean }
export const IngestionDiagnosticCoverage = Schema.Struct({ "frame_limit": Schema.Literal(64), "output_limit_per_frame": Schema.Literal(64), "source_limit": Schema.Literal(128), "frames_truncated": Schema.Boolean, "observations_truncated": Schema.Boolean, "sources_truncated": Schema.Boolean }).annotate({ "identifier": "IngestionDiagnosticCoverage" })
export type IngestionDiagnosticFrame = { readonly "message_id": string, readonly "package_id": string, readonly "package_version": string, readonly "received_at_ms": number, readonly "processing": "accepted" | "queued" | "leased" | "expired" | "poisoned" | "decoded", readonly "observation_count": number | null }
export const IngestionDiagnosticFrame = Schema.Struct({ "message_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "package_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "package_version": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "received_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "processing": Schema.Literals(["accepted", "queued", "leased", "expired", "poisoned", "decoded"]).annotate({ "description": "Durable evidence only. Leased does not prove a live worker; expired does not prove terminal failure." }), "observation_count": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(4294967296).annotate({ "expected": "a value less than or equal to 4294967296" })), Schema.Null]).annotate({ "description": "Null without a decoded completion marker; zero is successful empty decoding." }) }).annotate({ "identifier": "IngestionDiagnosticFrame" })
export type IngestionObservedSource = { readonly "package_id": string, readonly "package_version": string, readonly "endpoint_id": string, readonly "signal_id": string }
export const IngestionObservedSource = Schema.Struct({ "package_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "package_version": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoint_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "signal_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })) }).annotate({ "identifier": "IngestionObservedSource" })
export type SignalTarget = { readonly "asset_id": string, readonly "property": PropertyReference } & { readonly [x: string]: Schema.Json }
export const SignalTarget = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Observed target asset ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "property": PropertyReference }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Semantically attributed target asset and exact property version.", "identifier": "SignalTarget" })
export type AssetTypeDefinition = { readonly "id": string, readonly "version": number, readonly "name": string, readonly "supported_properties": ReadonlyArray<PropertyReference> } & { readonly [x: string]: Schema.Json }
export const AssetTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Immutable asset-type definition ID." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "supported_properties": Schema.Array(PropertyReference).annotate({ "description": "Ordered exact property-definition references." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeDefinition" })
export type RevisionTarget = { readonly "asset_id": string, readonly "property": RevisionProperty }
export const RevisionTarget = Schema.Struct({ "asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "property": RevisionProperty }).annotate({ "identifier": "RevisionTarget" })
export type SemanticDefinitionPosition = { readonly "id": AdministrationIdentifier, readonly "version": number }
export const SemanticDefinitionPosition = Schema.Struct({ "id": AdministrationIdentifier, "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }).annotate({ "identifier": "SemanticDefinitionPosition" })
export type RegistrationAssetType = { readonly "id": AdministrationIdentifier, readonly "version": number }
export const RegistrationAssetType = Schema.Struct({ "id": AdministrationIdentifier, "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })) }).annotate({ "description": "Exact immutable asset-type version in the selected tenant.", "identifier": "RegistrationAssetType" })
export type RegistrationExternalIdentifier = { readonly "kind": AdministrationIdentifier, readonly "authority"?: AdministrationIdentifier | null, readonly "value": AdministrationIdentifier }
export const RegistrationExternalIdentifier = Schema.Struct({ "kind": AdministrationIdentifier, "authority": Schema.optionalKey(Schema.Union([AdministrationIdentifier, Schema.Null]).annotate({ "description": "Omitted authority means null; no issuer namespace is assumed universal." })), "value": AdministrationIdentifier }).annotate({ "identifier": "RegistrationExternalIdentifier" })
export type MetadataRegistrationResult = { readonly "outcome": "registered" | "already_registered", readonly "registered_by": AdministrationIdentifier, readonly "recorded_at_ms": number }
export const MetadataRegistrationResult = Schema.Struct({ "outcome": Schema.Literals(["registered", "already_registered"]), "registered_by": AdministrationIdentifier, "recorded_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })) }).annotate({ "description": "Immutable first-registration evidence, including on an exact retry by a different currently authorized actor. Receipt time is signed Unix milliseconds sampled by the host.", "identifier": "MetadataRegistrationResult" })
export type SemanticDefinitionSummary = { readonly "id": AdministrationIdentifier, readonly "version": number, readonly "name": SemanticDefinitionName }
export const SemanticDefinitionSummary = Schema.Struct({ "id": AdministrationIdentifier, "version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "name": SemanticDefinitionName }).annotate({ "identifier": "SemanticDefinitionSummary" })
export type DeviceEndpoint = { readonly "id": AdministrationIdentifier, readonly "kind": AdministrationIdentifier, readonly "name": SemanticDefinitionName }
export const DeviceEndpoint = Schema.Struct({ "id": AdministrationIdentifier, "kind": AdministrationIdentifier, "name": SemanticDefinitionName }).annotate({ "description": "Stable source boundary under a communication device; kind is extensible and no protocol or semantic binding is implied.", "identifier": "DeviceEndpoint" })
export type AppendRelationshipRevisionRequest = { readonly "relationship_type": RevisionRelationshipType, readonly "source_asset_id": string, readonly "target_asset_id": string, readonly "effective_interval": RevisionEffectiveInterval }
export const AppendRelationshipRevisionRequest = Schema.Struct({ "relationship_type": RevisionRelationshipType, "source_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "target_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$" })), "effective_interval": RevisionEffectiveInterval }).annotate({ "identifier": "AppendRelationshipRevisionRequest" })
export type FleetSummary = { readonly "assets": ProjectionCounter, readonly "communication_devices": ProjectionCounter, readonly "mapped_assets": ProjectionCounter, readonly "assets_with_current_properties": ProjectionCounter }
export const FleetSummary = Schema.Struct({ "assets": ProjectionCounter, "communication_devices": ProjectionCounter, "mapped_assets": ProjectionCounter, "assets_with_current_properties": ProjectionCounter }).annotate({ "identifier": "FleetSummary" })
export type PropertyHistorySource = { readonly "message_id": string, readonly "protocol_package_id": string, readonly "protocol_package_version": string, readonly "device_asset_id": string, readonly "endpoint_id": string, readonly "signal_id": string, readonly "output_index": number, readonly "device_recorded_at_ms": HistoryMillis | null, readonly "received_at_ms": HistoryMillis }
export const PropertyHistorySource = Schema.Struct({ "message_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "protocol_package_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "protocol_package_version": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "device_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoint_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "signal_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "output_index": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "device_recorded_at_ms": Schema.Union([HistoryMillis, Schema.Null], { mode: "oneOf" }), "received_at_ms": HistoryMillis }).annotate({ "identifier": "PropertyHistorySource" })
export type AssetSummary = { readonly "id": string, readonly "tenant_id": string, readonly "name": string, readonly "asset_type": AssetTypeRef } & { readonly [x: string]: Schema.Json }
export const AssetSummary = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "asset_type": AssetTypeRef }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetSummary" })
export type OperatorTenant = { readonly "tenant_id": string, readonly "actions": ReadonlyArray<TenantAction> }
export const OperatorTenant = Schema.Struct({ "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "actions": Schema.Array(TenantAction).annotate({ "description": "Explicit current grants ordered by action name; never reusable authorization." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxLength(3).annotate({ "expected": "a value with a length of at most 3" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })) }).annotate({ "identifier": "OperatorTenant" })
export type Asset = { readonly "id": string, readonly "tenant_id": string, readonly "name": string, readonly "asset_type": AssetTypeRef, readonly "external_identifiers": ReadonlyArray<ExternalIdentifier> } & { readonly [x: string]: Schema.Json }
export const Asset = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Internal FleetIQ asset identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), "asset_type": AssetTypeRef, "external_identifiers": Schema.Array(ExternalIdentifier) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Exact asset identity with its pinned type and external identifiers.", "identifier": "Asset" })
export type Relationship = { readonly "id": string, readonly "tenant_id": string, readonly "revision": string, readonly "recorded_at_ms": number, readonly "relationship_type": RelationshipTypeRef, readonly "source_asset_id": string, readonly "target_asset_id": string, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const Relationship = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Stable relationship identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "revision": Schema.String.annotate({ "description": "Positive u64 revision serialized as decimal text to preserve JavaScript precision." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "recorded_at_ms": Schema.Number.annotate({ "description": "When FleetIQ learned this revision, in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "relationship_type": RelationshipTypeRef, "source_asset_id": Schema.String.annotate({ "description": "Directed source asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "target_asset_id": Schema.String.annotate({ "description": "Directed target asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One recorded revision of a directed asset relationship.", "identifier": "Relationship" })
export type ProtocolDeviceRoute = { readonly "device_asset_id": string, readonly "channel_id": string, readonly "revision": number, readonly "selection": ProtocolRouteSelection, readonly "policy_version": number, readonly "actor_id": string, readonly "recorded_at_ms": number } | { readonly "device_asset_id": string, readonly "channel_id": string, readonly "revision": number, readonly "selection": null, readonly "policy_version": null, readonly "actor_id": string, readonly "recorded_at_ms": number }
export const ProtocolDeviceRoute = Schema.Union([Schema.Struct({ "device_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "channel_id": Schema.String.check(Schema.isPattern(new RegExp("^[A-Za-z0-9_.-]{1,128}$", "u")).annotate({ "expected": "a string matching the RegExp ^[A-Za-z0-9_.-]{1,128}$" })), "revision": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "selection": ProtocolRouteSelection, "policy_version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })), "actor_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "recorded_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })) }), Schema.Struct({ "device_asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "channel_id": Schema.String.check(Schema.isPattern(new RegExp("^[A-Za-z0-9_.-]{1,128}$", "u")).annotate({ "expected": "a string matching the RegExp ^[A-Za-z0-9_.-]{1,128}$" })), "revision": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "selection": Schema.Null, "policy_version": Schema.Null, "actor_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "recorded_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })) })]).annotate({ "identifier": "ProtocolDeviceRoute" })
export type ChangeProtocolRouteRequest = { readonly "expected_revision": number, readonly "selection": ProtocolRouteSelection | null }
export const ChangeProtocolRouteRequest = Schema.Struct({ "expected_revision": Schema.Number.annotate({ "description": "Zero expects an unconfigured route; otherwise the last observed generation." }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "selection": Schema.Union([ProtocolRouteSelection, Schema.Null]).annotate({ "description": "Explicit null retires this route; omission is never retirement." }) }).annotate({ "identifier": "ChangeProtocolRouteRequest" })
export type IngestionDiagnostics = { readonly "observed_at_ms": number, readonly "connection_liveness": "not_observed", readonly "worker_liveness": "not_observed", readonly "coverage": IngestionDiagnosticCoverage, readonly "frames": ReadonlyArray<IngestionDiagnosticFrame>, readonly "sources": ReadonlyArray<IngestionObservedSource> }
export const IngestionDiagnostics = Schema.Struct({ "observed_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "connection_liveness": Schema.Literal("not_observed"), "worker_liveness": Schema.Literal("not_observed"), "coverage": IngestionDiagnosticCoverage, "frames": Schema.Array(IngestionDiagnosticFrame).annotate({ "description": "Newest host receipt timestamp, then descending message identity. Not a freshness or connection guarantee." }).check(Schema.isMaxLength(64).annotate({ "expected": "a value with a length of at most 64" })), "sources": Schema.Array(IngestionObservedSource).annotate({ "description": "Distinct package/version/endpoint/signal tuples from the first 64 decoded positions in each sampled frame; lexicographically ordered. Not complete device capabilities." }).check(Schema.isMaxLength(128).annotate({ "expected": "a value with a length of at most 128" })) }).annotate({ "identifier": "IngestionDiagnostics" })
export type SignalBinding = { readonly "id": string, readonly "tenant_id": string, readonly "revision": string, readonly "recorded_at_ms": number, readonly "source": SignalSource, readonly "target": SignalTarget, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const SignalBinding = Schema.StructWithRest(Schema.Struct({ "id": Schema.String.annotate({ "description": "Stable signal-binding identity." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "tenant_id": Schema.String.annotate({ "description": "Owning tenant." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "revision": Schema.String.annotate({ "description": "Positive u64 revision serialized as decimal text to preserve JavaScript precision." }).check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "recorded_at_ms": Schema.Number.annotate({ "description": "When FleetIQ learned this revision, in signed Unix milliseconds.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "source": SignalSource, "target": SignalTarget, "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One recorded signal-to-asset-property attribution revision.", "identifier": "SignalBinding" })
export type AppendSignalBindingRevisionRequest = { readonly "source": RevisionSource, readonly "target": RevisionTarget, readonly "effective_interval": RevisionEffectiveInterval }
export const AppendSignalBindingRevisionRequest = Schema.Struct({ "source": RevisionSource, "target": RevisionTarget, "effective_interval": RevisionEffectiveInterval }).annotate({ "identifier": "AppendSignalBindingRevisionRequest" })
export type RegisterAssetRequest = { readonly "id": AdministrationIdentifier, readonly "name": SemanticDefinitionName, readonly "asset_type": RegistrationAssetType, readonly "external_identifiers": ReadonlyArray<RegistrationExternalIdentifier> }
export const RegisterAssetRequest = Schema.Struct({ "id": AdministrationIdentifier, "name": SemanticDefinitionName, "asset_type": RegistrationAssetType, "external_identifiers": Schema.Array(RegistrationExternalIdentifier).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })) }).annotate({ "description": "Create-only content. Identifier order is irrelevant; duplicate kind/authority/value is invalid, including omitted versus null authority.", "identifier": "RegisterAssetRequest" })
export type DefinitionCataloguePage = { readonly "definitions": ReadonlyArray<SemanticDefinitionSummary>, readonly "next_after": SemanticDefinitionPosition | null }
export const DefinitionCataloguePage = Schema.Struct({ "definitions": Schema.Array(SemanticDefinitionSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([SemanticDefinitionPosition, Schema.Null]) }).annotate({ "identifier": "DefinitionCataloguePage" })
export type CommunicationDevice = { readonly "tenant_id": string, readonly "asset_id": string, readonly "endpoints": ReadonlyArray<DeviceEndpoint> } & { readonly [x: string]: Schema.Json }
export const CommunicationDevice = Schema.StructWithRest(Schema.Struct({ "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "endpoints": Schema.Array(DeviceEndpoint) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "Existing device GET representation; endpoints retain declaration order.", "identifier": "CommunicationDevice" })
export type RegisterCommunicationDeviceRequest = { readonly "endpoints": ReadonlyArray<DeviceEndpoint> }
export const RegisterCommunicationDeviceRequest = Schema.Struct({ "endpoints": Schema.Array(DeviceEndpoint).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })) }).annotate({ "description": "Attach capability to the existing asset in the route. Endpoint IDs are unique within the declaration; declaration order participates in retry equality.", "identifier": "RegisterCommunicationDeviceRequest" })
export type PropertyHistoryChange = { readonly "tenant_id": string, readonly "asset_id": string, readonly "property_id": string, readonly "binding_id": string, readonly "interpretation": HistoryToken, readonly "property_version": number, readonly "binding_revision": string, readonly "event_time_basis": "device_recorded" | "received_at", readonly "event_at_ms": HistoryMillis, readonly "first_resolution_effective_at_ms": HistoryMillis, readonly "first_resolution_known_at_ms": HistoryMillis, readonly "value": HistoryValue, readonly "source_unit": string | null, readonly "quality": "good" | "uncertain" | "invalid", readonly "source": PropertyHistorySource }
export const PropertyHistoryChange = Schema.Struct({ "tenant_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "property_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "binding_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "interpretation": HistoryToken, "property_version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "binding_revision": Schema.String.check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "event_time_basis": Schema.Literals(["device_recorded", "received_at"]), "event_at_ms": HistoryMillis, "first_resolution_effective_at_ms": HistoryMillis, "first_resolution_known_at_ms": HistoryMillis, "value": HistoryValue, "source_unit": Schema.Union([Schema.String, Schema.Null]), "quality": Schema.Literals(["good", "uncertain", "invalid"]), "source": PropertyHistorySource }).annotate({ "identifier": "PropertyHistoryChange" })
export type AssetPage = { readonly "assets": ReadonlyArray<AssetSummary>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetPage = Schema.StructWithRest(Schema.Struct({ "assets": Schema.Array(AssetSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive cursor for the next page, or null when no next page exists." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetPage" })
export type OperatorTenantPage = { readonly "tenants": ReadonlyArray<OperatorTenant>, readonly "next_after": string | null }
export const OperatorTenantPage = Schema.Struct({ "tenants": Schema.Array(OperatorTenant).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Last emitted tenant ID when another tenant exists; otherwise null." }) }).annotate({ "identifier": "OperatorTenantPage" })
export type RelationshipSnapshot = { readonly "asset_id": string, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "relationships": ReadonlyArray<Relationship>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const RelationshipSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Queried current-catalogue asset." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "relationships": Schema.Array(Relationship).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable relationship-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal relationship page for an asset.", "identifier": "RelationshipSnapshot" })
export type AssetBindingSnapshot = { readonly "asset_id": string, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": Schema.String.annotate({ "description": "Queried target asset in the current catalogue." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable binding-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal signal-binding page targeting an asset.", "identifier": "AssetBindingSnapshot" })
export type SourceBindingSnapshot = { readonly "source": SignalSource, readonly "effective_at_ms": number, readonly "known_at_ms": number, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const SourceBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "source": SignalSource, "effective_at_ms": Schema.Number.annotate({ "description": "Physical time used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "known_at_ms": Schema.Number.annotate({ "description": "Recorded-time cutoff used for this page.", "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })), "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]).annotate({ "description": "Exclusive stable binding-ID cursor; null ends traversal." }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "description": "One bounded, bitemporal signal-binding page for an exact source signal.", "identifier": "SourceBindingSnapshot" })
export type FleetPoint = { readonly "latitude": string, readonly "longitude": string, readonly "quality": "good" | "uncertain", readonly "freshness": "fresh" | "stale" | "future", readonly "latitude_change": PropertyHistoryChange, readonly "longitude_change": PropertyHistoryChange }
export const FleetPoint = Schema.Struct({ "latitude": Schema.String.annotate({ "description": "Exact signed degrees in [-90,90]; no floating-point conversion." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "longitude": Schema.String.annotate({ "description": "Exact signed degrees in [-180,180]." }).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "quality": Schema.Literals(["good", "uncertain"]), "freshness": Schema.Literals(["fresh", "stale", "future"]), "latitude_change": PropertyHistoryChange, "longitude_change": PropertyHistoryChange }).annotate({ "identifier": "FleetPoint" })
export type CurrentPropertyItem = { readonly "freshness": "fresh" | "stale" | "future", readonly "change": PropertyHistoryChange }
export const CurrentPropertyItem = Schema.Struct({ "freshness": Schema.Literals(["fresh", "stale", "future"]).annotate({ "description": "Selected event age at evaluated_at_ms. Fresh means age 0..30000 ms inclusive; future is explicit. Independent of quality and connectivity." }), "change": PropertyHistoryChange }).annotate({ "identifier": "CurrentPropertyItem" })
export type PropertyHistoryPage = { readonly "changes": ReadonlyArray<PropertyHistoryChange>, readonly "next_after": HistoryToken | null }
export const PropertyHistoryPage = Schema.Struct({ "changes": Schema.Array(PropertyHistoryChange).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([HistoryToken, Schema.Null], { mode: "oneOf" }) }).annotate({ "identifier": "PropertyHistoryPage" })
export type FleetLocation = { readonly "status": "unmapped" | "incompatible_mapping" | "missing" | "incoherent" | "invalid_coordinates" | "invalid_quality" } | { readonly "status": "observed", readonly "point": FleetPoint }
export const FleetLocation = Schema.Union([Schema.Struct({ "status": Schema.Literals(["unmapped", "incompatible_mapping", "missing", "incoherent", "invalid_coordinates", "invalid_quality"]) }), Schema.Struct({ "status": Schema.Literal("observed"), "point": FleetPoint })], { mode: "oneOf" }).annotate({ "identifier": "FleetLocation" })
export type CurrentPropertySnapshot = { readonly "generation": ProjectionCounter, readonly "revision": ProjectionCounter, readonly "processed_count": ProjectionCounter, readonly "pending": boolean, readonly "evaluated_at_ms": HistoryMillis, readonly "stale_after_ms": 30000, readonly "items": ReadonlyArray<CurrentPropertyItem> }
export const CurrentPropertySnapshot = Schema.Struct({ "generation": ProjectionCounter, "revision": ProjectionCounter, "processed_count": ProjectionCounter, "pending": Schema.Boolean.annotate({ "description": "At least one committed tenant interpretation remains pending in the current-state queue at this database snapshot. Not a source/semantic queue or device-health assertion." }), "evaluated_at_ms": HistoryMillis, "stale_after_ms": Schema.Literal(30000), "items": Schema.Array(CurrentPropertyItem).check(Schema.isMaxLength(1).annotate({ "expected": "a value with a length of at most 1" })) }).annotate({ "description": "Complete exact installed asset/property/version state at one repeatable database view. Empty items means no value has been materialized, including pending work; it does not claim no observations or bindings exist. Generation changes on rebuild; revision advances on each committed nonempty batch and rebuild and never resets. Counters are scoped to the tenant, not the property. The REST snapshot has no SSE cursor; the live operation issues its own scope-bound position and coalesced replacement contract.", "identifier": "CurrentPropertySnapshot" })
export type FleetAsset = { readonly "asset_id": string, readonly "display_name": string, readonly "asset_type": AssetTypeRef, readonly "location": FleetLocation }
export const FleetAsset = Schema.Struct({ "asset_id": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "display_name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(200).annotate({ "expected": "a string with at most 200 code points" })), "asset_type": AssetTypeRef, "location": FleetLocation }).annotate({ "identifier": "FleetAsset" })
export type FleetSnapshot = { readonly "generation": ProjectionCounter, readonly "revision": ProjectionCounter, readonly "pending": boolean, readonly "evaluated_at_ms": HistoryMillis, readonly "stale_after_ms": 30000, readonly "mapping": FleetLocationMapping, readonly "mapping_supported": boolean, readonly "summary": FleetSummary, readonly "assets": ReadonlyArray<FleetAsset>, readonly "next_after": string | null }
export const FleetSnapshot = Schema.Struct({ "generation": ProjectionCounter, "revision": ProjectionCounter, "pending": Schema.Boolean, "evaluated_at_ms": HistoryMillis, "stale_after_ms": Schema.Literal(30000), "mapping": FleetLocationMapping, "mapping_supported": Schema.Boolean, "summary": FleetSummary, "assets": Schema.Array(FleetAsset).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }).annotate({ "identifier": "FleetSnapshot" })
// schemas
export type GetSignalBindingRevision200 = SignalBinding
export const GetSignalBindingRevision200 = SignalBinding
export type GetSignalBindingRevision400 = Problem
export const GetSignalBindingRevision400 = Problem
export type GetSignalBindingRevision401 = Problem
export const GetSignalBindingRevision401 = Problem
export type GetSignalBindingRevision403 = Problem
export const GetSignalBindingRevision403 = Problem
export type GetSignalBindingRevision404 = Problem
export const GetSignalBindingRevision404 = Problem
export type GetSignalBindingRevision405 = Problem
export const GetSignalBindingRevision405 = Problem
export type GetSignalBindingRevision500 = Problem
export const GetSignalBindingRevision500 = Problem
export type AppendSignalBindingRevisionParams = { readonly "Origin"?: string, readonly "X-FleetIQ-CSRF"?: "1" }
export const AppendSignalBindingRevisionParams = Schema.Struct({ "Origin": Schema.optionalKey(Schema.String), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type AppendSignalBindingRevisionRequestJson = AppendSignalBindingRevisionRequest
export const AppendSignalBindingRevisionRequestJson = AppendSignalBindingRevisionRequest
export type AppendSignalBindingRevision200 = MetadataRevisionResult
export const AppendSignalBindingRevision200 = MetadataRevisionResult
export type AppendSignalBindingRevision201 = MetadataRevisionResult
export const AppendSignalBindingRevision201 = MetadataRevisionResult
export type AppendSignalBindingRevision400 = Problem
export const AppendSignalBindingRevision400 = Problem
export type AppendSignalBindingRevision401 = Problem
export const AppendSignalBindingRevision401 = Problem
export type AppendSignalBindingRevision403 = Problem
export const AppendSignalBindingRevision403 = Problem
export type AppendSignalBindingRevision404 = Problem
export const AppendSignalBindingRevision404 = Problem
export type AppendSignalBindingRevision405 = Problem
export const AppendSignalBindingRevision405 = Problem
export type AppendSignalBindingRevision409 = Problem
export const AppendSignalBindingRevision409 = Problem
export type AppendSignalBindingRevision500 = Problem
export const AppendSignalBindingRevision500 = Problem
export type ListRelationshipTypeDefinitionsParams = { readonly "limit"?: number, readonly "after_id"?: AdministrationIdentifier, readonly "after_version"?: number }
export const ListRelationshipTypeDefinitionsParams = Schema.Struct({ "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after_id": Schema.optionalKey(AdministrationIdentifier), "after_version": Schema.optionalKey(Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" }))) })
export type ListRelationshipTypeDefinitions200 = DefinitionCataloguePage
export const ListRelationshipTypeDefinitions200 = DefinitionCataloguePage
export type ListRelationshipTypeDefinitions400 = Problem
export const ListRelationshipTypeDefinitions400 = Problem
export type ListRelationshipTypeDefinitions401 = Problem
export const ListRelationshipTypeDefinitions401 = Problem
export type ListRelationshipTypeDefinitions403 = Problem
export const ListRelationshipTypeDefinitions403 = Problem
export type ListRelationshipTypeDefinitions405 = Problem
export const ListRelationshipTypeDefinitions405 = Problem
export type ListRelationshipTypeDefinitions500 = Problem
export const ListRelationshipTypeDefinitions500 = Problem
export type AppendRelationshipRevisionParams = { readonly "Origin"?: string, readonly "X-FleetIQ-CSRF"?: "1" }
export const AppendRelationshipRevisionParams = Schema.Struct({ "Origin": Schema.optionalKey(Schema.String), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type AppendRelationshipRevisionRequestJson = AppendRelationshipRevisionRequest
export const AppendRelationshipRevisionRequestJson = AppendRelationshipRevisionRequest
export type AppendRelationshipRevision200 = MetadataRevisionResult
export const AppendRelationshipRevision200 = MetadataRevisionResult
export type AppendRelationshipRevision201 = MetadataRevisionResult
export const AppendRelationshipRevision201 = MetadataRevisionResult
export type AppendRelationshipRevision400 = Problem
export const AppendRelationshipRevision400 = Problem
export type AppendRelationshipRevision401 = Problem
export const AppendRelationshipRevision401 = Problem
export type AppendRelationshipRevision403 = Problem
export const AppendRelationshipRevision403 = Problem
export type AppendRelationshipRevision404 = Problem
export const AppendRelationshipRevision404 = Problem
export type AppendRelationshipRevision405 = Problem
export const AppendRelationshipRevision405 = Problem
export type AppendRelationshipRevision409 = Problem
export const AppendRelationshipRevision409 = Problem
export type AppendRelationshipRevision500 = Problem
export const AppendRelationshipRevision500 = Problem
export type GetFleetSnapshotParams = { readonly "latitude_property": string, readonly "longitude_property": string, readonly "latitude_version": number, readonly "longitude_version": number, readonly "encoding": "degrees" | "e7", readonly "limit"?: number, readonly "after"?: string }
export const GetFleetSnapshotParams = Schema.Struct({ "latitude_property": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "longitude_property": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), "latitude_version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "longitude_version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), "encoding": Schema.Literals(["degrees", "e7"]), "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" }))) })
export type GetFleetSnapshot200 = FleetSnapshot
export const GetFleetSnapshot200 = FleetSnapshot
export type GetFleetSnapshot400 = Problem
export const GetFleetSnapshot400 = Problem
export type GetFleetSnapshot401 = Problem
export const GetFleetSnapshot401 = Problem
export type GetFleetSnapshot403 = Problem
export const GetFleetSnapshot403 = Problem
export type GetFleetSnapshot404 = Problem
export const GetFleetSnapshot404 = Problem
export type GetFleetSnapshot500 = Problem
export const GetFleetSnapshot500 = Problem
export type StreamCurrentPropertyParams = { readonly "Last-Event-ID"?: string }
export const StreamCurrentPropertyParams = Schema.Struct({ "Last-Event-ID": Schema.optionalKey(Schema.String.check(Schema.isMaxCodePoints(110).annotate({ "expected": "a string with at most 110 code points" })).check(Schema.isPattern(new RegExp("^v1\\.[a-f0-9]{64}\\.(0|[1-9][0-9]{0,18})\\.(0|[1-9][0-9]{0,18})$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.[a-f0-9]{64}\\.(0|[1-9][0-9]{0,18})\\.(0|[1-9][0-9]{0,18})$" }))) })
export type StreamCurrentProperty200Sse = PropertyLiveStream
export const StreamCurrentProperty200Sse = PropertyLiveStream
export type StreamCurrentProperty400 = Problem
export const StreamCurrentProperty400 = Problem
export type StreamCurrentProperty401 = Problem
export const StreamCurrentProperty401 = Problem
export type StreamCurrentProperty403 = Problem
export const StreamCurrentProperty403 = Problem
export type StreamCurrentProperty404 = Problem
export const StreamCurrentProperty404 = Problem
export type StreamCurrentProperty429 = Problem
export const StreamCurrentProperty429 = Problem
export type StreamCurrentProperty500 = Problem
export const StreamCurrentProperty500 = Problem
export type GetCurrentPropertySnapshot200 = CurrentPropertySnapshot
export const GetCurrentPropertySnapshot200 = CurrentPropertySnapshot
export type GetCurrentPropertySnapshot400 = Problem
export const GetCurrentPropertySnapshot400 = Problem
export type GetCurrentPropertySnapshot401 = Problem
export const GetCurrentPropertySnapshot401 = Problem
export type GetCurrentPropertySnapshot403 = Problem
export const GetCurrentPropertySnapshot403 = Problem
export type GetCurrentPropertySnapshot404 = Problem
export const GetCurrentPropertySnapshot404 = Problem
export type GetCurrentPropertySnapshot500 = Problem
export const GetCurrentPropertySnapshot500 = Problem
export type ListPropertyHistoryParams = { readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "limit"?: number, readonly "after"?: HistoryToken }
export const ListPropertyHistoryParams = Schema.Struct({ "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after": Schema.optionalKey(HistoryToken) })
export type ListPropertyHistory200 = PropertyHistoryPage
export const ListPropertyHistory200 = PropertyHistoryPage
export type ListPropertyHistory400 = Problem
export const ListPropertyHistory400 = Problem
export type ListPropertyHistory401 = Problem
export const ListPropertyHistory401 = Problem
export type ListPropertyHistory403 = Problem
export const ListPropertyHistory403 = Problem
export type ListPropertyHistory500 = Problem
export const ListPropertyHistory500 = Problem
export type GetPropertyInterpretation200 = PropertyHistoryChange
export const GetPropertyInterpretation200 = PropertyHistoryChange
export type GetPropertyInterpretation400 = Problem
export const GetPropertyInterpretation400 = Problem
export type GetPropertyInterpretation401 = Problem
export const GetPropertyInterpretation401 = Problem
export type GetPropertyInterpretation403 = Problem
export const GetPropertyInterpretation403 = Problem
export type GetPropertyInterpretation404 = Problem
export const GetPropertyInterpretation404 = Problem
export type GetPropertyInterpretation500 = Problem
export const GetPropertyInterpretation500 = Problem
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
export type RegisterAssetParams = { readonly "Origin"?: string, readonly "X-FleetIQ-CSRF"?: "1" }
export const RegisterAssetParams = Schema.Struct({ "Origin": Schema.optionalKey(Schema.String), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type RegisterAssetRequestJson = RegisterAssetRequest
export const RegisterAssetRequestJson = RegisterAssetRequest
export type RegisterAsset200 = MetadataRegistrationResult
export const RegisterAsset200 = MetadataRegistrationResult
export type RegisterAsset201 = MetadataRegistrationResult
export const RegisterAsset201 = MetadataRegistrationResult
export type RegisterAsset400 = Problem
export const RegisterAsset400 = Problem
export type RegisterAsset401 = Problem
export const RegisterAsset401 = Problem
export type RegisterAsset403 = Problem
export const RegisterAsset403 = Problem
export type RegisterAsset404 = Problem
export const RegisterAsset404 = Problem
export type RegisterAsset405 = Problem
export const RegisterAsset405 = Problem
export type RegisterAsset409 = Problem
export const RegisterAsset409 = Problem
export type RegisterAsset500 = Problem
export const RegisterAsset500 = Problem
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
export type GetCommunicationDevice200 = CommunicationDevice
export const GetCommunicationDevice200 = CommunicationDevice
export type GetCommunicationDevice400 = Problem
export const GetCommunicationDevice400 = Problem
export type GetCommunicationDevice401 = Problem
export const GetCommunicationDevice401 = Problem
export type GetCommunicationDevice403 = Problem
export const GetCommunicationDevice403 = Problem
export type GetCommunicationDevice404 = Problem
export const GetCommunicationDevice404 = Problem
export type GetCommunicationDevice405 = Problem
export const GetCommunicationDevice405 = Problem
export type GetCommunicationDevice500 = Problem
export const GetCommunicationDevice500 = Problem
export type RegisterCommunicationDeviceParams = { readonly "Origin"?: string, readonly "X-FleetIQ-CSRF"?: "1" }
export const RegisterCommunicationDeviceParams = Schema.Struct({ "Origin": Schema.optionalKey(Schema.String), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type RegisterCommunicationDeviceRequestJson = RegisterCommunicationDeviceRequest
export const RegisterCommunicationDeviceRequestJson = RegisterCommunicationDeviceRequest
export type RegisterCommunicationDevice200 = MetadataRegistrationResult
export const RegisterCommunicationDevice200 = MetadataRegistrationResult
export type RegisterCommunicationDevice201 = MetadataRegistrationResult
export const RegisterCommunicationDevice201 = MetadataRegistrationResult
export type RegisterCommunicationDevice400 = Problem
export const RegisterCommunicationDevice400 = Problem
export type RegisterCommunicationDevice401 = Problem
export const RegisterCommunicationDevice401 = Problem
export type RegisterCommunicationDevice403 = Problem
export const RegisterCommunicationDevice403 = Problem
export type RegisterCommunicationDevice404 = Problem
export const RegisterCommunicationDevice404 = Problem
export type RegisterCommunicationDevice405 = Problem
export const RegisterCommunicationDevice405 = Problem
export type RegisterCommunicationDevice409 = Problem
export const RegisterCommunicationDevice409 = Problem
export type RegisterCommunicationDevice500 = Problem
export const RegisterCommunicationDevice500 = Problem
export type ListAssetTypeDefinitionsParams = { readonly "limit"?: number, readonly "after_id"?: AdministrationIdentifier, readonly "after_version"?: number }
export const ListAssetTypeDefinitionsParams = Schema.Struct({ "limit": Schema.optionalKey(Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100" }))), "after_id": Schema.optionalKey(AdministrationIdentifier), "after_version": Schema.optionalKey(Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" }))) })
export type ListAssetTypeDefinitions200 = DefinitionCataloguePage
export const ListAssetTypeDefinitions200 = DefinitionCataloguePage
export type ListAssetTypeDefinitions400 = Problem
export const ListAssetTypeDefinitions400 = Problem
export type ListAssetTypeDefinitions401 = Problem
export const ListAssetTypeDefinitions401 = Problem
export type ListAssetTypeDefinitions403 = Problem
export const ListAssetTypeDefinitions403 = Problem
export type ListAssetTypeDefinitions405 = Problem
export const ListAssetTypeDefinitions405 = Problem
export type ListAssetTypeDefinitions500 = Problem
export const ListAssetTypeDefinitions500 = Problem
export type GetDeviceProtocolRoute200 = ProtocolDeviceRoute
export const GetDeviceProtocolRoute200 = ProtocolDeviceRoute
export type GetDeviceProtocolRoute400 = Problem
export const GetDeviceProtocolRoute400 = Problem
export type GetDeviceProtocolRoute401 = Problem
export const GetDeviceProtocolRoute401 = Problem
export type GetDeviceProtocolRoute403 = Problem
export const GetDeviceProtocolRoute403 = Problem
export type GetDeviceProtocolRoute404 = Problem
export const GetDeviceProtocolRoute404 = Problem
export type GetDeviceProtocolRoute500 = Problem
export const GetDeviceProtocolRoute500 = Problem
export type ChangeDeviceProtocolRouteParams = { readonly "Origin"?: string, readonly "X-FleetIQ-CSRF"?: "1" }
export const ChangeDeviceProtocolRouteParams = Schema.Struct({ "Origin": Schema.optionalKey(Schema.String), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type ChangeDeviceProtocolRouteRequestJson = ChangeProtocolRouteRequest
export const ChangeDeviceProtocolRouteRequestJson = ChangeProtocolRouteRequest
export type ChangeDeviceProtocolRoute200 = ProtocolDeviceRoute
export const ChangeDeviceProtocolRoute200 = ProtocolDeviceRoute
export type ChangeDeviceProtocolRoute400 = Problem
export const ChangeDeviceProtocolRoute400 = Problem
export type ChangeDeviceProtocolRoute401 = Problem
export const ChangeDeviceProtocolRoute401 = Problem
export type ChangeDeviceProtocolRoute403 = Problem
export const ChangeDeviceProtocolRoute403 = Problem
export type ChangeDeviceProtocolRoute409 = Problem
export const ChangeDeviceProtocolRoute409 = Problem
export type ChangeDeviceProtocolRoute500 = Problem
export const ChangeDeviceProtocolRoute500 = Problem
export type GetProtocolPackageRelease200 = ProtocolPackageRelease
export const GetProtocolPackageRelease200 = ProtocolPackageRelease
export type GetProtocolPackageRelease400 = Problem
export const GetProtocolPackageRelease400 = Problem
export type GetProtocolPackageRelease401 = Problem
export const GetProtocolPackageRelease401 = Problem
export type GetProtocolPackageRelease403 = Problem
export const GetProtocolPackageRelease403 = Problem
export type GetProtocolPackageRelease404 = Problem
export const GetProtocolPackageRelease404 = Problem
export type GetProtocolPackageRelease500 = Problem
export const GetProtocolPackageRelease500 = Problem
export type GetDeviceIngestionDiagnostics200 = IngestionDiagnostics
export const GetDeviceIngestionDiagnostics200 = IngestionDiagnostics
export type GetDeviceIngestionDiagnostics400 = Problem
export const GetDeviceIngestionDiagnostics400 = Problem
export type GetDeviceIngestionDiagnostics401 = Problem
export const GetDeviceIngestionDiagnostics401 = Problem
export type GetDeviceIngestionDiagnostics403 = Problem
export const GetDeviceIngestionDiagnostics403 = Problem
export type GetDeviceIngestionDiagnostics404 = Problem
export const GetDeviceIngestionDiagnostics404 = Problem
export type GetDeviceIngestionDiagnostics500 = Problem
export const GetDeviceIngestionDiagnostics500 = Problem

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
  const executeStreamRequest = (request: HttpClientRequest.HttpClientRequest) =>
    Effect.suspend(() =>
      options.transformClient
        ? Effect.flatMap(options.transformClient(httpClient), (client) => HttpClient.filterStatusOk(client).execute(request))
        : HttpClient.filterStatusOk(httpClient).execute(request)
    )
  const sseRequest = <
     Type,
     DecodingServices
    >(
      schema: Schema.ConstraintDecoder<Type, DecodingServices>
    ) =>
    (
      request: HttpClientRequest.HttpClientRequest
    ): Stream.Stream<
      { readonly event: string; readonly id: string | undefined; readonly data: Type },
      HttpClientError.HttpClientError | SchemaError | Sse.Retry | Sse.SseError,
      DecodingServices
    > =>
      executeStreamRequest(request).pipe(
        Effect.map((response) => response.stream),
        Stream.unwrap,
        Stream.decodeText(),
        Stream.pipeThroughChannel(Sse.decodeDataSchema(schema))
      )
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
    "getSignalBindingRevision": (tenantId, bindingId, revision, options: Parameters<FleetIqApi["getSignalBindingRevision"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, bindingId, revision], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/signal-bindings/" + __encodePathParam(bindingId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetSignalBindingRevision200),
      "400": decodeError("GetSignalBindingRevision400", GetSignalBindingRevision400),
      "401": decodeError("GetSignalBindingRevision401", GetSignalBindingRevision401),
      "403": decodeError("GetSignalBindingRevision403", GetSignalBindingRevision403),
      "404": decodeError("GetSignalBindingRevision404", GetSignalBindingRevision404),
      "405": decodeError("GetSignalBindingRevision405", GetSignalBindingRevision405),
      "500": decodeError("GetSignalBindingRevision500", GetSignalBindingRevision500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "appendSignalBindingRevision": (tenantId, bindingId, revision, options: Parameters<FleetIqApi["appendSignalBindingRevision"]>[3]) => __makePathRequest(HttpClientRequest.post, [tenantId, bindingId, revision], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/signal-bindings/" + __encodePathParam(bindingId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params?.["X-FleetIQ-CSRF"] ?? undefined }),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(AppendSignalBindingRevision200),
      "201": decodeSuccess(AppendSignalBindingRevision201),
      "400": decodeError("AppendSignalBindingRevision400", AppendSignalBindingRevision400),
      "401": decodeError("AppendSignalBindingRevision401", AppendSignalBindingRevision401),
      "403": decodeError("AppendSignalBindingRevision403", AppendSignalBindingRevision403),
      "404": decodeError("AppendSignalBindingRevision404", AppendSignalBindingRevision404),
      "405": decodeError("AppendSignalBindingRevision405", AppendSignalBindingRevision405),
      "409": decodeError("AppendSignalBindingRevision409", AppendSignalBindingRevision409),
      "500": decodeError("AppendSignalBindingRevision500", AppendSignalBindingRevision500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listRelationshipTypeDefinitions": (tenantId, options: Parameters<FleetIqApi["listRelationshipTypeDefinitions"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/relationship-types").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after_id": options?.params?.["after_id"] as any, "after_version": options?.params?.["after_version"] as any }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListRelationshipTypeDefinitions200),
      "400": decodeError("ListRelationshipTypeDefinitions400", ListRelationshipTypeDefinitions400),
      "401": decodeError("ListRelationshipTypeDefinitions401", ListRelationshipTypeDefinitions401),
      "403": decodeError("ListRelationshipTypeDefinitions403", ListRelationshipTypeDefinitions403),
      "405": decodeError("ListRelationshipTypeDefinitions405", ListRelationshipTypeDefinitions405),
      "500": decodeError("ListRelationshipTypeDefinitions500", ListRelationshipTypeDefinitions500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "appendRelationshipRevision": (tenantId, relationshipId, revision, options: Parameters<FleetIqApi["appendRelationshipRevision"]>[3]) => __makePathRequest(HttpClientRequest.post, [tenantId, relationshipId, revision], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/relationships/" + __encodePathParam(relationshipId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params?.["X-FleetIQ-CSRF"] ?? undefined }),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(AppendRelationshipRevision200),
      "201": decodeSuccess(AppendRelationshipRevision201),
      "400": decodeError("AppendRelationshipRevision400", AppendRelationshipRevision400),
      "401": decodeError("AppendRelationshipRevision401", AppendRelationshipRevision401),
      "403": decodeError("AppendRelationshipRevision403", AppendRelationshipRevision403),
      "404": decodeError("AppendRelationshipRevision404", AppendRelationshipRevision404),
      "405": decodeError("AppendRelationshipRevision405", AppendRelationshipRevision405),
      "409": decodeError("AppendRelationshipRevision409", AppendRelationshipRevision409),
      "500": decodeError("AppendRelationshipRevision500", AppendRelationshipRevision500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getFleetSnapshot": (tenantId, options: Parameters<FleetIqApi["getFleetSnapshot"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/fleet").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "latitude_property": options.params["latitude_property"] as any, "longitude_property": options.params["longitude_property"] as any, "latitude_version": options.params["latitude_version"] as any, "longitude_version": options.params["longitude_version"] as any, "encoding": options.params["encoding"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetFleetSnapshot200),
      "400": decodeError("GetFleetSnapshot400", GetFleetSnapshot400),
      "401": decodeError("GetFleetSnapshot401", GetFleetSnapshot401),
      "403": decodeError("GetFleetSnapshot403", GetFleetSnapshot403),
      "404": decodeError("GetFleetSnapshot404", GetFleetSnapshot404),
      "500": decodeError("GetFleetSnapshot500", GetFleetSnapshot500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "streamCurrentProperty": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["streamCurrentProperty"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/live").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Last-Event-ID": options?.params?.["Last-Event-ID"] ?? undefined }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "400": decodeError("StreamCurrentProperty400", StreamCurrentProperty400),
      "401": decodeError("StreamCurrentProperty401", StreamCurrentProperty401),
      "403": decodeError("StreamCurrentProperty403", StreamCurrentProperty403),
      "404": decodeError("StreamCurrentProperty404", StreamCurrentProperty404),
      "429": decodeError("StreamCurrentProperty429", StreamCurrentProperty429),
      "500": decodeError("StreamCurrentProperty500", StreamCurrentProperty500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "streamCurrentPropertySse": (tenantId, assetId, propertyId, version, options) => Stream.unwrap(__makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/live").pipe(
    Effect.map((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Last-Event-ID": options?.params?.["Last-Event-ID"] ?? undefined }),
      sseRequest(StreamCurrentProperty200Sse)
    ))
  )),
    "getCurrentPropertySnapshot": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["getCurrentPropertySnapshot"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/current").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetCurrentPropertySnapshot200),
      "400": decodeError("GetCurrentPropertySnapshot400", GetCurrentPropertySnapshot400),
      "401": decodeError("GetCurrentPropertySnapshot401", GetCurrentPropertySnapshot401),
      "403": decodeError("GetCurrentPropertySnapshot403", GetCurrentPropertySnapshot403),
      "404": decodeError("GetCurrentPropertySnapshot404", GetCurrentPropertySnapshot404),
      "500": decodeError("GetCurrentPropertySnapshot500", GetCurrentPropertySnapshot500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listPropertyHistory": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["listPropertyHistory"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/history").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "start_at_ms": options.params["start_at_ms"] as any, "end_at_ms": options.params["end_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListPropertyHistory200),
      "400": decodeError("ListPropertyHistory400", ListPropertyHistory400),
      "401": decodeError("ListPropertyHistory401", ListPropertyHistory401),
      "403": decodeError("ListPropertyHistory403", ListPropertyHistory403),
      "500": decodeError("ListPropertyHistory500", ListPropertyHistory500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getPropertyInterpretation": (tenantId, assetId, propertyId, version, interpretation, options: Parameters<FleetIqApi["getPropertyInterpretation"]>[5]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version, interpretation], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/interpretations/" + __encodePathParam(interpretation) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetPropertyInterpretation200),
      "400": decodeError("GetPropertyInterpretation400", GetPropertyInterpretation400),
      "401": decodeError("GetPropertyInterpretation401", GetPropertyInterpretation401),
      "403": decodeError("GetPropertyInterpretation403", GetPropertyInterpretation403),
      "404": decodeError("GetPropertyInterpretation404", GetPropertyInterpretation404),
      "500": decodeError("GetPropertyInterpretation500", GetPropertyInterpretation500),
      orElse: unexpectedStatus
    }))
    ))
  ),
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
    "registerAsset": (tenantId, options: Parameters<FleetIqApi["registerAsset"]>[1]) => __makePathRequest(HttpClientRequest.post, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params?.["X-FleetIQ-CSRF"] ?? undefined }),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(RegisterAsset200),
      "201": decodeSuccess(RegisterAsset201),
      "400": decodeError("RegisterAsset400", RegisterAsset400),
      "401": decodeError("RegisterAsset401", RegisterAsset401),
      "403": decodeError("RegisterAsset403", RegisterAsset403),
      "404": decodeError("RegisterAsset404", RegisterAsset404),
      "405": decodeError("RegisterAsset405", RegisterAsset405),
      "409": decodeError("RegisterAsset409", RegisterAsset409),
      "500": decodeError("RegisterAsset500", RegisterAsset500),
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
    ),
    "getCommunicationDevice": (tenantId, assetId, options: Parameters<FleetIqApi["getCommunicationDevice"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/device").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetCommunicationDevice200),
      "400": decodeError("GetCommunicationDevice400", GetCommunicationDevice400),
      "401": decodeError("GetCommunicationDevice401", GetCommunicationDevice401),
      "403": decodeError("GetCommunicationDevice403", GetCommunicationDevice403),
      "404": decodeError("GetCommunicationDevice404", GetCommunicationDevice404),
      "405": decodeError("GetCommunicationDevice405", GetCommunicationDevice405),
      "500": decodeError("GetCommunicationDevice500", GetCommunicationDevice500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "registerCommunicationDevice": (tenantId, assetId, options: Parameters<FleetIqApi["registerCommunicationDevice"]>[2]) => __makePathRequest(HttpClientRequest.post, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/device").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params?.["X-FleetIQ-CSRF"] ?? undefined }),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(RegisterCommunicationDevice200),
      "201": decodeSuccess(RegisterCommunicationDevice201),
      "400": decodeError("RegisterCommunicationDevice400", RegisterCommunicationDevice400),
      "401": decodeError("RegisterCommunicationDevice401", RegisterCommunicationDevice401),
      "403": decodeError("RegisterCommunicationDevice403", RegisterCommunicationDevice403),
      "404": decodeError("RegisterCommunicationDevice404", RegisterCommunicationDevice404),
      "405": decodeError("RegisterCommunicationDevice405", RegisterCommunicationDevice405),
      "409": decodeError("RegisterCommunicationDevice409", RegisterCommunicationDevice409),
      "500": decodeError("RegisterCommunicationDevice500", RegisterCommunicationDevice500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listAssetTypeDefinitions": (tenantId, options: Parameters<FleetIqApi["listAssetTypeDefinitions"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/asset-types").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after_id": options?.params?.["after_id"] as any, "after_version": options?.params?.["after_version"] as any }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ListAssetTypeDefinitions200),
      "400": decodeError("ListAssetTypeDefinitions400", ListAssetTypeDefinitions400),
      "401": decodeError("ListAssetTypeDefinitions401", ListAssetTypeDefinitions401),
      "403": decodeError("ListAssetTypeDefinitions403", ListAssetTypeDefinitions403),
      "405": decodeError("ListAssetTypeDefinitions405", ListAssetTypeDefinitions405),
      "500": decodeError("ListAssetTypeDefinitions500", ListAssetTypeDefinitions500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getDeviceProtocolRoute": (tenantId, assetId, channelId, options: Parameters<FleetIqApi["getDeviceProtocolRoute"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, channelId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/protocol-routes/" + __encodePathParam(channelId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetDeviceProtocolRoute200),
      "400": decodeError("GetDeviceProtocolRoute400", GetDeviceProtocolRoute400),
      "401": decodeError("GetDeviceProtocolRoute401", GetDeviceProtocolRoute401),
      "403": decodeError("GetDeviceProtocolRoute403", GetDeviceProtocolRoute403),
      "404": decodeError("GetDeviceProtocolRoute404", GetDeviceProtocolRoute404),
      "500": decodeError("GetDeviceProtocolRoute500", GetDeviceProtocolRoute500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "changeDeviceProtocolRoute": (tenantId, assetId, channelId, options: Parameters<FleetIqApi["changeDeviceProtocolRoute"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, assetId, channelId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/protocol-routes/" + __encodePathParam(channelId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params?.["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params?.["X-FleetIQ-CSRF"] ?? undefined }),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(ChangeDeviceProtocolRoute200),
      "400": decodeError("ChangeDeviceProtocolRoute400", ChangeDeviceProtocolRoute400),
      "401": decodeError("ChangeDeviceProtocolRoute401", ChangeDeviceProtocolRoute401),
      "403": decodeError("ChangeDeviceProtocolRoute403", ChangeDeviceProtocolRoute403),
      "409": decodeError("ChangeDeviceProtocolRoute409", ChangeDeviceProtocolRoute409),
      "500": decodeError("ChangeDeviceProtocolRoute500", ChangeDeviceProtocolRoute500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getProtocolPackageRelease": (tenantId, packageId, packageVersion, options: Parameters<FleetIqApi["getProtocolPackageRelease"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, packageId, packageVersion], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/protocol-packages/" + __encodePathParam(packageId) + "/versions/" + __encodePathParam(packageVersion) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetProtocolPackageRelease200),
      "400": decodeError("GetProtocolPackageRelease400", GetProtocolPackageRelease400),
      "401": decodeError("GetProtocolPackageRelease401", GetProtocolPackageRelease401),
      "403": decodeError("GetProtocolPackageRelease403", GetProtocolPackageRelease403),
      "404": decodeError("GetProtocolPackageRelease404", GetProtocolPackageRelease404),
      "500": decodeError("GetProtocolPackageRelease500", GetProtocolPackageRelease500),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getDeviceIngestionDiagnostics": (tenantId, assetId, options: Parameters<FleetIqApi["getDeviceIngestionDiagnostics"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => "/api/v1/tenants/" + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/ingestion-diagnostics").pipe(
    Effect.flatMap((request) => request.pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetDeviceIngestionDiagnostics200),
      "400": decodeError("GetDeviceIngestionDiagnostics400", GetDeviceIngestionDiagnostics400),
      "401": decodeError("GetDeviceIngestionDiagnostics401", GetDeviceIngestionDiagnostics401),
      "403": decodeError("GetDeviceIngestionDiagnostics403", GetDeviceIngestionDiagnostics403),
      "404": decodeError("GetDeviceIngestionDiagnostics404", GetDeviceIngestionDiagnostics404),
      "500": decodeError("GetDeviceIngestionDiagnostics500", GetDeviceIngestionDiagnostics500),
      orElse: unexpectedStatus
    }))
    ))
  )
  }
}

export interface FleetIqApi {
  readonly httpClient: HttpClient.HttpClient
  /**
* Requires exact current metadata.read under the listener-selected identity. Returns the existing immutable representation for precisely the requested positive u64 revision, including its original recorded time and half-open effective interval. A missing exact revision returns 404, never another revision. Leading zeros in the decimal path are accepted. All outcomes are no-store. This read does not append, resolve signals or select a bitemporal snapshot.
*/
readonly "getSignalBindingRevision": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, bindingId: string, revision: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetSignalBindingRevision200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetSignalBindingRevision400", GetSignalBindingRevision400> | FleetIqApiError<"GetSignalBindingRevision401", GetSignalBindingRevision401> | FleetIqApiError<"GetSignalBindingRevision403", GetSignalBindingRevision403> | FleetIqApiError<"GetSignalBindingRevision404", GetSignalBindingRevision404> | FleetIqApiError<"GetSignalBindingRevision405", GetSignalBindingRevision405> | FleetIqApiError<"GetSignalBindingRevision500", GetSignalBindingRevision500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, bindingId: string, revision: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetSignalBindingRevision200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetSignalBindingRevision400", GetSignalBindingRevision400> | FleetIqApiError<"GetSignalBindingRevision401", GetSignalBindingRevision401> | FleetIqApiError<"GetSignalBindingRevision403", GetSignalBindingRevision403> | FleetIqApiError<"GetSignalBindingRevision404", GetSignalBindingRevision404> | FleetIqApiError<"GetSignalBindingRevision405", GetSignalBindingRevision405> | FleetIqApiError<"GetSignalBindingRevision500", GetSignalBindingRevision500>>;
  }
  /**
* Mounted only on an authenticated listener. Requires exact current metadata.manage for the selected active tenant, independent of metadata.read. Browser mode requires one exact configured Origin and X-FleetIQ-CSRF: 1 and never falls back to bearer. Authentication and authorization precede body/reference errors. JSON is limited to 32 KiB with closed nested objects; unknown and duplicate fields are rejected. Actor, tenant, revision identity and recorded time cannot be supplied in JSON. The path selects the exact positive u64 revision as decimal text. Revision 1 creates the lineage; the exact successor explicitly corrects it, without editing old facts. Effective start/end are physical time, separate from trusted host recorded time. Return 201 appended, 200 already_appended for identical complete content with original actor/time, 409 for different content, gaps, exhausted sequence, clock regression or unattributed legacy facts, and 404 for missing same-tenant references. Recorded time cannot decrease. Retry identical identity/revision/content after a lost or ambiguous response, even after later corrections; a commit error is never success. All outcomes are no-store and redact storage details. No deletion, graph-wide cycle/cardinality enforcement or automatic semantic reprocessing is introduced. Source device endpoint must exist in this tenant; target property must be an exact member of the target asset type. Source signal names remain protocol-neutral, without asserting a deployed decoder emits them.
*/
readonly "appendSignalBindingRevision": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, bindingId: string, revision: string, options: { readonly params?: typeof AppendSignalBindingRevisionParams.Encoded | undefined; readonly payload: typeof AppendSignalBindingRevisionRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<AppendSignalBindingRevision200 | AppendSignalBindingRevision201, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AppendSignalBindingRevision400", AppendSignalBindingRevision400> | FleetIqApiError<"AppendSignalBindingRevision401", AppendSignalBindingRevision401> | FleetIqApiError<"AppendSignalBindingRevision403", AppendSignalBindingRevision403> | FleetIqApiError<"AppendSignalBindingRevision404", AppendSignalBindingRevision404> | FleetIqApiError<"AppendSignalBindingRevision405", AppendSignalBindingRevision405> | FleetIqApiError<"AppendSignalBindingRevision409", AppendSignalBindingRevision409> | FleetIqApiError<"AppendSignalBindingRevision500", AppendSignalBindingRevision500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, bindingId: string, revision: string, options: { readonly params?: typeof AppendSignalBindingRevisionParams.Encoded | undefined; readonly payload: typeof AppendSignalBindingRevisionRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<AppendSignalBindingRevision200 | AppendSignalBindingRevision201, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AppendSignalBindingRevision400", AppendSignalBindingRevision400> | FleetIqApiError<"AppendSignalBindingRevision401", AppendSignalBindingRevision401> | FleetIqApiError<"AppendSignalBindingRevision403", AppendSignalBindingRevision403> | FleetIqApiError<"AppendSignalBindingRevision404", AppendSignalBindingRevision404> | FleetIqApiError<"AppendSignalBindingRevision405", AppendSignalBindingRevision405> | FleetIqApiError<"AppendSignalBindingRevision409", AppendSignalBindingRevision409> | FleetIqApiError<"AppendSignalBindingRevision500", AppendSignalBindingRevision500>>;
  }
  /**
* Only mounted on an authenticated listener. Authenticate and authorize the tenant before reporting command, identity or query errors. An invalid, missing, suspended or inaccessible tenant returns 403. Every outcome is no-store and problems redact credentials and database details. Requires exact current metadata.read; metadata.manage and access.manage do not imply read access. Limit 1..100, default 50. Unknown and duplicate query fields are invalid. Both after_id and after_version are required together. Numeric versions sort numerically within case-sensitive IDs. Cursors are exclusive traversal positions, not snapshots or authority. New versions may be published during traversal; no latest-version alias or distinct-definition total is implied.
*/
readonly "listRelationshipTypeDefinitions": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListRelationshipTypeDefinitionsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListRelationshipTypeDefinitions200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListRelationshipTypeDefinitions400", ListRelationshipTypeDefinitions400> | FleetIqApiError<"ListRelationshipTypeDefinitions401", ListRelationshipTypeDefinitions401> | FleetIqApiError<"ListRelationshipTypeDefinitions403", ListRelationshipTypeDefinitions403> | FleetIqApiError<"ListRelationshipTypeDefinitions405", ListRelationshipTypeDefinitions405> | FleetIqApiError<"ListRelationshipTypeDefinitions500", ListRelationshipTypeDefinitions500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListRelationshipTypeDefinitionsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListRelationshipTypeDefinitions200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListRelationshipTypeDefinitions400", ListRelationshipTypeDefinitions400> | FleetIqApiError<"ListRelationshipTypeDefinitions401", ListRelationshipTypeDefinitions401> | FleetIqApiError<"ListRelationshipTypeDefinitions403", ListRelationshipTypeDefinitions403> | FleetIqApiError<"ListRelationshipTypeDefinitions405", ListRelationshipTypeDefinitions405> | FleetIqApiError<"ListRelationshipTypeDefinitions500", ListRelationshipTypeDefinitions500>>;
  }
  /**
* Mounted only on an authenticated listener. Requires exact current metadata.manage for the selected active tenant, independent of metadata.read. Browser mode requires one exact configured Origin and X-FleetIQ-CSRF: 1 and never falls back to bearer. Authentication and authorization precede body/reference errors. JSON is limited to 32 KiB with closed nested objects; unknown and duplicate fields are rejected. Actor, tenant, revision identity and recorded time cannot be supplied in JSON. The path selects the exact positive u64 revision as decimal text. Revision 1 creates the lineage; the exact successor explicitly corrects it, without editing old facts. Effective start/end are physical time, separate from trusted host recorded time. Return 201 appended, 200 already_appended for identical complete content with original actor/time, 409 for different content, gaps, exhausted sequence, clock regression or unattributed legacy facts, and 404 for missing same-tenant references. Recorded time cannot decrease. Retry identical identity/revision/content after a lost or ambiguous response, even after later corrections; a commit error is never success. All outcomes are no-store and redact storage details. No deletion, graph-wide cycle/cardinality enforcement or automatic semantic reprocessing is introduced. Directed source and target assets and exact relationship type must exist in the same tenant.
*/
readonly "appendRelationshipRevision": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, relationshipId: string, revision: string, options: { readonly params?: typeof AppendRelationshipRevisionParams.Encoded | undefined; readonly payload: typeof AppendRelationshipRevisionRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<AppendRelationshipRevision200 | AppendRelationshipRevision201, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AppendRelationshipRevision400", AppendRelationshipRevision400> | FleetIqApiError<"AppendRelationshipRevision401", AppendRelationshipRevision401> | FleetIqApiError<"AppendRelationshipRevision403", AppendRelationshipRevision403> | FleetIqApiError<"AppendRelationshipRevision404", AppendRelationshipRevision404> | FleetIqApiError<"AppendRelationshipRevision405", AppendRelationshipRevision405> | FleetIqApiError<"AppendRelationshipRevision409", AppendRelationshipRevision409> | FleetIqApiError<"AppendRelationshipRevision500", AppendRelationshipRevision500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, relationshipId: string, revision: string, options: { readonly params?: typeof AppendRelationshipRevisionParams.Encoded | undefined; readonly payload: typeof AppendRelationshipRevisionRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<AppendRelationshipRevision200 | AppendRelationshipRevision201, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AppendRelationshipRevision400", AppendRelationshipRevision400> | FleetIqApiError<"AppendRelationshipRevision401", AppendRelationshipRevision401> | FleetIqApiError<"AppendRelationshipRevision403", AppendRelationshipRevision403> | FleetIqApiError<"AppendRelationshipRevision404", AppendRelationshipRevision404> | FleetIqApiError<"AppendRelationshipRevision405", AppendRelationshipRevision405> | FleetIqApiError<"AppendRelationshipRevision409", AppendRelationshipRevision409> | FleetIqApiError<"AppendRelationshipRevision500", AppendRelationshipRevision500>>;
  }
  /**
* Requires both fresh metadata.read and telemetry.read for the same actor/tenant before mapping discovery. Explicit immutable axis mapping and encoding; no persisted mapping write. Coordinates require distinct source outputs/signals, the same accepted message, decoder release, device, endpoint and device-recorded event time, without repeated signal/timestamp ambiguity. Receipt-only pairing is unavailable. Invalid quality never falls back to older good values. Degrees require numeric deg definitions/source units; E7 requires unitless integer definitions/source values. Full tenant inventory/projection counts and bounded asset rows share a repeatable read snapshot. Unsupported mappings, missing/stale/future/invalid positions and unlocated assets remain explicit. No online/health inference. C-ordered exclusive after cursor; preserve all mapping parameters across pages. SQL statements have 2s deadlines and the read has an 8s total deadline. No last-good fallback or hidden interpolation.
*/
readonly "getFleetSnapshot": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof GetFleetSnapshotParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<GetFleetSnapshot200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetFleetSnapshot400", GetFleetSnapshot400> | FleetIqApiError<"GetFleetSnapshot401", GetFleetSnapshot401> | FleetIqApiError<"GetFleetSnapshot403", GetFleetSnapshot403> | FleetIqApiError<"GetFleetSnapshot404", GetFleetSnapshot404> | FleetIqApiError<"GetFleetSnapshot500", GetFleetSnapshot500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof GetFleetSnapshotParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<GetFleetSnapshot200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetFleetSnapshot400", GetFleetSnapshot400> | FleetIqApiError<"GetFleetSnapshot401", GetFleetSnapshot401> | FleetIqApiError<"GetFleetSnapshot403", GetFleetSnapshot403> | FleetIqApiError<"GetFleetSnapshot404", GetFleetSnapshot404> | FleetIqApiError<"GetFleetSnapshot500", GetFleetSnapshot500>>;
  }
  /**
* Requires fresh telemetry.read before cursor/scope discovery and again before every emitted data or heartbeat. Uses the durable consistent current projection, not a process-local broadcast buffer. Reconnect cursors bind exact scope and generation/revision; replacements safely coalesce at most 256 forward tenant revisions. Rebuilds, future positions and expired windows terminate with explicit resnapshot. Scope changes need a fresh baseline. There is no historical event replay guarantee, broker or projection write. Browser sessions, identity mappings, actor activation and grants are revalidated, never cached for the connection. Reads have an eight-second deadline; cancellation drops their futures. Connection count is capped at 64 per process and frames/lease/demand are bounded. Already serialized bytes cannot be revoked from network buffers; proxy socket-write/idle deadlines remain deployment responsibilities.
*/
readonly "streamCurrentProperty": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params?: typeof StreamCurrentPropertyParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"StreamCurrentProperty400", StreamCurrentProperty400> | FleetIqApiError<"StreamCurrentProperty401", StreamCurrentProperty401> | FleetIqApiError<"StreamCurrentProperty403", StreamCurrentProperty403> | FleetIqApiError<"StreamCurrentProperty404", StreamCurrentProperty404> | FleetIqApiError<"StreamCurrentProperty429", StreamCurrentProperty429> | FleetIqApiError<"StreamCurrentProperty500", StreamCurrentProperty500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params?: typeof StreamCurrentPropertyParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"StreamCurrentProperty400", StreamCurrentProperty400> | FleetIqApiError<"StreamCurrentProperty401", StreamCurrentProperty401> | FleetIqApiError<"StreamCurrentProperty403", StreamCurrentProperty403> | FleetIqApiError<"StreamCurrentProperty404", StreamCurrentProperty404> | FleetIqApiError<"StreamCurrentProperty429", StreamCurrentProperty429> | FleetIqApiError<"StreamCurrentProperty500", StreamCurrentProperty500>>;
  }
  /**
* Requires fresh telemetry.read before cursor/scope discovery and again before every emitted data or heartbeat. Uses the durable consistent current projection, not a process-local broadcast buffer. Reconnect cursors bind exact scope and generation/revision; replacements safely coalesce at most 256 forward tenant revisions. Rebuilds, future positions and expired windows terminate with explicit resnapshot. Scope changes need a fresh baseline. There is no historical event replay guarantee, broker or projection write. Browser sessions, identity mappings, actor activation and grants are revalidated, never cached for the connection. Reads have an eight-second deadline; cancellation drops their futures. Connection count is capped at 64 per process and frames/lease/demand are bounded. Already serialized bytes cannot be revoked from network buffers; proxy socket-write/idle deadlines remain deployment responsibilities.
*/
readonly "streamCurrentPropertySse": (tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params?: typeof StreamCurrentPropertyParams.Encoded | undefined } | undefined) => Stream.Stream<{ readonly event: string; readonly id: string | undefined; readonly data: StreamCurrentProperty200Sse }, HttpClientError.HttpClientError | SchemaError | Sse.Retry | Sse.SseError, typeof StreamCurrentProperty200Sse.DecodingServices>
  /**
* Requires current telemetry.read before parameter validation and metadata discovery. The exact property version must be installed on the asset (otherwise 404). Empty items is a known property without a materialized value. Current precedence is greatest event time, then full immutable interpretation identity in C byte order, with numeric output/binding revision. Quality is preserved, never filtered into last-good semantics. Corrections create interpretations without implicitly retracting other targets. A repeatable-read view pairs value with tenant generation/revision and committed pending-work indication. Eight-second request and two-second statement deadlines fail safely rather than inventing empty state. Freshness is evaluated at server response time, independently of quality.
*/
readonly "getCurrentPropertySnapshot": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetCurrentPropertySnapshot200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCurrentPropertySnapshot400", GetCurrentPropertySnapshot400> | FleetIqApiError<"GetCurrentPropertySnapshot401", GetCurrentPropertySnapshot401> | FleetIqApiError<"GetCurrentPropertySnapshot403", GetCurrentPropertySnapshot403> | FleetIqApiError<"GetCurrentPropertySnapshot404", GetCurrentPropertySnapshot404> | FleetIqApiError<"GetCurrentPropertySnapshot500", GetCurrentPropertySnapshot500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetCurrentPropertySnapshot200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCurrentPropertySnapshot400", GetCurrentPropertySnapshot400> | FleetIqApiError<"GetCurrentPropertySnapshot401", GetCurrentPropertySnapshot401> | FleetIqApiError<"GetCurrentPropertySnapshot403", GetCurrentPropertySnapshot403> | FleetIqApiError<"GetCurrentPropertySnapshot404", GetCurrentPropertySnapshot404> | FleetIqApiError<"GetCurrentPropertySnapshot500", GetCurrentPropertySnapshot500>>;
  }
  /**
* Requires exact telemetry.read. Returns all interpretations for one pinned property in a half-open event-time window of at most seven days. Ascending event time then full interpretation key provides stable ties, not latest-state precedence. Pages are not a snapshot: restart the window to observe late appends behind the cursor. No raw payload, archival history, correction collapse or implicit unit conversion.
*/
readonly "listPropertyHistory": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListPropertyHistoryParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListPropertyHistory200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListPropertyHistory400", ListPropertyHistory400> | FleetIqApiError<"ListPropertyHistory401", ListPropertyHistory401> | FleetIqApiError<"ListPropertyHistory403", ListPropertyHistory403> | FleetIqApiError<"ListPropertyHistory500", ListPropertyHistory500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListPropertyHistoryParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListPropertyHistory200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListPropertyHistory400", ListPropertyHistory400> | FleetIqApiError<"ListPropertyHistory401", ListPropertyHistory401> | FleetIqApiError<"ListPropertyHistory403", ListPropertyHistory403> | FleetIqApiError<"ListPropertyHistory500", ListPropertyHistory500>>;
  }
  /**
* Requires exact telemetry.read. Reads original source, binding revision, exact property version and first-append resolution cutoffs. Corrections do not rewrite this fact. Another tenant/target or absent interpretation yields no provenance; no fallback to current metadata.
*/
readonly "getPropertyInterpretation": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, interpretation: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetPropertyInterpretation200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyInterpretation400", GetPropertyInterpretation400> | FleetIqApiError<"GetPropertyInterpretation401", GetPropertyInterpretation401> | FleetIqApiError<"GetPropertyInterpretation403", GetPropertyInterpretation403> | FleetIqApiError<"GetPropertyInterpretation404", GetPropertyInterpretation404> | FleetIqApiError<"GetPropertyInterpretation500", GetPropertyInterpretation500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, interpretation: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetPropertyInterpretation200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyInterpretation400", GetPropertyInterpretation400> | FleetIqApiError<"GetPropertyInterpretation401", GetPropertyInterpretation401> | FleetIqApiError<"GetPropertyInterpretation403", GetPropertyInterpretation403> | FleetIqApiError<"GetPropertyInterpretation404", GetPropertyInterpretation404> | FleetIqApiError<"GetPropertyInterpretation500", GetPropertyInterpretation500>>;
  }
  /**
* Returns only active tenants with explicit current grants for the authenticated active actor. Actions are advisory UI hints, never authorization evidence; every operation rechecks policy. Platform grants imply no tenant access. Order is ascending tenant ID. Pages observe fresh policy independently, without cross-request snapshot guarantees. Missing or inactive browser identities return 401; no grants returns an empty 200 page. Available only with configured browser or workload authentication.
*/
readonly "listOperatorTenants": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params?: typeof ListOperatorTenantsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListOperatorTenants200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListOperatorTenants400", ListOperatorTenants400> | FleetIqApiError<"ListOperatorTenants401", ListOperatorTenants401> | FleetIqApiError<"ListOperatorTenants500", ListOperatorTenants500>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params?: typeof ListOperatorTenantsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListOperatorTenants200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListOperatorTenants400", ListOperatorTenants400> | FleetIqApiError<"ListOperatorTenants401", ListOperatorTenants401> | FleetIqApiError<"ListOperatorTenants500", ListOperatorTenants500>>;
  }
  /**
* Discover the active API major version
*/
readonly "getApiVersion": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetApiVersion200, Config>, HttpClientError.HttpClientError | SchemaError>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetApiVersion200, Config | undefined>, HttpClientError.HttpClientError | SchemaError>;
  }
  /**
* The authenticated operator or configured workload identity must have current metadata.read access for the selected tenant. The route is absent without complete browser or workload identity configuration. A cursor traversal is not a cross-request snapshot.
*/
readonly "listAssets": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAssets200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssets400", ListAssets400> | FleetIqApiError<"ListAssets401", ListAssets401> | FleetIqApiError<"ListAssets403", ListAssets403> | FleetIqApiError<"ListAssets500", ListAssets500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListAssets200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssets400", ListAssets400> | FleetIqApiError<"ListAssets401", ListAssets401> | FleetIqApiError<"ListAssets403", ListAssets403> | FleetIqApiError<"ListAssets500", ListAssets500>>;
  }
  /**
* Only mounted on an authenticated listener. Requires exact current metadata.manage for the selected active tenant; no other action implies it. Authenticate and authorize before reporting body/resource errors. Invalid, missing, suspended or inaccessible tenant returns 403. Browser mutations require one exact configured Origin and X-FleetIQ-CSRF: 1; browser mode never falls back to bearer. JSON is limited to 32 KiB with closed nested shapes; unknown and duplicate fields are rejected. Return 201 registered for first creation, 200 already_registered for equal complete content and original registration evidence. Retry the same internal identity and complete content after a lost or ambiguous response; a storage/commit error is never success. Different content or an external-identity collision returns 409 without overwrite. Actor/time are trusted host context, never JSON. Different authorized actors may retry; attribution stays with the first. Existing unattributed strict inserts return 409; no historical provenance is invented. All outcomes are no-store and redact database details. The exact asset-type version must exist in this tenant. Up to 100 external identifiers; omitted authority means null. Kind/authority/value defines each external namespace; identifier declaration order is irrelevant. Duplicate identifiers are invalid. IMEI/serial values never replace internal asset identity.
*/
readonly "registerAsset": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof RegisterAssetParams.Encoded | undefined; readonly payload: typeof RegisterAssetRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<RegisterAsset200 | RegisterAsset201, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RegisterAsset400", RegisterAsset400> | FleetIqApiError<"RegisterAsset401", RegisterAsset401> | FleetIqApiError<"RegisterAsset403", RegisterAsset403> | FleetIqApiError<"RegisterAsset404", RegisterAsset404> | FleetIqApiError<"RegisterAsset405", RegisterAsset405> | FleetIqApiError<"RegisterAsset409", RegisterAsset409> | FleetIqApiError<"RegisterAsset500", RegisterAsset500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof RegisterAssetParams.Encoded | undefined; readonly payload: typeof RegisterAssetRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<RegisterAsset200 | RegisterAsset201, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RegisterAsset400", RegisterAsset400> | FleetIqApiError<"RegisterAsset401", RegisterAsset401> | FleetIqApiError<"RegisterAsset403", RegisterAsset403> | FleetIqApiError<"RegisterAsset404", RegisterAsset404> | FleetIqApiError<"RegisterAsset405", RegisterAsset405> | FleetIqApiError<"RegisterAsset409", RegisterAsset409> | FleetIqApiError<"RegisterAsset500", RegisterAsset500>>;
  }
  /**
* Returns asset identity, its exact pinned asset-type version, and tenant-owned typed external identifiers. A missing asset returns 404.
*/
readonly "getAsset": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetAsset200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAsset400", GetAsset400> | FleetIqApiError<"GetAsset401", GetAsset401> | FleetIqApiError<"GetAsset403", GetAsset403> | FleetIqApiError<"GetAsset404", GetAsset404> | FleetIqApiError<"GetAsset500", GetAsset500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetAsset200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAsset400", GetAsset400> | FleetIqApiError<"GetAsset401", GetAsset401> | FleetIqApiError<"GetAsset403", GetAsset403> | FleetIqApiError<"GetAsset404", GetAsset404> | FleetIqApiError<"GetAsset500", GetAsset500>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. Both directed source and target roles are returned. The asset must exist in the current catalogue; only edges are bitemporal.
*/
readonly "listAssetRelationships": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetRelationshipsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAssetRelationships200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetRelationships400", ListAssetRelationships400> | FleetIqApiError<"ListAssetRelationships401", ListAssetRelationships401> | FleetIqApiError<"ListAssetRelationships403", ListAssetRelationships403> | FleetIqApiError<"ListAssetRelationships404", ListAssetRelationships404> | FleetIqApiError<"ListAssetRelationships500", ListAssetRelationships500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetRelationshipsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListAssetRelationships200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetRelationships400", ListAssetRelationships400> | FleetIqApiError<"ListAssetRelationships401", ListAssetRelationships401> | FleetIqApiError<"ListAssetRelationships403", ListAssetRelationships403> | FleetIqApiError<"ListAssetRelationships404", ListAssetRelationships404> | FleetIqApiError<"ListAssetRelationships500", ListAssetRelationships500>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. The selected latest-known binding revision must target this asset. The asset must exist in the current catalogue.
*/
readonly "listAssetSignalBindings": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetSignalBindingsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAssetSignalBindings200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetSignalBindings400", ListAssetSignalBindings400> | FleetIqApiError<"ListAssetSignalBindings401", ListAssetSignalBindings401> | FleetIqApiError<"ListAssetSignalBindings403", ListAssetSignalBindings403> | FleetIqApiError<"ListAssetSignalBindings404", ListAssetSignalBindings404> | FleetIqApiError<"ListAssetSignalBindings500", ListAssetSignalBindings500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params: typeof ListAssetSignalBindingsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListAssetSignalBindings200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetSignalBindings400", ListAssetSignalBindings400> | FleetIqApiError<"ListAssetSignalBindings401", ListAssetSignalBindings401> | FleetIqApiError<"ListAssetSignalBindings403", ListAssetSignalBindings403> | FleetIqApiError<"ListAssetSignalBindings404", ListAssetSignalBindings404> | FleetIqApiError<"ListAssetSignalBindings500", ListAssetSignalBindings500>>;
  }
  /**
* The latest revision known at known_at_ms is selected, then tested at effective_at_ms. Results are bounded pages ordered by stable ID. A cursor traversal is not a cross-request database snapshot; repeat the same times and limit on the next page. The exact device asset, endpoint, and signal tuple selects a source; an unregistered signal can validly return an empty page.
*/
readonly "listSourceSignalBindings": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof ListSourceSignalBindingsParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListSourceSignalBindings200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListSourceSignalBindings400", ListSourceSignalBindings400> | FleetIqApiError<"ListSourceSignalBindings401", ListSourceSignalBindings401> | FleetIqApiError<"ListSourceSignalBindings403", ListSourceSignalBindings403> | FleetIqApiError<"ListSourceSignalBindings500", ListSourceSignalBindings500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params: typeof ListSourceSignalBindingsParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListSourceSignalBindings200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListSourceSignalBindings400", ListSourceSignalBindings400> | FleetIqApiError<"ListSourceSignalBindings401", ListSourceSignalBindings401> | FleetIqApiError<"ListSourceSignalBindings403", ListSourceSignalBindings403> | FleetIqApiError<"ListSourceSignalBindings500", ListSourceSignalBindings500>>;
  }
  /**
* Read an exact immutable type version. Property references retain definition order and point to exact immutable versions.
*/
readonly "getAssetTypeDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetAssetTypeDefinition200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAssetTypeDefinition400", GetAssetTypeDefinition400> | FleetIqApiError<"GetAssetTypeDefinition401", GetAssetTypeDefinition401> | FleetIqApiError<"GetAssetTypeDefinition403", GetAssetTypeDefinition403> | FleetIqApiError<"GetAssetTypeDefinition404", GetAssetTypeDefinition404> | FleetIqApiError<"GetAssetTypeDefinition500", GetAssetTypeDefinition500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetAssetTypeDefinition200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAssetTypeDefinition400", GetAssetTypeDefinition400> | FleetIqApiError<"GetAssetTypeDefinition401", GetAssetTypeDefinition401> | FleetIqApiError<"GetAssetTypeDefinition403", GetAssetTypeDefinition403> | FleetIqApiError<"GetAssetTypeDefinition404", GetAssetTypeDefinition404> | FleetIqApiError<"GetAssetTypeDefinition500", GetAssetTypeDefinition500>>;
  }
  /**
* Read the exact value kind and optional canonical unit; this endpoint performs no measurement conversion.
*/
readonly "getPropertyDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, propertyId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetPropertyDefinition200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyDefinition400", GetPropertyDefinition400> | FleetIqApiError<"GetPropertyDefinition401", GetPropertyDefinition401> | FleetIqApiError<"GetPropertyDefinition403", GetPropertyDefinition403> | FleetIqApiError<"GetPropertyDefinition404", GetPropertyDefinition404> | FleetIqApiError<"GetPropertyDefinition500", GetPropertyDefinition500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, propertyId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetPropertyDefinition200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyDefinition400", GetPropertyDefinition400> | FleetIqApiError<"GetPropertyDefinition401", GetPropertyDefinition401> | FleetIqApiError<"GetPropertyDefinition403", GetPropertyDefinition403> | FleetIqApiError<"GetPropertyDefinition404", GetPropertyDefinition404> | FleetIqApiError<"GetPropertyDefinition500", GetPropertyDefinition500>>;
  }
  /**
* Returns the stable name of the exact immutable directed relationship type version.
*/
readonly "getRelationshipTypeDefinition": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetRelationshipTypeDefinition200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetRelationshipTypeDefinition400", GetRelationshipTypeDefinition400> | FleetIqApiError<"GetRelationshipTypeDefinition401", GetRelationshipTypeDefinition401> | FleetIqApiError<"GetRelationshipTypeDefinition403", GetRelationshipTypeDefinition403> | FleetIqApiError<"GetRelationshipTypeDefinition404", GetRelationshipTypeDefinition404> | FleetIqApiError<"GetRelationshipTypeDefinition500", GetRelationshipTypeDefinition500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, typeId: string, version: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetRelationshipTypeDefinition200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetRelationshipTypeDefinition400", GetRelationshipTypeDefinition400> | FleetIqApiError<"GetRelationshipTypeDefinition401", GetRelationshipTypeDefinition401> | FleetIqApiError<"GetRelationshipTypeDefinition403", GetRelationshipTypeDefinition403> | FleetIqApiError<"GetRelationshipTypeDefinition404", GetRelationshipTypeDefinition404> | FleetIqApiError<"GetRelationshipTypeDefinition500", GetRelationshipTypeDefinition500>>;
  }
  /**
* Creates a short-lived bound OIDC authorization-code attempt. Browser identity must be configured. No request-selected issuer, client, callback, or return URL is supported.
*/
readonly "beginOperatorLogin": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"BeginOperatorLogin401", BeginOperatorLogin401> | FleetIqApiError<"BeginOperatorLogin405", BeginOperatorLogin405> | FleetIqApiError<"BeginOperatorLogin500", BeginOperatorLogin500>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"BeginOperatorLogin401", BeginOperatorLogin401> | FleetIqApiError<"BeginOperatorLogin405", BeginOperatorLogin405> | FleetIqApiError<"BeginOperatorLogin500", BeginOperatorLogin500>>;
  }
  /**
* Requires __Host-fleetiq-login from the initiating browser. Atomically consumes the matching state once before code exchange, validates signed provider identity and resolves a provisioned active actor. Provider roles or email never provision access.
*/
readonly "completeOperatorLogin": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof CompleteOperatorLoginParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CompleteOperatorLogin400", CompleteOperatorLogin400> | FleetIqApiError<"CompleteOperatorLogin401", CompleteOperatorLogin401> | FleetIqApiError<"CompleteOperatorLogin405", CompleteOperatorLogin405> | FleetIqApiError<"CompleteOperatorLogin500", CompleteOperatorLogin500>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof CompleteOperatorLoginParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CompleteOperatorLogin400", CompleteOperatorLogin400> | FleetIqApiError<"CompleteOperatorLogin401", CompleteOperatorLogin401> | FleetIqApiError<"CompleteOperatorLogin405", CompleteOperatorLogin405> | FleetIqApiError<"CompleteOperatorLogin500", CompleteOperatorLogin500>>;
  }
  /**
* Revalidates session expiry and the current external-identity mapping to the actor established at login. Returns no provider claims, tokens, or tenant grants.
*/
readonly "getOperatorSession": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetOperatorSession200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetOperatorSession401", GetOperatorSession401> | FleetIqApiError<"GetOperatorSession405", GetOperatorSession405> | FleetIqApiError<"GetOperatorSession500", GetOperatorSession500>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetOperatorSession200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetOperatorSession401", GetOperatorSession401> | FleetIqApiError<"GetOperatorSession405", GetOperatorSession405> | FleetIqApiError<"GetOperatorSession500", GetOperatorSession500>>;
  }
  /**
* Requires exact configured Origin and X-FleetIQ-CSRF: 1. Deletes the stored session and browser-bound pending login attempts, then clears cookies; success is idempotent when no session is present. Existing in-flight reads may complete.
*/
readonly "endOperatorSession": {
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof EndOperatorSessionParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<void, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"EndOperatorSession401", EndOperatorSession401> | FleetIqApiError<"EndOperatorSession403", EndOperatorSession403> | FleetIqApiError<"EndOperatorSession405", EndOperatorSession405> | FleetIqApiError<"EndOperatorSession500", EndOperatorSession500>>;
    <Config extends OperationConfig | undefined = undefined>(options: { readonly params: typeof EndOperatorSessionParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<void, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"EndOperatorSession401", EndOperatorSession401> | FleetIqApiError<"EndOperatorSession403", EndOperatorSession403> | FleetIqApiError<"EndOperatorSession405", EndOperatorSession405> | FleetIqApiError<"EndOperatorSession500", EndOperatorSession500>>;
  }
  /**
* Requires exact current metadata.read for the selected tenant through the existing listener-selected identity boundary. Returns the existing ordered endpoint representation. No registration or history mutation is performed. Returns 404 if the selected asset has no communication capability. Every outcome is no-store.
*/
readonly "getCommunicationDevice": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetCommunicationDevice200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCommunicationDevice400", GetCommunicationDevice400> | FleetIqApiError<"GetCommunicationDevice401", GetCommunicationDevice401> | FleetIqApiError<"GetCommunicationDevice403", GetCommunicationDevice403> | FleetIqApiError<"GetCommunicationDevice404", GetCommunicationDevice404> | FleetIqApiError<"GetCommunicationDevice405", GetCommunicationDevice405> | FleetIqApiError<"GetCommunicationDevice500", GetCommunicationDevice500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetCommunicationDevice200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCommunicationDevice400", GetCommunicationDevice400> | FleetIqApiError<"GetCommunicationDevice401", GetCommunicationDevice401> | FleetIqApiError<"GetCommunicationDevice403", GetCommunicationDevice403> | FleetIqApiError<"GetCommunicationDevice404", GetCommunicationDevice404> | FleetIqApiError<"GetCommunicationDevice405", GetCommunicationDevice405> | FleetIqApiError<"GetCommunicationDevice500", GetCommunicationDevice500>>;
  }
  /**
* Only mounted on an authenticated listener. Requires exact current metadata.manage for the selected active tenant; no other action implies it. Authenticate and authorize before reporting body/resource errors. Invalid, missing, suspended or inaccessible tenant returns 403. Browser mutations require one exact configured Origin and X-FleetIQ-CSRF: 1; browser mode never falls back to bearer. JSON is limited to 32 KiB with closed nested shapes; unknown and duplicate fields are rejected. Return 201 registered for first creation, 200 already_registered for equal complete content and original registration evidence. Retry the same internal identity and complete content after a lost or ambiguous response; a storage/commit error is never success. Different content or an external-identity collision returns 409 without overwrite. Actor/time are trusted host context, never JSON. Different authorized actors may retry; attribution stays with the first. Existing unattributed strict inserts return 409; no historical provenance is invented. All outcomes are no-store and redact database details. The route asset must already exist in this tenant. Up to 100 endpoints, including an empty declaration. Duplicate endpoint IDs are invalid; complete endpoint ID, kind, name and declaration order participate in retry equality. No protocol activation or semantic binding is performed.
*/
readonly "registerCommunicationDevice": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params?: typeof RegisterCommunicationDeviceParams.Encoded | undefined; readonly payload: typeof RegisterCommunicationDeviceRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<RegisterCommunicationDevice200 | RegisterCommunicationDevice201, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RegisterCommunicationDevice400", RegisterCommunicationDevice400> | FleetIqApiError<"RegisterCommunicationDevice401", RegisterCommunicationDevice401> | FleetIqApiError<"RegisterCommunicationDevice403", RegisterCommunicationDevice403> | FleetIqApiError<"RegisterCommunicationDevice404", RegisterCommunicationDevice404> | FleetIqApiError<"RegisterCommunicationDevice405", RegisterCommunicationDevice405> | FleetIqApiError<"RegisterCommunicationDevice409", RegisterCommunicationDevice409> | FleetIqApiError<"RegisterCommunicationDevice500", RegisterCommunicationDevice500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly params?: typeof RegisterCommunicationDeviceParams.Encoded | undefined; readonly payload: typeof RegisterCommunicationDeviceRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<RegisterCommunicationDevice200 | RegisterCommunicationDevice201, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RegisterCommunicationDevice400", RegisterCommunicationDevice400> | FleetIqApiError<"RegisterCommunicationDevice401", RegisterCommunicationDevice401> | FleetIqApiError<"RegisterCommunicationDevice403", RegisterCommunicationDevice403> | FleetIqApiError<"RegisterCommunicationDevice404", RegisterCommunicationDevice404> | FleetIqApiError<"RegisterCommunicationDevice405", RegisterCommunicationDevice405> | FleetIqApiError<"RegisterCommunicationDevice409", RegisterCommunicationDevice409> | FleetIqApiError<"RegisterCommunicationDevice500", RegisterCommunicationDevice500>>;
  }
  /**
* Only mounted on an authenticated listener. Authenticate and authorize the tenant before reporting command, identity or query errors. An invalid, missing, suspended or inaccessible tenant returns 403. Every outcome is no-store and problems redact credentials and database details. Requires exact current metadata.read; metadata.manage and access.manage do not imply read access. Limit 1..100, default 50. Unknown and duplicate query fields are invalid. Both after_id and after_version are required together. Numeric versions sort numerically within case-sensitive IDs. Cursors are exclusive traversal positions, not snapshots or authority. New versions may be published during traversal; no latest-version alias or distinct-definition total is implied.
*/
readonly "listAssetTypeDefinitions": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetTypeDefinitionsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAssetTypeDefinitions200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetTypeDefinitions400", ListAssetTypeDefinitions400> | FleetIqApiError<"ListAssetTypeDefinitions401", ListAssetTypeDefinitions401> | FleetIqApiError<"ListAssetTypeDefinitions403", ListAssetTypeDefinitions403> | FleetIqApiError<"ListAssetTypeDefinitions405", ListAssetTypeDefinitions405> | FleetIqApiError<"ListAssetTypeDefinitions500", ListAssetTypeDefinitions500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAssetTypeDefinitionsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListAssetTypeDefinitions200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAssetTypeDefinitions400", ListAssetTypeDefinitions400> | FleetIqApiError<"ListAssetTypeDefinitions401", ListAssetTypeDefinitions401> | FleetIqApiError<"ListAssetTypeDefinitions403", ListAssetTypeDefinitions403> | FleetIqApiError<"ListAssetTypeDefinitions405", ListAssetTypeDefinitions405> | FleetIqApiError<"ListAssetTypeDefinitions500", ListAssetTypeDefinitions500>>;
  }
  /**
* Requires current tenant protocol.manage. Includes explicit retirement; configuration is not runtime eligibility or peer authentication. All outcomes are no-store.
*/
readonly "getDeviceProtocolRoute": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, channelId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetDeviceProtocolRoute200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetDeviceProtocolRoute400", GetDeviceProtocolRoute400> | FleetIqApiError<"GetDeviceProtocolRoute401", GetDeviceProtocolRoute401> | FleetIqApiError<"GetDeviceProtocolRoute403", GetDeviceProtocolRoute403> | FleetIqApiError<"GetDeviceProtocolRoute404", GetDeviceProtocolRoute404> | FleetIqApiError<"GetDeviceProtocolRoute500", GetDeviceProtocolRoute500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, channelId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetDeviceProtocolRoute200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetDeviceProtocolRoute400", GetDeviceProtocolRoute400> | FleetIqApiError<"GetDeviceProtocolRoute401", GetDeviceProtocolRoute401> | FleetIqApiError<"GetDeviceProtocolRoute403", GetDeviceProtocolRoute403> | FleetIqApiError<"GetDeviceProtocolRoute404", GetDeviceProtocolRoute404> | FleetIqApiError<"GetDeviceProtocolRoute500", GetDeviceProtocolRoute500>>;
  }
  /**
* Requires current tenant protocol.manage, a registered communication device and exact stored/current-policy admitted release. Body limit is 4 KiB. expected_revision is a compare-and-swap generation; explicit null selection retires. Same-actor/content retries return the original generation/actor/time even after later edits, without replacing the current head; GET current configuration before further editing. new generations invalidate previous session handoffs even when selecting identical content. Invalid/missing prerequisites return 409; no implicit device creation or artifact activation occurs. Browser commands require exact Origin and X-FleetIQ-CSRF marker. Authentication and authorization precede request diagnostics. All outcomes are no-store.
*/
readonly "changeDeviceProtocolRoute": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, channelId: string, options: { readonly params?: typeof ChangeDeviceProtocolRouteParams.Encoded | undefined; readonly payload: typeof ChangeDeviceProtocolRouteRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ChangeDeviceProtocolRoute200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ChangeDeviceProtocolRoute400", ChangeDeviceProtocolRoute400> | FleetIqApiError<"ChangeDeviceProtocolRoute401", ChangeDeviceProtocolRoute401> | FleetIqApiError<"ChangeDeviceProtocolRoute403", ChangeDeviceProtocolRoute403> | FleetIqApiError<"ChangeDeviceProtocolRoute409", ChangeDeviceProtocolRoute409> | FleetIqApiError<"ChangeDeviceProtocolRoute500", ChangeDeviceProtocolRoute500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, channelId: string, options: { readonly params?: typeof ChangeDeviceProtocolRouteParams.Encoded | undefined; readonly payload: typeof ChangeDeviceProtocolRouteRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ChangeDeviceProtocolRoute200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ChangeDeviceProtocolRoute400", ChangeDeviceProtocolRoute400> | FleetIqApiError<"ChangeDeviceProtocolRoute401", ChangeDeviceProtocolRoute401> | FleetIqApiError<"ChangeDeviceProtocolRoute403", ChangeDeviceProtocolRoute403> | FleetIqApiError<"ChangeDeviceProtocolRoute409", ChangeDeviceProtocolRoute409> | FleetIqApiError<"ChangeDeviceProtocolRoute500", ChangeDeviceProtocolRoute500>>;
  }
  /**
* Returns immutable catalogue identity only when exact bytes are durably stored. Raw bytes are never returned. All outcomes are no-store. Authentication/current tenant protocol.manage precedes resource/body diagnostics. Invalid or inaccessible tenants return 403; metadata.manage does not imply code admission.
*/
readonly "getProtocolPackageRelease": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, packageId: string, packageVersion: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetProtocolPackageRelease200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetProtocolPackageRelease400", GetProtocolPackageRelease400> | FleetIqApiError<"GetProtocolPackageRelease401", GetProtocolPackageRelease401> | FleetIqApiError<"GetProtocolPackageRelease403", GetProtocolPackageRelease403> | FleetIqApiError<"GetProtocolPackageRelease404", GetProtocolPackageRelease404> | FleetIqApiError<"GetProtocolPackageRelease500", GetProtocolPackageRelease500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, packageId: string, packageVersion: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetProtocolPackageRelease200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetProtocolPackageRelease400", GetProtocolPackageRelease400> | FleetIqApiError<"GetProtocolPackageRelease401", GetProtocolPackageRelease401> | FleetIqApiError<"GetProtocolPackageRelease403", GetProtocolPackageRelease403> | FleetIqApiError<"GetProtocolPackageRelease404", GetProtocolPackageRelease404> | FleetIqApiError<"GetProtocolPackageRelease500", GetProtocolPackageRelease500>>;
  }
  /**
* Requires current tenant protocol.manage. Uses a consistent database snapshot, at most 64 recent accepted messages and the first 64 decoded outputs per message, then at most 128 distinct source tuples. Coverage flags explicitly describe each truncation. Package references identify the immutable decoder, not current admission or activation; use package/route endpoints for configuration. No raw payload, checkpoint state, telemetry values, external identifiers or credentials are returned. No process/socket heartbeat is collected: worker and connection liveness are explicitly not_observed. Receipt age and pending/leased/expired/poisoned states are operational evidence, not a device-health inference. All outcomes are no-store.
*/
readonly "getDeviceIngestionDiagnostics": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetDeviceIngestionDiagnostics200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetDeviceIngestionDiagnostics400", GetDeviceIngestionDiagnostics400> | FleetIqApiError<"GetDeviceIngestionDiagnostics401", GetDeviceIngestionDiagnostics401> | FleetIqApiError<"GetDeviceIngestionDiagnostics403", GetDeviceIngestionDiagnostics403> | FleetIqApiError<"GetDeviceIngestionDiagnostics404", GetDeviceIngestionDiagnostics404> | FleetIqApiError<"GetDeviceIngestionDiagnostics500", GetDeviceIngestionDiagnostics500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetDeviceIngestionDiagnostics200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetDeviceIngestionDiagnostics400", GetDeviceIngestionDiagnostics400> | FleetIqApiError<"GetDeviceIngestionDiagnostics401", GetDeviceIngestionDiagnostics401> | FleetIqApiError<"GetDeviceIngestionDiagnostics403", GetDeviceIngestionDiagnostics403> | FleetIqApiError<"GetDeviceIngestionDiagnostics404", GetDeviceIngestionDiagnostics404> | FleetIqApiError<"GetDeviceIngestionDiagnostics500", GetDeviceIngestionDiagnostics500>>;
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
