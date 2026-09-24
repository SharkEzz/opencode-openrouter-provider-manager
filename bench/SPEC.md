# Spécification : benchmarks Auto vs endpoint épinglé

Statut : **spécification**, rien n'est implémenté. Ce document définit la suite de tests, les métriques, la méthode de comparaison et le format de résultats qu'utilisera le futur site de présentation du plugin.

## 1. Objectif

Répondre avec des chiffres mesurés à la question : « que gagne-t-on à épingler un endpoint OpenRouter avec le plugin, plutôt que de laisser OpenRouter router automatiquement ? »

Le plugin ajoute à la requête :

```json
{ "provider": { "only": ["openai/flex"], "allow_fallbacks": false } }
```

En mode Auto, il laisse le corps de la requête intact. Le benchmark compare donc, pour un même modèle et un même prompt, une requête inchangée et la même requête passée par `pinProvider()` (`src/pin.ts`).

Angles mesurés : **coût**, **vitesse**, **prévisibilité**. La qualité des réponses n'est pas mesurée.

Hors périmètre : le site lui-même, l'exécution via OpenCode et les évaluations de qualité.

## 2. Harness

- Script TypeScript dans `bench/`, exécuté directement par Node 26 (type stripping ; le repo importe déjà en `.ts`).
- Appels directs à `https://openrouter.ai/api/v1/chat/completions`, sans passer par OpenCode.
- La clé est lue dans `OPENROUTER_API_KEY`. Elle n'est jamais écrite dans les résultats.
- Réutilisation du code du plugin :
  - `fetchEndpoints()` et `tierOf()` (`src/openrouter.ts`) pour lister et classer les endpoints ;
  - `pinProvider()` (`src/pin.ts`) pour construire le corps épinglé, identique à celui du plugin.

## 3. Modèles

Déclarés dans `bench/config.ts` :

| Modèle      | Rôle                                   |
| ----------- | -------------------------------------- |
| GPT 6 Terra | cœur de la suite, plus de répétitions  |
| GPT 6 Sol   | modèle plus cher, moins de répétitions |
| _à définir_ | 3ᵉ slot optionnel                      |

Les slugs OpenRouter exacts sont renseignés dans la config. Les endpoints OpenAI exposent les tiers `openai`, `openai/flex` et `openai/fast` ou `openai/priority`, ainsi qu'Azure. Ce sont eux qui rendent le plugin intéressant sur ces modèles.

## 4. Configurations comparées

Pour chaque modèle, les configurations sont résolues au lancement à partir de `/models/{id}/endpoints` :

| id         | Requête envoyée                                                        |
| ---------- | ---------------------------------------------------------------------- |
| `auto`     | corps inchangé : c'est la référence                                    |
| `cheapest` | pin sur le tag au plus petit prix d'entrée (en pratique `openai/flex`) |
| `fastest`  | pin sur le tier `priority` (`openai/fast` ou `openai/priority`)        |
| `default`  | pin sur le tag du provider d'origine sans suffixe (`openai`)           |
| `alt-host` | pin sur un autre hébergeur s'il existe (`azure`)                       |

- Deux stratégies qui résolvent vers le même tag sont fusionnées.
- Une stratégie sans candidat (par exemple pas de tier `priority`) est omise et signalée dans le rapport.
- Les tags `router` et les endpoints sans tag sont ignorés, comme dans le plugin.

## 5. Workloads

Les prompts sont fixes et versionnés dans `bench/workloads/`. `temperature` est fixe quand le modèle l'accepte, et `max_tokens` est borné pour chaque workload.

| id            | Contenu                                                         | Mesure surtout                   |
| ------------- | --------------------------------------------------------------- | -------------------------------- |
| `short`       | question courte, environ 50 tokens de sortie                    | TTFT, overhead du routing        |
| `long`        | génération d'environ 1 500 tokens (doc ou code)                 | débit (tokens/s), latence totale |
| `agentic`     | tâche de code multi-tours avec tool calls, 8 tours au maximum   | coût et durée par tâche complète |
| `big-context` | environ 30k tokens d'entrée, préfixe partagé, question variable | coût de l'entrée, prompt cache   |

### Détails

- **`agentic`** : les outils sont mockés de façon déterministe sur un filesystem virtuel. Ce sont `read_file`, `list_dir`, `write_file` et `run_tests`, ce dernier renvoyant une sortie fixe. Les runs restent ainsi comparables. On mesure le nombre de tours, le coût cumulé et le temps total.
- **`big-context`** : un corpus de code figé est placé dans `bench/fixtures/`. Plusieurs requêtes successives partagent le même préfixe, ce qui permet de mesurer les `cachedTokens`. Un endpoint épinglé garde son prompt cache ; Auto peut changer d'hébergeur et le perdre.

## 6. Axe reasoning

Les niveaux `low`, `medium` et `high` forment une dimension testée. Pour tenir le budget, voir §8.

## 7. Métriques par requête

Chaque requête est envoyée en streaming SSE avec `usage: { include: true }` et chronométrée avec `performance.now()`.

| Champ              | Définition                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ttftMs`           | délai jusqu'au premier delta portant du texte (raisonnement ou contenu non vide) ; les deltas vides ou limités au `role` sont ignorés |
| `ttfvtMs`          | délai jusqu'au premier token de contenu visible                                                                                       |
| `totalMs`          | délai jusqu'à la fin du flux                                                                                                          |
| `outputTps`        | `completionTokens * 1000 / (tEnd - tFirst)` en tokens/s (`tFirst` = instant du `ttftMs`, horodatages `performance.now()` en ms)       |
| `promptTokens`     | issu de `usage`                                                                                                                       |
| `completionTokens` | issu de `usage`                                                                                                                       |
| `reasoningTokens`  | issu de `usage.completion_tokens_details`                                                                                             |
| `cachedTokens`     | issu de `usage.prompt_tokens_details`                                                                                                 |
| `costUsd`          | issu de `usage.cost`                                                                                                                  |
| `providerUsed`     | hébergeur réel, lu via `GET /api/v1/generation?id=` (indispensable pour Auto)                                                         |
| `serverLatencyMs`  | `latency` et `generation_time` de `/generation`, pour recouper les mesures locales                                                    |
| `status`           | `ok`, `http_4xx`, `http_429`, `http_5xx`, `timeout` ou `stream_error`, avec code et message tronqué                                   |

Chaque requête porte aussi ses métadonnées : `runId`, `model`, `config`, `tag`, `effort`, `workload`, `iteration`, `startedAt`.

Pour `agentic`, les métriques sont aussi agrégées par tâche : somme des coûts, temps total et nombre de tours.

## 8. Protocole

- **Ordre entrelacé et mélangé** : un round-robin randomisé par une seed répartit les configurations dans le temps, pour que la dérive d'OpenRouter ou des providers pèse de la même façon sur chacune.
- **Warm-up** : 1 requête par cellule, écartée des résultats.
- **Concurrence** : 1 par défaut, pour ne pas biaiser le TTFT. Elle est configurable.
- **Budget inférieur à 5 $** :
  - `--dry-run` estime le coût de chaque cellule à partir des prix de `/endpoints` et des tokens attendus par workload, sans faire d'appel payant ;
  - pendant le run, `--max-usd` (5 par défaut) est un plafond strict grâce à une **réservation avant envoi**. Avant chaque requête, le runner réserve son coût maximal : tokens d'entrée × prix d'entrée, plus `max_tokens` × prix de sortie, au tarif le plus cher de la config (pour `auto`, l'endpoint le plus cher du modèle). Il n'envoie la requête que si le coût dépensé, plus les réservations des requêtes en cours, plus cette nouvelle réservation reste sous le plafond. À la fin de la requête, la réservation est remplacée par le `costUsd` réel. Pour `agentic`, la réservation couvre la tâche entière (8 tours × pire cas par tour).
- **Matrice réduite** : la matrice complète (2 modèles × 5 configs × 3 efforts × 4 workloads × n=20) dépasse largement le budget. On retient donc :
  - les 3 niveaux de reasoning seulement pour `short` et `long` ;
  - `agentic` et `big-context` en `medium` seulement ;
  - n=15 pour Terra et n=8 pour Sol, ajustables en CLI.

  La matrice finale est arbitrée à partir du dry-run.

- **Persistance** : les résultats bruts sont écrits au fil de l'eau dans `bench/results/<runId>.jsonl`, et `--resume` reprend un run interrompu.
- **Confidentialité** : seules les métriques sont stockées. Ni clé API, ni contenu de réponse.

## 9. Agrégats et comparaison

Une cellule correspond à un couple modèle × workload × effort × config. Pour chacune, on calcule :

- la médiane, le p90 et le p95 de `ttftMs`, `totalMs`, `outputTps` et `costUsd`, plus le coût par tâche pour `agentic`. Ces statistiques portent sur les requêtes réussies uniquement. `n` compte les tentatives et `ok` les succès. Une cellule sans aucun succès (par exemple un endpoint épinglé indisponible) a des statistiques `null` et n'apparaît que via son taux de succès et ses erreurs ;
- un **IC 95 % de la médiane** par bootstrap : 1 000 rééchantillonnages, avec une seed fixe ;
- le **ratio par rapport à `auto`**, avec son IC par bootstrap sur le ratio des médianes. Un chiffre n'est mis en avant (`headlines`) que si son IC exclut 1 ;
- la **prévisibilité** : coefficient de variation, IQR, ratio p95/p50, taux de succès ;
- pour `auto` : la répartition des `providerUsed` et le nombre d'hébergeurs distincts ;
- le **cache** : ratio `cachedTokens / promptTokens` sur `big-context`, et « cold vs cached » (coût du 1ᵉʳ appel contre coût médian des suivants) ;
- le **coût effectif par million de tokens** (entrée, sortie et en cache) : il alimente les cartes KPI et le calculateur d'économies.

`npm run bench:report` produit aussi un rapport Markdown (tableaux) pour relire les résultats sans le site.

## 10. Format de résultats : `bench/results/summary.json`

C'est le contrat avec le futur site. Il est validé par un schéma zod (`bench/schema.ts`). Sa forme :

```ts
type Summary = {
  version: 1;
  run: { id: string; date: string; commit: string; seed: number; maxUsd: number; spentUsd: number };
  headlines: Headline[]; // chiffres mis en avant (IC excluant 1)
  cells: Cell[]; // agrégats par modèle × workload × effort × config
  endpoints: EndpointSnapshot[]; // prix, contexte, quantization au moment du run
  costModel: CostModel[]; // $/M effectifs par modèle × config
  samples: Sample[]; // points bruts allégés pour les distributions
};

type Headline = {
  metric: 'cost' | 'ttft' | 'stability' | 'cacheHit';
  model: string;
  config: string;
  workload: string;
  effort: string;
  value: number;
  baseline: number; // valeur Auto
  ratio: number;
  ci: [number, number];
  n: number; // succès de la config épinglée ayant servi au calcul
};

type Stat = { p50: number; p90: number; p95: number; ci50: [number, number] };

type Cell = {
  model: string;
  workload: string;
  effort: string;
  config: string;
  tag: string | null; // null pour auto
  n: number; // tentatives (hors warm-up)
  ok: number; // succès ; les stats ci-dessous portent uniquement sur eux
  successRate: number; // ok / n
  // null quand ok === 0 : aucune valeur n'est inventée
  ttftMs: Stat | null;
  totalMs: Stat | null;
  outputTps: Stat | null;
  costUsd: Stat | null;
  cv: { ttftMs: number; totalMs: number } | null;
  vsAuto?: {
    ttft: number;
    cost: number;
    ci: { ttft: [number, number]; cost: [number, number] };
  } | null; // null si la config ou auto n'a aucun succès
  cacheRatio?: number;
  coldVsCached?: { coldUsd: number; cachedUsd: number };
  providers?: Record<string, number>; // auto uniquement : part par hébergeur
  errors: Record<string, number>;
};

type CostModel = {
  model: string;
  config: string;
  inputPerM: number;
  outputPerM: number;
  cachedPerM: number;
};

type Sample = {
  model: string;
  workload: string;
  effort: string;
  config: string;
  t: number; // secondes depuis le début du run
  ttftMs: number | null;
  outputTps: number | null;
  costUsd: number | null;
  ok: boolean;
};
```

## 11. Specs d'affichage pour le futur site

Elles s'inspirent des maquettes fournies : style terminal sombre, police mono, accents cyan, bleu et rose, cartes à bord arrondi. Chaque bloc indique les données de `summary.json` qu'il consomme.

### 11.1 Bandeau de stats du hero

Quatre tuiles compactes :

- coût médian −X % (meilleur pin contre Auto) ;
- TTFT médian ;
- stabilité (CV ou ratio p95/p50) ;
- taux de cache hit (`big-context`, pin contre Auto).

Chaque tuile porte un sous-titre muted : `vs Auto · <modèle> · n=<n>`.
Données : `headlines[]`.

### 11.2 Section « Auto vs Plugin »

- Un toggle segmenté **Auto | Plugin**.
- Des onglets de stratégie : **Coût** (`cheapest`), **Vitesse** (`fastest`), **Défaut**, **Azure**.
- Un sélecteur de modèle et un sélecteur d'effort.
- Trois cartes KPI, chacune avec un grand chiffre coloré, `vs <valeur> auto` en muted, puis une ligne d'explication. Les trois métriques :
  - latence TTFT p50 ;
  - coût effectif par million de tokens ;
  - constance du cache hit.

Données : `cells[]` filtrées par (modèle, config, effort).

### 11.3 Cartes d'analyse avec barres comparatives

- **Coût par tâche agentique** : deux barres horizontales, Auto contre pin (`$0.12 vs $0.07`), avec un badge `−42 %`.
- **Cold call vs cached replay** (`big-context`) : coût du premier appel, coût d'un appel en cache, pourcentage d'économie.
- **Où Auto a routé** : barres de répartition de `providerUsed` (`openai 71 % · azure 29 %`).
- **Stabilité dans le temps** : sparkline du TTFT au fil du run, Auto contre pin.

Données : `cells[]` (`coldVsCached`, `providers`) et `samples[]`.

### 11.4 Matrice des endpoints

Un tableau par modèle, avec des onglets de tri **Prix · TTFT · Débit · Fiabilité**.

- Colonnes : tag, prix in et out /M, contexte, quantization, TTFT p50, tok/s p50, taux de succès (badge vert ou rouge), cache ratio, **Δ vs Auto** (badge coloré).
- La ligne Auto apparaît en tête, comme dans le picker `/provider`.

Données : `endpoints[]` jointes à `cells[]`.

### 11.5 Calculateur d'économies

Un curseur de volume mensuel de tokens et un choix de modèle affichent « ≈ $X/mois économisés ». Le résultat est présenté comme une estimation, calculée à partir des coûts effectifs mesurés (Auto contre pin choisi).
Données : `costModel[]`.

### 11.6 Section « Détails » (repliable)

- Strip ou box plots de `ttftMs` et `outputTps` : chaque point est une requête, Auto en gris et les pins en couleur.
- Scatter coût × latence avec intervalles de confiance, un point par config, en facettes par workload.
- Tableau complet p50/p90/p95 avec les erreurs.
- Méthodologie, date du snapshot des prix et commit du run.

Données : `samples[]` et `cells[]`.

### 11.7 Règles de contenu

- N'afficher que des chiffres mesurés, toujours accompagnés de n, de la date du run et d'un lien vers la méthodologie.
- Pas de témoignages, d'étoiles GitHub ni de « live telemetry » inventés.
- Ne pas promettre de fallback automatique ni de routing « cache-aware » : le plugin fait l'inverse (`allow_fallbacks: false`). La fiabilité d'un pin s'affiche honnêtement, taux d'erreur compris.

## 12. Feuille de route d'implémentation

Fichiers prévus :

- `bench/config.ts` : modèles, efforts, matrice, n, budget.
- `bench/strategies.ts` : liste d'endpoints → configurations (réutilise `fetchEndpoints`, `tierOf` et `pinProvider`).
- `bench/client.ts` : parsing SSE, chronométrage, `usage`, appel `/generation`, classification des erreurs.
- `bench/workloads/{short,long,agentic,big-context}.ts` et `bench/fixtures/` (corpus figé, mocks d'outils).
- `bench/run.ts` : CLI avec `--dry-run`, `--max-usd`, `--models`, `--workloads`, `--n`, `--seed` et `--resume`.
- `bench/stats.ts` (quantiles, bootstrap, CV), `bench/summarize.ts`, `bench/report.ts`, `bench/schema.ts`.
- `package.json` : scripts `bench`, `bench:summarize` et `bench:report`. `bench/` est inclus dans le typecheck, oxlint et oxfmt.
- Tests Vitest sur des fixtures, sans appel réel :
  - `tests/bench-strategies.test.ts` (à partir de `tests/fixtures/gpt-6-sol.endpoints.json`) ;
  - `tests/bench-client.test.ts` (flux SSE fixture, erreurs 429 et timeout) ;
  - `tests/bench-stats.test.ts` (quantiles, bootstrap seedé, ratios).

Vérification :

1. `npm run typecheck && npm test && npm run lint:check && npm run format:check`.
2. `npm run bench -- --dry-run` : matrice résolue et coût estimé inférieur à 5 $, sans appel payant.
3. Un mini-run réel (`--n 1 --workloads short --max-usd 0.10`), puis `bench:summarize` et `bench:report`. Ce run se fait uniquement avec accord, car il consomme des crédits.

## 13. Points ouverts

- Les slugs OpenRouter exacts de GPT 6 Terra et Sol, et le choix du 3ᵉ modèle.
- La matrice finale, à arbitrer après le premier dry-run.
- Faut-il commiter les JSONL bruts ou seulement `summary.json` ?
