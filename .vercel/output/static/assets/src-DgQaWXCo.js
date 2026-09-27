import{i as e,n as t,r as n,t as r}from"./preload-helper-vuKwV25Y.js";var i=t(((e,t)=>{t.exports=class{#e;constructor(e=[]){this.#e=[new Map(e)]}get size(){return this.#e.reduce((e,t)=>e+t.size,0)}clear(){this.#e=[new Map]}delete(e){return this.#e.some(t=>t.delete(e))}get(e){for(let t of this.#e)if(t.has(e))return t.get(e)}has(e){return this.#e.some(t=>t.has(e))}set(e,t){let n=this.#e[0];for(let t of this.#e)if(t.has(e)){n=t;break}return!n.has(e)&&n.size>=8388608&&(this.#e.unshift(new Map),n=this.#e[0]),n.set(e,t),this}*[Symbol.iterator](){for(let e of this.#e)yield*e}*keys(){for(let e of this.#e)yield*e.keys()}*values(){for(let e of this.#e)yield*e.values()}*entries(){for(let e of this.#e)yield*e.entries()}forEach(e,t){for(let[n,r]of this)e.call(t,r,n,this)}}})),a=e(t(((e,t)=>{var n=i();function r(e,t){let n=e.toLowerCase(),i=t.toLowerCase();if(i===``)return!1;if(i.indexOf(`*`)===-1&&i.indexOf(`?`)===-1&&i.indexOf(`[`)===-1&&i.indexOf(`{`)===-1)return n===i;let a=i,o=a.match(/\{([^}]+)\}/);if(o)return o[1].split(`,`).map(e=>a.replace(o[0],e.trim())).some(t=>r(e,t));let s=``,c=0;for(;c<a.length;){let e=a[c];if(e===`*`)s+=`.*`;else if(e===`?`)s+=`.`;else if(e===`[`){let e=c+1,t=`[`;for(;e<a.length&&a[e]!==`]`;)t+=a[e],e++;e<a.length?(t+=`]`,s+=t,c=e):s+=`\\[`}else/[.+^${}()|\\]/.test(e)?s+=`\\`+e:s+=e;c++}try{return RegExp(`^`+s+`$`,`i`).test(e)}catch{return n===i}}var a=20;t.exports=class{constructor(e={}){typeof e==`string`&&(e={dbName:e}),this.store=new n,this.expireTimes=new n,this.db=null,this.dbName=e.dbName,this.dbVersion=e.dbVersion||1,this.isIndexedDBAvailable=!1,this.isInitialized=!1,this.initPromise=null,this.storeSet=(e,t)=>{this.store.set(e,t),this._initCleanupLoop(a),this.isIndexedDBAvailable&&this.db&&this._persistToIndexedDB(e,t)},this._initIndexedDB()}_initIndexedDB(){typeof window<`u`&&window.indexedDB&&this.dbName?(this.isIndexedDBAvailable=!0,this.initPromise=this._setupIndexedDB()):this.isInitialized=!0}async _setupIndexedDB(){try{this.db=await this._openDatabase(),await this._loadFromIndexedDB(),this.isInitialized=!0}catch(e){console.warn(`Failed to initialize IndexedDB:`,e),this.isIndexedDBAvailable=!1,this.isInitialized=!0}}_openDatabase(){return new Promise((e,t)=>{let n=indexedDB.open(this.dbName,this.dbVersion);n.onerror=()=>t(n.error),n.onsuccess=()=>e(n.result),n.onupgradeneeded=e=>{let t=e.target.result;t.objectStoreNames.contains(`store`)||t.createObjectStore(`store`,{keyPath:`key`}),t.objectStoreNames.contains(`expireTimes`)||t.createObjectStore(`expireTimes`,{keyPath:`key`})}})}async _loadFromIndexedDB(){if(this.db)try{let e=this.db.transaction([`store`,`expireTimes`],`readonly`),t=e.objectStore(`store`),n=e.objectStore(`expireTimes`),r=t.getAll(),i=n.getAll(),[a,o]=await Promise.all([new Promise((e,t)=>{r.onsuccess=()=>e(r.result),r.onerror=()=>t(r.error)}),new Promise((e,t)=>{i.onsuccess=()=>e(i.result),i.onerror=()=>t(i.error)})]);a.forEach(e=>{this.store.set(e.key,e.value)}),o.forEach(e=>{this.expireTimes.set(e.key,e.expireTime)});let s=Date.now();for(let[e,t]of this.expireTimes.entries())s>t&&(this.store.delete(e),this.expireTimes.delete(e),this._removeFromIndexedDB(e))}catch(e){console.warn(`Failed to load data from IndexedDB:`,e)}}async _persistToIndexedDB(e,t){if(this.db)try{this.db.transaction([`store`],`readwrite`).objectStore(`store`).put({key:e,value:t})}catch(e){console.warn(`Failed to persist to IndexedDB:`,e)}}async _persistExpirationToIndexedDB(e,t){if(this.db)try{let n=this.db.transaction([`expireTimes`],`readwrite`).objectStore(`expireTimes`);t===void 0?n.delete(e):n.put({key:e,expireTime:t})}catch(e){console.warn(`Failed to persist expiration to IndexedDB:`,e)}}async _removeFromIndexedDB(e){if(this.db)try{let t=this.db.transaction([`store`,`expireTimes`],`readwrite`),n=t.objectStore(`store`),r=t.objectStore(`expireTimes`);n.delete(e),r.delete(e)}catch(e){console.warn(`Failed to remove from IndexedDB:`,e)}}async waitForInitialization(){this.isInitialized||this.initPromise&&await this.initPromise}set(e,t,n={}){let{NX:r=!1,XX:i=!1,GET:a=!1,EX:o=void 0,PX:s=void 0,EXAT:c=void 0,PXAT:l=void 0,KEEPTTL:u=!1}=n,d=r,f=i,p=a,m=o?parseInt(o,10):void 0,h=s?parseInt(s,10):void 0,g=c?parseInt(c,10):void 0,_=l?parseInt(l,10):void 0,v=u,y=this.store.has(e);if(f&&!y||d&&y)return;let b;if(p&&y&&(b=this.store.get(e)),this.storeSet(e,t),m!==void 0||h!==void 0||g!==void 0||_!==void 0||v){let t;m===void 0?h===void 0?g===void 0?_===void 0?v&&y&&(t=this.expireTimes.get(e)):t=_:t=g*1e3:t=Date.now()+h:t=Date.now()+m*1e3,t!==void 0&&(this.expireTimes.set(e,t),this.isIndexedDBAvailable&&this.db&&this._persistExpirationToIndexedDB(e,t))}else this.expireTimes.delete(e),this.isIndexedDBAvailable&&this.db&&this._persistExpirationToIndexedDB(e,void 0);return!p||b}get(e){if(!this._checkAndRemoveExpiredKey(e))return this.store.get(e)}del(...e){let t=0;for(let n of e)this._checkAndRemoveExpiredKey(n)||this.store.delete(n)&&(this.expireTimes.delete(n),this.isIndexedDBAvailable&&this.db&&this._removeFromIndexedDB(n),t++);return t}exists(...e){let t=0;for(let n of e)this._checkAndRemoveExpiredKey(n)||this.store.has(n)&&t++;return t}incr(e){return this.incrby(e,1)}incrby(e,t){let n=this.store.get(e);if(n===void 0)n=0;else if(!Number.isInteger(Number(n)))throw Error(`ERR value is not an integer`);let r=Number(n)+t;return this.storeSet(e,r.toString()),r}decr(e){try{return this.decrby(e,1)}catch(e){throw e}}decrby(e,t){let n=this.store.get(e);if(n===void 0)n=0;else if(!Number.isInteger(Number(n)))throw Error(`ERR value is not an integer`);let r=Number(n)-t;return this.storeSet(e,r.toString()),r}expire(e,t,n={}){if(!this.store.has(e))return 0;let{NX:r=!1,XX:i=!1,GT:a=!1,LT:o=!1}=n,s=Date.now(),c=this.expireTimes.get(e);return r&&c!==void 0||i&&c===void 0||a&&(c===void 0||c<=s+t*1e3)||o&&(c===void 0||c>=s+t*1e3)?0:(this.expireTimes.set(e,s+t*1e3),1)}keys(e){let t=[];for(let[n,i]of this.store.entries())if(r(n,e)){let e=this.expireTimes.get(n);(e===void 0||e>Date.now())&&t.push(n)}return t}mget(...e){return e.map(e=>this.get(e))}mset(...e){if(e.length%2!=0)throw Error(`MSET requires an even number of arguments`);for(let t=0;t<e.length;t+=2)this.set(e[t],e[t+1]);return!0}renamenx(e,t){if(!this.store.has(e)||this.store.has(t))return 0;let n=this.store.get(e);if(this.store.delete(e),this.storeSet(t,n),this.expireTimes.has(e)){let n=this.expireTimes.get(e);this.expireTimes.delete(e),this.expireTimes.set(t,n)}return 1}randomkey(){let e=Array.from(this.store.keys());if(e.length!==0)return e[Math.floor(Math.random()*e.length)]}expireat(e,t,n={}){if(typeof t!=`number`||isNaN(t))throw Error(`ERR invalid expire time in SETEX`);if(!this.store.has(e))return 0;let{NX:r=!1,XX:i=!1,GT:a=!1,LT:o=!1}=n,s=Date.now(),c=t*1e3-s;if(c<=0)return this.store.delete(e),this.expireTimes.delete(e),0;let l=this.pttl(e);return i&&l===-1||r&&l!==-1||a&&l!==-1&&c<=l||o&&l!==-1&&c>=l?0:this.pexpire(e,c)}pexpire(e,t,n={}){let{NX:r=!1,XX:i=!1,GT:a=!1,LT:o=!1}=n;if(r&&this.store.has(e)||i&&!this.store.has(e))return 0;if(a||o){let n=this.pttl(e);if(a&&n>=t||o&&n<=t)return 0}return this.expireTimes.set(e,Date.now()+t),1}pexpireat(e,t){let n=t-Date.now();return n<=0?(this.store.delete(e),this.expireTimes.delete(e),0):this.pexpire(e,n)}pttl(e){if(!this.store.has(e))return-2;if(!this.expireTimes.has(e))return-1;let t=this.expireTimes.get(e)-Date.now();return t>0?t:-2}ttl(e){if(!this.store.has(e))return-2;if(!this.expireTimes.has(e))return-1;let t=Math.floor((this.expireTimes.get(e)-Date.now())/1e3);return t>0?t:-2}persist(e){return!this.store.has(e)||!this.expireTimes.has(e)?0:(this.expireTimes.delete(e),this.isIndexedDBAvailable&&this.db&&this._persistExpirationToIndexedDB(e,void 0),1)}getrange(e,t,n){let r=this.get(e);return typeof r==`string`?r.slice(t,n+1):``}getset(e,t){let n=this.get(e);return this.set(e,t),n}setex(e,t,n){if(this.store.has(e))return this.set(e,t),this.expire(e,n),!0}setrange(e,t,n){if(typeof t!=`number`||t<0)throw Error(`Invalid offset value`);if(typeof n!=`string`)throw Error(`Value must be a string`);let r=this.get(e);(r===void 0||r===void 0)&&(r=``);let i=r.slice(0,t),a=r.slice(t+n.length),o=i+n+a;return this.set(e,o),o.length}strlen(e){let t=this.get(e);return t===void 0?0:t.length}msetnx(...e){if(e.length%2!=0)throw Error(`MSETNX requires an even number of arguments`);for(let t=0;t<e.length;t+=2)if(this.store.has(e[t]))return 0;for(let t=0;t<e.length;t+=2)this.set(e[t],e[t+1]);return 1}incrbyfloat(e,t){let n=this.store.get(e);if(n===void 0)n=0;else if(isNaN(parseFloat(n)))throw Error(`ERR value is not a valid float`);let r=parseFloat(n)+t;return this.storeSet(e,r.toString()),r}append(e,t){let n=this.get(e),r=n===void 0?t:n+t;return this.set(e,r),r.length}getbit(e,t){let n=this.get(e);if(n===void 0||t>=n.length*8)return 0;let r=Math.floor(t/8),i=7-t%8;return n.charCodeAt(r)>>i&1}setbit(e,t,n){if(n!==0&&n!==1)throw Error(`ERR bit is not an integer or out of range`);let r=this.get(e);r===void 0&&(r=``);let i=Math.floor(t/8),a=7-t%8;for(;i>=r.length;)r+=`\0`;let o=r.charCodeAt(i),s=o>>a&1,c=o&~(1<<a)|n<<a,l=String.fromCharCode(c),u=r.slice(0,i),d=r.slice(i+1),f=u+l+d;return this.set(e,f),s}copy(e,t){let n=this.get(e);return n===void 0?0:(this.set(t,n),1)}rename(e,t){if(!this.store.has(e))throw Error(`ERR no such key`);if(e===t)return!0;let n=this.store.get(e),r=this.expireTimes.get(e);return this.storeSet(t,n),this.store.delete(e),r!==void 0&&(this.expireTimes.set(t,r),this.expireTimes.delete(e)),!0}type(e){return this.store.has(e)?typeof this.store.get(e):`none`}sadd(e,...t){this.store.has(e)||this.storeSet(e,new Set);let n=this.store.get(e);if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let r=0;for(let e of t)n.has(e)||(n.add(e),r++);return r}scard(e){let t=this.store.get(e);if(t===void 0)return 0;if(!(t instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return t.size}sdiff(e,...t){let n=this.store.get(e)||new Set;if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let r=new Set(n);for(let e of t){let t=this.store.get(e)||new Set;if(!(t instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);for(let e of t)r.delete(e)}return Array.from(r)}sdiffstore(e,t,...n){let r=this.sdiff(t,...n),i=new Set(r);return this.storeSet(e,i),i.size}sinter(...e){if(e.length===0)return[];let t=e.map(e=>{let t=this.store.get(e);if(t===void 0)return new Set;if(!(t instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return t}),n=new Set(t[0]);for(let e=1;e<t.length;e++)for(let r of n)t[e].has(r)||n.delete(r);return Array.from(n)}sintercard(...e){return this.sinter(...e).length}sinterstore(e,...t){let n=this.sinter(...t),r=new Set(n);return this.storeSet(e,r),r.size}sismember(e,t){let n=this.store.get(e);if(n===void 0)return!1;if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return!!n.has(t)}smembers(e){let t=this.store.get(e);if(t===void 0)return[];if(!(t instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return Array.from(t)}smismember(e,...t){let n=this.store.get(e)||new Set;if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return t.map(e=>+!!n.has(e))}smove(e,t,n){let r=this.store.get(e);if(r===void 0||!r.has(n))return 0;if(!(r instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let i=this.store.get(t)||new Set;if(!(i instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);return r.delete(n),i.add(n),this.storeSet(t,i),1}spop(e,t=1){let n=this.store.get(e);if(n===void 0)return[];if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let r=[];for(let e of n){if(r.length>=t)break;r.push(e),n.delete(e)}return r}srandmember(e,t=1){let n=this.store.get(e);if(n===void 0)return[];if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let r=Array.from(n),i=[];for(let e=0;e<t&&e<r.length;e++){let e=Math.floor(Math.random()*r.length);i.push(r[e]),r.splice(e,1)}return i}srem(e,...t){let n=this.store.get(e);if(n===void 0)return 0;if(!(n instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let r=0;for(let e of t)n.delete(e)&&r++;return r}sscan(e,t,n={}){let{match:r=`*`,count:i=10}=n,a=this.store.get(e);if(a===void 0)return[0,[]];if(!(a instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);let o=new RegExp(r.replace(`*`,`.*`)),s=Array.from(a),c=[],l=t;for(let e=t;e<s.length&&c.length<i;e++)o.test(s[e])&&c.push(s[e]),l=e+1;return[l>=s.length?0:l,c]}sunion(...e){let t=new Set;for(let n of e){let e=this.store.get(n)||new Set;if(!(e instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);for(let n of e)t.add(n)}return Array.from(t)}sunionstore(e,...t){let n=new Set;for(let e of t){let t=this.store.get(e)||new Set;if(!(t instanceof Set))throw Error(`ERR Operation against a key holding the wrong kind of value`);for(let e of t)n.add(e)}return this.storeSet(e,n),n.size}lset(e,t,n){let r=this.store.get(e);if(r===void 0)throw Error(`ERR no such key`);if(!Array.isArray(r))throw Error(`ERR Operation against a key holding the wrong kind of value`);if(t<0||t>=r.length)throw Error(`ERR index out of range`);return r[t]=n,!0}ltrim(e,t,n){let r=this.store.get(e);if(r===void 0)return!0;if(!Array.isArray(r))throw Error(`ERR Operation against a key holding the wrong kind of value`);let i=r.length,a=t>=0?t:Math.max(i+t,0),o=n>=0?n:Math.max(i+n,-1),s=r.slice(a,o+1);return this.storeSet(e,s),!0}rpop(e){let t=this.store.get(e);return t===void 0||!Array.isArray(t)?null:t.pop()}rpoplpush(e,t){let n=this.rpop(e);return n===void 0?null:(this.lpush(t,n),n)}rpush(e,...t){let n=this.store.get(e);if(n===void 0)n=[],this.storeSet(e,n);else if(!Array.isArray(n))throw Error(`ERR Operation against a key holding the wrong kind of value`);return n.push(...t),n.length}rpushx(e,t){let n=this.store.get(e);return n===void 0||!Array.isArray(n)?0:(n.push(t),n.length)}lpush(e,...t){let n=this.store.get(e);if(n===void 0)n=[],this.storeSet(e,n);else if(!Array.isArray(n))throw Error(`ERR Operation against a key holding the wrong kind of value`);return n.unshift(...t),n.length}lpushx(e,...t){let n=this.store.get(e);return n===void 0||!Array.isArray(n)?0:(n.unshift(...t),n.length)}lrange(e,t,n){let r=this.store.get(e);if(r===void 0||!Array.isArray(r))return[];let i=r.length,a=t>=0?t:Math.max(i+t,0),o=n>=0?n:Math.max(i+n,-1);return r.slice(a,o+1)}lrem(e,t,n){let r=this.store.get(e);if(r===void 0||!Array.isArray(r))return 0;let i=0;if(t>0)for(let e=0;e<r.length&&i<t;e++)r[e]===n&&(r.splice(e,1),i++,e--);else if(t<0)for(let e=r.length-1;e>=0&&i<-t;e--)r[e]===n&&(r.splice(e,1),i++);else i=r.filter(e=>e===n).length,this.storeSet(e,r.filter(e=>e!==n));return i}lmove(e,t,n,r){let i=n===`LEFT`?`lpop`:`rpop`,a=r===`LEFT`?`lpush`:`rpush`,o=this[i](e);return o===void 0?null:(this[a](t,o),o)}lmpop(e,t,n){let r=n===`LEFT`?`lpop`:`rpop`,i=[];for(let n=0;n<e;n++){let e=this[r](t);if(e===void 0)break;i.push(e)}return i}lpop(e){let t=this.store.get(e);return t===void 0||!Array.isArray(t)?null:t.shift()}lpos(e,t,n={}){let{rank:r=0,start:i=0,stop:a=-1}=n,o=this.store.get(e);if(o===void 0||!Array.isArray(o))return;let s=0,c=o.length,l=i>=0?i:Math.max(c+i,0),u=a>=0?a:Math.max(c+a,-1);for(let e=l;e<=u;e++)if(o[e]===t){if(s===r)return e;s++}}brpoplpush(e,t,n){let r=this.brpop(e,n);return r===void 0?null:(this.lpush(t,r),r)}lindex(e,t){let n=this.store.get(e);return n===void 0||!Array.isArray(n)?null:(t<0&&(t=n.length+t),n[t]===void 0?null:n[t])}linsert(e,t,n,r){let i=this.store.get(e);if(i===void 0)return 0;if(!Array.isArray(i))throw Error(`ERR Operation against a key holding the wrong kind of value`);let a=i.indexOf(n);if(a===-1)return 0;if(t===`BEFORE`)i.splice(a,0,r);else if(t===`AFTER`)i.splice(a+1,0,r);else throw Error(`ERR syntax error`);return i.length}llen(e){let t=this.store.get(e);return t===void 0?0:t.length}blmove(e,t,n,r,i){let a=n===`LEFT`?`blpop`:`brpop`,o=r===`LEFT`?`lpush`:`rpush`,s=this[a]([e],i);return s===void 0?null:(this[o](t,s[1]),s[1])}blmpop(e,t,...n){let r=[],i=t*1e3,a=n.length===1?`brpop`:`brpoplpush`,o=n.concat(i);for(let t=0;t<e;t++){let e=this[a](o);if(e===void 0)break;r.push(e)}return r}blpop(e,...t){return this.blmpop(1,e,...t)[0]}brpop(e,...t){let n=e*1e3,r=Date.now()+n;for(;Date.now()<r;)for(let e=0;e<t.length;e++){let n=t[e],r=this.store.get(n);if(r!==void 0&&Array.isArray(r)&&r.length>0){let e=r.pop();return r.length===0&&this.store.delete(n),[n,e]}}return null}expiretime(e){return this.expireTimes.get(e)}pexpiretime(e){let t=this.expireTimes.get(e);return t?t*1e3:null}zadd(e,t,r){return this._checkAndRemoveExpiredKey(e)?0:(this.store.has(e)||this.storeSet(e,new n),this.store.get(e).set(r,Number(t)),1)}zcard(e){return this._checkAndRemoveExpiredKey(e)||!this.store.has(e)?0:this.store.get(e).size}zcount(e,t,n){if(this._checkAndRemoveExpiredKey(e)||!this.store.has(e))return 0;let r=this.store.get(e),i=0;for(let e of r.values())e>=t&&e<=n&&i++;return i}zdiff(...e){if(e.length===0)return new Set;let t=e.map(e=>this._checkAndRemoveExpiredKey(e)?new n:this.store.get(e)||new n),r=new Set(t[0].keys());for(let e=1;e<t.length;e++)for(let n of t[e].keys())r.delete(n);return r}zdiffstore(e,...t){let r=this.ZDIFF(...t),i=new n;for(let e of r){let n=t.map(t=>{let n=this.store.get(t);return n?n.get(e):void 0}).filter(e=>e!==void 0);n.length>0&&i.set(e,Math.min(...n))}return this.storeSet(e,i),i.size}bzmpop(e,...t){let n=[];for(let r of t){let t=this.store.get(r);if(t&&t.size>0){let i=Array.from(t.entries()).sort((e,t)=>e[1]-t[1]).slice(0,e).map(([e,n])=>(t.delete(e),[e,n]));n.push([r,...i]);break}}return n}bzpopmax(e,t){let n=this.store.get(e);return!n||n.size===0?[]:[e,...Array.from(n.entries()).sort((e,t)=>t[1]-e[1]).slice(0,t).map(([e,t])=>(n.delete(e),[e,t]))]}bzpopmin(e,t){let n=this.store.get(e);return!n||n.size===0?[]:[e,...Array.from(n.entries()).sort((e,t)=>e[1]-t[1]).slice(0,t).map(([e,t])=>(n.delete(e),[e,t]))]}zincrby(e,t,r){this.store.has(e)||this.storeSet(e,new n);let i=this.store.get(e),a=(i.get(r)||0)+Number(t);return i.set(r,a),a}zinter(...e){if(e.length===0)return new Set;let t=e.map(e=>this.store.get(e)||new n),r=new Set(t[0].keys());for(let e=1;e<t.length;e++){let n=new Set;for(let i of t[e].keys())r.has(i)&&n.add(i);r.clear();for(let e of n)r.add(e)}return r}zintercard(...e){return this.ZINTER(...e).size}zinterstore(e,...t){let r=this.ZINTER(...t),i=new n;for(let e of r){let n=t.map(t=>{let n=this.store.get(t);return n?n.get(e):void 0}).filter(e=>e!==void 0);n.length>0&&i.set(e,Math.max(...n))}return this.storeSet(e,i),i.size}zlexcount(e,t,r){let i=this.store.get(e)||new n,a=Array.from(i.keys()).sort(),o=0;for(let e of a)e>=t&&e<=r&&o++;return o}zmpop(e,...t){let n=[];for(let r of t){let t=this.store.get(r);if(t&&t.size>0){let i=Array.from(t.entries()).sort((e,t)=>e[1]-t[1]).slice(0,e).map(([e,n])=>(t.delete(e),[e,n]));n.push([r,...i]);break}}return n}zmscore(e,...t){let r=this.store.get(e)||new n;return t.map(e=>r.get(e))}zpopmax(e,t){let n=this.store.get(e);return!n||n.size===0?[]:Array.from(n.entries()).sort((e,t)=>t[1]-e[1]).slice(0,t).map(([e,t])=>(n.delete(e),[e,t]))}zpopmin(e,t){let n=this.store.get(e);return!n||n.size===0?[]:Array.from(n.entries()).sort((e,t)=>e[1]-t[1]).slice(0,t).map(([e,t])=>(n.delete(e),[e,t]))}zrandmember(e,t=1){let n=this.store.get(e);if(!n||n.size===0)return[];let r=Array.from(n.keys()),i=[];for(let e=0;e<t;e++){let e=Math.floor(Math.random()*r.length);i.push(r[e])}return i}zrange(e,t,r){let i=this.store.get(e)||new n,a=Array.from(i.entries()).sort((e,t)=>e[1]-t[1]);return t<0&&(t=a.length+t),r<0&&(r=a.length+r),a.slice(t,r+1).map(([e,t])=>[e,t])}zrangebylex(e,t,r,i={}){let a=this.store.get(e)||new n,o=Array.from(a.keys()).sort().filter(e=>e>=t&&e<=r);if(i.limit){let{offset:e,count:t}=i.limit;o=o.slice(e,e+t)}return o}zrangebyscore(e,t,r,i={}){let a=this.store.get(e)||new n,o=Array.from(a.entries()).sort((e,t)=>e[1]-t[1]).filter(([,e])=>e>=t&&e<=r);if(o=i.withscores?o.map(([e,t])=>[e,t]):o.map(([e])=>e),i.limit){let{offset:e,count:t}=i.limit;o=o.slice(e,e+t)}return o}zrangestore(e,t,r,i){let a=this.store.get(t)||new n,o=Array.from(a.entries()).sort((e,t)=>e[1]-t[1]);r<0&&(r=o.length+r),i<0&&(i=o.length+i);let s=new n(o.slice(r,i+1));return this.storeSet(e,s),s.size}zrank(e,t){let n=this.store.get(e);if(!n)return;let r=Array.from(n.entries()).sort((e,t)=>e[1]-t[1]);for(let e=0;e<r.length;e++)if(r[e][0]===t)return e}zrem(e,...t){let n=this.store.get(e);if(!n)return 0;let r=0;for(let e of t)n.delete(e)&&r++;return r}zremrangebylex(e,t,n){let r=this.store.get(e);if(!r)return 0;let i=Array.from(r.keys()).sort(),a=0;for(let e of i)e>=t&&e<=n&&(r.delete(e),a++);return a}zremrangebyrank(e,t,n){let r=this.store.get(e);if(!r)return 0;let i=Array.from(r.entries()).sort((e,t)=>e[1]-t[1]);t<0&&(t=i.length+t),n<0&&(n=i.length+n);let a=0;for(let e=t;e<=n;e++)r.delete(i[e][0])&&a++;return a}zremrangebyscore(e,t,n){let r=this.store.get(e);if(!r)return 0;let i=Array.from(r.entries()).sort((e,t)=>e[1]-t[1]),a=0;for(let[e,o]of i)o>=t&&o<=n&&(r.delete(e),a++);return a}zrevrange(e,t,r){let i=this.store.get(e)||new n,a=Array.from(i.entries()).sort((e,t)=>t[1]-e[1]);return t<0&&(t=a.length+t),r<0&&(r=a.length+r),a.slice(t,r+1).map(([e,t])=>[e,t])}zrevrangebylex(e,t,r,i={}){let a=this.store.get(e)||new n,o=Array.from(a.keys()).sort().reverse().filter(e=>e>=r&&e<=t);if(i.limit){let{offset:e,count:t}=i.limit;o=o.slice(e,e+t)}return o}zrevrangebyscore(e,t,r,i={}){let a=this.store.get(e)||new n,o=Array.from(a.entries()).sort((e,t)=>t[1]-e[1]).filter(([,e])=>e>=r&&e<=t);if(o=i.withscores?o.map(([e,t])=>[e,t]):o.map(([e])=>e),i.limit){let{offset:e,count:t}=i.limit;o=o.slice(e,e+t)}return o}zrevrank(e,t){let n=this.store.get(e);if(!n)return;let r=Array.from(n.entries()).sort((e,t)=>t[1]-e[1]);for(let e=0;e<r.length;e++)if(r[e][0]===t)return e}zscan(e,t,r={}){let i=this.store.get(e)||new n,a=Array.from(i.entries()).sort((e,t)=>e[1]-t[1]),o=[],s=r.count||10,c=t;for(;s>0&&c<a.length;)(!r.match||new RegExp(r.match.replace(`*`,`.*`)).test(a[c][0]))&&(o.push(a[c]),s--),c++;return[c>=a.length?0:c,o]}zscore(e,t){let n=this.store.get(e);if(n)return n.get(t)}zunion(e){let t=new n;for(let n of e){let e=this.store.get(n);if(e)for(let[n,r]of e.entries())t.set(n,(t.get(n)||0)+r)}return Array.from(t.entries()).sort((e,t)=>e[1]-t[1])}zunionstore(e,t){let r=new n(this.zunion(t));return this.storeSet(e,r),r.size}geoadd(e,t,r,i){if(typeof t!=`number`||typeof r!=`number`)throw Error(`Invalid longitude or latitude value`);let a=this.store.get(e)||new n;if(!a.get(i)){let n={longitude:t,latitude:r};return a.set(i,n),this.storeSet(e,a),1}return 0}geodist(e,t,n,r=`m`){let i=this.store.get(e);if(!i)return;let a=i.get(t),o=i.get(n);if(!a||!o)return;let s=this._haversineDistance(a.latitude,a.longitude,o.latitude,o.longitude);return this._convertDistance(s,r)}geohash(e,...t){let n=this.store.get(e);return n?t.map(e=>{let t=n.get(e);return t?this._encodeGeohash(t.latitude,t.longitude):null}):[]}geopos(e,...t){let n=this.store.get(e);return n?t.map(e=>{let t=n.get(e);return t?[t.latitude,t.longitude]:null}):[]}georadius(e,t,n,r,i=`m`){let a=this.store.get(e);if(!a)return[];let o=this._convertDistance(r,i,`m`),s=[];for(let[e,r]of a.entries())this._haversineDistance(n,t,r.latitude,r.longitude)<=o&&s.push(e);return s}georadius_ro(e,t,n,r){return this.georadius(e,t,n,r,!0)}georadiusbymember(e,t,n){let r=this.geopos(e,t);if(r)return this.georadius(r[0],r[1],n,e)}georadiusbymember_ro(e,t,n){let r=this.geopos(e,t);if(r)return this.georadius(r[0],r[1],n,e,!0)}geosearch(e,t,n,r){return this.georadius(t,n,r,e)}geosearchstore(e,t,n,r,i){let a=this.georadius(n,r,i,t);return this.set(e,a),a.length}scan(e,t=`*`,n=10){let r=this.keys(t),i=Math.min(e+n,r.length);return[i===r.length?0:i,r.slice(e,i)]}sort(e,t=`ASC`,n=!1){let r=this.store.get(e);return Array.isArray(r)?r.slice().sort((e,r)=>n?t===`ASC`?e.localeCompare(r):r.localeCompare(e):t===`ASC`?e-r:r-e):[]}touch(...e){return e.reduce((e,t)=>e+ +!!this.exists(t),0)}sort_ro(e,t=`ASC`,n=!1){return this.sort(e,t,n)}unlink(...e){let t=0;for(let n of e)this.del(n)&&t++;return t}hset(e,t,r){this.store.has(e)||this.storeSet(e,new n);let i=this.store.get(e),a=!i.has(t);return i.set(t,r),+!!a}hdel(e,...t){let n=this.store.get(e);if(!n)return 0;let r=0;for(let e of t)n.delete(e)&&r++;return r}hget(e,t){let n=this.store.get(e);return n?n.get(t):void 0}hgetall(e){let t=this.store.get(e);if(!t)return{};let n={};for(let[e,r]of t)n[e]=r;return n}hincrby(e,t,r){let i=this.store.get(e)||new n,a=parseInt(i.get(t)||0,10)+r;return i.set(t,a.toString()),this.storeSet(e,i),a}hincrbyfloat(e,t,r){let i=this.store.get(e)||new n,a=parseFloat(i.get(t)||0)+r;return i.set(t,a.toString()),this.storeSet(e,i),a}hkeys(e){let t=this.store.get(e);return t?Array.from(t.keys()):[]}hlen(e){let t=this.store.get(e);return t?t.size:0}hmget(e,...t){let r=this.store.get(e)||new n;return t.map(e=>r.get(e))}hmset(e,...t){let r=this.store.get(e)||new n;for(let e=0;e<t.length;e+=2){let n=t[e],i=t[e+1];r.set(n,i)}return this.storeSet(e,r),!0}hsetnx(e,t,r){let i=this.store.get(e)||new n;return i.has(t)?0:(i.set(t,r),this.storeSet(e,i),1)}hstrlen(e,t){let n=this.store.get(e),r=n?n.get(t):null;return r?r.length:0}hvals(e){let t=this.store.get(e);return t?Array.from(t.values()):[]}hscan(e,t,r=`*`,i=10){let a=this.store.get(e)||new n,o=Array.from(a.keys()).filter(e=>e.includes(r)),s=Math.min(t+i,o.length);return[s===o.length?0:s,o.slice(t,s).map(e=>[e,a.get(e)])]}hexists(e,t){let n=this.store.get(e);return n&&n.has(t)?1:0}hrandfield(e,t=1){let n=this.store.get(e);if(!n)return[];let r=Array.from(n.keys()),i=[];for(let e=0;e<t;e++){let e=Math.floor(Math.random()*r.length);i.push(r[e])}return i}_checkAndRemoveExpiredKey(e){let t=this.expireTimes.get(e);return t&&Date.now()>t?(this.store.delete(e),this.expireTimes.delete(e),this.isIndexedDBAvailable&&this.db&&this._removeFromIndexedDB(e),!0):!1}_initCleanupLoop(e){this.store.size===1&&(this.cleanupLoop=setInterval(()=>{if(this.store.size===0&&this.cleanupLoop)clearInterval(this.cleanupLoop);else for(let e of this.expireTimes.keys())this._checkAndRemoveExpiredKey(e)},e),typeof this.cleanupLoop==`object`&&typeof this.cleanupLoop.unref==`function`&&this.cleanupLoop.unref())}_haversineDistance(e,t,n,r){let i=e=>e*Math.PI/180,a=i(n-e),o=i(r-t),s=Math.sin(a/2)*Math.sin(a/2)+Math.cos(i(e))*Math.cos(i(n))*Math.sin(o/2)*Math.sin(o/2);return 6371e3*(2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s)))}_convertDistance(e,t,n){let r={m:1,km:.001,mi:621371e-9,ft:3.28084};if(!r[t]||!r[n])throw Error(`Invalid distance unit`);return e*r[t]/r[n]}_encodeGeohash(e,t){let n=``,r=-90,i=90,a=-180,o=180,s=!0,c=0,l=0;for(;n.length<12;){if(s){let e=(a+o)/2;t>e?(l=(l<<1)+1,a=e):(l<<=1,o=e)}else{let t=(r+i)/2;e>t?(l=(l<<1)+1,r=t):(l<<=1,i=t)}s=!s,c<4?c++:(n+=`0123456789bcdefghjkmnpqrstuvwxyz`[l],c=0,l=0)}return n}flushall(){return this.store.clear(),this.expireTimes.clear(),this.isIndexedDBAvailable&&this.db&&this._clearIndexedDB(),!0}async _clearIndexedDB(){if(this.db)try{let e=this.db.transaction([`store`,`expireTimes`],`readwrite`),t=e.objectStore(`store`),n=e.objectStore(`expireTimes`);t.clear(),n.clear()}catch(e){console.warn(`Failed to clear IndexedDB:`,e)}}}}))(),1),o=class{constructor(e={}){this.config={enabled:e.enabled??!1,...e}}updateConfig(e){this.config={...this.config,...e}}enable(){this.config.enabled=!0}disable(){this.config.enabled=!1}isEnabled(){return this.config.enabled}logRequest(e={}){if(!this.isEnabled())return;let{service:t=`unknown`,operation:n=`unknown`,params:r={},result:i=null,error:a=null}=e,o=`{}`;if(r&&Object.keys(r).length>0)try{o=JSON.stringify(r)}catch{o=`[Unable to serialize params]`}let s=`${t} - ${n} - \x1b[1m${o}\x1b[22m`;a?console.error(s,{error:a.message||a,result:i}):console.log(s,i)}getStats(){return{enabled:this.config.enabled,config:{...this.config}}}},s=class extends (globalThis.HTMLElement||Object){constructor(e){super(),this.message=e||`Please confirm your email address to use this service.`,this.attachShadow({mode:`open`}),this.shadowRoot.innerHTML=`
        <style>
        dialog {
            background: transparent;
            border: none;
            box-shadow: none;
            outline: none;
            padding: 0;
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
        }

        .puter-dialog-content {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 50px 30px 30px;
            background-color: #fff;
            box-shadow: 0 0 9px 1px rgb(0 0 0 / 21%);
            -webkit-font-smoothing: antialiased;
            color: #575762;
            position: relative;
            box-sizing: border-box;
            width: 400px;
            max-width: 90vw;
        }

        dialog, dialog * {
            font-family: "Helvetica Neue", HelveticaNeue, Helvetica, Arial, sans-serif;
        }

        .close-btn {
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 17px;
            color: #8a8a8a8c;
            cursor: pointer;
        }

        .close-btn:hover {
            color: #000;
        }

        .dialog-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto;
        }

        .dialog-icon svg {
            display: block;
            width: 70px;
            height: 70px;
            padding: 15px;
            border-radius: 8px;
            box-sizing: border-box;
            background-color: #088ef0;
            color: #fff;
        }

        h2 {
            text-align: center;
            font-size: 19px;
            font-weight: 500;
            color: #1f1f2a;
            margin: 18px 0 0;
        }

        .message {
            text-align: center;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.5;
            color: #575762;
            padding: 10px 10px 0;
            margin: 0;
        }

        .buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin-top: 24px;
        }

        .button {
            color: #666666;
            background: linear-gradient(#f6f6f6, #e1e1e1);
            font-size: 14px;
            text-align: center;
            height: 35px;
            line-height: 35px;
            padding: 0 30px;
            margin: 0;
            display: inline-block;
            appearance: none;
            cursor: pointer;
            border: 1px solid #b9b9b9;
            box-sizing: border-box;
            border-radius: 4px;
            outline: none;
            width: 220px;
            -webkit-font-smoothing: antialiased;
        }

        .button:focus-visible {
            border-color: rgb(118 118 118);
        }

        .button-primary {
            border-color: #088ef0;
            background: linear-gradient(#34a5f8, #088ef0);
            color: #fff;
            font-weight: 500;
            font-size: 15px;
            margin-bottom: 10px;
        }

        .button-primary:active {
            background: #2798eb;
            border-color: #2798eb;
            color: #bedef5;
        }

        .button-cancel {
            background: none;
        }

        @media (max-width: 480px) {
            .puter-dialog-content {
                padding: 50px 20px 25px;
            }
            .button {
                width: 100%;
            }
        }

        @media (prefers-color-scheme: dark) {
            .puter-dialog-content {
                border: 1px solid #2a2a2e;
                background-color: #1e1e22;
                color: #d6d6dc;
                box-shadow: 0 0 9px 1px rgb(0 0 0 / 60%);
            }

            h2 {
                color: #e4e4ea;
            }

            .message {
                color: #b9b9c2;
            }

            .close-btn {
                color: #8a8a90;
            }

            .close-btn:hover {
                color: #fff;
            }

            .button {
                color: #d6d6dc;
                background: linear-gradient(#3f3f45, #2e2e34);
                border-color: #4a4a50;
            }

            .button:focus-visible {
                border-color: #8a8a90;
            }

            .button-primary {
                border-color: #088ef0;
                background: linear-gradient(#34a5f8, #088ef0);
                color: #fff;
            }
        }
        </style>
        <dialog>
            <div class="puter-dialog-content">
                <span class="close-btn">&#x2715;</span>
                <div class="dialog-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2>Confirm Your Email</h2>
                <p class="message">${this.message}</p>
                <div class="buttons">
                    <button class="button button-primary" id="confirm-email-btn">Go to Puter.com</button>
                    <button class="button button-cancel" id="close-btn">Close</button>
                </div>
            </div>
        </dialog>
        `}connectedCallback(){let e=this.shadowRoot.querySelector(`dialog`);this.shadowRoot.querySelector(`.close-btn`).addEventListener(`click`,()=>{this.close()}),this.shadowRoot.querySelector(`#close-btn`).addEventListener(`click`,()=>{this.close()}),this.shadowRoot.querySelector(`#confirm-email-btn`).addEventListener(`click`,()=>{window.open(`https://puter.com`,`_blank`),this.close()}),e.addEventListener(`click`,t=>{t.target===e&&this.close()})}open(){this.shadowRoot.querySelector(`dialog`).showModal()}close(){this.shadowRoot.querySelector(`dialog`).close(),this.remove()}};globalThis.HTMLElement!==void 0&&globalThis.customElements&&(customElements.get(`email-confirmation-dialog`)||customElements.define(`email-confirmation-dialog`,s));function c(e){if(globalThis.document===void 0||document.querySelector(`email-confirmation-dialog`))return;let t=new s(e);document.body.appendChild(t),t.open()}var l=class extends (globalThis.HTMLElement||Object){constructor(e){super(),this.message=e||`You have reached your usage limit for this account.`,this.attachShadow({mode:`open`}),this.shadowRoot.innerHTML=`
        <style>
        dialog {
            background: transparent;
            border: none;
            box-shadow: none;
            outline: none;
            padding: 0;
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
        }

        .puter-dialog-content {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 50px 30px 30px;
            background-color: #fff;
            box-shadow: 0 0 9px 1px rgb(0 0 0 / 21%);
            -webkit-font-smoothing: antialiased;
            color: #575762;
            position: relative;
            box-sizing: border-box;
            width: 400px;
            max-width: 90vw;
        }

        dialog, dialog * {
            font-family: "Helvetica Neue", HelveticaNeue, Helvetica, Arial, sans-serif;
        }

        .close-btn {
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 17px;
            color: #8a8a8a8c;
            cursor: pointer;
        }

        .close-btn:hover {
            color: #000;
        }

        .dialog-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto;
        }

        .dialog-icon svg {
            display: block;
            width: 70px;
            height: 70px;
            padding: 15px;
            border-radius: 8px;
            box-sizing: border-box;
            background-color: #f59e0b;
            color: #fff;
        }

        h2 {
            text-align: center;
            font-size: 19px;
            font-weight: 500;
            color: #1f1f2a;
            margin: 18px 0 0;
        }

        .message {
            text-align: center;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.5;
            color: #575762;
            padding: 10px 10px 0;
            margin: 0;
        }

        .buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin-top: 24px;
        }

        .button {
            color: #666666;
            background: linear-gradient(#f6f6f6, #e1e1e1);
            font-size: 14px;
            text-align: center;
            height: 35px;
            line-height: 35px;
            padding: 0 30px;
            margin: 0;
            display: inline-block;
            appearance: none;
            cursor: pointer;
            border: 1px solid #b9b9b9;
            box-sizing: border-box;
            border-radius: 4px;
            outline: none;
            width: 220px;
            -webkit-font-smoothing: antialiased;
        }

        .button:focus-visible {
            border-color: rgb(118 118 118);
        }

        .button-primary {
            border-color: #088ef0;
            background: linear-gradient(#34a5f8, #088ef0);
            color: #fff;
            font-weight: 500;
            font-size: 15px;
            margin-bottom: 10px;
        }

        .button-primary:active {
            background: #2798eb;
            border-color: #2798eb;
            color: #bedef5;
        }

        .button-cancel {
            background: none;
        }

        @media (max-width: 480px) {
            .puter-dialog-content {
                padding: 50px 20px 25px;
            }
            .button {
                width: 100%;
            }
        }

        @media (prefers-color-scheme: dark) {
            .puter-dialog-content {
                border: 1px solid #2a2a2e;
                background-color: #1e1e22;
                color: #d6d6dc;
                box-shadow: 0 0 9px 1px rgb(0 0 0 / 60%);
            }

            h2 {
                color: #e4e4ea;
            }

            .message {
                color: #b9b9c2;
            }

            .close-btn {
                color: #8a8a90;
            }

            .close-btn:hover {
                color: #fff;
            }

            .button {
                color: #d6d6dc;
                background: linear-gradient(#3f3f45, #2e2e34);
                border-color: #4a4a50;
            }

            .button:focus-visible {
                border-color: #8a8a90;
            }

            .button-primary {
                border-color: #088ef0;
                background: linear-gradient(#34a5f8, #088ef0);
                color: #fff;
            }
        }
        </style>
        <dialog>
            <div class="puter-dialog-content">
                <span class="close-btn">&#x2715;</span>
                <div class="dialog-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2>Low Balance</h2>
                <p class="message">${this.message}</p>
                <div class="buttons">
                    <button class="button button-primary" id="upgrade-btn">Upgrade Now</button>
                    <button class="button button-cancel" id="close-btn">Close</button>
                </div>
            </div>
        </dialog>
        `}connectedCallback(){let e=this.shadowRoot.querySelector(`dialog`);this.shadowRoot.querySelector(`.close-btn`).addEventListener(`click`,()=>{this.close()}),this.shadowRoot.querySelector(`#close-btn`).addEventListener(`click`,()=>{this.close()}),this.shadowRoot.querySelector(`#upgrade-btn`).addEventListener(`click`,()=>{window.open(`https://puter.com/dashboard/#home`,`_blank`),this.close()}),e.addEventListener(`click`,t=>{t.target===e&&this.close()})}open(){this.shadowRoot.querySelector(`dialog`).showModal()}close(){this.shadowRoot.querySelector(`dialog`).close(),this.remove()}};globalThis.HTMLElement!==void 0&&globalThis.customElements&&(customElements.get(`usage-limit-dialog`)||customElements.define(`usage-limit-dialog`,l));function u(e){if(globalThis.document===void 0){console.warn(`[Puter]`,e);return}if(document.querySelector(`usage-limit-dialog`))return;let t=new l(e);document.body.appendChild(t),t.open()}var d=()=>{let e,t;return{promise:new Promise((n,r)=>{e=n,t=r}),resolve:e,reject:t}};function f(e,t){return puter.dropStaleAuthToken({reason:e.reason,auth_id:e.auth_id,sentToken:t}),{action:`reject`,error:{status:401,code:e.code,reason:e.reason,auth_id:e.auth_id,message:`Reauthentication required`}}}async function p(e,{interactive:t=!0,sentToken:n}={}){if(e?.code===`reauth_required`){if(!t)return f(e,n);try{return await puter.triggerReauth({reason:e.reason,auth_id:e.auth_id}),{action:`replay`}}catch(t){return{action:`reject`,error:{status:401,code:`reauth_required`,reason:e.reason,auth_id:e.auth_id,message:t?.message||`Reauthentication required`}}}}if(e?.code===`token_auth_failed`&&puter.env===`web`){if(!t)return f(e,n);try{puter.resetAuthToken(),await puter.ui.authenticateWithPuter()}catch{return{action:`reject`,error:{error:{code:`auth_canceled`,message:`Authentication canceled`}}}}}return null}function m(e){let{url:t,method:n=`GET`,headers:r={},includePuterAuth:i=!1,authToken:a,withCredentials:o=!0,responseType:s=``}=e,c=new XMLHttpRequest;c.open(n,t,!0),c.withCredentials=o,c.responseType=s??``;let l=i?globalThis.puter?.authToken??a:a;l&&(e._sentAuthToken=l,c.setRequestHeader(`Authorization`,`Bearer ${l}`));for(let[e,t]of Object.entries(r))t!=null&&c.setRequestHeader(e,t);c._puterReq=e;let u=c.send.bind(c);return c.send=function(t){return e.body=t,u(t)},globalThis.puter?.apiCallLogger?.isEnabled()&&(c._puterRequestId=e.logId??{method:n,service:`xhr`,operation:t,params:{url:t,method:n,responseType:s}}),c}var h=e=>(e||``).includes(`application/x-ndjson`);async function g(e){switch(e.responseType){case`blob`:return await e.response.text();case`arraybuffer`:return new TextDecoder().decode(e.response);case`json`:return JSON.stringify(e.response);default:return e.responseText}}async function _(e){if(e.responseType===`blob`)return e.response;let t=e.getResponseHeader(`content-type`)||`application/octet-stream`;return e.responseType===`arraybuffer`?new Blob([e.response],{type:t}):new Blob([await g(e)],{type:t})}async function v(e){return e.responseType===`arraybuffer`?e.response:await(await _(e)).arrayBuffer()}async function y(e){return e.responseType===`json`?e.response:JSON.parse(await g(e))}async function b(e){if(e.responseType!==`blob`)try{return JSON.parse(e.responseText)}catch{return e.responseText}let t=e.getResponseHeader(`content-type`);if(t.startsWith(`application/json`)){let t=await e.response.text();try{return JSON.parse(t)}catch{return t}}return t.startsWith(`application/octet-stream`)?e.response:{success:!0,result:e.response}}function ee(e,t){let n=e.status;return{ok:n>=200&&n<300,status:n,statusText:e.statusText,url:e.responseURL||``,headers:{get:t=>e.getResponseHeader(t)},text:()=>g(e),json:()=>y(e),blob:()=>_(e),arrayBuffer:()=>v(e),stream:()=>{if(!t)throw Error(`stream() is only available for application/x-ndjson responses`);return t}}}function te(e,{result:t=null,error:n=null}={}){e&&globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({...e,result:t,error:n})}async function ne(e){let t=e.getResponseHeader(`content-type`)||``;if(e.responseType===``||e.responseType===`text`||t.includes(`json`))try{return await y(e)}catch{try{return await g(e)}catch{return null}}return`[${t||`binary`}]`}var re=new Set([502,503,504]),ie=429,ae=[250,500,1e3,2e3,2e3,2e3,2e3,2e3],oe=2e3,se=2e3,ce=()=>globalThis.puter?.config?.autoRetry??!0,le=(e,t)=>new Promise((n,r)=>{if(t?.aborted)return r(t.reason??new DOMException(`Aborted`,`AbortError`));let i=setTimeout(n,e);t?.addEventListener(`abort`,()=>{clearTimeout(i),r(t.reason??new DOMException(`Aborted`,`AbortError`))},{once:!0})}),ue=e=>ae[e-1],de=e=>{if(!(e.retrySafe&&ce()))return null;let t=ue(e.attempt);return t===void 0?null:{delayMs:t}},fe=e=>{if(!(e.retryGated&&ce()))return null;let t=ue(e.attempt);return t===void 0?null:{delayMs:t}};async function pe(e){try{let t=await puter.ui.requestPermission({permission:e});return{granted:t===!0||t?.granted===!0}}catch{return{granted:!1}}}var me=new Set([`email_confirmation_required`,`phone_verification_required`,`card_verification_required`]),he=null;async function ge(e){return globalThis.puter?.env===`app`?(he||=(async()=>{try{return{verified:await puter.ui.requestVerificationGate(e)===!0}}catch{return{verified:!1}}finally{he=null}})(),he):{verified:!1}}function _e(e){return new Promise((t,n)=>{let r=m(e),i=!1,a=!1,o=null,s=[],c=``,l=0,u=(async function*(){for(;;){for(;s.length>0;){let e=s.shift();e.trim()!==``&&(yield JSON.parse(e))}if(a)break;let e=d();o=e.resolve,await e.promise}})();if(r.onreadystatechange=()=>{r.readyState===2&&h(r.getResponseHeader(`Content-Type`))&&(i=!0,t({streamed:!0,xhr:r,lineStream:u})),r.readyState===4&&i&&(c.length>0&&(s.push(c),c=``),a=!0,o?.())},r.onprogress=()=>{if(!i)return;let e=r.responseText.slice(l);if(l=r.responseText.length,!e)return;c+=e;let t;for(;(t=c.indexOf(`
`))!==-1;)s.push(c.slice(0,t)),c=c.slice(t+1);o?.()},r.addEventListener(`load`,()=>{i||t({xhr:r,status:r.status})}),r.addEventListener(`error`,()=>t({networkError:!0,xhr:r})),r.addEventListener(`abort`,()=>n(e.signal?.reason??new DOMException(`Aborted`,`AbortError`))),e.signal){if(e.signal.aborted)return n(e.signal.reason??new DOMException(`Aborted`,`AbortError`));e.signal.addEventListener(`abort`,()=>r.abort(),{once:!0})}let f=typeof e.buildBody==`function`?e.buildBody():e.body;r.send(f??null)})}async function ve(e,t){if(e.streamed)return null;if(e.networkError)return de(t);let{xhr:n,status:r}=e;e.parsed===void 0&&(e.parsed=await y(n).catch(()=>null));let i=e.parsed;if(r===401||i?.code===`token_auth_failed`){if(!t.done.has(`reauth`)){let r=n?._puterReq,a=await p(i,{interactive:r?.interactiveReauth!==!1,sentToken:r?._sentAuthToken});if(a?.action===`replay`)return t.done.add(`reauth`),{delayMs:0};a?.action===`reject`&&(e.reauthError=a.error)}return null}if(t.permission&&i?.success===!1&&i?.error?.code===`permission_denied`)return!t.done.has(`permission`)&&(await pe(t.permission)).granted?(t.done.add(`permission`),{delayMs:0}):null;let a=[i?.code,i?.error?.code].find(e=>me.has(e));return r===403&&a?!t.done.has(a)&&(await ge(a)).verified?(t.done.add(a),{delayMs:0}):null:r===ie?fe(t):re.has(r)?de(t):null}async function ye(e,{retrySafe:t=!1,retryGated:n=!0,permission:r=null,shapeStream:i,shape:a}){let o={attempt:0,retrySafe:t,retryGated:n,permission:r,done:new Set};for(;;){o.attempt++;let t=await _e(e);if(t.streamed)return i(t.lineStream,t.xhr);let n=await ve(t,o);if(n){let r=Date.now();if(await le(n.delayMs,e.signal),n.delayMs>=oe&&Date.now()-r-n.delayMs>se)return a(t);continue}return a(t)}}var be=new Map;function xe(e,t,{windowMs:n=2e3}={}){let r=be.get(e);if(r){if(Date.now()-r.timestamp<n)return r.promise;be.delete(e)}let i=t();be.set(e,{promise:i,timestamp:Date.now()});let a=()=>{be.get(e)?.promise===i&&be.delete(e)};return i.then(a,a),i}function x(e,t={}){let{includePuterAuth:n=!1,authToken:r,method:i=`GET`,headers:a={},body:o=null,responseType:s=``,withCredentials:c=!0,signal:l,logContext:u,retry:d,dedupe:f,interactiveReauth:p=!0}=t,m=u??{service:`fetchUrl`,operation:`${i} ${e}`,params:{url:e,method:i}},h={url:e,method:i,headers:a,includePuterAuth:n,authToken:r,withCredentials:c,responseType:s,body:o,signal:l,logId:m,interactiveReauth:p},g=d===!1?!1:d===!0||i===`GET`||i===`HEAD`,_=d!==!1,v=()=>globalThis.puter?.apiCallLogger?.isEnabled(),y=()=>ye(h,{retrySafe:g,retryGated:_,shapeStream:(e,t)=>(v()&&te(m,{result:`[stream]`}),ee(t,e)),shape:async t=>{if(t.networkError)throw v()&&te(m,{error:{message:`Network error occurred`}}),TypeError(`Network request to ${e} failed`);let{xhr:n}=t,r=ee(n);if(v()){let e=await ne(n);te(m,n.status>=400?{error:e??{message:n.statusText,status:n.status}}:{result:e})}return r}});return f?xe(typeof f==`string`?f:`${i}:${e}:${o==null?``:typeof o==`string`?o:`[body]`}`,y):y()}var Se=`text/plain;actually=json`,Ce=e=>e.puter??globalThis.puter,we=(e,t)=>JSON.stringify({interface:e.iface,driver:e.driver,test_mode:e.testMode,method:e.method,args:e.args,auth_token:t.authToken}),Te=(e,t)=>{globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({service:`drivers`,operation:`${e.iface}::${e.method}`,params:{interface:e.iface,driver:e.driver??e.iface,method:e.method,args:e.args},...t})};async function Ee(e,t){e.env===`web`?u(t):e.env===`app`&&await e.ui.requestUpgrade()}function De(e,t){t?.code===`email_must_be_confirmed`&&e.env===`web`&&c(t.message||`Email confirmation required. Go to Puter.com to confirm your email address.`)}function Oe(e,t){let n=(async function*(){for await(let n of e)(n?.error?.code===`insufficient_funds`||n?.metadata?.usage_limited===!0)&&await Ee(t,`You have reached your usage limit for this account.<br>Please upgrade to continue.`),De(t,n?.error),typeof n.text==`string`&&Object.defineProperty(n,"toString",{enumerable:!1,value:()=>n.text}),yield n})();return Object.defineProperty(n,"start",{enumerable:!1,value:async e=>{let t=new TextEncoder;for await(let r of n)e.enqueue(t.encode(r));e.close()}}),n}async function ke(e,t={}){let{responseType:n=``,readonly:r=!1,transform:i,onError:a}=t,o=Ce(e),s=e=>{throw typeof a==`function`&&a(e),e};if(!o.authToken&&o.env===`web`)try{await o.ui.authenticateWithPuter()}catch{let t={code:`auth_canceled`,message:`Authentication canceled`};throw Te(e,{error:t}),{error:t}}return await ye({url:`${o.APIOrigin}/drivers/call`,method:`POST`,headers:{"Content-Type":Se},withCredentials:!0,responseType:n,buildBody:()=>we(e,o)},{retrySafe:r,permission:`driver:${e.iface}:${e.method}`,shapeStream:e=>Oe(e,o),shape:async t=>{if(t.networkError)return Te(e,{error:{message:`Network error occurred`}}),s(t.xhr);let{status:n}=t.xhr,r=await b(t.xhr),a=n>=400||r?.success===!1;if(Te(e,{result:a?null:r,error:a?r:null}),(n===402||r?.error?.code===`insufficient_funds`||r?.error?.status===402||r?.metadata?.usage_limited===!0)&&await Ee(o,`Your account has not enough funding to complete this request.<br>Please upgrade to continue.`),De(o,r?.error),n===401||r?.code===`token_auth_failed`)return s({status:401,message:`Unauthorized`});if(n&&n!==200||r.success===!1)return s(r);let c=r.result===void 0?r:r.result;return i?await i(c):c}})}async function Ae(e){let t=Ce(e);try{let n=await x(`${t.APIOrigin}/drivers/call`,{method:`POST`,headers:{"Content-Type":Se},body:we(e,t)}),r=(n.headers.get(`content-type`)??``).split(`;`)[0].trim(),i=await(()=>{switch(r){case`application/x-ndjson`:return n.stream();case`application/octet-stream`:return n.blob();case`application/json`:case``:return n.json();default:throw Error(`unrecognized content type: ${r}`)}})();return Te(e,{result:i}),i}catch(t){throw Te(e,{error:{message:t?.message??String(t),stack:t?.stack}}),t}}var je=({boundOrigin:e,currentOrigin:t,defaultAPIOrigin:n})=>e?e===t:t===n,Me=(e=globalThis)=>{try{let t=e?.parent;return!!t&&t!==e}catch{return!0}},S=e(t(((e,t)=>{function n(e){if(typeof e!=`string`)throw TypeError(`Path must be a string. Received `+JSON.stringify(e))}function r(e,t){for(var n=``,r=0,i=-1,a=0,o,s=0;s<=e.length;++s){if(s<e.length)o=e.charCodeAt(s);else if(o===47)break;else o=47;if(o===47){if(i!==s-1&&a!==1){if(i!==s-1&&a===2){if(n.length<2||r!==2||n.charCodeAt(n.length-1)!==46||n.charCodeAt(n.length-2)!==46){if(n.length>2){var c=n.lastIndexOf(`/`);if(c!==n.length-1){c===-1?(n=``,r=0):(n=n.slice(0,c),r=n.length-1-n.lastIndexOf(`/`)),i=s,a=0;continue}}else if(n.length===2||n.length===1){n=``,r=0,i=s,a=0;continue}}t&&(n.length>0?n+=`/..`:n=`..`,r=2)}else n.length>0?n+=`/`+e.slice(i+1,s):n=e.slice(i+1,s),r=s-i-1}i=s,a=0}else o===46&&a!==-1?++a:a=-1}return n}function i(e,t){var n=t.dir||t.root,r=t.base||(t.name||``)+(t.ext||``);return n?n===t.root?n+r:n+e+r:r}var a={resolve:function(){for(var e=``,t=!1,i,a=arguments.length-1;a>=-1&&!t;a--){var o;a>=0?o=arguments[a]:(i===void 0&&(i=process.cwd()),o=i),n(o),o.length!==0&&(e=o+`/`+e,t=o.charCodeAt(0)===47)}return e=r(e,!t),t?e.length>0?`/`+e:`/`:e.length>0?e:`.`},normalize:function(e){if(n(e),e.length===0)return`.`;var t=e.charCodeAt(0)===47,i=e.charCodeAt(e.length-1)===47;return e=r(e,!t),e.length===0&&!t&&(e=`.`),e.length>0&&i&&(e+=`/`),t?`/`+e:e},isAbsolute:function(e){return n(e),e.length>0&&e.charCodeAt(0)===47},join:function(){if(arguments.length===0)return`.`;for(var e,t=0;t<arguments.length;++t){var r=arguments[t];n(r),r.length>0&&(e===void 0?e=r:e+=`/`+r)}return e===void 0?`.`:a.normalize(e)},relative:function(e,t){if(n(e),n(t),e===t||(e=a.resolve(e),t=a.resolve(t),e===t))return``;for(var r=1;r<e.length&&e.charCodeAt(r)===47;++r);for(var i=e.length,o=i-r,s=1;s<t.length&&t.charCodeAt(s)===47;++s);for(var c=t.length-s,l=o<c?o:c,u=-1,d=0;d<=l;++d){if(d===l){if(c>l){if(t.charCodeAt(s+d)===47)return t.slice(s+d+1);if(d===0)return t.slice(s+d)}else o>l&&(e.charCodeAt(r+d)===47?u=d:d===0&&(u=0));break}var f=e.charCodeAt(r+d);if(f!==t.charCodeAt(s+d))break;f===47&&(u=d)}var p=``;for(d=r+u+1;d<=i;++d)(d===i||e.charCodeAt(d)===47)&&(p.length===0?p+=`..`:p+=`/..`);return p.length>0?p+t.slice(s+u):(s+=u,t.charCodeAt(s)===47&&++s,t.slice(s))},_makeLong:function(e){return e},dirname:function(e){if(n(e),e.length===0)return`.`;for(var t=e.charCodeAt(0),r=t===47,i=-1,a=!0,o=e.length-1;o>=1;--o)if(t=e.charCodeAt(o),t===47){if(!a){i=o;break}}else a=!1;return i===-1?r?`/`:`.`:r&&i===1?`//`:e.slice(0,i)},basename:function(e,t){if(t!==void 0&&typeof t!=`string`)throw TypeError(`"ext" argument must be a string`);n(e);var r=0,i=-1,a=!0,o;if(t!==void 0&&t.length>0&&t.length<=e.length){if(t.length===e.length&&t===e)return``;var s=t.length-1,c=-1;for(o=e.length-1;o>=0;--o){var l=e.charCodeAt(o);if(l===47){if(!a){r=o+1;break}}else c===-1&&(a=!1,c=o+1),s>=0&&(l===t.charCodeAt(s)?--s===-1&&(i=o):(s=-1,i=c))}return r===i?i=c:i===-1&&(i=e.length),e.slice(r,i)}for(o=e.length-1;o>=0;--o)if(e.charCodeAt(o)===47){if(!a){r=o+1;break}}else i===-1&&(a=!1,i=o+1);return i===-1?``:e.slice(r,i)},extname:function(e){n(e);for(var t=-1,r=0,i=-1,a=!0,o=0,s=e.length-1;s>=0;--s){var c=e.charCodeAt(s);if(c===47){if(!a){r=s+1;break}continue}i===-1&&(a=!1,i=s+1),c===46?t===-1?t=s:o!==1&&(o=1):t!==-1&&(o=-1)}return t===-1||i===-1||o===0||o===1&&t===i-1&&t===r+1?``:e.slice(t,i)},format:function(e){if(typeof e!=`object`||!e)throw TypeError(`The "pathObject" argument must be of type Object. Received type `+typeof e);return i(`/`,e)},parse:function(e){n(e);var t={root:``,dir:``,base:``,ext:``,name:``};if(e.length===0)return t;var r=e.charCodeAt(0),i=r===47,a;i?(t.root=`/`,a=1):a=0;for(var o=-1,s=0,c=-1,l=!0,u=e.length-1,d=0;u>=a;--u){if(r=e.charCodeAt(u),r===47){if(!l){s=u+1;break}continue}c===-1&&(l=!1,c=u+1),r===46?o===-1?o=u:d!==1&&(d=1):o!==-1&&(d=-1)}return o===-1||c===-1||d===0||d===1&&o===c-1&&o===s+1?c!==-1&&(t.base=t.name=s===0&&i?e.slice(1,c):e.slice(s,c)):(s===0&&i?(t.name=e.slice(1,o),t.base=e.slice(1,c)):(t.name=e.slice(s,o),t.base=e.slice(s,c)),t.ext=e.slice(o,c)),s>0?t.dir=e.slice(0,s-1):i&&(t.dir=`/`),t},sep:`/`,delimiter:`:`,win32:null,posix:null};a.posix=a,t.exports=a}))(),1),C={},Ne={};C.length=0,C.getItem=function(e){return e in Ne?Ne[e]:null},C.setItem=function(e,t){t===void 0?C.removeItem(e):(Ne.hasOwnProperty(e)||C.length++,Ne[e]=`${t}`)},C.removeItem=function(e){Ne.hasOwnProperty(e)&&(delete Ne[e],C.length--)},C.key=function(e){return Object.keys(Ne)[e]||null},C.clear=function(){Ne={},C.length=0},typeof exports==`object`&&(module.exports=C);var Pe=Symbol(`readyState`),Fe=Symbol(`headers`),Ie=Symbol(`response headers`),Le=Symbol(`AbortController`),Re=Symbol(`method`),ze=Symbol(`URL`),Be=Symbol(`MIME`),Ve=Symbol(`dispatch`),He=Symbol(`errored`),Ue=Symbol(`timeout`),We=Symbol(`timedOut`),Ge=Symbol(`isResponseText`);function Ke(...e){let t=e.reduce((e,t)=>e+t.length,0),n=new Uint8Array(t);return e.forEach((e,t,r)=>{let i=r.slice(0,t).reduce((e,t)=>e+t.length,0);n.set(e,i)}),n}async function qe(e){let t=this.responseType||`text`,n=new TextDecoder,r=this[Be]||this[Ie].get(`content-type`)||`text/plain`;switch(t){case`text`:this.response=n.decode(e);break;case`blob`:this.response=new Blob([e],{type:r});break;case`arraybuffer`:this.response=e.buffer;break;case`json`:this.response=JSON.parse(n.decode(e))}}var Je=class extends EventTarget{onreadystatechange(){}set readyState(e){this[Pe]!==e&&(this[Pe]=e,this.dispatchEvent(new Event(`readystatechange`)),this.onreadystatechange(new Event(`readystatechange`)))}get readyState(){return this[Pe]}constructor(){super(),this.readyState=this.constructor.UNSENT,this.response=null,this.responseType=``,this.responseURL=``,this.status=0,this.statusText=``,this.timeout=0,this.withCredentials=!1,this[Fe]=Object.create(null),this[Fe].accept=`*/*`,this[Ie]=Object.create(null),this[Le]=new AbortController,this[Re]=``,this[ze]=``,this[Be]=``,this[He]=!1,this[Ue]=0,this[We]=!1,this[Ge]=!0}static get UNSENT(){return 0}static get OPENED(){return 1}static get HEADERS_RECEIVED(){return 2}static get LOADING(){return 3}static get DONE(){return 4}upload={addEventListener(){}};get responseText(){if(this[He])return null;if(this.readyState<this.constructor.HEADERS_RECEIVED)return``;if(this[Ge])return this.response;throw new DOMException(`Response type not set to text`,`InvalidStateError`)}get responseXML(){throw Error(`XML not supported`)}[Ve](e){let t=`on${e.type}`;typeof this[t]==`function`&&this.addEventListener(e.type,this[t].bind(this),{once:!0}),this.dispatchEvent(e)}abort(){this[Le].abort(),this.status=0,this.readyState=this.constructor.UNSENT}open(e,t){this.status=0,this[Re]=e,this[ze]=t,this.readyState=this.constructor.OPENED}setRequestHeader(e,t){e=String(e).toLowerCase(),this[Fe][e]===void 0?this[Fe][e]=String(t):this[Fe][e]+=`, ${t}`}overrideMimeType(e){this[Be]=String(e)}getAllResponseHeaders(){return this[He]||this.readyState<this.constructor.HEADERS_RECEIVED?``:Array.from(this[Ie].entries().map(([e,t])=>`${e}: ${t}`)).join(`\r
`)}getResponseHeader(e){let t=this[Ie].get(String(e).toLowerCase());return typeof t==`string`?t:null}send(e=null){this.timeout>0&&(this[Ue]=setTimeout(()=>{this[We]=!0,this[Le].abort()},this.timeout));let t=this.responseType||`text`;this[Ge]=t===`text`,this.setRequestHeader(`user-agent`,`puter-js/1.0`),this.setRequestHeader(`origin`,`https://puter.work`),this.setRequestHeader(`referer`,`https://puter.work/`),fetch(this[ze],{method:this[Re]||`GET`,signal:this[Le].signal,headers:this[Fe],credentials:this.withCredentials?`include`:`same-origin`,body:e}).then(async e=>{if(this.responseURL=e.url,this.status=e.status,this.statusText=e.statusText,this[Ie]=e.headers,this.readyState=this.constructor.HEADERS_RECEIVED,e.headers.get(`content-type`).includes(`application/x-ndjson`)||this.streamRequestBadForPerformance){let t=new Uint8Array;for await(let n of e.body)this.readyState=this.constructor.LOADING,t=Ke(t,n),qe.call(this,t),this[Ve](new CustomEvent(`progress`))}else{let t=[];for await(let n of e.body)t.push(n);qe.call(this,Ke(...t))}this.readyState=this.constructor.DONE,this[Ve](new CustomEvent(`load`))},e=>{let t=`abort`;e.name===`AbortError`?this[We]&&(t=`timeout`):(this[He]=!0,t=`error`),this.readyState=this.constructor.DONE,this[Ve](new CustomEvent(t))}).finally(()=>this[Ve](new CustomEvent(`loadend`))).finally(()=>{clearTimeout(this[Ue]),this[Ve](new CustomEvent(`loadstart`))})}};typeof module==`object`&&module.exports?module.exports=Je:(globalThis||self).XMLHttpRequestShim=Je;function Ye(e){let t=new Uint8Array(e).reduce((e,t)=>e+String.fromCharCode(t),``);return typeof btoa==`function`?btoa(t):Buffer.from(t,`binary`).toString(`base64`)}var Xe=class{constructor(){this.result=null,this.error=null,this.onload=null,this.onerror=null,this.onloadend=null}#e(){this.error?typeof this.onerror==`function`&&this.onerror(this.error):typeof this.onload==`function`&&this.onload({target:this}),typeof this.onloadend==`function`&&this.onloadend()}readAsDataURL(e){let t=this;(async function(){try{let n;n=e&&typeof e.arrayBuffer==`function`?await e.arrayBuffer():e instanceof ArrayBuffer?e:ArrayBuffer.isView(e)?e.buffer:new Uint8Array().buffer;let r=Ye(n),i=e&&e.type||`application/octet-stream`;t.result=`data:`+i+`;base64,`+r}catch(e){t.error=e}t.#e()})()}};function Ze(){return`10000000-1000-4000-8000-100000000000`.replace(/[018]/g,e=>(e^crypto.getRandomValues(new Uint8Array(1))[0]&15>>e/4).toString(16))}function Qe(e,t,n,r=`post`,i=`text/plain;actually=json`,a=void 0){return m({url:t+e,method:r,headers:{"Content-Type":i},includePuterAuth:!!n,withCredentials:!0,responseType:a??``,logId:{method:r,service:`xhr`,operation:e.replace(/^\//,``),params:{endpoint:e,contentType:i,responseType:a}}})}function $e(e,t,n,r,i){let a=(e.target??e)?._puterReq;if(!a||a._replayed)return!1;let o=m({...a,_replayed:!0});return w(o,t,n,r,i),o.send(a.body),!0}async function et(e,t,n,r,i){let a=await b(i);if(i.status===401){let o=i._puterReq,s=await p(a,{interactive:o?.interactiveReauth!==!1,sentToken:o?._sentAuthToken});if(s?.action===`replay`){if($e(i,e,t,n,r))return}else if(s?.action===`reject`)return t&&typeof t==`function`&&t(s.error),r(s.error);return t&&typeof t==`function`&&t({status:401,message:`Unauthorized`}),r({status:401,message:`Unauthorized`})}return i.status===200?(a.success===!1&&a.error?.code===`permission_denied`&&await puter.ui.requestPermission({permission:`driver:puter-image-generation:generate`}),e&&typeof e==`function`&&e(a),n(a)):(t&&typeof t==`function`&&t(a),r(a))}function tt(e,t,n){return e&&typeof e==`function`&&e(n),t(n)}function w(e,t,n,r,i){e.addEventListener(`load`,async function(a){if(globalThis.puter?.apiCallLogger?.isEnabled()&&this._puterRequestId){let e=await b(this).catch(()=>null);globalThis.puter.apiCallLogger.logRequest({service:this._puterRequestId.service,operation:this._puterRequestId.operation,params:this._puterRequestId.params,result:this.status>=400?null:e,error:this.status>=400?{message:this.statusText,status:this.status}:null})}return et(t,n,r,i,this,e)}),e.addEventListener(`error`,function(e){return globalThis.puter?.apiCallLogger?.isEnabled()&&this._puterRequestId&&globalThis.puter.apiCallLogger.logRequest({service:this._puterRequestId.service,operation:this._puterRequestId.operation,params:this._puterRequestId.params,error:{message:`Network error occurred`,event:e.type}}),tt(n,i,this)})}function T(e){let{iface:t,method:n,argNames:r=[],driver:i,puter:a,testMode:o}=e,{readonly:s,responseType:c,preprocess:l,transform:u}=e;return async function(...e){let d={},f;return e.length===1&&typeof e[0]==`object`&&!Array.isArray(e[0])?(d={...e[0]},f=d.error,delete d.success,delete d.error):(r.forEach((t,n)=>{d[t]=e[n]}),f=e[r.length+1]),typeof l==`function`&&(d=l(d)),o===!0&&d.test_mode===void 0&&(d={...d,test_mode:!0}),await ke({iface:t,driver:i,method:n,args:d,testMode:o,puter:a},{readonly:s,responseType:c,transform:u,onError:f})}}function E(e){return new Promise((t,n)=>{let r=new(globalThis.FileReader||Xe);r.onload=function(e){t(e.target.result)},r.onerror=function(e){n(e)},r.readAsDataURL(e)})}var nt=[`mp4`,`webm`,`mov`,`mpeg`,`avi`,`mkv`,`m4v`,`ogv`],rt=e=>{if(typeof e!=`string`)return!1;if(e.startsWith(`data:video/`))return!0;let t=e.split(`?`)[0].split(`#`)[0].split(`.`).pop()?.toLowerCase();return nt.includes(t)},D=class{constructor(e){this.puter=e}get authToken(){return this.puter.authToken}get APIOrigin(){return this.puter.APIOrigin}get appID(){return this.puter.appID}},it=e=>typeof Blob>`u`?!1:e instanceof Blob||typeof File<`u`&&e instanceof File,at=e=>typeof e==`object`&&!!e&&!Array.isArray(e)&&!it(e),ot=e=>e.some(e=>e===!0),st=async e=>e instanceof Blob?await E(e):e,ct=e=>{let t=e.split(`,`)[1]||``,n=t.endsWith(`==`)?2:+!!t.endsWith(`=`);return Math.floor(t.length*3/4)-n},lt=[`tools`,`response`,`reasoning`,`reasoning_effort`,`text`,`verbosity`,`provider`,`image_config`,`compaction`,`context_management`];async function ut(e,t,n,r){let{puter:i}=this,a=[t,n,r],o={};if(typeof e==`string`&&t&&(typeof t==`string`||t instanceof File)){let n=t instanceof File?await E(t):t;o={vision:!0,messages:[{content:[e,rt(n)?{video_url:{url:n}}:{image_url:{url:n}}]}]}}else typeof e==`string`&&Array.isArray(t)?o={vision:!0,messages:[{content:[e,...t.map(e=>rt(e)?{video_url:{url:e}}:{image_url:{url:e}})]}]}:Array.isArray(e)?o={messages:e}:typeof e==`string`&&(o={messages:[{content:e}]});let s=ot(a),c=a.find(at)??{};c.model!==void 0&&(o.model=c.model),c.temperature!==void 0&&(o.temperature=c.temperature),c.max_tokens!==void 0&&(o.max_tokens=c.max_tokens),c.stream!==void 0&&typeof c.stream==`boolean`&&(o.stream=c.stream);for(let e of lt)c[e]!==void 0&&(o[e]=c[e]);return c.normalize===void 0?this.normalize!==void 0&&(o.normalize=this.normalize):o.normalize=c.normalize,c.driver&&(o.provider=o.provider||c.driver),await T({iface:`puter-chat-completion`,driver:`ai-chat`,method:`complete`,argNames:[`messages`],puter:i,testMode:s??!1,transform:async e=>(e.toString=()=>e.message?.content,e.valueOf=()=>e.message?.content,e)})(o)}var O=(e,t=globalThis.puter)=>t.env===`gui`&&!e||/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(e)?e:(e||=`.`,(!e||!e.startsWith(`/`)&&!e.startsWith(`~`))&&(e=t.appID?S.default.join(`~/AppData`,t.appID,e):S.default.join(`~/`,e)),e),dt=e=>{for(let t of[`asset_url`,`url`,`href`]){let n=e[t];if(typeof n==`string`&&n)return n}return null},ft=async(e,t)=>{if(typeof e==`string`)return e;if(e instanceof Blob)return await E(e);if(e instanceof ArrayBuffer)return await E(new Blob([e]));if(e&&typeof e==`object`&&typeof e.arrayBuffer==`function`){let t=await e.arrayBuffer();return await E(new Blob([t],{type:e.type||void 0}))}if(e&&typeof e==`object`){let t=dt(e);if(t)return t}throw t},pt=async e=>{let t=await ft(e,{code:`invalid_audio_response`,message:`Unexpected audio response format`}),n=new(globalThis.Audio||Object);return n.src=t,n.toString=()=>t,n.valueOf=()=>t,n},mt=async e=>{let t=await ft(e,{code:`invalid_image_response`,message:`Unexpected image response format`}),n=new(globalThis.Image||Object);return n.src=t,n.toString=()=>n.src,n.valueOf=()=>n.src,n},ht=async e=>{let t=null,n=null;if(e instanceof Blob?(t=await E(e),n=e.type||`video/mp4`):typeof e==`string`?t=e:e&&typeof e==`object`&&(t=dt(e),n=e.mime_type||e.content_type||null),!t)return e;let r=globalThis.document?.createElement(`video`)||{setAttribute:()=>{}};return r.src=t,r.controls=!0,r.preload=`metadata`,n&&r.setAttribute(`data-mime-type`,n),r.setAttribute(`data-source`,t),r.toString=()=>r.src,r.valueOf=()=>r.src,r};async function gt(e,t){let{puter:n}=this,r={},i=!1;if(typeof e==`string`&&(r={prompt:e}),t===!0&&(i=!0),typeof e==`string`&&typeof t==`object`&&(r=t,r.prompt=e),typeof e==`object`&&(r=e),!r.prompt)throw{message:`Prompt parameter is required`,code:`prompt_required`};let a=(typeof r.driver==`string`?r.driver:void 0)||`ai-image`;return r.puter_output_path&&(r.puter_output_path=O(r.puter_output_path,n)),await T({iface:`puter-image-generation`,driver:a,method:`generate`,argNames:[`prompt`],puter:n,responseType:`blob`,testMode:i??!1,transform:mt})(r)}async function _t(e){let{puter:t}=this,n=t=>e?t.filter(t=>t.provider===e):t,r=async()=>{let e=await x(`${t.APIOrigin}/puterai/chat/models/details`,{includePuterAuth:!!t.authToken});if(!e.ok)return null;let r=await e.json();return n(Array.isArray(r?.models)?r.models:[])},i=async()=>{let e=await t.drivers.call(`puter-chat-completion`,`ai-chat`,`models`);return n(Array.isArray(e?.result)?e.result:[])};try{let e=await r();if(e!==null)return e}catch{}try{return await i()}catch{return[]}}async function vt(){let e=await _t.call(this),t=new Set;return(e??[]).forEach(e=>{e?.provider&&t.add(e.provider)}),Array.from(t)}var yt=10485760,bt=`ai-ocr`,xt=e=>{if(!e)return``;if(Array.isArray(e.blocks)&&e.blocks.length){let t=``;for(let n of e.blocks)typeof n?.text==`string`&&(!n.type||n.type===`text/textract:LINE`||n.type.startsWith(`text/`))&&(t+=`${n.text}\n`);if(t.trim())return t}if(Array.isArray(e.pages)&&e.pages.length){let t=e.pages.map(e=>(e?.markdown||``).trim()).filter(Boolean).join(`

`);if(t.trim())return t}return typeof e.document_annotation==`string`?e.document_annotation:typeof e.text==`string`?e.text:``};async function St(e,t,n){let{puter:r}=this;if(e===void 0&&t===void 0&&n===void 0)throw{message:`Arguments are required`,code:`arguments_required`};let i={};at(e)?i={...e}:i.source=e;let a=!1;for(let e of[t,n])typeof e==`boolean`?a||=e:at(e)&&(i={...i,...e});if(typeof i.testMode==`boolean`&&(a=i.testMode),delete i.testMode,!i.source)throw{message:`Source is required`,code:`source_required`};if(it(i.source)?i.source=await E(i.source):i.source?.source&&it(i.source.source)&&(i.source=await E(i.source.source)),typeof i.source==`string`&&i.source.startsWith(`data:`)&&ct(i.source)>yt)throw{message:`Input size cannot be larger than ${yt}`,code:`input_too_large`};return await T({iface:`puter-ocr`,driver:bt,method:`recognize`,argNames:[`source`],puter:r,testMode:a??!1,transform:async e=>xt(e)})(i)}var Ct=26214400,wt=(e={})=>{let t={...e};return t.voiceId&&!t.voice&&!t.voice_id&&(t.voice=t.voiceId),t.modelId&&!t.model&&!t.model_id&&(t.model=t.modelId),t.outputFormat&&!t.output_format&&(t.output_format=t.outputFormat),t.voiceSettings&&!t.voice_settings&&(t.voice_settings=t.voiceSettings),t.fileFormat&&!t.file_format&&(t.file_format=t.fileFormat),t.removeBackgroundNoise!==void 0&&t.remove_background_noise===void 0&&(t.remove_background_noise=t.removeBackgroundNoise),t.optimizeStreamingLatency!==void 0&&t.optimize_streaming_latency===void 0&&(t.optimize_streaming_latency=t.optimizeStreamingLatency),t.enableLogging!==void 0&&t.enable_logging===void 0&&(t.enable_logging=t.enableLogging),delete t.voiceId,delete t.modelId,delete t.outputFormat,delete t.voiceSettings,delete t.fileFormat,delete t.removeBackgroundNoise,delete t.optimizeStreamingLatency,delete t.enableLogging,t};async function Tt(e,t,n){let{puter:r}=this;if(e===void 0&&t===void 0&&n===void 0)throw{message:`Arguments are required`,code:`arguments_required`};let i={},a=!1;if(at(e)?i={...e}:i.audio=await st(e),at(t)?i={...i,...t}:typeof t==`boolean`&&(a=t),typeof n==`boolean`&&(a=n),i.file&&(i.audio=await st(i.file),delete i.file),i.audio instanceof Blob&&(i.audio=await st(i.audio)),!i.audio)throw{message:`Audio input is required`,code:`audio_required`};if(typeof i.audio==`string`&&i.audio.startsWith(`data:`)&&ct(i.audio)>Ct)throw{message:`Input size cannot be larger than 25 MB`,code:`input_too_large`};let o=wt({...i});return await T({iface:`puter-speech2speech`,driver:`ai-speech2speech`,method:`convert`,argNames:[`audio`],puter:r,responseType:`blob`,testMode:a,transform:pt})(o)}var Et=26214400,Dt=`ai-speech2txt`;async function Ot(e,t,n){let{puter:r}=this;if(e===void 0&&t===void 0&&n===void 0)throw{message:`Arguments are required`,code:`arguments_required`};let i={},a=!1;if(at(e)?i={...e}:i.file=await st(e),at(t)?i={...i,...t}:typeof t==`boolean`&&(a=t),typeof n==`boolean`&&(a=n),i.audio&&(i.file=await st(i.audio),delete i.audio),i.file instanceof Blob&&(i.file=await st(i.file)),!i.file)throw{message:`Audio input is required`,code:`audio_required`};if(typeof i.file==`string`&&i.file.startsWith(`data:`)&&ct(i.file)>Et)throw{message:`Input size cannot be larger than 25 MB`,code:`input_too_large`};let o=i.translate?`translate`:`transcribe`,s={...i};delete s.translate;let c=s.response_format;return await T({iface:`puter-speech2txt`,driver:Dt,method:o,puter:r,testMode:a,transform:async e=>c===`text`&&e&&typeof e==`object`&&typeof e.text==`string`?e.text:e})(s)}var kt=3e3,At=`ai-tts`;async function jt(e,t,n,r,i){let{puter:a}=this,o={};if(typeof e==`string`&&(o={text:e}),t&&typeof t==`object`&&!Array.isArray(t))Object.assign(o,t);else if(t&&typeof t==`string`)o.language=t,n&&typeof n==`string`&&(o.voice=n),r&&typeof r==`string`&&(o.engine=r);else if(t&&typeof t!=`boolean`)throw{message:`Second argument must be an options object or language string. Use: txt2speech("text", { voice: "name", engine: "type", language: "code" }) or txt2speech("text", "language", "voice", "engine")`,code:`invalid_arguments`};if(!o.text)throw{message:`Text parameter is required`,code:`text_required`};if(o.text.length>kt)throw{message:`Input size cannot be larger than ${kt}`,code:`input_too_large`};return await T({iface:`puter-tts`,driver:At,method:`synthesize`,argNames:[`source`],puter:a,responseType:`blob`,testMode:ot([t,n,r,i]),transform:pt})(o)}async function Mt(e={}){let{puter:t}=this,n=typeof e==`string`?{provider:e}:{...e};return await T({iface:`puter-tts`,driver:At,method:`list_engines`,argNames:[`source`],puter:t,readonly:!0,responseType:`text`})(n)}async function Nt(e){let{puter:t}=this,n=typeof e==`string`?{engine:e}:{...e};return T({iface:`puter-tts`,driver:At,method:`list_voices`,argNames:[`source`],puter:t,readonly:!0,responseType:`text`})(n)}async function Pt(e,t){let{puter:n}=this,r={},i=!1;if(typeof e==`string`&&(r={prompt:e}),t===!0&&(i=!0),typeof e==`string`&&typeof t==`object`&&(r=t,r.prompt=e),typeof e==`object`&&(r=e),!r.prompt)throw{message:`Prompt parameter is required`,code:`prompt_required`};r.duration!==void 0&&r.seconds===void 0&&(r.seconds=r.duration),r.test_mode===!0&&(i=!0);let a=(typeof r.driver==`string`?r.driver:void 0)||`ai-video`;return r.puter_output_path&&(r.puter_output_path=O(r.puter_output_path,n)),await T({iface:`puter-video-generation`,driver:a,method:`generate`,argNames:[`prompt`],puter:n,responseType:`blob`,testMode:i??!1,transform:ht})(r)}var Ft=class extends D{txt2speech;normalize=void 0;chat=ut;img2txt=St;speech2txt=Ot;speech2speech=Tt;txt2img=gt;txt2vid=Pt;listModels=_t;listModelProviders=vt;constructor(e){super(e);let t=this;for(let e of[`chat`,`img2txt`,`speech2txt`,`speech2speech`,`txt2img`,`txt2vid`,`listModels`,`listModelProviders`])t[e]=t[e].bind(this);this.txt2speech=Object.assign(jt.bind(this),{listEngines:Mt.bind(this),listVoices:Nt.bind(this)})}},k=class e extends Error{constructor(e,t,n={}){super(e),Object.setPrototypeOf(this,new.target.prototype),Object.defineProperty(this,"name",{value:`PuterJSError`,enumerable:!1,writable:!0,configurable:!0}),Object.defineProperty(this,"message",{value:e,enumerable:!0,writable:!0,configurable:!0}),t!==void 0&&(this.code=t),Object.assign(this,n)}static from(t){if(t instanceof e)return t;if(typeof t==`object`&&t){let{message:n,code:r,...i}=t;return new e(typeof n==`string`?n:`Unknown error`,typeof r==`string`?r:void 0,i)}return new e(typeof t==`string`?t:`Unknown error`)}},It=e=>new k(e,`invalid_request`,{success:!1,error:{code:`invalid_request`,message:e}});async function Lt(e){let{puter:t}=this;if(typeof e!=`string`||e.length===0)throw It(`Name is required`);let n=await x(`${t.APIOrigin}/apps/nameAvailable?name=${encodeURIComponent(e)}`,{includePuterAuth:!0}),r=await n.json();if(!n.ok)throw r;return r}var Rt=(e,t)=>(t.getUsers=async n=>(n??={},(await e.drivers.call(`app-telemetry`,`app-telemetry`,`get_users`,{app_uuid:t.uid,limit:n.limit,offset:n.offset})).result),t.users=async function*(e=100){let n=0;for(;;){let r=await t.getUsers({limit:e,offset:n});if(!r||r.length===0)return;for(let e of r)yield e;if(n+=r.length,r.length<e)return}},t),zt=(e,t)=>(t.forEach(t=>Rt(e,t)),t),Bt=e=>({name:e.name,index_url:e.indexURL,title:e.title,description:e.description,icon:e.icon,maximize_on_start:e.maximizeOnStart,background:e.background,filetype_associations:e.filetypeAssociations,metadata:e.metadata,feedback_enabled:e.feedbackEnabled});async function Vt(e,t,n){let{puter:r}=this,i;if(i=typeof e==`string`?{object:{name:e,index_url:t,title:n??e}}:typeof e==`object`&&e?{object:{...Bt(e),title:e.title??e.name},options:{dedupe_name:e.dedupeName??!1}}:{object:{}},!i.object.name)throw It(`Name is required`);if(!i.object.index_url)throw It(`Index URL is required`);return Rt(r,await T({iface:`puter-apps`,driver:`es:app`,method:`create`,argNames:[`object`],puter:r})(i))}async function Ht(e){let{puter:t}=this,n=typeof e==`string`?{id:{name:e}}:{};return await T({iface:`puter-apps`,driver:`es:app`,method:`delete`,argNames:[`uid`],puter:t})(n)}async function Ut(e,t){let{puter:n}=this,r={};return typeof e==`string`&&(typeof t==`object`&&t&&(r.params=t),r.id={name:e}),typeof e==`object`&&e&&(r.params=e),Rt(n,await T({iface:`puter-apps`,driver:`es:app`,method:`read`,argNames:[`uid`],puter:n,readonly:!0})(r))}function Wt(...e){let{puter:t}=this,n=typeof e[0]==`object`&&e[0]!==null?e[0]:{success:e[0],error:e[1]};return new Promise((e,r)=>{let i=Qe(`/get-dev-profile`,t.APIOrigin,t.authToken,`get`);w(i,n.success,n.error,e,r),i.send()})}async function*A(e,t={}){let n={cursor:t.cursor??null,...t.includeTotal===!0?{includeTotal:!0}:{}};for(;;){let t=await e(n),r=Array.isArray(t)?{items:t}:t??{items:[]};if(yield r,!r.cursor)return;n={cursor:r.cursor}}}async function Gt(e){let t=[];for await(let n of A(e))t.push(...n.items??[]);return t}function Kt(e){let{puter:t}=this,n=typeof e==`object`&&!!e,r=n?e:{},{limit:i,offset:a,cursor:o,includeTotal:s,stream:c,...l}=r,u=Object.prototype.hasOwnProperty.call(r,`cursor`),d=T({iface:`puter-apps`,driver:`es:app`,method:`select`,argNames:[`uid`],puter:t,readonly:!0}),f={predicate:[`user-can-edit`]};n&&(f.params=l),i!==void 0&&(f.limit=i);let p=e=>d({...f,...e});if(c===!0){if(a!==void 0)throw new k("`offset` cannot be combined with `stream`; pass `cursor` to resume from a position.",`invalid_request`);return(async function*(){for await(let e of A(p,{cursor:o,includeTotal:s===!0}))zt(t,e.items??[]),yield e})()}return i!==void 0||a!==void 0||u||s!==void 0?(async()=>{let e={...f};a!==void 0&&(e.offset=a),u&&(e.cursor=o??null),s!==void 0&&(e.includeTotal=s);let n=await d(e);return n&&!Array.isArray(n)&&Array.isArray(n.items)?(zt(t,n.items),n):zt(t,n)})():Gt(p).then(e=>zt(t,e))}async function qt(e,t){let{puter:n}=this,r={};return typeof e==`string`&&(r={id:{name:e},object:Bt(t??{})}),Rt(n,await T({iface:`puter-apps`,driver:`es:app`,method:`update`,argNames:[`object`],puter:n})(r))}var Jt=class extends D{list=Kt;create=Vt;update=qt;get=Ut;delete=Ht;checkName=Lt;getDeveloperProfile=Wt;constructor(e){super(e);let t=this;for(let e of[`list`,`create`,`update`,`get`,`delete`,`checkName`,`getDeveloperProfile`])t[e]=t[e].bind(this)}},Yt=600,Xt=700,Zt=()=>{if(navigator.userActivation)return navigator.userActivation.hasBeenActive&&navigator.userActivation.isActive;try{let e=window.open(``,`_blank`,`width=1,height=1,left=-1000,top=-1000`);return e?(e.close(),!0):!1}catch{return!1}},Qt=(e,t=`Puter`)=>{let n=screen.width/2-Yt/2,r=screen.height/2-Xt/2;return window.open(e,t,`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${Yt}, height=${Xt}, top=${r}, left=${n}`)},$t=class extends (globalThis.HTMLElement||Object){static messageID=Math.floor((2**53-1)/2);#e;constructor(e,t,n={}){super(),this.reject=t,this.resolve=e,this.options=n,this.#e=this.constructor.messageID++,this.attachShadow({mode:`open`});let r=`
        <style>
        dialog{
            background: transparent;
            border: none;
            box-shadow: none;
            outline: none;
        }
        dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
        }
        .puter-dialog-content {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 20px;
            background: white;
            box-shadow: 0 0 9px 1px rgb(0 0 0 / 21%);
            padding: 80px 20px;
            -webkit-font-smoothing: antialiased;
            color: #575762;
            position: relative;
            background-color: #fff;
        }
        
        dialog * {
            max-width: 500px;
            font-family: "Helvetica Neue", HelveticaNeue, Helvetica, Arial, sans-serif;
        }
        
        dialog p.about{
            text-align: center;
            font-size: 17px;
            padding: 10px 30px;
            font-weight: 400;
            -webkit-font-smoothing: antialiased;
            color: #1f1f2a;
            box-sizing: border-box;
            max-width: 400px;
        }
        
        dialog .buttons{
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 20px;
            text-align: center;
            flex-direction: column;
        }
        
        .launch-auth-popup-footnote{
            font-size: 10px;
            color: #666;
            margin-top: 10px;
            /* footer at the bottom */
            position: absolute;
            left: 0;
            right: 0;
            bottom: 20px;
            text-align: center;
            margin: 0 auto; 
            max-width: 215px;
        }
        
        dialog .close-btn{
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 17px;
            color: #8a8a8a8c;
            cursor: pointer;
        }
        
        dialog .close-btn:hover{
            color: #000;
        }
        
        /* ------------------------------------
        Button
        ------------------------------------*/
        
        dialog .button {
            color: #666666;
            background-color: #eeeeee;
            border-color: #eeeeee;
            font-size: 14px;
            text-decoration: none;
            text-align: center;
            line-height: 40px;
            height: 35px;
            padding: 0 30px;
            margin: 0;
            display: inline-block;
            appearance: none;
            cursor: pointer;
            border: none;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            border-color: #b9b9b9;
            border-style: solid;
            border-width: 1px;
            line-height: 35px;
            background: -webkit-gradient(linear, left top, left bottom, from(#f6f6f6), to(#e1e1e1));
            background: linear-gradient(#f6f6f6, #e1e1e1);
            border-radius: 4px;
            outline: none;
            -webkit-font-smoothing: antialiased;
        }
        
        dialog .button:focus-visible {
            border-color: rgb(118 118 118);
        }
        
        dialog .button:active, dialog .button.active, dialog .button.is-active, dialog .button.has-open-contextmenu {
            text-decoration: none;
            background-color: #eeeeee;
            border-color: #cfcfcf;
            color: #a9a9a9;
            -webkit-transition-duration: 0s;
            transition-duration: 0s;
            -webkit-box-shadow: inset 0 1px 3px rgb(0 0 0 / 20%);
            box-shadow: inset 0px 2px 3px rgb(0 0 0 / 36%), 0px 1px 0px white;
        }
        
        dialog .button.disabled, dialog .button.is-disabled, dialog .button:disabled {
            top: 0 !important;
            background: #EEE !important;
            border: 1px solid #DDD !important;
            text-shadow: 0 1px 1px white !important;
            color: #CCC !important;
            cursor: default !important;
            appearance: none !important;
            pointer-events: none;
        }
        
        dialog .button-action.disabled, dialog .button-action.is-disabled, dialog .button-action:disabled {
            background: #55a975 !important;
            border: 1px solid #60ab7d !important;
            text-shadow: none !important;
            color: #CCC !important;
        }
        
        dialog .button-primary.disabled, dialog .button-primary.is-disabled, dialog .button-primary:disabled {
            background: #8fc2e7 !important;
            border: 1px solid #98adbd !important;
            text-shadow: none !important;
            color: #f5f5f5 !important;
        }
        
        dialog .button-block {
            width: 100%;
        }
        
        dialog .button-primary {
            border-color: #088ef0;
            background: -webkit-gradient(linear, left top, left bottom, from(#34a5f8), to(#088ef0));
            background: linear-gradient(#34a5f8, #088ef0);
            color: white;
        }
        
        dialog .button-danger {
            border-color: #f00808;
            background: -webkit-gradient(linear, left top, left bottom, from(#f83434), to(#f00808));
            background: linear-gradient(#f83434, #f00808);
            color: white;
        }
        
        dialog .button-primary:active, dialog .button-primary.active, dialog .button-primary.is-active, dialog .button-primary-flat:active, dialog .button-primary-flat.active, dialog .button-primary-flat.is-active {
            background-color: #2798eb;
            border-color: #2798eb;
            color: #bedef5;
        }
        
        dialog .button-action {
            border-color: #08bf4e;
            background: -webkit-gradient(linear, left top, left bottom, from(#29d55d), to(#1ccd60));
            background: linear-gradient(#29d55d, #1ccd60);
            color: white;
        }
        
        dialog .button-action:active, dialog .button-action.active, dialog .button-action.is-active, dialog .button-action-flat:active, dialog .button-action-flat.active, dialog .button-action-flat.is-active {
            background-color: #27eb41;
            border-color: #27eb41;
            color: #bef5ca;
        }
        
        dialog .button-giant {
            font-size: 28px;
            height: 70px;
            line-height: 70px;
            padding: 0 70px;
        }
        
        dialog .button-jumbo {
            font-size: 24px;
            height: 60px;
            line-height: 60px;
            padding: 0 60px;
        }
        
        dialog .button-large {
            font-size: 20px;
            height: 50px;
            line-height: 50px;
            padding: 0 50px;
        }
        
        dialog .button-normal {
            font-size: 16px;
            height: 40px;
            line-height: 38px;
            padding: 0 40px;
        }
        
        dialog .button-small {
            height: 30px;
            line-height: 29px;
            padding: 0 30px;
        }
        
        dialog .button-tiny {
            font-size: 9.6px;
            height: 24px;
            line-height: 24px;
            padding: 0 24px;
        }
        
        #launch-auth-popup{
            width: 220px; 
            font-weight: 500; 
            font-size: 15px;
            max-width: 250px;
        }
        dialog .button-auth{
            margin-bottom: 10px;
        }
        dialog .button-auth-cancel{
            background: none !important;
            width: 220px;
            max-width: 250px;
        }
        dialog a, dialog a:visited{
            color: rgb(0 0 0);
            text-decoration: none;
        }
        dialog a:hover{
            text-decoration: underline;
        }
        
        @media (max-width:480px)  {
            .puter-dialog-content{
                padding: 50px 20px;
            }
            dialog p.about{
                padding: 10px 0;
            }
            dialog .button-auth{
                width: 100% !important;
                margin:0 !important;
                margin-bottom: 10px !important;
            }

            dialog .buttons{
                margin-bottom: 20px;
            }
        }
        .error-container h1 {
            color: #e74c3c;
            font-size: 20px;
            text-align: center;
        }

        .puter-dialog-content a:focus{
            outline: none;
        }

        @media (prefers-color-scheme: dark) {
            .puter-dialog-content {
                border: 1px solid #2a2a2e;
                background: #1e1e22;
                background-color: #1e1e22;
                color: #d6d6dc;
                box-shadow: 0 0 9px 1px rgb(0 0 0 / 60%);
            }

            dialog p.about {
                color: #e4e4ea;
            }

            dialog .close-btn {
                color: #8a8a90;
            }

            dialog .close-btn:hover {
                color: #fff;
            }

            .launch-auth-popup-footnote {
                color: #9a9aa0;
            }

            dialog .button {
                color: #d6d6dc;
                background-color: #3a3a40;
                border-color: #4a4a50;
                background: linear-gradient(#3f3f45, #2e2e34);
                -webkit-box-shadow: inset 0px 1px 0px rgb(255 255 255 / 6%), 0 1px 2px rgb(0 0 0 / 40%);
                box-shadow: inset 0px 1px 0px rgb(255 255 255 / 6%), 0 1px 2px rgb(0 0 0 / 40%);
            }

            dialog .button:focus-visible {
                border-color: #8a8a90;
            }

            dialog .button:active, dialog .button.active, dialog .button.is-active, dialog .button.has-open-contextmenu {
                background-color: #2a2a30;
                border-color: #1f1f24;
                color: #8a8a90;
                -webkit-box-shadow: inset 0 1px 3px rgb(0 0 0 / 60%);
                box-shadow: inset 0px 2px 3px rgb(0 0 0 / 60%), 0px 1px 0px rgb(255 255 255 / 4%);
            }

            /* The dark-mode 'dialog .button' rule above has the same specificity
               as the light-mode 'dialog .button-primary' rule, so without this
               override source order wins and the primary button turns gray. */
            dialog .button-primary {
                border-color: #088ef0;
                background: linear-gradient(#34a5f8, #088ef0);
                color: white;
            }

            dialog .button-primary:active, dialog .button-primary.active, dialog .button-primary.is-active {
                background-color: #2798eb;
                border-color: #2798eb;
                color: #bedef5;
            }

            dialog .button.disabled, dialog .button.is-disabled, dialog .button:disabled {
                background: #2a2a30 !important;
                border: 1px solid #34343a !important;
                text-shadow: none !important;
                color: #5a5a60 !important;
            }

            dialog .button-primary.disabled, dialog .button-primary.is-disabled, dialog .button-primary:disabled {
                background: #1f4e74 !important;
                border: 1px solid #2a5a82 !important;
                color: #8aa4bd !important;
            }

            dialog .button-action.disabled, dialog .button-action.is-disabled, dialog .button-action:disabled {
                background: #1f5a3a !important;
                border: 1px solid #2a6a45 !important;
                color: #8abda0 !important;
            }

            dialog a, dialog a:visited {
                color: #6ea8ff;
            }

            .error-container h1 {
                color: #ff7466;
            }
        }
        </style>`;window.location.protocol===`file:`?r+=`<dialog>
                    <div class="puter-dialog-content" style="padding: 20px 40px; font-size: 15px;">
                        <span class="close-btn">&#x2715</span>
                        <div class="error-container">
                            <h1>Puter.js Error: Unsupported Protocol</h1>
                            <p>It looks like you've opened this file directly in your browser (using the <code style="font-family: monospace;">file:///</code> protocol) which is not supported by Puter.js for security reasons.</p>
                            <p>To view this content properly, you need to serve it through a web server. Here are some options:</p>
                            <ul>
                                <li>Use a local development server (e.g., Python's built-in server or Node.js http-server)</li>
                                <li>Upload the files to a web hosting service</li>
                                <li>Use a local server application like XAMPP or MAMP</li>
                            </ul>
                            <p class="help-text">If you're not familiar with these options, consider reaching out to your development team or IT support for assistance.</p>
                        </div>
                        <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size:13px;">
                            <a href="https://docs.puter.com" target="_blank">Docs</a><span style="margin:10px; color: #CCC;">|</span>
                            <a href="https://github.com/heyPuter/puter/" target="_blank">Github</a><span style="margin:10px; color: #CCC;">|</span>
                            <a href="https://discord.com/invite/PQcx7Teh8u" target="_blank">Discord</a>
                        </p>
                    </div>
                </dialog>`:r+=`<dialog>
                <div class="puter-dialog-content">
                    <span class="close-btn">&#x2715</span>
                    <a href="https://puter.com?utm_source=sdk-splash" target="_blank" style="border:none; outline:none; display: block; width: 70px; height: 70px; margin: 0 auto; border-radius: 4px;"><img style="display: block; width: 40px; height: 40px; margin: 0 auto; border-radius: 8px; background-color: #2210d7; padding: 15px;" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+Cjxzdmcgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGcgY2xhc3M9ImxheWVyIj4KICA8dGl0bGU+TGF5ZXIgMTwvdGl0bGU+CiAgPGcgaWQ9InN2Z18xIiBzdHJva2Utd2lkdGg9IjMiIHRyYW5zZm9ybT0icm90YXRlKDkwIDI0IDIzLjk5OTcpIj4KICAgPHBvbHlsaW5lIGZpbGw9Im5vbmUiIGlkPSJzdmdfMiIgcG9pbnRzPSIzOSAyNCAyNSAyNCAyNSAyOCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMyIvPgogICA8cG9seWxpbmUgZmlsbD0ibm9uZSIgaWQ9InN2Z18zIiBwb2ludHM9IjM1Ljg3OSAxMC4xMjEgMzIgMTQgMjUgMTQgMjUgMTgiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiLz4KICAgPHBhdGggZD0ibTEzLDI2YTEwLjI5LDEwLjI5IDAgMCAxIC03LjIsLTMiIGZpbGw9Im5vbmUiIGlkPSJzdmdfNCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMyIvPgogICA8cGF0aCBkPSJtMTcsMzEuNmE1LjgzLDUuODMgMCAwIDEgLTQsLTUuNmE1LjczLDUuNzMgMCAwIDEgMiwtNC40IiBmaWxsPSJub25lIiBpZD0ic3ZnXzUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiLz4KICAgPHBhdGggZD0ibTM1Ljg4LDM3Ljg4bC0zLjg4LC0zLjg4bC03LDBsMCwyYTkuOSw5LjkgMCAwIDEgLTEwLDEwYTkuOSw5LjkgMCAwIDEgLTEwLC0xMGE5LjA2LDkuMDYgMCAwIDEgMC42LC0zLjJhNS42Myw1LjYzIDAgMCAxIC0yLjYsLTQuOGE1Ljg5LDUuODkgMCAwIDEgMi44LC01YTkuOTksOS45OSAwIDAgMSAtMi44LC03YTkuOSw5LjkgMCAwIDEgMTAsLTEwbDAuNCwwYTUuODMsNS44MyAwIDAgMSA1LjYsLTRhNS44OSw1Ljg5IDAgMCAxIDYsNiIgZmlsbD0ibm9uZSIgaWQ9InN2Z182IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgIDxjaXJjbGUgY3g9IjM4IiBjeT0iOCIgZGF0YS1jb2xvcj0iY29sb3ItMiIgZmlsbD0ibm9uZSIgaWQ9InN2Z183IiByPSIzIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjQiIGRhdGEtY29sb3I9ImNvbG9yLTIiIGZpbGw9Im5vbmUiIGlkPSJzdmdfOCIgcj0iMyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMyIvPgogICA8Y2lyY2xlIGN4PSIzOCIgY3k9IjQwIiBkYXRhLWNvbG9yPSJjb2xvci0yIiBmaWxsPSJub25lIiBpZD0ic3ZnXzkiIHI9IjMiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8L2c+CiA8L2c+Cjwvc3ZnPg=="/></a>
                    <p class="about">This website uses Puter to bring you safe, secure, and private AI and Cloud features.</p>
                    <div class="buttons">
                        <button class="button button-primary button-auth" id="launch-auth-popup">Continue</button>
                        <button class="button button-auth button-auth-cancel" id="launch-auth-popup-cancel">Cancel</button>
                    </div>
                    <p class="launch-auth-popup-footnote">By clicking 'Continue' you agree to Puter's <a href="https://puter.com/terms" target="_blank">Terms of Service</a> and <a href="https://puter.com/privacy" target="_blank">Privacy Policy</a></p>
                </div>
            </dialog>`,this.shadowRoot.innerHTML=r,this.messageListener=async e=>{e.origin===puter.defaultGUIOrigin&&(this.authPopup&&e.source!==this.authPopup||e.data.msg===`puter.token`&&(this.close(),puter.setAuthToken(e.data.token),puter.setAppID(e.data.app_uid),window.removeEventListener(`message`,this.messageListener),puter.puterAuthState.authGranted=!0,this.resolve(),puter.onAuth&&typeof puter.onAuth==`function`&&puter.getUser().then(e=>{puter.onAuth(e)}),puter.puterAuthState.isPromptOpen=!1,puter.puterAuthState.resolver&&(puter.puterAuthState.authGranted?puter.puterAuthState.resolver.resolve():puter.puterAuthState.resolver.reject(),puter.puterAuthState.resolver=null)))}}#t(){return this.options.popupURL?this.options.popupURL:`${puter.defaultGUIOrigin}/?embedded_in_popup=true&request_auth=true&msg_id=${this.#e}${window.crossOriginIsolated?`&cross_origin_isolated=true`:``}`}cancelListener=()=>{if(this.close(),window.removeEventListener(`message`,this.messageListener),this.options.popupURL){typeof this.options.onCancel==`function`&&this.options.onCancel();return}puter.puterAuthState.authGranted=!1,puter.puterAuthState.isPromptOpen=!1,this.reject(Error(`User cancelled the authentication`)),puter.puterAuthState.resolver&&(puter.puterAuthState.resolver.reject(Error(`User cancelled the authentication`)),puter.puterAuthState.resolver=null)};connectedCallback(){this.shadowRoot.querySelector(`#launch-auth-popup`)?.addEventListener(`click`,()=>{let e=this.#n();this.authPopup=e,this.options.popupURL&&(typeof this.options.onLaunch==`function`&&this.options.onLaunch(e),this.close())}),this.options.popupURL||window.addEventListener(`message`,this.messageListener),this.shadowRoot.querySelector(`#launch-auth-popup-cancel`)?.addEventListener(`click`,this.cancelListener),this.shadowRoot.querySelector(`.close-btn`)?.addEventListener(`click`,this.cancelListener),this.shadowRoot.querySelector(`dialog`)?.addEventListener(`cancel`,e=>{e.preventDefault(),this.cancelListener()})}#n(){return this.options.popupName?Qt(this.#t(),this.options.popupName):Qt(this.#t())}open(){if(Zt()){let e=this.#n();this.authPopup=e,this.options.popupURL&&typeof this.options.onLaunch==`function`&&this.options.onLaunch(e)}else this.shadowRoot.querySelector(`dialog`).showModal()}close(){this.shadowRoot.querySelector(`dialog`).close()}};$t.__proto__===globalThis.HTMLElement&&customElements.define(`puter-dialog`,$t);var en=class extends D{#e=1;signIn=e=>(e||={},puter.env===`app`?Promise.reject({error:`not_available_in_app`,msg:`signIn is not available to an app; the Puter session that launched it provides the token.`}):new Promise((t,n)=>{let r=crypto.randomUUID(),i=this.#e++,a=`${puter.defaultGUIOrigin}/action/sign-in?embedded_in_popup=true&msg_id=${i}${window.crossOriginIsolated?`&cross_origin_isolated=true&signin_session=${r}`:``}${e.attempt_temp_user_creation?`&attempt_temp_user_creation=true`:``}${e.request_auth?`&request_auth=true`:``}`,o=!1,s=null,c=null,l=()=>{s&&=(clearInterval(s),null),window.removeEventListener(`message`,u)};window.crossOriginIsolated&&(async()=>{for(;;){try{let e=await x(`${puter.defaultAPIOrigin}/login/wait`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({session:r})});if(e.ok){let{auth_token:n}=await e.json();return o?void 0:(o=!0,l(),puter.setAuthToken(n),t({success:!0,token:n}),``)}}catch{}await new Promise(e=>setTimeout(e,1e3))}})();function u(e){e.origin===puter.defaultGUIOrigin&&(c&&e.source!==c||e.data?.msg===`puter.token`&&e.data?.msg_id==i&&(o||(o=!0,l(),delete e.data.msg_id,delete e.data.msg,e.data.success?(puter.setAuthToken(e.data.token),t(e.data)):n(e.data))))}window.addEventListener(`message`,u);let d=e=>{if(!o){if(!e){o=!0,l(),n({error:`popup_blocked`,msg:`The sign-in popup was blocked by the browser.`});return}c=e,s=setInterval(()=>{e.closed&&(clearInterval(s),s=null,!o&&(o=!0,l(),n({error:`auth_window_closed`,msg:`Authentication window was closed by the user without completing the process.`})))},100)}};if(Zt()){let e=Qt(a);window.crossOriginIsolated||d(e)}else{let e=new $t(()=>{},()=>{},{popupURL:a,onLaunch:e=>d(e),onCancel:()=>{o||(o=!0,l(),n({error:`auth_window_closed`,msg:`Authentication window was closed by the user without completing the process.`}))}});document.body.appendChild(e),e.open()}}));isSignedIn=()=>!!puter.authToken;getUser=function(...e){if(!puter.authToken)throw{status:401,message:`Unauthorized`};let t;return t=typeof e[0]==`object`&&e[0]!==null?e[0]:{success:e[0],error:e[1]},new Promise((e,n)=>{let r=Qe(`/whoami`,puter.APIOrigin,puter.authToken,`get`);w(r,t.success,t.error,e,n),r.send()})};signOut=()=>{puter.resetAuthToken()};async whoami(){if(!this.authToken)throw{status:401,message:`Unauthorized`};return await(await x(`${this.APIOrigin}/whoami`,{includePuterAuth:!0,logContext:{service:`auth`,operation:`whoami`,params:{}}})).json()}async getMonthlyUsage(){return await(await x(`${this.APIOrigin}/metering/usage`,{includePuterAuth:!0,logContext:{service:`auth`,operation:`usage`,params:{}}})).json()}async getDetailedAppUsage(e){if(!e)throw Error(`appId is required`);return await(await x(`${this.APIOrigin}/metering/usage/${e}`,{includePuterAuth:!0,logContext:{service:`auth`,operation:`detailed_app_usage`,params:{appId:e}}})).json()}async getGlobalUsage(){return await(await x(`${this.APIOrigin}/metering/globalUsage`,{includePuterAuth:!0,logContext:{service:`auth`,operation:`global_usage`,params:{}}})).json()}},tn=class{constructor(e,t){this.puter=e,this.parameters=t,this._init()}_init(){let e=new URL(location.href).searchParams.get(`enabled_logs`);e||=``,e=e.split(`;`);for(let t of e)t!==``&&this.puter.logger.on(t);globalThis.addEventListener(`message`,async e=>{e.source===globalThis.parent&&e.data.$&&e.data.$===`puterjs-debug`&&(console.log(`Got a puter.js debug event!`,e.data),e.data.cmd===`log.on`&&(console.log(`Got instruction to turn logs on!`),this.puter.logger.on(e.data.category)))})}},nn=class{constructor(e,t){this.puter=e,this.iface_name=t}async call(e,t){return await Ae({puter:this.puter,iface:this.iface_name,method:e,args:t})}},rn=class{constructor(e){this.puter=e,this.drivers_={}}_init({puter:e}){e.call=this.call.bind(this)}async list(){return(await(await x(`${this.puter.APIOrigin}/lsmod`,{method:`POST`,includePuterAuth:!0,logContext:{service:`drivers`,operation:`list`,params:{}}})).json()).interfaces}async get(e){return this.drivers_[e]??=new nn(this.puter,e)}async call(...e){let t,n,r;return e.length>=4?[t,,n,r]=e:e.length===3?[t,n,r]=e:([t,r]=e,n=t),await(await this.get(t)).call(n,r)}},an=e=>(e.body!==void 0&&e.text===void 0&&e.html===void 0&&(e.text=e.body),delete e.body,e),on=class extends D{sendTransactional=T({iface:`puter-email`,method:`sendTransactional`,argNames:[`to`,`subject`,`body`],preprocess:an});send=T({iface:`puter-email`,method:`send`,argNames:[`to`,`subject`,`body`],preprocess:an})},j=Object.create(null);j.open=`0`,j.close=`1`,j.ping=`2`,j.pong=`3`,j.message=`4`,j.upgrade=`5`,j.noop=`6`;var sn=Object.create(null);Object.keys(j).forEach(e=>{sn[j[e]]=e});var cn={type:`error`,data:`parser error`},ln=typeof Blob==`function`||typeof Blob<`u`&&Object.prototype.toString.call(Blob)===`[object BlobConstructor]`,un=typeof ArrayBuffer==`function`,dn=e=>typeof ArrayBuffer.isView==`function`?ArrayBuffer.isView(e):e&&e.buffer instanceof ArrayBuffer,fn=({type:e,data:t},n,r)=>ln&&t instanceof Blob?n?r(t):pn(t,r):un&&(t instanceof ArrayBuffer||dn(t))?n?r(t):pn(new Blob([t]),r):r(j[e]+(t||``)),pn=(e,t)=>{let n=new FileReader;return n.onload=function(){let e=n.result.split(`,`)[1];t(`b`+(e||``))},n.readAsDataURL(e)};function mn(e){return e instanceof Uint8Array?e:e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}var hn;function gn(e,t){if(ln&&e.data instanceof Blob)return e.data.arrayBuffer().then(mn).then(t);if(un&&(e.data instanceof ArrayBuffer||dn(e.data)))return t(mn(e.data));fn(e,!1,e=>{hn||=new TextEncoder,t(hn.encode(e))})}var _n=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,vn=typeof Uint8Array>`u`?[]:new Uint8Array(256);for(let e=0;e<64;e++)vn[_n.charCodeAt(e)]=e;var yn=e=>{let t=e.length*.75,n=e.length,r,i=0,a,o,s,c;e[e.length-1]===`=`&&(t--,e[e.length-2]===`=`&&t--);let l=new ArrayBuffer(t),u=new Uint8Array(l);for(r=0;r<n;r+=4)a=vn[e.charCodeAt(r)],o=vn[e.charCodeAt(r+1)],s=vn[e.charCodeAt(r+2)],c=vn[e.charCodeAt(r+3)],u[i++]=a<<2|o>>4,u[i++]=(o&15)<<4|s>>2,u[i++]=(s&3)<<6|c&63;return l},bn=typeof ArrayBuffer==`function`,xn=(e,t)=>{if(typeof e!=`string`)return{type:`message`,data:Cn(e,t)};let n=e.charAt(0);return n===`b`?{type:`message`,data:Sn(e.substring(1),t)}:sn[n]?e.length>1?{type:sn[n],data:e.substring(1)}:{type:sn[n]}:cn},Sn=(e,t)=>bn?Cn(yn(e),t):{base64:!0,data:e},Cn=(e,t)=>{switch(t){case`blob`:return e instanceof Blob?e:new Blob([e]);default:return e instanceof ArrayBuffer?e:e.buffer}},wn=``,Tn=(e,t)=>{let n=e.length,r=Array(n),i=0;e.forEach((e,a)=>{fn(e,!1,e=>{r[a]=e,++i===n&&t(r.join(wn))})})},En=(e,t)=>{let n=e.split(wn),r=[];for(let e=0;e<n.length;e++){let i=xn(n[e],t);if(r.push(i),i.type===`error`)break}return r};function Dn(){return new TransformStream({transform(e,t){gn(e,n=>{let r=n.length,i;if(r<126)i=new Uint8Array(1),new DataView(i.buffer).setUint8(0,r);else if(r<65536){i=new Uint8Array(3);let e=new DataView(i.buffer);e.setUint8(0,126),e.setUint16(1,r)}else{i=new Uint8Array(9);let e=new DataView(i.buffer);e.setUint8(0,127),e.setBigUint64(1,BigInt(r))}e.data&&typeof e.data!=`string`&&(i[0]|=128),t.enqueue(i),t.enqueue(n)})}})}var On;function kn(e){return e.reduce((e,t)=>e+t.length,0)}function An(e,t){if(e[0].length===t)return e.shift();let n=new Uint8Array(t),r=0;for(let i=0;i<t;i++)n[i]=e[0][r++],r===e[0].length&&(e.shift(),r=0);return e.length&&r<e[0].length&&(e[0]=e[0].slice(r)),n}function jn(e,t){On||=new TextDecoder;let n=[],r=0,i=-1,a=!1;return new TransformStream({transform(o,s){for(n.push(o);;){if(r===0){if(kn(n)<1)break;let e=An(n,1);a=(e[0]&128)==128,i=e[0]&127,r=i<126?3:i===126?1:2}else if(r===1){if(kn(n)<2)break;let e=An(n,2);i=new DataView(e.buffer,e.byteOffset,e.length).getUint16(0),r=3}else if(r===2){if(kn(n)<8)break;let e=An(n,8),t=new DataView(e.buffer,e.byteOffset,e.length),a=t.getUint32(0);if(a>2**21-1){s.enqueue(cn);break}i=a*2**32+t.getUint32(4),r=3}else{if(kn(n)<i)break;let e=An(n,i);s.enqueue(xn(a?e:On.decode(e),t)),r=0}if(i===0||i>e){s.enqueue(cn);break}}}})}function M(e){if(e)return Mn(e)}function Mn(e){for(var t in M.prototype)e[t]=M.prototype[t];return e}M.prototype.on=M.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks[`$`+e]=this._callbacks[`$`+e]||[]).push(t),this},M.prototype.once=function(e,t){function n(){this.off(e,n),t.apply(this,arguments)}return n.fn=t,this.on(e,n),this},M.prototype.off=M.prototype.removeListener=M.prototype.removeAllListeners=M.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},arguments.length==0)return this._callbacks={},this;var n=this._callbacks[`$`+e];if(!n)return this;if(arguments.length==1)return delete this._callbacks[`$`+e],this;for(var r,i=0;i<n.length;i++)if(r=n[i],r===t||r.fn===t){n.splice(i,1);break}return n.length===0&&delete this._callbacks[`$`+e],this},M.prototype.emit=function(e){this._callbacks=this._callbacks||{};for(var t=Array(arguments.length-1),n=this._callbacks[`$`+e],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(n){n=n.slice(0);for(var r=0,i=n.length;r<i;++r)n[r].apply(this,t)}return this},M.prototype.emitReserved=M.prototype.emit,M.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks[`$`+e]||[]},M.prototype.hasListeners=function(e){return!!this.listeners(e).length};var Nn=typeof Promise==`function`&&typeof Promise.resolve==`function`?e=>Promise.resolve().then(e):(e,t)=>t(e,0),N=typeof self<`u`?self:typeof window<`u`?window:Function(`return this`)(),Pn=`arraybuffer`;function Fn(e,...t){return t.reduce((t,n)=>(e.hasOwnProperty(n)&&(t[n]=e[n]),t),{})}var In=N.setTimeout,Ln=N.clearTimeout;function Rn(e,t){t.useNativeTimers?(e.setTimeoutFn=In.bind(N),e.clearTimeoutFn=Ln.bind(N)):(e.setTimeoutFn=N.setTimeout.bind(N),e.clearTimeoutFn=N.clearTimeout.bind(N))}var zn=1.33;function Bn(e){return typeof e==`string`?Vn(e):Math.ceil((e.byteLength||e.size)*zn)}function Vn(e){let t=0,n=0;for(let r=0,i=e.length;r<i;r++)t=e.charCodeAt(r),t<128?n+=1:t<2048?n+=2:t<55296||t>=57344?n+=3:(r++,n+=4);return n}function Hn(){return Date.now().toString(36).substring(3)+Math.random().toString(36).substring(2,5)}function Un(e){let t=``;for(let n in e)e.hasOwnProperty(n)&&(t.length&&(t+=`&`),t+=encodeURIComponent(n)+`=`+encodeURIComponent(e[n]));return t}function Wn(e){let t={},n=e.split(`&`);for(let e=0,r=n.length;e<r;e++){let r=n[e].split(`=`);t[decodeURIComponent(r[0])]=decodeURIComponent(r[1])}return t}var Gn=class extends Error{constructor(e,t,n){super(e),this.description=t,this.context=n,this.type=`TransportError`}},Kn=class extends M{constructor(e){super(),this.writable=!1,Rn(this,e),this.opts=e,this.query=e.query,this.socket=e.socket,this.supportsBinary=!e.forceBase64}onError(e,t,n){return super.emitReserved(`error`,new Gn(e,t,n)),this}open(){return this.readyState=`opening`,this.doOpen(),this}close(){return(this.readyState===`opening`||this.readyState===`open`)&&(this.doClose(),this.onClose()),this}send(e){this.readyState===`open`&&this.write(e)}onOpen(){this.readyState=`open`,this.writable=!0,super.emitReserved(`open`)}onData(e){let t=xn(e,this.socket.binaryType);this.onPacket(t)}onPacket(e){super.emitReserved(`packet`,e)}onClose(e){this.readyState=`closed`,super.emitReserved(`close`,e)}pause(e){}createUri(e,t={}){return e+`://`+this._hostname()+this._port()+this.opts.path+this._query(t)}_hostname(){let e=this.opts.hostname;return e.indexOf(`:`)===-1?e:`[`+e+`]`}_port(){return this.opts.port&&(this.opts.secure&&Number(this.opts.port)!==443||!this.opts.secure&&Number(this.opts.port)!==80)?`:`+this.opts.port:``}_query(e){let t=Un(e);return t.length?`?`+t:``}},qn=class extends Kn{constructor(){super(...arguments),this._polling=!1}get name(){return`polling`}doOpen(){this._poll()}pause(e){this.readyState=`pausing`;let t=()=>{this.readyState=`paused`,e()};if(this._polling||!this.writable){let e=0;this._polling&&(e++,this.once(`pollComplete`,function(){--e||t()})),this.writable||(e++,this.once(`drain`,function(){--e||t()}))}else t()}_poll(){this._polling=!0,this.doPoll(),this.emitReserved(`poll`)}onData(e){En(e,this.socket.binaryType).forEach(e=>{if(this.readyState===`opening`&&e.type===`open`&&this.onOpen(),e.type===`close`)return this.onClose({description:`transport closed by the server`}),!1;this.onPacket(e)}),this.readyState!==`closed`&&(this._polling=!1,this.emitReserved(`pollComplete`),this.readyState===`open`&&this._poll())}doClose(){let e=()=>{this.write([{type:`close`}])};this.readyState===`open`?e():this.once(`open`,e)}write(e){this.writable=!1,Tn(e,e=>{this.doWrite(e,()=>{this.writable=!0,this.emitReserved(`drain`)})})}uri(){let e=this.opts.secure?`https`:`http`,t=this.query||{};return!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=Hn()),!this.supportsBinary&&!t.sid&&(t.b64=1),this.createUri(e,t)}},Jn=!1;try{Jn=typeof XMLHttpRequest<`u`&&`withCredentials`in new XMLHttpRequest}catch{}var Yn=Jn;function Xn(){}var Zn=class extends qn{constructor(e){if(super(e),typeof location<`u`){let t=location.protocol===`https:`,n=location.port;n||=t?`443`:`80`,this.xd=typeof location<`u`&&e.hostname!==location.hostname||n!==e.port}}doWrite(e,t){let n=this.request({method:`POST`,data:e});n.on(`success`,t),n.on(`error`,(e,t)=>{this.onError(`xhr post error`,e,t)})}doPoll(){let e=this.request();e.on(`data`,this.onData.bind(this)),e.on(`error`,(e,t)=>{this.onError(`xhr poll error`,e,t)}),this.pollXhr=e}},Qn=class e extends M{constructor(e,t,n){super(),this.createRequest=e,Rn(this,n),this._opts=n,this._method=n.method||`GET`,this._uri=t,this._data=n.data===void 0?null:n.data,this._create()}_create(){var t;let n=Fn(this._opts,`agent`,`pfx`,`key`,`passphrase`,`cert`,`ca`,`ciphers`,`rejectUnauthorized`,`autoUnref`);n.xdomain=!!this._opts.xd;let r=this._xhr=this.createRequest(n);try{r.open(this._method,this._uri,!0);try{if(this._opts.extraHeaders){r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0);for(let e in this._opts.extraHeaders)this._opts.extraHeaders.hasOwnProperty(e)&&r.setRequestHeader(e,this._opts.extraHeaders[e])}}catch{}if(this._method===`POST`)try{r.setRequestHeader(`Content-type`,`text/plain;charset=UTF-8`)}catch{}try{r.setRequestHeader(`Accept`,`*/*`)}catch{}(t=this._opts.cookieJar)==null||t.addCookies(r),`withCredentials`in r&&(r.withCredentials=this._opts.withCredentials),this._opts.requestTimeout&&(r.timeout=this._opts.requestTimeout),r.onreadystatechange=()=>{var e;r.readyState===3&&((e=this._opts.cookieJar)==null||e.parseCookies(r.getResponseHeader(`set-cookie`))),r.readyState===4&&(r.status===200||r.status===1223?this._onLoad():this.setTimeoutFn(()=>{this._onError(typeof r.status==`number`?r.status:0)},0))},r.send(this._data)}catch(e){this.setTimeoutFn(()=>{this._onError(e)},0);return}typeof document<`u`&&(this._index=e.requestsCount++,e.requests[this._index]=this)}_onError(e){this.emitReserved(`error`,e,this._xhr),this._cleanup(!0)}_cleanup(t){if(this._xhr!==void 0&&this._xhr!==null){if(this._xhr.onreadystatechange=Xn,t)try{this._xhr.abort()}catch{}typeof document<`u`&&delete e.requests[this._index],this._xhr=null}}_onLoad(){let e=this._xhr.responseText;e!==null&&(this.emitReserved(`data`,e),this.emitReserved(`success`),this._cleanup())}abort(){this._cleanup()}};if(Qn.requestsCount=0,Qn.requests={},typeof document<`u`){if(typeof attachEvent==`function`)attachEvent(`onunload`,$n);else if(typeof addEventListener==`function`){let e=`onpagehide`in N?`pagehide`:`unload`;addEventListener(e,$n,!1)}}function $n(){for(let e in Qn.requests)Qn.requests.hasOwnProperty(e)&&Qn.requests[e].abort()}var er=(function(){let e=nr({xdomain:!1});return e&&e.responseType!==null})(),tr=class extends Zn{constructor(e){super(e);let t=e&&e.forceBase64;this.supportsBinary=er&&!t}request(e={}){return Object.assign(e,{xd:this.xd},this.opts),new Qn(nr,this.uri(),e)}};function nr(e){let t=e.xdomain;try{if(typeof XMLHttpRequest<`u`&&(!t||Yn))return new XMLHttpRequest}catch{}if(!t)try{return new N[[`Active`,`Object`].join(`X`)](`Microsoft.XMLHTTP`)}catch{}}var rr=typeof navigator<`u`&&typeof navigator.product==`string`&&navigator.product.toLowerCase()===`reactnative`,ir=class extends Kn{get name(){return`websocket`}doOpen(){let e=this.uri(),t=this.opts.protocols,n=rr?{}:Fn(this.opts,`agent`,`perMessageDeflate`,`pfx`,`key`,`passphrase`,`cert`,`ca`,`ciphers`,`rejectUnauthorized`,`localAddress`,`protocolVersion`,`origin`,`maxPayload`,`family`,`checkServerIdentity`);this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=this.createSocket(e,t,n)}catch(e){return this.emitReserved(`error`,e)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=e=>this.onClose({description:`websocket connection closed`,context:e}),this.ws.onmessage=e=>this.onData(e.data),this.ws.onerror=e=>this.onError(`websocket error`,e)}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;fn(n,this.supportsBinary,e=>{try{this.doWrite(n,e)}catch{}r&&Nn(()=>{this.writable=!0,this.emitReserved(`drain`)},this.setTimeoutFn)})}}doClose(){this.ws!==void 0&&(this.ws.onerror=()=>{},this.ws.close(),this.ws=null)}uri(){let e=this.opts.secure?`wss`:`ws`,t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=Hn()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}},ar=N.WebSocket||N.MozWebSocket,or={websocket:class extends ir{createSocket(e,t,n){return rr?new ar(e,t,n):t?new ar(e,t):new ar(e)}doWrite(e,t){this.ws.send(t)}},webtransport:class extends Kn{get name(){return`webtransport`}doOpen(){try{this._transport=new WebTransport(this.createUri(`https`),this.opts.transportOptions[this.name])}catch(e){return this.emitReserved(`error`,e)}this._transport.closed.then(()=>{this.onClose()}).catch(e=>{this.onError(`webtransport error`,e)}),this._transport.ready.then(()=>{this._transport.createBidirectionalStream().then(e=>{let t=jn(2**53-1,this.socket.binaryType),n=e.readable.pipeThrough(t).getReader(),r=Dn();r.readable.pipeTo(e.writable),this._writer=r.writable.getWriter();let i=()=>{n.read().then(({done:e,value:t})=>{e||(this.onPacket(t),i())}).catch(e=>{})};i();let a={type:`open`};this.query.sid&&(a.data=`{"sid":"${this.query.sid}"}`),this._writer.write(a).then(()=>this.onOpen())})})}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;this._writer.write(n).then(()=>{r&&Nn(()=>{this.writable=!0,this.emitReserved(`drain`)},this.setTimeoutFn)})}}doClose(){var e;(e=this._transport)==null||e.close()}},polling:tr},sr=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,cr=[`source`,`protocol`,`authority`,`userInfo`,`user`,`password`,`host`,`port`,`relative`,`path`,`directory`,`file`,`query`,`anchor`];function lr(e){if(e.length>8e3)throw`URI too long`;let t=e,n=e.indexOf(`[`),r=e.indexOf(`]`);n!=-1&&r!=-1&&(e=e.substring(0,n)+e.substring(n,r).replace(/:/g,`;`)+e.substring(r,e.length));let i=sr.exec(e||``),a={},o=14;for(;o--;)a[cr[o]]=i[o]||``;return n!=-1&&r!=-1&&(a.source=t,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,`:`),a.authority=a.authority.replace(`[`,``).replace(`]`,``).replace(/;/g,`:`),a.ipv6uri=!0),a.pathNames=ur(a,a.path),a.queryKey=dr(a,a.query),a}function ur(e,t){let n=t.replace(/\/{2,9}/g,`/`).split(`/`);return(t.slice(0,1)==`/`||t.length===0)&&n.splice(0,1),t.slice(-1)==`/`&&n.splice(n.length-1,1),n}function dr(e,t){let n={};return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,function(e,t,r){t&&(n[t]=r)}),n}var fr=typeof addEventListener==`function`&&typeof removeEventListener==`function`,pr=[];fr&&addEventListener(`offline`,()=>{pr.forEach(e=>e())},!1);var mr=class e extends M{constructor(e,t={}){if(super(),this.binaryType=Pn,this.writeBuffer=[],this._prevBufferLen=0,this._upgrades=[],this._pingInterval=-1,this._pingTimeout=-1,this._maxPayload=-1,this._pingTimeoutTime=1/0,e&&typeof e==`object`&&(t=e,e=null),e){let n=lr(e);t.hostname=n.host,t.secure=n.protocol===`https`||n.protocol===`wss`,t.port=n.port,n.query&&(t.query=n.query)}else t.host&&(t.hostname=lr(t.host).host);if(Rn(this,t),this.secure=t.secure==null?typeof location<`u`&&location.protocol===`https:`:t.secure,t.hostname&&!t.port&&(t.port=this.secure?`443`:`80`),this.hostname=t.hostname||(typeof location<`u`?location.hostname:`localhost`),this.port=t.port||(typeof location<`u`&&location.port?location.port:this.secure?`443`:`80`),t.transportImplementations&&t.transports)throw Error(`specifying both 'transportImplementations' and 'transports' options is not supported`);t.transportImplementations||t.transports?.length&&typeof t.transports[0]==`function`?(this.transports=[],this._transportsByName=Object.create(null),(t.transportImplementations??t.transports).forEach(e=>{let t=e.prototype.name;this.transports.push(t),this._transportsByName[t]=e})):(this.transports=t.transports?[...t.transports]:[`polling`,`websocket`,`webtransport`],this._transportsByName=or),this.opts=Object.assign({path:`/engine.io`,agent:!1,withCredentials:!1,upgrade:!0,timestampParam:`t`,rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},t),this.opts.path=this.opts.path.replace(/\/$/,``)+(this.opts.addTrailingSlash?`/`:``),typeof this.opts.query==`string`&&(this.opts.query=Wn(this.opts.query)),fr&&(this.opts.closeOnBeforeunload&&(this._beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener(`beforeunload`,this._beforeunloadEventListener,!1)),this.hostname!==`localhost`&&(this._offlineEventListener=()=>{this._onClose(`transport close`,{description:`network connection lost`})},pr.push(this._offlineEventListener))),this.opts.withCredentials&&(this._cookieJar=void 0),this._open()}createTransport(e){let t=Object.assign({},this.opts.query);t.EIO=4,t.transport=e,this.id&&(t.sid=this.id);let n=Object.assign({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new this._transportsByName[e](n)}_open(){if(this.transports.length===0){this.setTimeoutFn(()=>{this.emitReserved(`error`,`No transports available`)},0);return}let t=this.opts.rememberUpgrade&&e.priorWebsocketSuccess&&this.transports.indexOf(`websocket`)!==-1?`websocket`:this.transports[0];this.readyState=`opening`;let n=this.createTransport(t);n.open(),this.setTransport(n)}setTransport(e){this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on(`drain`,this._onDrain.bind(this)).on(`packet`,this._onPacket.bind(this)).on(`error`,this._onError.bind(this)).on(`close`,e=>this._onClose(`transport close`,e))}_probe(t){let n=this.createTransport(t),r=!1;e.priorWebsocketSuccess=!1;let i=()=>{r||(n.send([{type:`ping`,data:`probe`}]),n.once(`packet`,t=>{if(!r){if(t.type===`pong`&&t.data===`probe`){if(this.upgrading=!0,this.emitReserved(`upgrading`,n),!n)return;e.priorWebsocketSuccess=n.name===`websocket`,this.transport.pause(()=>{r||this.readyState!==`closed`&&(u(),this.setTransport(n),n.send([{type:`upgrade`}]),this.emitReserved(`upgrade`,n),n=null,this.upgrading=!1,this.flush())})}else{let e=Error(`probe error`);e.transport=n.name,this.emitReserved(`upgradeError`,e)}}}))};function a(){r||(r=!0,u(),n.close(),n=null)}let o=e=>{let t=Error(`probe error: `+e);t.transport=n.name,a(),this.emitReserved(`upgradeError`,t)};function s(){o(`transport closed`)}function c(){o(`socket closed`)}function l(e){n&&e.name!==n.name&&a()}let u=()=>{n.removeListener(`open`,i),n.removeListener(`error`,o),n.removeListener(`close`,s),this.off(`close`,c),this.off(`upgrading`,l)};n.once(`open`,i),n.once(`error`,o),n.once(`close`,s),this.once(`close`,c),this.once(`upgrading`,l),this._upgrades.indexOf(`webtransport`)!==-1&&t!==`webtransport`?this.setTimeoutFn(()=>{r||n.open()},200):n.open()}onOpen(){if(this.readyState=`open`,e.priorWebsocketSuccess=this.transport.name===`websocket`,this.emitReserved(`open`),this.flush(),this.readyState===`open`&&this.opts.upgrade)for(let e=0;e<this._upgrades.length;e++)this._probe(this._upgrades[e])}_onPacket(e){if(this.readyState===`opening`||this.readyState===`open`||this.readyState===`closing`)switch(this.emitReserved(`packet`,e),this.emitReserved(`heartbeat`),e.type){case`open`:this.onHandshake(JSON.parse(e.data));break;case`ping`:this._sendPacket(`pong`),this.emitReserved(`ping`),this.emitReserved(`pong`),this._resetPingTimeout();break;case`error`:let t=Error(`server error`);t.code=e.data,this._onError(t);break;case`message`:this.emitReserved(`data`,e.data),this.emitReserved(`message`,e.data)}}onHandshake(e){this.emitReserved(`handshake`,e),this.id=e.sid,this.transport.query.sid=e.sid,this._upgrades=this._filterUpgrades(e.upgrades),this._pingInterval=e.pingInterval,this._pingTimeout=e.pingTimeout,this._maxPayload=e.maxPayload,this.onOpen(),this.readyState!==`closed`&&this._resetPingTimeout()}_resetPingTimeout(){this.clearTimeoutFn(this._pingTimeoutTimer);let e=this._pingInterval+this._pingTimeout;this._pingTimeoutTime=Date.now()+e,this._pingTimeoutTimer=this.setTimeoutFn(()=>{this._onClose(`ping timeout`)},e),this.opts.autoUnref&&this._pingTimeoutTimer.unref()}_onDrain(){this.writeBuffer.splice(0,this._prevBufferLen),this._prevBufferLen=0,this.writeBuffer.length===0?this.emitReserved(`drain`):this.flush()}flush(){if(this.readyState!==`closed`&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){let e=this._getWritablePackets();this.transport.send(e),this._prevBufferLen=e.length,this.emitReserved(`flush`)}}_getWritablePackets(){if(!(this._maxPayload&&this.transport.name===`polling`&&this.writeBuffer.length>1))return this.writeBuffer;let e=1;for(let t=0;t<this.writeBuffer.length;t++){let n=this.writeBuffer[t].data;if(n&&(e+=Bn(n)),t>0&&e>this._maxPayload)return this.writeBuffer.slice(0,t);e+=2}return this.writeBuffer}_hasPingExpired(){if(!this._pingTimeoutTime)return!0;let e=Date.now()>this._pingTimeoutTime;return e&&(this._pingTimeoutTime=0,Nn(()=>{this._onClose(`ping timeout`)},this.setTimeoutFn)),e}write(e,t,n){return this._sendPacket(`message`,e,t,n),this}send(e,t,n){return this._sendPacket(`message`,e,t,n),this}_sendPacket(e,t,n,r){if(typeof t==`function`&&(r=t,t=void 0),typeof n==`function`&&(r=n,n=null),this.readyState===`closing`||this.readyState===`closed`)return;n||={},n.compress=!1!==n.compress;let i={type:e,data:t,options:n};this.emitReserved(`packetCreate`,i),this.writeBuffer.push(i),r&&this.once(`flush`,r),this.flush()}close(){let e=()=>{this._onClose(`forced close`),this.transport.close()},t=()=>{this.off(`upgrade`,t),this.off(`upgradeError`,t),e()},n=()=>{this.once(`upgrade`,t),this.once(`upgradeError`,t)};return(this.readyState===`opening`||this.readyState===`open`)&&(this.readyState=`closing`,this.writeBuffer.length?this.once(`drain`,()=>{this.upgrading?n():e()}):this.upgrading?n():e()),this}_onError(t){if(e.priorWebsocketSuccess=!1,this.opts.tryAllTransports&&this.transports.length>1&&this.readyState===`opening`)return this.transports.shift(),this._open();this.emitReserved(`error`,t),this._onClose(`transport error`,t)}_onClose(e,t){if(this.readyState===`opening`||this.readyState===`open`||this.readyState===`closing`){if(this.clearTimeoutFn(this._pingTimeoutTimer),this.transport.removeAllListeners(`close`),this.transport.close(),this.transport.removeAllListeners(),fr&&(this._beforeunloadEventListener&&removeEventListener(`beforeunload`,this._beforeunloadEventListener,!1),this._offlineEventListener)){let e=pr.indexOf(this._offlineEventListener);e!==-1&&pr.splice(e,1)}this.readyState=`closed`,this.id=null,this.emitReserved(`close`,e,t),this.writeBuffer=[],this._prevBufferLen=0}}_filterUpgrades(e){let t=[];for(let n=0;n<e.length;n++)~this.transports.indexOf(e[n])&&t.push(e[n]);return t}};mr.protocol=4,mr.protocol;function hr(e,t=``,n){let r=e;n||=typeof location<`u`&&location,e??=n.protocol+`//`+n.host,typeof e==`string`&&(e.charAt(0)===`/`&&(e=e.charAt(1)===`/`?n.protocol+e:n.host+e),/^(https?|wss?):\/\//.test(e)||(e=n===void 0?`https://`+e:n.protocol+`//`+e),r=lr(e)),r.port||(/^(http|ws)$/.test(r.protocol)?r.port=`80`:/^(http|ws)s$/.test(r.protocol)&&(r.port=`443`)),r.path=r.path||`/`;let i=r.host.indexOf(`:`)===-1?r.host:`[`+r.host+`]`;return r.id=r.protocol+`://`+i+`:`+r.port+t,r.href=r.protocol+`://`+i+(n&&n.port===r.port?``:`:`+r.port),r}var gr=typeof ArrayBuffer==`function`,_r=e=>typeof ArrayBuffer.isView==`function`?ArrayBuffer.isView(e):e.buffer instanceof ArrayBuffer,vr=Object.prototype.toString,yr=typeof Blob==`function`||typeof Blob<`u`&&vr.call(Blob)===`[object BlobConstructor]`,br=typeof File==`function`||typeof File<`u`&&vr.call(File)===`[object FileConstructor]`;function xr(e){return gr&&(e instanceof ArrayBuffer||_r(e))||yr&&e instanceof Blob||br&&e instanceof File}function Sr(e,t){if(!e||typeof e!=`object`)return!1;if(Array.isArray(e)){for(let t=0,n=e.length;t<n;t++)if(Sr(e[t]))return!0;return!1}if(xr(e))return!0;if(e.toJSON&&typeof e.toJSON==`function`&&arguments.length===1)return Sr(e.toJSON(),!0);for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t)&&Sr(e[t]))return!0;return!1}function Cr(e){let t=[],n=e.data,r=e;return r.data=wr(n,t),r.attachments=t.length,{packet:r,buffers:t}}function wr(e,t,n){if(!e)return e;if(xr(e)){let n={_placeholder:!0,num:t.length};return t.push(e),n}if(Array.isArray(e)){let n=Array(e.length);for(let r=0;r<e.length;r++)n[r]=wr(e[r],t);return n}if(typeof e==`object`&&!(e instanceof Date)){if(e.toJSON&&typeof e.toJSON==`function`&&!n)return wr(e.toJSON(),t,!0);let r={};for(let n in e)Object.prototype.hasOwnProperty.call(e,n)&&(r[n]=wr(e[n],t));return r}return e}function Tr(e,t){return e.data=Er(e.data,t),delete e.attachments,e}function Er(e,t){if(!e)return e;if(e&&e._placeholder===!0){if(typeof e.num==`number`&&e.num>=0&&e.num<t.length)return t[e.num];throw Error(`illegal attachments`)}if(Array.isArray(e))for(let n=0;n<e.length;n++)e[n]=Er(e[n],t);else if(typeof e==`object`)for(let n in e)Object.prototype.hasOwnProperty.call(e,n)&&(e[n]=Er(e[n],t));return e}var Dr=n({Decoder:()=>Ar,Encoder:()=>kr,PacketType:()=>P,isPacketValid:()=>Lr,protocol:()=>5}),Or=[`connect`,`connect_error`,`disconnect`,`disconnecting`,`newListener`,`removeListener`],P;(function(e){e[e.CONNECT=0]=`CONNECT`,e[e.DISCONNECT=1]=`DISCONNECT`,e[e.EVENT=2]=`EVENT`,e[e.ACK=3]=`ACK`,e[e.CONNECT_ERROR=4]=`CONNECT_ERROR`,e[e.BINARY_EVENT=5]=`BINARY_EVENT`,e[e.BINARY_ACK=6]=`BINARY_ACK`})(P||={});var kr=class{constructor(e){this.replacer=e}encode(e){return(e.type===P.EVENT||e.type===P.ACK)&&Sr(e)?this.encodeAsBinary({type:e.type===P.EVENT?P.BINARY_EVENT:P.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id}):[this.encodeAsString(e)]}encodeAsString(e){let t=``+e.type;return(e.type===P.BINARY_EVENT||e.type===P.BINARY_ACK)&&(t+=e.attachments+`-`),e.nsp&&e.nsp!==`/`&&(t+=e.nsp+`,`),e.id!=null&&(t+=e.id),e.data!=null&&(t+=JSON.stringify(e.data,this.replacer)),t}encodeAsBinary(e){let t=Cr(e),n=this.encodeAsString(t.packet),r=t.buffers;return r.unshift(n),r}},Ar=class e extends M{constructor(e){super(),this.opts=Object.assign({reviver:void 0,maxAttachments:10},typeof e==`function`?{reviver:e}:e)}add(e){let t;if(typeof e==`string`){if(this.reconstructor)throw Error(`got plaintext data when reconstructing a packet`);t=this.decodeString(e);let n=t.type===P.BINARY_EVENT;n||t.type===P.BINARY_ACK?(t.type=n?P.EVENT:P.ACK,this.reconstructor=new jr(t)):super.emitReserved(`decoded`,t)}else if(xr(e)||e.base64){if(this.reconstructor)t=this.reconstructor.takeBinaryData(e),t&&(this.reconstructor=null,super.emitReserved(`decoded`,t));else throw Error(`got binary data when not reconstructing a packet`)}else throw Error(`Unknown type: `+e)}decodeString(t){let n=0,r={type:Number(t.charAt(0))};if(P[r.type]===void 0)throw Error(`unknown packet type `+r.type);if(r.type===P.BINARY_EVENT||r.type===P.BINARY_ACK){let e=n+1;for(;t.charAt(++n)!==`-`&&n!=t.length;);let i=t.substring(e,n);if(i!=Number(i)||t.charAt(n)!==`-`)throw Error(`Illegal attachments`);let a=Number(i);if(!Nr(a)||a<1)throw Error(`Illegal attachments`);if(a>this.opts.maxAttachments)throw Error(`too many attachments`);r.attachments=a}if(t.charAt(n+1)===`/`){let e=n+1;for(;++n&&t.charAt(n)!==`,`&&n!==t.length;);r.nsp=t.substring(e,n)}else r.nsp=`/`;let i=t.charAt(n+1);if(i!==``&&Number(i)==i){let e=n+1;for(;++n;){let e=t.charAt(n);if(e==null||Number(e)!=e){--n;break}if(n===t.length)break}r.id=Number(t.substring(e,n+1))}if(t.charAt(++n)){let i=this.tryParse(t.substr(n));if(e.isPayloadValid(r.type,i))r.data=i;else throw Error(`invalid payload`)}return r}tryParse(e){try{return JSON.parse(e,this.opts.reviver)}catch{return!1}}static isPayloadValid(e,t){switch(e){case P.CONNECT:return Fr(t);case P.DISCONNECT:return t===void 0;case P.CONNECT_ERROR:return typeof t==`string`||Fr(t);case P.EVENT:case P.BINARY_EVENT:return Array.isArray(t)&&(typeof t[0]==`number`||typeof t[0]==`string`&&Or.indexOf(t[0])===-1);case P.ACK:case P.BINARY_ACK:return Array.isArray(t)}}destroy(){this.reconstructor&&=(this.reconstructor.finishedReconstruction(),null)}},jr=class{constructor(e){this.packet=e,this.buffers=[],this.reconPack=e}takeBinaryData(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){let e=Tr(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null}finishedReconstruction(){this.reconPack=null,this.buffers=[]}};function Mr(e){return typeof e==`string`}var Nr=Number.isInteger||function(e){return typeof e==`number`&&isFinite(e)&&Math.floor(e)===e};function Pr(e){return e===void 0||Nr(e)}function Fr(e){return Object.prototype.toString.call(e)===`[object Object]`}function Ir(e,t){switch(e){case P.CONNECT:return t===void 0||Fr(t);case P.DISCONNECT:return t===void 0;case P.EVENT:return Array.isArray(t)&&(typeof t[0]==`number`||typeof t[0]==`string`&&Or.indexOf(t[0])===-1);case P.ACK:return Array.isArray(t);case P.CONNECT_ERROR:return typeof t==`string`||Fr(t);default:return!1}}function Lr(e){return Mr(e.nsp)&&Pr(e.id)&&Ir(e.type,e.data)}function F(e,t,n){return e.on(t,n),function(){e.off(t,n)}}var Rr=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),zr=class extends M{constructor(e,t,n){super(),this.connected=!1,this.recovered=!1,this.receiveBuffer=[],this.sendBuffer=[],this._queue=[],this._queueSeq=0,this.ids=0,this.acks={},this.flags={},this.io=e,this.nsp=t,n&&n.auth&&(this.auth=n.auth),this._opts=Object.assign({},n),this.io._autoConnect&&this.open()}get disconnected(){return!this.connected}subEvents(){if(this.subs)return;let e=this.io;this.subs=[F(e,`open`,this.onopen.bind(this)),F(e,`packet`,this.onpacket.bind(this)),F(e,`error`,this.onerror.bind(this)),F(e,`close`,this.onclose.bind(this))]}get active(){return!!this.subs}connect(){return this.connected?this:(this.subEvents(),this.io._reconnecting||this.io.open(),this.io._readyState===`open`&&this.onopen(),this)}open(){return this.connect()}send(...e){return e.unshift(`message`),this.emit.apply(this,e),this}emit(e,...t){if(Rr.hasOwnProperty(e))throw Error(`"`+e.toString()+`" is a reserved event name`);if(t.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(t),this;let n={type:P.EVENT,data:t};if(n.options={},n.options.compress=this.flags.compress!==!1,typeof t[t.length-1]==`function`){let e=this.ids++,r=t.pop();this._registerAckCallback(e,r),n.id=e}let r=this.io.engine?.transport?.writable,i=this.connected&&!this.io.engine?._hasPingExpired();return this.flags.volatile&&!r||(i?(this.notifyOutgoingListeners(n),this.packet(n)):this.sendBuffer.push(n)),this.flags={},this}_registerAckCallback(e,t){let n=this.flags.timeout??this._opts.ackTimeout;if(n===void 0){this.acks[e]=t;return}let r=this.io.setTimeoutFn(()=>{delete this.acks[e];for(let t=0;t<this.sendBuffer.length;t++)this.sendBuffer[t].id===e&&this.sendBuffer.splice(t,1);t.call(this,Error(`operation has timed out`))},n),i=(...e)=>{this.io.clearTimeoutFn(r),t.apply(this,e)};i.withError=!0,this.acks[e]=i}emitWithAck(e,...t){return new Promise((n,r)=>{let i=(e,t)=>e?r(e):n(t);i.withError=!0,t.push(i),this.emit(e,...t)})}_addToQueue(e){let t;typeof e[e.length-1]==`function`&&(t=e.pop());let n={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:Object.assign({fromQueue:!0},this.flags)};e.push((e,...r)=>(this._queue[0],e===null?(this._queue.shift(),t&&t(null,...r)):n.tryCount>this._opts.retries&&(this._queue.shift(),t&&t(e)),n.pending=!1,this._drainQueue())),this._queue.push(n),this._drainQueue()}_drainQueue(e=!1){if(!this.connected||this._queue.length===0)return;let t=this._queue[0];(!t.pending||e)&&(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}packet(e){e.nsp=this.nsp,this.io._packet(e)}onopen(){typeof this.auth==`function`?this.auth(e=>{this._sendConnectPacket(e)}):this._sendConnectPacket(this.auth)}_sendConnectPacket(e){this.packet({type:P.CONNECT,data:this._pid?Object.assign({pid:this._pid,offset:this._lastOffset},e):e})}onerror(e){this.connected||this.emitReserved(`connect_error`,e)}onclose(e,t){this.connected=!1,delete this.id,this.emitReserved(`disconnect`,e,t),this._clearAcks()}_clearAcks(){Object.keys(this.acks).forEach(e=>{if(!this.sendBuffer.some(t=>String(t.id)===e)){let t=this.acks[e];delete this.acks[e],t.withError&&t.call(this,Error(`socket has been disconnected`))}})}onpacket(e){if(e.nsp===this.nsp)switch(e.type){case P.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved(`connect_error`,Error(`It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)`));break;case P.EVENT:case P.BINARY_EVENT:this.onevent(e);break;case P.ACK:case P.BINARY_ACK:this.onack(e);break;case P.DISCONNECT:this.ondisconnect();break;case P.CONNECT_ERROR:this.destroy();let t=Error(e.data.message);t.data=e.data.data,this.emitReserved(`connect_error`,t)}}onevent(e){let t=e.data||[];e.id!=null&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}emitEvent(e){if(this._anyListeners&&this._anyListeners.length){let t=this._anyListeners.slice();for(let n of t)n.apply(this,e)}super.emit.apply(this,e),this._pid&&e.length&&typeof e[e.length-1]==`string`&&(this._lastOffset=e[e.length-1])}ack(e){let t=this,n=!1;return function(...r){n||(n=!0,t.packet({type:P.ACK,id:e,data:r}))}}onack(e){let t=this.acks[e.id];typeof t==`function`&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}onconnect(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this._drainQueue(!0),this.emitReserved(`connect`)}emitBuffered(){this.receiveBuffer.forEach(e=>this.emitEvent(e)),this.receiveBuffer=[],this.sendBuffer.forEach(e=>{this.notifyOutgoingListeners(e),this.packet(e)}),this.sendBuffer=[]}ondisconnect(){this.destroy(),this.onclose(`io server disconnect`)}destroy(){this.subs&&=(this.subs.forEach(e=>e()),void 0),this.io._destroy(this)}disconnect(){return this.connected&&this.packet({type:P.DISCONNECT}),this.destroy(),this.connected&&this.onclose(`io client disconnect`),this}close(){return this.disconnect()}compress(e){return this.flags.compress=e,this}get volatile(){return this.flags.volatile=!0,this}timeout(e){return this.flags.timeout=e,this}onAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}prependAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}offAny(e){if(!this._anyListeners)return this;if(e){let t=this._anyListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyListeners=[];return this}listenersAny(){return this._anyListeners||[]}onAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}prependAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}offAnyOutgoing(e){if(!this._anyOutgoingListeners)return this;if(e){let t=this._anyOutgoingListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyOutgoingListeners=[];return this}listenersAnyOutgoing(){return this._anyOutgoingListeners||[]}notifyOutgoingListeners(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){let t=this._anyOutgoingListeners.slice();for(let n of t)n.apply(this,e.data)}}};function Br(e){e||={},this.ms=e.min||100,this.max=e.max||1e4,this.factor=e.factor||2,this.jitter=e.jitter>0&&e.jitter<=1?e.jitter:0,this.attempts=0}Br.prototype.duration=function(){var e=this.ms*this.factor**+this.attempts++;if(this.jitter){var t=Math.random(),n=Math.floor(t*this.jitter*e);e=Math.floor(t*10)&1?e+n:e-n}return Math.min(e,this.max)|0},Br.prototype.reset=function(){this.attempts=0},Br.prototype.setMin=function(e){this.ms=e},Br.prototype.setMax=function(e){this.max=e},Br.prototype.setJitter=function(e){this.jitter=e};var Vr=class extends M{constructor(e,t){super(),this.nsps={},this.subs=[],e&&typeof e==`object`&&(t=e,e=void 0),t||={},t.path=t.path||`/socket.io`,this.opts=t,Rn(this,t),this.reconnection(t.reconnection!==!1),this.reconnectionAttempts(t.reconnectionAttempts||1/0),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.randomizationFactor(t.randomizationFactor??.5),this.backoff=new Br({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(t.timeout==null?2e4:t.timeout),this._readyState=`closed`,this.uri=e;let n=t.parser||Dr;this.encoder=new n.Encoder,this.decoder=new n.Decoder,this._autoConnect=t.autoConnect!==!1,this._autoConnect&&this.open()}reconnection(e){return arguments.length?(this._reconnection=!!e,e||(this.skipReconnect=!0),this):this._reconnection}reconnectionAttempts(e){return e===void 0?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}reconnectionDelay(e){var t;return e===void 0?this._reconnectionDelay:(this._reconnectionDelay=e,(t=this.backoff)==null||t.setMin(e),this)}randomizationFactor(e){var t;return e===void 0?this._randomizationFactor:(this._randomizationFactor=e,(t=this.backoff)==null||t.setJitter(e),this)}reconnectionDelayMax(e){var t;return e===void 0?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,(t=this.backoff)==null||t.setMax(e),this)}timeout(e){return arguments.length?(this._timeout=e,this):this._timeout}maybeReconnectOnOpen(){!this._reconnecting&&this._reconnection&&this.backoff.attempts===0&&this.reconnect()}open(e){if(~this._readyState.indexOf(`open`))return this;this.engine=new mr(this.uri,this.opts);let t=this.engine,n=this;this._readyState=`opening`,this.skipReconnect=!1;let r=F(t,`open`,function(){n.onopen(),e&&e()}),i=t=>{this.cleanup(),this._readyState=`closed`,this.emitReserved(`error`,t),e?e(t):this.maybeReconnectOnOpen()},a=F(t,`error`,i);if(!1!==this._timeout){let e=this._timeout,n=this.setTimeoutFn(()=>{r(),i(Error(`timeout`)),t.close()},e);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}return this.subs.push(r),this.subs.push(a),this}connect(e){return this.open(e)}onopen(){this.cleanup(),this._readyState=`open`,this.emitReserved(`open`);let e=this.engine;this.subs.push(F(e,`ping`,this.onping.bind(this)),F(e,`data`,this.ondata.bind(this)),F(e,`error`,this.onerror.bind(this)),F(e,`close`,this.onclose.bind(this)),F(this.decoder,`decoded`,this.ondecoded.bind(this)))}onping(){this.emitReserved(`ping`)}ondata(e){try{this.decoder.add(e)}catch(e){this.onclose(`parse error`,e)}}ondecoded(e){Nn(()=>{this.emitReserved(`packet`,e)},this.setTimeoutFn)}onerror(e){this.emitReserved(`error`,e)}socket(e,t){let n=this.nsps[e];return n?this._autoConnect&&!n.active&&n.connect():(n=new zr(this,e,t),this.nsps[e]=n),n}_destroy(e){let t=Object.keys(this.nsps);for(let e of t)if(this.nsps[e].active)return;this._close()}_packet(e){let t=this.encoder.encode(e);for(let n=0;n<t.length;n++)this.engine.write(t[n],e.options)}cleanup(){this.subs.forEach(e=>e()),this.subs.length=0,this.decoder.destroy()}_close(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose(`forced close`)}disconnect(){return this._close()}onclose(e,t){var n;this.cleanup(),(n=this.engine)==null||n.close(),this.backoff.reset(),this._readyState=`closed`,this.emitReserved(`close`,e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}reconnect(){if(this._reconnecting||this.skipReconnect)return this;let e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved(`reconnect_failed`),this._reconnecting=!1;else{let t=this.backoff.duration();this._reconnecting=!0;let n=this.setTimeoutFn(()=>{e.skipReconnect||(this.emitReserved(`reconnect_attempt`,e.backoff.attempts),!e.skipReconnect&&e.open(t=>{t?(e._reconnecting=!1,e.reconnect(),this.emitReserved(`reconnect_error`,t)):e.onreconnect()}))},t);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}}onreconnect(){let e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved(`reconnect`,e)}},Hr={};function Ur(e,t){typeof e==`object`&&(t=e,e=void 0),t||={};let n=hr(e,t.path||`/socket.io`),r=n.source,i=n.id,a=n.path,o=Hr[i]&&a in Hr[i].nsps,s=t.forceNew||t[`force new connection`]||!1===t.multiplex||o,c;return s?c=new Vr(r,t):(Hr[i]||(Hr[i]=new Vr(r,t)),c=Hr[i]),n.query&&!t.query&&(t.query=n.queryKey),c.socket(n.path,t)}Object.assign(Ur,{Manager:Vr,Socket:zr,io:Ur,connect:Ur});var Wr=e=>{if(e.env!==`nodejs`)return!1;let t=globalThis.WebSocket;if(typeof t!=`function`)return!1;let n=t.prototype??{};return typeof n.on==`function`&&typeof n.removeListener==`function`},Gr=class{subject;subId=null;anchor=null;match=null;op=null;constructor(e,t,n,r={}){this.channel=e,this.subject=t,this.handler=n,this.onError=r.onError,this.timeout=r.timeout,this.pending=!1,this.off=this.off.bind(this)}async off(){await this.channel.remove(this)}deliver(e,t){try{let n=this.handler(t===void 0?{event:e}:{event:e,ctx:Object.freeze(t)});n instanceof Promise&&n.catch(Kr)}catch(e){Kr(e)}}apply(e){this.subId=e.subId,this.anchor=e.anchor??null,this.match=e.match??null,this.op=e.op??null}},Kr=e=>{console.error(`[puter.events] subscription handler failed`,e)},qr=`events.subscribe`,Jr=`events.unsubscribe`,Yr=`events.ack`,Xr=`events.delivery`,Zr=3e4,Qr=1e4,$r=e=>new k(e,`events_connection_failed`),ei=e=>{let t=e&&typeof e==`object`?e.error:void 0;return new k(typeof t?.message==`string`?t.message:`The events request failed`,typeof t?.code==`string`?t.code:`events_failed`)},ti=e=>{let t=e?.sub;if(!t||typeof t.subId!=`string`)throw new k(`The events server sent an unexpected answer`,`events_failed`);return t},ni=e=>{let t=e&&typeof e==`object`?e.data:void 0,n=e instanceof Error?e.message:`Could not connect to the events server`;return typeof t?.code==`string`?new k(n,t.code):$r(n)},ri=class{constructor(e){this.module=e,this.socket=null,this.subscriptions=new Set,this.byId=new Map,this.durable=new Map,this.waiters=new Set,this.inflight=0,this.generation=0,this.retryTimer=null}async subscribe(e,t,n){let r=new Gr(this,e,t,n);this.inflight++;try{let t=await this.request(qr,{subject:e},ii(r));return r.apply(ti(t)),this.subscriptions.add(r),this.byId.set(r.subId,r),r}finally{this.inflight--,this.closeIfIdle()}}async remove(e){if(!this.subscriptions.has(e))return;this.forget(e);let t=e.subId;e.subId=null;try{t!==null&&this.socket?.connected&&await this.request(Jr,{subId:t},ii(e))}catch{}finally{this.closeIfIdle()}}registerDurable(e,t,n){this.durable.set(e,{subId:e,handler:t,ctx:Object.freeze({...n??{}})}),this.connect()}deregisterDurable(e){this.durable.delete(e)&&this.closeIfIdle()}reset(){this.close(),(this.subscriptions.size>0||this.durable.size>0)&&this.connect()}connect(){if(this.socket)return this.socket;let e=Ur(this.module.APIOrigin,{auth:{auth_token:this.module.authToken},autoUnref:Wr(this.module.puter),transports:[`websocket`,`polling`],withCredentials:!0});return e.on(`connect`,()=>this.resubscribe()),e.on(`disconnect`,()=>{if(e.active){this.orphan();return}this.fail($r(`The events connection was closed by the server`))}),e.on(`connect_error`,t=>{e.active||this.fail(ni(t))}),e.on(Xr,e=>this.route(e)),this.socket=e,e}request(e,t,n){let r=this.connect();return new Promise((i,a)=>{let o=!1,s=e=>{o||(o=!0,clearTimeout(c),this.waiters.delete(s),a(e))},c=setTimeout(()=>s($r(`Timed out waiting for \`${e}\``)),n);c?.unref?.(),this.waiters.add(s),r.emit(e,t,e=>{if(!o){if(o=!0,clearTimeout(c),this.waiters.delete(s),!e||e.ok!==!0){a(ei(e));return}i(e)}})})}orphan(){this.generation++;for(let e of this.subscriptions)e.subId!==null&&this.byId.delete(e.subId),e.subId=null,e.pending=!1;this.rejectWaiters($r(`The events connection dropped`))}resubscribe(){let e=this.generation;for(let t of[...this.subscriptions])t.subId!==null||t.pending||(t.pending=!0,this.request(qr,{subject:t.subject},ii(t)).then(e=>{t.pending=!1;let n=ti(e);if(!this.subscriptions.has(t)){this.dropOnServer(n.subId,ii(t));return}t.apply(n),this.byId.set(t.subId,t)}).catch(n=>{if(t.pending=!1,!this.subscriptions.has(t)||this.generation!==e)return;let r=k.from(n);if(r.code===`too_many_requests`){this.retryResubscribe(e);return}this.lapse(t,r)}))}retryResubscribe(e){this.retryTimer||(this.retryTimer=setTimeout(()=>{this.retryTimer=null,this.generation===e&&this.socket?.connected&&this.resubscribe()},Qr),this.retryTimer?.unref?.())}route(e){if(!e||typeof e!=`object`||!e.event)return;let t=e.subId,n=this.byId.get(t);if(n){n.deliver(e.event,e.ctx);return}let r=this.durable.get(t);r&&this.runDurable(r,e)}runDurable(e,t){let n=t.event,{puter:r}=this.module,i={event:n,ctx:e.ctx,user:r,fetch:r?.net?.fetch??globalThis.fetch};if(!t.ackRequired||typeof t.ackId!=`string`){ai(()=>e.handler(i));return}let a=!1,o=()=>a?Promise.resolve():(a=!0,this.ack(e.subId,t.ackId,t.origin));ai(()=>e.handler({...i,ack:o}),()=>o())}async ack(e,t,n){try{await this.request(Yr,{subId:e,id:t,...n?{origin:n}:{}},Zr)}catch(e){console.warn(`[puter.events] could not acknowledge a delivery`,e)}}fail(e){this.rejectWaiters(e);for(let t of[...this.subscriptions])this.lapse(t,e);this.close()}lapse(e,t){if(this.forget(e),e.subId=null,!e.onError)console.warn(`[puter.events] subscription to ${e.subject} lapsed`,t);else try{e.onError(t)}catch(e){console.error(`[puter.events] onError handler failed`,e)}this.closeIfIdle()}forget(e){this.subscriptions.delete(e),e.subId!==null&&this.byId.delete(e.subId)}rejectWaiters(e){for(let t of[...this.waiters])t(e);this.waiters.clear()}dropOnServer(e,t){this.socket?.connected&&this.request(Jr,{subId:e},t).catch(()=>{})}closeIfIdle(){this.subscriptions.size>0||this.inflight>0||this.durable.size>0||this.close()}close(){this.retryTimer&&clearTimeout(this.retryTimer),this.retryTimer=null;let e=this.socket;e&&(this.socket=null,this.orphan(),e.removeAllListeners(),e.disconnect())}},ii=e=>typeof e.timeout==`number`&&e.timeout>0?e.timeout:Zr,ai=(e,t)=>{try{let n=e();if(n instanceof Promise){n.then(()=>t?.(),e=>console.error(`[puter.events] subscription handler failed`,e));return}t?.()}catch(e){console.error(`[puter.events] subscription handler failed`,e)}},oi=e=>new k(`The events request failed (HTTP ${e})`,`events_failed`);async function I(e,t,n,r){let i=new URLSearchParams;for(let[e,t]of Object.entries(r??{}))t!=null&&i.set(e,String(t));let a=i.toString(),o=await x(`${e.APIOrigin}${t}${a?`?${a}`:``}`,{method:n?`POST`:`GET`,includePuterAuth:!0,headers:{"Content-Type":`application/json`},...n?{body:JSON.stringify(n)}:{}}),s=o.headers.get(`content-type`)?.includes(`application/json`)?await o.json():null;if(o.status!==200){if(!s)throw oi(o.status);let{message:e,error:t,code:n,...r}=s;throw new k(typeof e==`string`?e:typeof t==`string`?t:`The events request failed (HTTP ${o.status})`,typeof n==`string`?n:`events_failed`,r)}return s??{}}var si=/\s/,ci=/[A-Za-z_$\u00A0-\uFFFF]/,li=/[A-Za-z0-9_$\u00A0-\uFFFF]/,ui=/[0-9]/,di=/^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:[0-9][0-9_]*)?\.?[0-9][0-9_]*(?:[eE][+-]?[0-9]+)?|[0-9][0-9_]*\.)n?/,fi=`>>>=,...,===,!==,**=,<<=,>>=,>>>,&&=,||=,??=,=>,==,!=,<=,>=,&&,||,??,?.,++,--,+=,-=,*=,/=,%=,&=,|=,^=,**,<<,>>`.split(`,`),pi=new Set([`return`,`typeof`,`instanceof`,`in`,`of`,`new`,`delete`,`void`,`case`,`do`,`else`,`yield`,`await`,`throw`]),mi=new Set([`)`,`]`,`++`,`--`]),hi=e=>{let t=[],n=[],r=!1,i=0,a=(e,n)=>t.push({type:e,value:n}),o=()=>t[t.length-1],s=()=>{let e=o();return e?e.type===`num`?!1:e.type===`name`?pi.has(e.value):!mi.has(e.value):!0},c=t=>{for(i++;i<e.length;){if(e[i]===`\\`){i+=2;continue}if(e[i]===t){i++;return}i++}},l=()=>{i++;let t=!1;for(;i<e.length;){let n=e[i];if(n===`\\`){i+=2;continue}if(n===`
`)return;if(n===`[`)t=!0;else if(n===`]`)t=!1;else if(n===`/`&&!t){for(i++;i<e.length&&li.test(e[i]);)i++;return}i++}};for(;i<e.length;){let t=e[i];if(r){if(t===`\\`){i+=2;continue}if(t==="`"){r=!1,i++;continue}if(t===`$`&&e[i+1]===`{`){n.push(`template`),r=!1,i+=2;continue}i++;continue}if(si.test(t)){i++;continue}if(t===`/`&&e[i+1]===`/`){for(;i<e.length&&e[i]!==`
`;)i++;continue}if(t===`/`&&e[i+1]===`*`){let t=e.indexOf(`*/`,i+2);i=t===-1?e.length:t+2;continue}if(t===`/`&&s()){l();continue}if(t===`"`||t===`'`){c(t);continue}if(t==="`"){r=!0,i++;continue}if(t===`{`){n.push(`brace`),a(`punct`,`{`),i++;continue}if(t===`}`){if(n.pop()===`template`){r=!0,i++;continue}a(`punct`,`}`),i++;continue}if(ui.test(t)||t===`.`&&ui.test(e[i+1]??``)){let n=di.exec(e.slice(i)),r=n?n[0]:t;a(`num`,r),i+=r.length;continue}if(ci.test(t)){let t=i+1;for(;t<e.length&&li.test(e[t]);)t++;a(`name`,e.slice(i,t)),i=t;continue}let o=fi.find(t=>e.startsWith(t,i));if(o){a(`punct`,o),i+=o.length;continue}a(`punct`,t),i++}return t},gi=new Set(`await.break.case.catch.class.const.continue.debugger.default.delete.do.else.enum.export.extends.false.finally.for.function.if.import.in.instanceof.let.new.null.return.super.switch.this.throw.true.try.typeof.var.void.while.with.yield.async.as.from.get.set.of.static.accessor`.split(`.`)),_i=new Set([`var`,`let`,`const`]),vi=new Set(`globalThis.undefined.NaN.Infinity.arguments.Object.Array.String.Number.Boolean.Symbol.BigInt.Math.JSON.Date.RegExp.Function.Promise.Proxy.Reflect.Map.Set.WeakMap.WeakSet.WeakRef.FinalizationRegistry.Error.TypeError.RangeError.SyntaxError.ReferenceError.EvalError.URIError.AggregateError.Intl.ArrayBuffer.SharedArrayBuffer.DataView.Int8Array.Uint8Array.Uint8ClampedArray.Int16Array.Uint16Array.Int32Array.Uint32Array.Float32Array.Float64Array.BigInt64Array.BigUint64Array.parseInt.parseFloat.isNaN.isFinite.encodeURI.encodeURIComponent.decodeURI.decodeURIComponent.structuredClone.queueMicrotask.atob.btoa.console.fetch.Request.Response.Headers.FormData.Blob.File.URL.URLSearchParams.AbortController.AbortSignal.TextEncoder.TextDecoder.ReadableStream.WritableStream.TransformStream.CompressionStream.DecompressionStream.crypto.Crypto.SubtleCrypto.performance.WebSocket.Event.EventTarget.CustomEvent.MessageChannel.MessagePort.setTimeout.clearTimeout.setInterval.clearInterval`.split(`.`)),yi=new Set([`puter`,`me`,`my`,`myself`]),bi=e=>new k(yi.has(e)?`Handler refers to \`${e}\`, and a handler has no ambient SDK: it runs as whoever the delivery belongs to. Use the \`user\` binding.`:`Handler refers to \`${e}\`, which is not a parameter, a local, or a known global. A handler is serialized and run elsewhere, so it cannot close over anything — pass the value in \`context\` and read it from \`ctx\`.`,`events_handler_free_variable`),L=e=>e?.type===`name`,R=(e,t)=>e?.type===`punct`&&e.value===t,xi={"(":`)`,"[":`]`,"{":`}`},Si=new Set([`)`,`]`,`}`]),Ci=(e,t)=>{let n=[];for(let r=t;r<e.length;r++){let t=e[r];if(t.type===`punct`){if(xi[t.value]){n.push(xi[t.value]);continue}if(Si.has(t.value)){if(n.pop()!==t.value)return-1;if(n.length===0)return r}}}return-1},wi=(e,t,n,r)=>{let i=0,a=!1,o=-1;for(let s=t;s<n;s++){let t=e[s];if(t.type===`punct`){xi[t.value]?i++:Si.has(t.value)?i--:t.value===`=`&&!a?(a=!0,o=i):t.value===`,`&&a&&i===o&&(a=!1);continue}a||!L(t)||gi.has(t.value)||R(e[s-1],`.`)||r.add(t.value)}},Ti=(e,t)=>{let n=0,r=t;for(;r<e.length;r++){let t=e[r];if(t.type===`punct`){if(xi[t.value]){n++;continue}if(Si.has(t.value)){if(n===0)return r;n--;continue}if(n===0&&(t.value===`=`||t.value===`,`||t.value===`;`))return r;continue}if(L(t)&&n===0&&(t.value===`of`||t.value===`in`))return r}return r},Ei=(e,t,n)=>{let r=t;for(;;){let t=Ti(e,r);if(wi(e,r,t,n),r=t,r>=e.length)return r;let i=e[r];if(L(i)||Si.has(i.value)||i.value===`;`)return r;if(i.value===`,`){r++;continue}r++;let a=r,o=0;for(;r<e.length;r++){let t=e[r];if(t.type===`punct`){if(xi[t.value]){o++;continue}if(Si.has(t.value)){if(o===0)break;o--;continue}if(o===0&&(t.value===`,`||t.value===`;`))break}}if(Di(e,a,r,n),r>=e.length||e[r].value!==`,`)return r;r++}},Di=(e,t,n,r)=>{for(let i=t;i<n;i++){let n=e[i];if(R(n,`=>`)){let n=e[i-1];if(R(n,`)`)){let n=0;for(let a=i-1;a>=t;a--){let t=e[a];if(t.type===`punct`){if(Si.has(t.value))n++;else if(xi[t.value]&&(n--,n===0)){wi(e,a+1,i-1,r);break}}}}else L(n)&&!gi.has(n.value)&&r.add(n.value);continue}if(L(n)){if(_i.has(n.value)){i=Ei(e,i+1,r)-1;continue}if(n.value===`function`||n.value===`class`){let t=e[i+1],n=R(t,`*`)?i+2:i+1;L(e[n])&&!gi.has(e[n].value)&&r.add(e[n].value);continue}if(n.value===`catch`&&R(e[i+1],`(`)){let t=Ci(e,i+1);t!==-1&&wi(e,i+2,t,r);continue}if(!gi.has(n.value)&&R(e[i+1],`(`)){let t=Ci(e,i+1);t!==-1&&R(e[t+1],`{`)&&(r.add(n.value),wi(e,i+2,t,r));continue}}}},Oi=e=>{let t=new Set;Di(e,0,e.length,t);for(let n=0;n<e.length;n++){if(!L(e[n])||e[n].value!==`function`)continue;let r=n+1;for(;r<e.length&&!R(e[r],`(`)&&!R(e[r],`{`);)r++;if(!R(e[r],`(`))continue;let i=Ci(e,r);i!==-1&&wi(e,r+1,i,t)}return t},ki=e=>{let t=new Set,n=[];for(let r=0;r<e.length;r++){let i=e[r];if(!L(i)||gi.has(i.value))continue;let a=e[r-1],o=e[r+1];if(!(R(a,`.`)||R(a,`?.`)||R(a,`#`))&&(!L(a)||a.value!==`break`&&a.value!==`continue`)&&!R(o,`:`)){if(R(o,`(`)){let t=Ci(e,r+1);if(t!==-1&&R(e[t+1],`{`))continue}t.has(i.value)||(t.add(i.value),n.push(i.value))}}return n},Ai=e=>{let t=hi(e),n=Oi(t),r=ki(t);for(let e of r)if(!(n.has(e)||vi.has(e)))throw bi(e);return{bound:n,references:r}},ji=4096,Mi=e=>new k(e,`events_handler_invalid`),Ni=()=>new k(`Subscription context may not exceed ${ji} bytes`,`events_context_too_large`),Pi=()=>new k("This environment provides no `crypto.subtle`, so an inline handler cannot be hashed. Publish it with `puter.events.handlers.publish()` and subscribe with `handlerName` instead.",`events_handler_hash_unavailable`),Fi=new TextEncoder,Ii=e=>Fi.encode(e).length,Li=async e=>{let t=globalThis.crypto?.subtle;if(!t)throw Pi();let n=await t.digest(`SHA-256`,Fi.encode(e));return[...new Uint8Array(n)].map(e=>e.toString(16).padStart(2,`0`)).join(``)},Ri=/^(async\s+)?(\*\s*)?([A-Za-z_$][\w$]*|\[[^\]]*\])\s*\(/,zi=/^(async\s+)?(function\b|class\b|\()/,Bi=e=>{let t=e.trim();if(zi.test(t)||!Ri.test(t))return e;let n=/^async\s+/.test(t),r=t.replace(/^async\s+/,``);return/^(get|set)\s+[A-Za-z_$[]/.test(r)||r.startsWith(`[`)?e:`${n?`async `:``}function ${r}`},Vi=e=>{if(typeof e==`function`)return Bi(Function.prototype.toString.call(e));if(typeof e==`string`){if(e.trim().length===0)throw Mi(`A handler source string may not be empty`);return e}if(e&&typeof e==`object`&&`file`in e)return null;throw Mi("A handler must be a function, a source string, or `{ file: <path> }`")},Hi=async(e,t)=>{let n=Vi(t);if(n!==null)return n;let r=t.file;if(typeof r!=`string`||r.trim().length===0)throw Mi("`file` must be a non-empty path");let i=await e.fs.read(r),a=typeof i==`string`?i:await i.text();if(a.trim().length===0)throw Mi(`\`${r}\` is empty`);return a},Ui=async(e,t)=>{let n=await Hi(e,t);return Ai(n),{source:n,hash:await Li(n)}},Wi=e=>{if(e==null)return;let t;try{t=JSON.stringify(e)}catch{throw new k(`context must be JSON-serializable`,`events_context_invalid`)}if(t===void 0)throw new k(`context must be JSON-serializable`,`events_context_invalid`);if(Ii(t)>4096)throw Ni();return t},Gi=(e,t)=>`${e??``}|${t}`,Ki=()=>new k(`A handler name must be a non-empty string`,`events_handler_name_invalid`),qi=class{constructor(e){this.module=e,this.known=new Map;for(let e of[`publish`,`publishAll`,`list`,`remove`])this[e]=this[e].bind(this)}async publish(e,t,n={}){let[r]=await this.#e([{name:e,handler:t,replace:n.replace}],n.appUid,`/events/handlers/publish`);return r}async publishAll(e,t={}){if(!Array.isArray(e)||e.length===0)throw new k("`handlers` must be a non-empty array",`invalid_request`);return this.#e(e,t.appUid,`/events/handlers/publishAll`)}async list(e={}){let t=(await I(this.module.puter,`/events/handlers/list`,void 0,e.appUid?{appUid:e.appUid}:void 0)).handlers??[];for(let n of t)this.known.set(Gi(e.appUid,n.name),n.hash);return t}async remove(e,t={}){if(typeof e!=`string`||e.trim().length===0)throw Ki();let n=await I(this.module.puter,`/events/handlers/remove`,{name:e,...t.appUid?{appUid:t.appUid}:{}});return this.known.delete(Gi(t.appUid,e)),n}forget(e){for(let t of[...this.known.keys()])(t.startsWith(`${e}|`)||t.startsWith(`|`))&&this.known.delete(t)}async#e(e,t,n){let r=[];for(let n of e){let e=n?.name;if(typeof e!=`string`||e.trim().length===0)throw Ki();let{source:i}=await Ui(this.module.puter,n.handler),a=this.known.get(Gi(t,e));r.push({name:e,source:i,...n.replace===!0?{replace:!0}:{},...a&&n.replace!==!0?{ifHash:a}:{}})}let i={...t?{appUid:t}:{},...r.length===1&&n.endsWith(`/publish`)?r[0]:{handlers:r}},a=await I(this.module.puter,n,i),o=Array.isArray(a.handlers)?a.handlers:[a];for(let e of o)this.known.set(Gi(t,e.name),e.hash);return o}},Ji=()=>new k("`appUid` must be a non-empty string",`invalid_request`),Yi=class{constructor(e){this.module=e;for(let e of[`list`,`destroy`])this[e]=this[e].bind(this)}async list(e={}){let t=await I(this.module.puter,`/events/workers`,void 0,{...e.limit===void 0?{}:{limit:e.limit},...e.cursor===void 0?{}:{cursor:e.cursor}});return{items:Array.isArray(t.items)?t.items:[],...typeof t.cursor==`string`?{cursor:t.cursor}:{},deployable:t.deployable===!0}}async destroy(e){if(typeof e!=`string`||e.trim().length===0)throw Ji();let t=await I(this.module.puter,`/events/workers/destroy`,{appUid:e});return this.module.handlers?.forget(e),t}};async function Xi(e){let t=e??{},n=t.subject;if(typeof n!=`string`||n.trim().length===0)throw new k("`subject` is required",`invalid_subject`);if(t.limit!==void 0&&typeof t.limit!=`number`)throw new k("`limit` must be a number",`invalid_request`);if(t.after!==void 0&&typeof t.after!=`string`)throw new k("`after` must be a string",`invalid_request`);let r=await I(this.puter,`/events/fetch`,void 0,{subject:n,...t.after===void 0?{}:{after:t.after},...t.limit===void 0?{}:{limit:t.limit}});return{items:r.items??[],...typeof r.cursor==`string`?{cursor:r.cursor}:{}}}function Zi(...e){let{puter:t}=this,n=typeof e[0]==`object`&&e[0]!==null?e[0]:{},{limit:r,cursor:i,includeTotal:a,stream:o}=n,s=Object.prototype.hasOwnProperty.call(n,`cursor`),c=e=>I(t,`/events/subscriptions`,void 0,{...r===void 0?{}:{limit:r},...e.cursor?{cursor:e.cursor}:{},...e.includeTotal?{includeTotal:!0}:{}});if(o===!0)return A(c,{cursor:i,includeTotal:a===!0});if(s||a!==void 0){if(a!==void 0&&typeof a!=`boolean`)throw new k("`includeTotal` must be a boolean",`invalid_request`);return c({cursor:i??null,includeTotal:a===!0})}return Gt(c)}var Qi=e=>{if(typeof e!=`string`||e.trim().length===0)throw new k(`Subject must be a non-empty string`,`invalid_subject`)},$i=e=>{if(typeof e!=`function`)throw new k(`Handler must be a function`,`invalid_handler`)};async function ea(e,t,n={}){return Qi(e),$i(t),await this.channel.subscribe(e,t,n)}async function ta(e={}){let{puter:t}=this;Qi(e?.subject);let{handler:n,handlerName:r}=e;if(n!=null&&!r)throw new k("An inline `handler` needs a `handlerName` to publish it under",`events_handler_name_required`);if(e.delivery===`single`&&!r)throw new k("A `single` subscription needs a `handlerName`",`events_handler_required`);let i=n==null?null:await Ui(t,n),a={subject:e.subject,...e.delivery?{delivery:e.delivery}:{},...e.targets?{targets:e.targets}:{},...r?{handlerName:r}:{},...i?{handlerHash:i.hash}:{},...e.expiresAt!==void 0&&e.expiresAt!==null?{expiresAt:e.expiresAt}:{}};Wi(e.context)!==void 0&&(a.context=e.context);let o=await I(t,`/events/subscribe`,a);return typeof n==`function`&&typeof o?.subId==`string`&&this.channel.registerDurable(o.subId,n,e.context),o.off=async()=>this.unsubscribe(o.subId),o}async function na(e){if(typeof e!=`string`||e.trim().length===0)throw new k(`No such subscription`,`subscription_does_not_exist`);this.channel.deregisterDurable(e),await I(this.puter,`/events/unsubscribe`,{subId:e})}var ra=class extends D{onLocal=ea;onPersistent=ta;unsubscribe=na;list=Zi;fetch=Xi;constructor(e){super(e),this.channel=new ri(this),this.handlers=new qi(this),this.workers=new Yi(this);let t=this;for(let e of[`onLocal`,`onPersistent`,`unsubscribe`,`list`,`fetch`])t[e]=t[e].bind(this);e.onAuthStateChanged(()=>this.channel.reset())}},z=class{readURL;writeURL;metadataURL;name;uid;id;uuid;path;size;accessed;modified;created;isDir;isDirectory;constructor(e){this.readURL=e.readURL??e.read_url,this.writeURL=e.writeURL??e.write_url,this.metadataURL=e.metadataURL??e.metadata_url,this.name=e.name??e.fsentry_name,this.uid=e.uid??e.uuid??e.fsentry_uid??e.fsentry_id??e.fsentry_uuid??e.id,this.id=this.uid,this.uuid=this.uid,this.path=e.path??e.fsentry_path,this.size=e.size??e.fsentry_size,this.accessed=e.accessed??e.fsentry_accessed,this.modified=e.modified??e.fsentry_modified,this.created=e.created??e.fsentry_created,this.isDirectory=!!(e.isDirectory||e.isDir||e.is_dir||e.fsentry_is_dir),this.isDir=this.isDirectory;let t={};Object.defineProperty(this,"_internalProperties",{enumerable:!1,value:t});let n=(()=>{let e=this.writeURL??this.readURL;if(typeof e!=`string`||e===``)return null;try{return new URL(e).searchParams}catch{return null}})();t.signature=e.signature??n?.get(`signature`)??null,t.expires=e.expires??n?.get(`expires`)??null,Object.defineProperty(t,"file_signature",{get:()=>({read_url:this.readURL,write_url:this.writeURL,metadata_url:this.metadataURL,fsentry_accessed:this.accessed,fsentry_modified:this.modified,fsentry_created:this.created,fsentry_is_dir:this.isDirectory,fsentry_size:this.size,fsentry_name:this.name,path:this.path,uid:this.uid})})}write=async function(e){return puter.fs.write(this.path,e,{overwrite:!0,dedupeName:!1})};watch=function(e){};open=function(e){};setAsWallpaper=function(e,t){};rename=function(e){return puter.fs.rename(this.uid===void 0?{path:this.path,newName:e}:{uid:this.uid,newName:e})};move=function(e,t=!1,n){return puter.fs.move(this.path,e,{overwrite:t,newName:n})};copy=function(e,t,n=!1){return puter.fs.copy(this.path,e,{dedupeName:t,overwrite:n})};delete=function(){return puter.fs.delete(this.path)};versions=async function(){};trash=function(){};mkdir=async function(e,t=!1){if(!this.isDirectory)throw Error(`mkdir() can only be called on a directory`);return puter.fs.mkdir(S.default.join(this.path,e),{dedupeName:t})};metadata=async function(){};readdir=async function(){if(!this.isDirectory)throw Error(`readdir() can only be called on a directory`);return puter.fs.readdir(this.path)};read=async function(){return puter.fs.read(this.path)}},ia=e=>{if(!e||typeof e!=`object`)return!1;let t=e;return t.code===`storage_limit_reached`||t.code===`NOT_ENOUGH_SPACE`||t.status===413},aa=e=>{ia(e)&&(puter.env===`app`?puter.ui.requestUpgrade():u(`Not enough storage space available.<br>Please upgrade to continue.`))},oa=`Authentication failed.`,sa=e=>typeof e==`object`&&!!e&&!Array.isArray(e)&&!(typeof File<`u`&&e instanceof File)&&!(typeof Blob<`u`&&e instanceof Blob),B=(e,...t)=>{for(let n of t)if(e[n]!==void 0)return e[n]},ca=(e,t=[])=>{if(sa(e[0]))return{...e[0]};let n={};t.forEach((t,r)=>{e[r]!==void 0&&(n[t]=e[r])});let r=e.slice(t.length);return r[0]===void 0&&(r=r.slice(1)),sa(r[0])&&(Object.assign(n,r[0]),r=r.slice(1)),typeof r[0]==`function`&&(n.success=r[0]),typeof r[1]==`function`&&(n.error=r[1]),n},la=async()=>{if(!(puter.authToken||puter.env!==`web`))try{await puter.ui.authenticateWithPuter()}catch{throw oa}};async function ua(e){let{endpoint:t,body:n,method:r=`post`,contentType:i,responseType:a,authHeader:o=!0,prepareXhr:s,transform:c,success:l,error:u}=e;return await la(),new Promise((e,d)=>{let f=Qe(t,this.APIOrigin,o?this.authToken:void 0,r,i,a);s?.(f),w(f,void 0,u,async t=>{try{let n=c?await c.call(this,t):t;typeof l==`function`&&l(n),e(n)}catch(e){typeof u==`function`&&u(e),d(e)}},e=>{aa(e),d(e)}),f.send(n===void 0?void 0:JSON.stringify(n))})}var V=({positional:e=[],request:t})=>async function(...n){let r=ca(n,e),i=await t.call(this,r);return await ua.call(this,{success:r.success,error:r.error,...i})},da=V({positional:[`source`,`destination`],request(e){return{endpoint:`/copy`,body:{original_client_socket_id:this.socket?.id,socket_id:this.socket?.id,source:O(e.source),destination:O(e.destination),overwrite:e.overwrite,new_name:B(e,`newName`,`new_name`),dedupe_name:B(e,`dedupeName`,`dedupe_name`)}}}}),fa=V({positional:[`paths`],request(e){return{endpoint:`/delete`,body:{paths:(Array.isArray(e.paths)?e.paths:[e.paths]).map(e=>O(e)),descendants_only:B(e,`descendantsOnly`,`descendants_only`)??!1,recursive:e.recursive??!0}}}}),pa=e=>(Array.isArray(e)?e:[e]).filter(e=>e!=null).map(e=>{if(typeof e==`string`){let t=e.trim();return t.includes(`@`)?{email:t}:{username:t}}let t=e;return{...t.email?{email:String(t.email)}:{},...t.username?{username:String(t.username)}:{},...t.team?{team:String(t.team)}:{},...t.teamHandle?{teamHandle:String(t.teamHandle)}:{}}}),ma=(e,t=O)=>{if(e.uid!==void 0)return(Array.isArray(e.uid)?e.uid:[e.uid]).map(e=>({uid:String(e)}));let n=e.paths===void 0?e.path:e.paths;return(Array.isArray(n)?n:[n]).filter(e=>e!=null).map(e=>({path:t(String(e))}))},ha=e=>({uid:e.uid,mode:e.mode,path:e.path,entryUid:e.uid_entry??e.entryUid,isDir:!!(e.is_dir??e.isDir),name:e.name??null,type:e.type??null,thumbnail:e.thumbnail??null,owner:e.owner??null,issuer:e.issuer??null,holder:e.holder??null,...e.holder_team||e.holderTeam?{holderTeam:e.holder_team??e.holderTeam}:{},inheritedFrom:e.inherited_from??null,issuedByApp:e.issued_by_app??null,...e.status===`pending`||e.pending===!0?{pending:!0,recipientEmail:e.recipient_email??e.recipientEmail??e.recipient??null}:{},modified:e.modified??0,size:e.size??null,...e.is_new===void 0?{}:{isNew:!!e.is_new}}),ga=e=>{if(puter?._cache)for(let t of e){if(!t.path){puter._cache.flushall();return}puter._cache.del(`item:${t.path}`),puter._cache.del(`readdir:${S.default.dirname(t.path)}`)}},_a=20971520,va=async function(...e){let t=ca(e,[`path`]);t.consistency||=`strong`;let n;if(t.path&&(n=`item:${t.path}`),t.consistency===`eventual`&&!t.returnSubdomains&&!t.returnPermissions&&!t.returnVersions&&!t.returnSize&&!t.returnShares){let e=await puter._cache.get(n);if(e)return e}return await xe(`fs:stat:`+JSON.stringify({path:t.path,uid:t.uid,returnSubdomains:t.returnSubdomains||t.returnWorkers,returnPermissions:t.returnPermissions,returnVersions:t.returnVersions,returnSize:t.returnSize,returnShares:t.returnShares,consistency:t.consistency}),()=>{let e={};return t.uid===void 0?t.path!==void 0&&(e.path=O(t.path)):e.uid=t.uid,e.return_subdomains=t.returnSubdomains||t.returnWorkers,e.return_permissions=t.returnPermissions,e.return_versions=t.returnVersions,e.return_size=t.returnSize,e.return_shares=t.returnShares,e.auth_token=this.authToken,ua.call(this,{endpoint:`/stat`,authHeader:!1,body:e,success:t.success,error:t.error,transform:e=>(Array.isArray(e?.shares)&&(e.shares=e.shares.map(ha)),!t.returnShares&&JSON.stringify(e).length<=_a&&puter._cache.set(n,e),e)})})},ya=V({positional:[`path`,`expiresIn`],async request(e){let{uid:t,is_dir:n}=await va.call(this,e.path);if(n)throw`Cannot create readUrl for directory`;return{endpoint:`/auth/create-access-token`,body:{expiresIn:e.expiresIn??`24h`,permissions:[`fs:${t}:read`]},transform:({token:e})=>`${this.APIOrigin}/token-read?uid=${encodeURIComponent(t)}&token=${encodeURIComponent(e)}`}}}),ba=V({positional:[`path`],request(e){let t=new URLSearchParams;return e.uid===void 0?t.set(`path`,O(String(e.path))):t.set(`uid`,String(e.uid)),{endpoint:`/share/shares?${t.toString()}`,method:`get`,transform:e=>(e.items??[]).map(ha)}}}),xa=V({request(e){let t=new URLSearchParams;e.limit!==void 0&&t.set(`limit`,String(e.limit)),e.cursor!==void 0&&t.set(`cursor`,String(e.cursor)),B(e,`includeTotal`,`include_total`)&&t.set(`includeTotal`,`true`);let n=t.toString();return{endpoint:`/share/shared-with-me${n?`?${n}`:``}`,method:`get`,transform:e=>({items:(e.items??[]).map(ha),...e.cursor===void 0?{}:{cursor:e.cursor},...e.total===void 0?{}:{total:e.total}})}}}),Sa=V({request(e){let t=new URLSearchParams;e.limit!==void 0&&t.set(`limit`,String(e.limit)),e.cursor!==void 0&&t.set(`cursor`,String(e.cursor)),e.appUid!==void 0&&t.set(`appUid`,String(e.appUid)),B(e,`includeTotal`,`include_total`)&&t.set(`includeTotal`,`true`);let n=t.toString();return{endpoint:`/share/shared-by-me${n?`?${n}`:``}`,method:`get`,transform:e=>({items:(e.items??[]).map(ha),...e.cursor===void 0?{}:{cursor:e.cursor},...e.total===void 0?{}:{total:e.total}})}}}),Ca=V({positional:[`path`],request(e){let t=O(e.path);return{endpoint:`/mkdir`,body:{parent:S.default.dirname(t),path:S.default.basename(t),overwrite:e.overwrite??!1,dedupe_name:B(e,`dedupeName`,`rename`)??!1,shortcut_to:e.shortcutTo,original_client_socket_id:this.socket?.id,create_missing_parents:B(e,`createMissingParents`,`recursive`)??!1}}}}),wa=V({positional:[`source`,`destination`],async request(e){let t=O(e.source),n=O(e.destination),r=B(e,`newName`,`new_name`);if(!r){let e=!1;try{e=!!(await va.call(this,n)).is_dir}catch{}e||(r=S.default.basename(n),n=S.default.dirname(n))}return{endpoint:`/move`,body:{source:t,destination:n,overwrite:e.overwrite,dedupe_name:B(e,`dedupeName`,`dedupe_name`),new_name:r,create_missing_parents:B(e,`createMissingParents`,`create_missing_parents`),new_metadata:B(e,`newMetadata`,`new_metadata`),original_client_socket_id:B(e,`excludeSocketID`,`original_client_socket_id`)}}}}),Ta=V({positional:[`path`],request(e){let t=new URLSearchParams({file:O(e.path)});return e.offset&&t.set(`offset`,String(e.offset)),e.byte_count&&t.set(`byte_count`,String(e.byte_count)),{endpoint:`/read?${t.toString()}`,method:`get`,contentType:`application/json;charset=UTF-8`,responseType:`blob`,prepareXhr(t){e.cache!==!0&&(t.setRequestHeader(`Cache-Control`,`no-cache`),t.setRequestHeader(`Pragma`,`no-cache`))}}}}),Ea=e=>{if(!e||typeof e!=`object`)return e;let t=typeof e.path==`string`?e.path:``,n=t?S.default.dirname(t):e.dirname,r=t.split(`/`),i=r[2]===`AppData`?r[3]:void 0,a=Array.isArray(e.subdomains)?e.subdomains:[];return{id:e.uuid,uid:e.uid??e.uuid,uuid:e.uuid,parent_id:e.parentUid??null,parent_uid:e.parentUid??null,path:e.path,dirname:n,dirpath:n,name:e.name,is_dir:!!e.isDir,is_shortcut:+!!e.isShortcut,shortcut_to:e.shortcutTo??null,is_symlink:+!!e.isSymlink,symlink_path:e.symlinkPath??null,type:e.type??null,writable:!0,is_public:e.isPublic??null,is_shared:e.isShared??null,thumbnail:e.thumbnail??null,immutable:!!e.immutable,metadata:e.metadata??null,modified:e.modified,created:e.created??null,accessed:e.accessed??null,size:e.size??null,layout:e.layout??null,subdomains:a,workers:Array.isArray(e.workers)?e.workers:[],has_website:e.hasWebsite??a.length>0,suggested_apps:e.suggestedApps,associated_app:e.associatedApp??null,appdata_app:i}},Da=104857600,Oa=e=>Array.isArray(e)?e.map(Ea):e&&Array.isArray(e.items)?{...e,items:e.items.map(Ea)}:e,ka=function(e,t){let n={no_thumbs:e.no_thumbs,no_assocs:e.no_assocs,no_subdomains:e.no_subdomains,auth_token:this.authToken};return e.limit!==void 0&&(n.limit=e.limit),e.offset!==void 0&&(n.offset=e.offset),e.sortBy!==void 0&&(n.sortBy=e.sortBy),e.sortOrder!==void 0&&(n.sortOrder=e.sortOrder),e.recursive!==void 0&&(n.recursive=e.recursive),e.depth!==void 0&&(n.depth=e.depth),t&&(n.cursor=t.cursor??null,t.includeTotal!==void 0&&(n.includeTotal=t.includeTotal)),e.uid?n.uid=e.uid:e.path&&(n.path=O(e.path)),ua.call(this,{endpoint:`/fs/readdir`,authHeader:!1,body:n,transform:e=>{let t=Oa(e),n=Array.isArray(t)?t:t?.items??[];for(let e of n)puter._cache.set(`item:${e.path}`,e);return t}})},Aa=async function(e){if(e.consistency||=`strong`,!e.path&&!e.uid)throw{message:`Either path or uid must be provided.`,code:`NO_PATH_OR_UID`};let t=Object.prototype.hasOwnProperty.call(e,`cursor`)||e.includeTotal===!0,n=!t&&e.limit===void 0&&e.offset===void 0,r;if(e.path&&n&&!e.recursive&&(r=`readdir:${e.path}`),e.consistency===`eventual`&&r){let e=await puter._cache.get(r);if(e)return e}let i=xe(`fs:readdir:`+JSON.stringify({path:e.path,uid:e.uid,no_thumbs:e.no_thumbs,no_assocs:e.no_assocs,no_subdomains:e.no_subdomains,consistency:e.consistency,limit:e.limit,offset:e.offset,cursor:t?e.cursor??null:void 0,includeTotal:e.includeTotal,sortBy:e.sortBy,sortOrder:e.sortOrder,recursive:e.recursive,depth:e.depth}),async()=>{if(!n){let n=t?{cursor:e.cursor,includeTotal:e.includeTotal}:void 0;return await ka.call(this,e,n)}let i=await Gt(t=>ka.call(this,e,t));return r&&JSON.stringify(i).length<=Da&&puter._cache.set(r,i),i});return i.then(t=>{typeof e.success==`function`&&e.success(t)},t=>{typeof e.error==`function`&&e.error(t)}),await i},ja=(function(...e){let t=ca(e,[`path`]);if(t.stream===!0){if(t.offset!==void 0)throw{message:"`offset` cannot be combined with `stream`; pass `cursor` to resume from a position.",code:`invalid_request`};if(!t.path&&!t.uid)throw{message:`Either path or uid must be provided.`,code:`NO_PATH_OR_UID`};return A(e=>ka.call(this,t,e),{cursor:t.cursor,includeTotal:t.includeTotal===!0})}return Aa.call(this,t)}),Ma=V({request(e){if(!Array.isArray(e.directory_ids)||e.directory_ids.length===0)throw Error(`directory_ids must be a non-empty array`);return{endpoint:`/readdir-subdomains`,authHeader:!1,body:{directory_ids:e.directory_ids,auth_token:this.authToken}}}}),Na=V({positional:[`path`,`newName`],request(e){let t={original_client_socket_id:B(e,`excludeSocketID`,`original_client_socket_id`),new_name:B(e,`newName`,`new_name`)};return e.uid===void 0?e.path!==void 0&&(t.path=O(e.path)):t.uid=e.uid,{endpoint:`/rename`,body:t}}}),Pa=V({positional:[`tokenOrUuid`],request(e){let t=e.tokenOrUuid;return{endpoint:`/auth/revoke-access-token`,body:{tokenOrUuid:typeof t==`string`?t.trim():String(t)},transform:()=>void 0}}}),Fa=V({positional:[`path`,`recipient`,`mode`],request(e){let t=pa(B(e,`recipient`,`recipients`)),n=ma(e,e=>O(e));return{endpoint:`/share`,body:{recipients:t,items:n,mode:e.mode??`read`},transform:e=>{let t=e.results??[],r=t.filter(e=>e.status===`success`||e.status===`pending`);if(r.length===0&&t.length>0){let e=t[0];throw{message:String(e.message??`Share failed`),code:String(e.code??`share_failed`)}}return ga(n),r.map(ha)}}}}),Ia=V({positional:[`appUid`,`items`],request(e){let t=Array.isArray(e.items)?e.items:[e.items],n=t.length===1;return{endpoint:`/sign`,body:{app_uid:B(e,`appUid`,`app_uid`),items:t},transform:e=>({token:e.token,items:n?{...e.signatures[0]}:e.signatures.map(e=>({...e}))})}}}),La=V({request(){return{endpoint:`/df`}}}),Ra=V({positional:[`path`,`recipient`],request(e){let t=ma(e,e=>O(e));return{endpoint:`/share/revoke`,body:{recipients:pa(B(e,`recipient`,`recipients`)),items:t},transform:e=>{let n=Number(e.revoked??0);return n>0&&ga(t),{revoked:n}}}}}),za=5e3,Ba=`signedBatchWriteSupported`,Va=new Set([404,405,501]),Ha=[`web`,`gui`,`app`],Ua=(e,t)=>{let n=[];if(!Array.isArray(e)||e.length===0)return n;let r=Math.max(1,Number(t)||1);for(let t=0;t<e.length;t+=r)n.push(e.slice(t,t+r));return n},Wa=async(e,t)=>{let n=globalThis.DataTransfer||class{},r=globalThis.FileList||class{},i=globalThis.DataTransferItemList||class{},a;if(e instanceof i||e instanceof n||e[0]instanceof n||t.parsedDataTransferItems)a=t.parsedDataTransferItems?e:await puter.ui.getEntriesFromDataTransferItems(e),a.sort((e,t)=>e.isDirectory&&!t.isDirectory?-1:!e.isDirectory&&t.isDirectory?1:e.isDirectory&&t.isDirectory?0:e.size-t.size);else if(e instanceof File||e[0]instanceof File||e instanceof r||e[0]instanceof r){a=Array.isArray(e)?e:e instanceof r?Array.from(e):[e],a.sort((e,t)=>e.size-t.size);for(let e=0;e<a.length;e++)a[e].filepath=a[e].name,a[e].fullPath=a[e].name}else if(e instanceof Blob){a=[new File([e],t.name,{type:`application/octet-stream`})];for(let e=0;e<a.length;e++)a[e].filepath=a[e].name,a[e].fullPath=a[e].name}else if(typeof e==`string`){a=[new File([e],`default.txt`,{type:`text/plain`})];for(let e=0;e<a.length;e++)a[e].filepath=a[e].name,a[e].fullPath=a[e].name}else throw{code:`field_invalid`,message:`upload() items parameter is an invalid type`};return a},Ga=(e,t,n)=>{let r=[],i={},a=[],o=0,s=0;for(let c=0;c<e.length;c++)if(e[c]){if(e[c].isDirectory){let n=e[c].finalPath?e[c].finalPath:e[c].fullPath,i=typeof n==`string`?n.replace(/^\/+/,``):``;r.push({path:S.default.join(t,i)})}else{let o=e[c].finalPath||e[c].filepath||e[c].fullPath||e[c].name;typeof o==`string`&&(o=o.replace(/^\/+/,``));let[s,l]=[o?.slice(0,o?.lastIndexOf(`/`)),o?.slice(o?.lastIndexOf(`/`)+1)];if((typeof l==`string`?l.trim().toLowerCase():``)===`.ds_store`)continue;if(l!==``){let n=o||e[c].name;e[c].puter_full_path=S.default.join(t,n),a.push(e[c])}if(n.createFileParent&&o.includes(`/`)){let e;s.split(`/`).forEach(n=>{e=e?`${e}/${n}`:n;let a=S.default.join(t,e);i[a]||(i[a]=!0,r.push({path:a}))})}}e[c].size!==void 0&&(o+=e[c].size,s++)}return{dirs:r,files:a,totalSize:o,fileCount:s}},Ka=e=>{if(!e)return 0;let t=e.indexOf(`,`),n=t===-1?e:e.slice(t+1),r=n.endsWith(`==`)?2:+!!n.endsWith(`=`);return Math.floor(n.length*3/4)-r},qa=e=>typeof e==`string`&&e.startsWith(`data:`),Ja=e=>{if(!qa(e))return;let t=e.indexOf(`,`),[n]=(t===-1?e.slice(5):e.slice(5,t)).split(`;`);return(n?n.trim():``)||`application/octet-stream`},Ya=async e=>{let t=await fetch(e);if(!t.ok)throw Error(`Failed to read thumbnail data URL`);return await t.blob()},Xa=e=>{if(!e)return!1;if(e.type&&e.type.startsWith(`image/`))return!0;let t=(e.name||``).toLowerCase();return[`.png`,`.jpg`,`.jpeg`,`.gif`,`.bmp`,`.webp`,`.tiff`,`.avif`,`.jfif`].some(e=>t.endsWith(e))},Za=e=>{if(typeof e==`string`&&e.length!==0&&!(qa(e)&&Ka(e)>2097152))return e},Qa=(e,t,n)=>{let r=Math.min(1,n/(Math.max(e,t)||1));return{width:Math.max(1,Math.round(e*r)),height:Math.max(1,Math.round(t*r))}},$a=e=>new Promise((t,n)=>{if(typeof document>`u`||typeof URL>`u`||typeof Image>`u`)return t(null);let r=URL.createObjectURL(e),i=new Image;i.onload=()=>{URL.revokeObjectURL(r),t(i)},i.onerror=e=>{URL.revokeObjectURL(r),n(e)},i.src=r}),eo=(e,t,n,r)=>{if(!e||typeof document>`u`)return null;let{width:i,height:a}=Qa(e.naturalWidth||e.width,e.naturalHeight||e.height,t),o=document.createElement(`canvas`);o.width=i,o.height=a;let s=o.getContext(`2d`);if(!s)return null;s.drawImage(e,0,0,i,a);try{return o.toDataURL(n,r)}catch{return null}},to=async e=>{try{if(typeof document>`u`||typeof File>`u`||!(e instanceof File)||!Xa(e))return;let t=await $a(e);if(!t)return;let n=128,r=[{type:`image/webp`,quality:.85},{type:`image/jpeg`,quality:.8},{type:`image/png`}];for(;n>=32;){for(let{type:e,quality:i}of r){let r=eo(t,n,e,i);if(r&&Ka(r)<=2097152)return r}n=Math.floor(n/2)}}catch{return}},no=async(e,t,n)=>{let r=t.generateThumbnails||t.thumbnailGenerator;if(!e.length||!r)return[];let i=t.thumbnailGenerator||to;return await Promise.all(e.map(async e=>{try{return n?.aborted?void 0:await i(e,{defaultGenerator:to,signal:n})}catch{return}}))},ro=async e=>{let t=await e.text();if(!t)return null;try{return JSON.parse(t)}catch{return t}},io=e=>({Authorization:`Bearer ${e}`,"Content-Type":`application/json`}),ao=(e,t,n)=>{let r=t&&typeof t==`object`?t:null,i=r?.message??(typeof r?.error==`string`?r.error:r?.error?.message)??(typeof t==`string`&&t.length>0?t:null)??n??`Request failed with status ${e.status}`,a=Error(i);return a.status=e.status,a.body=t,typeof r?.code==`string`&&r.code.length>0?a.code=r.code:typeof r?.errorCode==`string`&&r.errorCode.length>0&&(a.code=r.errorCode),a},oo=async(e,t,n,r)=>{let i=await x(`${e}${n}`,{method:`POST`,headers:io(t),body:JSON.stringify(r)}),a=await ro(i);if(!i.ok)throw ao(i,a,`Failed request to ${n}`);return a},so=e=>{if(e&&typeof e==`object`){if(typeof e.message==`string`&&e.message.length>0)return e.message;if(typeof e.body==`string`&&e.body.length>0)return e.body;if(e.body&&typeof e.body==`object`){if(typeof e.body.message==`string`&&e.body.message.length>0)return e.body.message;if(e.body.error&&typeof e.body.error==`object`&&typeof e.body.error.message==`string`&&e.body.error.message.length>0)return e.body.error.message}}return String(e)},co=async({url:e,blob:t,contentType:n,timeoutMs:r=0,onProgress:i,onRequestCreated:a,onRequestCompleted:o})=>await new Promise((s,c)=>{let l=new XMLHttpRequest;l.open(`PUT`,e,!0),l.withCredentials=!1,l.timeout=r,n&&l.setRequestHeader(`Content-Type`,n),a&&a(l);let u=0;l.upload.addEventListener(`progress`,e=>{if(!i||!e.lengthComputable)return;let t=Math.max(0,e.loaded-u);u=e.loaded,t>0&&i(t)}),l.onload=()=>{if(o&&o(l),t.size>u&&i&&i(t.size-u),l.status>=200&&l.status<300){s({etag:l.getResponseHeader(`etag`)??l.getResponseHeader(`ETag`)});return}let e=Error(`Signed upload failed with status ${l.status}`);e.status=l.status,c(e)},l.onerror=()=>{o&&o(l);let e=Error(`Network error during signed upload`);e.status=l.status,c(e)},l.onabort=()=>{o&&o(l);let e=Error(`Signed upload aborted`);e.aborted=!0,c(e)},l.ontimeout=()=>{o?.(l),c(Error(`Signed upload timed out`))},l.send(t)}),lo=e=>{if(!e||typeof e!=`object`)return!1;if(e.signedBatchUnavailable===!0)return!0;if(e.partial===!0)return!1;let t=e.body&&typeof e.body==`object`?e.body:null;return typeof t?.code==`string`&&t.code.length>0||typeof t?.errorCode==`string`&&t.errorCode.length>0?!1:Va.has(e.status)},uo=e=>{let t={};for(let n of[`code`,`status`]){let r=new Set(e.map(e=>e[n]));r.size===1&&!r.has(void 0)&&(t[n]=[...r][0])}return t},fo=(e,t)=>{if(!t||typeof t!=`object`)return;if(t.type===`directory`)return t.directoryPath;if(t.type!==`file`||!t.file)return;let n=t.file;return n.puter_full_path??S.default.join(e,n.filepath||n.name||``)};async function po(e){let{options:t,dirPath:n,operationId:r,xhr:i,files:a,dirs:o,signedDirectories:s,thumbnails:c,totalSize:l,resolve:u,reject:d,error:f,flags:p}=e,m=t.overwrite??!1,h=!!(t.createMissingAncestors||t.createMissingParents||t.createFileParent||o.length>0),g=l>0?l:1,_=0,v=new Set,y=new Set,b=!1,ee=()=>{let e=(_/g*100).toFixed(2);e=e>100?100:e,t.progress&&typeof t.progress==`function`&&t.progress(r,e)},te=e=>{e<=0||(_+=e,ee())},ne=async()=>{if(y.size===0)return;let e=Array.from(y);await Promise.all(e.map(async e=>{try{await oo(this.APIOrigin,this.authToken,`/fs/abortWrite`,{uploadId:e})}catch{}})),y.clear()},re=async()=>{if(!b){b=!0;for(let e of v)try{e.abort()}catch{}await ne(),t.abort&&typeof t.abort==`function`&&t.abort(r)}};i.abort=()=>{re()};try{let e=[];for(let t=0;t<s.length;t++)e.push({type:`directory`,directoryPath:s[t],itemUploadId:`dir_${t}`});for(let n=0;n<a.length;n++)e.push({type:`file`,file:a[n],fileIndex:n,thumbnailData:Za(c[n]??t.thumbnail??void 0),itemUploadId:String(n)});let i=l+e.reduce((e,t)=>t.type!==`file`||!qa(t.thumbnailData)?e:e+Ka(t.thumbnailData),0);g=i>0?i:1;let o=e.map(e=>{if(e.type===`directory`)return{fileMetadata:{path:e.directoryPath,size:0,contentType:`application/x-puter-directory`,overwrite:m,createMissingParents:h},directory:!0,guiMetadata:{operationId:r,itemUploadId:e.itemUploadId,socketId:this.socket?.id,originalClientSocketId:this.socket?.id}};let i=e.file;return{fileMetadata:{path:i.puter_full_path??S.default.join(n,i.filepath||i.name),size:i.size,contentType:i.type||`application/octet-stream`,overwrite:m,dedupeName:m?!1:t.dedupeName??!0,createMissingParents:h,app_uid:t.appUID},...qa(e.thumbnailData)?{thumbnailMetadata:{contentType:Ja(e.thumbnailData),size:Ka(e.thumbnailData)}}:{},guiMetadata:{operationId:r,itemUploadId:e.itemUploadId,socketId:this.socket?.id,originalClientSocketId:this.socket?.id}}});t.start&&typeof t.start==`function`&&(t.start(),p.startCallbackFired=!0);let d=new Map,f=[],ee=[],ne=Ua(o,500),re=Ua(e,500),ie=Ua(e.map((e,t)=>t),500);if(ne.length!==re.length||ne.length!==ie.length)throw Error(`Signed batch request chunk mapping is invalid`);let ae=async e=>{let{requestIndex:t,requestItem:n,startResponse:i}=e,a=n.file,o=n.thumbnailData,s;if(qa(o)){let e=i.thumbnailUploadUrl,t=i.thumbnailUrl;if(e&&t)try{let n=await Ya(o);n.size<=2097152&&(await co({url:e,blob:n,contentType:n.type||Ja(o),timeoutMs:za,onProgress:te,onRequestCreated:e=>{v.add(e)},onRequestCompleted:e=>{v.delete(e)}}),s=t)}catch(e){if(b||e?.aborted)throw e}}else typeof o==`string`&&o.length>0&&(s=o);if(i.uploadMode===`multipart`){let e=Number(i.multipartPartSize)||Math.max(a.size,1),o=Number(i.multipartPartCount),c=Math.max(1,Math.ceil(a.size/e)),l=Number.isInteger(o)&&o>0?o:c,u=new Map,d=Array.isArray(i.multipartPartUrls)?i.multipartPartUrls:[];for(let e of d)e?.partNumber&&e?.url&&u.set(Number(e.partNumber),e.url);let f=[];for(let e=1;e<=l;e++)u.has(e)||f.push(e);if(f.length>0){let e=await oo(this.APIOrigin,this.authToken,`/fs/signMultipartParts`,{uploadId:i.sessionId,partNumbers:f}),t=Array.isArray(e?.multipartPartUrls)?e.multipartPartUrls:[];for(let e of t)e?.partNumber&&e?.url&&u.set(Number(e.partNumber),e.url)}let p=[],m=[];for(let e=1;e<=l;e++)m.push(e);let h=Ua(m,8);for(let t of h){let n=await Promise.allSettled(t.map(async t=>{let n=u.get(t);if(!n)throw Error(`Missing signed multipart URL for part ${t}`);let r=(t-1)*e,o=Math.min(r+e,a.size),s=await co({url:n,blob:a.slice(r,o),contentType:i.contentType||a.type||`application/octet-stream`,onProgress:te,onRequestCreated:e=>{v.add(e)},onRequestCompleted:e=>{v.delete(e)}});if(!s.etag)throw Error(`Missing ETag for multipart part ${t}`);return{partNumber:t,etag:s.etag}}));for(let e of n){if(e.status===`rejected`)throw e.reason;p.push(e.value)}}return p.sort((e,t)=>e.partNumber-t.partNumber),{requestIndex:t,completionItem:{uploadId:i.sessionId,parts:p,...s===void 0?{}:{thumbnailData:s},guiMetadata:{operationId:r,itemUploadId:n.itemUploadId,socketId:this.socket?.id,originalClientSocketId:this.socket?.id}}}}if(!i.url)throw Error(`Signed upload URL is missing`);return await co({url:i.url,blob:a,contentType:i.contentType||a.type||`application/octet-stream`,onProgress:te,onRequestCreated:e=>{v.add(e)},onRequestCompleted:e=>{v.delete(e)}}),{requestIndex:t,completionItem:{uploadId:i.sessionId,...s===void 0?{}:{thumbnailData:s},guiMetadata:{operationId:r,itemUploadId:n.itemUploadId,socketId:this.socket?.id,originalClientSocketId:this.socket?.id}}}},oe=async e=>{if(b){let e=Error(`Signed upload aborted`);throw e.aborted=!0,e}let t=ne[e],n=re[e],r=ie[e];if(!t||!n||!r)throw Error(`Missing signed batch request chunk`);let i=await oo(this.APIOrigin,this.authToken,`/fs/startBatchWrite`,t);if(!Array.isArray(i)){let e=Error(`Signed batch start response is invalid`);throw e.signedBatchUnavailable=!0,e}if(i.length!==t.length)throw Error(`Signed batch start response count mismatch`);let a=[];for(let e=0;e<i.length;e++){let t=r[e],o=n[e],s=i[e];if(t===void 0||!o||!s)throw Error(`Missing batch signed upload metadata`);if(o.type===`directory`){d.set(t,s.fsEntry??s);continue}if(!s.sessionId)throw Error(`Signed batch response missing sessionId`);y.add(s.sessionId),a.push({requestIndex:t,requestItem:o,startResponse:s})}let o=[],s=[],c=Ua(a,8);for(let e of c){if(b){let e=Error(`Signed upload aborted`);throw e.aborted=!0,e}let t=await Promise.allSettled(e.map(async e=>await ae(e)));for(let n=0;n<t.length;n++){let r=t[n];if(r?.status===`rejected`){let t=e[n];t&&s.push({requestIndex:t.requestIndex,uploadId:t.startResponse.sessionId,error:r.reason});continue}o.push(r.value)}}if(s.length>0){let e=Array.from(new Set(s.map(e=>e.uploadId)));await Promise.allSettled(e.map(async e=>{y.delete(e),await oo(this.APIOrigin,this.authToken,`/fs/abortWrite`,{uploadId:e})})),f.push(...s)}if(o.length===0)return;o.sort((e,t)=>e.requestIndex-t.requestIndex);let l=o.map(e=>e.completionItem),u=o.map(e=>e.requestIndex),p=Ua(l,500),m=Ua(u,500);if(p.length!==m.length)throw Error(`Signed batch completion request mapping is invalid`);let h=[];for(let e=0;e<p.length;e++){if(b){let e=Error(`Signed upload aborted`);throw e.aborted=!0,e}let t=p[e],n=m[e];if(!t||!n)throw Error(`Missing signed batch completion request chunk`);try{let e=await oo(this.APIOrigin,this.authToken,`/fs/completeBatchWrite`,t);if(!Array.isArray(e))throw Error(`Signed batch completion response is invalid`);if(e.length!==t.length)throw Error(`Signed batch completion response count mismatch`);for(let r=0;r<e.length;r++){let i=e[r],a=n[r],o=t[r];if(a===void 0)throw Error(`Missing request index for completed signed batch response`);o?.uploadId&&y.delete(o.uploadId),d.set(a,i?.fsEntry??i)}}catch(e){let r=await Promise.allSettled(t.map(async e=>await oo(this.APIOrigin,this.authToken,`/fs/completeWrite`,e)));for(let i=0;i<r.length;i++){let a=r[i],o=n[i],s=t[i];if(o!==void 0&&s){if(a?.status===`fulfilled`){y.delete(s.uploadId),d.set(o,a.value?.fsEntry??a.value);continue}h.push({requestIndex:o,uploadId:s.uploadId,error:a?.status===`rejected`?a.reason:e})}}}}if(h.length>0){let e=Array.from(new Set(h.map(e=>e.uploadId)));await Promise.allSettled(e.map(async e=>{y.delete(e),await oo(this.APIOrigin,this.authToken,`/fs/abortWrite`,{uploadId:e})})),ee.push(...h)}},se=Ua(ne.map((e,t)=>t),4);for(let e of se){let t=await Promise.allSettled(e.map(async e=>{await oe(e)}));for(let e of t)if(e.status===`rejected`)throw e.reason}this[Ba]=!0;let ce=[...f.map(e=>({...e,stage:`upload`})),...ee.map(e=>({...e,stage:`complete`}))];if(ce.length>0){let t=Error(`One or more signed batch file operations failed`),r=ce.map(t=>{let r=e[t.requestIndex],i=fo(n,r);return{requestIndex:t.requestIndex,uploadId:t.uploadId,stage:t.stage,path:i,name:typeof i==`string`&&i.length>0?S.default.basename(i):void 0,message:so(t.error),code:typeof t.error?.code==`string`?t.error.code:void 0,status:typeof t.error?.status==`number`?t.error.status:void 0}});throw t.partial=!0,t.failedItems=r,Object.assign(t,uo(r)),t.failedPaths=r.map(e=>e.path).filter(e=>typeof e==`string`&&e.length>0),t.completedItemCount=d.size,t.totalItemCount=e.length,t}let le=[];for(let t=0;t<e.length;t++){if(!d.has(t))throw Error(`Missing signed batch response item at index ${t}`);le.push(d.get(t))}te(Math.max(0,g-_));let ue=le;return ue=ue.length===1?ue[0]:ue,t.success&&typeof t.success==`function`&&t.success(ue),u(ue),!0}catch(e){if(b||e?.aborted)return d(e),!0;let t=lo(e);lo(e)&&(this[Ba]=!1);try{await ne()}catch{}return t?(delete i.abort,!1):(f(e),!0)}}var mo=e=>!e||typeof e!=`object`?!1:e.error===!0||typeof e.status==`number`&&e.status!==200,ho=(e,t)=>{let n=e.length,r=t.length,i=r>0&&r===n,a=t.map(e=>e?.message).find(e=>typeof e==`string`&&e.length>0),o;return o=r===0?`Upload partially failed: the server reported a failed operation.`:i?`Upload failed: ${a??`the server did not report a reason`}`:`Upload partially failed: ${r} of ${n} operations failed (${a??`the server did not report a reason`})`,{message:o,code:i?`batch_upload_failed`:`batch_upload_partially_failed`,status:218,results:e,failedItems:t,failedCount:r,totalCount:n}};function go(e){let{options:t,dirPath:n,operationId:r,xhr:i,files:a,dirs:o,thumbnails:s,resolve:c,error:l,flags:u}=e,d=e.totalSize*2,f=0,p=0,m=new FormData;o.sort((e,t)=>t.path.length-e.path.length);let h=[];for(let e=0;e<o.length;e++){for(let t=0;t<a.length;t++)!a[t].puter_path_param&&S.default.join(n,a[t].filepath).startsWith(`${o[e].path}/`)&&(a[t].puter_path_param=`$dir_${e}/${S.default.basename(a[t].filepath)}`);for(let t=0;t<o.length;t++)!o[t].puter_path_param&&o[t].path.startsWith(`${o[e].path}/`)&&(o[t].puter_path_param=`$dir_${e}/${S.default.basename(o[t].path)}`)}for(let e=0;e<o.length;e++){let n=S.default.dirname(o[e].puter_path_param||o[e].path),r=o[e].puter_path_param||o[e].path;n!==`/`&&(r=r.replace(n,``)),h.push({op:`mkdir`,parent:n,path:r,overwrite:t.overwrite??!1,dedupe_name:t.dedupeName??!0,create_missing_ancestors:t.createMissingAncestors??!0,as:`dir_${e}`})}h.reverse(),m.append(`operation_id`,r),this.socket&&(m.append(`socket_id`,this.socket.id),m.append(`original_client_socket_id`,this.socket.id));for(let e=0;e<h.length;e++)m.append(`operation`,JSON.stringify(h[e]));if(!t.shortcutTo)for(let e=0;e<a.length;e++){let n=Za(s[e]??t.thumbnail??void 0),r={name:a[e].name,type:a[e].type,size:a[e].size};n&&(r.thumbnail=n),m.append(`fileinfo`,JSON.stringify({...r}))}for(let e=0;e<a.length;e++){let i=Za(s[e]??t.thumbnail??void 0),o={op:t.shortcutTo?`shortcut`:`write`,dedupe_name:t.dedupeName??!0,overwrite:t.overwrite??!1,thumbnail:i,create_missing_ancestors:t.createMissingAncestors||t.createMissingParents,operation_id:r,path:a[e].puter_path_param&&S.default.dirname(a[e].puter_path_param??``)||a[e].filepath&&S.default.join(n,S.default.dirname(a[e].filepath))||``,name:S.default.basename(a[e].filepath),item_upload_id:e,shortcut_to:t.shortcutTo,shortcut_to_uid:t.shortcutTo,app_uid:t.appUID};i===void 0&&delete o.thumbnail,m.append(`operation`,JSON.stringify(o))}if(!t.shortcutTo)for(let e=0;e<a.length;e++)m.append(`file`,a[e]??``);let g=e=>{e.operation_id===r&&(p+=e.loaded_diff)};this.socket?.on(`upload.progress`,g);let _=null;i.open(`post`,`${this.APIOrigin}/batch`,!0),i.withCredentials=!0,i.setRequestHeader(`Authorization`,`Bearer ${this.authToken}`),i.upload.addEventListener(`progress`,function(e){let n;_===null?(n=e.loaded,_=0):n=e.loaded-_,_+=n,f+=n;let i=((p+f)/d*100).toFixed(2);i=i>100?100:i,t.progress&&typeof t.progress==`function`&&t.progress(r,i)});let v=setInterval(function(){let e=((p+f)/d*100).toFixed(2);e=e>100?100:e,t.progress&&typeof t.progress==`function`&&t.progress(r,e)},100),y=()=>{clearInterval(v),this.socket?.off(`upload.progress`,g)};i.onabort=()=>{y(),t.abort&&typeof t.abort==`function`&&t.abort(r)},i.onreadystatechange=async()=>{if(i.readyState!==4)return;let e=await b(i),n=Array.isArray(e?.results)?e.results:null;if(i.status>=400&&i.status<600)return y(),l(e);if(t.strict&&i.status===218){y();let e=n?.find(mo)??n?.[0];return l(e)}let r=n?n.filter(mo):[];if(i.status===218||r.length>0)return y(),l(ho(n??[],r));if(!n||n.length===0)return y(),l({message:`Upload failed: the server returned no results.`,code:`batch_upload_no_results`,status:i.status,results:[],failedItems:[],failedCount:0,totalCount:0});let a=n.length===1?n[0]:n;return t.success&&typeof t.success==`function`&&t.success(a),y(),c(a)},!u.startCallbackFired&&t.start&&typeof t.start==`function`&&(t.start(),u.startCallbackFired=!0),i.send(m)}var _o=async function(e,t,n={}){return new Promise(async(r,i)=>{if(!puter.authToken&&puter.env===`web`)try{await puter.ui.authenticateWithPuter()}catch(e){return i(e)}let a=new AbortController,o=e=>{if(!a.signal.aborted)return aa(e),n.error&&typeof n.error==`function`&&n.error(e),i(e)},s=new XMLHttpRequest;if(t===`/`)return o(`Can not upload to root directory.`);t=O(t);let c=Ze(),l={startCallbackFired:!1};if(s.abort=()=>{if(!a.signal.aborted){a.abort();try{n.abort?.(c)}finally{i({code:`upload_aborted`,message:`Upload aborted.`})}}},n.init&&typeof n.init==`function`&&n.init(c,s),a.signal.aborted)return;let u;try{u=await Wa(e,n)}catch(e){return o(e)}if(a.signal.aborted)return;let d,f,p,m;try{if({dirs:d,files:f,totalSize:p}=Ga(u,t,n),d.length===0&&f.length===0)return o({code:`EMPTY_UPLOAD`,message:`No files or directories to upload.`});m=await no(f,n,a.signal)}catch(e){return o(e)}if(a.signal.aborted)return;let h;if(puter.env!==`web`&&p>=1048576)try{if(h=await this.space(),h.capacity-h.used<p)return o({code:`NOT_ENOUGH_SPACE`,message:`Not enough storage space available.`})}catch{}if(a.signal.aborted)return;delete s.abort;let g=d.map(e=>e.path),_=this[Ba]!==!1,v=Ha.includes(puter.env)&&!n.shortcutTo&&(f.length>0||g.length>0)&&_,y={options:n,dirPath:t,operationId:c,xhr:s,files:f,dirs:d,signedDirectories:g,thumbnails:m,totalSize:p,flags:l,resolve:r,reject:i,error:o};try{if(v&&await po.call(this,y))return;go.call(this,y)}catch(e){return o(e)}})},vo=async function(e,t,n={}){if(!e)throw{code:`NO_TARGET_PATH`,message:`No target path provided.`};e instanceof File&&t===void 0&&(t=e,e=e.name);let r=n.overwrite??!0,i={...n,overwrite:r,dedupeName:n.dedupeName??(!r&&void 0),strict:!0};e=O(e);let a=S.default.basename(e),o=S.default.dirname(e);if(typeof t==`string`?t=new File([t??``],a??`Untitled.txt`,{type:`text/plain`}):t instanceof Blob?t=new File([t??``],a??`Untitled`,{type:t.type}):(t instanceof ArrayBuffer||ArrayBuffer.isView(t))&&(t=new File([t],a??`Untitled`,{type:`application/octet-stream`})),t||=new File([t??``],a),!(t instanceof File))throw{code:`field_invalid`,message:`write() data parameter is an invalid type`};return this.upload(t,o,i)},yo=`last_valid_ts`,bo=class extends D{space=La;mkdir=Ca;copy=da;rename=Na;upload=_o;read=Ta;delete=fa;move=wa;write=vo;sign=Ia;getReadURL=ya;revokeReadURL=Pa;readdir=ja;readdirSubdomains=Ma;stat=va;share=Fa;unshare=Ra;listShared=xa;listSharedByMe=Sa;getShares=ba;FSItem=z;constructor(e){super(e),this.cacheUpdateTimer=null,e.socketEnabled&&this.initializeSocket(),e.onAuthStateChanged(()=>this.onAuthStateChanged())}initializeSocket(){this.socket&&this.socket.disconnect(),this.socket=Ur(this.APIOrigin,{auth:{auth_token:this.authToken},autoUnref:this.shouldUseSocketAutoUnref(),transports:[`websocket`,`polling`],withCredentials:!0}),this.bindSocketEvents()}shouldUseSocketAutoUnref(){return Wr(this.puter)}bindSocketEvents(){this.socket.on(`item.renamed`,e=>{puter._cache.flushall()}),this.socket.on(`item.removed`,e=>{puter._cache.flushall()}),this.socket.on(`item.added`,e=>{puter._cache.del(`readdir:${S.default.dirname(e.path)}`),puter._cache.del(`item:${S.default.dirname(e.path)}`)}),this.socket.on(`item.updated`,e=>{puter._cache.flushall()}),this.socket.on(`item.moved`,e=>{puter._cache.flushall()}),this.socket.on(`connect`,()=>{puter.debugMode&&console.log(`FileSystem Socket: Connected`,this.socket.id)}),this.socket.on(`disconnect`,()=>{puter.debugMode&&console.log(`FileSystem Socket: Disconnected`)}),this.socket.on(`reconnect`,e=>{puter.debugMode&&console.log(`FileSystem Socket: Reconnected`,this.socket.id)}),this.socket.on(`reconnect_attempt`,e=>{puter.debugMode&&console.log(`FileSystem Socket: Reconnection Attemps`,e)}),this.socket.on(`reconnect_error`,e=>{puter.debugMode&&console.log(`FileSystem Socket: Reconnection Error`,e)}),this.socket.on(`reconnect_failed`,()=>{puter.debugMode&&console.log(`FileSystem Socket: Reconnection Failed`)}),this.socket.on(`error`,e=>{puter.debugMode&&console.error(`FileSystem Socket Error:`,e)})}onAuthStateChanged(){this.puter.env===`gui`&&(this.checkCacheAndPurge(),this.startCacheUpdateTimer()),this.puter.socketEnabled&&this.initializeSocket()}invalidateCache(){localStorage.setItem(yo,`0`),puter._cache.flushall()}async getCacheTimestamp(){return new Promise((e,t)=>{let n=Qe(`/cache/last-change-timestamp`,this.APIOrigin,this.authToken,`get`,`application/json`);w(n,void 0,void 0,async n=>{try{e((typeof n==`string`?JSON.parse(n):n).timestamp||Date.now())}catch{t(Error(`Failed to parse response`))}},t),n.send()})}async checkCacheAndPurge(){try{await this.getCacheTimestamp()-(parseInt(localStorage.getItem(yo))||0)>2e3&&(puter._cache.flushall(),localStorage.setItem(yo,`0`))}catch(e){console.error(`Error checking cache timestamp:`,e)}}startCacheUpdateTimer(){this.puter.env===`gui`&&(this.stopCacheUpdateTimer(),this.cacheUpdateTimer=setInterval(()=>{localStorage.setItem(yo,Date.now().toString())},1e3))}stopCacheUpdateTimer(){this.cacheUpdateTimer&&=(clearInterval(this.cacheUpdateTimer),null)}},xo=/^[a-z0-9]+\.puter\.(site|com)$/,So=e=>typeof e==`string`&&xo.test(e)?e.split(`.`)[0]:e;async function Co(e,t){let{puter:n}=this,r;if(typeof e==`string`){let n=So(e);r=t===void 0?{subdomain:n}:{subdomain:n,root_dir:t&&O(t)}}else r=e;return await T({iface:`puter-subdomains`,method:`create`,argNames:[`object`],puter:n})({object:r})}async function wo(e){let{puter:t}=this,n=typeof e==`string`?{id:{subdomain:So(e)}}:{};return await T({iface:`puter-subdomains`,method:`delete`,argNames:[`uid`],puter:t})(n)}async function To(e){let{puter:t}=this,n=typeof e==`string`?{id:{subdomain:So(e)}}:{};return await T({iface:`puter-subdomains`,method:`read`,argNames:[`uid`],puter:t,readonly:!0})(n)}var Eo=e=>e.filter(e=>!e.subdomain.startsWith(`workers.puter.`));function Do(...e){let{puter:t}=this,n=T({iface:`puter-subdomains`,method:`select`,puter:t,readonly:!0}),r=typeof e[0]==`object`&&e[0]!==null?e[0]:{},{limit:i,offset:a,cursor:o,includeTotal:s,stream:c,success:l,error:u,...d}=r,f=Object.prototype.hasOwnProperty.call(r,`cursor`),p={...d};i!==void 0&&(p.limit=i);let m=e=>n({...p,...e});if(c===!0){if(a!==void 0)throw new k("`offset` cannot be combined with `stream`; pass `cursor` to resume from a position.",`invalid_request`);return(async function*(){for await(let e of A(m,{cursor:o,includeTotal:s===!0}))yield{...e,items:Eo(e.items??[])}})()}if(i!==void 0||a!==void 0||f||s!==void 0)return(async()=>{let e=await n(r);return e&&!Array.isArray(e)&&Array.isArray(e.items)?e:Eo(e)})();let h=Gt(m).then(e=>Eo(e)),g=typeof e[0]==`function`?e[0]:l,_=typeof e[0]==`function`?e[1]:u;return(typeof g==`function`||typeof _==`function`)&&h.then(e=>{typeof g==`function`&&g(e)},e=>{typeof _==`function`&&_(e)}),h}async function Oo(e,t){let{puter:n}=this,r={};if(typeof e==`string`){let n=t?O(t):t??null;r={id:{subdomain:So(e)},object:{root_dir:n}}}return await T({iface:`puter-subdomains`,method:`update`,argNames:[`object`],puter:n})(r)}var ko=class extends D{list=Do;create=Co;update=Oo;get=To;delete=wo;constructor(e){super(e);let t=this;for(let e of[`list`,`create`,`update`,`get`,`delete`])t[e]=t[e].bind(this)}},H=e=>typeof e==`object`&&!!e&&!Array.isArray(e),Ao=e=>H(e)&&Object.prototype.hasOwnProperty.call(e,`appUuid`),jo=e=>H(e)&&Object.prototype.hasOwnProperty.call(e,`key`),Mo=e=>(e[0]===void 0&&e.shift(),{optConfig:H(e[0])?e.shift():void 0,success:typeof e[0]==`function`?e.shift():void 0,error:typeof e[0]==`function`?e.shift():void 0}),No=e=>H(e[0])?{optConfig:e[0],success:e[1],error:e[2]}:{success:e[0],error:e[1]},Po=(e,t,n)=>{if(H(e)&&t===void 0&&n===void 0)return{...e};if(e===void 0&&t===void 0&&n===void 0)throw{message:`Arguments are required`,code:`arguments_required`};return Ao(t)&&n===void 0&&(n=t,t=void 0),{key:e,pathAndAmountMap:t==null?{"":1}:typeof t==`number`?{"":t}:t,optConfig:n}},Fo=1024,Io=408576,U=e=>{if(e==null)throw{message:`Key cannot be undefined`,code:`key_undefined`}},W=e=>{if(e.length>1024)throw{message:`Key size cannot be larger than ${Fo}`,code:`key_too_large`}},Lo=e=>{if(e&&e.length>408576)throw{message:`Value size cannot be larger than ${Io}`,code:`value_too_large`}};async function Ro(e,t,n){let r;if(H(e)&&t===void 0&&n===void 0)r={...e};else{if(e===void 0&&t===void 0&&n===void 0)throw{message:`Arguments are required`,code:`arguments_required`};let i=t;Ao(i)&&n===void 0&&(n=i,i=void 0),r={key:e,pathAndValueMap:i===void 0?{"":1}:i&&typeof i==`object`&&!Array.isArray(i)?i:{"":i},optConfig:n}}return U(r.key),W(r.key),await T({iface:`puter-kvstore`,method:`add`,argNames:[`key`],puter:this.puter})(r)}async function zo(e,t,n){let r=Po(e,t,n);return U(r.key),W(r.key),await T({iface:`puter-kvstore`,method:`decr`,argNames:[`key`],puter:this.puter})(r)}var Bo=(e,t)=>T({iface:`puter-kvstore`,method:`del`,argNames:[`key`],puter:e,preprocess:e=>(U(e.key),W(e.key),e)})(t);async function Vo(e,...t){let{puter:n}=this;if(H(e)&&t.length===0)return await Bo(n,e);let{optConfig:r,success:i,error:a}=No(t);return await Bo(n,{key:e,optConfig:r,success:i,error:a})}async function Ho(e,t,n){return U(e),W(e),await T({iface:`puter-kvstore`,method:`expire`,argNames:[`key`,`ttl`],puter:this.puter})({key:e,ttl:t,optConfig:n})}async function Uo(e,t,n){return U(e),W(e),await T({iface:`puter-kvstore`,method:`expireAt`,argNames:[`key`,`timestamp`],puter:this.puter})({key:e,timestamp:t,optConfig:n})}var Wo=(e,t)=>T({iface:`puter-kvstore`,method:`flush`,puter:e})(t);async function Go(e,...t){let{puter:n}=this;if(H(e)&&t.length===0){let t=e;return Object.prototype.hasOwnProperty.call(t,`optConfig`)||Object.prototype.hasOwnProperty.call(t,`success`)||Object.prototype.hasOwnProperty.call(t,`error`)?await Wo(n,t):await Wo(n,{optConfig:t})}let{optConfig:r,success:i,error:a}=No([e,...t]);return await Wo(n,{optConfig:r,success:i,error:a})}var Ko=(e,t)=>T({iface:`puter-kvstore`,method:`get`,argNames:[`key`],puter:e,readonly:!0,preprocess:e=>(U(e.key),W(e.key),e)})(t);async function qo(e,...t){let{puter:n}=this;if(H(e)&&t.length===0)return await Ko(n,e);let r=e,{optConfig:i,success:a,error:o}=No(t);return!i&&this.guiCache.serves(r)?await this.guiCache.lookup(r):await Ko(n,{key:r,optConfig:i,success:a,error:o})}async function Jo(e,t,n){let r=Po(e,t,n);return U(r.key),W(r.key),await T({iface:`puter-kvstore`,method:`incr`,argNames:[`key`],puter:this.puter})(r)}var Yo=[`has_set_default_app_user_permissions`,`window_sidebar_width`,`sidebar_items`,`menubar_style`,`user_preferences.auto_arrange_desktop`,`user_preferences.show_hidden_files`,`user_preferences.language`,`user_preferences.clock_visible`,`toolbar_auto_hide_enabled`,`has_seen_welcome_window`,`desktop_item_positions`,`desktop_icons_hidden`,`taskbar_position`,`has_seen_toolbar_animation`],Xo=4e3,Zo=()=>{let e=()=>{},t=()=>{};return{promise:new Promise((n,r)=>{e=n,t=r}),resolve:e,reject:t}},Qo=class{constructor(e){this.puter=e,this.batch=Zo(),this.init=Zo(),(async()=>{await this.init.promise,this.init=null;let t=await Ae({puter:e,iface:`puter-kvstore`,method:`get`,args:{key:Yo}}).catch(()=>null),n=()=>{setTimeout(()=>{this.batch=null},Xo)};if(!Array.isArray(t?.result)){this.batch.resolve({}),n();return}let r={};for(let e=0;e<Yo.length;e++)r[Yo[e]]=t.result[e];this.batch.resolve(r),n()})()}serves(e){return typeof e==`string`&&Yo.includes(e)&&this.batch!==null}async lookup(e){return this.init&&this.init.resolve(),(await this.batch.promise)[e]}},$o=1e3,es=new WeakMap,ts=(e,t,n)=>{let r=es.get(e)??es.set(e,new Set).get(e);if(!r.has(t)){r.add(t);try{console.warn(`puter.kv.list: ${n}`)}catch{}}},ns=e=>{if(typeof e!=`string`)return;let t=e.trim();if(t!==``){if(t.endsWith(`*`)){let e=t.slice(0,-1);return e===``?void 0:e}return t}};function rs(e,t,n){let r={},i,a=!1,o=!1,s,c=!1,l=!1;if(H(e)&&t===void 0&&n===void 0){let t=e;if(t.reverse!==void 0){if(typeof t.reverse!=`boolean`)throw{message:`reverse must be a boolean`,code:`invalid_request`};r.reverse=t.reverse}if(typeof t.pattern==`string`&&(i=t.pattern),a=!!t.returnValues,o=t.stream===!0,H(t.optConfig))r.optConfig=t.optConfig;else if(Ao(t)){if(o){let e={...t};delete e.stream,r.optConfig=e}else r.optConfig=t}for(let e of[`limit`,`cursor`,`offset`,`includeTotal`,`fetchUntilFull`])t[e]!==void 0&&(r[e]=t[e],l=!0);s=t.cursor,c=t.includeTotal===!0}else typeof e==`string`?i=e:e===!0&&(a=!0),t===!0?a=!0:H(t)&&(r.optConfig=t),H(n)&&(r.optConfig=n);a||(r.as=`keys`);let u=ns(i);u&&(r.pattern=u),c&&ts(this,`includeTotal`,"`includeTotal` runs a metered count over every key matching the query, so its cost grows with the store. Request the total once — on the first page — and avoid it in hot paths; to know whether more pages exist, check for `cursor` instead.");let d=T({iface:`puter-kvstore`,method:`list`,puter:this.puter,readonly:!0});if(o){if(r.offset!==void 0)throw{message:"`offset` cannot be combined with `stream`; pass `cursor` to resume from a position.",code:`invalid_request`};let e={...r};return delete e.cursor,delete e.includeTotal,e.limit===void 0&&(e.limit=$o,e.fetchUntilFull=!0),A(t=>d({...e,...t}),{cursor:s,includeTotal:c})}return l?d(r):Gt(e=>(e.cursor!==null&&ts(this,`unbound-scan`,"a full listing spanned multiple pages; unbounded scans are metered and get slower as the store grows. Prefer `stream: true`, `limit`/`cursor` pages, or a narrower `pattern`."),d({...r,limit:$o,fetchUntilFull:!0,...e})))}async function is(e,...t){if(t.length===0)throw{message:`At least one path is required`,code:`arguments_required`};let n=[...t],r;if(H(n[n.length-1])&&(r=n.pop()),Array.isArray(n[0])&&n.length===1)throw{message:`Paths must be provided as separate arguments`,code:`paths_invalid`};if(U(e),W(e),n.length===0)throw{message:`At least one path is required`,code:`arguments_required`};if(n.some(e=>typeof e!=`string`))throw{message:`All paths must be strings`,code:`paths_invalid`};return await T({iface:`puter-kvstore`,method:`remove`,argNames:[`key`,`paths`],puter:this.puter})({key:e,paths:n,optConfig:r})}var as=(e,t)=>T({iface:`puter-kvstore`,method:`set`,argNames:[`key`,`value`,`expireAt`],puter:e,preprocess:e=>(U(e.key),W(e.key),Lo(e.value),e)})(t),os=(e,t)=>T({iface:`puter-kvstore`,method:`batchPut`,argNames:[`items`],puter:e,preprocess:e=>{if(!Array.isArray(e.items)||e.items.length===0)throw{message:`Items are required`,code:`items_required`};let t=e.items.map(e=>{if(!jo(e))throw{message:`Each item must include a key`,code:`invalid_item`};let t=String(e.key);if(t.length===0)throw{message:`Key cannot be undefined`,code:`key_undefined`};return W(t),Lo(e.value),{key:t,value:e.value,...e.expireAt===void 0?{}:{expireAt:e.expireAt}}});return{...e,items:t}}})(t);async function ss(e,t,...n){let{puter:r}=this;if(Array.isArray(e)){let{optConfig:i,success:a,error:o}=Mo([t,...n]);return await os(r,{items:e,optConfig:i,success:a,error:o})}if(H(e)&&t===void 0&&n.length===0)return Array.isArray(e.items)?await os(r,e):await as(r,e);let i;(typeof n[0]==`number`||n[0]===null)&&(i=n.shift());let{optConfig:a,success:o,error:s}=Mo(n);return await as(r,{key:e,value:t,expireAt:i,optConfig:a,success:o,error:s})}var cs=(e,t)=>T({iface:`puter-kvstore`,method:`update`,argNames:[`key`,`pathAndValueMap`,`ttl`],puter:e,preprocess:e=>{if(U(e.key),W(e.key),e.pathAndValueMap===void 0||e.pathAndValueMap===null||Array.isArray(e.pathAndValueMap)||typeof e.pathAndValueMap!=`object`)throw{message:`pathAndValueMap must be an object`,code:`path_map_invalid`};if(Object.keys(e.pathAndValueMap).length===0)throw{message:`pathAndValueMap cannot be empty`,code:`path_map_invalid`};if(e.ttl!==void 0&&e.ttl!==null){let t=Number(e.ttl);if(Number.isNaN(t))throw{message:`ttl must be a number`,code:`ttl_invalid`};e.ttl=t}return e}})(t);async function ls(e,t,...n){let{puter:r}=this;if(H(e)&&t===void 0&&n.length===0)return await cs(r,e);let i;(typeof n[0]==`number`||n[0]===null)&&(i=n.shift());let{optConfig:a,success:o,error:s}=Mo(n);return await cs(r,{key:e,pathAndValueMap:t,ttl:i,optConfig:a,success:o,error:s})}var us=class extends D{guiCache;MAX_KEY_SIZE=Fo;MAX_VALUE_SIZE=Io;set=ss;get=qo;del=Vo;incr=Jo;decr=zo;add=Ro;remove=is;update=ls;expire=Ho;expireAt=Uo;list=rs;flush=Go;clear=Go;constructor(e){super(e),this.guiCache=new Qo(e);let t=this;for(let e of[`set`,`get`,`del`,`incr`,`decr`,`add`,`remove`,`update`,`expire`,`expireAt`,`list`,`flush`])t[e]=t[e].bind(this);this.clear=this.flush}},ds=class{#e;#t;constructor(e){this.#e=e,this.#t=(()=>{let e=new Map;for(let t of this.#e)e[t]=[];return e})()}emit(e,t){if(!this.#e.includes(e)){console.error(`Event name '${e}' not supported`);return}this.#t[e].forEach(e=>{e(t)})}on(e,t){if(!this.#e.includes(e)){console.error(`Event name '${e}' not supported`);return}return this.#t[e].push(t),this}off(e,t){if(!this.#e.includes(e)){console.error(`Event name '${e}' not supported`);return}let n=this.#t[e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),this}},fs=new TextDecoder,ps=new TextEncoder,ms={1:`Reason unspecified or unknown. Returning a more specific reason should be preferred.`,3:`Unexpected stream closure due to a network error.`,65:`Stream creation failed due to invalid information. This could be sent if the destination was a reserved address or the port is invalid.`,66:`Stream creation failed due to an unreachable destination host. This could be sent if the destination is an domain which does not resolve to anything.`,67:`Stream creation timed out due to the destination server not responding.`,68:`Stream creation failed due to the destination server refusing the connection.`,71:`TCP data transfer timed out.`,72:`Stream destination address/domain is intentionally blocked by the proxy server.`,73:`Connection throttled by the server.`};function hs(e){let t=new DataView(e.buffer,e.byteOffset),n=t.getUint8(0),r=t.getUint32(1,!0);switch(n){case 1:return{packetType:n,streamID:r,streamType:t.getUint8(5),port:t.getUint16(6,!0),hostname:fs.decode(e.subarray(8,e.length))};case 2:return{packetType:n,streamID:r,payload:e.subarray(5,e.length)};case 3:return{packetType:n,streamID:r,remainingBuffer:t.getUint32(5,!0)};case 4:return{packetType:n,streamID:r,reason:t.getUint8(5)};case 5:let i={};i.version_major=t.getUint8(5),i.version_minor=t.getUint8(6);let a=7;for(;a<e.length;){let n=t.getUint8(a),r=t.getUint32(a+1,!0);i[n]=e.subarray(a+5,a+5+r),a+=5+r}return{packetType:n,streamID:r,infoObj:i}}}function gs(e){let t=5;switch(e.packetType){case 1:e.hostEncoded=ps.encode(e.hostname),t+=3+e.hostEncoded.length;break;case 2:t+=e.payload.byteLength;break;case 3:t+=4;break;case 4:t+=1;break;case 5:t+=2,e.password&&(t+=6),e.puterAuth&&(e.passwordEncoded=ps.encode(e.puterAuth),t+=8+e.passwordEncoded.length);break;default:throw Error(`Not supported`)}let n=new Uint8Array(t),r=new DataView(n.buffer);switch(r.setUint8(0,e.packetType),r.setUint32(1,e.streamID,!0),e.packetType){case 1:r.setUint8(5,e.streamType),r.setUint16(6,e.port,!0),n.set(e.hostEncoded,8);break;case 2:n.set(e.payload,5);break;case 3:r.setUint32(5,e.remainingBuffer,!0);break;case 4:r.setUint8(5,e.reason);break;case 5:r.setUint8(5,2),r.setUint8(6,0),e.password&&(r.setUint8(7,2),r.setUint32(8,1,!0),r.setUint8(12,0)),e.puterAuth&&(r.setUint8(7,2),r.setUint32(8,5+e.passwordEncoded.length,!0),r.setUint8(12,0),r.setUint16(13,e.passwordEncoded.length,!0),n.set(e.passwordEncoded,15))}return n}var _s=class{_ws;_nextStreamID=1;_bufferMax;_ready=!1;onReady=void 0;onError=void 0;streamMap=new Map;constructor(e,t){let n=()=>{this._ws=new WebSocket(e),this._ws.binaryType=`arraybuffer`,this._ws.onerror=()=>{this._fail(Error(`Wisp relay connection failed: ${e}`))},this._ws.onclose=()=>{if(this._ready){setTimeout(n,1e3);return}this._fail(Error(`Wisp relay closed before the handshake completed`))},this._ws.onmessage=e=>{let n=hs(new Uint8Array(e.data));switch(n.packetType){case 2:this.streamMap.get(n.streamID).dataCallBack(n.payload.slice(0));break;case 3:if(n.streamID===0){this._bufferMax=n.remainingBuffer,this._ready=!0,this.onReady&&this.onReady();return}this.streamMap.get(n.streamID).buffer=n.remainingBuffer,this._continue(n.streamID);break;case 4:n.streamID!==0&&this.streamMap.get(n.streamID).closeCallBack(n.reason);break;case 5:t&&this._ws.send(gs({packetType:5,streamID:0,puterAuth:t}))}}};n()}_fail(e){let t=this.onError;this.onError=void 0,t&&t(e)}_continue(e){let t=this.streamMap.get(e).queue;for(let n=0;n<t.length;n++)this.write(e,t.shift())}register(e,t,n){let r=this._nextStreamID++;return this.streamMap.set(r,{queue:[],streamID:r,buffer:this._bufferMax,dataCallBack:n.dataCallBack,closeCallBack:n.closeCallBack}),this._ws.send(gs({packetType:1,streamType:1,streamID:r,hostname:e,port:t})),r}write(e,t){let n=this.streamMap.get(e);n.buffer>0?(n.buffer--,this._ws.send(gs({packetType:2,streamID:e,payload:t}))):n.queue.push(t)}close(e){this._ws.send(gs({packetType:4,streamID:e,reason:2}))}},vs=new TextEncoder,ys=!0,G={server:`wss://puter.cafe/`,handler:void 0},bs=class extends ds{_events=new Map;_streamID;constructor(e,t){super([`data`,`drain`,`open`,`error`,`close`,`tlsdata`,`tlsopen`,`tlsclose`]),(async()=>{if(!puter.authToken&&puter.env===`web`&&ys)try{await puter.ui.authenticateWithPuter()}catch(e){throw e}if(!G.handler){let{token:e,server:t}=await(await x(`${puter.APIOrigin}/wisp/relay-token/create`,{method:`POST`,includePuterAuth:!!puter.authToken,headers:{"Content-Type":`application/json`},body:JSON.stringify({})})).json();G.handler=new _s(t,e);try{await new Promise((e,t)=>{G.handler.onReady=e,G.handler.onError=t})}catch(e){throw G.handler=void 0,e}}let n={dataCallBack:e=>{this.emit(`data`,e)},closeCallBack:e=>{if(e!==2){this.emit(`error`,Error(ms[e])),this.emit(`close`,!0);return}this.emit(`close`,!1)}};this._streamID=G.handler.register(e,t,n),setTimeout(()=>{this.emit(`open`,void 0)},0)})().catch(e=>{this.emit(`error`,e instanceof Error?e:Error(String(e))),this.emit(`close`,!0)})}addListener(...e){this.on(...e)}write(e,t){if(e.buffer)G.handler.write(this._streamID,e),t&&t();else if(e.resize)G.handler.write(this._streamID,new Uint8Array(e)),t&&t();else if(typeof e==`string`)G.handler.write(this._streamID,vs.encode(e)),t&&t();else throw Error(`Invalid data type (not TypedArray, ArrayBuffer or String!!)`)}close(){G.handler.close(this._streamID)}},xs=void 0,Ss=class extends bs{constructor(...e){super(...e),super.on(`open`,(async()=>{xs||(globalThis.ReadableByteStreamController||await r(()=>import(`https://unpkg.com/web-streams-polyfill@3.0.2/dist/polyfill.js`),[]),xs=await r(()=>import(`https://puter-net.b-cdn.net/rustls.js`),[]),await xs.default(`https://puter-net.b-cdn.net/rustls.wasm`));let t=!1,n=new ReadableStream({start:e=>{super.on(`data`,t=>{e.enqueue(t.buffer)}),super.on(`close`,()=>{t||e.close()})},pull:e=>{},cancel:()=>{t=!0}}),i=new WritableStream({write:e=>{super.write(e)},abort:()=>{super.close()},close:()=>{super.close()}}),a,o;try{let t=await xs.connect_tls(n,i,e[0]);a=t.read,o=t.write}catch(e){this.emit(`error`,Error(`TLS Handshake failed: ${e}`));return}this.writer=o.getWriter();let s=a.getReader(),c=!1;this.emit(`tlsopen`,void 0);try{for(;!c;){let{done:e,value:t}=await s.read();c=e,c||this.emit(`tlsdata`,t)}this.emit(`tlsclose`,!1)}catch(e){this.emit(`error`,e),this.emit(`tlsclose`,!0)}}))}on(e,t){return e===`data`||e===`open`||e===`close`?super.on(`tls${e}`,t):super.on(e,t)}write(e,t){if(e.buffer)this.writer.write(e.slice(0).buffer).then(t);else if(e.resize)this.writer.write(e).then(t);else if(typeof e==`string`)this.writer.write(e).then(t);else throw Error(`Invalid data type (not TypedArray, ArrayBuffer or String!!)`)}};function Cs(...e){let t=e.reduce((e,t)=>e+t.length,0),n=new Uint8Array(t);return e.forEach((e,t,r)=>{let i=r.slice(0,t).reduce((e,t)=>e+t.length,0);n.set(e,i)}),n}function ws(e){let t=e.split(`\r
`),n=t.shift().split(` `),r=Number(n[1]),i=n.slice(2).join(` `)||``,a=[];for(let e of t){let t=e.split(`: `),n=t[0],r=t.slice(1).join(`: `);a.push([n,r])}return{headers:new Headers(a),statusText:i,status:r}}function Ts(...e){return new Promise(async(t,n)=>{let r;try{r=new Request(...e);let i=new URL(r.url),a=new Headers(r.headers),o;if(i.protocol===`http:`)o=new puter.net.Socket(i.hostname,i.port||80);else if(i.protocol===`https:`)o=new puter.net.tls.TLSSocket(i.hostname,i.port||443);else{let e=`Failed to fetch. URL scheme "${i.protocol}" is not supported.`;globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({service:`network`,operation:`pFetch`,params:{url:r.url,method:r.method},error:{message:e}}),n(e);return}if(!a.get(`user-agent`)){let e=globalThis.navigator?.userAgent;e&&a.set(`user-agent`,e)}let s=`${r.method} ${i.pathname}${i.search} HTTP/1.1\r\nHost: ${i.host}\r\nConnection: close\r\n`;for(let[e,t]of a)s+=`${e}: ${t}\r\n`;let c;if(r.body){if(c=new Uint8Array(await r.arrayBuffer()),!a.has(`content-length`))a.set(`content-length`,c.length);else if(a.get(`content-length`)!==String(c.length))return n(`Content-Length header does not match the body length. Please check your request.`);s+=`Content-Length: ${c.length}\r\n`}s+=`\r
`,o.on(`open`,async()=>{o.write(s),c&&o.write(c)});let l=new TextDecoder,u=``,d=-1,f=[],p=!1,m=-1,h=0,g=!1,_=-1,v=new Uint8Array,y=new ReadableStream({start(e){function i(t){let n=new Uint8Array(v.length+t.length);for(n.set(v,0),n.set(t,v.length),v=n;;)if(_>0){if(v.length>=_+2){let t=v.slice(0,_);e.enqueue(t),v=v.slice(_+2),_=0}else{e.enqueue(v),_-=v.length,v=new Uint8Array;break}}else{let t=-1;for(let e=0;e+1<v.length;e++)if(v[e]===13&&v[e+1]===10){t=e;break}if(t<0)break;let n=l.decode(v.slice(0,t)).trim();if(_=parseInt(n,16),isNaN(_)&&e.error(`Invalid chunk length from server`),v=v.slice(t+2),_===0){p=!0,e.close();return}}}o.on(`data`,n=>{if(d!==-1&&!g&&(e.enqueue(n),h+=n.length),d===-1&&(f.push(n),u+=l.decode(n,{stream:!0})),g&&i(n),u.indexOf(`\r
\r
`)!==-1){d=u.indexOf(`\r
\r
`),u=u.slice(0,d);let n=ws(u);m=Number(n.headers.get(`content-length`)),g=n.headers.get(`transfer-encoding`)===`chunked`,globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({service:`network`,operation:`pFetch`,params:{url:r.url,method:r.method},result:{status:n.status,statusText:n.statusText}}),t(new Response(y,n));let a=Cs(...f).slice(d+4);g?i(a):(h+=a.length,e.enqueue(a))}m!==-1&&h===m&&!g&&(p||(p=!0,e.close()))}),o.on(`close`,()=>{p||(p=!0,e.close())}),o.on(`error`,e=>{globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({service:`network`,operation:`pFetch`,params:{url:r.url,method:r.method},error:{message:`Socket errored with the following reason: ${e}`}}),n(`Socket errored with the following reason: ${e}`)})}})}catch(e){globalThis.puter?.apiCallLogger?.isEnabled()&&globalThis.puter.apiCallLogger.logRequest({service:`network`,operation:`pFetch`,params:{url:r?.url,method:r?.method},error:{message:e?.message||String(e),stack:e?.stack}}),n(e)}})}var Es=e=>typeof e[0]==`object`&&e[0]!==null?e[0]:{success:e[0],error:e[1]},Ds=1e3;function Os(...e){let{puter:t}=this,n=Es(e),r=``;return n?.query&&(r=`?${new URLSearchParams(n.query).toString()}`),xe(`os:user:${t.APIOrigin}:${t.authToken}:${r}`,()=>new Promise((e,n)=>{let i=Qe(`/whoami${r}`,t.APIOrigin,t.authToken,`get`);w(i,void 0,void 0,e,n),i.send()}),{windowMs:Ds}).then(e=>(n.success?.(e),e),e=>{throw n.error?.(e),e})}function ks(...e){let{puter:t}=this,n=Es(e);return new Promise((e,r)=>{let i=Qe(`/version`,t.APIOrigin,t.authToken,`get`);w(i,n.success,n.error,e,r),i.send()})}var As=class extends D{user=Os;version=ks;constructor(e){super(e);let t=this;for(let e of[`user`,`version`])t[e]=t[e].bind(this)}},js=[`Desktop`,`Documents`,`Pictures`,`Videos`],K=e=>new k(e,`invalid_argument`),Ms=e=>{if(e!==`read`&&e!==`write`)throw K("access must be `read` or `write`");return e},Ns=e=>{if(typeof e!=`string`||!js.includes(e))throw K(`folder name must be one of: ${js.join(`, `)}`);return e},Ps={read:[`get`,`list`],write:[`set`,`add`,`incr`,`decr`,`update`],delete:[`del`,`remove`,`expire`,`expireAt`]},Fs=[`read`,`write`,`delete`],Is=Object.values(Ps).flat(),Ls=[`flush`],Rs=/^app-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,zs=K,Bs=(e,t)=>{if(e==null)return[];let n=Array.isArray(e)?e:[e];for(let e of n){if(typeof e!=`string`||e===``)throw zs(`${t} scopes must be non-empty strings`);if(t===`kv`&&Ls.includes(e))throw zs(`kv:${e} cannot be granted to another app`);if(!(t===`kv`?[...Is,...Object.keys(Ps)]:Fs).includes(e))throw zs(`unknown ${t} scope: ${e}`)}return[...new Set(n)]},Vs=e=>{let t=new Set(e),n=[];for(let[e,r]of Object.entries(Ps)){if(t.has(e)){n.push(e);for(let e of r)t.delete(e);t.delete(e);continue}if(r.every(e=>t.has(e))){n.push(e);for(let e of r)t.delete(e)}}return[...n,...t]};function Hs(e,t){let n=Vs(Bs(t.kv,`kv`)),r=Bs(t.fs,`fs`);if(n.length===0&&r.length===0)throw zs("at least one `kv` or `fs` scope is required");let i=Object.keys(Ps).every(e=>n.includes(e)),a=Fs.every(e=>r.includes(e));if(i&&a)return[`app-data:${e}`];let o=[];if(i)o.push(`app-data:${e}:kv`);else for(let t of n)o.push(`app-data:${e}:kv:${t}`);if(a)o.push(`app-data:${e}:fs`);else for(let t of r)o.push(`app-data:${e}:fs:${t}`);return o.sort()}var Us=e=>{if(typeof e==`string`)return{kv:e,fs:e};if(Array.isArray(e)){let t={kv:[],fs:[]};for(let n of e){if(typeof n!=`string`||!n.includes(`:`))throw zs(`scope must look like "kv:get" or "fs:read": ${n}`);let[e,r]=n.split(`:`);if(e!==`kv`&&e!==`fs`)throw zs(`unknown store: ${e}`);t[e].push(r)}return t}if(e&&typeof e==`object`)return e;throw zs(`scopes must be a string, an array, or an object`)};async function Ws(e,t,n){let r=typeof t==`object`&&t?t.uid??t.name:t;if(typeof r!=`string`||r===``)throw zs(`parameter appIdentifier must be a non-empty string`);let i=Rs.test(r)?r:(await e.apps.get(r))?.uid;if(typeof i!=`string`||i===``)throw new k(`app not found: ${r}`,`not_found`);return i===e.appID?[]:Hs(i,Us(n))}async function Gs(e,t){let n=await Ws(this.puter,e,t);return n.length===0||await this.puter.ui.requestPermission({permissions:n})}var Ks=e=>`user:${e}:email:read`,qs=(e,t)=>`apps-of-user:${e}:${t}`,Js=(e,t)=>`subdomains-of-user:${e}:${t}`,Ys=(e,t)=>`fs:${e}:${t}`,Xs=(e,t)=>`app-root-dir:${e}:${t}`;async function q(e,t,n){try{let r=await x(e.APIOrigin+t,{method:n?`POST`:`GET`,includePuterAuth:!0,headers:{"Content-Type":`application/json`},...n?{body:JSON.stringify(n)}:{}});if(r.headers.get(`content-type`)?.includes(`application/json`)){let e=await r.json();return r.status!==200&&(e.error=!0),e}return{error:!0,message:await r.text(),code:`unknown_error`}}catch(e){return{error:!0,message:e.message,code:`internal_error`}}}var Zs=`/auth/request-app-root-dir`,Qs=5e3,$s=100;function ec(e){let t=typeof e==`object`&&e?e.uid:e;if(typeof t!=`string`)throw K(`parameter app_uid must be a string`);return t}async function tc(e,t,n){return await q(e,Zs,{app_uid:t,access:n})}async function nc(e,t,n){let r=await q(e,Zs,{app_uid:t,access:n,check:!0});if(!r.error)return!0;if(r.code===`forbidden`)return!1;throw new k(r.message??`app root dir check failed`,r.code??`unknown_error`)}async function rc(e,t,n){let r=await tc(e,t,n),i=$s,a=0;for(;r.error&&a<Qs;)await new Promise(e=>setTimeout(e,i)),a+=i,r=await tc(e,t,n),i=Math.min(i*2,Math.max($s,Qs-a));return r.error?void 0:r}async function ic(e,t,n){let r=ec(n),i=await tc(e,r,t);if(!i.error)return i;if(await e.ui.requestPermission({permission:Xs(r,t)}))return await rc(e,r,t)}function ac(e){return ic(this.puter,`read`,e)}function oc(e){return ic(this.puter,`write`,e)}function sc(e,t){return`/${e}/${t}`}async function cc(e,t){try{return await e.fs.stat({path:t}),!0}catch{return!1}}async function J(e,t,n){let r=sc((await e.auth.whoami()).username,t);return n!==`write`&&await cc(e,r)||await e.ui.requestPermission({permission:Ys(r,n)})?r:void 0}function lc(e,t){return J(this.puter,e,t)}function uc(){return J(this.puter,`Desktop`,`read`)}function dc(){return J(this.puter,`Desktop`,`write`)}function fc(){return J(this.puter,`Documents`,`read`)}function pc(){return J(this.puter,`Documents`,`write`)}function mc(){return J(this.puter,`Pictures`,`read`)}function hc(){return J(this.puter,`Pictures`,`write`)}function gc(){return J(this.puter,`Videos`,`read`)}function _c(){return J(this.puter,`Videos`,`write`)}async function vc(e,t){return await q(this.puter,`/auth/grant-user-app`,{app_uid:e,permission:t})}async function yc(e,t){return await q(this.puter,`/auth/grant-dev-app`,{app_uid:e,permission:t})}async function bc(e,t){return await q(this.puter,`/auth/grant-user-app`,{origin:e,permission:t})}async function xc(e,t){return await q(this.puter,`/auth/revoke-user-app`,{app_uid:e,permission:t})}async function Sc(e,t){return await q(this.puter,`/auth/revoke-dev-app`,{app_uid:e,permission:t})}async function Cc(e,t){return await q(this.puter,`/auth/revoke-user-app`,{origin:e,permission:t})}async function wc(e,t,n){let r=t.length===1?{permission:t[0]}:{permissions:t};return await e.ui.requestPermission(n?{...r,create:n}:r)}async function Tc(e,t){return await wc(e,[qs((await e.auth.whoami()).uuid,t)])}async function Ec(e,t){return await wc(e,[Js((await e.auth.whoami()).uuid,t)])}function Dc(...e){return this.request(...e)}async function Oc(){let e=await this.puter.auth.whoami();if(e.email!==void 0)return e.email;if(await this.puter.ui.requestPermission({permission:Ks(e.uuid)}))return e=await this.puter.auth.whoami(),e.email}function kc(){return Tc(this.puter,`read`)}function Ac(){return Tc(this.puter,`write`)}function jc(){return Ec(this.puter,`read`)}function Mc(){return Ec(this.puter,`write`)}async function Nc(e,t){let n=await q(e,`/auth/check-permissions`,{permissions:t});if(n.error)throw new k(n.message??`permission check failed`,n.code??`unknown_error`);return n.permissions??{}}var Pc=e=>{let t;return{puter:e,whoami:()=>t??=e.auth.whoami(),reread:()=>t=e.auth.whoami()}},Fc=e=>Ms(e.access??`read`),Ic=e=>Ns(e.name),Lc=e=>{let{permission:t,permissions:n,create:r}=e;if(r!==void 0&&r!==!0&&r!==!1&&r!==`dir`&&r!==`file`)throw K('`create` must be true, false, "dir", or "file"');if(n!==void 0){if(t!==void 0)throw K("pass `permission` or `permissions`, not both");if(!Array.isArray(n)||n.length===0)throw K("`permissions` must be a non-empty array");for(let e of n)if(typeof e!=`string`||e===``)throw K("`permissions` entries must be non-empty strings");return[...new Set(n)]}if(typeof t!=`string`||t===``)throw K("`permission` must be a non-empty string");return[t]},Rc=Object.assign(Object.create(null),{email:{permissions:async({ctx:e})=>[Ks((await e.whoami()).uuid)],check:async({ctx:e,permissions:t,holds:n})=>(await e.whoami()).email!==void 0||n(t),resolve:async({ctx:e},t)=>{if(!t)return;let n=await e.whoami();return n.email===void 0?(await e.reread()).email:n.email}},folder:{permissions:async({ctx:e,details:t})=>[Ys(sc((await e.whoami()).username,Ic(t)),Fc(t))],check:async({ctx:e,details:t,permissions:n,holds:r})=>{if(Fc(t)!==`write`){let n=sc((await e.whoami()).username,Ic(t));if(await cc(e.puter,n))return!0}return r(n)},resolve:async({ctx:e,details:t},n)=>{if(n)return sc((await e.whoami()).username,Ic(t))}},apps:{permissions:async({ctx:e,details:t})=>[qs((await e.whoami()).uuid,Fc(t))],check:async({permissions:e,holds:t})=>t(e),resolve:async(e,t)=>t},subdomains:{permissions:async({ctx:e,details:t})=>[Js((await e.whoami()).uuid,Fc(t))],check:async({permissions:e,holds:t})=>t(e),resolve:async(e,t)=>t},appData:{permissions:({ctx:e,details:t})=>Ws(e.puter,t.app,t.scopes),check:async({permissions:e,holds:t})=>e.length===0||t(e),resolve:async(e,t)=>t},appRootDir:{permissions:async({details:e})=>[Xs(ec(e.app),Fc(e))],pooled:!1,check:async({ctx:e,details:t,prompt:n,scratch:r})=>{let i=ec(t.app),a=Fc(t);if(!n)return await nc(e.puter,i,a);let o=await tc(e.puter,i,a);return!o.error&&(r.entry=o,!0)},resolve:async({ctx:e,details:t,scratch:n},r)=>{if(r)return n.entry?n.entry:await rc(e.puter,ec(t.app),Fc(t))}},permission:{permissions:async({details:e})=>Lc(e),check:async({permissions:e,holds:t})=>t(e),resolve:async(e,t)=>t}}),zc=Object.keys(Rc),Bc=(e,t)=>{if(typeof e!=`string`||e===``)throw K(`resource must be a non-empty string`);if(t!==void 0&&(typeof t!=`object`||!t||Array.isArray(t)))throw K(`details must be an object`);if(Rc[e])return{resource:e,details:t??{}};if(t!==void 0)throw K(`unknown resource: ${e} (expected one of: ${zc.join(`, `)})`);return{resource:`permission`,details:{permission:e}}},Vc=(e,t)=>{if(typeof e!=`object`||!e||Array.isArray(e))throw K(`requests[${t}] must be an object`);let{resource:n,...r}=e;if(typeof n!=`string`||n===``)throw K(`requests[${t}].resource must be a non-empty string`);if(!Rc[n])throw K(`requests[${t}]: unknown resource: ${n} (expected one of: ${zc.join(`, `)})`);return{resource:n,details:r}};function Hc(e,t){let n=[...new Set(t)],r;return async t=>{if(t.length===0||n.length===0)return!1;let i=await(r??=Nc(e.puter,n));return t.every(e=>i[e]===!0)}}async function Uc(e,t,n){let r=await Promise.all(t.map(({resource:t,details:n})=>Rc[t].permissions({ctx:e,details:n}))),i=[...new Set(t.filter(({resource:e})=>e===`permission`).map(({details:e})=>e.create).filter(Boolean))];if(i.length>1)throw K("conflicting `create` values in one request");let a=i[0],o=Hc(e,t.flatMap(({resource:e},t)=>Rc[e].pooled===!1?[]:r[t])),s=t.map(()=>({})),c=await Promise.all(t.map(async({resource:t,details:i},a)=>{try{return await Rc[t].check({ctx:e,details:i,permissions:r[a],holds:o,prompt:n,scratch:s[a]})}catch(e){if(!n)throw e;return!1}}));if(!n)return c;let l=[...new Set(t.flatMap((e,t)=>c[t]?[]:r[t]))],u=l.length===0||await wc(e.puter,l,a);return await Promise.all(t.map(({resource:t,details:n},i)=>Rc[t].resolve({ctx:e,details:n,scratch:s[i]},c[i]||r[i].length>0&&u)))}var Wc=(e,t)=>{if(!Array.isArray(e))return[Bc(e,t)];if(t!==void 0)throw K(`a batch takes no second argument`);return e.map(Vc)};async function Gc(e,t){let n=Wc(e,t),r=await Uc(Pc(this.puter),n,!0);return Array.isArray(e)?r:r[0]}async function Kc(e,t){let n=Wc(e,t),r=await Uc(Pc(this.puter),n,!1);return Array.isArray(e)?r:r[0]}var qc=`grantApp.grantAppAnyUser.grantOrigin.revokeApp.revokeAppAnyUser.revokeOrigin.request.check.requestEmail.requestAppData.requestPermission.requestFolder_.requestReadDesktop.requestWriteDesktop.requestReadDocuments.requestWriteDocuments.requestReadPictures.requestWritePictures.requestReadVideos.requestWriteVideos.requestReadApps.requestManageApps.requestReadSubdomains.requestManageSubdomains.requestReadAppRootDir.requestWriteAppRootDir`.split(`.`),Jc=class extends D{grantApp=vc;grantAppAnyUser=yc;grantOrigin=bc;revokeApp=xc;revokeAppAnyUser=Sc;revokeOrigin=Cc;request=Gc;check=Kc;requestEmail=Oc;requestAppData=Gs;requestPermission=Dc;requestFolder_=lc;requestReadDesktop=uc;requestWriteDesktop=dc;requestReadDocuments=fc;requestWriteDocuments=pc;requestReadPictures=mc;requestWritePictures=hc;requestReadVideos=gc;requestWriteVideos=_c;requestReadApps=kc;requestManageApps=Ac;requestReadSubdomains=jc;requestManageSubdomains=Mc;requestReadAppRootDir=ac;requestWriteAppRootDir=oc;constructor(e){super(e);let t=this;for(let e of qc)t[e]=t[e].bind(this)}},Yc={400:`bad_request`,401:`unauthorized`,403:`permission_denied`,404:`not_found`,409:`conflict`,429:`too_many_requests`};async function Y(e,t,n,r={}){let{body:i,query:a,operation:o}=r,s=new URLSearchParams;for(let[e,t]of Object.entries(a??{}))t!=null&&s.set(e,String(t));let c=s.toString(),l;try{l=await x(e.APIOrigin+n+(c?`?${c}`:``),{method:t,includePuterAuth:!0,headers:{"Content-Type":`application/json`},...i?{body:JSON.stringify(i)}:{},logContext:{service:`teams`,operation:o??`${t} ${n}`,params:{}}})}catch(e){throw k.from(e)}let u=l.headers.get(`content-type`)?.includes(`application/json`),d=u?await l.json():await l.text();if(l.status<200||l.status>=300){let e=Yc[l.status]??`unknown_error`;if(u&&typeof d==`object`&&d){let t=k.from(d);throw t.code===void 0&&(t.code=e),t}throw new k(typeof d==`string`&&d?d:`Request failed with status ${l.status}`,e)}return d}function X(e,t){if(typeof e!=`string`||e.trim()===``)throw new k(`\`${t}\` is required`,`invalid_request`);return encodeURIComponent(e)}function Xc(e){return{uid:e.uid,name:e.name??null,handle:e.handle??null,isOwner:e.is_owner===!0,directoryEnabled:e.directory_enabled===!0,createdAt:e.created_at}}function Zc(e){return{username:e.username,uuid:e.uuid}}function Qc(e){return{username:e.username,orgOwned:e.org_owned===!0,createdAt:e.created_at}}function $c(e){return{action:e.action,reason:e.reason??null,username:e.username??null,actorUsername:e.actor_username??null,createdAt:e.created_at}}function el(e,t){if(typeof e==`object`&&e&&Symbol.asyncIterator in e){let n=e;return(async function*(){for await(let e of n)yield{...e,items:(e.items??[]).map(t)}})()}return Promise.resolve(e).then(e=>{if(Array.isArray(e))return e.map(t);let n=e;return{...n,items:(n?.items??[]).map(t)}})}async function tl(e){if(typeof e?.name!=`string`||e.name.trim()===``)throw new k("`name` is required",`invalid_request`);let t={name:e.name};return e.handle!==void 0&&(t.handle=e.handle),Xc(await Y(this.puter,`POST`,`/teams`,{body:t,operation:`create`}))}async function nl(e,t){let n=X(e,`uid`);if(typeof t?.username!=`string`||t.username.trim()===``)throw new k("`username` is required",`invalid_request`);if(typeof t?.email!=`string`||t.email.trim()===``)throw new k("`email` is required",`invalid_request`);let r=await Y(this.puter,`POST`,`/teams/${n}/members`,{body:{username:t.username,email:t.email},operation:`createMember`});return{username:r.username,temporaryPassword:r.temporary_password}}async function rl(e){let t=X(e,`uid`);await Y(this.puter,`DELETE`,`/teams/${t}`,{operation:`delete`})}async function il(e,t){let n=X(e,`uid`),r=X(t,`username`);await Y(this.puter,`DELETE`,`/teams/${n}/members/${r}`,{operation:`deleteMemberAccount`})}async function al(e,t){let n=X(e,`uid`),r=X(t,`username`);await Y(this.puter,`POST`,`/teams/${n}/members/${r}/disable`,{operation:`disableMember`})}async function ol(e,t){let n=X(e,`uid`),r=X(t,`username`);await Y(this.puter,`POST`,`/teams/${n}/members/${r}/enable`,{operation:`enableMember`})}async function sl(e){let t=X(e,`uid`);return Xc(await Y(this.puter,`GET`,`/teams/${t}`,{operation:`get`}))}function cl(e,t,n,r){let i=typeof n==`object`&&n?n:{},{limit:a,offset:o,cursor:s,includeTotal:c,stream:l}=i,u=Object.prototype.hasOwnProperty.call(i,`cursor`);if(o!==void 0)throw new k("`offset` is not supported here; pass `cursor` to resume from a position.",`invalid_request`);let d=e=>Array.isArray(e)?{items:e}:e??{items:[]},f=n=>Y(e,`GET`,t,{query:{limit:a,...n},operation:r});return l===!0?A(f,{cursor:s,includeTotal:c===!0}):u||c!==void 0?(async()=>d(await Y(e,`GET`,t,{query:{limit:a,...u?{cursor:s}:{},...c===void 0?{}:{includeTotal:c}},operation:r})))():a===void 0?Gt(f):(async()=>d(await f({cursor:null})).items)()}function ll(e){return el(cl(this.puter,`/teams`,e,`list`),Xc)}function ul(e,t){let n=X(e,`uid`);return el(cl(this.puter,`/teams/${n}/audit`,t,`listAudit`),$c)}function dl(e,t){let n=X(e,`uid`);return el(cl(this.puter,`/teams/${n}/directory`,t,`listDirectory`),Zc)}function fl(e,t){let n=X(e,`uid`);return el(cl(this.puter,`/teams/${n}/members`,t,`listMembers`),Qc)}function pl(e,t){let n=X(e,`uid`);return el(cl(this.puter,`/teams/${n}/audit/me`,t,`listOwnAudit`),$c)}async function ml(e,t){let n=X(e,`uid`),r=X(t,`username`);return{username:t,temporaryPassword:(await Y(this.puter,`POST`,`/teams/${n}/members/${r}/activation`,{operation:`resendActivation`})).temporary_password}}async function hl(e,t){let n=X(e,`uid`),r=X(t,`username`);return{username:t,temporaryPassword:(await Y(this.puter,`POST`,`/teams/${n}/members/${r}/password-reset`,{operation:`resetPassword`})).temporary_password}}async function gl(e,t){let n=X(e,`uid`),r={};return t?.name!==void 0&&(r.name=t.name),t?.handle!==void 0&&(r.handle=t.handle),t?.directoryEnabled!==void 0&&(r.directory_enabled=t.directoryEnabled),Xc(await Y(this.puter,`PUT`,`/teams/${n}`,{body:r,operation:`update`}))}var _l=[`create`,`list`,`get`,`update`,`delete`,`listMembers`,`createMember`,`resendActivation`,`disableMember`,`enableMember`,`resetPassword`,`deleteMemberAccount`,`listAudit`,`listOwnAudit`,`listDirectory`],vl=class extends D{create=tl;list=ll;get=sl;update=gl;delete=rl;listMembers=fl;createMember=nl;resendActivation=ml;disableMember=al;enableMember=ol;resetPassword=hl;deleteMemberAccount=il;listAudit=ul;listOwnAudit=pl;listDirectory=dl;constructor(e){super(e);let t=this;for(let e of _l)t[e]=t[e].bind(this)}},yl=()=>{let e,t;return{promise:new Promise((n,r)=>{e=n,t=r}),resolve:e,reject:t}},bl=Symbol(`FILE_SAVE_CANCELLED`),xl=Symbol(`FILE_OPEN_CANCELLED`),Sl=(e,t)=>{if(typeof DOMException==`function`)return new DOMException(t,e);let n=Error(t);return n.name=e,n},Cl=16,wl=2e3,Tl=class e extends ds{#e=`*`;#t;#n;response;static from(t,n,{messageTarget:r,appInstanceID:i}){let a=new e(n,{target:t.appInstanceID,usesSDK:t.usesSDK,messageTarget:r,appInstanceID:i});return a.response=t.response,a}constructor(e,{target:t,usesSDK:n,messageTarget:r,appInstanceID:i}){super([`message`,`close`]),this.messageTarget=r,this.appInstanceID=i,this.targetAppInstanceID=t,this.#t=!0,this.#n=n,this.log=e.logger.fields({category:`ipc`}),this.log.fields({cons_source:i,source:e.appInstanceID,target:t}).info(`AppConnection created to ${t}`,this),globalThis.document&&window.addEventListener(`message`,e=>{if(e.data.msg===`messageToApp`){if(e.data.appInstanceID!==this.targetAppInstanceID)return;if(e.data.targetAppInstanceID!==this.appInstanceID){console.error(`AppConnection received message intended for wrong app! appInstanceID=${this.appInstanceID}, target=${e.data.targetAppInstanceID}`);return}this.emit(`message`,e.data.contents);return}if(e.data.msg===`appClosed`){if(e.data.appInstanceID!==this.targetAppInstanceID)return;this.#t=!1,this.emit(`close`,{appInstanceID:this.targetAppInstanceID,statusCode:e.data.statusCode})}})}get usesSDK(){return this.#n}postMessage(e,t){let n=Array.isArray(t)?t:t?.transfer??[];if(!Array.isArray(n))throw{message:`transfer must be an array of transferable objects`,code:`invalid_transfer_list`};if(!this.#t){console.warn(`Trying to post message on a closed AppConnection`);return}if(!this.#n){console.warn(`Trying to post message to a non-SDK app`);return}this.messageTarget.postMessage({msg:`messageToApp`,appInstanceID:this.appInstanceID,targetAppInstanceID:this.targetAppInstanceID,targetAppOrigin:`*`,contents:e,transfer:n},this.#e,n)}close(){if(!this.#t){console.warn(`Trying to close an app on a closed AppConnection`);return}this.messageTarget.postMessage({msg:`closeApp`,appInstanceID:this.appInstanceID,targetAppInstanceID:this.targetAppInstanceID},this.#e)}},El=class extends ds{#e=1;itemWatchCallbackFunctions=[];appInstanceID;parentInstanceID;#t=null;#n=[];#r;#i;#a;#o=null;#s;#c=new Map;#l=!1;#u=null;#d(e,t,n={}){let r=this.#e++;this.messageTarget?.postMessage({msg:e,env:this.env,appInstanceID:this.appInstanceID,uuid:r,...n},`*`),this.#n[r]=(...e)=>{t(...e)}}#f(e,t={}){return new Promise(n=>{this.#d(e,n,t)})}#p(e,t){let n=this.util.rpc.getDehydrator({target:this.messageTarget});this.messageTarget?.postMessage({msg:e,env:this.env,appInstanceID:this.appInstanceID,value:n.dehydrate(t)},`*`)}async#m({callback:e,method:t,parameters:n}){let r,i;await new Promise(e=>{r=new Promise(t=>{i=t,e()})});let a=this.util.rpc.registerCallback(i);this.messageTarget?.postMessage({$:`puter-ipc`,v:2,appInstanceID:this.appInstanceID,env:this.env,msg:t,parameters:n,uuid:a},`*`);let o=await r;return e&&e(o),o}get authToken(){return this.puter.authToken}constructor(e,{appInstanceID:t,parentInstanceID:n}){let r=[`localeChanged`,`themeChanged`,`connection`];if(super(r),this.#s=r,this.puter=e,this.appInstanceID=t,this.parentInstanceID=n,this.appID=e.appID,this.env=e.env,this.util=e.util,this.env===`app`)this.messageTarget=window.parent;else if(this.env===`gui`)return;this.parentInstanceID&&(this.#t=new Tl(this.puter,{target:this.parentInstanceID,usesSDK:!0,messageTarget:this.messageTarget,appInstanceID:this.appInstanceID})),this.messageTarget?.postMessage({msg:`READY`,appInstanceID:this.appInstanceID},`*`),globalThis.document&&window.addEventListener(`focus`,e=>{this.messageTarget?.postMessage({msg:`windowFocused`,appInstanceID:this.appInstanceID},`*`)});let i=null;globalThis.document&&window.addEventListener(`message`,async e=>{if(e.data){if(e.data.error)throw e.data.error;if(e.data.msg&&e.data.msg===`focus`)window.focus();else if(e.data.msg&&e.data.msg===`click`){let t=document.elementFromPoint(e.data.x,e.data.y);t!==null&&t.click()}else if(e.data.msg&&e.data.msg===`drag`){let t=document.elementFromPoint(e.data.x,e.data.y);if(t!==i){if(i){let t=new Event(`dragleave`,{bubbles:!0,cancelable:!0,clientX:e.data.x,clientY:e.data.y});i.dispatchEvent(t)}if(t){let n=new Event(`dragenter`,{bubbles:!0,cancelable:!0,clientX:e.data.x,clientY:e.data.y});t.dispatchEvent(n)}i=t}}else if(e.data.msg&&e.data.msg===`drop`){if(i){let t=new CustomEvent(`drop`,{bubbles:!0,cancelable:!0,detail:{clientX:e.data.x,clientY:e.data.y,items:e.data.items}});i.dispatchEvent(t),i=null}}else if(e.data.msg===`pictureInPictureClosed`){let e=this.#o;this.#o=null,e?.()}else if(e.data.msg===`windowWillClose`)this.#r===void 0?this.messageTarget?.postMessage({msg:!0,appInstanceID:this.appInstanceID,original_msg_id:e.data.msg_id},`*`):(this.messageTarget?.postMessage({msg:!1,appInstanceID:this.appInstanceID,original_msg_id:e.data.msg_id},`*`),this.#r());else if(e.data.msg===`itemsOpened`){if(this.#i===void 0)this.messageTarget?.postMessage({msg:!0,appInstanceID:this.appInstanceID,original_msg_id:e.data.msg_id},`*`);else{this.messageTarget?.postMessage({msg:!1,appInstanceID:this.appInstanceID,original_msg_id:e.data.msg_id},`*`);let t=[];if(e.data.items.length>0)for(let n=0;n<e.data.items.length;n++)t.push(new z(e.data.items[n]));this.#i(t)}}else if(e.data.msg===`getAppDataSucceeded`){let t=new z(e.data.item);e.data.original_msg_id&&this.#n[e.data.original_msg_id]&&this.#n[e.data.original_msg_id](t)}else if(e.data.msg===`instancesOpenSucceeded`)e.data.original_msg_id&&this.#n[e.data.original_msg_id]&&this.#n[e.data.original_msg_id](e.data.instancesOpen);else if(e.data.msg===`readAppDataFileSucceeded`){let t=new z(e.data.item);e.data.original_msg_id&&this.#n[e.data.original_msg_id]&&this.#n[e.data.original_msg_id](t)}else if(e.data.msg===`readAppDataFileFailed`)e.data.original_msg_id&&this.#n[e.data.original_msg_id]&&this.#n[e.data.original_msg_id](null);else if(e.data.original_msg_id!==void 0&&this.#n[e.data.original_msg_id]){if(e.data.msg===`fileOpenPicked`){if(e.data.items.length===1)this.#n[e.data.original_msg_id](new z(e.data.items[0]));else if(e.data.items.length>1){let t=[];for(let n=0;n<e.data.items.length;n++)t.push(new z(e.data.items[n]));this.#n[e.data.original_msg_id](t)}}else if(e.data.msg===`directoryPicked`){if(e.data.items.length===1)this.#n[e.data.original_msg_id](new z({uid:e.data.items[0].uid,name:e.data.items[0].fsentry_name,path:e.data.items[0].path,readURL:e.data.items[0].read_url,writeURL:e.data.items[0].write_url,metadataURL:e.data.items[0].metadata_url,isDirectory:!0,size:e.data.items[0].fsentry_size,accessed:e.data.items[0].fsentry_accessed,modified:e.data.items[0].fsentry_modified,created:e.data.items[0].fsentry_created}));else if(e.data.items.length>1){let t=[];for(let n=0;n<e.data.items.length;n++)t.push(new z(e.data.items[n]));this.#n[e.data.original_msg_id](t)}}else e.data.msg===`colorPicked`?this.#n[e.data.original_msg_id](e.data.color):e.data.msg===`fontPicked`?this.#n[e.data.original_msg_id](e.data.font):e.data.msg===`alertResponded`||e.data.msg===`promptResponded`?this.#n[e.data.original_msg_id](e.data.response):e.data.msg===`notificationShown`?this.#n[e.data.original_msg_id](e.data.uid):e.data.msg===`languageReceived`?this.#n[e.data.original_msg_id](e.data.language):e.data.msg===`fileSaved`?this.#n[e.data.original_msg_id](new z(e.data.saved_file)):e.data.msg===`fileSaveCancelled`?this.#n[e.data.original_msg_id](bl):e.data.msg===`fileOpenCancelled`?this.#n[e.data.original_msg_id](xl):this.#n[e.data.original_msg_id](e.data);delete this.#n[e.data.original_msg_id]}else if(e.data.msg===`itemChanged`&&e.data.data&&e.data.data.uid)this.itemWatchCallbackFunctions[e.data.data.uid]&&typeof this.itemWatchCallbackFunctions[e.data.data.uid]==`function`&&this.itemWatchCallbackFunctions[e.data.data.uid](e.data.data);else if(e.data.msg===`broadcast`){let{name:t,data:n}=e.data;if(!this.#s.includes(t))return;this.emit(t,n),this.#c.set(t,n)}else if(e.data.msg===`connection`){e.data.usesSDK=!0;let t=Tl.from(e.data,this.puter,{messageTarget:this.messageTarget,appInstanceID:this.appInstanceID});this.emit(`connection`,{conn:t,accept:t=>{this.messageTarget?.postMessage({$:`connection-resp`,connection:e.data.appInstanceID,accept:!0,value:t},`*`)},reject:t=>{this.messageTarget?.postMessage({$:`connection-resp`,connection:e.data.appInstanceID,accept:!1,value:t},`*`)}})}}}),globalThis.document?.addEventListener(`mousemove`,async e=>{this.mouseX=e.clientX,this.mouseY=e.clientY,this.messageTarget?.postMessage({msg:`mouseMoved`,appInstanceID:this.appInstanceID,x:this.mouseX,y:this.mouseY},`*`)}),globalThis.document?.addEventListener(`click`,async e=>{this.mouseX=e.clientX,this.mouseY=e.clientY,this.messageTarget?.postMessage({msg:`mouseClicked`,appInstanceID:this.appInstanceID,x:this.mouseX,y:this.mouseY},`*`)})}onWindowClose(e){this.#r=e}onItemsOpened(e){if(!this.#i){let t=new URLSearchParams(globalThis.location.search);if(t.has(`puter.item.name`)&&t.has(`puter.item.uid`)&&t.has(`puter.item.read_url`)){let n=t.get(`puter.item.path`);!n.startsWith(`~/`)&&!n.startsWith(`/`)&&(n=`~/${n}`),e([new z({name:t.get(`puter.item.name`),path:n,uid:t.get(`puter.item.uid`),readURL:t.get(`puter.item.read_url`),writeURL:t.get(`puter.item.write_url`),metadataURL:t.get(`puter.item.metadata_url`),size:t.get(`puter.item.size`),accessed:t.get(`puter.item.accessed`),modified:t.get(`puter.item.modified`),created:t.get(`puter.item.created`)})])}}this.#i=e}wasLaunchedWithItems(){let e=new URLSearchParams(globalThis.location.search);return e.has(`puter.item.name`)&&e.has(`puter.item.uid`)&&e.has(`puter.item.read_url`)}onLaunchedWithItems(e){if(!this.#a){let t=new URLSearchParams(globalThis.location.search);if(t.has(`puter.item.name`)&&t.has(`puter.item.uid`)&&t.has(`puter.item.read_url`)){let n=t.get(`puter.item.path`);!n.startsWith(`~/`)&&!n.startsWith(`/`)&&(n=`~/${n}`),e([new z({name:t.get(`puter.item.name`),path:n,uid:t.get(`puter.item.uid`),readURL:t.get(`puter.item.read_url`),writeURL:t.get(`puter.item.write_url`),metadataURL:t.get(`puter.item.metadata_url`),size:t.get(`puter.item.size`),accessed:t.get(`puter.item.accessed`),modified:t.get(`puter.item.modified`),created:t.get(`puter.item.created`)})])}}this.#a=e}requestEmailConfirmation(){return new Promise((e,t)=>{this.#d(`requestEmailConfirmation`,e,{})})}requestVerificationGate(e){return new Promise(t=>{this.#d(`requestVerificationGate`,t,{code:e})}).then(e=>e?.response===!0)}alert(e,t,n,r){return this.messageTarget?new Promise(r=>{this.#d(`ALERT`,r,{message:e,buttons:t,options:n})}):new Promise(r=>{let i=document.createElement(`puter-alert`);i.setAttribute(`message`,e||``),i.buttons=t,i.options=n,i.addEventListener(`response`,e=>r(e.detail)),document.body.appendChild(i),i.open()})}openDevPaymentsAccount(){return new Promise(e=>{this.#d(`openDevPaymentsAccount`,e,{})})}instancesOpen(e){return new Promise(e=>{this.#d(`getInstancesOpen`,e,{})})}socialShare(e,t,n,r){return new Promise(r=>{this.#d(`socialShare`,r,{url:e,message:t,options:n})})}prompt(e,t,n,r){return this.messageTarget?new Promise(r=>{this.#d(`PROMPT`,r,{message:e,placeholder:t,options:n})}):new Promise(r=>{let i=document.createElement(`puter-prompt`);e&&i.setAttribute(`message`,e),t&&i.setAttribute(`placeholder`,t),n?.defaultValue&&i.setAttribute(`default-value`,n.defaultValue),i.options=n,i.addEventListener(`response`,e=>r(e.detail)),document.body.appendChild(i),i.open()})}notify(e){return this.messageTarget?new Promise(t=>{let n={...e??{}};n.roundIcon!==void 0&&n.round_icon===void 0&&(n.round_icon=n.roundIcon),this.#d(`showNotification`,t,{options:n})}):new Promise(t=>{let n=e??{},r=document.createElement(`puter-notification`);n.title&&r.setAttribute(`title`,n.title),n.text&&r.setAttribute(`text`,n.text),n.icon&&r.setAttribute(`icon`,n.icon),n.type&&r.setAttribute(`type`,n.type),(n.round_icon||n.roundIcon)&&r.setAttribute(`round-icon`,``),n.duration!==void 0&&r.setAttribute(`duration`,String(n.duration)),r.addEventListener(`close`,()=>t(n.uid||null)),document.body.appendChild(r),t(n.uid||null)})}showDirectoryPicker(e,t){return new Promise((t,n)=>{if(!globalThis.open)return n(`This API is not compatible in Web Workers.`);let r=this.#e++;if(this.env===`app`)this.messageTarget?.postMessage({msg:`showDirectoryPicker`,appInstanceID:this.appInstanceID,uuid:r,options:e,env:this.env},`*`);else{var i=screen.width/2-350,a=screen.height/2-200;window.open(`${puter.defaultGUIOrigin}/action/show-directory-picker?embedded_in_popup=true&msg_id=${r}&appInstanceID=${this.appInstanceID}&env=${this.env}&options=${JSON.stringify(e)}`,`Puter: Open Directory`,`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=700, height=400, top=${a}, left=${i}`)}this.#n[r]=t})}showOpenFilePicker(e,t){let n=yl(),r=new Promise((t,r)=>{if(!globalThis.open)return r(`This API is not compatible in Web Workers.`);let i=this.#e++;if(this.env===`app`)this.messageTarget?.postMessage({msg:`showOpenFilePicker`,appInstanceID:this.appInstanceID,uuid:i,options:e??{},env:this.env},`*`);else{var a=screen.width/2-350,o=screen.height/2-200;window.open(`${puter.defaultGUIOrigin}/action/show-open-file-picker?embedded_in_popup=true&msg_id=${i}&appInstanceID=${this.appInstanceID}&env=${this.env}&options=${JSON.stringify(e??{})}`,`Puter: Open File`,`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=700, height=400, top=${o}, left=${a}`)}this.#n[i]=e=>{if(e===xl){n.resolve(void 0);return}n.resolve(e),t(e)}});return r.undefinedOnCancel=n.promise,r}showFontPicker(e){return this.messageTarget?new Promise(t=>{this.#d(`showFontPicker`,t,{options:e??{}})}):new Promise(t=>{let n=typeof e==`string`?{defaultFont:e}:e??{},r=document.createElement(`puter-font-picker`),i=n.defaultFont||n.default||`System UI`;r.setAttribute(`default-font`,i),r.addEventListener(`response`,e=>t(e.detail)),document.body.appendChild(r),r.open()})}showColorPicker(e){return this.messageTarget?new Promise(t=>{this.#d(`showColorPicker`,t,{options:e??{}})}):new Promise(t=>{let n=typeof e==`string`?{defaultColor:e}:e??{},r=document.createElement(`puter-color-picker`),i=n.defaultValue||n.defaultColor||n.default||`#3b82f6`;r.setAttribute(`default-color`,i),r.addEventListener(`response`,e=>t(e.detail)),document.body.appendChild(r),r.open()})}async requestPictureInPicture({url:e,width:t,height:n,onClose:r}={}){if(this.env!==`app`)throw Sl(`NotSupportedError`,`requestPictureInPicture() is only available to apps running on the Puter desktop.`);let i;try{i=new URL(String(e),globalThis.location?.href).href}catch{throw Sl(`TypeError`,"`url` must be a URL.")}let a=await this.#m({method:`requestPictureInPicture`,parameters:{url:i,width:t,height:n}});if(!a?.ok)throw Sl(a?.error?.name??`NotAllowedError`,a?.error?.message??`Could not open a picture-in-picture window.`);this.#o=typeof r==`function`?r:null}async exitPictureInPicture(){return this.env===`app`&&(this.#o=null,(await this.#m({method:`exitPictureInPicture`,parameters:{}}))?.wasOpen===!0)}requestUpgrade(){return new Promise(e=>{this.#d(`requestUpgrade`,e,{})})}showSaveFilePicker(e,t,n){let r=yl(),i=new Promise((i,a)=>{if(!globalThis.open)return a(`This API is not compatible in Web Workers.`);let o=this.#e++;!n&&Object.prototype.toString.call(e)===`[object URL]`&&(n=`url`);let s=n===`url`?e.toString():void 0,c=[`move`,`copy`].includes(n)?e:void 0;if(this.env===`app`)this.messageTarget?.postMessage({msg:`showSaveFilePicker`,appInstanceID:this.appInstanceID,content:s?void 0:e,save_type:n,url:s,source_path:c,suggestedName:t??``,env:this.env,uuid:o},`*`);else{let n=new Blob([e],{type:`application/octet-stream`}),r=URL.createObjectURL(n);var l=screen.width/2-350,u=screen.height/2-200;let i=window.open(`${puter.defaultGUIOrigin}/action/show-save-file-picker?embedded_in_popup=true&msg_id=${o}&appInstanceID=${this.appInstanceID}&env=${this.env}&blobUrl=${encodeURIComponent(r)}`,`Puter: Save File`,`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=700, height=400, top=${u}, left=${l}`),a=n=>{n.data?.msg===`sendMeFileData`&&n.origin===puter.defaultGUIOrigin&&i&&n.source===i&&(n.source.postMessage({msg:`showSaveFilePickerPopup`,content:s?void 0:e,url:s?s.toString():void 0,suggestedName:t??``,env:this.env,uuid:o},puter.defaultGUIOrigin),window.removeEventListener(`message`,a))};window.addEventListener(`message`,a)}this.#n[o]=e=>{if(e===bl){r.resolve(void 0);return}r.resolve(e),i(e)}});return i.undefinedOnCancel=r.promise,i}setWindowTitle(e,t,n){return typeof t==`function`?(n=t,t=void 0):typeof t==`object`&&t&&(t=t.id),new Promise(n=>{this.#d(`setWindowTitle`,n,{new_title:e,window_id:t})})}setWindowWidth(e,t,n){return typeof t==`function`?(n=t,t=void 0):typeof t==`object`&&t&&(t=t.id),new Promise(n=>{this.#d(`setWindowWidth`,n,{width:e,window_id:t})})}setWindowHeight(e,t,n){return typeof t==`function`?(n=t,t=void 0):typeof t==`object`&&t&&(t=t.id),new Promise(n=>{this.#d(`setWindowHeight`,n,{height:e,window_id:t})})}setWindowSize(e,t,n,r){return typeof n==`function`?(r=n,n=void 0):typeof n==`object`&&n&&(n=n.id),new Promise(r=>{this.#d(`setWindowSize`,r,{width:e,height:t,window_id:n})})}setWindowPosition(e,t,n,r){return typeof n==`function`?(r=n,n=void 0):typeof n==`object`&&n&&(n=n.id),new Promise(r=>{this.#d(`setWindowPosition`,r,{x:e,y:t,window_id:n})})}setWindowY(e,t,n){return typeof t==`function`?(n=t,t=void 0):typeof t==`object`&&t&&(t=t.id),new Promise(n=>{this.#d(`setWindowY`,n,{y:e,window_id:t})})}setWindowX(e,t,n){return typeof t==`function`?(n=t,t=void 0):typeof t==`object`&&t&&(t=t.id),new Promise(n=>{this.#d(`setWindowX`,n,{x:e,window_id:t})})}showWindow(){this.#p(`showWindow`)}hideWindow(){this.#p(`hideWindow`)}toggleWindow(){this.#p(`toggleWindow`)}setMenubar(e){if(this.messageTarget){this.#p(`setMenubar`,e);return}document.querySelectorAll(`puter-menubar`).forEach(e=>e.remove());let t=document.createElement(`puter-menubar`);e.theme&&t.setAttribute(`theme`,e.theme),t.items=e.items||[],document.body.appendChild(t)}async#h(e){if(!this.authToken)return!1;let t=Array.isArray(e?.permissions)?e.permissions:[e?.permission];if(t.length===0||t.length>Cl||t.some(e=>typeof e!=`string`||e===``))return!1;let n;try{let e=await Promise.race([Nc(this.puter,[...new Set(t)]),new Promise(e=>{n=setTimeout(()=>e(null),wl)})]);return e!==null&&t.every(t=>e[t]===!0)}catch{return!1}finally{clearTimeout(n)}}async requestPermission(e){let t=e?.create;if(t!==void 0&&t!==!0&&t!==!1&&t!==`dir`&&t!==`file`)throw new k(`create must be true, false, "dir", or "file"`,`invalid_argument`);if((this.env===`app`||this.env===`web`)&&await this.#h(e))return!0;if(this.env===`app`)return(await this.#f(`requestPermission`,{options:e})).granted===!0;if(this.env!==`web`||!globalThis.open||!globalThis.document)return!1;let n=Array.isArray(e?.permissions)?e.permissions:[e?.permission];if(n.length===0||n.length>Cl||n.some(e=>typeof e!=`string`||e===``))return!1;let r;try{r=new URL(puter.defaultGUIOrigin).origin}catch{return!1}return new Promise(e=>{let i=`${this.#e++}-${Math.random().toString(36).slice(2,10)}`,a=n.map(e=>`permission=${encodeURIComponent(e)}`).join(`&`),o=t?`&create=${encodeURIComponent(t===!0?`true`:t)}`:``,s=`${r}/action/request-permission?embedded_in_popup=true&msg_id=${encodeURIComponent(i)}&${a}${o}`,c=!1,l=null,u=null,d=null,f=!1,p=()=>{l&&=(clearInterval(l),null),window.removeEventListener(`message`,h),d?.remove(),d=null},m=t=>{c||(c=!0,p(),e(t))},h=e=>{if(e.origin===r&&!(u&&e.source!==u)&&e.data?.original_msg_id==i){if(e.data?.msg===`permissionPromptReady`){f=!0;return}e.data?.msg===`permissionGranted`&&m(e.data.granted===!0)}};window.addEventListener(`message`,h);let g=e=>{if(!c){if(!e){m(!1);return}if(u=e,window.crossOriginIsolated||e.closed){_();return}l=setInterval(()=>{if(!e.closed)return;clearInterval(l),l=null;let t=!f;setTimeout(()=>{if(!c){if(t){_();return}m(!1)}},1e3)},100)}},_=async()=>{if(!puter.authToken){m(!1);return}let e=Date.now();for(;!c&&Date.now()-e<3e5;){if(await new Promise(e=>setTimeout(e,2e3)),c)return;if(!puter.authToken)continue;let e=typeof AbortController<`u`?new AbortController:null,t=setTimeout(()=>e?.abort(),1e4);try{let t=await fetch(`${puter.APIOrigin}/auth/check-permissions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${puter.authToken}`},body:JSON.stringify({permissions:n}),...e?{signal:e.signal}:{}});if(!t.ok)continue;let r=await t.json();n.every(e=>r?.permissions?.[e]===!0)&&m(!0)}catch{}finally{clearTimeout(t)}}m(!1)};try{if(Zt())g(Qt(s,`puter-permission-${i}`));else{let e=new $t(()=>{},()=>{},{popupURL:s,popupName:`puter-permission-${i}`,onLaunch:e=>g(e),onCancel:()=>m(!1)});d=e,document.body.appendChild(e),e.open()}}catch{m(!1)}})}async showFeedbackDialog(){if(this.env===`app`)return(new URLSearchParams(globalThis.location?.search??``).get(`puter.gui_features`)?.split(`,`)??[]).includes(`feedback-dialog`)?(await this.#f(`showFeedbackDialog`,{}))?.sent===!0:!1;if(this.env!==`web`||!globalThis.open||!globalThis.document)return!1;let e;try{e=new URL(puter.defaultGUIOrigin).origin}catch{return!1}return new Promise(t=>{let n=`${this.#e++}-${Math.random().toString(36).slice(2,10)}`,r=`${e}/action/send-feedback?embedded_in_popup=true&msg_id=${encodeURIComponent(n)}`,i=!1,a=null,o=null,s=null,c=()=>{a&&=(clearInterval(a),null),window.removeEventListener(`message`,u),s?.remove(),s=null},l=e=>{i||(i=!0,c(),t(e===!0))},u=t=>{t.origin===e&&(o&&t.source!==o||t.data?.original_msg_id==n&&t.data?.msg===`feedbackDialogClosed`&&l(t.data.sent===!0))};window.addEventListener(`message`,u);let d=e=>{if(!i){if(!e){l(!1);return}if(o=e,window.crossOriginIsolated||e.closed){l(!1);return}a=setInterval(()=>{e.closed&&(clearInterval(a),a=null,setTimeout(()=>l(!1),1e3))},100)}};try{if(Zt())d(Qt(r,`puter-feedback-${n}`));else{let e=new $t(()=>{},()=>{},{popupURL:r,popupName:`puter-feedback-${n}`,onLaunch:e=>d(e),onCancel:()=>l(!1)});s=e,document.body.appendChild(e),e.open()}}catch{l(!1)}})}disableMenuItem(e){this.#p(`disableMenuItem`,{id:e})}enableMenuItem(e){this.#p(`enableMenuItem`,{id:e})}setMenuItemIcon(e,t){this.#p(`setMenuItemIcon`,{id:e,icon:t})}setMenuItemIconActive(e,t){this.#p(`setMenuItemIconActive`,{id:e,icon:t})}setMenuItemChecked(e,t){this.#p(`setMenuItemChecked`,{id:e,checked:t})}contextMenu(e){if(this.messageTarget){this.#p(`contextMenu`,e);return}let t=document.createElement(`puter-context-menu`);e.theme&&t.setAttribute(`theme`,e.theme),t.items=e.items||[];let n=e.x??globalThis.event?.clientX??0,r=e.y??globalThis.event?.clientY??0;t.setAttribute(`x`,String(n)),t.setAttribute(`y`,String(r)),document.body.appendChild(t)}getEntriesFromDataTransferItems=async function(e,t={raw:!1}){let n=e=>{if(this.getEntriesFromDataTransferItems.didShowInfo||e.name!==`EncodingError`)return;this.getEntriesFromDataTransferItems.didShowInfo=!0;let t=`${e.name} occurred within datatransfer-files-promise module\nError message: "${e.message}"\nTry serving html over http if currently you are running it from the filesystem.`;console.warn(t)},r=(e,r=``)=>new Promise((i,a)=>{e.file(e=>{t.raw||(e.filepath=r+e.name),i(e)},e=>{n(e),a(e)})}),i=(e,t)=>new Promise((r,i)=>{e.readEntries(async e=>{let n=[];for(let r of e){let e=await o(r,t);n=n.concat(e)}r(n)},e=>{n(e),i(e)})}),a=async(e,t)=>{let n=e.createReader(),r=`${t+e.name}/`,a=[],o;do o=await i(n,r),a=a.concat(o);while(o.length>0);return a},o=async(e,t=``)=>{if(e!==null){if(e.isFile)return[await r(e,t)];if(e.isDirectory){let n=await a(e,t);return n.push(e),n}}},s=[],c=[];for(let t=0,n=e.length;t<n;t++)c.push(e[t].webkitGetAsEntry());for(let e of c){let t=await o(e);s=s.concat(t)}return s};authenticateWithPuter(){if(this.env!==`web`)return;if(this.authToken)return new Promise(e=>{e()});if(puter.puterAuthState.isPromptOpen)return new Promise((e,t)=>{puter.puterAuthState.resolver={resolve:e,reject:t}});puter.puterAuthState.isPromptOpen=!0,puter.puterAuthState.authGranted=null;let e=e=>{puter.puterAuthState.authGranted=e,puter.puterAuthState.isPromptOpen=!1;let t=puter.puterAuthState.resolver;puter.puterAuthState.resolver=null,t&&(e?t.resolve():t.reject())};return puter.auth.signIn({request_auth:!0}).then(()=>{e(!0),puter.onAuth&&typeof puter.onAuth==`function`&&puter.getUser().then(e=>{puter.onAuth(e)})},t=>{throw e(!1),t})}launchApp=async function(e,t,n){let r,i,a,o,s=e;if(typeof s==`object`&&s){let e=s;s=e.name||e.app_name,i=e.file_paths,t||=e.args,n||=e.callback,r=e.pseudonym,a=e.items,o=e.background}if(a){Array.isArray(a)||(a=[]);for(let e=0;e<a.length;e++)a[e]instanceof z&&(a[e]=a[e]._internalProperties.file_signature)}s&&s.includes(`#(as)`)&&([s,r]=s.split(`#(as)`)),s||=puter.appName;let c=await this.#m({method:`launchApp`,callback:n,parameters:{app_name:s,file_paths:i,items:a,pseudonym:r,args:t,background:o}});return Tl.from(c,this.puter,{messageTarget:this.messageTarget,appInstanceID:this.appInstanceID})};connectToInstance=async function(e){let t=await this.#m({method:`connectToInstance`,parameters:{app_name:e}});return Tl.from(t,this.puter,{messageTarget:this.messageTarget,appInstanceID:this.appInstanceID})};parentApp(){return this.#t}createWindow(e,t){return new Promise(t=>{this.#d(`createWindow`,e=>{t(e.window)},{options:e??{}})})}menubar(){document.querySelectorAll(`style.puter-stylesheet`).forEach(function(e){e.remove()});let e=document.createElement(`style`);e.classList.add(`puter-stylesheet`),e.innerHTML=`
        .--puter-menubar {
            border-bottom: 1px solid #e9e9e9;
            background-color: #fbf9f9;
            padding-top: 3px;
            padding-bottom: 2px;
            display: inline-block;
            position: fixed;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            height: 31px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
            z-index: 9999;
        }
        
        .--puter-menubar, .--puter-menubar * {
            user-select: none;
            -webkit-user-select: none;
            cursor: default;
        }
        
        .--puter-menubar .dropdown-item-divider>hr {
            margin-top: 5px;
            margin-bottom: 5px;
            border-bottom: none;
            border-top: 1px solid #00000033;
        }
        
        .--puter-menubar>li {
            display: inline-block;
            padding: 10px 5px;
        }
        
        .--puter-menubar>li>ul {
            display: none;
            z-index: 999999999999;
            list-style: none;
            background-color: rgb(233, 233, 233);
            width: 200px;
            border: 1px solid #e4ebf3de;
            box-shadow: 0px 0px 5px #00000066;
            padding-left: 6px;
            padding-right: 6px;
            padding-top: 4px;
            padding-bottom: 4px;
            color: #333;
            border-radius: 4px;
            padding: 2px;
            min-width: 200px;
            margin-top: 5px;
            position: absolute;
        }
        
        .--puter-menubar .menubar-item {
            display: block;
            line-height: 24px;
            margin-top: -7px;
            text-align: center;
            border-radius: 3px;
            padding: 0 5px;
        }
        
        .--puter-menubar .menubar-item-open {
            background-color: rgb(216, 216, 216);
        }
        
        .--puter-menubar .dropdown-item {
            padding: 5px;
            padding: 5px 30px;
            list-style-type: none;
            user-select: none;
            font-size: 13px;
        }
        
        .--puter-menubar .dropdown-item-icon, .--puter-menubar .dropdown-item-icon-active {
            pointer-events: none;
            width: 18px;
            height: 18px;
            margin-left: -23px;
            margin-bottom: -4px;
            margin-right: 5px;
        }
        .--puter-menubar .dropdown-item-disabled .dropdown-item-icon{
            display: inline-block !important;
        }
        .--puter-menubar .dropdown-item-disabled .dropdown-item-icon-active{
            display: none !important;
        }
        .--puter-menubar .dropdown-item-icon-active {
            display:none;
        }
        .--puter-menubar .dropdown-item:hover .dropdown-item-icon{
            display: none;
        }
        .--puter-menubar .dropdown-item:hover .dropdown-item-icon-active{
            display: inline-block;
        }
        .--puter-menubar .dropdown-item-hide-icon .dropdown-item-icon, .--puter-menubar .dropdown-item-hide-icon .dropdown-item-icon-active{
            display: none !important;
        }
        .--puter-menubar .dropdown-item a {
            color: #333;
            text-decoration: none;
        }
        
        .--puter-menubar .dropdown-item:hover, .--puter-menubar .dropdown-item:hover a {
            background-color: rgb(59 134 226);
            color: white;
            border-radius: 4px;
        }
        
        .--puter-menubar .dropdown-item-disabled, .--puter-menubar .dropdown-item-disabled:hover {
            opacity: 0.5;
            background-color: transparent;
            color: initial;
            cursor: initial;
            pointer-events: none;
        }
        
        .--puter-menubar .menubar * {
            user-select: none;
        }                
        `,(document.head||document.getElementsByTagName(`head`)[0]).appendChild(e),document.addEventListener(`click`,function(e){if(e.target.classList.contains(`dropdown-item-disabled`))return!1;e.target.classList.contains(`menubar-item`)||(document.querySelectorAll(`.menubar-item.menubar-item-open`).forEach(function(e){e.classList.remove(`menubar-item-open`)}),document.querySelectorAll(`.dropdown`).forEach(e=>e.style.display=`none`))}),window.addEventListener(`blur`,function(e){document.querySelectorAll(`.dropdown`).forEach(function(e){e.style.display=`none`}),document.querySelectorAll(`.menubar-item.menubar-item-open`).forEach(e=>e.classList.remove(`menubar-item-open`))});let t=function(e){let t=[];if(!e.parentNode)return t;let n=e.parentNode.firstChild;for(;n;)n.nodeType===1&&n!==e&&t.push(n),n=n.nextSibling;return t};document.querySelectorAll(`.menubar-item`).forEach(e=>e.addEventListener(`mousedown`,function(e){document.querySelectorAll(`.dropdown`).forEach(function(e){e.style.display=`none`}),document.querySelectorAll(`.menubar-item.menubar-item-open`).forEach(function(t){t!=e.target&&t.classList.remove(`menubar-item-open`)}),this.classList.contains(`menubar-item-open`)?document.querySelectorAll(`.menubar-item.menubar-item-open`).forEach(function(e){e.classList.remove(`menubar-item-open`)}):e.target.classList.contains(`dropdown-item`)||(this.classList.add(`menubar-item-open`),t(this).forEach(function(e){e.style.display=`block`}))})),document.querySelectorAll(`.--puter-menubar .menubar-item`).forEach(e=>e.addEventListener(`mouseover`,function(e){let t=document.querySelectorAll(`.menubar-item.menubar-item-open`);t.length>0&&t[0]!==e.target&&e.target.dispatchEvent(new Event(`mousedown`))}))}on(e,t){super.on(e,t),this.#s.includes(e)&&this.#c.has(e)&&t(this.#c.get(e))}#g=null;#_=null;showSpinner(e){if(this.#l)return;if(!document.getElementById(`puter-spinner-styles`)){let e=document.createElement(`style`);e.id=`puter-spinner-styles`,e.textContent=`
                .puter-loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
    
                .puter-loading-text {
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                    margin-top: 10px;
                    text-align: center;
                    width: 100%;
                }
    
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
    
                .puter-loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 120px; 
                    background: #ffffff; 
                    border-radius: 10px;
                    padding: 20px;
                    min-width: 120px;
                }
            `,document.head.appendChild(e)}let t=document.createElement(`div`);t.classList.add(`puter-loading-overlay`),Object.assign(t.style,{position:`fixed`,top:`0`,left:`0`,width:`100%`,height:`100%`,backgroundColor:`rgba(255, 255, 255, 0.8)`,zIndex:`2147483647`,display:`flex`,justifyContent:`center`,alignItems:`center`,pointerEvents:`all`});let n=document.createElement(`div`);n.classList.add(`puter-loading-container`),n.innerHTML=`
            <div class="puter-loading-spinner"></div>
            <div class="puter-loading-text">${e??`Working...`}</div>
        `,t.appendChild(n),document.body.appendChild(t),this.#l=!0,this.#g=Date.now(),this.#u=setTimeout(()=>{this.#u=null},1e3)}hideSpinner(){if(!this.#l)return;this.#u&&=(clearTimeout(this.#u),null);let e=Date.now()-this.#g,t=Math.max(0,1200-e);t>0?(this.#_&&clearTimeout(this.#_),this.#_=setTimeout(()=>{this.#v()},t)):this.#v()}#v(){let e=document.querySelector(`.puter-loading-overlay`);e&&e.parentNode?.removeChild(e),this.#l=!1,this.#g=null,this.#_=null}isWorkingActive(){return this.#l}getLanguage(){return this.env===`gui`?new Promise(e=>{e(window.locale)}):new Promise(e=>{this.#d(`getLanguage`,e,{})})}},Dl=`9a9c83a4-7897-43a0-93b9-53217b84fde6`,Ol=(e,t,n)=>{Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})},kl=class{#e=1;constructor(){this.callbacks=new Map}register_callback(e){let t=this.#e++;return this.callbacks.set(t,e),t}attach_to_source(e){e.addEventListener(`message`,e=>{let{data:t}=e;if(t&&typeof t==`object`&&t.$SCOPE===`9a9c83a4-7897-43a0-93b9-53217b84fde6`){let{id:e,args:n}=t,r=this.callbacks.get(e);r&&r(...n)}})}},Al=class{constructor({callbackManager:e}){this.callbackManager=e}dehydrate(e){return this.dehydrate_value_(e)}dehydrate_value_(e){if(typeof e==`function`)return{$SCOPE:Dl,id:this.callbackManager.register_callback(e)};if(Array.isArray(e))return e.map(this.dehydrate_value_.bind(this));if(typeof e==`object`&&e){let t={};for(let n of Object.keys(e))Ol(t,n,this.dehydrate_value_(e[n]));return t}return e}},jl=class{constructor({target:e}){this.target=e}hydrate(e){return this.hydrate_value_(e)}hydrate_value_(e){if(e&&typeof e==`object`&&e.$SCOPE===`9a9c83a4-7897-43a0-93b9-53217b84fde6`){let{id:t}=e;return(...e)=>{this.target.postMessage({$SCOPE:Dl,id:t,args:e},`*`)}}if(Array.isArray(e))return e.map(this.hydrate_value_.bind(this));if(typeof e==`object`&&e){let t={};for(let n of Object.keys(e))Ol(t,n,this.hydrate_value_(e[n]));return t}return e}},Ml=class{constructor(){this.rpc=new Nl}},Nl=class{constructor(){this.callbackManager=new kl,this.callbackManager.attach_to_source(globalThis)}getDehydrator(){return new Al({callbackManager:this.callbackManager})}getHydrator({target:e}){return new jl({target:e})}registerCallback(e){return this.callbackManager.register_callback(e)}send(e,t,...n){e.postMessage({$SCOPE:Dl,id:t,args:n},`*`)}},Pl=class extends D{async create(e,t,n){await this.#e();let r;if(typeof n==`object`||n===void 0){let t=this.puter.whoami||await this.puter.getUser();if(n?.sandbox??!!t.is_user_token){let n;try{n=await this.puter.apps.get(`sandbox-${e}`)}catch{n=await this.puter.apps.create(`sandbox-${e}`,`https://worker-sandbox.puter.com/`)}if(n.owner.uuid!==t.uuid)throw Error(`Sandbox context is not owned by you! This worker's sandbox is currently owned by: ${n.owner.username}`);r=n.uid}}if(typeof n==`string`){let e=(await this.puter.apps.list()).find(e=>e.name===n);if(!e)throw{message:`No app named '${n}' in your account`,code:`app_not_found`};r=e.uid}e=e.toLocaleLowerCase();let i=await this.puter.kv.get(`user-workers`);i||={},t=O(t);let a=await T({iface:`workers`,driver:`worker-service`,method:`create`,argNames:[`authorization`,`filePath`,`workerName`,`appId`]})(this.puter.authToken,t,e,r);if(!a.success)throw Error(a?.errors||`Driver failed to execute, do you have the necessary permissions?`);return i[e]={filePath:t,url:a.url,deployTime:Date.now(),createTime:Date.now()},await this.puter.kv.set(`user-workers`,i),a}async exec(...e){await this.#e();let t=new Request(...e);return!t.headers.get(`puter-auth`)&&!t.headers.get(`x-puter-no-auth`)&&t.headers.set(`puter-auth`,this.puter.authToken),t.headers.delete(`x-puter-no-auth`),fetch(t)}async#e(){if(!this.puter.authToken&&this.puter.env===`web`)try{await this.puter.ui.authenticateWithPuter()}catch{throw`Authentication failed.`}}list(e){let t=e&&typeof e==`object`?e:{},n=Object.prototype.hasOwnProperty.call(t,`cursor`),r=T({iface:`workers`,driver:`worker-service`,method:`getFilePaths`}),i={};t.limit!==void 0&&(i.limit=t.limit);let a=e=>r({...i,...e});if(t.stream===!0){if(t.offset!==void 0)throw{message:"`offset` cannot be combined with `stream`; pass `cursor` to resume from a position.",code:`invalid_request`};let e=this;return(async function*(){await e.#e(),yield*A(a,{cursor:t.cursor,includeTotal:t.includeTotal===!0})})()}return t.limit!==void 0||t.offset!==void 0||n||t.includeTotal!==void 0?(async()=>{await this.#e();let e={...i};return t.offset!==void 0&&(e.offset=t.offset),n&&(e.cursor=t.cursor??null),t.includeTotal!==void 0&&(e.includeTotal=t.includeTotal),await r(e)})():(async()=>(await this.#e(),await Gt(a)))()}async get(e){return await this.#e(),e=e.toLocaleLowerCase(),(await T({iface:`workers`,driver:`worker-service`,method:`getFilePaths`,argNames:[`workerName`]})(e))[0]}async delete(e){await this.#e(),e=e.toLocaleLowerCase();let t=await T({iface:`workers`,driver:`worker-service`,method:`destroy`,argNames:[`authorization`,`workerName`]})(this.puter.authToken,e);if(t.result){let t=await this.puter.kv.get(`user-workers`);return t||={},delete t[e],await this.puter.kv.set(`user-workers`,t),!0}throw Error(t?.errors||`Driver failed to execute, do you have the necessary permissions?`)}async getLoggingHandle(e){let t=await T({iface:`workers`,driver:`worker-service`,method:`getLoggingUrl`})(this.puter.authToken,e),n=new WebSocket(`${t}/${this.puter.authToken}/${e}`),r=new EventTarget;return r.onLog=e=>{},Object.defineProperty(r,"start",{enumerable:!1,value:async e=>{n.addEventListener(`message`,t=>{e.enqueue(JSON.parse(t.data))}),n.addEventListener(`close`,()=>{try{e.close()}catch{}})}}),Object.defineProperty(r,"cancel",{enumerable:!1,value:async()=>{n.close()}}),n.addEventListener(`message`,e=>{let t=new MessageEvent(`log`,{data:JSON.parse(e.data)});r.dispatchEvent(t),r.onLog(t)}),r.close=n.close,new Promise((e,t)=>{let i=!1;n.onopen=()=>{i=!0,e(r)},n.onerror=()=>{i||t(`Failed to open logging connection`)}})}},Fl=/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,Il=/^[A-Z0-9]{0,4}-[0-9A-F]{6}$/;function Ll(e){return typeof e==`string`&&Fl.test(e)&&!Il.test(e)}var Rl=`{"ping":1}`,zl=3e4,Bl=4001,Vl=1e3,Hl=3e4,Ul=6,Wl=15e3;function Gl(e,t){if(!t)return e;let n=new URL(e);return n.searchParams.set(`room`,t),n.toString()}function Kl(e,t){let n=Error(e);return t&&(n.code=t),n}var ql=class extends Event{conn;user;constructor(e,t){super(`connection`),this.conn=e,this.user=t}},Jl=class extends Event{inviteCode;constructor(e){super(`reconnect`),this.inviteCode=e}},Yl=class extends Event{reason;constructor(e){super(`close`),this.reason=e}},Xl=class extends Event{data;constructor(e){super(`message`),this.data=e}},Zl=class extends Event{constructor(){super(`open`)}},Ql=class extends Event{reason;constructor(e=void 0){super(`close`),this.reason=e}},$l=class extends Event{error;constructor(e){super(`error`),this.error=e}},eu=class extends EventTarget{#e=null;#t=null;#n;#r={};#i=!1;#a=!1;#o=null;#s=0;#c=0;#l=null;connections=new Map;inviteCode;constructor(e){super(),this.#n=e}async start(e={}){this.#r=e;let t=await this.#u();return this.#i=!0,t}setGuestGrant(e){this.#r={...this.#r,guestGrant:e||void 0},this.#i&&this.#e?.readyState===1&&this.#e.send(JSON.stringify({server:{grant:{grant:e||null}}}))}async#u(){let e=new WebSocket(Gl(this.#n.signallerUrl,this.#r.name));this.#e=e,await new Promise((t,n)=>{e.onopen=t,e.onerror=()=>n(Error(`Could not reach the signaller`)),e.onclose=()=>{n(Error(`Connection closed unexpectedly`))}}),e.onmessage=e=>{let t;try{t=JSON.parse(e.data)}catch{return}return this.#_(t)},e.onclose=t=>{this.#e===e&&this.#p(t)},e.onerror=null,e.send(JSON.stringify({server:{create:{authToken:this.#n.authToken,anonToken:this.#r.anonToken,port:this.#r.port,name:this.#r.name,grant:this.#r.guestGrant}}}));let t=await new Promise((e,t)=>{let n=setTimeout(()=>{this.#t=null,t(Error(`Server creation timed out`))},Wl);this.#t=r=>{clearTimeout(n),this.#t=null,r.success?e(r.invitecode??this.inviteCode):t(Kl(r.error,r.code))}}).catch(t=>{e.onclose=null;try{e.close()}catch{}throw this.#e===e&&(this.#e=null),t});return this.inviteCode=t,this.#d(e),t}#d(e){this.#f(),this.#l=setInterval(()=>{if(e.readyState===1)try{e.send(Rl)}catch{}},zl)}#f(){this.#l&&=(clearInterval(this.#l),null)}#p(e){if(this.#f(),this.#e=null,!(this.#a||!this.#i)){if(e?.code===Bl){this.#g(`replaced`);return}this.#m()}}#m(){if(this.#a||this.#o)return;let e=this.#s++,t=Math.min(Hl,Vl*2**e),n=t/2+t/2*Math.random();this.#o=setTimeout(()=>{this.#o=null,this.#h()},n)}async#h(){if(this.#a)return;let e;try{e=await this.#u()}catch(e){if(this.#a)return;if(e?.code===`name_in_use`&&++this.#c>=Ul){this.#g(`name_in_use`);return}this.#m();return}this.#s=0,this.#c=0,this.dispatchEvent(new Jl(e))}#g(e){this.#a||(this.#a=!0,this.#f(),this.#o&&=(clearTimeout(this.#o),null),this.dispatchEvent(new Yl(e)))}async#_(e){if(e&&e.server){if(e.server.create){this.#t?.(e.server.create);return}if(e.server.connect){let t=e.server.connect.id,n=new tu(this.#n);this.connections.set(t,n);let r=this.#e;n.peerconnection.onicecandidate=e=>{e.candidate&&r?.readyState===1&&r.send(JSON.stringify({server:{candidate:{id:t,candidate:e.candidate}}}))},this.dispatchEvent(new ql(n,e.server.connect.user))}if(e.server.candidate){let t=e.server.candidate.id,n=this.connections.get(t);n&&await n.addIceCandidate(e.server.candidate.candidate)}if(e.server.offer){let t=e.server.offer.id,n=this.connections.get(t);if(!n)return;await n.setRemoteDescription(new RTCSessionDescription(e.server.offer.offer));let r=await n.createAnswer();this.#e?.readyState===1&&this.#e.send(JSON.stringify({server:{answer:{id:t,answer:r}}}))}}}close(){this.#a=!0,this.#f(),this.#o&&=(clearTimeout(this.#o),null);for(let[e,t]of this.connections)t.close();if(this.#e){this.#e.onclose=null;try{this.#e.close()}catch{}this.#e=null}}},tu=class extends EventTarget{#e;peerconnection;owner;room;#t;#n;connected=!1;closed=!1;#r=[];constructor(e){super(),this.#t=e,this.peerconnection=new RTCPeerConnection({iceTransportPolicy:e.forceRelay?`relay`:`all`,iceServers:e.iceServers}),this.#n=this.peerconnection.createDataChannel(`channel-1`,{negotiated:!0,id:2}),this.#n.onmessage=e=>{this.dispatchEvent(new Xl(e.data))},this.#n.onopen=()=>{this.connected=!0;for(let e of this.#r)this.send(e);this.#r=[],this.dispatchEvent(new Zl),this.#i()},this.#n.onclose=()=>{this.#o(void 0,void 0)},this.#n.onerror=e=>{this.#o(void 0,e.error)}}#i(){this.#e&&=(this.#e.onclose=null,this.#e.close(),null)}async connect(e,t={}){let n=!t.port&&Ll(e)?e:void 0;this.#e=new WebSocket(Gl(this.#t.signallerUrl,n)),await new Promise((e,t)=>{this.#e.onopen=e,this.#e.onerror=t,this.#e.onclose=()=>{t(Error(`Connection closed unexpectedly`))}}),this.#e.onopen=null,this.#e.onerror=null,this.#e.onclose=()=>{this.#o(void 0,Error(`Connection closed unexpectedly before peer offer was sent`))},this.#e.send(JSON.stringify({client:{connect:{authToken:this.#t.authToken,anonToken:t.anonToken,invitecode:e,port:t.port}}})),this.peerconnection.onicecandidate=e=>{this.#e?.readyState===1&&this.#e.send(JSON.stringify({client:{candidate:{candidate:e.candidate}}}))},this.#e.onmessage=async e=>{let n;try{n=JSON.parse(e.data).client}catch{return}if(n){if(n.answer&&this.setRemoteDescription(n.answer.answer),n.candidate&&this.addIceCandidate(n.candidate.candidate),n.connect){if(n.connect.success){if(this.owner=n.connect.owner,this.room=n.connect.room,await this.#a(n.connect.grant,t),this.closed)return;let e=await this.createOffer();if(this.#e?.readyState!==1)return;this.#e.send(JSON.stringify({client:{offer:{offer:e}}}))}else this.#o(void 0,Kl(n.connect.error,n.connect.code))}n.disconnect&&!this.connected&&this.#o(n.disconnect.reason)}}}async#a(e,t){if(e&&t.anonToken&&!t.turnGrant&&!t.iceServers&&typeof this.#t.iceServersFor==`function`)try{let t=await this.#t.iceServersFor({turnGrant:e});if(this.closed||!t)return;this.peerconnection.setConfiguration({iceTransportPolicy:this.#t.forceRelay?`relay`:`all`,iceServers:t})}catch(e){console.warn(`Unable to use the host’s relays. Some connections may fail.`,e)}}#o(e,t){this.closed||(this.closed=!0,this.connected=!1,this.#e&&this.#i(),this.#n&&(this.#n.onclose=null,this.#n.close()),this.peerconnection&&this.peerconnection.close(),t&&this.dispatchEvent(new $l(t)),this.dispatchEvent(new Ql(e)))}close(e){this.#o(e,void 0)}async createOffer(){let e=await this.peerconnection.createOffer();return await this.peerconnection.setLocalDescription(e),e}async createAnswer(){let e=await this.peerconnection.createAnswer();return await this.peerconnection.setLocalDescription(e),e}async setRemoteDescription(e){await this.peerconnection.setRemoteDescription(e)}async addIceCandidate(e){await this.peerconnection.addIceCandidate(e)}send(e){if(!this.connected){this.#r.push(e);return}this.#n.send(e)}},nu=class extends D{#e;#t;#n;#r;#i;#a;#o;async createGuestGrant(){let e=await x(`${this.APIOrigin}/peer/turn-grant`,{method:`POST`,includePuterAuth:!0,headers:{"Content-Type":`application/json`}});if(!e.ok)throw Error(`Failed to create a guest grant.`);return await e.json()}async ensureTurnRelays(e={}){let t=e.turnGrant?`grant:${e.turnGrant}`:`session`;if(t!==this.#o&&(this.#o=t,this.#t=void 0,this.#a=!1),this.#a||this.#t&&Date.now()-this.#i<this.#r*1e3)return;let n=e.turnGrant?await x(`${this.APIOrigin}/peer/guest-turn`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({grant:e.turnGrant})}):await x(`${this.APIOrigin}/peer/generate-turn`,{method:`POST`,includePuterAuth:!0,headers:{"Content-Type":`application/json`}});if(!n.ok){this.#a=!0;return}let{iceServers:r,ttl:i}=await n.json();this.#t=r,this.#r=i,this.#i=Date.now()}async#s(){if(this.#e)return;let e=await x(`${this.APIOrigin}/peer/signaller-info`);if(!e.ok)throw Error(`Failed to get signaller info from Puter.`);let{url:t,fallbackIce:n}=await e.json();this.#n=n,this.#e=t}async#c(e){if(!(this.authToken||this.puter.env!==`web`))try{await this.puter.ui.authenticateWithPuter()}catch{throw Error(`Need authentication to ${e} but failed to authenticate with Puter.`)}}async#l(e){return e?.iceServers?e.iceServers:(await this.ensureTurnRelays(e??{}),this.#t?this.#t:(console.warn(`Unable to use TURN relays. Some connections may fail.`),this.#n))}async#u(e){await this.#s();let t=await this.#l(e);return{authToken:this.authToken,iceServers:t,signallerUrl:this.#e,forceRelay:e?.forceRelay,iceServersFor:e=>this.#l(e)}}async serve(e){if(e?.name!==void 0&&!Ll(e.name))throw TypeError(`Room names are 3–64 lowercase letters, digits and hyphens, not starting or ending with a hyphen.`);e?.anonToken||await this.#c(`create a server`);let t=new eu(await this.#u(e));return await t.start(e),t}async connect(e,t){t?.anonToken||await this.#c(`connect to a server`);let n=new tu(await this.#u(t));return await n.connect(e,t),n}},Z=class extends (globalThis.HTMLElement||Object){constructor(){super(),globalThis.HTMLElement!==void 0&&this.attachShadow({mode:`open`})}connectedCallback(){this._setupThemeWatchers(),this._applyTheme(),this._rerender()}disconnectedCallback(){this._teardownThemeWatchers()}_setupThemeWatchers(){globalThis.MutationObserver!==void 0&&!this._themeObserver&&(this._themeObserver=new globalThis.MutationObserver(()=>this._applyTheme()),this._themeObserver.observe(this,{attributes:!0,attributeFilter:[`theme`]})),typeof globalThis.matchMedia==`function`&&!this._themeMediaQuery&&(this._themeMediaQuery=globalThis.matchMedia(`(prefers-color-scheme: dark)`),this._themeMediaListener=()=>this._applyTheme(),this._themeMediaQuery.addEventListener&&this._themeMediaQuery.addEventListener(`change`,this._themeMediaListener))}_teardownThemeWatchers(){this._themeObserver&&=(this._themeObserver.disconnect(),null),this._themeMediaQuery&&this._themeMediaListener&&this._themeMediaQuery.removeEventListener&&this._themeMediaQuery.removeEventListener(`change`,this._themeMediaListener),this._themeMediaQuery=null,this._themeMediaListener=null}_applyTheme(){if(typeof this.getAttribute!=`function`)return;let e=this.getAttribute(`theme`),t;t=e===`dark`||e!==`light`&&typeof globalThis.matchMedia==`function`&&globalThis.matchMedia(`(prefers-color-scheme: dark)`).matches,this.classList.toggle(`puter-theme-dark`,t)}_rerender(){this.shadowRoot&&(this.shadowRoot.innerHTML=`<style>${this.getStyles()}</style>${this.render()}`,this.onReady())}getStyles(){return``}render(){return``}onReady(){}emitEvent(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}$(e){return this.shadowRoot?.querySelector(e)}$$(e){return this.shadowRoot?.querySelectorAll(e)}open(){let e=this.$(`dialog`);e&&!e.open&&e.showModal()}close(){let e=this.$(`dialog`);e&&e.close(),this.remove()}},Q=`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;`${Q}`;var ru=`
    /* Base button */
    .btn {
        color: #666666;
        font-size: 14px;
        text-align: center;
        line-height: 35px;
        height: 35px;
        padding: 0 30px;
        margin: 0;
        display: inline-block;
        appearance: none;
        cursor: pointer;
        box-sizing: border-box;
        border: 1px solid #b9b9b9;
        background: linear-gradient(#f6f6f6, #e1e1e1);
        box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
        border-radius: 4px;
        outline: none;
        font-family: ${Q};
    }
    .btn:active {
        background-color: #eeeeee;
        border-color: #cfcfcf;
        color: #a9a9a9;
        box-shadow: inset 0px 2px 3px rgb(0 0 0 / 36%), 0px 1px 0px white;
    }
    .btn:focus-visible {
        border-color: rgb(118 118 118);
    }

    /* Primary button */
    .btn-primary {
        border-color: #088ef0;
        background: linear-gradient(#34a5f8, #088ef0);
        color: white;
    }
    .btn-primary:active {
        background-color: #2798eb;
        border-color: #2798eb;
        color: #bedef5;
    }

    /* Danger button */
    .btn-danger {
        border-color: #f00808;
        background: linear-gradient(#ff4e4e, #ff4c4c);
        color: white;
    }

    /* Action/success button */
    .btn-success, .btn-action {
        border-color: #08bf4e;
        background: linear-gradient(#29d55d, #1ccd60);
        color: white;
    }

    /* Default button */
    .btn-default {
        color: #666666;
        border: 1px solid #b9b9b9;
        background: linear-gradient(#f6f6f6, #e1e1e1);
        box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
    }

    /* Block button (full width) */
    .btn-block {
        width: 100%;
    }

    /* Normal size */
    .btn-normal {
        font-size: 16px;
        height: 40px;
        line-height: 38px;
        padding: 0 40px;
    }

    /* Disabled */
    .btn:disabled, .btn.disabled {
        background: #EEE !important;
        border: 1px solid #DDD !important;
        text-shadow: 0 1px 1px white !important;
        color: #CCC !important;
        cursor: default !important;
        pointer-events: none;
    }
`,iu=e=>`data:image/svg+xml;base64,${btoa(e)}`,au={error:`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#e53935"/>
  <rect x="22" y="12" width="4" height="16" rx="2" fill="#ffffff"/>
  <circle cx="24" cy="34" r="2.5" fill="#ffffff"/>
</svg>`,warning:`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M24 5 L44 40 L4 40 Z" fill="#ffc107" stroke="#e0a800" stroke-width="1.5" stroke-linejoin="round"/>
  <rect x="22" y="18" width="4" height="12" rx="2" fill="#3f3f3f"/>
  <circle cx="24" cy="35" r="2" fill="#3f3f3f"/>
</svg>`,info:`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#2196f3"/>
  <circle cx="24" cy="14" r="2.5" fill="#ffffff"/>
  <rect x="22" y="20" width="4" height="16" rx="2" fill="#ffffff"/>
</svg>`,success:`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#4caf50"/>
  <path d="M14 24 L21 31 L34 17" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,confirm:`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#2196f3"/>
  <path d="M18.5 18.5 Q18.5 12.5 24 12.5 Q29.5 12.5 29.5 18 Q29.5 22 25.5 24 Q24 24.8 24 27.5" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="34" r="2.25" fill="#ffffff"/>
</svg>`},ou={error:iu(au.error),warning:iu(au.warning),info:iu(au.info),success:iu(au.success),confirm:iu(au.confirm)},su=class extends Z{#e=null;#t=null;get buttons(){return this.#e}set buttons(e){this.#e=e}get options(){return this.#t}set options(e){this.#t=e}getStyles(){return`
            dialog {
                background: transparent;
                border: none;
                box-shadow: none;
                outline: none;
                padding: 0;
                max-width: 90vw;
            }
            dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
            }
            .alert-body {
                background-color: rgba(231, 238, 245, .95);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                border: none;
                border-radius: 4px;
                padding: 32px;
                box-shadow: 0px 0px 15px #00000066;
                font-family: ${Q};
                color: #414650;
                width: 350px;
                max-width: calc(100vw - 32px);
                box-sizing: border-box;
                text-align: center;
            }
            .alert-icon {
                width: 64px;
                height: 64px;
                margin: 10px auto 20px;
                display: block;
            }
            .message {
                font-size: 15px;
                line-height: 1.5;
                color: #414650;
                text-shadow: 1px 1px #ffffff52;
                text-align: center;
                margin-top: 10px;
                margin-bottom: 20px;
            }
            .message p { margin: 0 0 10px; }
            .message p:last-child { margin-bottom: 0; }
            .buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            button {
                width: 100%;
                height: 35px;
                line-height: 35px;
                padding: 0;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 400;
                cursor: pointer;
                font-family: ${Q};
                box-sizing: border-box;
                outline: none;
                color: #666666;
                border: 1px solid #b9b9b9;
                background: linear-gradient(#f6f6f6, #e1e1e1);
            }
            button:active {
                background-color: #eeeeee;
                border-color: #cfcfcf;
                color: #a9a9a9;
                box-shadow: inset 0px 2px 3px rgb(0 0 0 / 36%), 0px 1px 0px white;
            }
            button:focus-visible {
                border-color: rgb(118 118 118);
            }
            .btn-primary {
                background: linear-gradient(#34a5f8, #088ef0);
                border: 1px solid #088ef0;
                color: white;
            }
            .btn-primary:active {
                background-color: #2798eb;
                border-color: #2798eb;
                color: #bedef5;
            }
            .btn-danger {
                background: linear-gradient(#ff4e4e, #ff4c4c);
                border: 1px solid #f00808;
                color: white;
            }
            .btn-success {
                background: linear-gradient(#29d55d, #1ccd60);
                border: 1px solid #08bf4e;
                color: white;
            }
            .btn-warning {
                background: linear-gradient(#ffb74d, #ffa000);
                border: 1px solid #ffa000;
                color: #333;
            }
            .btn-info {
                background: linear-gradient(#42a5f5, #1976d2);
                border: 1px solid #1976d2;
                color: white;
            }
            .btn-default {
                color: #666666;
                border: 1px solid #b9b9b9;
                background: linear-gradient(#f6f6f6, #e1e1e1);
            }
            @media (max-width: 480px) {
                .alert-body {
                    width: 100%;
                    padding: 24px 20px;
                }
                button {
                    height: 40px;
                    line-height: 40px;
                    font-size: 16px;
                }
            }
        `}render(){let e=this.getAttribute(`message`)||``,t=this.#t?.type||this.getAttribute(`type`)||``,n=this.#t?.body_icon||this.#t?.icon||this.getAttribute(`icon`)||ou[t]||ou.info,r=this.#e||[{label:`OK`,value:!0,type:`primary`}],i=`<img class="alert-icon" src="${this._escapeAttr(n)}" alt="">`,a=r.map((e,t)=>{let n=e.type||(t===r.length-1?`primary`:`default`),i=e.value===void 0?e.label:e.value;return`<button class="btn-${n}" data-value="${this._escapeAttr(String(i))}">${this._escapeHTML(e.label)}</button>`}).join(``);return`
            <dialog>
                <div class="alert-body">
                    ${i}
                    <div class="message">${this._renderMessage(e)}</div>
                    <div class="buttons">${a}</div>
                </div>
            </dialog>`}onReady(){let e=this.$(`dialog`),t=this.#e||[{label:`OK`,value:!0,type:`primary`}];this.$$(`button`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.dataset.value,r=t.find(e=>String(e.value===void 0?e.label:e.value)===n);this.emitEvent(`response`,r?r.value===void 0?r.label:r.value:n),this.close()})}),e.addEventListener(`click`,t=>{t.target===e&&(this.emitEvent(`response`,void 0),this.close())});let n=this.$$(`button`);n.length>0&&n[n.length-1].focus()}_renderMessage(e){return this._escapeHTML(e).replace(/&lt;strong&gt;/g,`<strong>`).replace(/&lt;\/strong&gt;/g,`</strong>`).replace(/&lt;p&gt;/g,`<p>`).replace(/&lt;\/p&gt;/g,`</p>`).replace(/&lt;br\s*\/?&gt;/g,`<br>`)}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}_escapeAttr(e){return String(e).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}},cu=class extends Z{#e=null;get options(){return this.#e}set options(e){this.#e=e}getStyles(){return`
            dialog {
                background: transparent;
                border: none;
                box-shadow: none;
                outline: none;
                padding: 0;
                max-width: 90vw;
            }
            dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
            }
            .prompt-body {
                background-color: rgba(231, 238, 245, .95);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                border: none;
                border-radius: 8px;
                padding: 32px;
                box-shadow: 0px 0px 15px #00000066;
                font-family: ${Q};
                color: #414650;
                width: 450px;
                max-width: calc(100vw - 32px);
                box-sizing: border-box;
            }
            @media (max-width: 480px) {
                .prompt-body {
                    width: 100%;
                    padding: 24px 20px;
                }
                input[type="text"] {
                    padding: 12px;
                    font-size: 16px;
                }
                input[type="text"]:focus {
                    padding: 11px;
                }
                button {
                    padding: 14px 20px;
                    font-size: 16px;
                }
                .btn-ok {
                    flex: 1;
                }
                .btn-cancel {
                    flex: 1;
                }
            }
            .message {
                font-size: 15px;
                line-height: 1.5;
                color: #414650;
                text-shadow: 1px 1px #ffffff52;
                text-align: left;
            }
            .input-container {
                margin-top: 20px;
            }
            input[type="text"] {
                width: 100%;
                padding: 8px;
                border: 1px solid #b9b9b9;
                border-radius: 4px;
                color: #393f46;
                font-size: 14px;
                font-family: ${Q};
                box-sizing: border-box;
                outline: none;
                transition: border-color 0.15s;
            }
            input[type="text"]:focus {
                border: 2px solid #01a0fd;
                padding: 7px;
            }
            .buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
            .btn-cancel {
                background: linear-gradient(#f6f6f6, #e1e1e1);
                border: 1px solid #b9b9b9;
                color: #666666;
                border-radius: 4px;
                height: 35px;
                line-height: 35px;
                padding: 0 24px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                font-family: ${Q};
                box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
            }
            .btn-cancel:active {
                background-color: #eeeeee;
                border-color: #cfcfcf;
                color: #a9a9a9;
                box-shadow: inset 0px 2px 3px rgb(0 0 0 / 36%), 0px 1px 0px white;
            }
            .btn-ok {
                background: linear-gradient(#34a5f8, #088ef0);
                border: 1px solid #088ef0;
                color: white;
                border-radius: 4px;
                height: 35px;
                line-height: 35px;
                padding: 0 24px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                font-family: ${Q};
                min-width: 110px;
                box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
            }
            .btn-ok:active {
                background-color: #2798eb;
                border-color: #2798eb;
                color: #bedef5;
            }
            button:focus-visible {
                outline: 2px solid #01a0fd;
                outline-offset: 2px;
            }
        `}render(){let e=this.getAttribute(`message`)||``,t=this.getAttribute(`placeholder`)||``,n=this.getAttribute(`default-value`)||``;return`
            <dialog>
                <div class="prompt-body">
                    <div class="message">${this._escapeHTML(e)}</div>
                    <div class="input-container">
                        <input type="text" class="prompt-input" placeholder="${this._escapeAttr(t)}" value="${this._escapeAttr(n)}">
                    </div>
                    <div class="buttons">
                        <button class="btn-cancel">Cancel</button>
                        <button class="btn-ok">OK</button>
                    </div>
                </div>
            </dialog>`}onReady(){let e=this.$(`dialog`),t=this.$(`.prompt-input`),n=this.$(`.btn-ok`),r=this.$(`.btn-cancel`);setTimeout(()=>t.focus(),30),t.addEventListener(`keydown`,e=>{e.key===`Enter`?(this.emitEvent(`response`,t.value),this.close()):e.key===`Escape`&&(this.emitEvent(`response`,!1),this.close())}),n.addEventListener(`click`,()=>{this.emitEvent(`response`,t.value),this.close()}),r.addEventListener(`click`,()=>{this.emitEvent(`response`,!1),this.close()}),e.addEventListener(`click`,t=>{t.target===e&&(this.emitEvent(`response`,!1),this.close())})}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}_escapeAttr(e){return e?e.replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}},lu=[],uu=12,du=24,fu=16;function pu(){let e=du;for(let t of lu)t.style.top=`${e}px`,e+=t.offsetHeight+uu}var mu={info:{bg:`linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)`,color:`#0284c7`},success:{bg:`linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)`,color:`#16a34a`},warning:{bg:`linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)`,color:`#d97706`},error:{bg:`linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)`,color:`#dc2626`},default:{bg:`linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)`,color:`#7c3aed`}},hu={info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,success:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>`,warning:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,error:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,default:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`},gu=class extends Z{getStyles(){return`
            :host {
                position: fixed;
                right: ${fu}px;
                z-index: 999999;
                pointer-events: auto;
                transition: top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                            opacity 0.3s ease,
                            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .notification {
                width: 320px;
                border-radius: 11px;
                min-height: 54px;
                background: #ffffffcd;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                box-shadow: 0px 0px 17px -9px #000;
                border: 1px solid #d5d5d5;
                margin-bottom: 10px;
                display: flex;
                flex-direction: row;
                font-family: ${Q};
                cursor: pointer;
                position: relative;
            }
            .notification:hover .close-btn {
                display: block;
            }
            .close-btn {
                position: absolute;
                background: white;
                border: none;
                border-radius: 100%;
                top: -6px;
                left: -6px;
                width: 13px;
                height: 13px;
                padding: 2px;
                filter: drop-shadow(0px 0px 0.5px rgb(51, 51, 51));
                display: none;
                cursor: pointer;
                font-size: 9px;
                line-height: 1;
                text-align: center;
                color: #666;
                z-index: 1;
            }
            .close-btn:hover {
                background: #f0f0f0;
                color: #222;
            }
            .icon-area {
                width: 40px;
                margin: 10px 5px 10px 15px;
                border-radius: 50%;
                filter: drop-shadow(0px 0px 0.5px rgb(51, 51, 51));
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .icon-area svg {
                width: 35px;
                height: 35px;
            }
            .icon-area img {
                width: 35px;
                height: 35px;
                object-fit: contain;
                border-radius: 50%;
            }
            :host([round-icon]) .icon-area img {
                border-radius: 50%;
            }
            .content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                padding: 10px;
                min-width: 0;
            }
            .title {
                font-size: 12px;
                font-weight: 600;
                color: #333;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .text {
                font-size: 12px;
                color: #555;
                margin-top: 4px;
                line-height: 1.4;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            /* Entrance animation */
            :host(.entering) {
                transform: translateX(110%) scale(0.95);
                opacity: 0;
            }
            :host(.visible) {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            /* Exit animation */
            :host(.exiting) {
                transform: translateX(110%) scale(0.95);
                opacity: 0;
            }
            @media (max-width: 480px) {
                :host {
                    right: 10px;
                    left: 10px;
                }
                .notification {
                    width: auto;
                }
            }
            :host(.puter-theme-dark) .notification {
                background: #2d2d2dcd;
                border-color: #3a3a3a;
                box-shadow: 0px 0px 17px -6px #000;
            }
            :host(.puter-theme-dark) .close-btn {
                background: #3a3a3a;
                color: #ccc;
                filter: drop-shadow(0px 0px 0.5px rgb(230, 230, 230));
            }
            :host(.puter-theme-dark) .close-btn:hover {
                background: #4a4a4a;
                color: #fff;
            }
            :host(.puter-theme-dark) .icon-area {
                filter: drop-shadow(0px 0px 0.5px rgb(230, 230, 230));
            }
            :host(.puter-theme-dark) .title {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .text {
                color: #b0b0b0;
            }
        `}render(){let e=this.getAttribute(`title`)||``,t=this.getAttribute(`text`)||``,n=this.getAttribute(`icon`)||``,r=this.getAttribute(`type`)||`default`,i;if(n)i=`<div class="icon-area"><img src="${this._escapeAttr(n)}" alt=""></div>`;else{let e=mu[r]||mu.default,t=hu[r]||hu.default;i=`<div class="icon-area" style="color: ${e.color}">${t}</div>`}return`
            <div class="notification">
                ${i}
                <div class="content">
                    ${e?`<div class="title">${this._escapeHTML(e)}</div>`:``}
                    ${t?`<div class="text">${this._escapeHTML(t)}</div>`:``}
                </div>
                <button class="close-btn" aria-label="Close">\u2715</button>
            </div>`}onReady(){lu.push(this),this.classList.add(`entering`),requestAnimationFrame(()=>{pu(),requestAnimationFrame(()=>{this.classList.remove(`entering`),this.classList.add(`visible`)})}),this.$(`.close-btn`).addEventListener(`click`,e=>{e.stopPropagation(),this._dismiss()}),this.$(`.notification`).addEventListener(`click`,()=>{this.emitEvent(`click`,{})});let e=parseInt(this.getAttribute(`duration`)??`5000`,10);e>0&&(this._dismissTimer=setTimeout(()=>this._dismiss(),e))}_dismiss(){this._dismissed||(this._dismissed=!0,this._dismissTimer&&clearTimeout(this._dismissTimer),this.classList.remove(`visible`),this.classList.add(`exiting`),setTimeout(()=>{let e=lu.indexOf(this);e!==-1&&lu.splice(e,1),pu(),this.emitEvent(`close`,{}),this.remove()},350))}disconnectedCallback(){super.disconnectedCallback(),this._dismissTimer&&clearTimeout(this._dismissTimer);let e=lu.indexOf(this);e!==-1&&lu.splice(e,1)}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}_escapeAttr(e){return e?e.replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}},_u=class e extends Z{#e=[];#t=null;#n=null;#r=null;#i=[];#a=null;#o=`right`;#s=``;#c=null;#l=null;#u=null;get items(){return this.#e}set items(e){this.#e=e||[],this.shadowRoot&&this.isConnected&&this._rerender()}getStyles(){return`
            :host {
                position: fixed;
                z-index: 9999999999;
            }

            /* .context-menu — lines 1647-1666 of style.css */
            .context-menu {
                overflow: hidden;
                white-space: nowrap;
                font-family: sans-serif;
                background: #fff;
                color: #333;
                border-radius: 8px;
                padding: 3px 0;
                min-width: 200px;
                background-color: rgb(255 255 255 / 85%);
                backdrop-filter: blur(3px);
                border: 1px solid #dcdcdc;
                box-shadow: 0px 3px 20px #00000022;
                margin-top: 5px;
                padding-left: 4px;
                padding-right: 4px;
                padding-top: 4px;
                padding-bottom: 4px;
                user-select: none;
                -webkit-user-select: none;
            }

            /* .context-menu-item:not(.context-menu-divider) — lines 1686-1694 */
            .menu-item {
                display: flex;
                align-items: center;
                padding: 5px 8px;
                list-style-type: none;
                user-select: none;
                -webkit-user-select: none;
                font-size: 12px;
                height: 28px;
                box-sizing: border-box;
                position: relative;
                cursor: default;
                white-space: nowrap;
                color: #333;
            }

            /* .context-menu-item-active:not(.context-menu-divider) — lines 1742-1745 */
            .menu-item:hover:not(.disabled):not(.divider),
            .menu-item.focused:not(.disabled):not(.divider),
            .menu-item.has-open-submenu {
                background-color: hsl(213, 74%, 56%);
                color: white;
                border-radius: 4px;
            }

            /* Active item turns all children white.
               For .has-open-submenu the :hover branch above already covers
               the hovered case; in the non-hovered grey state we want the
               children to keep their default colors, so we don't include
               .has-open-submenu here. */
            .menu-item:hover:not(.disabled):not(.divider) .icon,
            .menu-item:hover:not(.disabled):not(.divider) .check,
            .menu-item:hover:not(.disabled):not(.divider) .submenu-arrow,
            .menu-item:hover:not(.disabled):not(.divider) .label,
            .menu-item:hover:not(.disabled):not(.divider) .shortcut,
            .menu-item.focused:not(.disabled):not(.divider) .icon,
            .menu-item.focused:not(.disabled):not(.divider) .check,
            .menu-item.focused:not(.disabled):not(.divider) .submenu-arrow,
            .menu-item.focused:not(.disabled):not(.divider) .label,
            .menu-item.focused:not(.disabled):not(.divider) .shortcut {
                color: white;
            }
            .menu-item:hover:not(.disabled):not(.divider) .icon svg,
            .menu-item.focused:not(.disabled):not(.divider) .icon svg {
                filter: brightness(0) invert(1);
            }
            .menu-item:hover:not(.disabled):not(.divider) .icon img,
            .menu-item.focused:not(.disabled):not(.divider) .icon img {
                filter: brightness(0) invert(1);
            }

            /* Safe-triangle: while the cursor traces a diagonal path toward
               an open submenu, suppress :hover highlight on intermediate
               items so they don't flash blue.
               Keyboard-nav: after a keyboard navigation, suppress :hover on
               the (now stale) item the mouse is still resting on so only
               the keyboard-focused item highlights. Cleared on next
               mousemove. .focused and .has-open-submenu (managed by JS)
               still highlight normally. */
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider),
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) {
                background-color: transparent;
                color: #333;
            }
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon,
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .check,
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .submenu-arrow,
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .label,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .check,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .submenu-arrow,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .label {
                color: #333;
            }
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .shortcut,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .shortcut {
                color: #999;
            }
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon svg,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon svg {
                filter: none;
            }
            .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon img,
            .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon img {
                filter: drop-shadow(0px 0px 0.3px rgb(51, 51, 51));
            }

            /* .has-open-context-menu-submenu — line 1738-1739 */
            .menu-item.has-open-submenu:not(:hover) {
                background-color: #dfdfdf;
                color: #333;
            }
            .menu-item.has-open-submenu:not(:hover) .icon,
            .menu-item.has-open-submenu:not(:hover) .icon svg,
            .menu-item.has-open-submenu:not(:hover) .icon img {
                filter: none;
                color: #333;
            }

            /* .context-menu-item-disabled — lines 1753-1758 */
            .menu-item.disabled {
                opacity: 0.5;
                background-color: transparent;
                color: initial;
                cursor: initial;
            }

            /* Danger items: no special color in puter.com default theme */
            .menu-item.danger {
                color: #333;
            }
            .menu-item.danger .icon {
                color: #333;
            }

            /* .context-menu-divider — lines 1681-1684 */
            .divider {
                padding-top: 5px;
                padding-bottom: 5px;
                cursor: default;
                height: auto;
            }
            .divider hr {
                border: none;
                background: #ccc;
                height: 1px;
                width: 100%;
                margin: 0;
            }

            /* .context-menu-item-icon — lines 1760-1767 */
            .icon {
                display: inline-block;
                width: 20px;
                text-align: center;
                margin-right: 5px;
                font-size: 14px;
                line-height: 5px;
                flex-shrink: 0;
                color: #333;
            }
            .icon svg {
                width: 15px;
                height: 15px;
                vertical-align: middle;
            }
            /* .ctx-item-icon — lines 1696-1703 */
            .icon img {
                width: 15px;
                height: 15px;
                object-fit: contain;
                filter: drop-shadow(0px 0px 0.3px rgb(51, 51, 51));
            }

            .label {
                flex: 1;
                font-weight: 400;
            }

            .check {
                width: 20px;
                text-align: center;
                margin-right: 5px;
                flex-shrink: 0;
                font-size: 14px;
                line-height: 5px;
                color: #333;
            }

            /* .submenu-arrow — lines 1705-1709 */
            .submenu-arrow {
                width: 15px;
                height: 15px;
                float: right;
                flex-shrink: 0;
                color: #555;
            }

            .shortcut {
                margin-left: 16px;
                font-size: 11px;
                color: #999;
                flex-shrink: 0;
                letter-spacing: 0.5px;
            }

            /* === iOS-style action sheet (mobile) ========================= */
            :host(.sheet-mode) {
                left: 0 !important;
                right: 0 !important;
                top: auto !important;
                bottom: 0 !important;
                padding: 0 8px calc(8px + env(safe-area-inset-bottom)) 8px;
                box-sizing: border-box;
                animation: puter-sheet-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
            }

            :host(.sheet-mode.sheet-closing) {
                animation: puter-sheet-out 240ms cubic-bezier(0.4, 0, 1, 1) forwards;
            }

            @keyframes puter-sheet-in {
                from { transform: translateY(100%); }
                to   { transform: translateY(0); }
            }

            @keyframes puter-sheet-out {
                from { transform: translateY(0); }
                to   { transform: translateY(100%); }
            }

            :host(.sheet-mode) .context-menu {
                min-width: 0;
                width: 100%;
                border-radius: 14px;
                padding: 6px 0;
                background-color: rgb(255 255 255 / 96%);
                border: none;
                box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.18);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                             Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
            }

            :host(.sheet-mode) .menu-item {
                height: auto;
                min-height: 48px;
                padding: 12px 16px;
                font-size: 16px;
                border-radius: 0;
                gap: 10px;
            }

            /* Keyboard shortcuts have no meaning on touch / small-screen
               devices — hide them so labels can use the full width. */
            @media (max-width: 480px), (pointer: coarse) {
                .shortcut {
                    display: none;
                }
            }

            :host(.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) {
                background-color: rgba(0, 122, 255, 0.1);
                color: inherit;
                border-radius: 0;
            }
            :host(.sheet-mode) .menu-item:active:not(.disabled):not(.divider) {
                background-color: rgba(0, 122, 255, 0.2);
            }
            :host(.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) .label,
            :host(.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) .icon,
            :host(.sheet-mode) .menu-item:active:not(.disabled):not(.divider) .label,
            :host(.sheet-mode) .menu-item:active:not(.disabled):not(.divider) .icon {
                color: #333;
            }
            :host(.sheet-mode) .menu-item:hover .icon svg,
            :host(.sheet-mode) .menu-item:active .icon svg,
            :host(.sheet-mode) .menu-item:hover .icon img,
            :host(.sheet-mode) .menu-item:active .icon img {
                filter: none;
            }

            :host(.sheet-mode) .divider {
                min-height: 24px;
                padding: 0;
                display: flex;
                align-items: center;
            }
            :host(.sheet-mode) .divider hr {
                background: rgba(60, 60, 67, 0.2);
            }

            :host(.sheet-mode) .icon {
                width: 24px;
                margin-right: 0px;
            }
            :host(.sheet-mode) .icon svg,
            :host(.sheet-mode) .icon img {
                width: 20px;
                height: 20px;
            }

            /* Dark theme — applied when system prefers dark and no light
               override is set, or when theme="dark" is forced. The base
               class toggles .puter-theme-dark on the host accordingly. */
            :host(.puter-theme-dark) .context-menu {
                background: #2d2d2d;
                background-color: rgb(45 45 45 / 94%);
                color: #e6e6e6;
                border-color: #00000080;
                box-shadow: 0px 0px 15px #000000aa;
            }
            :host(.puter-theme-dark) .menu-item {
                color: #e6e6e6;
            }
            /* Inactive items: icon/check/shortcut/arrow tones */
            :host(.puter-theme-dark) .icon,
            :host(.puter-theme-dark) .check {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .submenu-arrow {
                color: #b0b0b0;
            }
            :host(.puter-theme-dark) .shortcut {
                color: #888;
            }
            :host(.puter-theme-dark) .icon img {
                filter: drop-shadow(0px 0px 0.3px rgb(230, 230, 230));
            }
            /* Inactive icon SVGs use currentColor already; nothing to invert */

            /* Safe-triangle / keyboard-nav: non-active hover restored colors should match dark */
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider),
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon,
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .check,
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .submenu-arrow,
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .label,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .check,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .submenu-arrow,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .label {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .shortcut,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .shortcut {
                color: #888;
            }
            :host(.puter-theme-dark) .context-menu.safe-traverse .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon img,
            :host(.puter-theme-dark) .context-menu.keyboard-nav .menu-item:hover:not(.has-open-submenu):not(.focused):not(.disabled):not(.divider) .icon img {
                filter: drop-shadow(0px 0px 0.3px rgb(230, 230, 230));
            }

            /* Submenu-open parent (no hover): subtle dark highlight */
            :host(.puter-theme-dark) .menu-item.has-open-submenu:not(:hover) {
                background-color: #3f3f3f;
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .menu-item.has-open-submenu:not(:hover) .icon,
            :host(.puter-theme-dark) .menu-item.has-open-submenu:not(:hover) .icon svg,
            :host(.puter-theme-dark) .menu-item.has-open-submenu:not(:hover) .icon img {
                color: #e6e6e6;
            }

            /* Danger items */
            :host(.puter-theme-dark) .menu-item.danger,
            :host(.puter-theme-dark) .menu-item.danger .icon {
                color: #ff7b72;
            }

            /* Divider */
            :host(.puter-theme-dark) .divider hr {
                background: #444;
            }

            /* Sheet mode (mobile) */
            :host(.puter-theme-dark.sheet-mode) .context-menu {
                background-color: rgb(40 40 40 / 96%);
                box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.45);
            }
            :host(.puter-theme-dark.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) {
                background-color: rgba(0, 122, 255, 0.22);
            }
            :host(.puter-theme-dark.sheet-mode) .menu-item:active:not(.disabled):not(.divider) {
                background-color: rgba(0, 122, 255, 0.35);
            }
            :host(.puter-theme-dark.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) .label,
            :host(.puter-theme-dark.sheet-mode) .menu-item:hover:not(.disabled):not(.divider) .icon,
            :host(.puter-theme-dark.sheet-mode) .menu-item:active:not(.disabled):not(.divider) .label,
            :host(.puter-theme-dark.sheet-mode) .menu-item:active:not(.disabled):not(.divider) .icon {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark.sheet-mode) .divider hr {
                background: rgba(255, 255, 255, 0.15);
            }
        `}render(){return`<div class="context-menu">${this._renderItems(this.#e)}</div>`}_renderItems(e){let t=e.some(e=>e&&typeof e==`object`&&(e.icon||e.checked!==void 0));return e.map((e,n)=>{if(e===`-`||e.separator)return`<div class="menu-item divider"><hr></div>`;let r=[`menu-item`];e.disabled&&r.push(`disabled`),(e.type===`danger`||e.danger)&&r.push(`danger`);let i=e.items&&e.items.length>0,a=``;e.checked===void 0?e.icon?a=e.icon.startsWith(`<`)?`<span class="icon">${e.icon}</span>`:`<span class="icon"><img src="${this._escapeAttr(e.icon)}" alt=""></span>`:t&&(a=`<span class="icon"></span>`):a=`<span class="check">${e.checked?`✓`:``}</span>`;let o=i?`<svg class="submenu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`:``,s=e.shortcut?`<span class="shortcut">${this._escapeHTML(this._formatShortcut(e.shortcut))}</span>`:``;return`
                <div class="${r.join(` `)}" data-index="${n}" ${i?`data-has-submenu="true"`:``}>
                    ${a}
                    <span class="label">${this._escapeHTML(e.label||``)}</span>
                    ${s}
                    ${o}
                </div>`}).join(``)}onReady(){this._positionMenu(),this._bindEvents()}_positionMenu(){let e=this.$(`.context-menu`);if(!e)return;if(this._isMobile()){this.classList.add(`sheet-mode`),this.hasAttribute(`data-submenu`)||this._showBackdrop();return}let t=parseInt(this.getAttribute(`x`)||`0`,10),n=parseInt(this.getAttribute(`y`)||`0`,10);this.style.left=`${t}px`,this.style.top=`${n}px`,!this.hasAttribute(`data-parent-managed`)&&requestAnimationFrame(()=>{let n=e.getBoundingClientRect();n.right>window.innerWidth&&(this.style.left=`${Math.max(0,t-n.width)}px`),n.bottom>window.innerHeight&&(this.style.top=`${Math.max(0,window.innerHeight-n.height-10)}px`)})}_isMobile(){return window.innerWidth<=480||window.matchMedia&&window.matchMedia(`(pointer: coarse)`).matches&&window.innerWidth<768}_showBackdrop(){if(this._backdrop)return;let e=document.createElement(`div`);e.style.cssText=`
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 999999998;
            opacity: 0;
            transition: opacity 0.2s ease;
        `,document.body.appendChild(e),requestAnimationFrame(()=>{e.style.opacity=`1`}),e.addEventListener(`click`,()=>this._closeAll()),this._backdrop=e}_hideBackdrop(){if(!this._backdrop)return;let e=this._backdrop;e.style.opacity=`0`,setTimeout(()=>e.remove(),200),this._backdrop=null}_bindEvents(){this._outsideClickHandler&&document.removeEventListener(`pointerdown`,this._outsideClickHandler,!0),this._keyHandler&&document.removeEventListener(`keydown`,this._keyHandler,!0),this.#l&&=(document.removeEventListener(`mousemove`,this.#l),null),this.$$(`.menu-item.divider, .menu-item.disabled`).forEach(e=>{e.addEventListener(`mouseenter`,()=>{if(this.#t&&this._isMouseHeadingToSubmenu(this.#t.element)){this._setSafeTraverse(!0),this.#a&&=(clearTimeout(this.#a),null),this.#a=setTimeout(()=>this._submenuCloseCheck(),100);return}this._setSafeTraverse(!1),this._clearFocus(),clearTimeout(this.#n),this._cancelSubmenuClose(),this._hideActiveSubmenu()})}),this.$$(`.menu-item:not(.divider):not(.disabled)`).forEach(e=>{let t=parseInt(e.dataset.index,10),n=this.#e[t];n&&(e.addEventListener(`click`,t=>{if(t.stopPropagation(),n.items&&n.items.length>0){(!this.#t||this.#t.parentEl!==e)&&(clearTimeout(this.#n),this._cancelSubmenuClose(),this._showSubmenu(e,n.items));return}typeof n.action==`function`&&n.action(),this.emitEvent(`select`,n),this._closeAll()}),e.addEventListener(`mouseenter`,()=>{if(e.dataset.hasSubmenu===`true`){if(this.#t&&this.#t.parentEl!==e&&this._isMouseHeadingToSubmenu(this.#t.element)){this.#u=t,this._setSafeTraverse(!0),this.#a&&=(clearTimeout(this.#a),null),this.#a=setTimeout(()=>this._submenuCloseCheck(),100);return}this.#u=null,this._setSafeTraverse(!1),this._setFocusIndex(t),this._cancelSubmenuClose(),clearTimeout(this.#n),this.#t&&this.#t.parentEl!==e?this._showSubmenu(e,n.items):this.#t||(this.#n=setTimeout(()=>{this._showSubmenu(e,n.items)},200))}else if(this.#t){if(this._isMouseHeadingToSubmenu(this.#t.element)){this.#u=t,this._setSafeTraverse(!0),this.#a&&=(clearTimeout(this.#a),null),this.#a=setTimeout(()=>this._submenuCloseCheck(),100);return}this._setSafeTraverse(!1),this._setFocusIndex(t),this._scheduleSubmenuClose()}else this._setSafeTraverse(!1),this._setFocusIndex(t)}),e.addEventListener(`mouseleave`,()=>{this._isMobile()||(clearTimeout(this.#n),e.dataset.hasSubmenu===`true`&&this.#t&&this.#t.parentEl===e&&this._scheduleSubmenuClose())}))});let e=this.$(`.context-menu`);e&&e.addEventListener(`mouseleave`,()=>{this._clearFocus()}),this._outsideClickHandler=e=>{this._isEventInChain(e)||this._closeAll()},setTimeout(()=>{document.addEventListener(`pointerdown`,this._outsideClickHandler,!0)},0),this.#l=e=>{this.#i.push({x:e.clientX,y:e.clientY}),this.#i.length>3&&this.#i.shift(),this._setKeyboardNav(!1)},document.addEventListener(`mousemove`,this.#l),this._keyHandler=e=>{this.#t||this._handleKey(e)&&(this._setKeyboardNav(!0),e.preventDefault(),e.stopImmediatePropagation())},document.addEventListener(`keydown`,this._keyHandler,!0)}_handleKey(e){let t=e.key;if(e.metaKey||e.ctrlKey)return!1;switch(t){case`Escape`:return this._closeAll(),!0;case`ArrowDown`:return this._moveFocus(1),!0;case`ArrowUp`:if(!this._parentMenu){let e=this._focusableIndices();if(e.length&&this.#r===e[0])return this.dispatchEvent(new CustomEvent(`puter-menu-navigate`,{detail:{direction:`up`},bubbles:!0,composed:!0})),!0}return this._moveFocus(-1),!0;case`Home`:{let e=this._focusableIndices();return e.length&&this._setFocusIndex(e[0]),!0}case`End`:{let e=this._focusableIndices();return e.length&&this._setFocusIndex(e[e.length-1]),!0}case`Enter`:case` `:return this._activateFocused(),!0;case`ArrowRight`:return this._openFocusedSubmenu()||this._parentMenu||this.dispatchEvent(new CustomEvent(`puter-menu-navigate`,{detail:{direction:`right`},bubbles:!0,composed:!0})),!0;case`ArrowLeft`:if(this._parentMenu){this._parentMenu._hideActiveSubmenu();let e=this._parentItemEl;if(e){let t=parseInt(e.dataset.index,10);this._parentMenu._setFocusIndex(t)}return!0}return this.dispatchEvent(new CustomEvent(`puter-menu-navigate`,{detail:{direction:`left`},bubbles:!0,composed:!0})),!0;case`Tab`:return this._closeAll(),!0;default:return t.length===1&&!e.altKey&&this._typeahead(t)}}_focusableIndices(){let e=[];return this.#e.forEach((t,n)=>{t===`-`||t&&t.separator||t&&t.disabled||e.push(n)}),e}_setFocusIndex(e){this.#r=e,this.$$(`.menu-item`).forEach(t=>{let n=parseInt(t.dataset.index,10);t.classList.toggle(`focused`,n===e)});let t=this._itemEl(e);t&&typeof t.scrollIntoView==`function`&&t.scrollIntoView({block:`nearest`})}_clearFocus(){this.#r=null,this.$$(`.menu-item.focused`).forEach(e=>e.classList.remove(`focused`))}_itemEl(e){return this.$(`.menu-item[data-index="${e}"]`)}_moveFocus(e){let t=this._focusableIndices();if(!t.length)return;let n=t.indexOf(this.#r);n===-1&&(n=e>0?-1:t.length);let r=(n+e+t.length)%t.length;this._setFocusIndex(t[r])}_activateFocused(){if(this.#r===null)return;let e=this._itemEl(this.#r);e&&e.click()}_openFocusedSubmenu(){if(this.#r===null)return!1;let e=this.#e[this.#r];if(!e||!e.items||!e.items.length)return!1;let t=this._itemEl(this.#r);if(!t)return!1;clearTimeout(this.#n),this._cancelSubmenuClose();let n=!this.#t||this.#t.parentEl!==t;return n&&this._showSubmenu(t,e.items),requestAnimationFrame(()=>{let e=this.#t&&this.#t.element;if(e){if(n){let t=e._focusableIndices();t.length&&e._setFocusIndex(t[0])}typeof e._setKeyboardNav==`function`&&e._setKeyboardNav(!0)}}),!0}_typeahead(e){let t=e.toLowerCase();this.#s+=t,clearTimeout(this.#c),this.#c=setTimeout(()=>{this.#s=``},500);let n=this._focusableIndices();if(!n.length)return!1;let r=n.indexOf(this.#r),i=this.#s;for(let e=1;e<=n.length;e++){let t=n[(Math.max(0,r)+e)%n.length];if((this.#e[t]&&this.#e[t].label||``).toLowerCase().startsWith(i))return this._setFocusIndex(t),!0}if(i.length>1)for(let e=1;e<=n.length;e++){let i=n[(Math.max(0,r)+e)%n.length];if((this.#e[i]&&this.#e[i].label||``).toLowerCase().startsWith(t))return this._setFocusIndex(i),this.#s=t,!0}return!1}_showSubmenu(e,t){this._hideActiveSubmenu(),this._cancelSubmenuClose(),e.classList.add(`has-open-submenu`),e.classList.remove(`focused`);let n=document.createElement(`puter-context-menu`);n.setAttribute(`data-submenu`,``),n.setAttribute(`data-parent-managed`,``);let r=this.getAttribute(`theme`);r&&n.setAttribute(`theme`,r),n.items=t,n._parentMenu=this,n._parentItemEl=e;let i=e.getBoundingClientRect(),a=window.innerWidth<480;a?(n.setAttribute(`x`,String(i.left)),n.setAttribute(`y`,String(i.bottom+2)),this.#o=`below`):(n.setAttribute(`x`,String(i.right+2)),n.setAttribute(`y`,String(i.top)),this.#o=`right`),n.addEventListener(`select`,e=>{this.emitEvent(`select`,e.detail),this._closeAll()}),this.classList.contains(`sheet-mode`)&&(this.style.display=`none`,this._sheetHidden=!0),document.body.appendChild(n),this.#t={element:n,parentEl:e},requestAnimationFrame(()=>{if(!this.#t||this.#t.element!==n)return;let e=n.shadowRoot&&n.shadowRoot.querySelector(`.context-menu`);if(!e)return;let t=e.getBoundingClientRect(),r=t.width,o=t.height;if(a){let e=i.left;e+r>window.innerWidth&&(e=Math.max(0,window.innerWidth-r-4));let t=i.bottom+2;t+o>window.innerHeight-10&&(t=Math.max(0,window.innerHeight-o-10)),n.style.left=`${e}px`,n.style.top=`${t}px`}else{let e=i.right+2;e+r>window.innerWidth&&(e=Math.max(0,i.left-r-2),this.#o=`left`);let t=i.top;t+o>window.innerHeight-10&&(t=Math.max(0,window.innerHeight-o-10)),n.style.left=`${e}px`,n.style.top=`${t}px`}}),n.addEventListener(`mouseenter`,()=>{this._cancelSubmenuClose(),clearTimeout(this.#n)}),n.addEventListener(`mouseleave`,()=>{this._scheduleSubmenuClose()})}_scheduleSubmenuClose(){this._cancelSubmenuClose(),this.#a=setTimeout(()=>this._submenuCloseCheck(),50)}_cancelSubmenuClose(){this.#a&&=(clearTimeout(this.#a),null),this.#u=null,this._setSafeTraverse(!1)}_submenuCloseCheck(){if(this.#a=null,!this.#t){this._setSafeTraverse(!1);return}let e=this.#t.element,t=this.#t.parentEl,n=this.#i[this.#i.length-1];if(n&&(this._pointInElement(n,e)||this._pointInRect(n,t.getBoundingClientRect()))){this._setSafeTraverse(!1);return}if(this._isMouseHeadingToSubmenu(e)){this.#a=setTimeout(()=>this._submenuCloseCheck(),300);return}this._setSafeTraverse(!1),this._hideActiveSubmenu()}_setSafeTraverse(e){let t=this.$(`.context-menu`);t&&t.classList.toggle(`safe-traverse`,e)}_setKeyboardNav(e){let t=this.$(`.context-menu`);t&&t.classList.toggle(`keyboard-nav`,e)}_pointInRect(e,t){return e.x>=t.left&&e.x<=t.right&&e.y>=t.top&&e.y<=t.bottom}_pointInElement(e,t){let n=t.shadowRoot&&t.shadowRoot.querySelector(`.context-menu`);return n?this._pointInRect(e,n.getBoundingClientRect()):!1}_isMouseHeadingToSubmenu(e){if(this.#i.length<2)return!1;let t=e.shadowRoot&&e.shadowRoot.querySelector(`.context-menu`);if(!t)return!1;let n=t.getBoundingClientRect(),r=this.#i[this.#i.length-1],i=this.#i[0],a,o;switch(this.#o){case`left`:a={x:n.right,y:n.bottom},o={x:n.right,y:n.top};break;case`below`:a={x:n.right,y:n.top},o={x:n.left,y:n.top};break;default:a={x:n.left,y:n.top},o={x:n.left,y:n.bottom}}let s=(e,t)=>(t.y-e.y)/(t.x-e.x),c=s(r,a),l=s(r,o),u=s(i,a),d=s(i,o);return c<u&&l>d}_hideSubmenu(e){this.#t&&this.#t.parentEl===e&&this._hideActiveSubmenu()}_hideActiveSubmenu(e=!0){if(this.#t&&=(this.#t.element._closing||this.#t.element.remove(),this.#t.parentEl.classList.remove(`has-open-submenu`),null),e&&this._sheetHidden&&(this.style.display=``,this._sheetHidden=!1),this.#u!==null){let e=this.#u;this.#u=null,this._setFocusIndex(e);let t=this.#e[e];if(t&&t.items&&t.items.length){let n=this._itemEl(e);n&&this._showSubmenu(n,t.items)}}this._setSafeTraverse(!1)}_closeAll(){if(this._closing)return;this._closing=!0,this._cancelSubmenuClose(),clearTimeout(this.#n),clearTimeout(this.#c);let e=this._sheetHidden;this._hideActiveSubmenu(!1),this._outsideClickHandler&&document.removeEventListener(`pointerdown`,this._outsideClickHandler,!0),this._keyHandler&&document.removeEventListener(`keydown`,this._keyHandler,!0),this.#l&&=(document.removeEventListener(`mousemove`,this.#l),null),this.emitEvent(`close`,{}),this.classList.contains(`sheet-mode`)?(this._hideBackdrop(),e?this.remove():(this.classList.add(`sheet-closing`),setTimeout(()=>this.remove(),250))):this.remove()}disconnectedCallback(){super.disconnectedCallback(),this._outsideClickHandler&&document.removeEventListener(`pointerdown`,this._outsideClickHandler,!0),this._keyHandler&&document.removeEventListener(`keydown`,this._keyHandler,!0),this.#l&&=(document.removeEventListener(`mousemove`,this.#l),null),this._cancelSubmenuClose(),clearTimeout(this.#n),clearTimeout(this.#c),this._hideActiveSubmenu(),this._hideBackdrop()}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}_escapeAttr(e){return e?e.replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}_formatShortcut(t){if(!t)return``;let n=e._isMac(),r=String(t).replace(/⌘/g,`Mod+`).replace(/⌃/g,`Ctrl+`).replace(/⌥/g,`Alt+`).replace(/⇧/g,`Shift+`).split(`+`).map(e=>e.trim()).filter(Boolean).map(e=>{switch(e.toLowerCase()){case`mod`:case`cmd`:case`command`:return n?`⌘`:`Ctrl`;case`ctrl`:case`control`:return n?`⌃`:`Ctrl`;case`alt`:case`option`:case`opt`:return n?`⌥`:`Alt`;case`shift`:return n?`⇧`:`Shift`;case`meta`:case`super`:case`win`:return n?`⌘`:`Win`;default:return e}});return n?r.join(``):r.join(`+`)}_getActiveSubmenu(){return this.#t}_isEventInChain(e){let t=e.target;if(!t)return!1;if(this.contains(t))return!0;let n=this.#t;for(;n&&n.element;){if(n.element.contains(t))return!0;n=n.element._getActiveSubmenu?n.element._getActiveSubmenu():null}return!1}static _isMac(){if(typeof navigator>`u`)return!1;let e=navigator.userAgentData;return e&&typeof e.platform==`string`?/mac/i.test(e.platform):/Mac|iPhone|iPad|iPod/i.test(navigator.platform||navigator.userAgent||``)}},vu=class extends Z{getStyles(){return`
            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(2px);
                -webkit-backdrop-filter: blur(2px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: ${Q};
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            :host(.visible) .overlay {
                opacity: 1;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e0e0e0;
                border-top-color: #088ef0;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .text {
                margin-top: 16px;
                font-size: 14px;
                color: #666666;
                text-align: center;
                padding: 0 20px;
                max-width: 90vw;
            }
            @media (max-width: 480px) {
                .spinner {
                    width: 48px;
                    height: 48px;
                    border-width: 4px;
                }
                .text {
                    font-size: 16px;
                }
            }
        `}render(){let e=this.getAttribute(`text`)||``;return`
            <div class="overlay">
                <div class="spinner"></div>
                ${e?`<div class="text">${this._escapeHTML(e)}</div>`:``}
            </div>`}onReady(){requestAnimationFrame(()=>{this.classList.add(`visible`)})}open(){this.classList.add(`visible`)}close(){this.classList.remove(`visible`),setTimeout(()=>this.remove(),200)}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}},yu=class extends Z{#e=[];#t=null;#n=null;#r=null;#i=!1;#a=!1;#o=!1;get items(){return this.#e}set items(e){this.#e=e||[],this.shadowRoot&&this.isConnected&&this._rerender()}getStyles(){return`
            :host {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                font-family: ${Q};
                user-select: none;
                -webkit-user-select: none;
            }
            .menubar {
                display: flex;
                box-sizing: border-box;
                overflow: hidden;
                border-bottom: 1px solid #e3e3e3;
                background-color: #fafafa;
                padding: 2px 5px;
                align-items: center;
                height: 36px;
            }
            .menu-button {
                background: none;
                border: none;
                font-family: inherit;
                padding: 3px 10px;
                font-size: 13px;
                border-radius: 3px;
                cursor: default;
                color: #333;
                line-height: 1.2;
                margin: 0 1px;
            }
            /* Hover is driven by JS (.hovered) rather than :hover so we can
               clear stale keyboard focus the moment the mouse takes over and
               keep the two highlight sources from ever co-existing. */
            .menu-button.hovered,
            .menu-button.active,
            .menu-button.focused {
                background-color: #e2e2e2;
            }
            /* Suppress browser-native focus ring and tap highlight without
               touching background. CAUTION: setting background-color here
               would tie specificity with .menu-button.active and win by
               source order, which would erase the open-menu highlight as
               soon as the button takes DOM :focus from a click. */
            .menu-button:focus,
            .menu-button:focus-visible,
            .menu-button:active {
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }
            @media (max-width: 480px) {
                .menubar {
                    height: 40px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .menubar::-webkit-scrollbar {
                    display: none;
                }
                .menu-button {
                    font-size: 14px;
                    padding: 6px 12px;
                    flex-shrink: 0;
                }
            }
            /* Dark theme — applied when system prefers dark and no light
               override is set, or when theme="dark" is forced. The base
               class toggles .puter-theme-dark on the host accordingly. */
            :host(.puter-theme-dark) .menubar {
                background-color: #2a2a2a;
                border-bottom-color: #3a3a3a;
            }
            :host(.puter-theme-dark) .menu-button {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .menu-button.hovered,
            :host(.puter-theme-dark) .menu-button.active,
            :host(.puter-theme-dark) .menu-button.focused {
                background-color: #3a3a3a;
            }
        `}render(){return`<div class="menubar">${(this.#e||[]).map((e,t)=>`<button class="menu-button" data-index="${t}">${this._escapeHTML(e.label||``)}</button>`).join(``)}</div>`}onReady(){this._keyHandler&&document.removeEventListener(`keydown`,this._keyHandler,!0),this._keyUpHandler&&document.removeEventListener(`keyup`,this._keyUpHandler,!0),this._docPointerDownHandler&&document.removeEventListener(`pointerdown`,this._docPointerDownHandler,!0),this._docFocusInHandler&&document.removeEventListener(`focusin`,this._docFocusInHandler,!0),this._winBlurHandler&&window.removeEventListener(`blur`,this._winBlurHandler),this._mouseMoveHandler&&document.removeEventListener(`mousemove`,this._mouseMoveHandler),this.$$(`.menu-button`).forEach(e=>{let t=parseInt(e.dataset.index,10),n=this.#e[t];n&&(e.addEventListener(`click`,r=>{if(r.stopPropagation(),this._suppressClickFor===e){this._suppressClickFor=null;return}if(this.#r=t,this.#i=!0,this.#n===e){this._closeDropdown(),this._deactivateMenubar();return}this._openDropdown(e,n)}),e.addEventListener(`mouseenter`,()=>{e.classList.add(`hovered`),this.#r!==null&&(this.#r=null,this._renderButtonFocus());let t=this.shadowRoot,r=t&&t.activeElement;r&&r!==e&&r.classList.contains(`menu-button`)&&r.blur(),this._setKeyboardNav(!1),this.#t&&this.#n!==e&&this._openDropdown(e,n)}),e.addEventListener(`mouseleave`,()=>{e.classList.remove(`hovered`)}))}),this._keyHandler=e=>this._onGlobalKeyDown(e),this._keyUpHandler=e=>this._onGlobalKeyUp(e),document.addEventListener(`keydown`,this._keyHandler,!0),document.addEventListener(`keyup`,this._keyUpHandler,!0),this._docPointerDownHandler=e=>{let t=typeof e.composedPath==`function`?e.composedPath():[];this.#n&&t.includes(this.#n)&&(this._suppressClickFor=this.#n,clearTimeout(this._suppressClickTimer),this._suppressClickTimer=setTimeout(()=>{this._suppressClickFor=null},400)),this.#i&&!this.#t&&!t.includes(this)&&this._deactivateMenubar()},document.addEventListener(`pointerdown`,this._docPointerDownHandler,!0),this._docFocusInHandler=e=>{this.#i&&(this.#t||(typeof e.composedPath==`function`?e.composedPath():[]).includes(this)||this._deactivateMenubar())},document.addEventListener(`focusin`,this._docFocusInHandler,!0),this._winBlurHandler=()=>{this.#i&&!this.#t&&this._deactivateMenubar(),this.#a=!1,this.#o=!1},window.addEventListener(`blur`,this._winBlurHandler),this._mouseMoveHandler=()=>this._setKeyboardNav(!1),document.addEventListener(`mousemove`,this._mouseMoveHandler)}_onGlobalKeyDown(e){if(e.key===`Alt`&&!e.repeat?(this.#a=!0,this.#o=!1):this.#a&&e.key!==`Alt`&&(this.#o=!0),e.key===`F10`){this.#i||this.#t?(this._closeDropdown(),this._deactivateMenubar()):this._activateMenubar(),e.preventDefault(),e.stopImmediatePropagation();return}if(!this.#t&&this.#i){switch(e.key){case`ArrowRight`:this._moveButtonFocus(1,{openDropdown:!0});break;case`ArrowLeft`:this._moveButtonFocus(-1,{openDropdown:!0});break;case`ArrowDown`:case`Enter`:case` `:this._openFocusedButton(!0);break;case`Escape`:case`Tab`:this._deactivateMenubar();break;default:return}e.preventDefault(),e.stopImmediatePropagation()}}_onGlobalKeyUp(e){if(e.key===`Alt`){let t=this.#a&&!this.#o;this.#a=!1,this.#o=!1,t&&(this.#i||this.#t?(this._closeDropdown(),this._deactivateMenubar()):this._activateMenubar(),e.preventDefault(),e.stopImmediatePropagation())}}_activateMenubar(){this.#e&&this.#e.length&&(document.querySelector(`puter-context-menu`)||(this.#i=!0,this.#r=0,this._renderButtonFocus(),this._setKeyboardNav(!0)))}_deactivateMenubar(){this.#i=!1,this.#r=null,this._renderButtonFocus(),this._setKeyboardNav(!1)}_renderButtonFocus(){this.$$(`.menu-button`).forEach(e=>{let t=parseInt(e.dataset.index,10);e.classList.toggle(`focused`,t===this.#r)})}_setKeyboardNav(e){let t=this.$(`.menubar`);t&&t.classList.toggle(`keyboard-nav`,e)}_moveButtonFocus(e,{swapDropdown:t=!0,openDropdown:n=!1}={}){if(!this.#e.length)return;let r=this.#e.length,i=((this.#r==null?e>0?-1:0:this.#r)+e+r)%r;this.#r=i,this._renderButtonFocus(),this._setKeyboardNav(!0);let a=this._buttonEl(i),o=this.#e[i];if(a&&o){if(t&&this.#t){this._openDropdown(a,o);return}n&&this._openFocusedButton(!1)}}_buttonEl(e){return this.$(`.menu-button[data-index="${e}"]`)}_openFocusedButton(e){if(this.#r==null)return;let t=this._buttonEl(this.#r),n=this.#e[this.#r];t&&n&&(this._openDropdown(t,n),e&&this.#t&&requestAnimationFrame(()=>{let e=this.#t;if(e&&typeof e._focusableIndices==`function`){let t=e._focusableIndices();t.length&&e._setFocusIndex(t[0]),typeof e._setKeyboardNav==`function`&&e._setKeyboardNav(!0)}}))}_openDropdown(e,t){if(this._closeDropdown(),typeof t.action==`function`&&(!t.items||t.items.length===0)){t.action(),this.emitEvent(`select`,t);return}if(!t.items||t.items.length===0)return;let n=e.getBoundingClientRect(),r=document.createElement(`puter-context-menu`);r.setAttribute(`data-submenu`,``);let i=this.getAttribute(`theme`);i&&r.setAttribute(`theme`,i),r.items=t.items,r.setAttribute(`x`,String(n.left)),r.setAttribute(`y`,String(n.bottom)),r.addEventListener(`select`,e=>{this.emitEvent(`select`,e.detail),this._closeDropdown(),this._deactivateMenubar()}),r.addEventListener(`close`,()=>{this.#t===r&&(e.classList.remove(`active`),this.#t=null,this.#n=null,this._deactivateMenubar())}),r.addEventListener(`puter-menu-navigate`,e=>{if(!e.detail)return;if(e.detail.direction===`up`){this._closeDropdown(),this._renderButtonFocus(),this._setKeyboardNav(!0);return}let t=e.detail.direction===`right`?1:-1;this._closeDropdown(),this._moveButtonFocus(t,{swapDropdown:!1,openDropdown:!0})}),document.body.appendChild(r),e.classList.add(`active`),this.#t=r,this.#n=e}_closeDropdown(){this.#n&&this.#n.classList.remove(`active`),this.#t&&this.#t.remove(),this.#t=null,this.#n=null}disconnectedCallback(){super.disconnectedCallback(),this._closeDropdown(),clearTimeout(this._suppressClickTimer),this._suppressClickFor=null,this._keyHandler&&document.removeEventListener(`keydown`,this._keyHandler,!0),this._keyUpHandler&&document.removeEventListener(`keyup`,this._keyUpHandler,!0),this._docPointerDownHandler&&document.removeEventListener(`pointerdown`,this._docPointerDownHandler,!0),this._docFocusInHandler&&document.removeEventListener(`focusin`,this._docFocusInHandler,!0),this._winBlurHandler&&window.removeEventListener(`blur`,this._winBlurHandler),this._mouseMoveHandler&&document.removeEventListener(`mousemove`,this._mouseMoveHandler)}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}},bu=`#000000.#434343.#666666.#999999.#b7b7b7.#cccccc.#d9d9d9.#efefef.#f3f3f3.#ffffff.#980000.#ff0000.#ff9900.#ffff00.#00ff00.#00ffff.#4a86e8.#0000ff.#9900ff.#ff00ff.#e6b8af.#f4cccc.#fce5cd.#fff2cc.#d9ead3.#d0e0e3.#c9daf8.#cfe2f3.#d9d2e9.#ead1dc.#dd7e6b.#ea9999.#f9cb9c.#ffe599.#b6d7a8.#a2c4c9.#a4c2f4.#9fc5e8.#b4a7d6.#d5a6bd.#cc4125.#e06666.#f6b26b.#ffd966.#93c47d.#76a5af.#6d9eeb.#6fa8dc.#8e7cc3.#c27ba0.#a61c00.#cc0000.#e69138.#f1c232.#6aa84f.#45818e.#3c78d8.#3d85c6.#674ea7.#a64d79.#85200c.#990000.#b45f06.#bf9000.#38761d.#134f5c.#1155cc.#0b5394.#351c75.#741b47.#5b0f00.#660000.#783f04.#7f6000.#274e13.#0c343d.#1c4587.#073763.#20124d.#4c1130`.split(`.`),xu=class extends Z{#e=`#3b82f6`;getStyles(){return`
            dialog {
                background: transparent;
                border: none;
                box-shadow: none;
                outline: none;
                padding: 0;
                max-width: 90vw;
            }
            dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
            }
            .picker-body {
                background-color: rgba(231, 238, 245, .95);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                border: none;
                border-radius: 8px;
                padding: 24px;
                box-shadow: 0px 0px 15px #00000066;
                font-family: ${Q};
                color: #414650;
                width: 350px;
                max-width: calc(100vw - 32px);
                box-sizing: border-box;
            }
            .header {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 20px;
            }
            .preview {
                width: 56px;
                height: 56px;
                border-radius: 4px;
                border: 1px solid #b9b9b9;
                background: var(--current-color, #3b82f6);
                flex-shrink: 0;
                transition: background 0.15s ease;
            }
            .header-info {
                flex: 1;
                min-width: 0;
            }
            .header-label {
                font-size: 12px;
                color: #666666;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }
            .hex-input {
                width: 100%;
                padding: 8px;
                font-family: ui-monospace, "SF Mono", Menlo, monospace;
                font-size: 14px;
                border: 1px solid #b9b9b9;
                border-radius: 4px;
                color: #414650;
                box-sizing: border-box;
                outline: none;
                text-transform: uppercase;
                transition: border-color 0.15s ease;
            }
            .hex-input:focus {
                border: 2px solid #01a0fd;
                padding: 7px;
            }
            .native-color-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 18px;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.5);
                border: 1px solid #b9b9b9;
                border-radius: 4px;
            }
            .native-color-row label {
                font-size: 13px;
                color: #666666;
                cursor: pointer;
                flex: 1;
            }
            input[type="color"] {
                width: 36px;
                height: 36px;
                padding: 0;
                border: 1px solid #b9b9b9;
                border-radius: 4px;
                cursor: pointer;
                background: transparent;
            }
            input[type="color"]::-webkit-color-swatch-wrapper { padding: 2px; }
            input[type="color"]::-webkit-color-swatch { border: none; border-radius: 2px; }
            .swatches {
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                gap: 5px;
                margin-bottom: 20px;
            }
            .swatch {
                aspect-ratio: 1;
                border-radius: 3px;
                cursor: pointer;
                border: 1px solid rgba(0, 0, 0, 0.06);
                transition: transform 0.1s ease;
            }
            .swatch:hover {
                transform: scale(1.15);
                z-index: 1;
            }
            .swatch.selected {
                outline: 2px solid #01a0fd;
                outline-offset: 2px;
            }
            .buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            ${ru}
            .btn-cancel {
                /* uses base .btn styles */
            }
            .btn-ok {
                border-color: #088ef0;
                background: linear-gradient(#34a5f8, #088ef0);
                color: white;
                min-width: 90px;
            }
            .btn-ok:active {
                background-color: #2798eb;
                border-color: #2798eb;
                color: #bedef5;
            }
            @media (max-width: 480px) {
                .picker-body {
                    width: 100%;
                    padding: 20px;
                }
                .swatches {
                    grid-template-columns: repeat(8, 1fr);
                }
                .btn {
                    padding: 0 20px;
                    font-size: 16px;
                    height: 40px;
                    line-height: 40px;
                    flex: 1;
                }
            }
            :host(.puter-theme-dark) .picker-body {
                background-color: rgba(40, 44, 52, .95);
                color: #e6e6e6;
                box-shadow: 0px 0px 15px #000000aa;
            }
            :host(.puter-theme-dark) .preview {
                border-color: #555;
            }
            :host(.puter-theme-dark) .header-label {
                color: #aaa;
            }
            :host(.puter-theme-dark) .hex-input {
                background-color: #1f1f1f;
                border-color: #555;
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .native-color-row {
                background: rgba(255, 255, 255, 0.05);
                border-color: #555;
            }
            :host(.puter-theme-dark) .native-color-row label {
                color: #aaa;
            }
            :host(.puter-theme-dark) input[type="color"] {
                border-color: #555;
            }
            :host(.puter-theme-dark) .swatch {
                border-color: rgba(255, 255, 255, 0.1);
            }
            :host(.puter-theme-dark) .btn {
                color: #e6e6e6;
                border-color: #555;
                background: linear-gradient(#4a4a4a, #3a3a3a);
                box-shadow: inset 0px 1px 0px rgb(255 255 255 / 8%), 0 1px 2px rgb(0 0 0 / 25%);
            }
            :host(.puter-theme-dark) .btn:active {
                background-color: #333;
                border-color: #444;
                color: #999;
            }
        `}render(){let e=this.getAttribute(`default-color`)||`#3b82f6`;this.#e=this._normalizeHex(e);let t=bu.map(e=>`<div class="swatch${e.toLowerCase()===this.#e.toLowerCase()?` selected`:``}"
                  data-color="${e}" style="background: ${e}"></div>`).join(``);return`
            <dialog>
                <div class="picker-body" style="--current-color: ${this.#e}">
                    <div class="header">
                        <div class="preview"></div>
                        <div class="header-info">
                            <div class="header-label">Hex</div>
                            <input class="hex-input" type="text" value="${this.#e.toUpperCase()}" maxlength="7">
                        </div>
                    </div>
                    <div class="native-color-row">
                        <label for="native-color">Pick any color</label>
                        <input id="native-color" type="color" value="${this.#e}">
                    </div>
                    <div class="swatches">${t}</div>
                    <div class="buttons">
                        <button class="btn btn-cancel">Cancel</button>
                        <button class="btn btn-ok">Select</button>
                    </div>
                </div>
            </dialog>`}onReady(){let e=this.$(`dialog`),t=this.$(`.hex-input`),n=this.$(`input[type="color"]`),r=this.$(`.btn-ok`),i=this.$(`.btn-cancel`);this.$$(`.swatch`).forEach(e=>{e.addEventListener(`click`,()=>{this._setColor(e.dataset.color)})}),t.addEventListener(`input`,e=>{let t=this._normalizeHex(e.target.value);t&&this._setColor(t,{fromHexInput:!0})}),n.addEventListener(`input`,e=>{this._setColor(e.target.value,{fromNative:!0})}),r.addEventListener(`click`,()=>{this.emitEvent(`response`,this.#e),this.close()}),i.addEventListener(`click`,()=>{this.emitEvent(`response`,null),this.close()}),e.addEventListener(`click`,t=>{t.target===e&&(this.emitEvent(`response`,null),this.close())}),e.addEventListener(`cancel`,e=>{this.emitEvent(`response`,null)})}_setColor(e,t={}){let n=this._normalizeHex(e);if(!n)return;this.#e=n;let r=this.$(`.picker-body`);if(r&&r.style.setProperty(`--current-color`,n),!t.fromHexInput){let e=this.$(`.hex-input`);e&&(e.value=n.toUpperCase())}if(!t.fromNative){let e=this.$(`input[type="color"]`);e&&(e.value=n)}this.$$(`.swatch`).forEach(e=>{e.classList.toggle(`selected`,e.dataset.color.toLowerCase()===n.toLowerCase())})}_normalizeHex(e){return e?(e=e.trim(),e[0]!==`#`&&(e=`#${e}`),/^#[0-9a-f]{3}$/i.test(e)&&(e=`#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}`),/^#[0-9a-f]{6}$/i.test(e)?e.toLowerCase():null):null}},Su=[{name:`System UI`,family:`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,category:`System`},{name:`Arial`,family:`Arial, sans-serif`,category:`Sans Serif`},{name:`Helvetica`,family:`Helvetica, sans-serif`,category:`Sans Serif`},{name:`Verdana`,family:`Verdana, sans-serif`,category:`Sans Serif`},{name:`Tahoma`,family:`Tahoma, sans-serif`,category:`Sans Serif`},{name:`Trebuchet MS`,family:`"Trebuchet MS", sans-serif`,category:`Sans Serif`},{name:`Impact`,family:`Impact, sans-serif`,category:`Sans Serif`},{name:`Times New Roman`,family:`"Times New Roman", Times, serif`,category:`Serif`},{name:`Georgia`,family:`Georgia, serif`,category:`Serif`},{name:`Garamond`,family:`Garamond, serif`,category:`Serif`},{name:`Palatino`,family:`Palatino, "Palatino Linotype", serif`,category:`Serif`},{name:`Courier New`,family:`"Courier New", Courier, monospace`,category:`Monospace`},{name:`Consolas`,family:`Consolas, monospace`,category:`Monospace`},{name:`Monaco`,family:`Monaco, monospace`,category:`Monospace`},{name:`SF Mono`,family:`"SF Mono", ui-monospace, monospace`,category:`Monospace`},{name:`Brush Script`,family:`"Brush Script MT", cursive`,category:`Cursive`},{name:`Comic Sans`,family:`"Comic Sans MS", cursive`,category:`Cursive`}],Cu=[[`puter-alert`,su],[`puter-prompt`,cu],[`puter-notification`,gu],[`puter-context-menu`,_u],[`puter-spinner`,vu],[`puter-menubar`,yu],[`puter-color-picker`,xu],[`puter-font-picker`,class extends Z{#e=null;getStyles(){return`
            dialog {
                background: transparent;
                border: none;
                box-shadow: none;
                outline: none;
                padding: 0;
                max-width: 90vw;
                max-height: 90vh;
            }
            dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
            }
            .picker-body {
                background-color: rgba(231, 238, 245, .95);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                border: none;
                border-radius: 8px;
                padding: 24px;
                box-shadow: 0px 0px 15px #00000066;
                font-family: ${Q};
                color: #414650;
                width: 350px;
                max-width: calc(100vw - 32px);
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                max-height: 80vh;
            }
            .header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }
            .title {
                font-size: 15px;
                font-weight: 600;
                color: #414650;
                text-shadow: 1px 1px #ffffff52;
                flex: 1;
            }
            .search {
                width: 100%;
                padding: 8px;
                font-size: 14px;
                border: 1px solid #b9b9b9;
                border-radius: 4px;
                outline: none;
                box-sizing: border-box;
                font-family: ${Q};
                margin-bottom: 14px;
                transition: border-color 0.15s ease;
            }
            .search:focus {
                border: 2px solid #01a0fd;
                padding: 7px;
            }
            .font-list {
                height: 200px;
                overflow-y: scroll;
                background-color: white;
                padding: 0 10px;
                margin-bottom: 16px;
                border-radius: 4px;
                border: 1px solid #b9b9b9;
            }
            .font-item {
                padding: 10px;
                border-radius: 2px;
                margin: 10px 0;
                cursor: pointer;
                font-size: 16px;
                color: #414650;
                display: flex;
                align-items: baseline;
                gap: 12px;
                transition: background 0.08s ease;
            }
            .font-item:hover {
                background: rgba(0, 0, 0, 0.04);
            }
            .font-item.selected {
                color: white;
                background-color: #2b62f1;
            }
            .font-item.selected .font-name-label {
                color: rgba(255, 255, 255, 0.7);
            }
            .font-name-label {
                font-family: ${Q};
                font-size: 12px;
                color: #888;
                flex-shrink: 0;
                margin-left: auto;
            }
            .preview {
                padding: 14px;
                background: white;
                border: 1px solid #b9b9b9;
                border-radius: 4px;
                font-size: 24px;
                margin-bottom: 16px;
                min-height: 40px;
                color: #414650;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            ${ru}
            .btn-cancel {
                /* uses base .btn styles */
            }
            .btn-ok {
                border-color: #088ef0;
                background: linear-gradient(#34a5f8, #088ef0);
                color: white;
                min-width: 90px;
            }
            .btn-ok:active {
                background-color: #2798eb;
                border-color: #2798eb;
                color: #bedef5;
            }
            .btn-ok:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                box-shadow: none;
            }
            @media (max-width: 480px) {
                .picker-body {
                    width: 100%;
                    padding: 20px;
                    max-height: 90vh;
                }
                .btn {
                    padding: 0 20px;
                    font-size: 16px;
                    height: 40px;
                    line-height: 40px;
                    flex: 1;
                }
            }
            :host(.puter-theme-dark) .picker-body {
                background-color: rgba(40, 44, 52, .95);
                color: #e6e6e6;
                box-shadow: 0px 0px 15px #000000aa;
            }
            :host(.puter-theme-dark) .title {
                color: #e6e6e6;
                text-shadow: none;
            }
            :host(.puter-theme-dark) .search {
                background-color: #1f1f1f;
                border-color: #555;
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .font-list {
                background-color: #1f1f1f;
                border-color: #555;
            }
            :host(.puter-theme-dark) .font-item {
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .font-item:hover {
                background: rgba(255, 255, 255, 0.06);
            }
            :host(.puter-theme-dark) .font-name-label {
                color: #888;
            }
            :host(.puter-theme-dark) .preview {
                background: #1f1f1f;
                border-color: #555;
                color: #e6e6e6;
            }
            :host(.puter-theme-dark) .btn {
                color: #e6e6e6;
                border-color: #555;
                background: linear-gradient(#4a4a4a, #3a3a3a);
                box-shadow: inset 0px 1px 0px rgb(255 255 255 / 8%), 0 1px 2px rgb(0 0 0 / 25%);
            }
            :host(.puter-theme-dark) .btn:active {
                background-color: #333;
                border-color: #444;
                color: #999;
            }
        `}render(){let e=this.getAttribute(`default-font`)||`System UI`;this.#e=Su.find(t=>t.name.toLowerCase()===e.toLowerCase()||t.family.toLowerCase().includes(e.toLowerCase()))||Su[0];let t=this._renderFontList(Su);return`
            <dialog>
                <div class="picker-body">
                    <div class="header">
                        <div class="title">Choose Font</div>
                    </div>
                    <input class="search" type="text" placeholder="Search fonts...">
                    <div class="preview" style="font-family: ${this.#e.family}">The quick brown fox</div>
                    <div class="font-list">
                        ${t}
                    </div>
                    <div class="buttons">
                        <button class="btn btn-cancel">Cancel</button>
                        <button class="btn btn-ok">Select</button>
                    </div>
                </div>
            </dialog>`}_renderFontList(e){return e.map(e=>`
            <div class="font-item${e.name===this.#e.name?` selected`:``}"
                 data-name="${this._escapeAttr(e.name)}"
                 style="font-family: ${e.family}">
                ${this._escapeHTML(e.name)}
            </div>
        `).join(``)}onReady(){let e=this.$(`dialog`),t=this.$(`.search`),n=this.$(`.font-list`),r=this.$(`.preview`),i=this.$(`.btn-ok`),a=this.$(`.btn-cancel`),o=()=>{this.$$(`.font-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=Su.find(t=>t.name===e.dataset.name);t&&(this.#e=t,this.$$(`.font-item`).forEach(e=>e.classList.remove(`selected`)),e.classList.add(`selected`),r.style.fontFamily=t.family)}),e.addEventListener(`dblclick`,()=>{let t=Su.find(t=>t.name===e.dataset.name);t&&(this.#e=t,this.emitEvent(`response`,{fontFamily:t.family}),this.close())})})};o(),t.addEventListener(`input`,e=>{let t=e.target.value.toLowerCase(),r=Su.filter(e=>e.name.toLowerCase().includes(t)||e.category.toLowerCase().includes(t));n.innerHTML=this._renderFontList(r),o()}),i.addEventListener(`click`,()=>{this.emitEvent(`response`,{fontFamily:this.#e.family}),this.close()}),a.addEventListener(`click`,()=>{this.emitEvent(`response`,null),this.close()}),e.addEventListener(`click`,t=>{t.target===e&&(this.emitEvent(`response`,null),this.close())})}_escapeHTML(e){if(!e)return``;let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}_escapeAttr(e){return e?e.replace(/"/g,`&quot;`).replace(/'/g,`&#39;`):``}}]];function wu(){if(globalThis.HTMLElement!==void 0&&globalThis.customElements)for(let[e,t]of Cu)customElements.get(e)||customElements.define(e,t)}var Tu=class e{constructor(e={}){this.fieldsObj=e,this.enabled=new Set}on(e){this.enabled.add(e)}fields(t={}){return new e({...this.fieldsObj,...t})}info(...e){console.log(...this._prefix(),...e)}warn(...e){console.warn(...this._prefix(),...e)}error(...e){console.error(...this._prefix(),...e)}debug(...e){console.debug(...this._prefix(),...e)}_prefix(){let e=Object.entries(this.fieldsObj);return e.length?[`[${e.map(([e,t])=>`${e}=${t}`).join(` `)}]`]:[]}},Eu=class{constructor(){this.locked=!1,this.queue=[]}async acquire(){if(!this.locked){this.locked=!0;return}await new Promise(e=>this.queue.push(e)),this.locked=!0}release(){let e=this.queue.shift();if(e){e();return}this.locked=!1}},Du=`https://puter.com`,Ou=`puter.auth.token.v2`,ku=`puter.auth.token`,Au=`puter.auth.token.origin.v2`,ju=class{env;args={};authToken=null;APIOrigin;tools=[];util;auth;os;fs;ui;hosting;apps;ai;kv;email;events;perms;teams;drivers;debug;peer;workers;path;#e=`https://api.puter.com`;#t=`https://puter.com`;get defaultAPIOrigin(){return globalThis.PUTER_API_ORIGIN||globalThis.PUTER_API_ORIGIN_ENV||this.#e}set defaultAPIOrigin(e){this.#e=e}get defaultGUIOrigin(){return globalThis.PUTER_ORIGIN||globalThis.PUTER_ORIGIN_ENV||this.#t}set defaultGUIOrigin(e){this.#t=e}onAuth;puterAuthState={isPromptOpen:!1,authGranted:null,resolver:null};appInstanceID;parentInstanceID;static FSItem=z;eventHandlers={};_reauthInflight=null;_authStateListeners=new Set;debugMode=!1;quiet=!1;socketEnabled=globalThis.puter_socket_enabled!==!1;initSubmodules(){this.util=new Ml,this.auth=this.registerModule(`auth`,en),this.os=this.registerModule(`os`,As),this.fs=this.registerModule(`fs`,bo),this.ui=this.registerModule(`ui`,El,{appInstanceID:this.appInstanceID,parentInstanceID:this.parentInstanceID}),this.hosting=this.registerModule(`hosting`,ko),this.apps=this.registerModule(`apps`,Jt),this.ai=this.registerModule(`ai`,Ft),this.kv=this.registerModule(`kv`,us),this.email=this.registerModule(`email`,on),this.events=this.registerModule(`events`,ra),this.perms=this.registerModule(`perms`,Jc),this.teams=this.registerModule(`teams`,vl),this.drivers=this.registerModule(`drivers`,rn),this.debug=this.registerModule(`debug`,tn),this.peer=this.registerModule(`peer`,nu),this.workers=this.registerModule(`workers`,Pl),this.path=S.default,wu()}normalizeAuthTokenCandidate=function(e){if(typeof e!=`string`)return null;let t=e.trim();return!t||t===`null`||t===`undefined`?null:t};decodeJwtPayload=function(e){if(typeof e!=`string`)return null;let t=e.split(`.`);if(t.length<2)return null;let n=t[1];n=n.replace(/-/g,`+`).replace(/_/g,`/`);let r=n.length%4;r&&(n+=`=`.repeat(4-r));try{let e;if(typeof globalThis.atob==`function`)e=decodeURIComponent(Array.prototype.map.call(globalThis.atob(n),e=>`%${`00${e.charCodeAt(0).toString(16)}`.slice(-2)}`).join(``));else if(globalThis.Buffer!==void 0)e=globalThis.Buffer.from(n,`base64`).toString(`utf8`);else return null;let t=JSON.parse(e);return t&&typeof t==`object`?t:null}catch{return null}};normalizeStringCandidate=function(e){return typeof e==`string`&&e.trim()||null};decodeCompressedAppID=function(e){let t=this.normalizeStringCandidate(e);if(!t)return null;if(t.includes(`-`))return t;try{let e;if(globalThis.Buffer!==void 0)e=globalThis.Buffer.from(t,`base64`);else if(typeof globalThis.atob==`function`){let n=globalThis.atob(t);e=Uint8Array.from(n,e=>e.charCodeAt(0))}else return null;if(!e||e.length!==16)return null;let n=globalThis.Buffer!==void 0&&typeof globalThis.Buffer.isBuffer==`function`&&globalThis.Buffer.isBuffer(e)?e.toString(`hex`):Array.from(e).map(e=>e.toString(16).padStart(2,`0`)).join(``);return n.length===32?`app-${[n.slice(0,8),n.slice(8,12),n.slice(12,16),n.slice(16,20),n.slice(20)].join(`-`)}`:null}catch{return null}};getAppIDFromAuthToken=function(e){let t=this.decodeJwtPayload(e);return t?this.normalizeStringCandidate(t.app_uid)||this.decodeCompressedAppID(t.au):null};constructor(){this._cache=new a.default({dbName:`puter_cache`}),this._opscache=new a.default;let e=new URLSearchParams(globalThis.location?.search);e.has(`puter.app_instance_id`)&&Me(globalThis)?this.env=`app`:globalThis.puter_gui_enabled===!0?this.env=`gui`:globalThis.WorkerGlobalScope?(globalThis.ServiceWorkerGlobalScope?(this.env=`service-worker`,globalThis.XMLHttpRequest||(globalThis.XMLHttpRequest=Je),globalThis.location||(globalThis.location=new URL(`https://puter.site/`))):this.env=`web-worker`,globalThis.localStorage||(globalThis.localStorage=C)):globalThis.process?(this.env=`nodejs`,globalThis.localStorage||(globalThis.localStorage=C),globalThis.XMLHttpRequest||(globalThis.XMLHttpRequest=Je),globalThis.location||(globalThis.location=new URL(`https://nodejs.puter.site/`)),globalThis.addEventListener||(globalThis.addEventListener=()=>{})):this.env=`web`,this.env!==`gui`&&location.hostname.replace(/\.$/,``)===new URL(Du).hostname&&(this.env=`gui`),this.args=e.has(`puter.args`)?JSON.parse(decodeURIComponent(e.get(`puter.args`))):{},e.has(`puter.app_instance_id`)&&(this.appInstanceID=decodeURIComponent(e.get(`puter.app_instance_id`))),e.has(`puter.parent_instance_id`)&&(this.parentInstanceID=decodeURIComponent(e.get(`puter.parent_instance_id`))),e.has(`puter.app.id`)&&(this.appID=decodeURIComponent(e.get(`puter.app.id`))),e.has(`puter.app.name`)&&(this.appName=decodeURIComponent(e.get(`puter.app.name`))),this.appID&&(this.appDataPath=`~/AppData/${this.appID}`),this.APIOrigin=this.defaultAPIOrigin,e.has(`puter.api_origin`)&&this.env===`app`?this.APIOrigin=decodeURIComponent(e.get(`puter.api_origin`)):e.has(`puter.domain`)&&this.env===`app`&&(this.APIOrigin=`https://api.${e.get(`puter.domain`)}`);let t=new Tu;if(this.logger=t,this.apiCallLogger=new o({enabled:!1}),this.lock_rao_=new Eu,this.p_can_request_rao_=Promise.resolve(),this.rao_requested_=!1,this.whoamiCache_=null,this.env===`gui`)this.authToken=window.auth_token,this.initSubmodules();else if(this.env===`app`){let t=this.normalizeAuthTokenCandidate(e.get(`puter.auth.token`)??e.get(`auth_token`));try{let e=t;if(t)this.setAuthToken(t);else{let t=this.normalizeStringCandidate(localStorage.getItem(Au)),n=this.normalizeAuthTokenCandidate(localStorage.getItem(Ou));n&&this._storedTokenUsableForCurrentOrigin(t)?(this.setAuthToken(n),e=n):n&&(this._needsOriginReauth={reason:`api_origin_mismatch`})}if(!this.getAppIDFromAuthToken(e)&&!this.appID){let e=localStorage.getItem(`puter.app.id`);e&&this.setAppID(e)}}catch(e){console.error(`Error accessing localStorage:`,e)}if(this.initSubmodules(),this._needsOriginReauth){let e=this._needsOriginReauth;this._needsOriginReauth=null,this.setAPIOrigin(this.defaultAPIOrigin),this.triggerReauth(e)}}else if(this.env===`web`){this.initSubmodules();try{let e=this.normalizeAuthTokenCandidate(localStorage.getItem(Ou)),t=this.normalizeStringCandidate(localStorage.getItem(Au));e&&this._storedTokenUsableForCurrentOrigin(t)?this.setAuthToken(e):e&&this._clearAuthToken(),!this.appID&&localStorage.getItem(`puter.app.id`)&&this.setAppID(localStorage.getItem(`puter.app.id`))}catch(e){console.error(`Error accessing localStorage:`,e)}this.printDevCTA(),this.warnUnsupportedProtocol()}else(this.env===`web-worker`||this.env===`service-worker`||this.env===`nodejs`)&&this.initSubmodules();(this.env===`web`||this.env===`app`)&&this.discardRetiredAuthToken_(),(async()=>{try{let e=await this.whoamiCache_;if(!e)return;let n=`[${e.app_name??this.appInstanceID??`HOST`}]`;t=t.fields({prefix:n}),this.logger=t}catch(e){this.debugMode&&console.error(`Failed to initialize prefix logger`,e)}})(),this.net={generateWispV1URL:async()=>{let{token:e,server:t}=await(await x(`${this.APIOrigin}/wisp/relay-token/create`,{method:`POST`,includePuterAuth:!0,headers:{"Content-Type":`application/json`},body:JSON.stringify({})})).json();return`${t}/${e}/`},Socket:bs,tls:{TLSSocket:Ss},fetch:Ts},this.initNetworkMonitoring()}async request_rao_(){if(await this.p_can_request_rao_,this.env!==`gui`&&this.env!==`app`&&this.socketEnabled){if(await this.lock_rao_.acquire(),this.rao_requested_){this.lock_rao_.release();return}try{let e=await x(`${this.APIOrigin}/rao`,{method:`POST`,includePuterAuth:!0,headers:{Origin:location.origin},interactiveReauth:!1});return this.rao_requested_=!0,await e.json()}catch(e){console.error(e)}finally{this.lock_rao_.release()}}}async cacheWhoami_(){if(!this.authToken||!this.socketEnabled)return null;try{let e=await x(`${this.APIOrigin}/whoami`,{authToken:this.authToken,interactiveReauth:!1,logContext:{service:`auth`,operation:`whoami`,params:{}}});return e.ok?(this.whoami=await e.json(),this.whoami):null}catch{return null}}registerModule(e,t,n={}){let r=new t(this,n);return r.puter=this,this[e]=r,r._init&&r._init({puter:this}),r}onAuthStateChanged(e){return this._authStateListeners.add(e),()=>this._authStateListeners.delete(e)}_emitAuthStateChanged(){for(let e of this._authStateListeners)try{e()}catch(e){this.debugMode&&console.error(`Auth state listener failed`,e)}}setAppID=function(e){try{localStorage.setItem(`puter.app.id`,e)}catch(e){console.error(`Error accessing localStorage:`,e)}this.appID=e,this.appDataPath=e?`~/AppData/${e}`:void 0};setAuthToken=function(e){let t=this.normalizeAuthTokenCandidate(e);this.authToken=t;let n=this.getAppIDFromAuthToken(t);if(n&&this.setAppID(n),this.env===`web`||this.env===`app`)try{t?(localStorage.setItem(Ou,t),localStorage.setItem(Au,this.APIOrigin)):(localStorage.removeItem(Ou),localStorage.removeItem(Au)),localStorage.removeItem(ku)}catch(e){console.error(`Error accessing localStorage:`,e)}this.env===`gui`&&setInterval($.checkAndUpdateGUIFScache,1e4),this._emitAuthStateChanged(),this.request_rao_(),this.whoamiCache_=this.cacheWhoami_()};_storedTokenUsableForCurrentOrigin=function(e){return je({boundOrigin:e,currentOrigin:this.APIOrigin,defaultAPIOrigin:this.defaultAPIOrigin})};setAPIOrigin=function(e){this.APIOrigin=e,this._emitAuthStateChanged()};runWhenPuterHappensCallbacks=function(){if(this.env!==`gui`||!globalThis.when_puter_happens)return;let e=Array.isArray(globalThis.when_puter_happens)?globalThis.when_puter_happens:[globalThis.when_puter_happens];for(let t of e)try{t({puter:this})}catch(e){this.debugMode&&console.error(`when_puter_happens callback failed`,e)}};_clearAuthToken=function(){if(this.authToken=null,this.env===`web`||this.env===`app`)try{localStorage.removeItem(Ou),localStorage.removeItem(Au),localStorage.removeItem(ku)}catch(e){console.error(`Error accessing localStorage:`,e)}};resetAuthToken=function(){if(this.env===`web-worker`||this.env===`service-worker`)throw Error(`Sign out is not permitted from WebWorkers or ServiceWorkers`);this._clearAuthToken(),this._emitAuthStateChanged()};triggerReauth=async function(e={}){let{reason:t,auth_id:n}=e;if(this._reauthInflight)return this._reauthInflight;this._emitReauthEvent({reason:t,auth_id:n}),this._clearAuthToken(),this._emitAuthStateChanged(),this._reauthInflight=(async()=>{if(this.env!==`gui`){if(this.env===`web-worker`||this.env===`service-worker`||this.env===`nodejs`){let e=Error(`reauth_required`);throw e.code=`reauth_required`,e.reason=t,e.auth_id=n,e}if(this.env===`web`){await this.ui.authenticateWithPuter({auth_id:n,reason:t});return}if(this.env===`app`){try{globalThis.parent?.postMessage?.({msg:`reauth_required`,appInstanceID:this.appInstanceID,reason:t,auth_id:n},this.defaultGUIOrigin)}catch{}await new Promise((e,t)=>{let n=globalThis.parent,r=t=>{t.origin===this.defaultGUIOrigin&&(n&&t.source!==n||t.data?.msg===`puter.token`&&(globalThis.removeEventListener(`message`,r),e()))};globalThis.addEventListener?.(`message`,r),setTimeout(()=>{globalThis.removeEventListener?.(`message`,r),t(Error(`reauth_timeout`))},3e5)})}}})();try{await this._reauthInflight}finally{this._reauthInflight=null}};dropStaleAuthToken=function({reason:e,auth_id:t,sentToken:n}={}){n&&n!==this.authToken||(this._emitReauthEvent({reason:e,auth_id:t}),this._clearAuthToken(),this._emitAuthStateChanged())};_emitReauthEvent=function({reason:e,auth_id:t}){try{let n=this.eventHandlers?.[`puter.auth.reauth_required`];if(Array.isArray(n))for(let r of n)try{r({reason:e,auth_id:t})}catch{}}catch{}};on=function(e,t){return this.eventHandlers[e]||(this.eventHandlers[e]=[]),this.eventHandlers[e].push(t),()=>this.off(e,t)};off=function(e,t){let n=this.eventHandlers[e];if(!n)return;let r=n.indexOf(t);r>=0&&n.splice(r,1)};discardRetiredAuthToken_=function(){try{localStorage.removeItem(ku)}catch{}};exit=function(e=0){e&&typeof e!=`number`&&(console.warn(`puter.exit() requires status code to be a number. Treating it as 1`),e=1),globalThis.parent.postMessage({msg:`exit`,appInstanceID:this.appInstanceID,statusCode:e},`*`)};randName=function(e=`-`){let t=`helpful.sensible.loyal.honest.clever.capable.calm.smart.genius.bright.charming.creative.diligent.elegant.fancy.colorful.avid.active.gentle.happy.intelligent.jolly.kind.lively.merry.nice.optimistic.polite.quiet.relaxed.silly.victorious.witty.young.zealous.strong.brave.agile.bold`.split(`.`),n=`street.roof.floor.tv.idea.morning.game.wheel.shoe.bag.clock.pencil.pen.magnet.chair.table.house.dog.room.book.car.cat.tree.flower.bird.fish.sun.moon.star.cloud.rain.snow.wind.mountain.river.lake.sea.ocean.island.bridge.road.train.plane.ship.bicycle.horse.elephant.lion.tiger.bear.zebra.giraffe.monkey.snake.rabbit.duck.goose.penguin.frog.crab.shrimp.whale.octopus.spider.ant.bee.butterfly.dragonfly.ladybug.snail.camel.kangaroo.koala.panda.piglet.sheep.wolf.fox.deer.mouse.seal.chicken.cow.dinosaur.puppy.kitten.circle.square.garden.otter.bunny.meerkat.harp`.split(`.`);return t[Math.floor(Math.random()*t.length)]+e+n[Math.floor(Math.random()*n.length)]+e+Math.floor(Math.random()*1e4)};getUser=function(...e){let t;return t=typeof e[0]==`object`&&e[0]!==null?e[0]:{success:e[0],error:e[1]},new Promise((e,n)=>{let r=Qe(`/whoami`,this.APIOrigin,this.authToken,`get`);w(r,t.success,t.error,e,n),r.send()})};print=function(...e){let t={};e.length>0&&typeof e[e.length-1]==`object`&&e[e.length-1]!==null&&(`escapeHTML`in e[e.length-1]||`code`in e[e.length-1])&&(t=e.pop());for(let n of e)(t.escapeHTML===!0||t.code===!0)&&typeof n==`string`&&(n=n.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)),t.code===!0&&(n=`<code><pre>${n}</pre></code>`),document.body.innerHTML+=n};configureAPILogging=function(e={}){return this.apiCallLogger&&this.apiCallLogger.updateConfig(e),this};enableAPILogging=function(e={}){return this.apiCallLogger&&this.apiCallLogger.updateConfig({...e,enabled:!0}),this};disableAPILogging=function(){return this.apiCallLogger&&this.apiCallLogger.disable(),this};initNetworkMonitoring=function(){if(globalThis.navigator===void 0||typeof globalThis.addEventListener!=`function`)return;let e=navigator.onLine,t=()=>{let t=navigator.onLine;if(e&&!t){console.log(`Network connection lost - purging cache`);try{this._cache.flushall(),console.log(`Cache purged successfully`)}catch(e){console.error(`Error purging cache:`,e)}}e=t};globalThis.addEventListener(`online`,t),globalThis.addEventListener(`offline`,t),typeof document<`u`&&document.addEventListener(`visibilitychange`,()=>{setTimeout(t,100)})};printDevCTA=function(){if(this.quiet||globalThis.PUTER_QUIET)return;let e=globalThis.matchMedia&&globalThis.matchMedia(`(prefers-color-scheme: dark)`).matches,t=e?`#7c8cff`:`#000fd8`,n=e?`#cbd5f5`:`rgb(0, 57, 137)`,r=e?`#93c5fd`:`#3b82f6`,i=e?`#64748b`:`#94a3b8`;console.log(`%c ____  _   _ _____ _____ ____       _ ____  
|  _ \\| | | |_   _| ____|  _ \\     | / ___| 
| |_) | | | | | | |  _| | |_) | _  | \\___ \\ 
|  __/| |_| | | | | |___|  _ < | |_| |___) |
|_|    \\___/  |_| |_____|_| \\_(_)___/|____/ `,`color: ${t}; font-weight: bold; font-size: 14px; font-family: monospace;`),console.log(`%cSubmit this app to the Puter App Store:
%chttps://apps.puter.com/`,`color: ${n}; font-size: 18px; font-weight: bold;`,`color: ${r}; font-size: 18px; font-weight: bold; text-decoration: underline;`),console.log(`%cTo disable this message: %cputer.quiet = true`,`color: ${i}; font-size: 11px;`,`color: ${i}; font-size: 11px; font-style: italic;`)};warnUnsupportedProtocol=function(){if(globalThis.location?.protocol!==`file:`||this._fileProtocolWarned)return;this._fileProtocolWarned=!0;let e=()=>{let e=new $t(()=>{},()=>{});document.body.appendChild(e),e.open()};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,e,{once:!0}):e()};checkAndUpdateGUIFScache=function(){if($.env!==`gui`||!$.whoami)return;let e=$.whoami.username,t=e=>{e.catch(()=>{})},n=`/${e}`,r=`/${e}/Desktop`,i=`/${e}/Documents`,a=`/${e}/Public`;$._cache.get(`item:${n}`)||(console.log(`/${e} item is not cached, refetching cache`),t($.fs.stat(n))),$._cache.get(`item:${r}`)||(console.log(`/${e}/Desktop item is not cached, refetching cache`),t($.fs.stat(r))),$._cache.get(`item:${i}`)||(console.log(`/${e}/Documents item is not cached, refetching cache`),t($.fs.stat(i))),$._cache.get(`item:${a}`)||(console.log(`/${e}/Public item is not cached, refetching cache`),t($.fs.stat(a))),$._cache.get(`readdir:${n}`)||(console.log(`/${e} is not cached, refetching cache`),t($.fs.readdir(n))),$._cache.get(`readdir:${r}`)||(console.log(`/${e}/Desktop is not cached, refetching cache`),t($.fs.readdir(r))),$._cache.get(`readdir:${i}`)||(console.log(`/${e}/Documents is not cached, refetching cache`),t($.fs.readdir(i))),$._cache.get(`readdir:${a}`)||(console.log(`/${e}/Public is not cached, refetching cache`),t($.fs.readdir(a)))}},$=new ju;globalThis.puter=$,$.runWhenPuterHappensCallbacks();var Mu=$.ui.parentApp();globalThis.puterParent=Mu,Mu&&(console.log(`I have a parent, registering tools`),Mu.on(`message`,async e=>{if(console.log(`Got tool req `,e),e.$===`requestTools`&&(console.log(`Responding with tools`),Mu.postMessage({$:`providedTools`,tools:JSON.parse(JSON.stringify($.tools))})),e.$===`executeTool`){console.log(`xecuting tools`);let[t]=$.tools.filter(t=>t.function.name===e.toolName),n=await t.exec(e.parameters);Mu.postMessage({$:`toolResponse`,response:n,tag:e.tag})}}),Mu.postMessage({$:`ready`})),globalThis.addEventListener&&globalThis.addEventListener(`message`,async e=>{if(e.origin===$.defaultGUIOrigin){if(e.data.msg&&e.data.msg===`requestOrigin`)e.source.postMessage({msg:`originResponse`},`*`);else if(e.data.msg===`puter.token`){if($.setAuthToken(e.data.token),!$.getAppIDFromAuthToken(e.data.token)&&!$.appID){let t=$.normalizeStringCandidate(e.data.app_uid);t&&$.setAppID(t)}$.puterAuthState.authGranted=!0,$.onAuth&&typeof $.onAuth==`function`&&$.getUser().then(e=>{$.onAuth(e)}),$.puterAuthState.isPromptOpen=!1,$.puterAuthState.resolver&&($.puterAuthState.authGranted?$.puterAuthState.resolver.resolve():$.puterAuthState.resolver.reject(),$.puterAuthState.resolver=null)}}});export{ju as Puter,$ as default,$ as puter};