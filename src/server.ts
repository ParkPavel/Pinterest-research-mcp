import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { pinterestGet, summarizePin } from './pinterest.js';

const galleryUri = 'ui://pinterest-research/gallery-v1.html';
const galleryHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{font-family:system-ui,sans-serif;color-scheme:light dark}body{margin:0;padding:16px}h2{font-size:18px}#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:12px}.pin{border:1px solid #8884;border-radius:12px;overflow:hidden}.pin img{width:100%;aspect-ratio:3/4;object-fit:cover}.pin a{color:inherit;text-decoration:none}.pin div{font-size:12px;padding:8px;overflow-wrap:anywhere}#status{color:gray;font-size:12px}
</style></head><body><h2>Pinterest Research · Pins</h2><p id="status">Waiting for Pinterest data…</p><div id="grid"></div><script>
function render(payload){const d=payload?.structuredContent??payload;const pins=Array.isArray(d?.items)?d.items:[];const grid=document.getElementById('grid');grid.replaceChildren();document.getElementById('status').textContent=pins.length+' pins';for(const pin of pins){const card=document.createElement('article');card.className='pin';const a=document.createElement('a');a.target='_blank';a.rel='noreferrer noopener';a.href=pin.pin_url||'#';const img=document.createElement('img');const images=pin.media?.images;const u=images?.['600x']?.url||images?.['400x300']?.url||images?.['originals']?.url||images?.['150x150']?.url;if(u&&/^https:\/\//.test(u)){img.src=u;img.alt=pin.alt_text||pin.title||'Pinterest pin';img.loading='lazy';a.append(img)}const title=document.createElement('div');title.textContent=pin.title||pin.description||pin.id||'Pin';a.append(title);card.append(a);grid.append(card)}}
window.addEventListener('message',event=>{const m=event.data;if(m?.method==='ui/notifications/tool-result')render(m.params);});if(window.openai?.toolOutput)render(window.openai.toolOutput);
</script></body></html>`;

export function createPinterestServer() {
  const server = new McpServer({name:'pinterest-research',version:'0.3.0'},{
    instructions:'Read-only Pinterest research. Use pinterest_boards to discover a board ID, pinterest_board_pins to inspect its actual images and metadata. Always cite pin_url as the source; never claim to see or analyze image pixels unless the client has actually viewed them. Use bookmark to fetch more.'
  });
  server.registerResource('pinterest-gallery',galleryUri,{description:'Pinterest gallery for pin results',mimeType:'text/html;profile=mcp-app'},async()=>({
    contents:[{uri:galleryUri,mimeType:'text/html;profile=mcp-app',text:galleryHtml}]
  }));
  const success=(value:unknown)=>({structuredContent:value as Record<string,unknown>,content:[{type:'text' as const,text:JSON.stringify(value,null,2)}]});
  const failure=(e:unknown)=>({isError:true,content:[{type:'text' as const,text:e instanceof Error?e.message:String(e)}]});
  function reg(name:string,title:string,description:string,schema:any,fn:(a:any)=>Promise<unknown>,withGallery=false){
    server.registerTool(name,{
      title,description,inputSchema:schema,annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
      ...(withGallery?{_meta:{ui:{resourceUri:galleryUri}}}:{})
    },async(args:any)=>{try{return success(await fn(args))}catch(e){return failure(e)}});
  }
  const page={page_size:z.number().int().min(1).max(250).default(50),bookmark:z.string().optional()};
  const id=z.string().regex(/^\d+$/);
  reg('pinterest_account','My Pinterest account','Get authorized Pinterest account info',{},()=>pinterestGet('/user_account'));
  reg('pinterest_boards','List Pinterest boards','List authorized boards with pagination',page,({page_size,bookmark})=>pinterestGet('/boards',{page_size,bookmark}));
  reg('pinterest_board','Get Pinterest board','Get a specific authorized board',{board_id:id},({board_id})=>pinterestGet(`/boards/${board_id}`));
  reg('pinterest_board_pins','Browse board pins','Get actual Pin metadata, URLs and media previews for a board',{board_id:id,...page},
    async({board_id,page_size,bookmark})=>{const r=await pinterestGet(`/boards/${board_id}/pins`,{page_size,bookmark});return {items:(r.items??[]).map(summarizePin),bookmark:r.bookmark??null}},true);
  reg('pinterest_pins','List my pins','List authorized account pins',page,
    async({page_size,bookmark})=>{const r=await pinterestGet('/pins',{page_size,bookmark});return {items:(r.items??[]).map(summarizePin),bookmark:r.bookmark??null}},true);
  reg('pinterest_pin','Get Pinterest pin','Get a single authorized pin with source link',{pin_id:id},
    async({pin_id})=>summarizePin(await pinterestGet(`/pins/${pin_id}`)));
  reg('pinterest_board_sections','List board sections','List sections of a board',{board_id:id,...page},
    ({board_id,page_size,bookmark})=>pinterestGet(`/boards/${board_id}/sections`,{page_size,bookmark}));
  reg('pinterest_section_pins','Browse section pins','List section pins with media',{board_id:id,section_id:id,...page},
    async({board_id,section_id,page_size,bookmark})=>{const r=await pinterestGet(`/boards/${board_id}/sections/${section_id}/pins`,{page_size,bookmark});return {items:(r.items??[]).map(summarizePin),bookmark:r.bookmark??null}},true);
  return server;
}
