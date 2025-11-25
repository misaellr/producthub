# Task 1.1: Verify current search service configuration

## Execution summary
- Date: 2025-11-25
- Status: COMPLETE

## Current configuration

| Property | Value |
|----------|-------|
| kind | StatefulSet |
| id | search |
| image | liferaycloud/elasticsearch:7.17.23-5.3.2 |
| scale | 1 |
| memory | 8192 |
| cpu | 8 |
| podManagementPolicy | Parallel |
| env.ES_JAVA_OPTS | -Xms4096m -Xmx4096m |
| env.ENABLE_XPACK_MONITORING | **not set** |
| volumes.esdata | /data |

## Validation results

| Check | Result |
|-------|--------|
| JSON syntax | PASS |
| Required field: kind | PASS (StatefulSet) |
| Required field: id | PASS (search) |
| Required field: image | PASS |
| Required field: podManagementPolicy | PASS (Parallel) |
| Git status | Clean (no uncommitted changes) |

## Changes needed for Task 1.2

1. Change `scale` from `1` to `3`
2. Add `ENABLE_XPACK_MONITORING: "true"` to `env` section

## Requirements covered

- Section 5, L212-L220: resource verification (baseline captured)
- Section 1, L72-L75: confirmed podManagementPolicy is "Parallel"
