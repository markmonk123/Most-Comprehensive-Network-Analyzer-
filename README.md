# Most-Comprehensive-Network-Analyzer-

## Trace API overview

This service exposes REST endpoints for trace collection, including GeoIP mapping (MaxMind),
RIPEstat routing context, traceroute hop data, and PTR records.

### Required GeoIP databases

Provide MaxMind MMDB files locally or via environment variables:

- `MAXMIND_COUNTRY_DB` (defaults to `GeoLite2-Country.mmdb` in repo root if present)
- `MAXMIND_ASN_DB` (defaults to `GeoLite2-ASN.mmdb` in repo root if present)

### Trace endpoint

POST ` /api/trace`

Payload:

```json
{ "ip": "8.8.8.8" }
```

Response includes:

- `trace`: traceroute hops (packet timing data where available) with GeoIP, ASN, and PTR records
- `ripe`: RIPEstat whois, routing-status, prefix-overview, and ASN history
- `ipv6Mapped`: IPv4-to-IPv6 mapped address for IPv4 targets
