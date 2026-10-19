import 'dotenv/config';
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createPinterestServer } from './server.js';

const host=process.env.MCP_BIND_HOST??'127.0.0.1';
const port=Number(process.env.MCP_PORT??8787);
const secret=process.env.MCP_SERVER_TOKEN;
if(!secret || secret.length<32) throw new Error('MCP_SERVER_TOKEN must be at least 32 characters for private account data');
function valid(value:string|undefined){
  const provided=value?.startsWith('Bearer ')?value.slice(7):'';
  const a=Buffer.from(provided),b=Buffer.from(secret!);
  return a.length===b.length && timingSafeEqual(a,b);
}
createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/healthz'){res.writeHead(200,{'Content-Type':'application/json'}).end('{"status":"ok"}');return}
  if(req.url!=='/mcp'){res.writeHead(404).end('Not Found');return}
  if(!valid(req.headers.authorization)){res.writeHead(401,{'Content-Type':'application/json','WWW-Authenticate':'Bearer realm="Pinterest Research MCP"'}).end('{"error":"Unauthorized"}');return}
  if(req.method==='GET'||req.method==='DELETE'){res.writeHead(405,{'Allow':'POST'}).end('Method Not Allowed');return}
  if(req.method!=='POST'){res.writeHead(405,{'Allow':'POST'}).end('Method Not Allowed');return}
  const server=createPinterestServer();
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
  try{
    await server.connect(transport);
    res.on('close',()=>{void transport.close();void server.close()});
    await transport.handleRequest(req,res);
  }catch(error){
    console.error('MCP request failed:',error instanceof Error?error.message:'unknown');
    if(!res.headersSent)res.writeHead(500).end('Internal Server Error');
    void transport.close();void server.close();
  }
}).listen(port,host,()=>console.log(`Pinterest MCP listening on http://${host}:${port}/mcp`));
