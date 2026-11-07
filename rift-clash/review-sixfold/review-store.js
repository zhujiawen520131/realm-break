(function(root){
'use strict';
async function key(manifest,timeline){
 const text=JSON.stringify({manifest,timeline}),bytes=new TextEncoder().encode(text);
 if(!root.crypto?.subtle)throw new Error('浏览器无法核验内容指纹，请使用HTTPS或localhost预览');
 const digest=await root.crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 return 'rift-sixfold-review:'+String(manifest.revision||'unversioned')+':'+hash;
}
function storage(host){try{return host.localStorage||null;}catch(_){return null;}}
function initial(){return {verdict:'pending',overall:'',phases:{}};}
function restore(storage,storageKey){try{const v=JSON.parse(storage.getItem(storageKey)||'null');if(!v||typeof v!=='object')return initial();return {verdict:['pending','revise','approved'].includes(v.verdict)?v.verdict:'pending',overall:typeof v.overall==='string'?v.overall:'',phases:v.phases&&typeof v.phases==='object'?v.phases:{}};}catch(_){return initial();}}
root.SixfoldReviewStore={key,initial,restore,storage};if(typeof module!=='undefined')module.exports=root.SixfoldReviewStore;
})(typeof window!=='undefined'?window:globalThis);
