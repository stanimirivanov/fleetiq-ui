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
export type BrowserPrimitiveConstraint1 = string
export const BrowserPrimitiveConstraint1 = Schema.String.annotate({ "identifier": "BrowserPrimitiveConstraint1" })
export type HistoryRestoreId = string
export const HistoryRestoreId = Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]{0,18}$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]{0,18}$", "identifier": "HistoryRestoreId" }))
export type AdministrationIdentifier = string
export const AdministrationIdentifier = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "u")).annotate({ "expected": "a string matching the RegExp ^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "identifier": "AdministrationIdentifier" }))
export type BrowserPrimitiveConstraint4 = number
export const BrowserPrimitiveConstraint4 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295", "identifier": "BrowserPrimitiveConstraint4" }))
export type HistoryMillis = string
export const HistoryMillis = Schema.String.check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)$", "identifier": "HistoryMillis" }))
export type ExportId = string
export const ExportId = Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$", "identifier": "ExportId" }))
export type ExportCoverage = { readonly "scope": "hot_snapshot" | "hot_and_selected_manifest_snapshot", readonly "manifest_id": string | null, readonly "restore_generation": string | null }
export const ExportCoverage = Schema.Struct({ "scope": Schema.Literals(["hot_snapshot", "hot_and_selected_manifest_snapshot"]), "manifest_id": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), Schema.Null]), "restore_generation": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), Schema.Null]) }).annotate({ "identifier": "ExportCoverage" })
export type BrowserPrimitiveConstraint5 = string
export const BrowserPrimitiveConstraint5 = Schema.String.check(Schema.isMaxCodePoints(9).annotate({ "expected": "a string with at most 9 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]{0,8}$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]{0,8}$", "identifier": "BrowserPrimitiveConstraint5" }))
export type BrowserPrimitiveConstraint24 = number
export const BrowserPrimitiveConstraint24 = Schema.Number.annotate({ "default": 64 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(64).annotate({ "expected": "a value less than or equal to 64", "identifier": "BrowserPrimitiveConstraint24" }))
export type HistoryToken = string
export const HistoryToken = Schema.String.check(Schema.isMaxCodePoints(8192).annotate({ "expected": "a string with at most 8192 code points" })).check(Schema.isPattern(new RegExp("^v1\\.[0-9a-f]+$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.[0-9a-f]+$", "identifier": "HistoryToken" }))
export type NumericSummaryCoverage = { readonly "scope": "hot_snapshot" | "hot_and_selected_manifest_snapshot", readonly "manifest_id": string | null, readonly "restore_generation": string | null }
export const NumericSummaryCoverage = Schema.Struct({ "scope": Schema.Literals(["hot_snapshot", "hot_and_selected_manifest_snapshot"]), "manifest_id": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), Schema.Null]), "restore_generation": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), Schema.Null]) }).annotate({ "identifier": "NumericSummaryCoverage" })
export type BrowserPrimitiveConstraint6 = number
export const BrowserPrimitiveConstraint6 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100", "identifier": "BrowserPrimitiveConstraint6" }))
export type BrowserPrimitiveConstraint7 = number
export const BrowserPrimitiveConstraint7 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(64).annotate({ "expected": "a value less than or equal to 64", "identifier": "BrowserPrimitiveConstraint7" }))
export type WorkKind = "replay" | "calculator" | "alert_evaluation" | "notification"
export const WorkKind = Schema.Literals(["replay", "calculator", "alert_evaluation", "notification"]).annotate({ "identifier": "WorkKind" })
export type WorkGeneration = string
export const WorkGeneration = Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^(0|[1-9][0-9]*)$", "identifier": "WorkGeneration" }))
export type BrowserPrimitiveConstraint9 = string
export const BrowserPrimitiveConstraint9 = Schema.String.check(Schema.isPattern(new RegExp("^[a-f0-9]{64}$", "u")).annotate({ "expected": "a string matching the RegExp ^[a-f0-9]{64}$", "identifier": "BrowserPrimitiveConstraint9" }))
export type AlertLifecycleVersion = string
export const AlertLifecycleVersion = Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$", "identifier": "AlertLifecycleVersion" }))
export type BrowserPrimitiveConstraint10 = number
export const BrowserPrimitiveConstraint10 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295", "identifier": "BrowserPrimitiveConstraint10" }))
export type BrowserPrimitiveConstraint11 = number
export const BrowserPrimitiveConstraint11 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(1023).annotate({ "expected": "a value less than or equal to 1023", "identifier": "BrowserPrimitiveConstraint11" }))
export type BrowserPrimitiveConstraint12 = number
export const BrowserPrimitiveConstraint12 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(604800000).annotate({ "expected": "a value less than or equal to 604800000", "identifier": "BrowserPrimitiveConstraint12" }))
export type AlertPhase = "inactive" | "pending" | "firing" | "resolved"
export const AlertPhase = Schema.Literals(["inactive", "pending", "firing", "resolved"]).annotate({ "identifier": "AlertPhase" })
export type BrowserPrimitiveConstraint25 = number
export const BrowserPrimitiveConstraint25 = Schema.Number.annotate({ "default": 50 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(100).annotate({ "expected": "a value less than or equal to 100", "identifier": "BrowserPrimitiveConstraint25" }))
export type AlertReadCursor = string
export const AlertReadCursor = Schema.String.check(Schema.isMaxCodePoints(8192).annotate({ "expected": "a string with at most 8192 code points" })).check(Schema.isPattern(new RegExp("^v1\\.(?:[0-9a-f]{2})+$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.(?:[0-9a-f]{2})+$", "identifier": "AlertReadCursor" }))
export type BrowserPrimitiveConstraint14 = number
export const BrowserPrimitiveConstraint14 = Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(1024).annotate({ "expected": "a value less than or equal to 1024", "identifier": "BrowserPrimitiveConstraint14" }))
export type BrowserPrimitiveConstraint26 = number
export const BrowserPrimitiveConstraint26 = Schema.Number.annotate({ "default": 20 }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(20).annotate({ "expected": "a value less than or equal to 20", "identifier": "BrowserPrimitiveConstraint26" }))
export type CalculatorEvidenceCursor = string
export const CalculatorEvidenceCursor = Schema.String.check(Schema.isMaxCodePoints(8192).annotate({ "expected": "a string with at most 8192 code points" })).check(Schema.isPattern(new RegExp("^v1\\.(?:[0-9a-f]{2})+$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.(?:[0-9a-f]{2})+$", "identifier": "CalculatorEvidenceCursor" }))
export type BrowserPrimitiveConstraint15 = string
export const BrowserPrimitiveConstraint15 = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(4096).annotate({ "expected": "a string with at most 4096 code points", "identifier": "BrowserPrimitiveConstraint15" }))
export type BrowserPrimitiveConstraint16 = string
export const BrowserPrimitiveConstraint16 = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points", "identifier": "BrowserPrimitiveConstraint16" }))
export type BrowserPrimitiveConstraint17 = string
export const BrowserPrimitiveConstraint17 = Schema.String.check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$", "identifier": "BrowserPrimitiveConstraint17" }))
export type BrowserPrimitiveConstraint18 = number
export const BrowserPrimitiveConstraint18 = Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer", "identifier": "BrowserPrimitiveConstraint18" }))
export type BrowserPrimitiveConstraint19 = string
export const BrowserPrimitiveConstraint19 = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })).check(Schema.isPattern(new RegExp("^[^\\s]+$", "u")).annotate({ "expected": "a string matching the RegExp ^[^\\s]+$", "identifier": "BrowserPrimitiveConstraint19" }))
export type SemanticDefinitionName = string
export const SemanticDefinitionName = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(200).annotate({ "expected": "a string with at most 200 code points" })).check(Schema.isPattern(new RegExp("^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "u")).annotate({ "expected": "a string matching the RegExp ^(?!\\s)(?![\\s\\S]*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F]+$", "identifier": "SemanticDefinitionName" }))
export type ProjectionCounter = string
export const ProjectionCounter = Schema.String.check(Schema.isMaxCodePoints(19).annotate({ "expected": "a string with at most 19 code points" })).check(Schema.isPattern(new RegExp("^(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^(0|[1-9][0-9]*)$", "identifier": "ProjectionCounter" }))
export type BrowserPrimitiveConstraint3 = string
export const BrowserPrimitiveConstraint3 = Schema.String.check(Schema.isMaxCodePoints(20).annotate({ "expected": "a string with at most 20 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)$", "identifier": "BrowserPrimitiveConstraint3" }))
export type BrowserPrimitiveConstraint28 = string
export const BrowserPrimitiveConstraint28 = Schema.String.check(Schema.isMaxCodePoints(110).annotate({ "expected": "a string with at most 110 code points" })).check(Schema.isPattern(new RegExp("^v1\\.[a-f0-9]{64}\\.(0|[1-9][0-9]{0,18})\\.(0|[1-9][0-9]{0,18})$", "u")).annotate({ "expected": "a string matching the RegExp ^v1\\.[a-f0-9]{64}\\.(0|[1-9][0-9]{0,18})\\.(0|[1-9][0-9]{0,18})$", "identifier": "BrowserPrimitiveConstraint28" }))
export type PropertyLiveStream = string
export const PropertyLiveStream = Schema.String.annotate({ "identifier": "PropertyLiveStream" })
export type TenantAction = "alerts.read" | "alerts.manage" | "analytics.manage" | "access.manage" | "metadata.manage" | "metadata.read" | "protocol.manage" | "telemetry.read" | "alerts.acknowledge" | "operations.read" | "operations.manage"
export const TenantAction = Schema.Literals(["alerts.read", "alerts.manage", "analytics.manage", "access.manage", "metadata.manage", "metadata.read", "protocol.manage", "telemetry.read", "alerts.acknowledge", "operations.read", "operations.manage"]).annotate({ "identifier": "TenantAction" })
export type ApiDescription = { readonly "service": "FleetIQ", readonly "version": "v1" } & { readonly [x: string]: Schema.Json }
export const ApiDescription = Schema.StructWithRest(Schema.Struct({ "service": Schema.Literal("FleetIQ"), "version": Schema.Literal("v1") }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "ApiDescription" })
export type BrowserPrimitiveConstraint20 = string
export const BrowserPrimitiveConstraint20 = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1", "identifier": "BrowserPrimitiveConstraint20" }))
export type BrowserPrimitiveConstraint29 = string
export const BrowserPrimitiveConstraint29 = Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(512).annotate({ "expected": "a string with at most 512 code points", "identifier": "BrowserPrimitiveConstraint29" }))
export type BrowserPrimitiveConstraint21 = string
export const BrowserPrimitiveConstraint21 = Schema.String.check(Schema.isPattern(new RegExp("^[A-Za-z0-9_.-]{1,128}$", "u")).annotate({ "expected": "a string matching the RegExp ^[A-Za-z0-9_.-]{1,128}$", "identifier": "BrowserPrimitiveConstraint21" }))
export type BrowserPrimitiveConstraint22 = number
export const BrowserPrimitiveConstraint22 = Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0", "identifier": "BrowserPrimitiveConstraint22" }))
export type IngestionDiagnosticCoverage = { readonly "frame_limit": 64, readonly "output_limit_per_frame": 64, readonly "source_limit": 128, readonly "frames_truncated": boolean, readonly "observations_truncated": boolean, readonly "sources_truncated": boolean }
export const IngestionDiagnosticCoverage = Schema.Struct({ "frame_limit": Schema.Literal(64), "output_limit_per_frame": Schema.Literal(64), "source_limit": Schema.Literal(128), "frames_truncated": Schema.Boolean, "observations_truncated": Schema.Boolean, "sources_truncated": Schema.Boolean }).annotate({ "identifier": "IngestionDiagnosticCoverage" })
export type Problem = { readonly "type": BrowserPrimitiveConstraint1, readonly "title": BrowserPrimitiveConstraint1, readonly "status": number } & { readonly [x: string]: Schema.Json }
export const Problem = Schema.StructWithRest(Schema.Struct({ "type": BrowserPrimitiveConstraint1, "title": BrowserPrimitiveConstraint1, "status": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(400).annotate({ "expected": "a value greater than or equal to 400" })).check(Schema.isLessThanOrEqualTo(599).annotate({ "expected": "a value less than or equal to 599" })) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "Problem" })
export type RestoreJob = { readonly "manifest_id": HistoryRestoreId, readonly "restore_generation": HistoryRestoreId, readonly "state": "pending" | "ready" | "cancelled" | "expired" }
export const RestoreJob = Schema.Struct({ "manifest_id": HistoryRestoreId, "restore_generation": HistoryRestoreId, "state": Schema.Literals(["pending", "ready", "cancelled", "expired"]) }).annotate({ "identifier": "RestoreJob" })
export type PropertyHistoryCoverage = { readonly "hot": "queried", readonly "archive": "archived" | "restoring" | "restored" | "unavailable", readonly "scope": "selected_manifest_only", readonly "manifest_id": HistoryRestoreId, readonly "restore_generation": HistoryRestoreId }
export const PropertyHistoryCoverage = Schema.Struct({ "hot": Schema.Literal("queried"), "archive": Schema.Literals(["archived", "restoring", "restored", "unavailable"]), "scope": Schema.Literal("selected_manifest_only"), "manifest_id": HistoryRestoreId, "restore_generation": HistoryRestoreId }).annotate({ "examples": [{ "hot": "queried", "archive": "restored", "scope": "selected_manifest_only", "manifest_id": "1", "restore_generation": "1" }], "identifier": "PropertyHistoryCoverage" })
export type CalculatorEvidenceRelease = { readonly "id": AdministrationIdentifier, readonly "version": AdministrationIdentifier, readonly "implementation": "window-mean-v1" | "window-mad-v1" }
export const CalculatorEvidenceRelease = Schema.Struct({ "id": AdministrationIdentifier, "version": AdministrationIdentifier, "implementation": Schema.Literals(["window-mean-v1", "window-mad-v1"]) }).annotate({ "identifier": "CalculatorEvidenceRelease" })
export type RegistrationExternalIdentifier = { readonly "kind": AdministrationIdentifier, readonly "authority"?: AdministrationIdentifier | null, readonly "value": AdministrationIdentifier }
export const RegistrationExternalIdentifier = Schema.Struct({ "kind": AdministrationIdentifier, "authority": Schema.optionalKey(Schema.Union([AdministrationIdentifier, Schema.Null])), "value": AdministrationIdentifier }).annotate({ "identifier": "RegistrationExternalIdentifier" })
export type AlertRuleRevisionReceipt = { readonly "revision": BrowserPrimitiveConstraint4 }
export const AlertRuleRevisionReceipt = Schema.Struct({ "revision": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "AlertRuleRevisionReceipt" })
export type CalculatorEvidenceProperty = { readonly "id": AdministrationIdentifier, readonly "version": BrowserPrimitiveConstraint4 }
export const CalculatorEvidenceProperty = Schema.Struct({ "id": AdministrationIdentifier, "version": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "CalculatorEvidenceProperty" })
export type SemanticDefinitionPosition = { readonly "id": AdministrationIdentifier, readonly "version": BrowserPrimitiveConstraint4 }
export const SemanticDefinitionPosition = Schema.Struct({ "id": AdministrationIdentifier, "version": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "SemanticDefinitionPosition" })
export type RegistrationAssetType = { readonly "id": AdministrationIdentifier, readonly "version": BrowserPrimitiveConstraint4 }
export const RegistrationAssetType = Schema.Struct({ "id": AdministrationIdentifier, "version": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "RegistrationAssetType" })
export type ExportCreateRequest = { readonly "asset_id": AdministrationIdentifier, readonly "property_id": AdministrationIdentifier, readonly "property_version": BrowserPrimitiveConstraint4, readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "manifest_id"?: HistoryRestoreId, readonly "restore_generation"?: HistoryRestoreId }
export const ExportCreateRequest = Schema.Struct({ "asset_id": AdministrationIdentifier, "property_id": AdministrationIdentifier, "property_version": BrowserPrimitiveConstraint4, "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "manifest_id": Schema.optionalKey(HistoryRestoreId), "restore_generation": Schema.optionalKey(HistoryRestoreId) }).annotate({ "identifier": "ExportCreateRequest" })
export type CalculatorEvidenceWindow = { readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "finalize_at_ms": HistoryMillis, readonly "known_at_ms": HistoryMillis }
export const CalculatorEvidenceWindow = Schema.Struct({ "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "finalize_at_ms": HistoryMillis, "known_at_ms": HistoryMillis }).annotate({ "identifier": "CalculatorEvidenceWindow" })
export type CalculatorInputReference = { readonly "evidence_id": string, readonly "event_at_ms": HistoryMillis }
export const CalculatorInputReference = Schema.Struct({ "evidence_id": Schema.String.check(Schema.isPattern(new RegExp("^[0-9a-f]{64}$", "u")).annotate({ "expected": "a string matching the RegExp ^[0-9a-f]{64}$" })), "event_at_ms": HistoryMillis }).annotate({ "identifier": "CalculatorInputReference" })
export type ExportJob = { readonly "export_id": ExportId, readonly "state": "pending" | "ready" | "cancelled" | "expired", readonly "selection_generation": "1", readonly "format": "property-history-v1", readonly "format_version": 1, readonly "expires_at_ms": HistoryMillis, readonly "row_count": number, readonly "file_bytes": string, readonly "coverage": ExportCoverage }
export const ExportJob = Schema.Struct({ "export_id": ExportId, "state": Schema.Literals(["pending", "ready", "cancelled", "expired"]), "selection_generation": Schema.Literal("1"), "format": Schema.Literal("property-history-v1"), "format_version": Schema.Literal(1), "expires_at_ms": HistoryMillis, "row_count": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(16).annotate({ "expected": "a value less than or equal to 16" })), "file_bytes": Schema.String.check(Schema.isMaxCodePoints(7).annotate({ "expected": "a string with at most 7 code points" })).check(Schema.isPattern(new RegExp("^[1-9][0-9]*$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]*$" })), "coverage": ExportCoverage }).annotate({ "identifier": "ExportJob" })
export type NumericSummaryBucket = { readonly "start_ms": HistoryMillis, readonly "end_ms": HistoryMillis, readonly "total": BrowserPrimitiveConstraint6, readonly "count": BrowserPrimitiveConstraint6, readonly "excluded": BrowserPrimitiveConstraint6, readonly "min": string | null, readonly "max": string | null, readonly "sum": string }
export const NumericSummaryBucket = Schema.Struct({ "start_ms": HistoryMillis, "end_ms": HistoryMillis, "total": BrowserPrimitiveConstraint6, "count": BrowserPrimitiveConstraint6, "excluded": BrowserPrimitiveConstraint6, "min": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(2048).annotate({ "expected": "a string with at most 2048 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$" })), Schema.Null]), "max": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(2048).annotate({ "expected": "a string with at most 2048 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$" })), Schema.Null]), "sum": Schema.String.check(Schema.isMaxCodePoints(2048).annotate({ "expected": "a string with at most 2048 code points" })).check(Schema.isPattern(new RegExp("^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$", "u")).annotate({ "expected": "a string matching the RegExp ^-?(0|[1-9][0-9]*)([.][0-9]*[1-9])?$" })) }).annotate({ "identifier": "NumericSummaryBucket" })
export type WorkQueueEvidence = { readonly "kind": "replay" | "calculator" | "alert_evaluation" | "notification", readonly "sampled": BrowserPrimitiveConstraint7, readonly "eligible": BrowserPrimitiveConstraint7, readonly "leased": BrowserPrimitiveConstraint7, readonly "failed": BrowserPrimitiveConstraint7, readonly "blocked": BrowserPrimitiveConstraint7, readonly "deferred": BrowserPrimitiveConstraint7, readonly "max_attempts": number, readonly "oldest_sampled_eligible_at_ms": HistoryMillis | null, readonly "failure_categories": ReadonlyArray<"attempts_exhausted" | "transport" | "rejected" | "response_limit" | "invalid_payload">, readonly "truncated": boolean }
export const WorkQueueEvidence = Schema.Struct({ "kind": Schema.Literals(["replay", "calculator", "alert_evaluation", "notification"]), "sampled": BrowserPrimitiveConstraint7, "eligible": BrowserPrimitiveConstraint7, "leased": BrowserPrimitiveConstraint7, "failed": BrowserPrimitiveConstraint7, "blocked": BrowserPrimitiveConstraint7, "deferred": BrowserPrimitiveConstraint7, "max_attempts": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(5).annotate({ "expected": "a value less than or equal to 5" })), "oldest_sampled_eligible_at_ms": Schema.Union([HistoryMillis, Schema.Null]), "failure_categories": Schema.Array(Schema.Literals(["attempts_exhausted", "transport", "rejected", "response_limit", "invalid_payload"])).check(Schema.isMaxLength(5).annotate({ "expected": "a value with a length of at most 5" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })), "truncated": Schema.Boolean }).annotate({ "identifier": "WorkQueueEvidence" })
export type WorkControl = { readonly "generation": WorkGeneration, readonly "paused": boolean }
export const WorkControl = Schema.Struct({ "generation": WorkGeneration, "paused": Schema.Boolean }).annotate({ "identifier": "WorkControl" })
export type WorkRecoveryReceipt = { readonly "request_id": AdministrationIdentifier, readonly "generation": WorkGeneration, readonly "actor_id": AdministrationIdentifier, readonly "recorded_at_ms": HistoryMillis }
export const WorkRecoveryReceipt = Schema.Struct({ "request_id": AdministrationIdentifier, "generation": WorkGeneration, "actor_id": AdministrationIdentifier, "recorded_at_ms": HistoryMillis }).annotate({ "identifier": "WorkRecoveryReceipt" })
export type WorkRetryTarget = { readonly "id": AdministrationIdentifier } | { readonly "destination": BrowserPrimitiveConstraint9, readonly "rule_id": AdministrationIdentifier, readonly "revision": string, readonly "firing_version": string }
export const WorkRetryTarget = Schema.Union([Schema.Struct({ "id": AdministrationIdentifier }), Schema.Struct({ "destination": BrowserPrimitiveConstraint9, "rule_id": AdministrationIdentifier, "revision": Schema.String.check(Schema.isPattern(new RegExp("^[1-9][0-9]{0,9}$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]{0,9}$" })), "firing_version": Schema.String.check(Schema.isPattern(new RegExp("^[1-9][0-9]{0,18}$", "u")).annotate({ "expected": "a string matching the RegExp ^[1-9][0-9]{0,18}$" })) })], { mode: "oneOf" }).annotate({ "identifier": "WorkRetryTarget" })
export type ProtocolPackageRelease = { readonly "package_id": BrowserPrimitiveConstraint1, readonly "package_version": BrowserPrimitiveConstraint1, readonly "artifact_sha256": BrowserPrimitiveConstraint9, readonly "artifact_size_bytes": number }
export const ProtocolPackageRelease = Schema.Struct({ "package_id": BrowserPrimitiveConstraint1, "package_version": BrowserPrimitiveConstraint1, "artifact_sha256": BrowserPrimitiveConstraint9, "artifact_size_bytes": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(8388608).annotate({ "expected": "a value less than or equal to 8388608" })) }).annotate({ "identifier": "ProtocolPackageRelease" })
export type AlertAcknowledgementRequest = { readonly "expected_version": AlertLifecycleVersion }
export const AlertAcknowledgementRequest = Schema.Struct({ "expected_version": AlertLifecycleVersion }).annotate({ "identifier": "AlertAcknowledgementRequest" })
export type AlertAcknowledgement = { readonly "version": AlertLifecycleVersion, readonly "actor_id": AdministrationIdentifier, readonly "recorded_at_ms": HistoryMillis }
export const AlertAcknowledgement = Schema.Struct({ "version": AlertLifecycleVersion, "actor_id": AdministrationIdentifier, "recorded_at_ms": HistoryMillis }).annotate({ "identifier": "AlertAcknowledgement" })
export type AlertRuleActivationState = { readonly "generation": BrowserPrimitiveConstraint10, readonly "revision": number | null, readonly "actor_id": AdministrationIdentifier | null, readonly "recorded_at_ms": number | null }
export const AlertRuleActivationState = Schema.Struct({ "generation": BrowserPrimitiveConstraint10, "revision": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), Schema.Null]), "actor_id": Schema.Union([AdministrationIdentifier, Schema.Null]), "recorded_at_ms": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(-9223372036854776000).annotate({ "expected": "a value greater than or equal to -9223372036854776000" })).check(Schema.isLessThanOrEqualTo(9223372036854776000).annotate({ "expected": "a value less than or equal to 9223372036854776000" })), Schema.Null]).annotate({ "format": "int64" }) }).annotate({ "identifier": "AlertRuleActivationState" })
export type AlertRuleActivationRequest = { readonly "expected_generation": BrowserPrimitiveConstraint10, readonly "revision": number | null }
export const AlertRuleActivationRequest = Schema.Struct({ "expected_generation": BrowserPrimitiveConstraint10, "revision": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(4294967295).annotate({ "expected": "a value less than or equal to 4294967295" })), Schema.Null]) }).annotate({ "identifier": "AlertRuleActivationRequest" })
export type AlertEvaluationRef = { readonly "evaluation_id": AdministrationIdentifier, readonly "scope_asset_id": AdministrationIdentifier, readonly "output_index": BrowserPrimitiveConstraint11 | null }
export const AlertEvaluationRef = Schema.Struct({ "evaluation_id": AdministrationIdentifier, "scope_asset_id": AdministrationIdentifier, "output_index": Schema.Union([BrowserPrimitiveConstraint11, Schema.Null]) }).annotate({ "identifier": "AlertEvaluationRef" })
export type AlertRuleDefinition = { readonly "kind": "numeric-threshold-v1", readonly "calculator": AdministrationIdentifier, readonly "version": AdministrationIdentifier, readonly "scope": AdministrationIdentifier, readonly "target": AdministrationIdentifier, readonly "output_property": AdministrationIdentifier, readonly "output_version": BrowserPrimitiveConstraint4, readonly "output_index": BrowserPrimitiveConstraint11, readonly "comparison": "gt" | "gte" | "lt" | "lte", readonly "threshold": string, readonly "threshold_unit": AdministrationIdentifier | null, readonly "hold_ms": BrowserPrimitiveConstraint12, readonly "resolution": "resolve_on_false", readonly "resolve_after_ms": BrowserPrimitiveConstraint12 }
export const AlertRuleDefinition = Schema.Struct({ "kind": Schema.Literal("numeric-threshold-v1"), "calculator": AdministrationIdentifier, "version": AdministrationIdentifier, "scope": AdministrationIdentifier, "target": AdministrationIdentifier, "output_property": AdministrationIdentifier, "output_version": BrowserPrimitiveConstraint4, "output_index": BrowserPrimitiveConstraint11, "comparison": Schema.Literals(["gt", "gte", "lt", "lte"]), "threshold": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(256).annotate({ "expected": "a string with at most 256 code points" })).check(Schema.isPattern(new RegExp("^[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?$", "u")).annotate({ "expected": "a string matching the RegExp ^[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?$" })), "threshold_unit": Schema.Union([AdministrationIdentifier, Schema.Null]), "hold_ms": BrowserPrimitiveConstraint12, "resolution": Schema.Literal("resolve_on_false"), "resolve_after_ms": BrowserPrimitiveConstraint12 }).annotate({ "identifier": "AlertRuleDefinition" })
export type CalculatorOutputEvidence = { readonly "evaluation_id": AdministrationIdentifier, readonly "calculator_id": AdministrationIdentifier, readonly "calculator_version": AdministrationIdentifier, readonly "output_index": BrowserPrimitiveConstraint11, readonly "asset_id": AdministrationIdentifier, readonly "property_id": AdministrationIdentifier, readonly "property_version": BrowserPrimitiveConstraint4, readonly "kind": "decimal", readonly "value": BrowserPrimitiveConstraint15, readonly "unit": AdministrationIdentifier | null }
export const CalculatorOutputEvidence = Schema.Struct({ "evaluation_id": AdministrationIdentifier, "calculator_id": AdministrationIdentifier, "calculator_version": AdministrationIdentifier, "output_index": BrowserPrimitiveConstraint11, "asset_id": AdministrationIdentifier, "property_id": AdministrationIdentifier, "property_version": BrowserPrimitiveConstraint4, "kind": Schema.Literal("decimal"), "value": BrowserPrimitiveConstraint15, "unit": Schema.Union([AdministrationIdentifier, Schema.Null]) }).annotate({ "identifier": "CalculatorOutputEvidence" })
export type SignalSource = { readonly "device_asset_id": BrowserPrimitiveConstraint16, readonly "endpoint_id": BrowserPrimitiveConstraint16, readonly "signal_id": BrowserPrimitiveConstraint16 } & { readonly [x: string]: Schema.Json }
export const SignalSource = Schema.StructWithRest(Schema.Struct({ "device_asset_id": BrowserPrimitiveConstraint16, "endpoint_id": BrowserPrimitiveConstraint16, "signal_id": BrowserPrimitiveConstraint16 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "SignalSource" })
export type PropertyReference = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4 } & { readonly [x: string]: Schema.Json }
export const PropertyReference = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "PropertyReference" })
export type FleetLocationMapping = { readonly "latitude": { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4 }, readonly "longitude": { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4 }, readonly "encoding": "degrees" | "e7" }
export const FleetLocationMapping = Schema.Struct({ "latitude": Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4 }), "longitude": Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4 }), "encoding": Schema.Literals(["degrees", "e7"]) }).annotate({ "identifier": "FleetLocationMapping" })
export type AssetTypeRef = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4 } & { readonly [x: string]: Schema.Json }
export const AssetTypeRef = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeRef" })
export type PropertyHistorySource = { readonly "message_id": BrowserPrimitiveConstraint16, readonly "protocol_package_id": BrowserPrimitiveConstraint16, readonly "protocol_package_version": BrowserPrimitiveConstraint16, readonly "device_asset_id": BrowserPrimitiveConstraint16, readonly "endpoint_id": BrowserPrimitiveConstraint16, readonly "signal_id": BrowserPrimitiveConstraint16, readonly "output_index": BrowserPrimitiveConstraint10, readonly "device_recorded_at_ms": HistoryMillis | null, readonly "received_at_ms": HistoryMillis }
export const PropertyHistorySource = Schema.Struct({ "message_id": BrowserPrimitiveConstraint16, "protocol_package_id": BrowserPrimitiveConstraint16, "protocol_package_version": BrowserPrimitiveConstraint16, "device_asset_id": BrowserPrimitiveConstraint16, "endpoint_id": BrowserPrimitiveConstraint16, "signal_id": BrowserPrimitiveConstraint16, "output_index": BrowserPrimitiveConstraint10, "device_recorded_at_ms": Schema.Union([HistoryMillis, Schema.Null], { mode: "oneOf" }), "received_at_ms": HistoryMillis }).annotate({ "identifier": "PropertyHistorySource" })
export type RelationshipTypeRef = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4 } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeRef = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "RelationshipTypeRef" })
export type ProtocolRouteSelection = { readonly "package_id": BrowserPrimitiveConstraint16, readonly "package_version": BrowserPrimitiveConstraint16, readonly "world": "runtime-v1" | "identity-v1" }
export const ProtocolRouteSelection = Schema.Struct({ "package_id": BrowserPrimitiveConstraint16, "package_version": BrowserPrimitiveConstraint16, "world": Schema.Literals(["runtime-v1", "identity-v1"]) }).annotate({ "identifier": "ProtocolRouteSelection" })
export type IngestionObservedSource = { readonly "package_id": BrowserPrimitiveConstraint16, readonly "package_version": BrowserPrimitiveConstraint16, readonly "endpoint_id": BrowserPrimitiveConstraint16, readonly "signal_id": BrowserPrimitiveConstraint16 }
export const IngestionObservedSource = Schema.Struct({ "package_id": BrowserPrimitiveConstraint16, "package_version": BrowserPrimitiveConstraint16, "endpoint_id": BrowserPrimitiveConstraint16, "signal_id": BrowserPrimitiveConstraint16 }).annotate({ "identifier": "IngestionObservedSource" })
export type EffectiveInterval = { readonly "start_ms": BrowserPrimitiveConstraint18, readonly "end_ms": number | null } & { readonly [x: string]: Schema.Json }
export const EffectiveInterval = Schema.StructWithRest(Schema.Struct({ "start_ms": BrowserPrimitiveConstraint18, "end_ms": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })), Schema.Null]).annotate({ "format": "int64" }) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "EffectiveInterval" })
export type RevisionEffectiveInterval = { readonly "start_ms": BrowserPrimitiveConstraint18, readonly "end_ms"?: number | null }
export const RevisionEffectiveInterval = Schema.Struct({ "start_ms": BrowserPrimitiveConstraint18, "end_ms": Schema.optionalKey(Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })), Schema.Null]).annotate({ "format": "int64" })) }).annotate({ "identifier": "RevisionEffectiveInterval" })
export type MetadataRegistrationResult = { readonly "outcome": "registered" | "already_registered", readonly "registered_by": AdministrationIdentifier, readonly "recorded_at_ms": BrowserPrimitiveConstraint18 }
export const MetadataRegistrationResult = Schema.Struct({ "outcome": Schema.Literals(["registered", "already_registered"]), "registered_by": AdministrationIdentifier, "recorded_at_ms": BrowserPrimitiveConstraint18 }).annotate({ "identifier": "MetadataRegistrationResult" })
export type IngestionDiagnosticFrame = { readonly "message_id": BrowserPrimitiveConstraint16, readonly "package_id": BrowserPrimitiveConstraint16, readonly "package_version": BrowserPrimitiveConstraint16, readonly "received_at_ms": BrowserPrimitiveConstraint18, readonly "processing": "accepted" | "queued" | "leased" | "expired" | "poisoned" | "decoded", readonly "observation_count": number | null }
export const IngestionDiagnosticFrame = Schema.Struct({ "message_id": BrowserPrimitiveConstraint16, "package_id": BrowserPrimitiveConstraint16, "package_version": BrowserPrimitiveConstraint16, "received_at_ms": BrowserPrimitiveConstraint18, "processing": Schema.Literals(["accepted", "queued", "leased", "expired", "poisoned", "decoded"]), "observation_count": Schema.Union([Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(0).annotate({ "expected": "a value greater than or equal to 0" })).check(Schema.isLessThanOrEqualTo(4294967296).annotate({ "expected": "a value less than or equal to 4294967296" })), Schema.Null]) }).annotate({ "identifier": "IngestionDiagnosticFrame" })
export type RevisionSource = { readonly "device_asset_id": BrowserPrimitiveConstraint19, readonly "endpoint_id": BrowserPrimitiveConstraint19, readonly "signal_id": BrowserPrimitiveConstraint19 }
export const RevisionSource = Schema.Struct({ "device_asset_id": BrowserPrimitiveConstraint19, "endpoint_id": BrowserPrimitiveConstraint19, "signal_id": BrowserPrimitiveConstraint19 }).annotate({ "identifier": "RevisionSource" })
export type RevisionProperty = { readonly "id": BrowserPrimitiveConstraint19, readonly "version": BrowserPrimitiveConstraint4 }
export const RevisionProperty = Schema.Struct({ "id": BrowserPrimitiveConstraint19, "version": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "RevisionProperty" })
export type MetadataRevisionResult = { readonly "outcome": "appended" | "already_appended", readonly "id": BrowserPrimitiveConstraint19, readonly "revision": BrowserPrimitiveConstraint17, readonly "recorded_by": BrowserPrimitiveConstraint19, readonly "recorded_at_ms": BrowserPrimitiveConstraint18 }
export const MetadataRevisionResult = Schema.Struct({ "outcome": Schema.Literals(["appended", "already_appended"]), "id": BrowserPrimitiveConstraint19, "revision": BrowserPrimitiveConstraint17, "recorded_by": BrowserPrimitiveConstraint19, "recorded_at_ms": BrowserPrimitiveConstraint18 }).annotate({ "identifier": "MetadataRevisionResult" })
export type RevisionRelationshipType = { readonly "id": BrowserPrimitiveConstraint19, readonly "version": BrowserPrimitiveConstraint4 }
export const RevisionRelationshipType = Schema.Struct({ "id": BrowserPrimitiveConstraint19, "version": BrowserPrimitiveConstraint4 }).annotate({ "identifier": "RevisionRelationshipType" })
export type SemanticDefinitionSummary = { readonly "id": AdministrationIdentifier, readonly "version": BrowserPrimitiveConstraint4, readonly "name": SemanticDefinitionName }
export const SemanticDefinitionSummary = Schema.Struct({ "id": AdministrationIdentifier, "version": BrowserPrimitiveConstraint4, "name": SemanticDefinitionName }).annotate({ "identifier": "SemanticDefinitionSummary" })
export type DeviceEndpoint = { readonly "id": AdministrationIdentifier, readonly "kind": AdministrationIdentifier, readonly "name": SemanticDefinitionName }
export const DeviceEndpoint = Schema.Struct({ "id": AdministrationIdentifier, "kind": AdministrationIdentifier, "name": SemanticDefinitionName }).annotate({ "identifier": "DeviceEndpoint" })
export type FleetSummary = { readonly "assets": ProjectionCounter, readonly "communication_devices": ProjectionCounter, readonly "mapped_assets": ProjectionCounter, readonly "assets_with_current_properties": ProjectionCounter }
export const FleetSummary = Schema.Struct({ "assets": ProjectionCounter, "communication_devices": ProjectionCounter, "mapped_assets": ProjectionCounter, "assets_with_current_properties": ProjectionCounter }).annotate({ "identifier": "FleetSummary" })
export type HistoryValue = { readonly "kind": "boolean", readonly "value": boolean } | { readonly "kind": "integer", readonly "value": BrowserPrimitiveConstraint3 } | { readonly "kind": "decimal", readonly "value": string } | { readonly "kind": "text", readonly "value": BrowserPrimitiveConstraint1 }
export const HistoryValue = Schema.Union([Schema.Struct({ "kind": Schema.Literal("boolean"), "value": Schema.Boolean }), Schema.Struct({ "kind": Schema.Literal("integer"), "value": BrowserPrimitiveConstraint3 }), Schema.Struct({ "kind": Schema.Literal("decimal"), "value": Schema.String.check(Schema.isPattern(new RegExp("^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$", "u")).annotate({ "expected": "a string matching the RegExp ^-?[0-9]+(\\.[0-9]+)?([eE][+-]?[0-9]+)?$" })) }), Schema.Struct({ "kind": Schema.Literal("text"), "value": BrowserPrimitiveConstraint1 })], { mode: "oneOf" }).annotate({ "identifier": "HistoryValue" })
export type OperatorTenant = { readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "actions": ReadonlyArray<TenantAction> }
export const OperatorTenant = Schema.Struct({ "tenant_id": BrowserPrimitiveConstraint16, "actions": Schema.Array(TenantAction).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxLength(11).annotate({ "expected": "a value with a length of at most 11" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })) }).annotate({ "identifier": "OperatorTenant" })
export type ExternalIdentifier = { readonly "kind": BrowserPrimitiveConstraint16, readonly "authority": string | null, readonly "value": BrowserPrimitiveConstraint20 } & { readonly [x: string]: Schema.Json }
export const ExternalIdentifier = Schema.StructWithRest(Schema.Struct({ "kind": BrowserPrimitiveConstraint16, "authority": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]), "value": BrowserPrimitiveConstraint20 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "ExternalIdentifier" })
export type PropertyDefinition = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4, readonly "name": BrowserPrimitiveConstraint20, readonly "value_kind": "boolean" | "integer" | "decimal" | "text", readonly "canonical_unit": string | null } & { readonly [x: string]: Schema.Json }
export const PropertyDefinition = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4, "name": BrowserPrimitiveConstraint20, "value_kind": Schema.Literals(["boolean", "integer", "decimal", "text"]), "canonical_unit": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })), Schema.Null]) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "PropertyDefinition" })
export type RelationshipTypeDefinition = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4, readonly "name": BrowserPrimitiveConstraint20 } & { readonly [x: string]: Schema.Json }
export const RelationshipTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4, "name": BrowserPrimitiveConstraint20 }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "RelationshipTypeDefinition" })
export type OperatorSession = { readonly "actor_id": BrowserPrimitiveConstraint20, readonly "expires_at_ms": number }
export const OperatorSession = Schema.Struct({ "actor_id": BrowserPrimitiveConstraint20, "expires_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })) }).annotate({ "identifier": "OperatorSession" })
export type RegisterAssetRequest = { readonly "id": AdministrationIdentifier, readonly "name": SemanticDefinitionName, readonly "asset_type": RegistrationAssetType, readonly "external_identifiers": ReadonlyArray<RegistrationExternalIdentifier> }
export const RegisterAssetRequest = Schema.Struct({ "id": AdministrationIdentifier, "name": SemanticDefinitionName, "asset_type": RegistrationAssetType, "external_identifiers": Schema.Array(RegistrationExternalIdentifier).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })).check(Schema.isUnique().annotate({ "expected": "an array with unique items" })) }).annotate({ "identifier": "RegisterAssetRequest" })
export type CalculatorEvaluationSummary = { readonly "evaluation_id": AdministrationIdentifier, readonly "scope_asset_id": AdministrationIdentifier, readonly "calculator": CalculatorEvidenceRelease, readonly "configuration_id": AdministrationIdentifier, readonly "input_property": CalculatorEvidenceProperty, readonly "window": CalculatorEvidenceWindow, readonly "evaluated_at_ms": HistoryMillis, readonly "outcome": "complete" | "insufficient" | "incompatible_input" | "invalid_output" | "resource_limit", readonly "minimum_samples": number, readonly "input_count": BrowserPrimitiveConstraint14, readonly "output_count": BrowserPrimitiveConstraint14 }
export const CalculatorEvaluationSummary = Schema.Struct({ "evaluation_id": AdministrationIdentifier, "scope_asset_id": AdministrationIdentifier, "calculator": CalculatorEvidenceRelease, "configuration_id": AdministrationIdentifier, "input_property": CalculatorEvidenceProperty, "window": CalculatorEvidenceWindow, "evaluated_at_ms": HistoryMillis, "outcome": Schema.Literals(["complete", "insufficient", "incompatible_input", "invalid_output", "resource_limit"]), "minimum_samples": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })).check(Schema.isLessThanOrEqualTo(1024).annotate({ "expected": "a value less than or equal to 1024" })), "input_count": BrowserPrimitiveConstraint14, "output_count": BrowserPrimitiveConstraint14 }).annotate({ "identifier": "CalculatorEvaluationSummary" })
export type NumericSummaryPage = { readonly "representation": "numeric_summary", readonly "algorithm": "numeric-fixed-v1", readonly "series_id": HistoryRestoreId, readonly "revision": HistoryRestoreId, readonly "observed_at_ms": HistoryMillis, readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "resolution_ms": BrowserPrimitiveConstraint5, readonly "kind": "integer" | "decimal", readonly "unit": string | null, readonly "coverage": NumericSummaryCoverage, readonly "buckets": ReadonlyArray<NumericSummaryBucket>, readonly "next_after": HistoryToken | null }
export const NumericSummaryPage = Schema.Struct({ "representation": Schema.Literal("numeric_summary"), "algorithm": Schema.Literal("numeric-fixed-v1"), "series_id": HistoryRestoreId, "revision": HistoryRestoreId, "observed_at_ms": HistoryMillis, "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "resolution_ms": BrowserPrimitiveConstraint5, "kind": Schema.Literals(["integer", "decimal"]), "unit": Schema.Union([Schema.String.check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]), "coverage": NumericSummaryCoverage, "buckets": Schema.Array(NumericSummaryBucket).check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxLength(64).annotate({ "expected": "a value with a length of at most 64" })), "next_after": Schema.Union([HistoryToken, Schema.Null], { mode: "oneOf" }) }).annotate({ "identifier": "NumericSummaryPage" })
export type WorkDiagnostics = { readonly "observed_at_ms": HistoryMillis, readonly "worker_liveness": "not_observed", readonly "notification_seeding": "not_observed", readonly "sample_limit": 64, readonly "queues": ReadonlyArray<WorkQueueEvidence> }
export const WorkDiagnostics = Schema.Struct({ "observed_at_ms": HistoryMillis, "worker_liveness": Schema.Literal("not_observed"), "notification_seeding": Schema.Literal("not_observed"), "sample_limit": Schema.Literal(64), "queues": Schema.Array(WorkQueueEvidence).check(Schema.isMinLength(4).annotate({ "expected": "a value with a length of at least 4" })).check(Schema.isMaxLength(4).annotate({ "expected": "a value with a length of at most 4" })) }).annotate({ "identifier": "WorkDiagnostics" })
export type WorkRecoveryCandidate = { readonly "target": WorkRetryTarget, readonly "expected_generation": WorkGeneration }
export const WorkRecoveryCandidate = Schema.Struct({ "target": WorkRetryTarget, "expected_generation": WorkGeneration }).annotate({ "identifier": "WorkRecoveryCandidate" })
export type WorkRecoveryCommand = { readonly "operation": "retry", readonly "expected_generation": WorkGeneration, readonly "target": WorkRetryTarget } | { readonly "operation": "pause" | "resume", readonly "expected_generation": WorkGeneration, readonly "target": { readonly [x: string]: never } }
export const WorkRecoveryCommand = Schema.Union([Schema.Struct({ "operation": Schema.Literal("retry"), "expected_generation": WorkGeneration, "target": WorkRetryTarget }), Schema.Struct({ "operation": Schema.Literals(["pause", "resume"]), "expected_generation": WorkGeneration, "target": Schema.Record(Schema.String, Schema.Never) })], { mode: "oneOf" }).annotate({ "identifier": "WorkRecoveryCommand" })
export type AlertRuleHead = { readonly "latest_revision": BrowserPrimitiveConstraint4, readonly "activation": AlertRuleActivationState }
export const AlertRuleHead = Schema.Struct({ "latest_revision": BrowserPrimitiveConstraint4, "activation": AlertRuleActivationState }).annotate({ "identifier": "AlertRuleHead" })
export type AlertTransition = { readonly "version": AlertLifecycleVersion, readonly "phase": AlertPhase, readonly "event_at_ms": HistoryMillis, readonly "recorded_at_ms": HistoryMillis, readonly "activation_generation": BrowserPrimitiveConstraint4, readonly "evidence": AlertEvaluationRef, readonly "acknowledgement"?: AlertAcknowledgement | null }
export const AlertTransition = Schema.Struct({ "version": AlertLifecycleVersion, "phase": AlertPhase, "event_at_ms": HistoryMillis, "recorded_at_ms": HistoryMillis, "activation_generation": BrowserPrimitiveConstraint4, "evidence": AlertEvaluationRef, "acknowledgement": Schema.optionalKey(Schema.Union([AlertAcknowledgement, Schema.Null])) }).annotate({ "identifier": "AlertTransition" })
export type AlertRuleRevision = { readonly "revision": BrowserPrimitiveConstraint4, readonly "definition": AlertRuleDefinition, readonly "actor_id": AdministrationIdentifier, readonly "recorded_at_ms": number }
export const AlertRuleRevision = Schema.Struct({ "revision": BrowserPrimitiveConstraint4, "definition": AlertRuleDefinition, "actor_id": AdministrationIdentifier, "recorded_at_ms": Schema.Number.annotate({ "format": "int64" }).check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(-9223372036854776000).annotate({ "expected": "a value greater than or equal to -9223372036854776000" })).check(Schema.isLessThanOrEqualTo(9223372036854776000).annotate({ "expected": "a value less than or equal to 9223372036854776000" })) }).annotate({ "identifier": "AlertRuleRevision" })
export type CalculatorOutputPage = { readonly "outputs": ReadonlyArray<CalculatorOutputEvidence>, readonly "next_after": CalculatorEvidenceCursor | null }
export const CalculatorOutputPage = Schema.Struct({ "outputs": Schema.Array(CalculatorOutputEvidence).check(Schema.isMaxLength(20).annotate({ "expected": "a value with a length of at most 20" })), "next_after": Schema.Union([CalculatorEvidenceCursor, Schema.Null]) }).annotate({ "identifier": "CalculatorOutputPage" })
export type SignalTarget = { readonly "asset_id": BrowserPrimitiveConstraint16, readonly "property": PropertyReference } & { readonly [x: string]: Schema.Json }
export const SignalTarget = Schema.StructWithRest(Schema.Struct({ "asset_id": BrowserPrimitiveConstraint16, "property": PropertyReference }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "SignalTarget" })
export type AssetTypeDefinition = { readonly "id": BrowserPrimitiveConstraint16, readonly "version": BrowserPrimitiveConstraint4, readonly "name": BrowserPrimitiveConstraint20, readonly "supported_properties": ReadonlyArray<PropertyReference> } & { readonly [x: string]: Schema.Json }
export const AssetTypeDefinition = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "version": BrowserPrimitiveConstraint4, "name": BrowserPrimitiveConstraint20, "supported_properties": Schema.Array(PropertyReference) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetTypeDefinition" })
export type AssetSummary = { readonly "id": BrowserPrimitiveConstraint16, readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "name": BrowserPrimitiveConstraint20, readonly "asset_type": AssetTypeRef } & { readonly [x: string]: Schema.Json }
export const AssetSummary = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "tenant_id": BrowserPrimitiveConstraint16, "name": BrowserPrimitiveConstraint20, "asset_type": AssetTypeRef }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetSummary" })
export type ProtocolDeviceRoute = { readonly "device_asset_id": BrowserPrimitiveConstraint16, readonly "channel_id": BrowserPrimitiveConstraint21, readonly "revision": BrowserPrimitiveConstraint4, readonly "selection": ProtocolRouteSelection, readonly "policy_version": number, readonly "actor_id": BrowserPrimitiveConstraint16, readonly "recorded_at_ms": BrowserPrimitiveConstraint22 } | { readonly "device_asset_id": BrowserPrimitiveConstraint16, readonly "channel_id": BrowserPrimitiveConstraint21, readonly "revision": BrowserPrimitiveConstraint4, readonly "selection": null, readonly "policy_version": null, readonly "actor_id": BrowserPrimitiveConstraint16, readonly "recorded_at_ms": BrowserPrimitiveConstraint22 }
export const ProtocolDeviceRoute = Schema.Union([Schema.Struct({ "device_asset_id": BrowserPrimitiveConstraint16, "channel_id": BrowserPrimitiveConstraint21, "revision": BrowserPrimitiveConstraint4, "selection": ProtocolRouteSelection, "policy_version": Schema.Number.check(Schema.isInt().annotate({ "expected": "an integer" })).check(Schema.isGreaterThanOrEqualTo(1).annotate({ "expected": "a value greater than or equal to 1" })), "actor_id": BrowserPrimitiveConstraint16, "recorded_at_ms": BrowserPrimitiveConstraint22 }), Schema.Struct({ "device_asset_id": BrowserPrimitiveConstraint16, "channel_id": BrowserPrimitiveConstraint21, "revision": BrowserPrimitiveConstraint4, "selection": Schema.Null, "policy_version": Schema.Null, "actor_id": BrowserPrimitiveConstraint16, "recorded_at_ms": BrowserPrimitiveConstraint22 })]).annotate({ "identifier": "ProtocolDeviceRoute" })
export type ChangeProtocolRouteRequest = { readonly "expected_revision": BrowserPrimitiveConstraint10, readonly "selection": ProtocolRouteSelection | null }
export const ChangeProtocolRouteRequest = Schema.Struct({ "expected_revision": BrowserPrimitiveConstraint10, "selection": Schema.Union([ProtocolRouteSelection, Schema.Null]) }).annotate({ "identifier": "ChangeProtocolRouteRequest" })
export type Relationship = { readonly "id": BrowserPrimitiveConstraint16, readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "revision": BrowserPrimitiveConstraint17, readonly "recorded_at_ms": BrowserPrimitiveConstraint18, readonly "relationship_type": RelationshipTypeRef, readonly "source_asset_id": BrowserPrimitiveConstraint16, readonly "target_asset_id": BrowserPrimitiveConstraint16, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const Relationship = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "tenant_id": BrowserPrimitiveConstraint16, "revision": BrowserPrimitiveConstraint17, "recorded_at_ms": BrowserPrimitiveConstraint18, "relationship_type": RelationshipTypeRef, "source_asset_id": BrowserPrimitiveConstraint16, "target_asset_id": BrowserPrimitiveConstraint16, "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "Relationship" })
export type IngestionDiagnostics = { readonly "observed_at_ms": BrowserPrimitiveConstraint18, readonly "connection_liveness": "not_observed", readonly "worker_liveness": "not_observed", readonly "coverage": IngestionDiagnosticCoverage, readonly "frames": ReadonlyArray<IngestionDiagnosticFrame>, readonly "sources": ReadonlyArray<IngestionObservedSource> }
export const IngestionDiagnostics = Schema.Struct({ "observed_at_ms": BrowserPrimitiveConstraint18, "connection_liveness": Schema.Literal("not_observed"), "worker_liveness": Schema.Literal("not_observed"), "coverage": IngestionDiagnosticCoverage, "frames": Schema.Array(IngestionDiagnosticFrame).check(Schema.isMaxLength(64).annotate({ "expected": "a value with a length of at most 64" })), "sources": Schema.Array(IngestionObservedSource).check(Schema.isMaxLength(128).annotate({ "expected": "a value with a length of at most 128" })) }).annotate({ "identifier": "IngestionDiagnostics" })
export type RevisionTarget = { readonly "asset_id": BrowserPrimitiveConstraint19, readonly "property": RevisionProperty }
export const RevisionTarget = Schema.Struct({ "asset_id": BrowserPrimitiveConstraint19, "property": RevisionProperty }).annotate({ "identifier": "RevisionTarget" })
export type AppendRelationshipRevisionRequest = { readonly "relationship_type": RevisionRelationshipType, readonly "source_asset_id": BrowserPrimitiveConstraint19, readonly "target_asset_id": BrowserPrimitiveConstraint19, readonly "effective_interval": RevisionEffectiveInterval }
export const AppendRelationshipRevisionRequest = Schema.Struct({ "relationship_type": RevisionRelationshipType, "source_asset_id": BrowserPrimitiveConstraint19, "target_asset_id": BrowserPrimitiveConstraint19, "effective_interval": RevisionEffectiveInterval }).annotate({ "identifier": "AppendRelationshipRevisionRequest" })
export type DefinitionCataloguePage = { readonly "definitions": ReadonlyArray<SemanticDefinitionSummary>, readonly "next_after": SemanticDefinitionPosition | null }
export const DefinitionCataloguePage = Schema.Struct({ "definitions": Schema.Array(SemanticDefinitionSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([SemanticDefinitionPosition, Schema.Null]) }).annotate({ "identifier": "DefinitionCataloguePage" })
export type CommunicationDevice = { readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "asset_id": BrowserPrimitiveConstraint16, readonly "endpoints": ReadonlyArray<DeviceEndpoint> } & { readonly [x: string]: Schema.Json }
export const CommunicationDevice = Schema.StructWithRest(Schema.Struct({ "tenant_id": BrowserPrimitiveConstraint16, "asset_id": BrowserPrimitiveConstraint16, "endpoints": Schema.Array(DeviceEndpoint) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "CommunicationDevice" })
export type RegisterCommunicationDeviceRequest = { readonly "endpoints": ReadonlyArray<DeviceEndpoint> }
export const RegisterCommunicationDeviceRequest = Schema.Struct({ "endpoints": Schema.Array(DeviceEndpoint).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })) }).annotate({ "identifier": "RegisterCommunicationDeviceRequest" })
export type PropertyHistoryChange = { readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "asset_id": BrowserPrimitiveConstraint16, readonly "property_id": BrowserPrimitiveConstraint16, readonly "binding_id": BrowserPrimitiveConstraint16, readonly "interpretation": HistoryToken, readonly "property_version": BrowserPrimitiveConstraint4, readonly "binding_revision": BrowserPrimitiveConstraint17, readonly "event_time_basis": "device_recorded" | "received_at", readonly "event_at_ms": HistoryMillis, readonly "first_resolution_effective_at_ms": HistoryMillis, readonly "first_resolution_known_at_ms": HistoryMillis, readonly "value": HistoryValue, readonly "source_unit": string | null, readonly "quality": "good" | "uncertain" | "invalid", readonly "source": PropertyHistorySource }
export const PropertyHistoryChange = Schema.Struct({ "tenant_id": BrowserPrimitiveConstraint16, "asset_id": BrowserPrimitiveConstraint16, "property_id": BrowserPrimitiveConstraint16, "binding_id": BrowserPrimitiveConstraint16, "interpretation": HistoryToken, "property_version": BrowserPrimitiveConstraint4, "binding_revision": BrowserPrimitiveConstraint17, "event_time_basis": Schema.Literals(["device_recorded", "received_at"]), "event_at_ms": HistoryMillis, "first_resolution_effective_at_ms": HistoryMillis, "first_resolution_known_at_ms": HistoryMillis, "value": HistoryValue, "source_unit": Schema.Union([Schema.String, Schema.Null]), "quality": Schema.Literals(["good", "uncertain", "invalid"]), "source": PropertyHistorySource }).annotate({ "identifier": "PropertyHistoryChange" })
export type OperatorTenantPage = { readonly "tenants": ReadonlyArray<OperatorTenant>, readonly "next_after": string | null }
export const OperatorTenantPage = Schema.Struct({ "tenants": Schema.Array(OperatorTenant).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }).annotate({ "identifier": "OperatorTenantPage" })
export type Asset = { readonly "id": BrowserPrimitiveConstraint16, readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "name": BrowserPrimitiveConstraint20, readonly "asset_type": AssetTypeRef, readonly "external_identifiers": ReadonlyArray<ExternalIdentifier> } & { readonly [x: string]: Schema.Json }
export const Asset = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "tenant_id": BrowserPrimitiveConstraint16, "name": BrowserPrimitiveConstraint20, "asset_type": AssetTypeRef, "external_identifiers": Schema.Array(ExternalIdentifier) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "Asset" })
export type CalculatorEvaluationEvidence = { readonly "evaluation": CalculatorEvaluationSummary, readonly "inputs": ReadonlyArray<CalculatorInputReference> }
export const CalculatorEvaluationEvidence = Schema.Struct({ "evaluation": CalculatorEvaluationSummary, "inputs": Schema.Array(CalculatorInputReference).check(Schema.isMaxLength(1024).annotate({ "expected": "a value with a length of at most 1024" })) }).annotate({ "identifier": "CalculatorEvaluationEvidence" })
export type WorkRecoveryTargets = { readonly "kind": WorkKind, readonly "control": WorkControl, readonly "targets": ReadonlyArray<WorkRecoveryCandidate>, readonly "truncated": boolean }
export const WorkRecoveryTargets = Schema.Struct({ "kind": WorkKind, "control": WorkControl, "targets": Schema.Array(WorkRecoveryCandidate).check(Schema.isMaxLength(32).annotate({ "expected": "a value with a length of at most 32" })), "truncated": Schema.Boolean }).annotate({ "identifier": "WorkRecoveryTargets" })
export type AlertSummary = { readonly "rule_id": AdministrationIdentifier, readonly "rule_revision": BrowserPrimitiveConstraint4, readonly "scope_asset_id": AdministrationIdentifier, readonly "target_asset_id": AdministrationIdentifier, readonly "version": AlertLifecycleVersion, readonly "phase": AlertPhase, readonly "selected": boolean, readonly "candidate_since_ms": HistoryMillis | null, readonly "last_event_at_ms": HistoryMillis, readonly "latest_transition": AlertTransition }
export const AlertSummary = Schema.Struct({ "rule_id": AdministrationIdentifier, "rule_revision": BrowserPrimitiveConstraint4, "scope_asset_id": AdministrationIdentifier, "target_asset_id": AdministrationIdentifier, "version": AlertLifecycleVersion, "phase": AlertPhase, "selected": Schema.Boolean, "candidate_since_ms": Schema.Union([HistoryMillis, Schema.Null]), "last_event_at_ms": HistoryMillis, "latest_transition": AlertTransition }).annotate({ "identifier": "AlertSummary" })
export type AlertTransitionPage = { readonly "transitions": ReadonlyArray<AlertTransition>, readonly "next_after": AlertReadCursor | null }
export const AlertTransitionPage = Schema.Struct({ "transitions": Schema.Array(AlertTransition).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([AlertReadCursor, Schema.Null]) }).annotate({ "identifier": "AlertTransitionPage" })
export type SignalBinding = { readonly "id": BrowserPrimitiveConstraint16, readonly "tenant_id": BrowserPrimitiveConstraint16, readonly "revision": BrowserPrimitiveConstraint17, readonly "recorded_at_ms": BrowserPrimitiveConstraint18, readonly "source": SignalSource, readonly "target": SignalTarget, readonly "effective_interval": EffectiveInterval } & { readonly [x: string]: Schema.Json }
export const SignalBinding = Schema.StructWithRest(Schema.Struct({ "id": BrowserPrimitiveConstraint16, "tenant_id": BrowserPrimitiveConstraint16, "revision": BrowserPrimitiveConstraint17, "recorded_at_ms": BrowserPrimitiveConstraint18, "source": SignalSource, "target": SignalTarget, "effective_interval": EffectiveInterval }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "SignalBinding" })
export type AssetPage = { readonly "assets": ReadonlyArray<AssetSummary>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetPage = Schema.StructWithRest(Schema.Struct({ "assets": Schema.Array(AssetSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetPage" })
export type RelationshipSnapshot = { readonly "asset_id": BrowserPrimitiveConstraint16, readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "relationships": ReadonlyArray<Relationship>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const RelationshipSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": BrowserPrimitiveConstraint16, "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "relationships": Schema.Array(Relationship).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "RelationshipSnapshot" })
export type AppendSignalBindingRevisionRequest = { readonly "source": RevisionSource, readonly "target": RevisionTarget, readonly "effective_interval": RevisionEffectiveInterval }
export const AppendSignalBindingRevisionRequest = Schema.Struct({ "source": RevisionSource, "target": RevisionTarget, "effective_interval": RevisionEffectiveInterval }).annotate({ "identifier": "AppendSignalBindingRevisionRequest" })
export type FleetPoint = { readonly "latitude": BrowserPrimitiveConstraint16, readonly "longitude": BrowserPrimitiveConstraint16, readonly "quality": "good" | "uncertain", readonly "freshness": "fresh" | "stale" | "future", readonly "latitude_change": PropertyHistoryChange, readonly "longitude_change": PropertyHistoryChange }
export const FleetPoint = Schema.Struct({ "latitude": BrowserPrimitiveConstraint16, "longitude": BrowserPrimitiveConstraint16, "quality": Schema.Literals(["good", "uncertain"]), "freshness": Schema.Literals(["fresh", "stale", "future"]), "latitude_change": PropertyHistoryChange, "longitude_change": PropertyHistoryChange }).annotate({ "identifier": "FleetPoint" })
export type CurrentPropertyItem = { readonly "freshness": "fresh" | "stale" | "future", readonly "change": PropertyHistoryChange }
export const CurrentPropertyItem = Schema.Struct({ "freshness": Schema.Literals(["fresh", "stale", "future"]), "change": PropertyHistoryChange }).annotate({ "identifier": "CurrentPropertyItem" })
export type PropertyHistoryPage = { readonly "changes": ReadonlyArray<PropertyHistoryChange>, readonly "next_after": HistoryToken | null, readonly "coverage"?: PropertyHistoryCoverage }
export const PropertyHistoryPage = Schema.Struct({ "changes": Schema.Array(PropertyHistoryChange).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([HistoryToken, Schema.Null], { mode: "oneOf" }), "coverage": Schema.optionalKey(PropertyHistoryCoverage) }).annotate({ "identifier": "PropertyHistoryPage" })
export type AlertPage = { readonly "alerts": ReadonlyArray<AlertSummary>, readonly "next_after": AlertReadCursor | null }
export const AlertPage = Schema.Struct({ "alerts": Schema.Array(AlertSummary).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([AlertReadCursor, Schema.Null]) }).annotate({ "identifier": "AlertPage" })
export type AlertDetail = { readonly "alert": AlertSummary, readonly "definition": AlertRuleDefinition }
export const AlertDetail = Schema.Struct({ "alert": AlertSummary, "definition": AlertRuleDefinition }).annotate({ "identifier": "AlertDetail" })
export type AssetBindingSnapshot = { readonly "asset_id": BrowserPrimitiveConstraint16, readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const AssetBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "asset_id": BrowserPrimitiveConstraint16, "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "AssetBindingSnapshot" })
export type SourceBindingSnapshot = { readonly "source": SignalSource, readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "bindings": ReadonlyArray<SignalBinding>, readonly "next_after": string | null } & { readonly [x: string]: Schema.Json }
export const SourceBindingSnapshot = Schema.StructWithRest(Schema.Struct({ "source": SignalSource, "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "bindings": Schema.Array(SignalBinding).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }), [Schema.Record(Schema.String, Schema.Json.annotate({ "expected": "JSON value" }))]).annotate({ "identifier": "SourceBindingSnapshot" })
export type FleetLocation = { readonly "status": "unmapped" | "incompatible_mapping" | "missing" | "incoherent" | "invalid_coordinates" | "invalid_quality" } | { readonly "status": "observed", readonly "point": FleetPoint }
export const FleetLocation = Schema.Union([Schema.Struct({ "status": Schema.Literals(["unmapped", "incompatible_mapping", "missing", "incoherent", "invalid_coordinates", "invalid_quality"]) }), Schema.Struct({ "status": Schema.Literal("observed"), "point": FleetPoint })], { mode: "oneOf" }).annotate({ "identifier": "FleetLocation" })
export type CurrentPropertySnapshot = { readonly "generation": ProjectionCounter, readonly "revision": ProjectionCounter, readonly "processed_count": ProjectionCounter, readonly "pending": boolean, readonly "evaluated_at_ms": HistoryMillis, readonly "stale_after_ms": 30000, readonly "items": ReadonlyArray<CurrentPropertyItem> }
export const CurrentPropertySnapshot = Schema.Struct({ "generation": ProjectionCounter, "revision": ProjectionCounter, "processed_count": ProjectionCounter, "pending": Schema.Boolean, "evaluated_at_ms": HistoryMillis, "stale_after_ms": Schema.Literal(30000), "items": Schema.Array(CurrentPropertyItem).check(Schema.isMaxLength(1).annotate({ "expected": "a value with a length of at most 1" })) }).annotate({ "identifier": "CurrentPropertySnapshot" })
export type FleetAsset = { readonly "asset_id": BrowserPrimitiveConstraint16, readonly "display_name": string, readonly "asset_type": AssetTypeRef, readonly "location": FleetLocation }
export const FleetAsset = Schema.Struct({ "asset_id": BrowserPrimitiveConstraint16, "display_name": Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(200).annotate({ "expected": "a string with at most 200 code points" })), "asset_type": AssetTypeRef, "location": FleetLocation }).annotate({ "identifier": "FleetAsset" })
export type FleetSnapshot = { readonly "generation": ProjectionCounter, readonly "revision": ProjectionCounter, readonly "pending": boolean, readonly "evaluated_at_ms": HistoryMillis, readonly "stale_after_ms": 30000, readonly "mapping": FleetLocationMapping, readonly "mapping_supported": boolean, readonly "summary": FleetSummary, readonly "assets": ReadonlyArray<FleetAsset>, readonly "next_after": string | null }
export const FleetSnapshot = Schema.Struct({ "generation": ProjectionCounter, "revision": ProjectionCounter, "pending": Schema.Boolean, "evaluated_at_ms": HistoryMillis, "stale_after_ms": Schema.Literal(30000), "mapping": FleetLocationMapping, "mapping_supported": Schema.Boolean, "summary": FleetSummary, "assets": Schema.Array(FleetAsset).check(Schema.isMaxLength(100).annotate({ "expected": "a value with a length of at most 100" })), "next_after": Schema.Union([Schema.String.check(Schema.isMinLength(1).annotate({ "expected": "a value with a length of at least 1" })).check(Schema.isMaxCodePoints(128).annotate({ "expected": "a string with at most 128 code points" })), Schema.Null]) }).annotate({ "identifier": "FleetSnapshot" })
// schemas
export type RequestArchiveRestoreParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const RequestArchiveRestoreParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type RequestArchiveRestore202 = RestoreJob
export const RequestArchiveRestore202 = RestoreJob
export type RequestArchiveRestore400 = Problem
export const RequestArchiveRestore400 = Problem
export type RequestArchiveRestore401 = Problem
export const RequestArchiveRestore401 = Problem
export type RequestArchiveRestore403 = Problem
export const RequestArchiveRestore403 = Problem
export type RequestArchiveRestore404 = Problem
export const RequestArchiveRestore404 = Problem
export type RequestArchiveRestore409 = Problem
export const RequestArchiveRestore409 = Problem
export type RequestArchiveRestore429 = Problem
export const RequestArchiveRestore429 = Problem
export type RequestArchiveRestore500 = Problem
export const RequestArchiveRestore500 = Problem
export type RequestArchiveRestore503 = Problem
export const RequestArchiveRestore503 = Problem
export type GetArchiveRestoreStatus200 = RestoreJob
export const GetArchiveRestoreStatus200 = RestoreJob
export type GetArchiveRestoreStatus400 = Problem
export const GetArchiveRestoreStatus400 = Problem
export type GetArchiveRestoreStatus401 = Problem
export const GetArchiveRestoreStatus401 = Problem
export type GetArchiveRestoreStatus403 = Problem
export const GetArchiveRestoreStatus403 = Problem
export type GetArchiveRestoreStatus404 = Problem
export const GetArchiveRestoreStatus404 = Problem
export type GetArchiveRestoreStatus500 = Problem
export const GetArchiveRestoreStatus500 = Problem
export type CreateHistoricalExportParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const CreateHistoricalExportParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type CreateHistoricalExportRequestJson = ExportCreateRequest
export const CreateHistoricalExportRequestJson = ExportCreateRequest
export type CreateHistoricalExport202 = ExportJob
export const CreateHistoricalExport202 = ExportJob
export type CreateHistoricalExport400 = Problem
export const CreateHistoricalExport400 = Problem
export type CreateHistoricalExport401 = Problem
export const CreateHistoricalExport401 = Problem
export type CreateHistoricalExport403 = Problem
export const CreateHistoricalExport403 = Problem
export type CreateHistoricalExport409 = Problem
export const CreateHistoricalExport409 = Problem
export type CreateHistoricalExport413 = Problem
export const CreateHistoricalExport413 = Problem
export type CreateHistoricalExport422 = Problem
export const CreateHistoricalExport422 = Problem
export type CreateHistoricalExport429 = Problem
export const CreateHistoricalExport429 = Problem
export type CreateHistoricalExport500 = Problem
export const CreateHistoricalExport500 = Problem
export type GetHistoricalExport200 = ExportJob
export const GetHistoricalExport200 = ExportJob
export type GetHistoricalExport400 = Problem
export const GetHistoricalExport400 = Problem
export type GetHistoricalExport401 = Problem
export const GetHistoricalExport401 = Problem
export type GetHistoricalExport403 = Problem
export const GetHistoricalExport403 = Problem
export type GetHistoricalExport404 = Problem
export const GetHistoricalExport404 = Problem
export type GetHistoricalExport500 = Problem
export const GetHistoricalExport500 = Problem
export type CancelHistoricalExportParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const CancelHistoricalExportParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type CancelHistoricalExport200 = ExportJob
export const CancelHistoricalExport200 = ExportJob
export type CancelHistoricalExport400 = Problem
export const CancelHistoricalExport400 = Problem
export type CancelHistoricalExport401 = Problem
export const CancelHistoricalExport401 = Problem
export type CancelHistoricalExport403 = Problem
export const CancelHistoricalExport403 = Problem
export type CancelHistoricalExport404 = Problem
export const CancelHistoricalExport404 = Problem
export type CancelHistoricalExport500 = Problem
export const CancelHistoricalExport500 = Problem
export type ListNumericSummariesParams = { readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "resolution_ms": BrowserPrimitiveConstraint5, readonly "limit"?: BrowserPrimitiveConstraint24, readonly "after"?: HistoryToken, readonly "manifest_id"?: HistoryRestoreId, readonly "restore_generation"?: HistoryRestoreId }
export const ListNumericSummariesParams = Schema.Struct({ "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "resolution_ms": BrowserPrimitiveConstraint5, "limit": Schema.optionalKey(BrowserPrimitiveConstraint24), "after": Schema.optionalKey(HistoryToken), "manifest_id": Schema.optionalKey(HistoryRestoreId), "restore_generation": Schema.optionalKey(HistoryRestoreId) })
export type ListNumericSummaries200 = NumericSummaryPage
export const ListNumericSummaries200 = NumericSummaryPage
export type ListNumericSummaries400 = Problem
export const ListNumericSummaries400 = Problem
export type ListNumericSummaries401 = Problem
export const ListNumericSummaries401 = Problem
export type ListNumericSummaries403 = Problem
export const ListNumericSummaries403 = Problem
export type ListNumericSummaries404 = Problem
export const ListNumericSummaries404 = Problem
export type ListNumericSummaries429 = Problem
export const ListNumericSummaries429 = Problem
export type ListNumericSummaries500 = Problem
export const ListNumericSummaries500 = Problem
export type GetWorkDiagnostics200 = WorkDiagnostics
export const GetWorkDiagnostics200 = WorkDiagnostics
export type GetWorkDiagnostics401 = Problem
export const GetWorkDiagnostics401 = Problem
export type GetWorkDiagnostics403 = Problem
export const GetWorkDiagnostics403 = Problem
export type GetWorkDiagnostics405 = Problem
export const GetWorkDiagnostics405 = Problem
export type GetWorkDiagnostics500 = Problem
export const GetWorkDiagnostics500 = Problem
export type GetWorkRecoveryTargets200 = WorkRecoveryTargets
export const GetWorkRecoveryTargets200 = WorkRecoveryTargets
export type GetWorkRecoveryTargets400 = Problem
export const GetWorkRecoveryTargets400 = Problem
export type GetWorkRecoveryTargets401 = Problem
export const GetWorkRecoveryTargets401 = Problem
export type GetWorkRecoveryTargets403 = Problem
export const GetWorkRecoveryTargets403 = Problem
export type GetWorkRecoveryTargets405 = Problem
export const GetWorkRecoveryTargets405 = Problem
export type GetWorkRecoveryTargets500 = Problem
export const GetWorkRecoveryTargets500 = Problem
export type ApplyWorkRecoveryParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const ApplyWorkRecoveryParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type ApplyWorkRecoveryRequestJson = WorkRecoveryCommand
export const ApplyWorkRecoveryRequestJson = WorkRecoveryCommand
export type ApplyWorkRecovery200 = WorkRecoveryReceipt
export const ApplyWorkRecovery200 = WorkRecoveryReceipt
export type ApplyWorkRecovery400 = Problem
export const ApplyWorkRecovery400 = Problem
export type ApplyWorkRecovery401 = Problem
export const ApplyWorkRecovery401 = Problem
export type ApplyWorkRecovery403 = Problem
export const ApplyWorkRecovery403 = Problem
export type ApplyWorkRecovery405 = Problem
export const ApplyWorkRecovery405 = Problem
export type ApplyWorkRecovery409 = Problem
export const ApplyWorkRecovery409 = Problem
export type ApplyWorkRecovery500 = Problem
export const ApplyWorkRecovery500 = Problem
export type AcknowledgeAlertParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const AcknowledgeAlertParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type AcknowledgeAlertRequestJson = AlertAcknowledgementRequest
export const AcknowledgeAlertRequestJson = AlertAcknowledgementRequest
export type AcknowledgeAlert200 = AlertAcknowledgement
export const AcknowledgeAlert200 = AlertAcknowledgement
export type AcknowledgeAlert400 = Problem
export const AcknowledgeAlert400 = Problem
export type AcknowledgeAlert401 = Problem
export const AcknowledgeAlert401 = Problem
export type AcknowledgeAlert403 = Problem
export const AcknowledgeAlert403 = Problem
export type AcknowledgeAlert405 = Problem
export const AcknowledgeAlert405 = Problem
export type AcknowledgeAlert409 = Problem
export const AcknowledgeAlert409 = Problem
export type AcknowledgeAlert500 = Problem
export const AcknowledgeAlert500 = Problem
export type GetAlertRuleHead200 = AlertRuleHead
export const GetAlertRuleHead200 = AlertRuleHead
export type GetAlertRuleHead400 = Problem
export const GetAlertRuleHead400 = Problem
export type GetAlertRuleHead401 = Problem
export const GetAlertRuleHead401 = Problem
export type GetAlertRuleHead403 = Problem
export const GetAlertRuleHead403 = Problem
export type GetAlertRuleHead404 = Problem
export const GetAlertRuleHead404 = Problem
export type GetAlertRuleHead405 = Problem
export const GetAlertRuleHead405 = Problem
export type GetAlertRuleHead500 = Problem
export const GetAlertRuleHead500 = Problem
export type GetAlertRuleRevision200 = AlertRuleRevision
export const GetAlertRuleRevision200 = AlertRuleRevision
export type GetAlertRuleRevision400 = Problem
export const GetAlertRuleRevision400 = Problem
export type GetAlertRuleRevision401 = Problem
export const GetAlertRuleRevision401 = Problem
export type GetAlertRuleRevision403 = Problem
export const GetAlertRuleRevision403 = Problem
export type GetAlertRuleRevision404 = Problem
export const GetAlertRuleRevision404 = Problem
export type GetAlertRuleRevision405 = Problem
export const GetAlertRuleRevision405 = Problem
export type GetAlertRuleRevision500 = Problem
export const GetAlertRuleRevision500 = Problem
export type CreateAlertRuleRevisionParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const CreateAlertRuleRevisionParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type CreateAlertRuleRevisionRequestJson = AlertRuleDefinition
export const CreateAlertRuleRevisionRequestJson = AlertRuleDefinition
export type CreateAlertRuleRevision200 = AlertRuleRevisionReceipt
export const CreateAlertRuleRevision200 = AlertRuleRevisionReceipt
export type CreateAlertRuleRevision400 = Problem
export const CreateAlertRuleRevision400 = Problem
export type CreateAlertRuleRevision401 = Problem
export const CreateAlertRuleRevision401 = Problem
export type CreateAlertRuleRevision403 = Problem
export const CreateAlertRuleRevision403 = Problem
export type CreateAlertRuleRevision405 = Problem
export const CreateAlertRuleRevision405 = Problem
export type CreateAlertRuleRevision409 = Problem
export const CreateAlertRuleRevision409 = Problem
export type CreateAlertRuleRevision500 = Problem
export const CreateAlertRuleRevision500 = Problem
export type ChangeAlertRuleActivationParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const ChangeAlertRuleActivationParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
export type ChangeAlertRuleActivationRequestJson = AlertRuleActivationRequest
export const ChangeAlertRuleActivationRequestJson = AlertRuleActivationRequest
export type ChangeAlertRuleActivation200 = AlertRuleActivationState
export const ChangeAlertRuleActivation200 = AlertRuleActivationState
export type ChangeAlertRuleActivation400 = Problem
export const ChangeAlertRuleActivation400 = Problem
export type ChangeAlertRuleActivation401 = Problem
export const ChangeAlertRuleActivation401 = Problem
export type ChangeAlertRuleActivation403 = Problem
export const ChangeAlertRuleActivation403 = Problem
export type ChangeAlertRuleActivation405 = Problem
export const ChangeAlertRuleActivation405 = Problem
export type ChangeAlertRuleActivation409 = Problem
export const ChangeAlertRuleActivation409 = Problem
export type ChangeAlertRuleActivation500 = Problem
export const ChangeAlertRuleActivation500 = Problem
export type ListAlertsParams = { readonly "phase"?: AlertPhase, readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: AlertReadCursor }
export const ListAlertsParams = Schema.Struct({ "phase": Schema.optionalKey(AlertPhase), "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(AlertReadCursor) })
export type ListAlerts200 = AlertPage
export const ListAlerts200 = AlertPage
export type ListAlerts400 = Problem
export const ListAlerts400 = Problem
export type ListAlerts401 = Problem
export const ListAlerts401 = Problem
export type ListAlerts403 = Problem
export const ListAlerts403 = Problem
export type ListAlerts405 = Problem
export const ListAlerts405 = Problem
export type ListAlerts500 = Problem
export const ListAlerts500 = Problem
export type GetAlert200 = AlertDetail
export const GetAlert200 = AlertDetail
export type GetAlert400 = Problem
export const GetAlert400 = Problem
export type GetAlert401 = Problem
export const GetAlert401 = Problem
export type GetAlert403 = Problem
export const GetAlert403 = Problem
export type GetAlert404 = Problem
export const GetAlert404 = Problem
export type GetAlert405 = Problem
export const GetAlert405 = Problem
export type GetAlert500 = Problem
export const GetAlert500 = Problem
export type ListAlertTransitionsParams = { readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: AlertReadCursor }
export const ListAlertTransitionsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(AlertReadCursor) })
export type ListAlertTransitions200 = AlertTransitionPage
export const ListAlertTransitions200 = AlertTransitionPage
export type ListAlertTransitions400 = Problem
export const ListAlertTransitions400 = Problem
export type ListAlertTransitions401 = Problem
export const ListAlertTransitions401 = Problem
export type ListAlertTransitions403 = Problem
export const ListAlertTransitions403 = Problem
export type ListAlertTransitions404 = Problem
export const ListAlertTransitions404 = Problem
export type ListAlertTransitions405 = Problem
export const ListAlertTransitions405 = Problem
export type ListAlertTransitions500 = Problem
export const ListAlertTransitions500 = Problem
export type GetCalculatorEvaluationEvidence200 = CalculatorEvaluationEvidence
export const GetCalculatorEvaluationEvidence200 = CalculatorEvaluationEvidence
export type GetCalculatorEvaluationEvidence400 = Problem
export const GetCalculatorEvaluationEvidence400 = Problem
export type GetCalculatorEvaluationEvidence401 = Problem
export const GetCalculatorEvaluationEvidence401 = Problem
export type GetCalculatorEvaluationEvidence403 = Problem
export const GetCalculatorEvaluationEvidence403 = Problem
export type GetCalculatorEvaluationEvidence404 = Problem
export const GetCalculatorEvaluationEvidence404 = Problem
export type GetCalculatorEvaluationEvidence405 = Problem
export const GetCalculatorEvaluationEvidence405 = Problem
export type GetCalculatorEvaluationEvidence500 = Problem
export const GetCalculatorEvaluationEvidence500 = Problem
export type ListCalculatorEvaluationOutputsParams = { readonly "limit"?: BrowserPrimitiveConstraint26, readonly "after"?: CalculatorEvidenceCursor }
export const ListCalculatorEvaluationOutputsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint26), "after": Schema.optionalKey(CalculatorEvidenceCursor) })
export type ListCalculatorEvaluationOutputs200 = CalculatorOutputPage
export const ListCalculatorEvaluationOutputs200 = CalculatorOutputPage
export type ListCalculatorEvaluationOutputs400 = Problem
export const ListCalculatorEvaluationOutputs400 = Problem
export type ListCalculatorEvaluationOutputs401 = Problem
export const ListCalculatorEvaluationOutputs401 = Problem
export type ListCalculatorEvaluationOutputs403 = Problem
export const ListCalculatorEvaluationOutputs403 = Problem
export type ListCalculatorEvaluationOutputs404 = Problem
export const ListCalculatorEvaluationOutputs404 = Problem
export type ListCalculatorEvaluationOutputs405 = Problem
export const ListCalculatorEvaluationOutputs405 = Problem
export type ListCalculatorEvaluationOutputs500 = Problem
export const ListCalculatorEvaluationOutputs500 = Problem
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
export type AppendSignalBindingRevisionParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const AppendSignalBindingRevisionParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
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
export type ListRelationshipTypeDefinitionsParams = { readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after_id"?: AdministrationIdentifier, readonly "after_version"?: BrowserPrimitiveConstraint4 }
export const ListRelationshipTypeDefinitionsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after_id": Schema.optionalKey(AdministrationIdentifier), "after_version": Schema.optionalKey(BrowserPrimitiveConstraint4) })
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
export type AppendRelationshipRevisionParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const AppendRelationshipRevisionParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
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
export type GetFleetSnapshotParams = { readonly "latitude_property": BrowserPrimitiveConstraint16, readonly "longitude_property": BrowserPrimitiveConstraint16, readonly "latitude_version": BrowserPrimitiveConstraint4, readonly "longitude_version": BrowserPrimitiveConstraint4, readonly "encoding": "degrees" | "e7", readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const GetFleetSnapshotParams = Schema.Struct({ "latitude_property": BrowserPrimitiveConstraint16, "longitude_property": BrowserPrimitiveConstraint16, "latitude_version": BrowserPrimitiveConstraint4, "longitude_version": BrowserPrimitiveConstraint4, "encoding": Schema.Literals(["degrees", "e7"]), "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type StreamCurrentPropertyParams = { readonly "Last-Event-ID"?: BrowserPrimitiveConstraint28 }
export const StreamCurrentPropertyParams = Schema.Struct({ "Last-Event-ID": Schema.optionalKey(BrowserPrimitiveConstraint28) })
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
export type ListPropertyHistoryParams = { readonly "start_at_ms": HistoryMillis, readonly "end_at_ms": HistoryMillis, readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: HistoryToken, readonly "mode"?: "hot" | "hot_and_restored", readonly "manifest_id"?: HistoryRestoreId, readonly "restore_generation"?: HistoryRestoreId }
export const ListPropertyHistoryParams = Schema.Struct({ "start_at_ms": HistoryMillis, "end_at_ms": HistoryMillis, "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(HistoryToken), "mode": Schema.optionalKey(Schema.Literals(["hot", "hot_and_restored"]).annotate({ "default": "hot" })), "manifest_id": Schema.optionalKey(HistoryRestoreId), "restore_generation": Schema.optionalKey(HistoryRestoreId) })
export type ListPropertyHistory200 = PropertyHistoryPage
export const ListPropertyHistory200 = PropertyHistoryPage
export type ListPropertyHistory400 = Problem
export const ListPropertyHistory400 = Problem
export type ListPropertyHistory401 = Problem
export const ListPropertyHistory401 = Problem
export type ListPropertyHistory403 = Problem
export const ListPropertyHistory403 = Problem
export type ListPropertyHistory409 = Problem
export const ListPropertyHistory409 = Problem
export type ListPropertyHistory429 = Problem
export const ListPropertyHistory429 = Problem
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
export type GetPropertyInterpretation409 = Problem
export const GetPropertyInterpretation409 = Problem
export type GetPropertyInterpretation429 = Problem
export const GetPropertyInterpretation429 = Problem
export type GetPropertyInterpretation500 = Problem
export const GetPropertyInterpretation500 = Problem
export type ListOperatorTenantsParams = { readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const ListOperatorTenantsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type ListAssetsParams = { readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const ListAssetsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type RegisterAssetParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const RegisterAssetParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
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
export type ListAssetRelationshipsParams = { readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const ListAssetRelationshipsParams = Schema.Struct({ "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type ListAssetSignalBindingsParams = { readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const ListAssetSignalBindingsParams = Schema.Struct({ "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type ListSourceSignalBindingsParams = { readonly "device_asset_id": BrowserPrimitiveConstraint16, readonly "endpoint_id": BrowserPrimitiveConstraint16, readonly "signal_id": BrowserPrimitiveConstraint16, readonly "effective_at_ms": BrowserPrimitiveConstraint18, readonly "known_at_ms": BrowserPrimitiveConstraint18, readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after"?: BrowserPrimitiveConstraint16 }
export const ListSourceSignalBindingsParams = Schema.Struct({ "device_asset_id": BrowserPrimitiveConstraint16, "endpoint_id": BrowserPrimitiveConstraint16, "signal_id": BrowserPrimitiveConstraint16, "effective_at_ms": BrowserPrimitiveConstraint18, "known_at_ms": BrowserPrimitiveConstraint18, "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after": Schema.optionalKey(BrowserPrimitiveConstraint16) })
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
export type CompleteOperatorLoginParams = { readonly "code"?: BrowserPrimitiveConstraint15, readonly "state": BrowserPrimitiveConstraint29, readonly "error"?: BrowserPrimitiveConstraint1 }
export const CompleteOperatorLoginParams = Schema.Struct({ "code": Schema.optionalKey(BrowserPrimitiveConstraint15), "state": BrowserPrimitiveConstraint29, "error": Schema.optionalKey(BrowserPrimitiveConstraint1) })
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
export type EndOperatorSessionParams = { readonly "Origin": BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF": "1" }
export const EndOperatorSessionParams = Schema.Struct({ "Origin": BrowserPrimitiveConstraint1, "X-FleetIQ-CSRF": Schema.Literal("1") })
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
export type RegisterCommunicationDeviceParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const RegisterCommunicationDeviceParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
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
export type ListAssetTypeDefinitionsParams = { readonly "limit"?: BrowserPrimitiveConstraint25, readonly "after_id"?: AdministrationIdentifier, readonly "after_version"?: BrowserPrimitiveConstraint4 }
export const ListAssetTypeDefinitionsParams = Schema.Struct({ "limit": Schema.optionalKey(BrowserPrimitiveConstraint25), "after_id": Schema.optionalKey(AdministrationIdentifier), "after_version": Schema.optionalKey(BrowserPrimitiveConstraint4) })
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
export type ChangeDeviceProtocolRouteParams = { readonly "Origin"?: BrowserPrimitiveConstraint1, readonly "X-FleetIQ-CSRF"?: "1" }
export const ChangeDeviceProtocolRouteParams = Schema.Struct({ "Origin": Schema.optionalKey(BrowserPrimitiveConstraint1), "X-FleetIQ-CSRF": Schema.optionalKey(Schema.Literal("1")) })
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
  function decodeProblems<Prefix extends string, Status extends number>(prefix: Prefix, statuses: readonly Status[]) {
    const entries = statuses.map((status) =>
      [status, decodeError((prefix + status) as `${Prefix}${Status}`, Problem)] as const
    );
    return Object.fromEntries(entries) as Record<Status, (typeof entries)[number][1]>;
  }
  const tenantPathPrefix = "/api/v1/tenants/"
  function respond(config: OperationConfig | undefined, schema: Schema.ConstraintDecoder<unknown, never>, prefix: string, statuses: readonly number[]) {
    return withResponse(config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(schema),
      ...decodeProblems(prefix, statuses),
      orElse: unexpectedStatus
    }))
  }
  function mutationHeaders(params: { readonly Origin?: string | undefined; readonly "X-FleetIQ-CSRF"?: string | undefined } | undefined) {
    return HttpClientRequest.setHeaders({ Origin: params?.Origin, "X-FleetIQ-CSRF": params?.["X-FleetIQ-CSRF"] })
  }
  return {
    httpClient,
    "requestArchiveRestore": (tenantId, manifestId, expectedGeneration, options: Parameters<FleetIqApi["requestArchiveRestore"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, manifestId, expectedGeneration], () => tenantPathPrefix + __encodePathParam(tenantId) + "/restores/manifests/" + __encodePathParam(manifestId) + "/requests/" + __encodePathParam(expectedGeneration) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options?.params),
      respond(options?.config, RequestArchiveRestore202, "RequestArchiveRestore", [400, 401, 403, 404, 409, 429, 500, 503])
    ))
  ),
    "getArchiveRestoreStatus": (tenantId, manifestId, restoreGeneration, options: Parameters<FleetIqApi["getArchiveRestoreStatus"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, manifestId, restoreGeneration], () => tenantPathPrefix + __encodePathParam(tenantId) + "/restores/manifests/" + __encodePathParam(manifestId) + "/generations/" + __encodePathParam(restoreGeneration) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetArchiveRestoreStatus200, "GetArchiveRestoreStatus", [400, 401, 403, 404, 500])
    ))
  ),
    "createHistoricalExport": (tenantId, requestKey, options: Parameters<FleetIqApi["createHistoricalExport"]>[2]) => __makePathRequest(HttpClientRequest.put, [tenantId, requestKey], () => tenantPathPrefix + __encodePathParam(tenantId) + "/exports/requests/" + __encodePathParam(requestKey) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, CreateHistoricalExport202, "CreateHistoricalExport", [400, 401, 403, 409, 413, 422, 429, 500])
    ))
  ),
    "getHistoricalExport": (tenantId, exportId, options: Parameters<FleetIqApi["getHistoricalExport"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, exportId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/exports/jobs/" + __encodePathParam(exportId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetHistoricalExport200, "GetHistoricalExport", [400, 401, 403, 404, 500])
    ))
  ),
    "cancelHistoricalExport": (tenantId, exportId, options: Parameters<FleetIqApi["cancelHistoricalExport"]>[2]) => __makePathRequest(HttpClientRequest.delete, [tenantId, exportId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/exports/jobs/" + __encodePathParam(exportId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options?.params),
      respond(options?.config, CancelHistoricalExport200, "CancelHistoricalExport", [400, 401, 403, 404, 500])
    ))
  ),
    "listNumericSummaries": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["listNumericSummaries"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/summaries").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "start_at_ms": options.params["start_at_ms"] as any, "end_at_ms": options.params["end_at_ms"] as any, "resolution_ms": options.params["resolution_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any, "manifest_id": options.params["manifest_id"] as any, "restore_generation": options.params["restore_generation"] as any }),
      respond(options.config, ListNumericSummaries200, "ListNumericSummaries", [400, 401, 403, 404, 429, 500])
    ))
  ),
    "getWorkDiagnostics": (tenantId, options: Parameters<FleetIqApi["getWorkDiagnostics"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/work-diagnostics").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetWorkDiagnostics200, "GetWorkDiagnostics", [401, 403, 405, 500])
    ))
  ),
    "getWorkRecoveryTargets": (tenantId, kind, options: Parameters<FleetIqApi["getWorkRecoveryTargets"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, kind], () => tenantPathPrefix + __encodePathParam(tenantId) + "/work-recovery/" + __encodePathParam(kind) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetWorkRecoveryTargets200, "GetWorkRecoveryTargets", [400, 401, 403, 405, 500])
    ))
  ),
    "applyWorkRecovery": (tenantId, kind, requestId, options: Parameters<FleetIqApi["applyWorkRecovery"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, kind, requestId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/work-recovery/" + __encodePathParam(kind) + "/commands/" + __encodePathParam(requestId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, ApplyWorkRecovery200, "ApplyWorkRecovery", [400, 401, 403, 405, 409, 500])
    ))
  ),
    "acknowledgeAlert": (tenantId, ruleId, revision, options: Parameters<FleetIqApi["acknowledgeAlert"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, ruleId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alerts/" + __encodePathParam(ruleId) + "/revisions/" + __encodePathParam(revision) + "/acknowledgement").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, AcknowledgeAlert200, "AcknowledgeAlert", [400, 401, 403, 405, 409, 500])
    ))
  ),
    "getAlertRuleHead": (tenantId, ruleId, options: Parameters<FleetIqApi["getAlertRuleHead"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, ruleId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alert-rules/" + __encodePathParam(ruleId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetAlertRuleHead200, "GetAlertRuleHead", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "getAlertRuleRevision": (tenantId, ruleId, revision, options: Parameters<FleetIqApi["getAlertRuleRevision"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, ruleId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alert-rules/" + __encodePathParam(ruleId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetAlertRuleRevision200, "GetAlertRuleRevision", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "createAlertRuleRevision": (tenantId, ruleId, revision, options: Parameters<FleetIqApi["createAlertRuleRevision"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, ruleId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alert-rules/" + __encodePathParam(ruleId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, CreateAlertRuleRevision200, "CreateAlertRuleRevision", [400, 401, 403, 405, 409, 500])
    ))
  ),
    "changeAlertRuleActivation": (tenantId, ruleId, options: Parameters<FleetIqApi["changeAlertRuleActivation"]>[2]) => __makePathRequest(HttpClientRequest.put, [tenantId, ruleId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alert-rules/" + __encodePathParam(ruleId) + "/activation").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, ChangeAlertRuleActivation200, "ChangeAlertRuleActivation", [400, 401, 403, 405, 409, 500])
    ))
  ),
    "listAlerts": (tenantId, options: Parameters<FleetIqApi["listAlerts"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alerts").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "phase": options?.params?.["phase"] as any, "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      respond(options?.config, ListAlerts200, "ListAlerts", [400, 401, 403, 405, 500])
    ))
  ),
    "getAlert": (tenantId, ruleId, revision, options: Parameters<FleetIqApi["getAlert"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, ruleId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alerts/" + __encodePathParam(ruleId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetAlert200, "GetAlert", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "listAlertTransitions": (tenantId, ruleId, revision, options: Parameters<FleetIqApi["listAlertTransitions"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, ruleId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/alerts/" + __encodePathParam(ruleId) + "/revisions/" + __encodePathParam(revision) + "/transitions").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      respond(options?.config, ListAlertTransitions200, "ListAlertTransitions", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "getCalculatorEvaluationEvidence": (tenantId, assetId, evaluationId, options: Parameters<FleetIqApi["getCalculatorEvaluationEvidence"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, evaluationId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/calculator-evaluations/" + __encodePathParam(evaluationId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetCalculatorEvaluationEvidence200, "GetCalculatorEvaluationEvidence", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "listCalculatorEvaluationOutputs": (tenantId, assetId, evaluationId, options: Parameters<FleetIqApi["listCalculatorEvaluationOutputs"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, evaluationId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/calculator-evaluations/" + __encodePathParam(evaluationId) + "/outputs").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      respond(options?.config, ListCalculatorEvaluationOutputs200, "ListCalculatorEvaluationOutputs", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "getSignalBindingRevision": (tenantId, bindingId, revision, options: Parameters<FleetIqApi["getSignalBindingRevision"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, bindingId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/signal-bindings/" + __encodePathParam(bindingId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetSignalBindingRevision200, "GetSignalBindingRevision", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "appendSignalBindingRevision": (tenantId, bindingId, revision, options: Parameters<FleetIqApi["appendSignalBindingRevision"]>[3]) => __makePathRequest(HttpClientRequest.post, [tenantId, bindingId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/signal-bindings/" + __encodePathParam(bindingId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(AppendSignalBindingRevision200),
      "201": decodeSuccess(AppendSignalBindingRevision201),
      ...decodeProblems("AppendSignalBindingRevision", [400, 401, 403, 404, 405, 409, 500]),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listRelationshipTypeDefinitions": (tenantId, options: Parameters<FleetIqApi["listRelationshipTypeDefinitions"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/relationship-types").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after_id": options?.params?.["after_id"] as any, "after_version": options?.params?.["after_version"] as any }),
      respond(options?.config, ListRelationshipTypeDefinitions200, "ListRelationshipTypeDefinitions", [400, 401, 403, 405, 500])
    ))
  ),
    "appendRelationshipRevision": (tenantId, relationshipId, revision, options: Parameters<FleetIqApi["appendRelationshipRevision"]>[3]) => __makePathRequest(HttpClientRequest.post, [tenantId, relationshipId, revision], () => tenantPathPrefix + __encodePathParam(tenantId) + "/relationships/" + __encodePathParam(relationshipId) + "/revisions/" + __encodePathParam(revision) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(AppendRelationshipRevision200),
      "201": decodeSuccess(AppendRelationshipRevision201),
      ...decodeProblems("AppendRelationshipRevision", [400, 401, 403, 404, 405, 409, 500]),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getFleetSnapshot": (tenantId, options: Parameters<FleetIqApi["getFleetSnapshot"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/fleet").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "latitude_property": options.params["latitude_property"] as any, "longitude_property": options.params["longitude_property"] as any, "latitude_version": options.params["latitude_version"] as any, "longitude_version": options.params["longitude_version"] as any, "encoding": options.params["encoding"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      respond(options.config, GetFleetSnapshot200, "GetFleetSnapshot", [400, 401, 403, 404, 500])
    ))
  ),
    "streamCurrentProperty": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["streamCurrentProperty"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/live").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Last-Event-ID": options?.params?.["Last-Event-ID"] ?? undefined }),
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      ...decodeProblems("StreamCurrentProperty", [400, 401, 403, 404, 429, 500]),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "streamCurrentPropertySse": (tenantId, assetId, propertyId, version, options) => Stream.unwrap(__makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/live").pipe(
    Effect.map((request) => request.pipe(
      HttpClientRequest.setHeaders({ "Last-Event-ID": options?.params?.["Last-Event-ID"] ?? undefined }),
      sseRequest(StreamCurrentProperty200Sse)
    ))
  )),
    "getCurrentPropertySnapshot": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["getCurrentPropertySnapshot"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/current").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetCurrentPropertySnapshot200, "GetCurrentPropertySnapshot", [400, 401, 403, 404, 500])
    ))
  ),
    "listPropertyHistory": (tenantId, assetId, propertyId, version, options: Parameters<FleetIqApi["listPropertyHistory"]>[4]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/history").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "start_at_ms": options.params["start_at_ms"] as any, "end_at_ms": options.params["end_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any, "mode": options.params["mode"] as any, "manifest_id": options.params["manifest_id"] as any, "restore_generation": options.params["restore_generation"] as any }),
      respond(options.config, ListPropertyHistory200, "ListPropertyHistory", [400, 401, 403, 409, 429, 500])
    ))
  ),
    "getPropertyInterpretation": (tenantId, assetId, propertyId, version, interpretation, options: Parameters<FleetIqApi["getPropertyInterpretation"]>[5]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, propertyId, version, interpretation], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "/interpretations/" + __encodePathParam(interpretation) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetPropertyInterpretation200, "GetPropertyInterpretation", [400, 401, 403, 404, 409, 429, 500])
    ))
  ),
    "listOperatorTenants": (options: Parameters<FleetIqApi["listOperatorTenants"]>[0]) => HttpClientRequest.get("/api/v1/me/tenants").pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      respond(options?.config, ListOperatorTenants200, "ListOperatorTenants", [400, 401, 500])
    ),
    "getApiVersion": (options: Parameters<FleetIqApi["getApiVersion"]>[0]) => HttpClientRequest.get("/api/v1").pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      "2xx": decodeSuccess(GetApiVersion200),
      orElse: unexpectedStatus
    }))
    ),
    "listAssets": (tenantId, options: Parameters<FleetIqApi["listAssets"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after": options?.params?.["after"] as any }),
      respond(options?.config, ListAssets200, "ListAssets", [400, 401, 403, 500])
    ))
  ),
    "registerAsset": (tenantId, options: Parameters<FleetIqApi["registerAsset"]>[1]) => __makePathRequest(HttpClientRequest.post, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(RegisterAsset200),
      "201": decodeSuccess(RegisterAsset201),
      ...decodeProblems("RegisterAsset", [400, 401, 403, 404, 405, 409, 500]),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "getAsset": (tenantId, assetId, options: Parameters<FleetIqApi["getAsset"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetAsset200, "GetAsset", [400, 401, 403, 404, 500])
    ))
  ),
    "listAssetRelationships": (tenantId, assetId, options: Parameters<FleetIqApi["listAssetRelationships"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/relationships").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      respond(options.config, ListAssetRelationships200, "ListAssetRelationships", [400, 401, 403, 404, 500])
    ))
  ),
    "listAssetSignalBindings": (tenantId, assetId, options: Parameters<FleetIqApi["listAssetSignalBindings"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/signal-bindings").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      respond(options.config, ListAssetSignalBindings200, "ListAssetSignalBindings", [400, 401, 403, 404, 500])
    ))
  ),
    "listSourceSignalBindings": (tenantId, options: Parameters<FleetIqApi["listSourceSignalBindings"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/signal-bindings").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "device_asset_id": options.params["device_asset_id"] as any, "endpoint_id": options.params["endpoint_id"] as any, "signal_id": options.params["signal_id"] as any, "effective_at_ms": options.params["effective_at_ms"] as any, "known_at_ms": options.params["known_at_ms"] as any, "limit": options.params["limit"] as any, "after": options.params["after"] as any }),
      respond(options.config, ListSourceSignalBindings200, "ListSourceSignalBindings", [400, 401, 403, 500])
    ))
  ),
    "getAssetTypeDefinition": (tenantId, typeId, version, options: Parameters<FleetIqApi["getAssetTypeDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, typeId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/asset-types/" + __encodePathParam(typeId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetAssetTypeDefinition200, "GetAssetTypeDefinition", [400, 401, 403, 404, 500])
    ))
  ),
    "getPropertyDefinition": (tenantId, propertyId, version, options: Parameters<FleetIqApi["getPropertyDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, propertyId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/properties/" + __encodePathParam(propertyId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetPropertyDefinition200, "GetPropertyDefinition", [400, 401, 403, 404, 500])
    ))
  ),
    "getRelationshipTypeDefinition": (tenantId, typeId, version, options: Parameters<FleetIqApi["getRelationshipTypeDefinition"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, typeId, version], () => tenantPathPrefix + __encodePathParam(tenantId) + "/relationship-types/" + __encodePathParam(typeId) + "/versions/" + __encodePathParam(version) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetRelationshipTypeDefinition200, "GetRelationshipTypeDefinition", [400, 401, 403, 404, 500])
    ))
  ),
    "beginOperatorLogin": (options: Parameters<FleetIqApi["beginOperatorLogin"]>[0]) => HttpClientRequest.get("/api/v1/auth/login").pipe(
      withResponse(options?.config)(HttpClientResponse.matchStatus({
      ...decodeProblems("BeginOperatorLogin", [401, 405, 500]),
      "303": () => Effect.void,
      orElse: unexpectedStatus
    }))
    ),
    "completeOperatorLogin": (options: Parameters<FleetIqApi["completeOperatorLogin"]>[0]) => HttpClientRequest.get("/api/v1/auth/callback").pipe(
      HttpClientRequest.setUrlParams({ "code": options.params["code"] as any, "state": options.params["state"] as any, "error": options.params["error"] as any }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      ...decodeProblems("CompleteOperatorLogin", [400, 401, 405, 500]),
      "303": () => Effect.void,
      orElse: unexpectedStatus
    }))
    ),
    "getOperatorSession": (options: Parameters<FleetIqApi["getOperatorSession"]>[0]) => HttpClientRequest.get("/api/v1/auth/session").pipe(
      respond(options?.config, GetOperatorSession200, "GetOperatorSession", [401, 405, 500])
    ),
    "endOperatorSession": (options: Parameters<FleetIqApi["endOperatorSession"]>[0]) => HttpClientRequest.post("/api/v1/auth/logout").pipe(
      HttpClientRequest.setHeaders({ "Origin": options.params["Origin"] ?? undefined, "X-FleetIQ-CSRF": options.params["X-FleetIQ-CSRF"] ?? undefined }),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      ...decodeProblems("EndOperatorSession", [401, 403, 405, 500]),
      "204": () => Effect.void,
      orElse: unexpectedStatus
    }))
    ),
    "getCommunicationDevice": (tenantId, assetId, options: Parameters<FleetIqApi["getCommunicationDevice"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/device").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetCommunicationDevice200, "GetCommunicationDevice", [400, 401, 403, 404, 405, 500])
    ))
  ),
    "registerCommunicationDevice": (tenantId, assetId, options: Parameters<FleetIqApi["registerCommunicationDevice"]>[2]) => __makePathRequest(HttpClientRequest.post, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/device").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      withResponse(options.config)(HttpClientResponse.matchStatus({
      "200": decodeSuccess(RegisterCommunicationDevice200),
      "201": decodeSuccess(RegisterCommunicationDevice201),
      ...decodeProblems("RegisterCommunicationDevice", [400, 401, 403, 404, 405, 409, 500]),
      orElse: unexpectedStatus
    }))
    ))
  ),
    "listAssetTypeDefinitions": (tenantId, options: Parameters<FleetIqApi["listAssetTypeDefinitions"]>[1]) => __makePathRequest(HttpClientRequest.get, [tenantId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/asset-types").pipe(
    Effect.flatMap((request) => request.pipe(
      HttpClientRequest.setUrlParams({ "limit": options?.params?.["limit"] as any, "after_id": options?.params?.["after_id"] as any, "after_version": options?.params?.["after_version"] as any }),
      respond(options?.config, ListAssetTypeDefinitions200, "ListAssetTypeDefinitions", [400, 401, 403, 405, 500])
    ))
  ),
    "getDeviceProtocolRoute": (tenantId, assetId, channelId, options: Parameters<FleetIqApi["getDeviceProtocolRoute"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId, channelId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/protocol-routes/" + __encodePathParam(channelId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetDeviceProtocolRoute200, "GetDeviceProtocolRoute", [400, 401, 403, 404, 500])
    ))
  ),
    "changeDeviceProtocolRoute": (tenantId, assetId, channelId, options: Parameters<FleetIqApi["changeDeviceProtocolRoute"]>[3]) => __makePathRequest(HttpClientRequest.put, [tenantId, assetId, channelId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/protocol-routes/" + __encodePathParam(channelId) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      mutationHeaders(options.params),
      HttpClientRequest.bodyJsonUnsafe(options.payload),
      respond(options.config, ChangeDeviceProtocolRoute200, "ChangeDeviceProtocolRoute", [400, 401, 403, 409, 500])
    ))
  ),
    "getProtocolPackageRelease": (tenantId, packageId, packageVersion, options: Parameters<FleetIqApi["getProtocolPackageRelease"]>[3]) => __makePathRequest(HttpClientRequest.get, [tenantId, packageId, packageVersion], () => tenantPathPrefix + __encodePathParam(tenantId) + "/protocol-packages/" + __encodePathParam(packageId) + "/versions/" + __encodePathParam(packageVersion) + "").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetProtocolPackageRelease200, "GetProtocolPackageRelease", [400, 401, 403, 404, 500])
    ))
  ),
    "getDeviceIngestionDiagnostics": (tenantId, assetId, options: Parameters<FleetIqApi["getDeviceIngestionDiagnostics"]>[2]) => __makePathRequest(HttpClientRequest.get, [tenantId, assetId], () => tenantPathPrefix + __encodePathParam(tenantId) + "/assets/" + __encodePathParam(assetId) + "/ingestion-diagnostics").pipe(
    Effect.flatMap((request) => request.pipe(
      respond(options?.config, GetDeviceIngestionDiagnostics200, "GetDeviceIngestionDiagnostics", [400, 401, 403, 404, 500])
    ))
  )
  }
}

export interface FleetIqApi {
  readonly httpClient: HttpClient.HttpClient
  /**
* Requires current telemetry.read and independent operations.manage for the same actor. Browser mutations require exact same-origin Origin and X-FleetIQ-CSRF: 1. Send an empty body and no query parameters. Select one published tenant manifest. Exact retries preserve generation and lifetime, including terminal results. An enabled lifecycle policy and configured archive storage are required. A pending request schedules at most one twenty-second attempt per submission, subject to eight concurrent attempts per listener and existing tenant reservations and leases. A failed attempt remains pending for exact retry.
*/
readonly "requestArchiveRestore": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, manifestId: string, expectedGeneration: string, options: { readonly params?: typeof RequestArchiveRestoreParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<RequestArchiveRestore202, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RequestArchiveRestore400", RequestArchiveRestore400> | FleetIqApiError<"RequestArchiveRestore401", RequestArchiveRestore401> | FleetIqApiError<"RequestArchiveRestore403", RequestArchiveRestore403> | FleetIqApiError<"RequestArchiveRestore404", RequestArchiveRestore404> | FleetIqApiError<"RequestArchiveRestore409", RequestArchiveRestore409> | FleetIqApiError<"RequestArchiveRestore429", RequestArchiveRestore429> | FleetIqApiError<"RequestArchiveRestore500", RequestArchiveRestore500> | FleetIqApiError<"RequestArchiveRestore503", RequestArchiveRestore503>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, manifestId: string, expectedGeneration: string, options: { readonly params?: typeof RequestArchiveRestoreParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<RequestArchiveRestore202, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"RequestArchiveRestore400", RequestArchiveRestore400> | FleetIqApiError<"RequestArchiveRestore401", RequestArchiveRestore401> | FleetIqApiError<"RequestArchiveRestore403", RequestArchiveRestore403> | FleetIqApiError<"RequestArchiveRestore404", RequestArchiveRestore404> | FleetIqApiError<"RequestArchiveRestore409", RequestArchiveRestore409> | FleetIqApiError<"RequestArchiveRestore429", RequestArchiveRestore429> | FleetIqApiError<"RequestArchiveRestore500", RequestArchiveRestore500> | FleetIqApiError<"RequestArchiveRestore503", RequestArchiveRestore503>>;
  }
  /**
* Requires current telemetry.read. Send no query parameters. Reads the exact tenant-owned manifest and request generation. Expired staging is unavailable even before physical cleanup. Missing or superseded generations return 404. Ready describes the selected manifest only.
*/
readonly "getArchiveRestoreStatus": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, manifestId: string, restoreGeneration: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetArchiveRestoreStatus200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetArchiveRestoreStatus400", GetArchiveRestoreStatus400> | FleetIqApiError<"GetArchiveRestoreStatus401", GetArchiveRestoreStatus401> | FleetIqApiError<"GetArchiveRestoreStatus403", GetArchiveRestoreStatus403> | FleetIqApiError<"GetArchiveRestoreStatus404", GetArchiveRestoreStatus404> | FleetIqApiError<"GetArchiveRestoreStatus500", GetArchiveRestoreStatus500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, manifestId: string, restoreGeneration: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetArchiveRestoreStatus200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetArchiveRestoreStatus400", GetArchiveRestoreStatus400> | FleetIqApiError<"GetArchiveRestoreStatus401", GetArchiveRestoreStatus401> | FleetIqApiError<"GetArchiveRestoreStatus403", GetArchiveRestoreStatus403> | FleetIqApiError<"GetArchiveRestoreStatus404", GetArchiveRestoreStatus404> | FleetIqApiError<"GetArchiveRestoreStatus500", GetArchiveRestoreStatus500>>;
  }
  /**
* Requires current telemetry.read and independent operations.manage for the same actor, with the listener-selected mutation guard. Browser mutations require exact same-origin Origin and X-FleetIQ-CSRF: 1. Closed JSON command, at most 4096 bytes; no unknown query parameters. Select exact target/version, half-open window up to seven days and optional manifest/restore_generation together. Up to 16 unique interpretations and a 2 MiB exact Parquet file; no truncation. Same request key preserves original selection/lifetime and never reopens terminal work. Creation materializes bounded staging and schedules one durable twenty-second attempt; global capture/worker capacity is eight. Pending retry can resume work after interruption. No startup scheduler. Enabled lifecycle policy charges one slot and 4 MiB for the live job. Capture coverage is explicit, not interval completeness.
*/
readonly "createHistoricalExport": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, requestKey: string, options: { readonly params?: typeof CreateHistoricalExportParams.Encoded | undefined; readonly payload: typeof CreateHistoricalExportRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<CreateHistoricalExport202, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CreateHistoricalExport400", CreateHistoricalExport400> | FleetIqApiError<"CreateHistoricalExport401", CreateHistoricalExport401> | FleetIqApiError<"CreateHistoricalExport403", CreateHistoricalExport403> | FleetIqApiError<"CreateHistoricalExport409", CreateHistoricalExport409> | FleetIqApiError<"CreateHistoricalExport413", CreateHistoricalExport413> | FleetIqApiError<"CreateHistoricalExport422", CreateHistoricalExport422> | FleetIqApiError<"CreateHistoricalExport429", CreateHistoricalExport429> | FleetIqApiError<"CreateHistoricalExport500", CreateHistoricalExport500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, requestKey: string, options: { readonly params?: typeof CreateHistoricalExportParams.Encoded | undefined; readonly payload: typeof CreateHistoricalExportRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<CreateHistoricalExport202, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CreateHistoricalExport400", CreateHistoricalExport400> | FleetIqApiError<"CreateHistoricalExport401", CreateHistoricalExport401> | FleetIqApiError<"CreateHistoricalExport403", CreateHistoricalExport403> | FleetIqApiError<"CreateHistoricalExport409", CreateHistoricalExport409> | FleetIqApiError<"CreateHistoricalExport413", CreateHistoricalExport413> | FleetIqApiError<"CreateHistoricalExport422", CreateHistoricalExport422> | FleetIqApiError<"CreateHistoricalExport429", CreateHistoricalExport429> | FleetIqApiError<"CreateHistoricalExport500", CreateHistoricalExport500>>;
  }
  /**
* Requires fresh telemetry.read. Exact tenant-owned identity; missing or other-tenant jobs return 404. Reports effective expiry even before physical cleanup. No unknown query parameters; five-second preparation bound. No raw evidence or public object URL.
*/
readonly "getHistoricalExport": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, exportId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetHistoricalExport200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetHistoricalExport400", GetHistoricalExport400> | FleetIqApiError<"GetHistoricalExport401", GetHistoricalExport401> | FleetIqApiError<"GetHistoricalExport403", GetHistoricalExport403> | FleetIqApiError<"GetHistoricalExport404", GetHistoricalExport404> | FleetIqApiError<"GetHistoricalExport500", GetHistoricalExport500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, exportId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetHistoricalExport200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetHistoricalExport400", GetHistoricalExport400> | FleetIqApiError<"GetHistoricalExport401", GetHistoricalExport401> | FleetIqApiError<"GetHistoricalExport403", GetHistoricalExport403> | FleetIqApiError<"GetHistoricalExport404", GetHistoricalExport404> | FleetIqApiError<"GetHistoricalExport500", GetHistoricalExport500>>;
  }
  /**
* Requires fresh telemetry.read and independent operations.manage for the same actor plus browser mutation protection. Never reopens a selection. Removes availability and staging bytes; a running attempt keeps its quota until acknowledged stopped or expired. No unknown query parameters.
*/
readonly "cancelHistoricalExport": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, exportId: string, options: { readonly params?: typeof CancelHistoricalExportParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<CancelHistoricalExport200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CancelHistoricalExport400", CancelHistoricalExport400> | FleetIqApiError<"CancelHistoricalExport401", CancelHistoricalExport401> | FleetIqApiError<"CancelHistoricalExport403", CancelHistoricalExport403> | FleetIqApiError<"CancelHistoricalExport404", CancelHistoricalExport404> | FleetIqApiError<"CancelHistoricalExport500", CancelHistoricalExport500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, exportId: string, options: { readonly params?: typeof CancelHistoricalExportParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<CancelHistoricalExport200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CancelHistoricalExport400", CancelHistoricalExport400> | FleetIqApiError<"CancelHistoricalExport401", CancelHistoricalExport401> | FleetIqApiError<"CancelHistoricalExport403", CancelHistoricalExport403> | FleetIqApiError<"CancelHistoricalExport404", CancelHistoricalExport404> | FleetIqApiError<"CancelHistoricalExport500", CancelHistoricalExport500>>;
  }
  /**
* Requires current telemetry.read on every page. Selects an existing numeric-fixed-v1 publication for the exact property version, aligned half-open window, resolution and optional manifest/generation. At most seven days, 64 full buckets and 64 buckets per page. First page selects the latest revision; opaque continuations bind full scope and pin the original immutable revision across late publications. Missing publications return 404. Invalid, oversized or cross-scope cursors return 400. Exact numeric strings and representation=numeric_summary distinguish derived evidence from raw history. Mean is the exact sum/count pair, undefined when count is zero. Only good quality contributes; total/excluded counts retain other qualities. Coverage describes the captured snapshot, never interval completeness or present staging availability. Reads never trigger production, restore, interpolation, unit conversion or raw fallback. Existing history budget admission applies; denied work returns 429, disabled policy preserves reads. Responses are no-store and bounded to 1 MiB.
*/
readonly "listNumericSummaries": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListNumericSummariesParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListNumericSummaries200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListNumericSummaries400", ListNumericSummaries400> | FleetIqApiError<"ListNumericSummaries401", ListNumericSummaries401> | FleetIqApiError<"ListNumericSummaries403", ListNumericSummaries403> | FleetIqApiError<"ListNumericSummaries404", ListNumericSummaries404> | FleetIqApiError<"ListNumericSummaries429", ListNumericSummaries429> | FleetIqApiError<"ListNumericSummaries500", ListNumericSummaries500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListNumericSummariesParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListNumericSummaries200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListNumericSummaries400", ListNumericSummaries400> | FleetIqApiError<"ListNumericSummaries401", ListNumericSummaries401> | FleetIqApiError<"ListNumericSummaries403", ListNumericSummaries403> | FleetIqApiError<"ListNumericSummaries404", ListNumericSummaries404> | FleetIqApiError<"ListNumericSummaries429", ListNumericSummaries429> | FleetIqApiError<"ListNumericSummaries500", ListNumericSummaries500>>;
  }
  /**
* Requires independent current operations.read before discovery. Existing metadata, protocol, analytics and alerts grants imply no access. Returns at most 64 observations per work family, with a sentinel for truncation. Notification samples exclude completed reconciliation positions and prioritize failed, then eligible work before leased, blocked and deferred positions, with deterministic identity tie breakers. Other families use identity prefixes. Counts and oldest eligible time concern only that sample. Alert evaluation samples selected rules and their next matching evidence. Leases are database evidence, never worker health. Empty results do not prove notification seeding, absence of backlog or receiver delivery. No mutation or raw payload, request, endpoint or exception text is returned.
*/
readonly "getWorkDiagnostics": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetWorkDiagnostics200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetWorkDiagnostics401", GetWorkDiagnostics401> | FleetIqApiError<"GetWorkDiagnostics403", GetWorkDiagnostics403> | FleetIqApiError<"GetWorkDiagnostics405", GetWorkDiagnostics405> | FleetIqApiError<"GetWorkDiagnostics500", GetWorkDiagnostics500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetWorkDiagnostics200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetWorkDiagnostics401", GetWorkDiagnostics401> | FleetIqApiError<"GetWorkDiagnostics403", GetWorkDiagnostics403> | FleetIqApiError<"GetWorkDiagnostics405", GetWorkDiagnostics405> | FleetIqApiError<"GetWorkDiagnostics500", GetWorkDiagnostics500>>;
  }
  /**
* Requires both operations.read and operations.manage under the same current actor/tenant before discovery. Returns at most 32 eligible failed targets and current control state, with explicit truncation. Keys contain only work identity and opaque destination digest, never payloads or endpoints. Alert evaluation has controls only, with no durable failed lease to retry. Absence of candidates is not health or drain. No unknown query parameters.
*/
readonly "getWorkRecoveryTargets": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, kind: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetWorkRecoveryTargets200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetWorkRecoveryTargets400", GetWorkRecoveryTargets400> | FleetIqApiError<"GetWorkRecoveryTargets401", GetWorkRecoveryTargets401> | FleetIqApiError<"GetWorkRecoveryTargets403", GetWorkRecoveryTargets403> | FleetIqApiError<"GetWorkRecoveryTargets405", GetWorkRecoveryTargets405> | FleetIqApiError<"GetWorkRecoveryTargets500", GetWorkRecoveryTargets500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, kind: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetWorkRecoveryTargets200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetWorkRecoveryTargets400", GetWorkRecoveryTargets400> | FleetIqApiError<"GetWorkRecoveryTargets401", GetWorkRecoveryTargets401> | FleetIqApiError<"GetWorkRecoveryTargets403", GetWorkRecoveryTargets403> | FleetIqApiError<"GetWorkRecoveryTargets405", GetWorkRecoveryTargets405> | FleetIqApiError<"GetWorkRecoveryTargets500", GetWorkRecoveryTargets500>>;
  }
  /**
* Requires independent current operations.manage and the listener-selected mutation guard before command validation. Browser commands require same-origin and CSRF marker. Retry supports replay/calculator id targets or an exact notification incident; alert_evaluation retry is invalid. Pause/resume require an empty target and expected control generation. Pause gates new observed scheduling/claims, not in-flight completion, ingress retention or drain. It does not resolve/silence alerts. Retry preserves original frozen inputs and identity while advancing the fence; active/completed/ineligible work and stale generations conflict. Reuse the same request_id and exact actor/body after an ambiguous response: original receipts never reapply effects even after later state changes. Changed author/body conflicts. Authority is rechecked even for repeat receipts. Generation capacity and unavailable configuration/execution policy can reject recovery. No unknown query parameters.
*/
readonly "applyWorkRecovery": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, kind: string, requestId: string, options: { readonly params?: typeof ApplyWorkRecoveryParams.Encoded | undefined; readonly payload: typeof ApplyWorkRecoveryRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ApplyWorkRecovery200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ApplyWorkRecovery400", ApplyWorkRecovery400> | FleetIqApiError<"ApplyWorkRecovery401", ApplyWorkRecovery401> | FleetIqApiError<"ApplyWorkRecovery403", ApplyWorkRecovery403> | FleetIqApiError<"ApplyWorkRecovery405", ApplyWorkRecovery405> | FleetIqApiError<"ApplyWorkRecovery409", ApplyWorkRecovery409> | FleetIqApiError<"ApplyWorkRecovery500", ApplyWorkRecovery500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, kind: string, requestId: string, options: { readonly params?: typeof ApplyWorkRecoveryParams.Encoded | undefined; readonly payload: typeof ApplyWorkRecoveryRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ApplyWorkRecovery200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ApplyWorkRecovery400", ApplyWorkRecovery400> | FleetIqApiError<"ApplyWorkRecovery401", ApplyWorkRecovery401> | FleetIqApiError<"ApplyWorkRecovery403", ApplyWorkRecovery403> | FleetIqApiError<"ApplyWorkRecovery405", ApplyWorkRecovery405> | FleetIqApiError<"ApplyWorkRecovery409", ApplyWorkRecovery409> | FleetIqApiError<"ApplyWorkRecovery500", ApplyWorkRecovery500>>;
  }
  /**
* Requires independent current alerts.acknowledge; alerts.read/manage and other grants imply no authority. Browser mutations require exact Origin and X-FleetIQ-CSRF. Rechecks active actor, tenant and grant transactionally even for retries. First commands require the current pending/firing version. Exact same-author retries return original actor/time even after resolution; another author or stale/closed/missing/foreign/unobserved target conflicts. Pins the existing lifecycle version without incrementing it, resolving, silencing, changing timers or suppressing notification intents. Body is closed and bounded to 1024 bytes; query parameters are rejected.
*/
readonly "acknowledgeAlert": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof AcknowledgeAlertParams.Encoded | undefined; readonly payload: typeof AcknowledgeAlertRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<AcknowledgeAlert200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AcknowledgeAlert400", AcknowledgeAlert400> | FleetIqApiError<"AcknowledgeAlert401", AcknowledgeAlert401> | FleetIqApiError<"AcknowledgeAlert403", AcknowledgeAlert403> | FleetIqApiError<"AcknowledgeAlert405", AcknowledgeAlert405> | FleetIqApiError<"AcknowledgeAlert409", AcknowledgeAlert409> | FleetIqApiError<"AcknowledgeAlert500", AcknowledgeAlert500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof AcknowledgeAlertParams.Encoded | undefined; readonly payload: typeof AcknowledgeAlertRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<AcknowledgeAlert200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"AcknowledgeAlert400", AcknowledgeAlert400> | FleetIqApiError<"AcknowledgeAlert401", AcknowledgeAlert401> | FleetIqApiError<"AcknowledgeAlert403", AcknowledgeAlert403> | FleetIqApiError<"AcknowledgeAlert405", AcknowledgeAlert405> | FleetIqApiError<"AcknowledgeAlert409", AcknowledgeAlert409> | FleetIqApiError<"AcknowledgeAlert500", AcknowledgeAlert500>>;
  }
  /**
* Requires exact alerts.read before resource discovery; management, metadata or telemetry grants do not imply this read. Latest revision and activation are separate version counters. A newly created rule is inactive.
*/
readonly "getAlertRuleHead": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetAlertRuleHead200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlertRuleHead400", GetAlertRuleHead400> | FleetIqApiError<"GetAlertRuleHead401", GetAlertRuleHead401> | FleetIqApiError<"GetAlertRuleHead403", GetAlertRuleHead403> | FleetIqApiError<"GetAlertRuleHead404", GetAlertRuleHead404> | FleetIqApiError<"GetAlertRuleHead405", GetAlertRuleHead405> | FleetIqApiError<"GetAlertRuleHead500", GetAlertRuleHead500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetAlertRuleHead200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlertRuleHead400", GetAlertRuleHead400> | FleetIqApiError<"GetAlertRuleHead401", GetAlertRuleHead401> | FleetIqApiError<"GetAlertRuleHead403", GetAlertRuleHead403> | FleetIqApiError<"GetAlertRuleHead404", GetAlertRuleHead404> | FleetIqApiError<"GetAlertRuleHead405", GetAlertRuleHead405> | FleetIqApiError<"GetAlertRuleHead500", GetAlertRuleHead500>>;
  }
  /**
* Requires exact alerts.read before resource discovery; management, metadata or telemetry grants do not imply this read. Returns retained exact content and original authenticated actor/time.
*/
readonly "getAlertRuleRevision": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetAlertRuleRevision200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlertRuleRevision400", GetAlertRuleRevision400> | FleetIqApiError<"GetAlertRuleRevision401", GetAlertRuleRevision401> | FleetIqApiError<"GetAlertRuleRevision403", GetAlertRuleRevision403> | FleetIqApiError<"GetAlertRuleRevision404", GetAlertRuleRevision404> | FleetIqApiError<"GetAlertRuleRevision405", GetAlertRuleRevision405> | FleetIqApiError<"GetAlertRuleRevision500", GetAlertRuleRevision500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetAlertRuleRevision200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlertRuleRevision400", GetAlertRuleRevision400> | FleetIqApiError<"GetAlertRuleRevision401", GetAlertRuleRevision401> | FleetIqApiError<"GetAlertRuleRevision403", GetAlertRuleRevision403> | FleetIqApiError<"GetAlertRuleRevision404", GetAlertRuleRevision404> | FleetIqApiError<"GetAlertRuleRevision405", GetAlertRuleRevision405> | FleetIqApiError<"GetAlertRuleRevision500", GetAlertRuleRevision500>>;
  }
  /**
* Requires exact alerts.manage, independently delegated; browser mutations require matching Origin and X-FleetIQ-CSRF. Current actor, tenant and grant are rechecked transactionally. Create only the next immutable revision; equivalent canonical numeric text and same author retry exactly. New revisions remain inactive while any prior selected revision remains selected.
*/
readonly "createAlertRuleRevision": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof CreateAlertRuleRevisionParams.Encoded | undefined; readonly payload: typeof CreateAlertRuleRevisionRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<CreateAlertRuleRevision200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CreateAlertRuleRevision400", CreateAlertRuleRevision400> | FleetIqApiError<"CreateAlertRuleRevision401", CreateAlertRuleRevision401> | FleetIqApiError<"CreateAlertRuleRevision403", CreateAlertRuleRevision403> | FleetIqApiError<"CreateAlertRuleRevision405", CreateAlertRuleRevision405> | FleetIqApiError<"CreateAlertRuleRevision409", CreateAlertRuleRevision409> | FleetIqApiError<"CreateAlertRuleRevision500", CreateAlertRuleRevision500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof CreateAlertRuleRevisionParams.Encoded | undefined; readonly payload: typeof CreateAlertRuleRevisionRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<CreateAlertRuleRevision200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"CreateAlertRuleRevision400", CreateAlertRuleRevision400> | FleetIqApiError<"CreateAlertRuleRevision401", CreateAlertRuleRevision401> | FleetIqApiError<"CreateAlertRuleRevision403", CreateAlertRuleRevision403> | FleetIqApiError<"CreateAlertRuleRevision405", CreateAlertRuleRevision405> | FleetIqApiError<"CreateAlertRuleRevision409", CreateAlertRuleRevision409> | FleetIqApiError<"CreateAlertRuleRevision500", CreateAlertRuleRevision500>>;
  }
  /**
* Requires exact alerts.manage, independently delegated; browser mutations require matching Origin and X-FleetIQ-CSRF. Current actor, tenant and grant are rechecked transactionally. Selection uses expected_generation; exact same-author retries return original receipt without restoring old state. This endpoint configures intent only; no alert worker or notification delivery is started.
*/
readonly "changeAlertRuleActivation": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, options: { readonly params?: typeof ChangeAlertRuleActivationParams.Encoded | undefined; readonly payload: typeof ChangeAlertRuleActivationRequestJson.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ChangeAlertRuleActivation200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ChangeAlertRuleActivation400", ChangeAlertRuleActivation400> | FleetIqApiError<"ChangeAlertRuleActivation401", ChangeAlertRuleActivation401> | FleetIqApiError<"ChangeAlertRuleActivation403", ChangeAlertRuleActivation403> | FleetIqApiError<"ChangeAlertRuleActivation405", ChangeAlertRuleActivation405> | FleetIqApiError<"ChangeAlertRuleActivation409", ChangeAlertRuleActivation409> | FleetIqApiError<"ChangeAlertRuleActivation500", ChangeAlertRuleActivation500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, options: { readonly params?: typeof ChangeAlertRuleActivationParams.Encoded | undefined; readonly payload: typeof ChangeAlertRuleActivationRequestJson.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ChangeAlertRuleActivation200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ChangeAlertRuleActivation400", ChangeAlertRuleActivation400> | FleetIqApiError<"ChangeAlertRuleActivation401", ChangeAlertRuleActivation401> | FleetIqApiError<"ChangeAlertRuleActivation403", ChangeAlertRuleActivation403> | FleetIqApiError<"ChangeAlertRuleActivation405", ChangeAlertRuleActivation405> | FleetIqApiError<"ChangeAlertRuleActivation409", ChangeAlertRuleActivation409> | FleetIqApiError<"ChangeAlertRuleActivation500", ChangeAlertRuleActivation500>>;
  }
  /**
* Requires exact current alerts.read before discovery. Metadata, telemetry, analytics and alerts.manage grants imply no access. Omission of phase selects pending/firing; exact filters include retained resolved/inactive history. Newly initialized version-zero checkpoints are not alerts. Queue order uses stable rule identity and revision, not mutable phase/time. Inserts before the cursor or changing filters can enter/leave traversal; this is not a live snapshot. All evidence references target existing calculator reads that retain separate telemetry.read authority; no raw output or input payload is expanded.
*/
readonly "listAlerts": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAlertsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAlerts200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAlerts400", ListAlerts400> | FleetIqApiError<"ListAlerts401", ListAlerts401> | FleetIqApiError<"ListAlerts403", ListAlerts403> | FleetIqApiError<"ListAlerts405", ListAlerts405> | FleetIqApiError<"ListAlerts500", ListAlerts500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, options: { readonly params?: typeof ListAlertsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListAlerts200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAlerts400", ListAlerts400> | FleetIqApiError<"ListAlerts401", ListAlerts401> | FleetIqApiError<"ListAlerts403", ListAlerts403> | FleetIqApiError<"ListAlerts405", ListAlerts405> | FleetIqApiError<"ListAlerts500", ListAlerts500>>;
  }
  /**
* Requires exact current alerts.read before discovery. Metadata, telemetry, analytics and alerts.manage grants imply no access. Returns the current checkpoint, latest phase-changing evaluation reference and exact pinned condition. Missing, foreign and never-transitioned revisions return 404. No acknowledgement or mutation is implied. All evidence references target existing calculator reads that retain separate telemetry.read authority; no raw output or input payload is expanded.
*/
readonly "getAlert": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetAlert200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlert400", GetAlert400> | FleetIqApiError<"GetAlert401", GetAlert401> | FleetIqApiError<"GetAlert403", GetAlert403> | FleetIqApiError<"GetAlert404", GetAlert404> | FleetIqApiError<"GetAlert405", GetAlert405> | FleetIqApiError<"GetAlert500", GetAlert500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetAlert200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetAlert400", GetAlert400> | FleetIqApiError<"GetAlert401", GetAlert401> | FleetIqApiError<"GetAlert403", GetAlert403> | FleetIqApiError<"GetAlert404", GetAlert404> | FleetIqApiError<"GetAlert405", GetAlert405> | FleetIqApiError<"GetAlert500", GetAlert500>>;
  }
  /**
* Requires exact current alerts.read before discovery. Metadata, telemetry, analytics and alerts.manage grants imply no access. Transitions retain original event/receipt times, activation generation and exact evidence identity. Pages advance by positive lifecycle version. A missing/foreign/unobserved alert returns 404; an exhausted page is empty. Cursors from another resource or revision are invalid. All evidence references target existing calculator reads that retain separate telemetry.read authority; no raw output or input payload is expanded.
*/
readonly "listAlertTransitions": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof ListAlertTransitionsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListAlertTransitions200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAlertTransitions400", ListAlertTransitions400> | FleetIqApiError<"ListAlertTransitions401", ListAlertTransitions401> | FleetIqApiError<"ListAlertTransitions403", ListAlertTransitions403> | FleetIqApiError<"ListAlertTransitions404", ListAlertTransitions404> | FleetIqApiError<"ListAlertTransitions405", ListAlertTransitions405> | FleetIqApiError<"ListAlertTransitions500", ListAlertTransitions500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, ruleId: string, revision: string, options: { readonly params?: typeof ListAlertTransitionsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListAlertTransitions200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListAlertTransitions400", ListAlertTransitions400> | FleetIqApiError<"ListAlertTransitions401", ListAlertTransitions401> | FleetIqApiError<"ListAlertTransitions403", ListAlertTransitions403> | FleetIqApiError<"ListAlertTransitions404", ListAlertTransitions404> | FleetIqApiError<"ListAlertTransitions405", ListAlertTransitions405> | FleetIqApiError<"ListAlertTransitions500", ListAlertTransitions500>>;
  }
  /**
* Requires fresh exact telemetry.read before discovery; metadata.read or analytics.manage does not imply access. Strict query fields, no-store, at most 1 MiB serialized response, no raw preparation/payload expansion. Returns retained exact calculator/configuration/input identity without re-evaluation. Outputs are paged separately.
*/
readonly "getCalculatorEvaluationEvidence": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, evaluationId: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetCalculatorEvaluationEvidence200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCalculatorEvaluationEvidence400", GetCalculatorEvaluationEvidence400> | FleetIqApiError<"GetCalculatorEvaluationEvidence401", GetCalculatorEvaluationEvidence401> | FleetIqApiError<"GetCalculatorEvaluationEvidence403", GetCalculatorEvaluationEvidence403> | FleetIqApiError<"GetCalculatorEvaluationEvidence404", GetCalculatorEvaluationEvidence404> | FleetIqApiError<"GetCalculatorEvaluationEvidence405", GetCalculatorEvaluationEvidence405> | FleetIqApiError<"GetCalculatorEvaluationEvidence500", GetCalculatorEvaluationEvidence500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, evaluationId: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetCalculatorEvaluationEvidence200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetCalculatorEvaluationEvidence400", GetCalculatorEvaluationEvidence400> | FleetIqApiError<"GetCalculatorEvaluationEvidence401", GetCalculatorEvaluationEvidence401> | FleetIqApiError<"GetCalculatorEvaluationEvidence403", GetCalculatorEvaluationEvidence403> | FleetIqApiError<"GetCalculatorEvaluationEvidence404", GetCalculatorEvaluationEvidence404> | FleetIqApiError<"GetCalculatorEvaluationEvidence405", GetCalculatorEvaluationEvidence405> | FleetIqApiError<"GetCalculatorEvaluationEvidence500", GetCalculatorEvaluationEvidence500>>;
  }
  /**
* Requires fresh exact telemetry.read before discovery; metadata.read or analytics.manage does not imply access. Strict query fields, no-store, at most 1 MiB serialized response, no raw preparation/payload expansion. Exact evaluation must belong to the tenant and input scope. Cursor binds this evaluation and resource; it cannot be used on another output page.
*/
readonly "listCalculatorEvaluationOutputs": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, evaluationId: string, options: { readonly params?: typeof ListCalculatorEvaluationOutputsParams.Encoded | undefined; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListCalculatorEvaluationOutputs200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListCalculatorEvaluationOutputs400", ListCalculatorEvaluationOutputs400> | FleetIqApiError<"ListCalculatorEvaluationOutputs401", ListCalculatorEvaluationOutputs401> | FleetIqApiError<"ListCalculatorEvaluationOutputs403", ListCalculatorEvaluationOutputs403> | FleetIqApiError<"ListCalculatorEvaluationOutputs404", ListCalculatorEvaluationOutputs404> | FleetIqApiError<"ListCalculatorEvaluationOutputs405", ListCalculatorEvaluationOutputs405> | FleetIqApiError<"ListCalculatorEvaluationOutputs500", ListCalculatorEvaluationOutputs500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, evaluationId: string, options: { readonly params?: typeof ListCalculatorEvaluationOutputsParams.Encoded | undefined; readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<ListCalculatorEvaluationOutputs200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListCalculatorEvaluationOutputs400", ListCalculatorEvaluationOutputs400> | FleetIqApiError<"ListCalculatorEvaluationOutputs401", ListCalculatorEvaluationOutputs401> | FleetIqApiError<"ListCalculatorEvaluationOutputs403", ListCalculatorEvaluationOutputs403> | FleetIqApiError<"ListCalculatorEvaluationOutputs404", ListCalculatorEvaluationOutputs404> | FleetIqApiError<"ListCalculatorEvaluationOutputs405", ListCalculatorEvaluationOutputs405> | FleetIqApiError<"ListCalculatorEvaluationOutputs500", ListCalculatorEvaluationOutputs500>>;
  }
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
* Requires exact telemetry.read. Returns all interpretations for one pinned property in a half-open event-time window of at most seven days. Ascending event time then full interpretation key provides stable ties, not latest-state precedence. Pages are not a snapshot: restart the window to observe late appends behind the cursor. No raw payload, transparent object-store scan, correction collapse or implicit unit conversion. Configured lifecycle budgets reserve one slot and 1048576 response bytes; denied admission or oversized output returns 429. Disabled policies preserve prior hot-only behavior. The opt-in hot_and_restored mode always has a five-second/1 MiB bound and merges one selected restore generation, deduplicated by immutable identity. Its coverage is selected_manifest_only, never interval completeness. Cursors additionally bind mode, manifest, restore generation and coverage state; expiry or state changes require restarting and return 400 for old cursors. Unavailable selections issue no continuation; select a valid restore generation or use hot mode to continue hot-only paging.
*/
readonly "listPropertyHistory": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListPropertyHistoryParams.Encoded; readonly config: Config }): Effect.Effect<WithOptionalResponse<ListPropertyHistory200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListPropertyHistory400", ListPropertyHistory400> | FleetIqApiError<"ListPropertyHistory401", ListPropertyHistory401> | FleetIqApiError<"ListPropertyHistory403", ListPropertyHistory403> | FleetIqApiError<"ListPropertyHistory409", ListPropertyHistory409> | FleetIqApiError<"ListPropertyHistory429", ListPropertyHistory429> | FleetIqApiError<"ListPropertyHistory500", ListPropertyHistory500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, options: { readonly params: typeof ListPropertyHistoryParams.Encoded; readonly config?: Config | undefined }): Effect.Effect<WithOptionalResponse<ListPropertyHistory200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"ListPropertyHistory400", ListPropertyHistory400> | FleetIqApiError<"ListPropertyHistory401", ListPropertyHistory401> | FleetIqApiError<"ListPropertyHistory403", ListPropertyHistory403> | FleetIqApiError<"ListPropertyHistory409", ListPropertyHistory409> | FleetIqApiError<"ListPropertyHistory429", ListPropertyHistory429> | FleetIqApiError<"ListPropertyHistory500", ListPropertyHistory500>>;
  }
  /**
* Requires exact telemetry.read. Reads original source, binding revision, exact property version and first-append resolution cutoffs. Corrections do not rewrite this fact. Another tenant/target or absent interpretation yields no provenance; no fallback to current metadata. Configured lifecycle budgets reserve one slot and 1048576 response bytes before lookup. Budget rejection is distinct from missing evidence. Disabled policies preserve prior behavior.
*/
readonly "getPropertyInterpretation": {
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, interpretation: string, options: { readonly config: Config }): Effect.Effect<WithOptionalResponse<GetPropertyInterpretation200, Config>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyInterpretation400", GetPropertyInterpretation400> | FleetIqApiError<"GetPropertyInterpretation401", GetPropertyInterpretation401> | FleetIqApiError<"GetPropertyInterpretation403", GetPropertyInterpretation403> | FleetIqApiError<"GetPropertyInterpretation404", GetPropertyInterpretation404> | FleetIqApiError<"GetPropertyInterpretation409", GetPropertyInterpretation409> | FleetIqApiError<"GetPropertyInterpretation429", GetPropertyInterpretation429> | FleetIqApiError<"GetPropertyInterpretation500", GetPropertyInterpretation500>>;
    <Config extends OperationConfig | undefined = undefined>(tenantId: string, assetId: string, propertyId: string, version: string, interpretation: string, options: { readonly config?: Config | undefined } | undefined): Effect.Effect<WithOptionalResponse<GetPropertyInterpretation200, Config | undefined>, HttpClientError.HttpClientError | SchemaError | FleetIqApiError<"GetPropertyInterpretation400", GetPropertyInterpretation400> | FleetIqApiError<"GetPropertyInterpretation401", GetPropertyInterpretation401> | FleetIqApiError<"GetPropertyInterpretation403", GetPropertyInterpretation403> | FleetIqApiError<"GetPropertyInterpretation404", GetPropertyInterpretation404> | FleetIqApiError<"GetPropertyInterpretation409", GetPropertyInterpretation409> | FleetIqApiError<"GetPropertyInterpretation429", GetPropertyInterpretation429> | FleetIqApiError<"GetPropertyInterpretation500", GetPropertyInterpretation500>>;
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
