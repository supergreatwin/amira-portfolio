import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../the-process/process-auth-core.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/,'').replace(/export /g,'');
function boot(href,saved=false){
  const clients=[],storage=new Map(saved?[['amira-process-recovery-pending-v1','1']]:[]);
  const context={URL,URLSearchParams,location:{href},history:{replaceState(){}},
    sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    createClient:(url,key,options)=>{clients.push(options);return {auth:{}};}};
  vm.createContext(context);vm.runInContext(source,context);
  return {clients,storage,context};
}
test('Recovery callbacks and reloads cannot become persistent Process sessions',()=>{
  for(const [href,saved] of [
    ['https://amiraabdelfadil.com/the-process/?recover=1',false],
    ['https://amiraabdelfadil.com/the-process/#type=recovery&access_token=test',false],
    ['https://amiraabdelfadil.com/the-process/',true]
  ]){
    const {clients,storage,context}=boot(href,saved);
    assert.equal(clients[0].auth.detectSessionInUrl,false);
    vm.runInContext('processRecoveryAuth();processRecoveryAuth();',context);
    assert.equal(clients.length,2);
    assert.equal(clients[1].auth.persistSession,false);
    assert.equal(clients[1].auth.autoRefreshToken,false);
    assert.equal(storage.get('amira-process-recovery-pending-v1'),'1');
    vm.runInContext('clearProcessRecovery()',context);
    assert.equal(storage.size,0);
  }
});
test('Ordinary Process sign-in keeps its independent session',()=>{
  const {clients}=boot('https://amiraabdelfadil.com/the-process/');
  assert.equal(clients.length,1);
  assert.equal(clients[0].auth.storageKey,'amira-process-session-v1');
  assert.equal(clients[0].auth.detectSessionInUrl,true);
});
