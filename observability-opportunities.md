# Observability Setup for Liferay Cloud

This document outlines how to deploy **3 Elasticsearch search nodes** and **2 observability nodes with Kibana** in Liferay Cloud.

**Key insight**: In Liferay Cloud PaaS, Observability is a **feature layer** (indices, dashboards, APM, logs, metrics) on top of the **same Elasticsearch cluster** used for search, provided via Liferay Enterprise Search (LES). The "2 observability nodes" are **2 Kibana pods** that expose the Observability features.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Liferay Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │   Liferay   │────▶│     search service (ES)         │   │
│  │   Service   │     │         scale: 3                │   │
│  └─────────────┘     │  ┌─────┐ ┌─────┐ ┌─────┐       │   │
│         │            │  │node1│ │node2│ │node3│       │   │
│         │            │  └─────┘ └─────┘ └─────┘       │   │
│         │            └─────────────────────────────────┘   │
│         │                          ▲                       │
│         │                          │                       │
│         ▼                          │                       │
│  ┌─────────────────────────────────┴───────────────────┐   │
│  │           kibana service (Custom)                   │   │
│  │                  scale: 2                           │   │
│  │           ┌─────────┐  ┌─────────┐                  │   │
│  │           │ kibana1 │  │ kibana2 │                  │   │
│  │           └─────────┘  └─────────┘                  │   │
│  │    (Observability UI, APM, Logs, Metrics)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Scale Search Service to 3 Nodes

Update `search/LCP.json`:

```json
{
  "kind": "StatefulSet",
  "id": "search",
  "image": "liferaycloud/elasticsearch:7.17.23-5.3.2",
  "cpu": 8,
  "memory": 8192,
  "scale": 3,
  "ports": [
    { "port": 9300, "external": false },
    { "port": 9200, "external": false }
  ],
  "env": {
    "ES_JAVA_OPTS": "-Xms4096m -Xmx4096m",
    "ENABLE_XPACK_MONITORING": "true"
  },
  "volumes": {
    "esdata": "/data"
  },
  "podManagementPolicy": "Parallel",
  "environments": {
    "infra": {
      "deploy": false
    }
  }
}
```

**Important**:
- `scale: 3` - Always use odd numbers for ES quorum
- `podManagementPolicy: "Parallel"` - **Must stay** for clustered ES (nodes must connect during startup)
- `ENABLE_XPACK_MONITORING: "true"` - Enables monitoring data collection

---

## 2. Add Kibana as Custom Service (2 Observability Nodes)

### Directory Structure

```
producthub/
├── backup/
├── ci/
├── database/
├── liferay/
├── search/
├── webserver/
└── kibana/                    # NEW
    ├── LCP.json
    ├── Dockerfile
    └── config/
        └── kibana.yml
```

### kibana/LCP.json

```json
{
  "id": "kibana",
  "kind": "Deployment",
  "image": "docker.elastic.co/kibana/kibana:7.17.23",
  "cpu": 2,
  "memory": 4096,
  "scale": 2,
  "ports": [
    { "port": 5601, "external": true }
  ],
  "loadBalancer": {
    "targetPort": 5601
  },
  "readinessProbe": {
    "httpGet": {
      "path": "/api/status",
      "port": 5601
    },
    "initialDelaySeconds": 30,
    "periodSeconds": 10
  },
  "livenessProbe": {
    "httpGet": {
      "path": "/api/status",
      "port": 5601
    },
    "initialDelaySeconds": 60,
    "periodSeconds": 30
  },
  "environments": {
    "infra": {
      "deploy": false
    },
    "prd": {
      "deploy": true
    },
    "uat": {
      "deploy": true
    }
  }
}
```

**Key points**:
- `scale: 2` - Your "2 observability nodes"
- Version **must match** your ES version (7.17.23)
- Ensure your PaaS plan has enough resources for custom services

### kibana/Dockerfile

```dockerfile
FROM docker.elastic.co/kibana/kibana:7.17.23

COPY config/kibana.yml /usr/share/kibana/config/kibana.yml

USER kibana
```

### kibana/config/kibana.yml

```yaml
server.name: kibana
server.host: "0.0.0.0"

# Connect to the search service (same ES cluster)
elasticsearch.hosts: ["http://search:9200"]

# Enable Observability features
xpack.apm.ui.enabled: true
xpack.infra.enabled: true
xpack.observability.enabled: true

# Monitoring
xpack.monitoring.enabled: true
xpack.monitoring.ui.enabled: true

# Disable telemetry
telemetry.enabled: false
```

---

## 3. Configure Liferay to Connect to Kibana

Create the file:
`liferay/configs/[ENV]/osgi/configs/com.liferay.portal.search.elasticsearch.monitoring.web.internal.configuration.MonitoringConfiguration.config`

```properties
kibanaURL="http://kibana:5601"
proxyServletLogEnable=B"false"
```

---

## 4. Deployment Checklist

- [ ] `search/LCP.json` → `scale: 3`
- [ ] `search/LCP.json` → `kind: StatefulSet`
- [ ] `search/LCP.json` → `podManagementPolicy: "Parallel"`
- [ ] `search/LCP.json` → `ENABLE_XPACK_MONITORING=true` env var
- [ ] `kibana/` service created (LCP.json, Dockerfile, `config/kibana.yml`)
- [ ] `kibana/LCP.json` → `scale: 2`
- [ ] `kibana/LCP.json` → image version matches search (7.17.23)
- [ ] `liferay/configs/[ENV]/osgi/configs/...MonitoringConfiguration.config` pointing to `http://kibana:5601`
- [ ] Build + deploy
- [ ] Verify all services start
- [ ] Add Elasticsearch Monitoring widget in Liferay
- [ ] Verify Kibana UI + Observability views

---

## 5. Resource Requirements

| Service | Memory (MB) | CPU | Scale | Total Memory | Total CPU |
|---------|-------------|-----|-------|--------------|-----------|
| search  | 8192        | 8   | 3     | 24,576 MB    | 24        |
| kibana  | 4096        | 2   | 2     | 8,192 MB     | 4         |
| **Total** |           |     |       | **32,768 MB**| **28**    |

Verify your PaaS plan has sufficient resources in "Plan & Usage" console.

---

## 6. Optional: APM, Logs, and Metrics

For richer Observability (APM traces, log aggregation, infrastructure metrics), configure Beats/APM agents to send data to the same ES cluster:

- **APM Agent**: Add to Liferay's JVM options
- **Filebeat**: For log aggregation
- **Metricbeat**: For system/container metrics

All fully supported by the LES license on PaaS.

---

## References

- [Search Service (Elasticsearch)](https://learn.liferay.com/w/dxp/cloud/platform-services/search-service)
- [Upgrading to a High Availability Subscription](https://learn.liferay.com/w/dxp/cloud/reference/upgrading-to-a-high-availability-subscription)
- [How to setup Kibana in Liferay PaaS](https://learn.liferay.com/ja/l/33611795)
- [Liferay Enterprise Search](https://learn.liferay.com/w/dxp/search/liferay-enterprise-search)
- [Monitoring Elasticsearch](https://learn.liferay.com/w/dxp/search/liferay-enterprise-search/monitoring-elasticsearch)
