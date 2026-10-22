const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
let session = null;
const uploads = [];
const file = path.join(root, 'app/(chat)/api/files/upload/route.ts');
const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {
 target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
}}).outputText;
const moduleResult = {exports:{}};
const localRequire = id => id === '@/lib/auth-utils'
 ? {getEffectiveSession:async()=>session}
 : id === '@vercel/blob' ? {put:async(...args)=>{uploads.push(args);return {url:'https://synthetic.invalid/file.png'};}}
 : req(id);
vm.runInThisContext('(function(require,module,exports){'+source+'\n})', {filename:file})(localRequire,moduleResult,moduleResult.exports);
const route = moduleResult.exports;
const request = (file) => {
 const form = new FormData();
 if (file) form.append('file',file);
 return new Request('http://synthetic.invalid/api/files/upload',{method:'POST',body:form});
};
(async()=>{
 assert.equal(typeof req('@vercel/blob').put,'function');
 assert.equal((await route.POST(request())).status,401);
 session={user:{id:'synthetic'}};
 assert.equal((await route.POST(request())).status,400);
 assert.equal((await route.POST(request(new File(['synthetic'],'file.txt',{type:'text/plain'})))).status,400);
 assert.equal((await route.POST(request(new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'})))).status,400);
 assert.equal(uploads.length,0);
 const response=await route.POST(request(new File(['synthetic'],'file.png',{type:'image/png'})));
 assert.equal(response.status,200);
 assert.equal(uploads.length,1);
 assert.equal(uploads[0][0],'file.png');
 assert.equal(Buffer.from(uploads[0][1]).toString(),'synthetic');
 assert.deepEqual(uploads[0][2],{access:'public'});
 const mcpFile=path.join(root,'mods/mcp-client.ts');
 const mcpSource=ts.transpileModule(fs.readFileSync(mcpFile,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mcpModule={exports:{}};
 vm.runInThisContext('(function(require,module,exports){'+mcpSource+'\n})',{filename:mcpFile})(
  id=>id==='../lib/pd-backend-client'?{pdHeaders:async()=>({Authorization:'Bearer synthetic'})}:req(id),mcpModule,mcpModule.exports);
 const originalFetch=globalThis.fetch;
 const methods=[];
 globalThis.fetch=async(_url,options={})=>{
  if(options.method==='GET')return new Response(null,{status:405});
  if(options.method==='DELETE')return new Response(null,{status:200});
  const body=JSON.parse(options.body);methods.push(body.method);
  if(body.id===undefined)return new Response(null,{status:202});
  let result;
  if(body.method==='initialize')result={protocolVersion:body.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'synthetic',version:'1'}};
  else if(body.method==='tools/list')result={tools:[{name:'synthetic_tool',description:'fixture only',inputSchema:{type:'object',properties:{}}}]};
  else if(body.method==='tools/call'){
   assert.equal(body.params.name,'synthetic_tool');
   assert.deepEqual(body.params.arguments,{value:'synthetic'});
   result={content:[{type:'text',text:'synthetic tool result'}]};
  } else throw new Error('Unexpected MCP operation: '+body.method);
  return new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,result}),{status:200,headers:{'content-type':'application/json','mcp-session-id':'synthetic-session'}});
 };
 const manager=new mcpModule.exports.MCPSessionManager('http://synthetic.invalid','fixture','fixture',undefined);
 try {
  const tools=await manager.tools({useCache:false});
  assert.ok(tools.synthetic_tool);
  assert.ok(tools.Web_Search);
  await manager.tools({useCache:true});
  assert.equal(methods.filter(m=>m==='tools/list').length,1);
  assert.ok(!methods.includes('tools/call'));
  const result=await tools.synthetic_tool.execute({value:'synthetic'},{});
  assert.equal(result.content[0].text,'synthetic tool result');
  const calls=methods.filter(m=>m==='tools/call').length;
  for(const invalid of [null,[],42,'scalar'])await assert.rejects(()=>tools.synthetic_tool.execute(invalid,{}));
  assert.equal(methods.filter(m=>m==='tools/call').length,calls);
 } finally {manager.close();globalThis.fetch=originalFetch;}
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.equal(manifest.scripts.build,'next build');
 console.log('PASS: upload authorization/limits/contract; actual MCP client initialize/list/cache and synthetic tool argument validation through mocked transport; build cannot push database schema');
})().catch(e=>{console.error(e);process.exitCode=1;});
