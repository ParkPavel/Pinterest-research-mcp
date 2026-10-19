import 'dotenv/config';
import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createPinterestServer } from './server.js';
import { verify, challenge, resourceMetadata } from './oauth.js';

const host=process.env.MCP_BIND_HOST??'127.0.0.1';
const port=Number(process.env.MCP_PORT??8787);
createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const path=new URL(req.url??'/', 'http://localhost').pathname;
  if(path==='/healthz'){res.writeHead(200,{'Content-Type':'application/json'}).end('{"status":"ok"}');return}
  if(path==='/.well-known/oauth-protected-resource'){
    const metadata=resourceMetadata();
    if(!metadata){res.writeHead(404).end('OAuth is not configured');return}
    res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(metadata));return;
  }
  if(path!=='/mcp'){res.writeHead(404).end('Not Found');return}
  if(!await verify(req.headers.authorization)){
    res.writeHead(401,{'Content-Type':'application/json','WWW-Authenticate':challenge()}).end('{"error":"Unauthorized"}');return;
  }
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
}).listen(port,host,()=>console.log('Pinterest MCP listening on http://'+host+':'+port+'/mcp'));
