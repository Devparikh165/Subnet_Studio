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
