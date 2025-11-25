# Observability implementation plan

## Purpose

- Deploy a production-ready observability stack in Liferay Cloud consisting of 3 Elasticsearch search nodes and 2 Kibana pods for observability UI.
- Enable X-Pack monitoring, configure Liferay-Kibana integration, and validate the entire stack in UAT before production deployment.
- Execution will follow **MDAP / MAKER-style principles**:
  - Maximal agentic decomposition into small, boring steps
  - Stateless microagents that operate on explicit state (files + commands), not chat history
  - Red-flagging and retries on suspicious outputs
  - Optional first-to-ahead-by-k voting for critical tasks (infrastructure changes, production deployments)

---

## Requirements source

- Primary file:
  - File name: `observability-opportunities.md`
  - File path: `/home/misael/liferay/producthub/observability-opportunities.md`
- How to reference requirements in this plan:
  - Section anchor: `<section heading>`
  - Line range: `L<start>–L<end>`
  - Brief quote (≤20 words)
- Additional considerations:
  - OpenAI review feedback (security, HA, fault tolerance, rollback strategies)

---

## Assumptions

- Target project:
  - Project ID: `lctmisaellatest`
  - Console URL: https://console.liferay.cloud/projects/lctmisaellatest
- Target environments:
  - UAT: initial deployment and validation
  - PRD: production deployment after UAT sign-off
  - INFRA: CI/CD environment (deploy: false for observability services)
- Tools available:
  - `lcp` CLI v3.21.0 at `/usr/local/bin/lcp`
  - `git` for version control
  - `docker` for local Dockerfile validation
  - `jq` for JSON validation
  - Liferay Cloud console for resource verification and monitoring
- Access constraints:
  - Read/write access to the producthub Git repository
  - Liferay Cloud console access via lcp CLI
  - No direct kubectl access (managed by Liferay Cloud platform)
- Constraints impacting decomposition:
  - PaaS plan MUST have sufficient resources (~32 GB RAM, 28 CPU cores)
  - Kibana version MUST match Elasticsearch version exactly (7.17.23)
  - Changes to search service require careful sequencing to avoid data loss

---

## MAKER / MDAP principles for this plan

### Maximal agentic decomposition (non-negotiable)

- Each task MUST implement a **single atomic outcome** (one behavior, one change set).
- Each task SHOULD touch at most **1–2 files or components**. If more are needed, split into separate tasks.
- If a task's acceptance criteria cannot be verified with ≤ 3 focused commands, it MUST be decomposed further.
- Avoid "epic tasks" that combine design, implementation, rollout, and cleanup.

### Stateless microagents and explicit state

- Treat each LLM call / sub-agent as a **pure function**:
  - Input: `(rules, current_state, local_goal)`
  - Output: `(patch | file | change_set)` plus minimal explanation if needed.
- Do NOT rely on chat history as state.
- Persist state in:
  - Version-controlled files in the producthub repository
  - Command outputs captured in `/status-report/`
  - Explicit configuration and scripts.

### Red-flagging and retries

- Treat the following as **red flags** requiring discard + retry:
  - Malformed JSON in LCP.json files
  - YAML syntax errors in kibana.yml
  - Missing required fields (id, kind, image, scale)
  - Version mismatches between ES and Kibana
- On red flag:
  - Discard output
  - Resample the microagent with a concise error summary and the same state
- After applying any change, ALWAYS run the associated validation commands.

### First-to-ahead-by-k voting (critical tasks)

- For high-risk tasks:
  - Search service scaling (task 1.2)
  - Production deployment (phase 4)
- Generate **k = 3** candidate outputs in parallel
- Run validations on each candidate
- Accept the first candidate that passes all validations
- If no candidate passes: escalate to human review.

### Small but consistent models / tools

- Use smaller models for atomic file edits and validations.
- Use more powerful models for:
  - Initial decomposition (this plan)
  - Cross-service integration verification
  - Troubleshooting deployment failures.

---

## Agent roles and collaboration

### Planner agent

- Reads `observability-opportunities.md`.
- Proposes phases and tasks in this `observability-plan.md` following decomposition rules.
- Does not modify code; only edits the plan.

### Implementation microagents

- **Configuration microagent** – LCP.json files, Dockerfile, kibana.yml, OSGi configs
- **Infrastructure microagent** – Liferay Cloud deployments, resource verification, health checks
- **Validation microagent** – JSON/YAML linting, version matching, schema validation

Each invocation:
- Receives: requirement references, state to load, local goal, red-flag/voting parameters
- Returns: exactly one patch or file change and a short explanation if useful.

### Verification agent

- Reviews diffs and deployment outputs against:
  - Requirements references
  - Task and phase acceptance criteria
- Suggests the **minimal correction** needed to realign with requirements.

### MCP collaboration (OpenAI)

- At defined checkpoints (per-task and per-phase), use MCP to:
  - Check that tasks remain aligned with `observability-opportunities.md`
  - Detect unaddressed requirements
  - Suggest minimal adjustments instead of large rewrites.

---

## Conventions (non-negotiable)

### Language and style

- Use RFC-2119 terms precisely: MUST, SHOULD, MAY.
- Avoid vague phrases like "optimize", "etc.", "soon", "TBD".

### Status boxes

- `[ ] todo`
- `[ ] doing`
- `[ ] done`

### Reports directory

- Use `/status-report/` for all task and phase reports.
- Naming:
  - Tasks: `/status-report/task-<id>.md`
  - Phases: `/status-report/phase-<n>.md`

### Git discipline and attribution

- Every task MUST end with a commit.
- Every phase MUST end with a commit **and** a push.
- Commit format: `feat(<phase>:<task-id>): <task name>`
- NEVER add AI as author or co-author.
- Do **not** include `Co-authored-by:` lines for AI.

### Testing rule (run now, do not defer)

- At the end of each task and phase, run appropriate tests.
- If tests cannot be run locally, mark them as **SIMULATED**, explain why, and provide exact commands that SHOULD be run.
- Use Given–When–Then phrasing with:
  - Explicit commands
  - Expected exit codes
  - Key outputs or system states.

### Configuration placeholders and overrides

- Keep placeholders, example values, and commented defaults for repeatability.
- When overriding a value:
  - Comment out the placeholder block; do not delete it
  - Add a one-line comment explaining who/what set the value and where to change it.

### CLI context and profile safety

- Always specify environment in `lcp` commands.
- Before mutating:
  - Verify current git branch: `git branch --show-current`
  - Verify remote: `git remote -v`
- Prefer dry-run/preview operations first where available.

---

## Phase 0 – Decomposition and planning

### Requirements reference

- Full document `observability-opportunities.md` L1–L243
- "Deploy 3 Elasticsearch search nodes and 2 observability nodes with Kibana"

### Description (result)

- This phase validates the plan structure and ensures each task is atomic and independently testable.
- Complete when all phases and tasks are defined with clear acceptance criteria.
- Contributes to reliability by preventing scope creep and ensuring traceability.

### Boundaries

- In:
  - Reading and analyzing requirements
  - Defining phases and tasks
  - Mapping requirements to tasks
- Out:
  - Any code or configuration changes
  - Any deployments

### Deliverables

- This `observability-plan.md` file
- `/status-report/` directory structure

### Acceptance criteria (phase)

1. All requirements from `observability-opportunities.md` are mapped to specific tasks.
2. Each task touches ≤ 2 files and has ≤ 3 verification commands.

### Decomposition check

| Requirement | Section | Task IDs |
|-------------|---------|----------|
| Scale search to 3 nodes | Section 1, L40–L76 | 1.1, 1.2 |
| Create Kibana service | Section 2, L79–L180 | 2.1, 2.2, 2.3 |
| Configure Liferay-Kibana | Section 3, L183–L191 | 3.1 |
| Deploy to UAT | Section 4, L195–L208 | 4.1, 4.2, 4.3 |
| Verify resources | Section 5, L212–L220 | 1.1 (pre-check) |
| Deploy to PRD | Section 4 | 5.1, 5.2 |

---

## Phase 1 – Search service scaling

### Requirements reference

- `Section 1. Scale Search Service to 3 Nodes` in `observability-opportunities.md` L40–L76
- "scale: 3 - Always use odd numbers for ES quorum"

### Description (result)

- This phase updates the search service configuration to run 3 Elasticsearch nodes.
- Complete when `search/LCP.json` contains `scale: 3` and X-Pack monitoring is enabled.
- Contributes to high availability and enables cluster health monitoring.

### Boundaries

- In:
  - Modifying `search/LCP.json`
  - Adding environment variables for X-Pack
- Out:
  - Kibana service creation (phase 2)
  - Liferay configuration changes (phase 3)
  - Actual deployment (phase 4)

### Deliverables

- Updated `search/LCP.json` with scale: 3 and ENABLE_XPACK_MONITORING
- `/status-report/task-1.1.md`
- `/status-report/task-1.2.md`

### Acceptance criteria (phase)

1. `search/LCP.json` contains `"scale": 3`.
2. `search/LCP.json` contains `"ENABLE_XPACK_MONITORING": "true"` in env section.
3. `search/LCP.json` contains `"podManagementPolicy": "Parallel"`.
4. JSON is valid (passes `jq .` without errors).

### UAT

- scenario: validate search LCP.json structure
  - Given `search/LCP.json` exists in repository
  - When `cat search/LCP.json | jq '.scale, .env.ENABLE_XPACK_MONITORING, .podManagementPolicy'`
  - Then output is `3`, `"true"`, `"Parallel"` (exit code 0)

### Decomposition check

| Requirement | Task ID |
|-------------|---------|
| Verify current config and resources | 1.1 |
| Update scale and X-Pack monitoring | 1.2 |

---

### Tasks

#### Task 1.1: Verify current search service configuration

- **Requirements reference**
  - `Section 5. Resource Requirements` L212–L220
  - "Verify your PaaS plan has sufficient resources"

- **Microagent role**
  - Validation microagent
  - Voting: no

- **Goal**
  - Capture the current state of `search/LCP.json` and verify it can be safely modified.
  - Ensures we have a baseline before making changes.

- **Atomicity**
  - This task reads: 1 file (`search/LCP.json`)
  - It has exactly one observable outcome: documented current state

- **State to load (inputs for the microagent)**
  - File: `search/LCP.json`
  - Commands:
    - `cat search/LCP.json | jq .`
    - `git status search/LCP.json`

- **Steps**
  1. Read current `search/LCP.json` content.
  2. Validate JSON syntax with `jq`.
  3. Document current values for: scale, memory, cpu, podManagementPolicy, env.
  4. Create `/status-report/task-1.1.md` with findings.

- **Acceptance criteria (task)**
  1. `/status-report/task-1.1.md` exists with current configuration documented.
  2. JSON is valid (jq exits with code 0).

- **Test scenario(s) (run now)**
  - scenario: validate JSON syntax
    - Given `search/LCP.json` exists
    - When `cat search/LCP.json | jq . > /dev/null`
    - Then exit code 0

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- signatures
  - `signature ValidateJSON(path: Path): ValidationResult`
  - `signature DocumentConfig(config: JSON): Report`

- types
  - `type ValidationResult { valid: bool; errors?: array<string>; }`
  - `type Report { file: Path; content: string; timestamp: datetime; }`

- validation and error handling flow
  - `read file → parse JSON → validate required fields → generate report`
  - On parse failure: abort with code 1 and error message

- logging
  - Level: info
  - Events: start, JSON parse result, report generation complete

- file paths and artifacts
  - Read: `search/LCP.json`
  - Write: `/status-report/task-1.1.md` (committed)

- quick test hook
  - `cat search/LCP.json | jq '.scale, .podManagementPolicy'`

##### Git (end of task)

- Create a commit.
- Message: `feat(phase1:1.1): verify current search service configuration`
- Record commit SHA in task report.

##### Task report (write to `/status-report/task-1.1.md`)

Template:
```markdown
# Task 1.1: Verify current search service configuration

## Execution summary
- Date: <timestamp>
- Commit SHA: <sha>

## Current configuration
- scale: <value>
- memory: <value>
- cpu: <value>
- podManagementPolicy: <value>
- env.ES_JAVA_OPTS: <value>
- env.ENABLE_XPACK_MONITORING: <value or "not set">

## Validation
- JSON syntax: PASS/FAIL
- Required fields present: PASS/FAIL

## Requirements covered
- Section 5, L212–L220: resource verification
```

##### Checkpoint

- Scan `observability-plan.md` and `observability-opportunities.md`.
- Ask via MCP: "Is task 1.1 aligned with requirements? Any gaps?"

---

#### Task 1.2: Update search service to 3 nodes with X-Pack monitoring

- **Requirements reference**
  - `Section 1` L40–L76
  - "scale: 3", "ENABLE_XPACK_MONITORING: true"

- **Microagent role**
  - Configuration microagent
  - Voting: yes (candidates=3) – critical infrastructure change

- **Goal**
  - Modify `search/LCP.json` to scale Elasticsearch to 3 nodes and enable X-Pack monitoring.
  - This is the core infrastructure change for high availability.

- **Atomicity**
  - This task changes: 1 file (`search/LCP.json`)
  - It has exactly one observable outcome: updated configuration with scale=3 and monitoring enabled

- **State to load (inputs for the microagent)**
  - File: `search/LCP.json`
  - Reference: `observability-opportunities.md` L44–L69 (target configuration)
  - Commands:
    - `cat search/LCP.json`
    - `git diff search/LCP.json` (after changes)

- **Steps**
  1. Read current `search/LCP.json`.
  2. Generate 3 candidate patches (voting enabled).
  3. Each candidate MUST:
     - Set `"scale": 3`
     - Add `"ENABLE_XPACK_MONITORING": "true"` to env
     - Preserve existing `podManagementPolicy: "Parallel"`
     - Preserve existing ports, volumes, probes
  4. Validate each candidate with `jq`.
  5. Accept first candidate passing validation.
  6. Apply the change.
  7. Verify with diff.

- **Acceptance criteria (task)**
  1. `search/LCP.json` contains `"scale": 3`.
  2. `search/LCP.json` contains `"ENABLE_XPACK_MONITORING": "true"`.
  3. `search/LCP.json` contains `"podManagementPolicy": "Parallel"`.
  4. JSON is valid.

- **Test scenario(s) (run now)**
  - scenario: verify scale value
    - Given `search/LCP.json` has been updated
    - When `cat search/LCP.json | jq '.scale'`
    - Then output is `3`
  - scenario: verify X-Pack monitoring
    - Given `search/LCP.json` has been updated
    - When `cat search/LCP.json | jq '.env.ENABLE_XPACK_MONITORING'`
    - Then output is `"true"`

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- signatures
  - `signature UpdateSearchConfig(current: JSON, target: TargetConfig): JSON`

- types
  - `type TargetConfig { scale: int; enableMonitoring: bool; }`

- sample input / output
  - Input: `scale=1, ENABLE_XPACK_MONITORING=not set`
  - Output: `scale=3, ENABLE_XPACK_MONITORING="true"`
  - Invalid input: `scale="three"` → error: `scale must be integer`

- validation and error handling flow
  - `read → generate candidates → validate JSON → check required fields → select winner → apply → verify`
  - Red flags: invalid JSON, missing podManagementPolicy, scale not odd number
  - On failure: discard candidate, try next

- logging
  - Level: info, warn on red flags
  - Events: candidate generation, validation pass/fail, winner selection, apply

- file paths and artifacts
  - Read/Write: `search/LCP.json` (committed)

- quick test hook
  - `cat search/LCP.json | jq '{scale, podManagementPolicy, env}'`

##### Git (end of task)

- Create a commit.
- Message: `feat(phase1:1.2): scale search service to 3 nodes with X-Pack monitoring`
- Record commit SHA in task report.

##### Task report (write to `/status-report/task-1.2.md`)

Template:
```markdown
# Task 1.2: Update search service to 3 nodes with X-Pack monitoring

## Execution summary
- Date: <timestamp>
- Commit SHA: <sha>
- Voting: 3 candidates generated, candidate <n> selected

## Changes applied
- scale: 1 → 3
- env.ENABLE_XPACK_MONITORING: (not set) → "true"

## Validation
- JSON syntax: PASS
- scale value: 3 (PASS)
- podManagementPolicy: "Parallel" (PASS)
- ENABLE_XPACK_MONITORING: "true" (PASS)

## Requirements covered
- Section 1, L40–L76: search service scaling
```

##### Checkpoint

- Scan plan and requirements.
- Ask via MCP: "Is the search configuration correct per requirements?"

---

### Implementation overview (phase 1)

- **Short narrative**
  - Phase 1 establishes the foundation by scaling the search service and enabling monitoring.
  - Tasks are sequenced: verify current state (1.1), then apply changes (1.2).
  - Voting is used for the critical configuration change to ensure correctness.

- **Flow sketch**
  - `load search/LCP.json → validate → generate candidates → vote → apply → verify → commit → report`

- **Primary modules and files**
  - `search/LCP.json`

- **Integration test intents**
  - JSON is syntactically valid
  - Scale is set to 3
  - X-Pack monitoring is enabled
  - podManagementPolicy remains "Parallel"

---

## Phase 2 – Kibana service creation

### Requirements reference

- `Section 2. Add Kibana as Custom Service` in `observability-opportunities.md` L79–L180
- "Create kibana/ directory with LCP.json, Dockerfile, config/kibana.yml"

### Description (result)

- This phase creates the complete Kibana custom service directory structure.
- Complete when `kibana/` contains valid LCP.json, Dockerfile, and kibana.yml.
- Contributes to observability by providing the visualization layer.

### Boundaries

- In:
  - Creating `kibana/` directory
  - Creating `kibana/LCP.json`
  - Creating `kibana/Dockerfile`
  - Creating `kibana/config/kibana.yml`
- Out:
  - Liferay OSGi configuration (phase 3)
  - Deployment (phase 4)

### Deliverables

- `kibana/LCP.json`
- `kibana/Dockerfile`
- `kibana/config/kibana.yml`
- `/status-report/task-2.1.md`
- `/status-report/task-2.2.md`
- `/status-report/task-2.3.md`

### Acceptance criteria (phase)

1. `kibana/LCP.json` exists and is valid JSON with scale: 2.
2. `kibana/Dockerfile` exists and references correct Kibana version (7.17.23).
3. `kibana/config/kibana.yml` exists and points to `http://search:9200`.
4. All files pass syntax validation.

### UAT

- scenario: validate Kibana service structure
  - Given `kibana/` directory exists
  - When `ls kibana/ && cat kibana/LCP.json | jq '.scale'`
  - Then directory contains LCP.json, Dockerfile, config/ and scale is `2`

### Decomposition check

| Requirement | Task ID |
|-------------|---------|
| Create kibana/LCP.json | 2.1 |
| Create kibana/Dockerfile | 2.2 |
| Create kibana/config/kibana.yml | 2.3 |

---

### Tasks

#### Task 2.1: Create Kibana LCP.json

- **Requirements reference**
  - `Section 2` L98–L142
  - "id: kibana, kind: Deployment, scale: 2"

- **Microagent role**
  - Configuration microagent
  - Voting: no

- **Goal**
  - Create `kibana/LCP.json` with correct service definition for 2 Kibana pods.

- **Atomicity**
  - This task creates: 1 file (`kibana/LCP.json`)
  - It has exactly one observable outcome: valid LCP.json for Kibana service

- **State to load**
  - Reference: `observability-opportunities.md` L100–L142
  - Commands:
    - `ls -la kibana/` (should not exist yet or be empty)
    - `cat search/LCP.json | jq '.image'` (to verify ES version for matching)

- **Steps**
  1. Create `kibana/` directory if not exists.
  2. Create `kibana/LCP.json` with configuration from requirements.
  3. Ensure version matches ES (7.17.23).
  4. Validate JSON syntax.

- **Acceptance criteria (task)**
  1. `kibana/LCP.json` exists.
  2. Contains `"id": "kibana"`.
  3. Contains `"scale": 2`.
  4. Contains `"image": "docker.elastic.co/kibana/kibana:7.17.23"`.
  5. JSON is valid.

- **Test scenario(s) (run now)**
  - scenario: validate Kibana LCP.json
    - Given `kibana/LCP.json` created
    - When `cat kibana/LCP.json | jq '{id, scale, image}'`
    - Then output contains id="kibana", scale=2, image contains "7.17.23"

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- signatures
  - `signature CreateKibanaLCP(version: string, scale: int): JSON`

- types
  - `type KibanaLCP { id: "kibana"; kind: "Deployment"; image: string url; scale: int; ... }`

- file paths and artifacts
  - Create: `kibana/LCP.json` (committed)

- quick test hook
  - `cat kibana/LCP.json | jq '.id, .scale, .image'`

##### Git (end of task)

- Message: `feat(phase2:2.1): create Kibana LCP.json`

---

#### Task 2.2: Create Kibana Dockerfile

- **Requirements reference**
  - `Section 2` L149–L157
  - "FROM docker.elastic.co/kibana/kibana:7.17.23"

- **Microagent role**
  - Configuration microagent
  - Voting: no

- **Goal**
  - Create `kibana/Dockerfile` that copies the config and sets correct user.

- **Atomicity**
  - This task creates: 1 file (`kibana/Dockerfile`)
  - It has exactly one observable outcome: valid Dockerfile

- **State to load**
  - Reference: `observability-opportunities.md` L151–L157
  - Commands:
    - `cat kibana/LCP.json | jq '.image'` (verify version match)

- **Steps**
  1. Create `kibana/Dockerfile` with content from requirements.
  2. Verify FROM image matches LCP.json image version.

- **Acceptance criteria (task)**
  1. `kibana/Dockerfile` exists.
  2. Contains `FROM docker.elastic.co/kibana/kibana:7.17.23`.
  3. Contains `COPY config/kibana.yml`.
  4. Contains `USER kibana`.

- **Test scenario(s) (run now)**
  - scenario: validate Dockerfile syntax
    - Given `kibana/Dockerfile` created
    - When `grep -E "^FROM|^COPY|^USER" kibana/Dockerfile`
    - Then output contains FROM, COPY, USER directives

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- signatures
  - `signature CreateDockerfile(baseImage: string): Dockerfile`

- file paths and artifacts
  - Create: `kibana/Dockerfile` (committed)

- quick test hook
  - `head -5 kibana/Dockerfile`

##### Git (end of task)

- Message: `feat(phase2:2.2): create Kibana Dockerfile`

---

#### Task 2.3: Create Kibana configuration file

- **Requirements reference**
  - `Section 2` L159–L179
  - "elasticsearch.hosts: [http://search:9200]"

- **Microagent role**
  - Configuration microagent
  - Voting: no

- **Goal**
  - Create `kibana/config/kibana.yml` with correct Elasticsearch connection and X-Pack features.

- **Atomicity**
  - This task creates: 1 directory + 1 file (`kibana/config/kibana.yml`)
  - It has exactly one observable outcome: valid YAML config

- **State to load**
  - Reference: `observability-opportunities.md` L161–L179
  - Commands:
    - `ls kibana/` (verify directory structure)

- **Steps**
  1. Create `kibana/config/` directory.
  2. Create `kibana/config/kibana.yml` with content from requirements.
  3. Validate YAML syntax.

- **Acceptance criteria (task)**
  1. `kibana/config/kibana.yml` exists.
  2. Contains `elasticsearch.hosts: ["http://search:9200"]`.
  3. Contains `xpack.observability.enabled: true`.
  4. YAML is valid.

- **Test scenario(s) (run now)**
  - scenario: validate kibana.yml
    - Given `kibana/config/kibana.yml` created
    - When `grep "elasticsearch.hosts" kibana/config/kibana.yml`
    - Then output contains "http://search:9200"

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- signatures
  - `signature CreateKibanaConfig(esHost: string): YAML`

- file paths and artifacts
  - Create: `kibana/config/` directory
  - Create: `kibana/config/kibana.yml` (committed)

- quick test hook
  - `cat kibana/config/kibana.yml | grep -E "elasticsearch|xpack"`

##### Git (end of task)

- Message: `feat(phase2:2.3): create Kibana configuration file`

---

### Implementation overview (phase 2)

- **Short narrative**
  - Phase 2 creates the complete Kibana custom service from scratch.
  - Tasks are independent and can theoretically run in parallel, but sequenced for clarity.
  - Each task creates exactly one artifact with clear validation.

- **Flow sketch**
  - `create directory → create LCP.json → create Dockerfile → create config → validate all → commit → report`

- **Primary modules and files**
  - `kibana/LCP.json`
  - `kibana/Dockerfile`
  - `kibana/config/kibana.yml`

- **Integration test intents**
  - All files exist in correct locations
  - Version consistency (7.17.23) across files
  - Kibana points to search service

---

## Phase 3 – Liferay-Kibana integration

### Requirements reference

- `Section 3. Configure Liferay to Connect to Kibana` L183–L191
- "kibanaURL=http://kibana:5601"

### Description (result)

- This phase configures Liferay to connect to Kibana for the monitoring widget.
- Complete when OSGi config file exists with correct kibanaURL.
- Contributes to integrated observability within Liferay DXP.

### Boundaries

- In:
  - Creating OSGi configuration file for Liferay
- Out:
  - Deployment (phase 4)
  - Kibana service changes (phase 2, already complete)

### Deliverables

- `liferay/configs/common/osgi/configs/com.liferay.portal.search.elasticsearch.monitoring.web.internal.configuration.MonitoringConfiguration.config`
- `/status-report/task-3.1.md`

### Acceptance criteria (phase)

1. OSGi config file exists in correct path.
2. Contains `kibanaURL="http://kibana:5601"`.

### UAT

- scenario: validate OSGi config
  - Given OSGi config file exists
  - When `cat liferay/configs/common/osgi/configs/com.liferay.portal.search.elasticsearch.monitoring.web.internal.configuration.MonitoringConfiguration.config`
  - Then output contains `kibanaURL="http://kibana:5601"`

---

### Tasks

#### Task 3.1: Create Liferay monitoring OSGi configuration

- **Requirements reference**
  - `Section 3` L183–L191
  - "kibanaURL=http://kibana:5601"

- **Microagent role**
  - Configuration microagent
  - Voting: no

- **Goal**
  - Create OSGi config file that points Liferay's monitoring widget to Kibana.

- **Atomicity**
  - This task creates: 1 file (OSGi config)
  - It has exactly one observable outcome: valid config file

- **State to load**
  - Reference: `observability-opportunities.md` L185–L191
  - Commands:
    - `ls liferay/configs/` (verify structure)

- **Steps**
  1. Create directory path if not exists: `liferay/configs/common/osgi/configs/`
  2. Create config file with kibanaURL and proxyServletLogEnable.
  3. Verify file syntax (properties format).

- **Acceptance criteria (task)**
  1. Config file exists at correct path.
  2. Contains `kibanaURL="http://kibana:5601"`.
  3. Contains `proxyServletLogEnable=B"false"`.

- **Test scenario(s) (run now)**
  - scenario: validate config content
    - Given config file created
    - When `grep "kibanaURL" <config-file-path>`
    - Then output contains `http://kibana:5601`

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Implementation guidance

- file paths and artifacts
  - Create: `liferay/configs/common/osgi/configs/com.liferay.portal.search.elasticsearch.monitoring.web.internal.configuration.MonitoringConfiguration.config` (committed)

- quick test hook
  - `cat liferay/configs/common/osgi/configs/*.MonitoringConfiguration.config`

##### Git (end of task)

- Message: `feat(phase3:3.1): create Liferay monitoring OSGi configuration`

---

## Phase 4 – UAT deployment and validation

### Requirements reference

- `Section 4. Deployment Checklist` L195–L208
- "Build + deploy", "Verify all services start"

### Description (result)

- This phase deploys all changes to UAT environment and validates the stack.
- Complete when all services are running and Kibana is accessible.
- Contributes to confidence before production deployment.

### Boundaries

- In:
  - Deploying to UAT environment
  - Verifying service health
  - Testing Kibana connectivity
- Out:
  - Production deployment (phase 5)
  - Application-level testing

### Deliverables

- Successful UAT deployment
- Service health verification
- `/status-report/task-4.1.md`
- `/status-report/task-4.2.md`
- `/status-report/task-4.3.md`

### Acceptance criteria (phase)

1. All configuration files committed and pushed.
2. UAT build triggered successfully.
3. Search service shows 3 healthy nodes.
4. Kibana service shows 2 healthy pods.
5. Kibana UI is accessible.

### UAT

- scenario: end-to-end UAT validation
  - Given all changes deployed to UAT
  - When accessing Kibana URL and ES health endpoint
  - Then Kibana returns 200 OK and ES cluster status is green/yellow with 3 nodes

---

### Tasks

#### Task 4.1: Push changes and trigger UAT build

- **Requirements reference**
  - `Section 4` L205
  - "Build + deploy"

- **Microagent role**
  - Infrastructure microagent
  - Voting: no

- **Goal**
  - Push all committed changes to trigger Liferay Cloud build for UAT.

- **Atomicity**
  - This task executes: git push
  - It has exactly one observable outcome: build triggered

- **State to load**
  - Commands:
    - `git status`
    - `git log --oneline -5`
    - `git remote -v`

- **Steps**
  1. Verify all changes committed.
  2. Verify remote is correct.
  3. Push to main/master branch.
  4. Verify build is triggered in Liferay Cloud console.

- **Acceptance criteria (task)**
  1. `git push` succeeds.
  2. Build appears in Liferay Cloud console.

- **Test scenario(s) (run now)**
  - scenario: verify push
    - Given all changes committed
    - When `git push origin main`
    - Then exit code 0 and refs updated

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

##### Git (end of task)

- This task IS the git push.
- No additional commit needed.

---

#### Task 4.2: Deploy build to UAT environment

- **Requirements reference**
  - `Section 4` L205
  - "Build + deploy"

- **Microagent role**
  - Infrastructure microagent
  - Voting: yes (candidates=3) – critical deployment

- **Goal**
  - Deploy the successful build to UAT environment.

- **Atomicity**
  - This task executes: deployment command
  - It has exactly one observable outcome: services deployed to UAT

- **State to load**
  - Commands:
    - `lcp deploy --help` (verify CLI available)
  - Liferay Cloud console: identify build number

- **Steps**
  1. Wait for build to complete successfully.
  2. Deploy build to UAT environment using lcp CLI or console.
  3. Monitor deployment progress.

- **Acceptance criteria (task)**
  1. Deployment completes without errors.
  2. All services show as "Running" in console.

- **Test scenario(s) (SIMULATED)**
  - scenario: deploy to UAT
    - Given build #<number> completed
    - When deploy to UAT via console/CLI
    - Then deployment status shows "Succeeded"
  - Note: SIMULATED because requires Liferay Cloud console access

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

---

#### Task 4.3: Validate UAT services health

- **Requirements reference**
  - `Section 4` L206–L208
  - "Verify all services start", "Verify Kibana UI"

- **Microagent role**
  - Validation microagent
  - Voting: no

- **Goal**
  - Verify search service has 3 nodes, Kibana has 2 pods, and UI is accessible.

- **Atomicity**
  - This task executes: health checks
  - It has exactly one observable outcome: documented health status

- **State to load**
  - Commands (via Liferay Cloud console or exposed endpoints):
    - ES health: `GET /_cluster/health`
    - Kibana status: `GET /api/status`

- **Steps**
  1. Check Elasticsearch cluster health.
  2. Verify 3 nodes in cluster.
  3. Check Kibana service status.
  4. Verify 2 pods running.
  5. Access Kibana UI.
  6. Document results.

- **Acceptance criteria (task)**
  1. ES cluster health is green or yellow.
  2. ES node count is 3.
  3. Kibana status is "available".
  4. Kibana UI loads successfully.

- **Test scenario(s) (SIMULATED)**
  - scenario: ES cluster health
    - Given UAT deployed
    - When `curl -s http://search:9200/_cluster/health | jq '{status, number_of_nodes}'`
    - Then status is "green" or "yellow" and number_of_nodes is 3
  - Note: SIMULATED because requires internal network access

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

---

## Phase 5 – Production deployment

### Requirements reference

- `Section 4` (implied production readiness after UAT)
- "Deploy to UAT first before production"

### Description (result)

- This phase deploys the validated stack to production.
- Complete when PRD environment has all services running.
- Contributes to production observability.

### Boundaries

- In:
  - Deploying to PRD environment
  - Verifying production health
- Out:
  - Post-deployment monitoring setup
  - Alerting configuration

### Deliverables

- Successful PRD deployment
- Service health verification
- `/status-report/task-5.1.md`
- `/status-report/task-5.2.md`

### Acceptance criteria (phase)

1. PRD deployment completes successfully.
2. All services healthy in PRD.
3. Kibana accessible in PRD.

---

### Tasks

#### Task 5.1: Deploy to production environment

- **Requirements reference**
  - Production deployment after UAT validation

- **Microagent role**
  - Infrastructure microagent
  - Voting: yes (candidates=3) – critical production change

- **Goal**
  - Deploy the validated build to PRD environment.

- **Atomicity**
  - One deployment action

- **Steps**
  1. Confirm UAT validation passed (check phase 4 report).
  2. Deploy same build to PRD via console/CLI.
  3. Monitor deployment.

- **Acceptance criteria (task)**
  1. PRD deployment succeeds.
  2. All services running.

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

---

#### Task 5.2: Validate production services health

- **Requirements reference**
  - Production validation

- **Microagent role**
  - Validation microagent
  - Voting: no

- **Goal**
  - Verify production stack is healthy.

- **Steps**
  1. Check ES cluster health in PRD.
  2. Verify 3 nodes.
  3. Check Kibana status.
  4. Verify 2 pods.
  5. Document results.

- **Acceptance criteria (task)**
  1. ES cluster healthy with 3 nodes.
  2. Kibana accessible with 2 pods.

- **Status**
  - [ ] todo
  - [ ] doing
  - [ ] done

---

## Phase wrap-up template

### Git (end of each phase)

- Create a commit summarizing phase completion.
- Push to the remote repository.
- Record branch and commit SHA.
- Never add AI as author or co-author.

### Phase report (write to `/status-report/phase-<n>.md`)

Template:
```markdown
# Phase <n>: <name>

## Execution summary
- Start date: <timestamp>
- End date: <timestamp>
- Branch: <branch>
- Final commit SHA: <sha>

## Tasks completed
| Task ID | Name | Commit SHA | Status |
|---------|------|------------|--------|
| <id> | <name> | <sha> | done |

## Integration test results
- <test name>: PASS/FAIL
- <test name>: PASS/FAIL

## Challenges and resolutions
- <challenge>: <resolution>

## Learnings
- <learning>

## Go/no-go decision
- Decision: GO / NO-GO
- Rationale: <reason>

## Requirements covered
- <section>: covered by tasks <ids>
```

### Checkpoint (before moving to next phase)

- Scan `observability-plan.md` and `observability-opportunities.md`.
- Ask via MCP: "Did this phase achieve the intended outcome per requirements? If not, what is the smallest set of changes to realign?"

---

## Summary

| Phase | Name | Tasks | Critical (voting) |
|-------|------|-------|-------------------|
| 0 | Decomposition and planning | - | No |
| 1 | Search service scaling | 1.1, 1.2 | 1.2 (yes) |
| 2 | Kibana service creation | 2.1, 2.2, 2.3 | No |
| 3 | Liferay-Kibana integration | 3.1 | No |
| 4 | UAT deployment and validation | 4.1, 4.2, 4.3 | 4.2 (yes) |
| 5 | Production deployment | 5.1, 5.2 | 5.1 (yes) |

**Total tasks**: 11
**Critical tasks (with voting)**: 3
**Estimated files changed**: 5 new/modified files
