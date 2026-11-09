(function(root){'use strict';
// Share a small network budget across all sprite, background and poster loaders.
// Existing onload/onerror callbacks keep their semantics; only final errors escape.
const LIMIT=8,queue=[];let active=0,peak=0;
function pump(){while(active<LIMIT&&queue.length){const job=queue.shift(),im=job.image;active++;peak=Math.max(peak,active);let settled=false;
 const release=()=>{if(settled)return;settled=true;active--;im.removeEventListener('load',loaded,true);im.removeEventListener('error',failed,true);Promise.resolve().then(pump);};
 const loaded=()=>release();
 const failed=event=>{const retry=job.attempt===0;if(retry)event.stopImmediatePropagation();release();if(retry)queue.unshift({...job,attempt:1});};
 im.addEventListener('load',loaded,true);im.addEventListener('error',failed,true);
 try{im.src=job.attempt?job.source+(job.source.includes('?')?'&':'?')+'__rift_retry=1':job.source;}catch(error){release();if(typeof im.onerror==='function')im.onerror(error);}
}}
function load(image,source){if(/^(data:|blob:)/.test(source)||typeof image.addEventListener!=='function'){image.src=source;return image;}queue.push({image,source,attempt:0});pump();return image;}
root.RiftImageQueue={load,stats:()=>({active,pending:queue.length,peak,limit:LIMIT})};
})(typeof window!=='undefined'?window:globalThis);
