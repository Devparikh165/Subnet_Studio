export function ipToLong(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  return parts.reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}
export function longToIp(long) {
  return [long >>> 24 & 255, long >>> 16 & 255, long >>> 8 & 255, long & 255].join('.');
}
export function cidrToMaskLong(cidr) {
  return cidr === 0 ? 0 : 0xffffffff << 32 - cidr >>> 0;
}
export function validateIp(ip) {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
}
function getIpClass(ipLong) {
  const firstOctet = ipLong >>> 24 & 255;
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E (Experimental)';
  return 'Unknown';
}
function getIpType(ipLong) {
  const firstOctet = ipLong >>> 24 & 255;
  const secondOctet = ipLong >>> 16 & 255;
  if (firstOctet === 10) return 'Private (RFC 1918)';
  if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return 'Private (RFC 1918)';
  if (firstOctet === 192 && secondOctet === 168) return 'Private (RFC 1918)';
  if (firstOctet === 127) return 'Loopback';
  if (firstOctet === 169 && secondOctet === 254) return 'APIPA (Link-Local)';
  if (firstOctet >= 224) return 'Reserved';
  return 'Public';
}
function toBinaryString(long) {
  return long.toString(2).padStart(32, '0');
}
export function getNetworkDetails(ipStr, cidr) {
  const ipLong = ipToLong(ipStr);
  const maskLong = cidrToMaskLong(cidr);
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | ~maskLong) >>> 0;
  const numHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.max(0, broadcastLong - networkLong - 1);
  const hostMinLong = cidr >= 31 ? networkLong : networkLong + 1;
  const hostMaxLong = cidr >= 31 ? broadcastLong : broadcastLong - 1;
  const ipClass = getIpClass(ipLong);
  const type = getIpType(ipLong);
  return {
    ip: ipStr,
    cidr,
    mask: longToIp(maskLong),
    network: longToIp(networkLong),
    broadcast: longToIp(broadcastLong),
    hostMin: longToIp(hostMinLong),
    hostMax: longToIp(hostMaxLong),
    numHosts,
    ipClass,
    type,
    ipBinary: toBinaryString(ipLong),
    maskBinary: toBinaryString(maskLong)
  };
}
export function checkOverlap(ip1, cidr1, ip2, cidr2) {
  if (!validateIp(ip1) || !validateIp(ip2)) return false;
  const long1 = ipToLong(ip1);
  const long2 = ipToLong(ip2);
  const minCidr = Math.min(cidr1, cidr2);
  const minMask = cidrToMaskLong(minCidr);
  const network1 = (long1 & minMask) >>> 0;
  const network2 = (long2 & minMask) >>> 0;
  return network1 === network2;
}
export function getSubnets(ipStr, originalCidr, newCidr) {
  if (newCidr <= originalCidr || newCidr > 32) return [];
  if (newCidr - originalCidr > 8) return []; // limit to 256 subnets for performance/display

  const originalDetails = getNetworkDetails(ipStr, originalCidr);
  const originalNetworkLong = ipToLong(originalDetails.network);
  const numSubnets = Math.pow(2, newCidr - originalCidr);
  const subnets = [];
  const hostsPerSubnet = Math.pow(2, 32 - newCidr);
  for (let i = 0; i < numSubnets; i++) {
    const currentNetworkLong = originalNetworkLong + i * hostsPerSubnet >>> 0;
    subnets.push(getNetworkDetails(longToIp(currentNetworkLong), newCidr));
  }
  return subnets;
}
export function generateRandomIp() {
  return [Math.floor(Math.random() * 223) + 1,
  // 1-223 (Avoid D/E)
  Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)].join('.');
}
export function generateRandomCidr() {
  return Math.floor(Math.random() * 23) + 8; // 8 to 30
}
export function validateIpv6(ip) {
  const regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return regex.test(ip);
}
export function expandIpv6(ip) {
  if (!validateIpv6(ip)) return ip;
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - (left.length + right.length);
    const middle = Array(missing).fill('0000');
    ip = [...left, ...middle, ...right].join(':');
  }
  return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}
export function ipv6ToBinary(ip) {
  const expanded = expandIpv6(ip);
  return expanded.split(':').map(part => parseInt(part, 16).toString(2).padStart(16, '0')).join('');
}
export function getIpv6Type(ip) {
  if (!validateIpv6(ip)) return 'Unknown';
  const expanded = expandIpv6(ip);
  const firstHextet = parseInt(expanded.split(':')[0], 16);
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback (::1)';
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') return 'Unspecified (::)';
  if (firstHextet >= 0x2000 && firstHextet <= 0x3fff) return 'Global Unicast';
  if (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) return 'Link-Local';
  if (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) return 'Unique Local';
  if (firstHextet >= 0xff00) return 'Multicast';
  return 'Reserved/Other';
}
export function getIpv6Details(ip) {
  if (!validateIpv6(ip)) return null;
  return {
    ip,
    expanded: expandIpv6(ip),
    type: getIpv6Type(ip),
    binary: ipv6ToBinary(ip)
  };
}
