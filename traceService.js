const dns = require("dns").promises;
const fs = require("fs");
const net = require("net");
const path = require("path");
const maxmind = require("maxmind");

const { performTraceroute } = require("./traceroute");
const {
  queryRIPEstat,
  queryRipeRoutingStatus,
  queryRipePrefixOverview,
  queryRipeAsnHistory,
} = require("./ripeApi");

const defaultDbCandidates = {
  country: ["GeoLite2-Country.mmdb", "GeoLite2-City.mmdb"],
  asn: ["GeoLite2-ASN.mmdb"],
};

const maxmindReaders = {
  country: null,
  asn: null,
};

const resolveMaxMindPath = (envKey, candidates) => {
  if (process.env[envKey]) {
    return process.env[envKey];
  }
  const repoRoot = __dirname;
  return candidates
    .map((candidate) => path.join(repoRoot, candidate))
    .find((candidate) => fs.existsSync(candidate)) || null;
};

const loadMaxMindReaders = async () => {
  if (maxmindReaders.country || maxmindReaders.asn) {
    return;
  }
  const countryPath = resolveMaxMindPath("MAXMIND_COUNTRY_DB", defaultDbCandidates.country);
  const asnPath = resolveMaxMindPath("MAXMIND_ASN_DB", defaultDbCandidates.asn);

  if (countryPath) {
    try {
      maxmindReaders.country = await maxmind.open(countryPath);
    } catch (error) {
      console.warn(`MaxMind country DB failed to load: ${error.message}`);
    }
  }

  if (asnPath) {
    try {
      maxmindReaders.asn = await maxmind.open(asnPath);
    } catch (error) {
      console.warn(`MaxMind ASN DB failed to load: ${error.message}`);
    }
  }
};

const lookupGeo = (ip) => {
  if (!maxmindReaders.country) return null;
  return maxmindReaders.country.get(ip) || null;
};

const lookupAsn = (ip) => {
  if (!maxmindReaders.asn) return null;
  return maxmindReaders.asn.get(ip) || null;
};

const mapIpv4ToIpv6 = (ip) => {
  if (net.isIP(ip) === 4) {
    return `::ffff:${ip}`;
  }
  return ip;
};

const getPtrRecords = async (ip) => {
  try {
    return await dns.reverse(ip);
  } catch (error) {
    return [];
  }
};

const buildTraceReport = async (ip) => {
  await loadMaxMindReaders();

  const ipv6Mapped = mapIpv4ToIpv6(ip);
  const [traceData, whois, routingStatus, prefixOverview, asnHistory, targetPtr] =
    await Promise.all([
      performTraceroute(ip),
      queryRIPEstat(ip),
      queryRipeRoutingStatus(ip),
      queryRipePrefixOverview(ip),
      queryRipeAsnHistory(ip),
      getPtrRecords(ip),
    ]);

  const trace = await Promise.all(
    traceData.map(async (hop) => {
      if (!hop.ip) {
        return { ...hop, geo: null, asn: null, ptr: [] };
      }
      const [geo, asn, ptr] = await Promise.all([
        lookupGeo(hop.ip),
        lookupAsn(hop.ip),
        getPtrRecords(hop.ip),
      ]);
      return {
        ...hop,
        geo,
        asn,
        ptr,
      };
    })
  );

  return {
    ip,
    ipv6Mapped,
    ptrRecords: targetPtr,
    ripe: {
      whois,
      routingStatus,
      prefixOverview,
      asnHistory,
    },
    trace,
  };
};

module.exports = { buildTraceReport };
