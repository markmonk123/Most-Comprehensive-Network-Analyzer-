function toInteger(str, base = 10) {
  const num = parseInt(str, base);
  if (isNaN(num)) return null;
  return num;
}

function validateIPv4(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every(part => {
    // No leading zeros unless the part is '0'
    if (part.length > 1 && part.startsWith('0')) return false;
    const num = toInteger(part, 10);
    return num !== null && num >= 0 && num <= 255;
  });
}

function validateIPv6(ip) {
  // Remove subnet if present
  const [address, prefix] = ip.split("/");
  if (prefix && (isNaN(prefix) || prefix < 0 || prefix > 128)) return false;

  // Expand shortened IPv6
  let parts = address.split(":");
  if (address.includes("::")) {
    // Expand ::
    const emptySections = 8 - (parts.filter(Boolean).length);
    const expanded = [];
    let expandedOnce = false;
    for (let part of parts) {
      if (part === "" && !expandedOnce) {
        for (let i = 0; i <= emptySections; i++) expanded.push("0");
        expandedOnce = true;
      } else if (part !== "") {
        expanded.push(part);
      }
    }
    parts = expanded;
  }
  if (parts.length !== 8) return false;
  return parts.every(part => {
    if (part.length === 0 || part.length > 4) return false;
    const num = toInteger(part, 16);
    return num !== null && num >= 0 && num <= 0xFFFF;
  });
}

function validateIP(ip) {
  if (typeof ip !== "string") return false;
  ip = ip.trim();
  return validateIPv4(ip) || validateIPv6(ip);
}

module.exports = { validateIP, validateIPv4, validateIPv6 };