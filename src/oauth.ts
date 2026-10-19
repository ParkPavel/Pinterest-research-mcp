import { createRemoteJWKSet, jwtVerify } from 'jose';
import { timingSafeEqual } from 'node:crypto';

const resource=process.env.MCP_PUBLIC_URL?.replace(/\/$/,'');
const issuer=process.env.OAUTH_ISSUER?.replace(/\/$/,'');
const audience=process.env.OAUTH_AUDIENCE??resource;
const scope=process.env.OAUTH_REQUIRED_SCOPE??'pinterest.read';
const staticToken=process.env.MCP_SERVER_TOKEN;
if(issuer && (!resource || !audience)) throw new Error('OAUTH_ISSUER requires MCP_PUBLIC_URL and OAUTH_AUDIENCE');
if(!issuer && (!staticToken || staticToken.length<32)) throw new Error('Set OAuth config, or a 32+ char MCP_SERVER_TOKEN for local testing');
if(!issuer && process.env.MCP_BIND_HOST && !['localhost','127.0.0.1','::1'].includes(process.env.MCP_BIND_HOST))
  throw new Error('Shared bearer mode is local-only. Configure an external OAUTH_ISSUER before binding publicly.');
const jwks=issuer?createRemoteJWKSet(new URL(issuer+'/.well-known/jwks.json')):undefined;

export function resourceMetadata(){
  if(!issuer||!resource)return undefined;
  return {resource:resource+'/mcp',authorization_servers:[issuer],scopes_supported:[scope],bearer_methods_supported:['header']};
}
export function challenge(){
  return resource ? 'Bearer resource_metadata="'+resource+'/.well-known/oauth-protected-resource", scope="'+scope+'"' : 'Bearer realm="Pinterest Research MCP"';
}
export async function verify(requestHeader:string|undefined):Promise<boolean>{
  const token=requestHeader?.startsWith('Bearer ')?requestHeader.slice(7):'';
  if(!token)return false;
  if(issuer&&jwks){
    try{
      const {payload}=await jwtVerify(token,jwks,{issuer,audience});
      if(typeof payload.scope==='string' && payload.scope.split(/\s+/).includes(scope)) return true;
      const permissions=payload.permissions;
      return Array.isArray(permissions)&&permissions.includes(scope);
    }catch{return false}
  }
  if(!staticToken)return false;
  const a=Buffer.from(token),b=Buffer.from(staticToken);
  return a.length===b.length&&timingSafeEqual(a,b);
}
