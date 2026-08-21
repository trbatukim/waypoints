import type { NextConfig } from "next";
import dns from 'node:dns'
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net'
import { setGlobalDispatcher, Agent } from 'undici'

setGlobalDispatcher(new Agent({ connect: { family: 4 } }))
setDefaultAutoSelectFamilyAttemptTimeout(100)
dns.setDefaultResultOrder('ipv4first')

const nextConfig: NextConfig = {
  // Needed for JS to work on mobile over LAN
  allowedDevOrigins: ['192.168.1.178', '192.168.0.192'],
};

export default nextConfig;
