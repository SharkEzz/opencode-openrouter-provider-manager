# Spécification : benchmarks Auto vs endpoint épinglé

Statut : **spécification**, rien n'est implémenté. Ce document définit la suite de tests, les métriques, la méthode de comparaison et le format de résultats et la zone benchmark du site de présentation du plugin (`apps/site/`).

## 1. Objectif

Répondre avec des chiffres mesurés à la question : « que gagne-t-on à épingler un endpoint OpenRouter avec le plugin, plutôt que de laisser OpenRouter router automatiquement ? »

Le plugin ajoute à la requête :

```json
{ "provider": { "only": ["openai/flex"], "allow_fallbacks": false } }
```

En mode Auto, il laisse le corps de la requête intact. Le benchmark compare donc, pour un même modèle et un même prompt, une requête inchangée et la même requête passée par `pinProvider()` (`packages/plugin/src/pin.ts`).

Angles mesurés : **coût**, **vitesse**, **prévisibilité**. La qualité des réponses n'est pas mesurée.

Hors périmètre : l'implémentation du site (seuls son contrat de données et sa zone benchmark sont spécifiés, §10 et §11), l'exécution via OpenCode et les évaluations de qualité.

## 2. Harness

- Paquet `@orpm/bench` (`packages/bench/`) du monorepo pnpm, en TypeScript exécuté directement par Node 26 (type stripping ; le repo importe déjà en `.ts`). **Sauf mention contraire, les chemins de ce document sont relatifs à `packages/bench/`.**
- Appels directs à `https://openrouter.ai/api/v1/chat/completions`, sans passer par OpenCode.
- La clé est lue dans `OPENROUTER_API_KEY`. Elle n'est jamais écrite dans les résultats.
- Réutilisation du code du plugin :
  - `fetchEndpoints()` et `tierOf()` (`packages/plugin/src/openrouter.ts`) pour lister et classer les endpoints ;
  - `pinProvider()` (`packages/plugin/src/pin.ts`) pour construire le corps épinglé, identique à celui du plugin.

## 3. Modèles

Déclarés dans `config.ts`. Le choix s'appuie sur l'usage OpenCode réel observé (§11.9) : l'essentiel du trafic va vers des modèles open-weight servis par de nombreux hébergeurs, où l'écart entre hébergeurs est le plus fort.

| Modèle                         | Rôle                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `z-ai/glm-5.3-flash`           | cœur de la suite, modèle affiché par défaut sur le site (12 hébergeurs observés, TTFT p50 de 985ms à 15,769ms) |
| `deepseek/deepseek-v4.1-flash` | cœur de la suite (7 hébergeurs observés)                                                                       |
| `openai/gpt-6-sol`             | illustre les tiers OpenAI (`openai/flex`, `openai/fast`) ; plus cher, donc moins de répétitions                |

Les slugs sont vérifiés au dry-run (§13). Les deux modèles open-weight coûtent très peu, ce qui permet de concentrer les répétitions sur eux dans le budget de 5 $.

## 4. Configurations comparées

Pour chaque modèle, les configurations sont résolues au lancement à partir de `/models/{id}/endpoints` et du dernier export observé (`observed/<date>.json`, §12) :

| id           | Requête envoyée                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `auto`       | corps inchangé : c'est la référence                                                                                                  |
| `cheapest`   | pin sur le tag au plus petit prix d'entrée (sur `gpt-6-sol`, en pratique `openai/flex`)                                              |
| `fastest`    | pin sur le tier `priority` s'il existe (`openai/fast`, `openai/priority`) ; sinon sur l'hébergeur au plus petit TTFT p50 **observé** |
| `best-cache` | pin sur l'hébergeur au meilleur `cacheHitRate` **observé**                                                                           |
| `default`    | pin sur le tag du provider d'origine sans suffixe (`openai`, `deepseek`, `z-ai`)                                                     |
| `alt-host`   | pin sur l'hébergeur alternatif le moins cher (`azure` sur `gpt-6-sol`)                                                               |

- Le **provider d'origine** est l'hébergeur dont le tag, sans suffixe, correspond à l'auteur du slug : `openai/…` → `openai`, `deepseek/…` → `deepseek`, `z-ai/…` → `z-ai`. S'il n'existe pas, `default` est omise et `alt-host` considère tous les hébergeurs.
- `alt-host` retient **un seul** tag : le moins cher en entrée parmi ceux dont l'hébergeur n'est pas le provider d'origine (sur la fixture Sol : `azure`, pas `azure/us`). `fetchEndpoints()` dédoublonne déjà les tags listés deux fois.
- **Stratégies issues de l'observé** (`fastest` sans tier priority, `best-cache`) :
  - seuls comptent les hébergeurs avec au moins **50 requêtes** dans l'export, pour ne pas choisir sur un échantillon minuscule ;
  - l'hébergeur observé (`provider`, nom affiché) est rapproché d'un tag de `/endpoints` via `provider_name` ; sans correspondance, la stratégie est omise ;
  - le rapport et le site indiquent que le choix vient de l'usage observé ; le bench le vérifie ensuite en conditions contrôlées. Le résultat peut contredire l'observé, et c'est affiché tel quel.
- Deux stratégies qui résolvent vers le même tag sont fusionnées (le rapport liste les deux noms).
- Une stratégie sans candidat est omise et signalée dans le rapport.
- Les tags `router` et les endpoints sans tag sont ignorés, comme dans le plugin.

## 5. Workloads

Les prompts sont fixes et versionnés dans `workloads/`. `temperature` est fixe quand le modèle l'accepte, et `max_tokens` est borné pour chaque couple workload × effort (voir ci-dessous).

| id            | Contenu                                                         | Mesure surtout                   |
| ------------- | --------------------------------------------------------------- | -------------------------------- |
| `short`       | question courte, environ 50 tokens de sortie                    | TTFT, overhead du routing        |
| `long`        | génération d'environ 1 500 tokens (doc ou code)                 | débit (tokens/s), latence totale |
| `agentic`     | tâche de code multi-tours avec tool calls, 8 tours au maximum   | coût et durée par tâche complète |
| `big-context` | environ 30k tokens d'entrée, préfixe partagé, question variable | coût de l'entrée, prompt cache   |

### Détails

- **`agentic`** : les outils sont mockés de façon déterministe sur un filesystem virtuel. Ce sont `read_file`, `list_dir`, `write_file` et `run_tests`, ce dernier renvoyant une sortie fixe. Les runs restent ainsi comparables. On mesure le nombre de tours, le coût cumulé et le temps total.
- **`big-context`** : un corpus de code figé est placé dans `fixtures/`. Une **série** est une suite de requêtes successives d'une même config qui partagent le même préfixe, ce qui permet de mesurer les `cachedTokens`. Un endpoint épinglé garde son prompt cache ; Auto peut changer d'hébergeur et le perdre.
  - Chaque série commence par un **nonce unique** en tête du préfixe (config × numéro de série). Le 1ᵉʳ appel est donc réellement froid, et aucune config ne profite du cache chauffé par une autre : `auto`, `openai`, `openai/flex` et `openai/fast` partagent probablement le même cache côté OpenAI (même organisation).
  - Pas de warm-up sur ce workload. Le 1ᵉʳ appel de la série est le « cold », les suivants sont les « cached ».

### Plafond `max_tokens`

Sur les modèles à reasoning, `max_tokens` inclut les tokens de raisonnement. Le plafond est donc fixé par workload × effort, dans `config.ts`. Valeurs de départ, à ajuster après le dry-run :

| workload      | `low` | `medium` | `high` |
| ------------- | ----- | -------- | ------ |
| `short`       | 2k    | 4k       | 8k     |
| `long`        | 4k    | 8k       | 16k    |
| `agentic`     | —     | 4k/tour  | —      |
| `big-context` | —     | 4k       | —      |

Une réponse coupée par ce plafond (`finish_reason: length`) prend le statut `truncated` (§7).

## 6. Axe reasoning

Les niveaux `low`, `medium` et `high` forment une dimension testée. Pour tenir le budget, voir §8.

## 7. Métriques par requête

Chaque requête est envoyée en streaming SSE avec `usage: { include: true }` et chronométrée avec `performance.now()`.

| Champ              | Définition                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ttftMs`           | délai jusqu'au premier delta portant du texte (raisonnement ou contenu non vide) ; les deltas vides ou limités au `role` sont ignorés                |
| `ttfvtMs`          | délai jusqu'au premier token de contenu visible                                                                                                      |
| `totalMs`          | délai jusqu'à la fin du flux                                                                                                                         |
| `outputTps`        | `completionTokens * 1000 / (tEnd - tFirst)` en tokens/s (`tFirst` = instant du `ttftMs`, horodatages `performance.now()` en ms)                      |
| `promptTokens`     | issu de `usage`                                                                                                                                      |
| `completionTokens` | issu de `usage`                                                                                                                                      |
| `reasoningTokens`  | issu de `usage.completion_tokens_details`                                                                                                            |
| `cachedTokens`     | issu de `usage.prompt_tokens_details`                                                                                                                |
| `costUsd`          | issu de `usage.cost`                                                                                                                                 |
| `providerUsed`     | hébergeur réel, lu via `GET /api/v1/generation?id=` (indispensable pour Auto), avec retry et backoff car l'entrée n'est pas disponible immédiatement |
| `serverLatencyMs`  | `latency` et `generation_time` de `/generation`, pour recouper les mesures locales                                                                   |
| `status`           | `ok`, `truncated`, `http_4xx`, `http_429`, `http_5xx`, `timeout` ou `stream_error`, avec code et message tronqué                                     |

Chaque requête porte aussi ses métadonnées : `runId`, `model`, `config`, `tag`, `effort`, `workload`, `iteration`, `startedAt`.

`truncated` (`finish_reason: length`) est compté à part : ces requêtes ne sont ni des succès ni des erreurs, et sont exclues des statistiques de coût et de débit.

Pour `agentic`, les métriques sont aussi agrégées par tâche : somme des coûts, temps total et nombre de tours. `providerUsed` est relevé **à chaque tour** et stocké en liste ; la tâche porte aussi un booléen `providerSwitched` (vrai si Auto a changé d'hébergeur en cours de tâche).

## 8. Protocole

- **Ordre entrelacé et mélangé** : un round-robin randomisé par une seed répartit les configurations dans le temps, pour que la dérive d'OpenRouter ou des providers pèse de la même façon sur chacune.
- **Warm-up** : 1 requête par cellule, écartée des résultats, sauf pour `big-context` (§5).
- **Concurrence** : 1 par défaut, pour ne pas biaiser le TTFT. Elle est configurable.
- **Budget inférieur à 5 $** :
  - `--dry-run` estime le coût de chaque cellule à partir des prix de `/endpoints` et des tokens attendus par workload, sans faire d'appel payant ;
  - pendant le run, `--max-usd` (5 par défaut) est un plafond strict grâce à une **réservation avant envoi**. Avant chaque requête, le runner réserve son coût maximal : tokens d'entrée × prix d'entrée, plus le plafond `max_tokens` du workload × effort (§5) × prix de sortie, au tarif le plus cher de la config (pour `auto`, l'endpoint le plus cher du modèle). Il n'envoie la requête que si le coût dépensé, plus les réservations des requêtes en cours, plus cette nouvelle réservation reste sous le plafond. À la fin de la requête, la réservation est remplacée par le `costUsd` réel. Pour `agentic`, la réservation couvre la tâche entière (8 tours × pire cas par tour).
- **Matrice réduite** : la matrice complète (3 modèles × 6 configs × 3 efforts × 4 workloads × n=20) dépasse largement le budget. L'usage observé montre que 94.4 % des tokens d'entrée d'un agent de code sont lus en cache et que la sortie ne pèse que 0.43 % des tokens : **`agentic` et `big-context` sont le cœur de la suite**. On retient donc :
  - `agentic` et `big-context` en `medium`, avec le plus de répétitions (valeurs de départ : n=15 sur les modèles open-weight, n=6 sur `gpt-6-sol`) ;
  - `short` et `long` pour le TTFT et le débit, avec les 3 niveaux de reasoning mais un n réduit (n=8 sur les modèles open-weight, n=4 sur `gpt-6-sol`) ;
  - toutes ces valeurs sont ajustables en CLI.

  La matrice finale est arbitrée à partir du dry-run.

- **Persistance** : les résultats bruts sont écrits au fil de l'eau dans `results/<runId>.jsonl`, et `--resume` reprend un run interrompu. Les JSONL bruts et `summary.json` sont **commités** ensemble, pour que les agrégats restent reproductibles.
- **Confidentialité** : seules les métriques sont stockées. Ni clé API, ni contenu de réponse.

## 9. Agrégats et comparaison

Une cellule correspond à un couple modèle × workload × effort × config. Pour chacune, on calcule :

- la médiane, le p90 et le p95 de `ttftMs`, `totalMs`, `outputTps` et `costUsd`, plus le coût par tâche pour `agentic`. Ces statistiques portent sur les requêtes réussies uniquement. `n` compte les tentatives et `ok` les succès. Une cellule sans aucun succès (par exemple un endpoint épinglé indisponible) a des statistiques `null` et n'apparaît que via son taux de succès et ses erreurs ;
- un **IC 95 % de la médiane** par bootstrap : 1 000 rééchantillonnages, avec une seed fixe ;
- le **ratio par rapport à `auto`** pour quatre métriques, chacune avec un IC par bootstrap seedé :
  - `ttft` et `cost` : ratio des médianes ;
  - `stability` : ratio des p95/p50 de `ttftMs` ;
  - `cacheHit` : ratio des `cacheRatio` (`big-context` uniquement).

  Un chiffre n'est mis en avant (`headlines`) que si son IC exclut 1. Avec un n réduit (`gpt-6-sol`, `short`, `long`), les IC seront larges et les headlines rares : c'est assumé ;

- la **prévisibilité** : coefficient de variation, IQR, ratio p95/p50, taux de succès ;
- pour `auto` : la répartition des `providerUsed` et le nombre d'hébergeurs distincts ; pour `agentic`, la part des tâches où Auto a changé d'hébergeur (`providerSwitchRate`) ;
- le **cache** : ratio `cachedTokens / promptTokens` sur `big-context`, et « cold vs cached » (coût du 1ᵉʳ appel contre coût médian des suivants) ;
- le **coût effectif par million de tokens** (entrée, sortie et en cache) : il alimente les cartes KPI et le calculateur d'économies. Le prix catalogue du cache vient de `pricing.input_cache_read` (§12) ; il vaut `null` quand l'endpoint ne l'expose pas.

`pnpm --filter @orpm/bench bench:report` produit aussi un rapport Markdown (tableaux) pour relire les résultats sans le site.

## 10. Format de résultats : `results/summary.json`

C'est le contrat avec le site (`apps/site/`). Il est validé par un schéma zod (`schema.ts`). Sa forme :

```ts
type Summary = {
  version: 1;
  run: { id: string; date: string; commit: string; seed: number; maxUsd: number; spentUsd: number };
  headlines: Headline[]; // chiffres mis en avant (IC excluant 1)
  cells: Cell[]; // agrégats par modèle × workload × effort × config
  endpoints: EndpointSnapshot[]; // prix, contexte, quantization au moment du run
  costModel: CostModel[]; // $/M effectifs par modèle × config
  profiles: Profile[]; // répartitions de tokens pour le calculateur (§11.3)
  samples: Sample[]; // points bruts allégés pour les distributions
  observed: Observed | null; // usage réel observé via l'API analytics d'OpenRouter (§11.9)
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
  truncated: number; // coupées par max_tokens, ni succès ni erreur
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
    stability: number; // ratio des p95/p50 de ttftMs
    cacheHit: number | null; // ratio des cacheRatio, null hors big-context
    ci: {
      ttft: [number, number];
      cost: [number, number];
      stability: [number, number];
      cacheHit: [number, number] | null;
    };
  } | null; // null si la config ou auto n'a aucun succès
  cacheRatio?: number;
  coldVsCached?: { coldUsd: number; cachedUsd: number };
  providers?: Record<string, number>; // auto uniquement : part par hébergeur
  providerSwitchRate?: number; // auto × agentic : part des tâches ayant changé d'hébergeur
  errors: Record<string, number>; // inclut truncated
};

type CostModel = {
  model: string;
  config: string;
  inputPerM: number;
  outputPerM: number;
  cachedPerM: number | null; // null si l'endpoint n'expose pas input_cache_read
};

type Profile = {
  id: string; // 'coding-agent', 'chat', 'long-generation'…
  label: string; // libellé anglais affiché sur le site
  source: 'bench' | 'opencode-history' | 'openrouter-observed';
  // parts du volume total de tokens, somme = 1 ; reasoning est facturé comme output
  shares: { input: number; cachedInput: number; output: number; reasoning: number };
  n: number; // requêtes ayant servi au calcul
  period?: { from: string; to: string }; // sources historiques uniquement
};

type Observed = {
  period: { from: string; to: string }; // dates UTC, `to` exclu ; 31 jours au plus (limite des percentiles)
  exportedAt: string;
  rows: {
    model: string; // slug sans suffixe de date
    permaslug: string; // slug daté exact : deux versions d'un modèle restent des lignes distinctes
    provider: string; // hébergeur réel
    requests: number;
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
    reasoningTokens: number;
    ttftP50Ms: number | null;
    ttftP95Ms: number | null;
    tpsP50: number | null;
    cacheHitRate: number | null;
  }[];
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

## 11. Specs d'affichage de la zone benchmark

La zone benchmark reprend la structure de la **variante 3** des maquettes (« Real-Time Routing Arbitrage »), corrigée pour ne montrer que ce que le plugin fait. Le style suit le design system **Obsidian Cyber IDE** (`packages/design-system/`, voir son `README.md`). Le texte du site est en **anglais** ; les libellés ci-dessous sont indicatifs. Chaque bloc indique les données de `summary.json` qu'il consomme.

### 11.0 Application du design system

- **Conteneurs** : pas de « carte » marketing. Tout bloc est un `Panel` : fond plat (`#131313` → `#1b1b1b`), filet de 1px `rgba(255,255,255,.08)`, rayon de 4px, en-tête `label-sm` en majuscules sur une barre de 36px, gouttière de `0.75rem`. Pas d'ombre ni de flou sur ces blocs ; le flou et l'ombre sont réservés aux surfaces flottantes (popovers, tooltips).
- **Couleurs fonctionnelles**, une seule couleur d'accent par ligne :

  | Usage                 | Couleur                                                |
  | --------------------- | ------------------------------------------------------ |
  | Auto (référence)      | muted `#94a3b8`                                        |
  | Cost, onglet actif    | bleu électrique : fond `#0058be`, texte `#adc6ff`      |
  | Speed (TTFT, débit)   | cyan : fond `#006970`, texte `#85d3db`                 |
  | Cache                 | magenta : fond `#9e00b5`, texte `#fbabff`              |
  | Mieux / neutre / pire | émeraude `#10b981` / ambre `#f59e0b` / rouge `#ef4444` |

  Le magenta ne signale **jamais** un résultat dégradé : il est réservé au cache.

- **Typographie** : Inter 600 en sentence case pour les titres (28/20/16px) ; JetBrains Mono pour tout le reste, avec `font-feature-settings: "tnum" 1, "zero" 1`. Rien sous 11px.
- **Texte** : minuscules, style CLI, ni « you » ni « we », pas d'emoji. Le point médian sépare des faits de même rang (`openai/flex · ttft p50 1,204ms · n=15`), le tiret cadratin introduit une conséquence. Placeholders terminés par `…`.
- **Nombres** : unités toujours présentes et abrégées de la même façon (`412ms`, `1.1M`, `96k`, `41.2%`, `$0.11 in / $0.55 out /M`, `82 tok/s`), milliers avec virgule. **Ne jamais arrondir un prix.**
- **États et animations** : sélection d'un segment en `#0058be` avec texte blanc 600 ; focus par un anneau de 1px `#adc6ff`. Trois durées sur `cubic-bezier(.2,.8,.3,1)` : 90ms (survol), 140ms (boutons, focus), 220ms (largeur des barres). Pas de fondu, pas de rebond, pas de parallaxe.
- **Composants** : réutiliser `Panel`, `Badge`, `MetricPair`, `StatusDot`, `Kbd`, `Icon` (Lucide) ; la barre de 3px de `TokenBudgetBar` sert de modèle aux barres de comparaison. Le design system ne fournit ni Tabs, ni Select, ni Slider, ni Tooltip : on utilise les primitives **shadcn/ui** (Radix) pour le comportement et l'accessibilité, restylées avec les tokens (§12).
- **Marque** : pas de logo inventé. Le nom du plugin sert de wordmark, `openrouter-provider-manager` en JetBrains Mono 600.
- **Piège** : les exemples de texte du design system parlent de fallback (« falling back to @fast ») et d'alias (`@fast`, `@cheap`). Ils décrivent son produit fictif et sont interdits ici (§11.8). On affiche les vrais tags (`openai/flex`, `openai/fast`).

**Message** : le plugin permet de **choisir son compromis** sur un même modèle. Épingler `flex` coûte moins cher mais répond plus lentement ; épingler `fast` répond plus vite mais coûte plus cher. Aucun bloc ne présente un gain sans sa contrepartie.

### 11.1 En-tête

- Surtitre `label-sm`, titre en Inter sentence case et sous-titre en mono minuscule, qui annoncent le compromis coût/vitesse sans chiffre inventé (ex. titre « Pick your trade-off », sous-titre `cheaper or faster — same model, one pinned endpoint`).
- Sous le titre, une ligne muted : `<modèles> · run <date> · commit <sha> · n=<total>` et un lien vers la méthodologie (§11.7).

Données : `run`, `cells[]`.

### 11.2 Contrôles

- **Onglets de stratégie** : **Cost** (`cheapest`, sélectionné par défaut), **Speed** (`fastest`), **Cache** (`best-cache`), **Default** (`default`), **Alt host** (`alt-host`, libellé = hébergeur réel, ex. « Azure »). Chaque onglet affiche en muted le tag résolu. Une stratégie absente pour le modèle choisi est grisée, avec une infobulle qui explique pourquoi ; une stratégie choisie sur l'usage observé porte la mention `picked from observed usage`.
- **Sélecteur de modèle** (`glm-5.3-flash` par défaut ; `gpt-6-sol` est le modèle qui illustre les tiers `flex` et `fast`) et **sélecteur d'effort** (`low` / `medium` / `high`, limité aux efforts mesurés pour le workload affiché).
- **Slider de volume** en **tokens par jour**, échelle logarithmique de **100k à 100M**. Il n'y a pas de presets de volume.
- **Sélecteur de profil** d'usage (répartition des tokens) : `Coding agent` (par défaut), `Chat`, `Long generation`. Voir §11.3.

Tous les blocs suivants réagissent à ces contrôles.

### 11.3 Calculateur

Deux montants côte à côte, **Auto** et **Pinned (<tag>)**, par jour et par mois (× 30), plus l'écart en valeur et en pourcentage, signé : un pin `fastest` affiche un surcoût, pas une économie.

Calcul : `volume × Σ(part du profil × prix effectif /M de la config)` pour chaque config. `reasoning` est facturé au prix de sortie. Si `cachedPerM` vaut `null`, les tokens en cache sont facturés au prix d'entrée, et une note le signale.

Le résultat est présenté comme une **estimation**, avec en muted la source du profil :

- `bench` : répartition mesurée sur les workloads du bench (`chat` ← `short`, `long-generation` ← `long`) ;
- `opencode-history` : `coding-agent` calibré sur un historique OpenCode réel, avec sa période et son n (§12).

Données : `costModel[]`, `profiles[]`.

### 11.4 Cartes de comparaison

Quatre `Panel` en grille 2 × 2. Chacun affiche **deux barres horizontales, Auto (muted) contre pin (couleur fonctionnelle de la carte)**, les valeurs en `MetricPair` alignées à droite, un `Badge` de ratio (émeraude si c'est mieux, rouge si c'est pire) et, en muted, `n=<ok>/<n>` et l'IC 95 %. Si l'IC contient 1, le badge est ambre et porte `no significant difference`.

| Carte           | Barres (Auto vs pin)                                                 | Détail sous les barres                                                                                              | Source                               |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Cost**        | coût effectif /M selon le profil, et coût médian par tâche `agentic` | `vsAuto.cost` et son IC                                                                                             | `costModel[]`, `cells[]` (`agentic`) |
| **Speed**       | TTFT p50 et tok/s p50                                                | TTFT p95, `vsAuto.ttft`                                                                                             | `cells[]` (`short`, `long`)          |
| **Cache**       | `cacheRatio` sur `big-context`                                       | cold vs cached (`coldVsCached`), `vsAuto.cacheHit`                                                                  | `cells[]` (`big-context`)            |
| **Reliability** | taux de succès                                                       | erreurs par type (`http_429`…), `truncated` ; pour Auto : hébergeurs utilisés (`providers`) et `providerSwitchRate` | `cells[]`                            |

La carte **Reliability** est obligatoire et ne masque rien : un pin sans fallback peut échouer là où Auto aurait basculé, et cela doit se voir.

### 11.5 Graphique du compromis

Un **nuage coût × TTFT** : axe X = TTFT p50 (ms), axe Y = coût effectif /M selon le profil choisi. Un point par config du modèle sélectionné, avec des barres d'erreur (IC de la médiane du TTFT). Auto est en gris, la config de l'onglet actif est mise en avant, les autres sont en couleur atténuée. Des facettes ou un sélecteur permettent de changer de workload (`short` par défaut).

En dessous, une **sparkline du TTFT au fil du run**, Auto contre pin. Comme les runs sont locaux et ponctuels (§12), elle couvre la durée d'un run, pas des semaines ; le libellé le dit (« over the <durée> run »).

Données : `cells[]`, `costModel[]`, `profiles[]`, `samples[]`.

### 11.6 Matrice des endpoints

Un tableau par modèle, avec des onglets de tri **Price · TTFT · Throughput · Reliability**.

- Colonnes : tag, prix in et out /M, prix cache /M, contexte, quantization, TTFT p50, tok/s p50, taux de succès (`StatusDot` émeraude, ambre ou rouge), cache ratio (magenta), **Δ vs Auto** (badge émeraude ou rouge). Rangées de 36px, chiffres alignés à droite.
- La ligne Auto apparaît en tête, comme dans le picker `/provider`.

Données : `endpoints[]` jointes à `cells[]`.

### 11.7 Section « Details » (repliable)

- Strip ou box plots de `ttftMs` et `outputTps` : chaque point est une requête, Auto en gris et les pins en couleur.
- Tableau complet p50/p90/p95 avec les erreurs, toutes cellules confondues.
- Méthodologie : protocole (§8), statistiques (§9), limites connues (runs locaux, n faible sur `gpt-6-sol`, stratégies choisies sur l'usage observé, TTFT dépendant de la connexion du poste), date du snapshot des prix et commit du run.

Données : `samples[]`, `cells[]`, `run`.

### 11.8 Règles de contenu

- N'afficher que des chiffres mesurés, toujours accompagnés de n, de la date du run et d'un lien vers la méthodologie.
- Toujours montrer la contrepartie d'un gain : une économie s'affiche avec la latence correspondante, et un gain de vitesse avec son surcoût.
- Pas de témoignages, d'étoiles GitHub ni de « live telemetry » inventés.
- Les maquettes contiennent des affirmations **interdites**, parce que fausses pour ce plugin :
  - fallback automatique, « failover » ou « sub-40ms fallback » : le plugin impose `allow_fallbacks: false` ;
  - « arbitrage », routing dynamique ou « cache-aware » : le plugin épingle un endpoint fixe ;
  - « transport-layer proxy » et compatibilité Cursor, VS Code, Zed ou Neovim : c'est un plugin OpenCode ;
  - intégration MCP, installation via `curl … | bash`, « 280+ endpoints », « 99.99 % uptime », « encrypted routing credentials » ;
  - hébergeurs non mesurés (ex. Bedrock) et chiffres de cache, de ROI ou d'économie non issus de `summary.json`.
- Les boutons d'appel à l'action pointent vers l'installation du plugin et le dépôt, jamais vers une « activation » de routing.
- Les données observées (§11.9) ne sont jamais présentées comme une comparaison Auto contre pin.

### 11.9 Usage réel observé

Un bloc séparé, titré « Real-world usage (observed) », montre l'usage OpenCode réel de l'auteur exporté depuis l'API analytics d'OpenRouter. Il est clairement distinct du benchmark contrôlé :

- **Avertissement en tête** : ce sont des observations, pas une expérience. Les prompts, les périodes et la part de requêtes épinglées varient d'un hébergeur à l'autre ; aucune dimension de l'API ne distingue une requête épinglée d'une requête Auto.
- **Dispersion par hébergeur** : pour chaque modèle servi par plusieurs hébergeurs, une rangée par hébergeur avec requêtes, TTFT p50/p95, tok/s p50 et taux de cache. C'est l'argument le plus direct pour épingler (ex. sur l'export du 2026-09-25 : `z-ai/glm-5.3-flash` servi par 12 hébergeurs, TTFT p50 de 985ms à 15,769ms, cache de 24 % à 98 %).
- **Profil d'usage** : la part de tokens en cache et de sortie alimente le profil `coding-agent` (source `openrouter-observed`), à recouper avec `opencode-history`.
- Pas de montant en dollars par hébergeur : il dépend du volume de chacun et n'est pas comparable.

Données : `observed`.

## 12. Feuille de route d'implémentation

Prérequis dans le plugin (`packages/plugin/`) :

- Étendre `Endpoint` (`rpc.ts`) avec `cached: number | null`, ajouter `input_cache_read` au schéma `RawEndpoint.pricing` et le lire dans `normalize()` (`src/openrouter.ts`) via `perMillion()`. Mettre à jour les fixtures et `tests/openrouter.test.ts`.
- Exposer `./openrouter` et `./pin` dans les `exports` du plugin, pour que le bench importe `fetchEndpoints`, `tierOf` et `pinProvider` via la dépendance `workspace:*`.

Exécution : les runs sont **locaux et ponctuels**, lancés manuellement (pas de CI, pas de secret dans GitHub). Le poste et la région sont notés dans la méthodologie, car ils influencent le TTFT.

Fichiers prévus :

- `config.ts` : modèles, efforts, matrice, n, budget.
- `strategies.ts` : liste d'endpoints + dernier export observé → configurations (réutilise `fetchEndpoints`, `tierOf` et `pinProvider`). Sans export observé, `fastest` (hors tier priority) et `best-cache` sont omises.
- `client.ts` : parsing SSE, chronométrage, `usage`, appel `/generation`, classification des erreurs.
- `workloads/{short,long,agentic,big-context}.ts` et `fixtures/` (corpus figé, mocks d'outils).
- `run.ts` : CLI avec `--dry-run`, `--max-usd`, `--models`, `--workloads`, `--n`, `--seed` et `--resume`.
- `stats.ts` (quantiles, bootstrap, CV), `summarize.ts`, `report.ts`, `schema.ts`.
- `profile.ts` : lit l'historique OpenCode **en lecture seule** (`~/.local/share/opencode/opencode.db`, table `message`, messages `assistant` dont `providerID` vaut `openrouter`). Il agrège `tokens.input`, `tokens.cache.read`, `tokens.output` et `tokens.reasoning` sur une période (`--since`), puis écrit `profiles/coding-agent.json` : les parts, n et la période, **rien d'autre** (ni contenu, ni id de session ou de projet, ni chemin). Ce fichier est commité. `tokens.input` exclut déjà les lectures de cache. `bench:summarize` fusionne ce profil avec les profils dérivés des workloads dans `profiles[]`.
- `observe.ts` : exporte l'usage réel via `POST /api/v1/analytics/query` avec `OPENROUTER_MANAGEMENT_KEY` (clé de management ; la clé d'inférence renvoie 403). Contraintes constatées :
  - le filtre `app` exige l'**id numérique** (le nom renvoie 500) ; on le retrouve via `/generation?id=` sur une génération de l'app (`app_id`) ;
  - les percentiles limitent la période à **31 jours** ;
  - `cache_capture_rate` et `possible_*` ne se combinent pas avec les métriques de coût, de latence ni avec le filtre `app`.

  Sortie : `observed/<date>.json`, commité. Il ne contient que les champs de `Observed` (§10) : ni id d'app, de clé, de session ou de génération, ni montant dépensé. Les valeurs sont arrondies (TTFT à la ms, débit à 0,1 tok/s, taux de cache à 4 décimales). `--exclude <slug>` (répétable) retire un modèle de l'export ; les noms à exclure se passent en ligne de commande pour ne jamais apparaître dans le dépôt.

- `package.json` : scripts `bench`, `bench:profile`, `bench:observe`, `bench:summarize`, `bench:report`, `typecheck` et `test` ; `tsconfig.json` propre au paquet, qui étend `tsconfig.base.json` à la racine. Le paquet est couvert par les scripts racine (`pnpm typecheck`, `pnpm test`, oxlint et oxfmt).
- Tests Vitest sur des fixtures, sans appel réel :
  - `tests/strategies.test.ts` (à partir de `packages/plugin/tests/fixtures/gpt-6-sol.endpoints.json`, où `alt-host` doit donner `azure`, de `packages/plugin/tests/fixtures/deepseek.endpoints.json`, et d'une fixture observée `tests/fixtures/observed.json` : seuil de 50 requêtes, rapprochement `provider` → tag, stratégie omise sans correspondance, fusion des stratégies qui résolvent vers le même tag) ;
  - `tests/client.test.ts` (flux SSE fixture, `finish_reason: length`, erreurs 429 et timeout, retry de `/generation`) ;
  - `tests/stats.test.ts` (quantiles, bootstrap seedé, ratios) ;
  - `tests/profile.test.ts` (base SQLite fixture en mémoire : parts correctes, aucun champ hors liste blanche dans la sortie).

Site (`apps/site/`, paquet `@orpm/site`) :

- **Vite + React + Tailwind + shadcn/ui**, page statique, avec ses propres scripts de typecheck et de test, lancés par les scripts racine.
- `packages/bench/results/summary.json` est importé au build via la dépendance `@orpm/bench` (`workspace:*`) et validé par son `schema.ts` : un résultat invalide fait échouer le build.
- Design system : le site dépend de `@orpm/design-system` (`packages/design-system/`, `workspace:*`), importe ses `tokens/*.css` et mappe les tokens en variables CSS du thème Tailwind. Le skill `.claude/skills/Obsidian Cyber IDE Design System/` ne fait que renvoyer vers ce paquet. Les composants du design system (`Panel`, `Badge`, `MetricPair`, `StatusDot`, `Kbd`, `Icon`) sont portés en TSX.
- shadcn/ui fournit Tabs, Select, Slider et Tooltip, restylés : rayon de 4px, rangées de 36px, segment sélectionné `#0058be`, focus `#adc6ff`, surfaces flottantes en verre (95 % `#131313`, `blur(16px)`, liseré `rgba(0,88,190,.3)`). La bibliothèque de graphiques est à choisir lors de l'implémentation.

Vérification :

1. `pnpm typecheck && pnpm test && pnpm lint:check && pnpm format:check` à la racine.
2. `pnpm --filter @orpm/bench bench --dry-run` : matrice résolue et coût estimé inférieur à 5 $, sans appel payant.
3. Un mini-run réel (`--n 1 --workloads short --max-usd 0.10`), puis `bench:summarize` et `bench:report`. Ce run se fait uniquement avec accord, car il consomme des crédits.

## 13. Points ouverts

- Les slugs OpenRouter exacts de `glm-5.3-flash`, `deepseek-v4.1-flash` et `gpt-6-sol`, à vérifier au dry-run.
- La matrice finale et les plafonds `max_tokens`, à arbitrer après le premier dry-run.
- La période d'historique OpenCode retenue pour le profil `coding-agent`.
- La bibliothèque de graphiques du site.
