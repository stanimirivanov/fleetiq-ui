/** Real imports exercise production rule diagnostics; no rule regex is simulated. */
export const importProbes = [
  {
    name: 'feature cannot import app',
    rule: 'feature-cannot-import-app-composition',
    file: 'features/assets/api/probe.ts',
    source:
      "import { appValue } from '../../../app/composition';\nexport const probe = appValue;\n",
  },
  {
    name: 'feature cannot import another private feature',
    rule: 'feature-cannot-import-another-feature-private-file',
    file: 'features/assets/api/probe.ts',
    source:
      "import { session } from '../../identity/model/session';\nexport const probe = session;\n",
  },
  {
    name: 'feature cannot import another public feature',
    rule: 'feature-cannot-import-another-feature-private-file',
    file: 'features/assets/api/probe.ts',
    source:
      "import { session } from '#features/identity';\nexport const probe = session;\n",
  },
  {
    name: 'shared cannot import a feature',
    rule: 'shared-cannot-import-features-or-app',
    file: 'shared/model/probe.ts',
    source:
      "import { assetValue } from '../../features/assets/model/value';\nexport const probe = assetValue;\n",
  },
  {
    name: 'shared cannot import app',
    rule: 'shared-cannot-import-features-or-app',
    file: 'shared/model/probe.ts',
    source:
      "import { appValue } from '../../app/composition';\nexport const probe = appValue;\n",
  },
  {
    name: 'feature model cannot import UI',
    rule: 'feature-model-cannot-import-ui-or-transport',
    file: 'features/assets/model/probe.ts',
    source:
      "import { AssetCard } from '../ui/AssetCard';\nexport const probe = AssetCard;\n",
  },
  {
    name: 'feature model cannot import shared transport',
    rule: 'feature-model-cannot-import-ui-or-transport',
    file: 'features/assets/model/probe.ts',
    source:
      "import { runtime } from '#shared/api';\nexport const probe = runtime;\n",
  },
  {
    name: 'API cannot import UI',
    rule: 'feature-api-cannot-import-ui',
    file: 'features/assets/api/probe.ts',
    source:
      "import { AssetCard } from '../ui/AssetCard';\nexport const probe = AssetCard;\n",
  },
  {
    name: 'UI cannot import generated wire code',
    rule: 'feature-ui-cannot-import-generated-or-shared-transport',
    file: 'features/assets/ui/probe.ts',
    source:
      "import { wire } from '../../../generated/wire';\nexport const probe = wire;\n",
  },
  {
    name: 'shared model cannot import transport',
    rule: 'shared-model-cannot-import-ui-or-transport',
    file: 'shared/model/probe.ts',
    source:
      "import { runtime } from '#shared/api';\nexport const probe = runtime;\n",
  },
  {
    name: 'external imports use runtime public entry',
    rule: 'external-imports-use-shared-runtime-entry',
    file: 'app/probe.ts',
    source:
      "import { runtime } from '../shared/api/runtime';\nexport const probe = runtime;\n",
  },
  {
    name: 'external imports use model public entry',
    rule: 'external-imports-use-shared-model-entry',
    file: 'app/probe.ts',
    source:
      "import { modelValue } from '../shared/model/value';\nexport const probe = modelValue;\n",
  },
  {
    name: 'external imports use UI public entry',
    rule: 'external-imports-use-shared-ui-entry',
    file: 'app/probe.ts',
    source:
      "import { Button } from '../shared/ui/Button';\nexport const probe = Button;\n",
  },
  {
    name: 'external imports use feature public entry',
    rule: 'external-imports-use-feature-entry',
    file: 'app/probe.ts',
    source:
      "import { AssetCard } from '../features/assets/ui/AssetCard';\nexport const probe = AssetCard;\n",
  },
  {
    name: 'unresolved package aliases fail',
    rule: 'no-unresolved-package-imports',
    file: 'app/probe.ts',
    source:
      "import { unknown } from '#features/missing';\nexport const probe = unknown;\n",
  },
  {
    name: 'type-only feature app imports fail',
    rule: 'feature-cannot-import-app-composition',
    file: 'features/assets/model/probe.ts',
    source:
      "import type { AppOnly } from '../../../app/composition';\nexport const probe = (value: AppOnly) => value.id;\n",
  },
  {
    name: 'type-only model wire imports fail',
    rule: 'feature-model-cannot-import-ui-or-transport',
    file: 'features/assets/model/probe.ts',
    source:
      "import type { Wire } from '../../../generated/wire';\nexport const probe = (value: Wire) => value.id;\n",
  },
  {
    name: 'type-only external private imports fail',
    rule: 'external-imports-use-feature-entry',
    file: 'app/probe.ts',
    source:
      "import type { Asset } from '../features/assets/model/value';\nexport const probe = (value: Asset) => value.id;\n",
  },
];
