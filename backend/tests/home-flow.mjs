import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import vm from 'node:vm';
import pg from 'pg';
import {fileURLToPath} from 'node:url';
const rootDir=fileURLToPath(new URL('../',import.meta.url));
const name='owl_home_test_'+randomBytes(5).toString('hex'),url=new URL(process.env.DATABASE_URL);url.pathname='/postgres';
const root=new pg.Pool({connectionString:url.toString()});let db,child;
try{
 await root.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;db=new pg.Pool({connectionString:url.toString()});await db.query(await readFile(rootDir+'database/schema.sql','utf8'));
 child=spawn(process.execPath,['src/server.js'],{cwd:rootDir,env:{...process.env,DATABASE_URL:url.toString(),PORT:'3199'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.stderr.once('data',x=>reject(Error(String(x))));child.once('exit',c=>reject(Error('Server exited '+c)));});
 const base='http://127.0.0.1:3199';let cookie='';
 const request=async(path,options={})=>fetch(base+path,{...options,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{}),...options.headers}});
 const html=await (await request('/')).text();assert(html.includes('profile-menu'));assert(!html.includes('<aside'));
 assert.equal((await request('/api/orders',{method:'POST',body:'{}'})).status,401);
 const login=await request('/api/login',{method:'POST',body:JSON.stringify({email:'buyer@owl.test',password:'OwlDemo123!'})});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];const buyer=await login.json();assert.equal(buyer.user.canSell,false);
 const addresses=await (await request('/api/addresses')).json();assert.equal(addresses.addresses[0].address_id,'1');
 const market=await (await request('/api/products/1/market')).json();assert.equal(market.listings[0].display_price,'1100.00');assert(!JSON.stringify(market).includes('seller_id'));
 const orderRes=await request('/api/orders',{method:'POST',body:JSON.stringify({variantId:'3',condition:'new',addressId:'1'})});assert.equal(orderRes.status,201);const {order}=await orderRes.json();assert.equal(order.status,'awaiting_payment');assert.equal(order.total,'1150.00');
 assert.equal((await request('/api/seller/offers')).status,401);
 const badAddress=await request('/api/orders',{method:'POST',body:JSON.stringify({variantId:'3',condition:'new',addressId:'2'})});assert.equal(badAddress.status,400);
 const sellerLogin=await request('/api/login',{method:'POST',body:JSON.stringify({email:'seller2@owl.test',password:'OwlDemo123!'})});cookie=sellerLogin.headers.get('set-cookie').split(';')[0];const seller=await sellerLogin.json();
 const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDaoAAAAASUVORK5CYII=';
 const invalid=await request('/api/seller/offers',{method:'POST',body:JSON.stringify({variantId:'3',condition:'used',price:600,quantity:1,defects:'Small mark',notes:'',photos:['data:image/svg+xml;base64,AAAA']})});assert.equal(invalid.status,400);
 const offered=await request('/api/seller/offers',{method:'POST',body:JSON.stringify({variantId:'3',condition:'used',price:600,quantity:1,defects:'Small mark',notes:'Home-flow test',photos:[photo]})});assert.equal(offered.status,201);const {offer_id}=await offered.json();const saved=(await (await request('/api/seller/offers')).json()).offers.find(o=>o.offer_id===offer_id);assert.deepEqual(saved.photos,[photo]);
 const edit=await request('/api/seller/offers/'+offer_id,{method:'PATCH',body:JSON.stringify({price:650,quantity:1,defects:'Small mark',notes:'Updated'})});assert.equal(edit.status,200);assert.equal((await db.query('SELECT file_reference FROM owl.assets WHERE offer_id=$1',[offer_id])).rows[0].file_reference,photo);
 const locked=await request('/api/seller/offers/1',{method:'PATCH',body:JSON.stringify({price:1000,quantity:3,defects:'',notes:'',photos:[photo]})});assert.equal(locked.status,400);
 const elements=new Map();const make=()=>({hidden:true,open:false,value:'',innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(){},showModal(){this.open=true;this.shows=(this.shows||0)+1;},close(){this.open=false;},focus(){},setSelectionRange(){}});
 const doc={querySelector(selector){if(!elements.has(selector))elements.set(selector,make());return elements.get(selector);},querySelectorAll(){return [];},addEventListener(){}};
 const context=vm.createContext({document:doc,window:{scrollTo(){},toastTimer:null},fetch:(path,o)=>request(path,o),setTimeout,clearTimeout,console,FormData,URL});
 // Test guest home before login with the same script and actual catalog response.
 const savedCookie=cookie;cookie='';const js=await readFile(rootDir+'../frontend/app.js','utf8');vm.runInContext(js.replace(/boot\(\);\s*$/,'') ,context);await vm.runInContext('boot()',context);
 assert(elements.get('#page').innerHTML.includes('Explore the catalog'));assert(!elements.get('#login-dialog')?.open);
 vm.runInContext("state.search='Adidas';render()",context);assert(elements.get('#page').innerHTML.includes('Adidas Campus Demo'));assert(!elements.get('#page').innerHTML.includes('Nike Apparel Demo'));
 await vm.runInContext("openProduct('1')",context);assert(elements.get('#page').innerHTML.includes('Sell this item'));assert(elements.get('#page').innerHTML.includes('Buy item'));
 cookie=savedCookie;vm.runInContext('state.user='+JSON.stringify(seller.user),context);await vm.runInContext('refresh()',context);vm.runInContext("navigate('offers')",context);assert(elements.get('#page').innerHTML.includes('Sell order'));
 vm.runInContext(`offerDetails('${offer_id}')`,context);assert(elements.get('#offer-details').innerHTML.includes('Updated'));assert(elements.get('#offer-details').innerHTML.includes('Edit offer'));assert(elements.get('#detail-dialog').open);
 assert.equal((await db.query('SELECT status FROM seller_offers WHERE offer_id=$1',[offer_id])).rows[0].status,'pending');
 console.log('PASS: photo saved/read/preserved, invalid upload rejected and reviewed photo edit denied; guest Home/search; product Buy/Sell; profile/Sell order/details; buyer login, own address and awaiting-payment order; seller submit/pending/edit; foreign address denied; buyer cannot access seller data.');
}finally{
 if(child){child.kill();await new Promise(r=>child.once('exit',r));}await db?.end();if(/^owl_home_test_[a-f0-9]{10}$/.test(name))await root.query(`DROP DATABASE IF EXISTS ${name}`);await root.end();
}

