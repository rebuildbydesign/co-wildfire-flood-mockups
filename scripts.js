(function(){
const NS="http://www.w3.org/2000/svg";
const el=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const HZ=[["flood","Flood today","var(--flood)"],["fire","Wildfire today","var(--fire)"],["fire47","Wildfire around 2047","var(--f47)"],["both","Flood x wildfire today","var(--both)"]];

// sidebars
document.querySelectorAll('.sb').forEach(sb=>{
  const d=sb.dataset, live=d.live==="1";
  sb.innerHTML=`<h1>Colorado Wildfire + Flood Map</h1><div class="wt">Working title</div>
  <div class="ph">${d.intro||"Intro text goes here."}</div>
  <h3>Step 1: Find a Place</h3>
  <div class="viewby">${["County","Town","House","Senate"].map(v=>`<span class="${v===d.view?'on':''}">${v}</span>`).join('')}</div>
  <div class="sel"><span>${d.sel}</span><span>▾</span></div>
  <div class="search">Search an address</div>
  <h3>Step 2: Pick a Hazard</h3>
  <div class="hz"${live?' id="hz1"':''}>${HZ.map(([k,l,c])=>`<button data-h="${k}" style="--c:${c}" class="${k===d.hz?'on':''}"${live?'':' tabindex="-1"'}><span class="sw"></span>${l}</button>`).join('')}</div>
  <h3>Step 3: Public Assets</h3><div class="fac-pill">Show public assets</div>
  ${d.fac?'<div class="fac-list">Schools, healthcare, fire and EMS, police, power plants, wastewater plants, dams, airports, landfills, Superfund sites, libraries</div>':''}`;
});

// fit fixed stages to page width
function fit(){document.querySelectorAll('.stage-box').forEach(b=>{const s=b.querySelector('.stage');const k=Math.min(1,b.clientWidth/1440);s.style.transform=`scale(${k})`;b.style.height=(810*k)+'px';});}
addEventListener('resize',fit);fit();

// ---------- 1: statewide ----------
const G=window.GEO;
const NOPARCEL=new Set(["Alamosa","Baca","Bent","Chaffee","Cheyenne","Conejos","Costilla","Crowley","Delta","Fremont","Jackson","Kiowa","Kit Carson","Las Animas","Lincoln","Mineral","Montrose","Otero","Phillips","Prowers"]);
const NOFEMA=new Set(["Alamosa","Baca","Bent","Cheyenne","Conejos","Costilla","Crowley","Custer","Dolores","Huerfano","Jackson","Kiowa","Kit Carson","Lake","Moffat","Otero","Phillips","San Miguel","Yuma"]);
const RAMPS={
  flood:{t:"Share of properties at high flood risk",c:["#1c3045","#2a5784","#3a7fc3","#a5d5f1"],l:["0%","5%","15%","30%+"]},
  fire:{t:"Share of properties at high wildfire risk",c:["#3a2418","#7d3a12","#c2560c","#f28a07"],l:["0%","10%","25%","40%+"]},
  fire47:{t:"Change in yearly chance of burning, ~2011 to ~2047",c:["#2e1014","#6b1522","#a8182e","#e0344b"],l:["little","","","doubles+"]},
  both:{t:"Share of properties at high risk of flood x wildfire",c:["#241a33","#46306b","#6f4bb0","#a98bf0"],l:["0%","1%","3%","5%+"]}
};
const h4=(s,k)=>{let x=0;for(const ch of s+k)x=(x*31+ch.charCodeAt(0))>>>0;return x%4;};
const fill=document.getElementById('cfill'),over=document.getElementById('cover'),lab=document.getElementById('clab');
const paths=G.state.counties.map(c=>{const p=el('path',{d:c.d,stroke:"#0c0d0e","stroke-width":"1"});fill.appendChild(p);const o=el('path',{d:c.d,fill:"none"});over.appendChild(o);return {c,p,o};});
const bc=G.state.boulder_c;
const bl=el('text',{x:bc[0],y:bc[1]+4,"text-anchor":"middle","font-size":"11","font-weight":"700",fill:"#fff",stroke:"#000","stroke-width":"3","paint-order":"stroke"});bl.textContent="Boulder";lab.appendChild(bl);
const legend=document.getElementById('legend1');
function draw(hz){
  const R=RAMPS[hz], flood=hz==='flood'||hz==='both';
  paths.forEach(({c,p,o})=>{
    p.setAttribute('fill',NOPARCEL.has(c.name)?'url(#hatch)':R.c[h4(c.name,hz)]);
    o.setAttribute('fill',flood&&NOFEMA.has(c.name)&&!NOPARCEL.has(c.name)?'url(#dots)':'none');
  });
  legend.innerHTML=`<div class="t">${R.t}</div>
   <div class="ramp">${R.c.map(x=>`<div style="background:${x}"></div>`).join('')}</div>
   <div class="ramp-l">${R.l.map(x=>`<span>${x}</span>`).join('')}</div>
   <div class="lg-row"><svg width="18" height="12"><rect width="18" height="12" fill="url(#hatch)"/></svg>No parcel data from the state</div>
   ${flood?`<div class="lg-row"><svg width="18" height="12"><rect width="18" height="12" fill="${R.c[0]}"/><rect width="18" height="12" fill="url(#dots)"/></svg>No digital FEMA flood map</div>`:''}`;
  document.querySelectorAll('#hz1 button').forEach(b=>b.classList.toggle('on',b.dataset.h===hz));
}
document.querySelectorAll('#hz1 button').forEach(b=>b.addEventListener('click',()=>draw(b.dataset.h)));
draw('both');

// ---------- 2: Boulder map ----------
const z=document.getElementById('z'),Z=G.zoom;
Z.neighbors.forEach(n=>z.appendChild(el('path',{d:n.d,fill:"#232628",stroke:"#3b3f42","stroke-width":"1"})));
z.appendChild(el('path',{d:Z.boulder,fill:"#2b2f32"}));
z.appendChild(el('path',{d:Z.fire_mod,fill:"#f27407","fill-opacity":".35","fill-rule":"evenodd"}));
z.appendChild(el('path',{d:Z.fire_high,fill:"#f27407","fill-opacity":".85","fill-rule":"evenodd"}));
z.appendChild(el('path',{d:Z.flood,fill:"#3a7fc3","fill-opacity":".95",stroke:"#a5d5f1","stroke-width":".4","fill-rule":"evenodd"}));
Z.towns.forEach(t=>z.appendChild(el('path',{d:t.d,fill:"none",stroke:"#e6e6e6","stroke-width":".8","stroke-dasharray":"3 2"})));
z.appendChild(el('path',{d:Z.boulder,fill:"none",stroke:"#fff","stroke-width":"2.5"}));
(Z.townlabels||[]).filter(t=>t.a>1e6).forEach(t=>{const e=el('text',{x:t.p[0],y:t.p[1],"text-anchor":"middle","font-size":"13","font-weight":"700",fill:"#fff",stroke:"#000","stroke-width":"3","paint-order":"stroke"});e.textContent=t.n;z.appendChild(e);});

// ---------- 3: Jamestown parcels ----------
const T=window.TOWN, tm=document.getElementById('tm');
tm.appendChild(el('rect',{x:-500,y:-500,width:1800,height:1700,fill:"#1b1d1f"}));
tm.appendChild(el('path',{d:T.fire,fill:"#f27407","fill-opacity":".12","fill-rule":"evenodd"}));
const PC={none:["#4a4f53",1],flood:["#3a7fc3",.55],fire:["#f27407",.4],both:["#8b5cf6",1]};
for(const k of ["none","fire","flood","both"]) tm.appendChild(el('path',{d:T.parcels[k],fill:PC[k][0],"fill-opacity":PC[k][1],stroke:"#111","stroke-width":".6","fill-rule":"evenodd"}));
tm.appendChild(el('path',{d:T.flood,fill:"none",stroke:"#a5d5f1","stroke-width":"1.2","fill-rule":"evenodd"}));
tm.appendChild(el('path',{d:T.town,fill:"none",stroke:"#fff","stroke-width":"3","stroke-dasharray":"8 5"}));
const tl=el('text',{x:T.label[0],y:T.label[1]-60,"text-anchor":"middle","font-size":"22","font-weight":"700",fill:"#fff",stroke:"#000","stroke-width":"4","paint-order":"stroke"});tl.textContent="JAMESTOWN";tm.appendChild(tl);

// ---------- 4: House District 49 ----------
const HD=window.HD, hm=document.getElementById('hm');
HD.districts.forEach(d=>hm.appendChild(el('path',{d:d.d,fill:RAMPS.both.c[h4("hd"+d.n,"both")],stroke:"#0c0d0e","stroke-width":"2"})));
HD.cty.forEach(c=>hm.appendChild(el('path',{d:c.d,fill:"none",stroke:"#ddd","stroke-width":"1.5","stroke-dasharray":"6 4"})));
hm.appendChild(el('path',{d:HD.hd,fill:"none",stroke:"#fff","stroke-width":"6"}));
HD.cty.forEach(c=>{const t=el('text',{x:c.p[0],y:c.p[1],"text-anchor":"middle","font-size":"30","font-weight":"700",fill:"#fff",stroke:"#000","stroke-width":"6","paint-order":"stroke"});t.textContent=c.n;hm.appendChild(t);});

// ---------- popup component ----------
const card=(cls,label,cells,extra='')=>`<div class="hzc ${cls}"><div class="bl">${label}</div><div class="g">${cells.map(([v,l,m])=>`<div><b class="${m||''}">${v}</b><span>${l}</span></div>`).join('')}</div>${extra}</div>`;
const four=(p,v,t,r,m={})=>[[p[0],`properties (${p[1]})`,m.p],[v,"property value",m.v],[t,"est. property tax a year",m.t],[r,"est. residents",m.r]];
const bar=(lab,n,t,c,lt)=>`<div class="bar"><span style="color:${lt}">${lab}</span><div class="tr"><div style="width:${t?n/t*100:0}%;background:${c}"></div></div><span class="v">${n}/${t}</span></div>`;
function popup(id,P){
  const facs=P.facs.filter(f=>f[2]+f[3]+f[4]+f[5]>0).sort((a,b)=>(b[5]/b[1]-a[5]/a[1])||(b[3]/b[1]-a[3]/a[1])).slice(0,P.maxFac||6);
  document.getElementById(id).innerHTML=`<div class="L">
    <div class="ch"><div class="k">${P.kind}</div><div class="n">${P.name}</div><div class="s">${P.ctx}</div></div>
    ${card('c-flood','Flood today',P.flood)}
    ${card('c-fire','Wildfire today',P.fire)}
    ${card('c-f47','Wildfire around 2047',P.f47)}
    ${card('c-both','Flood x wildfire today',P.both)}
  </div><div class="R">
    <div class="fac-head"><div class="t">Public Assets at Risk</div><div class="s">${P.facSum}</div></div>
    <div class="fac-grid">${facs.map(([n,t,fl,fi,f47,b])=>`<div class="fac"><div class="nm">${n}</div>${bar('Flood',fl,t,'#3a7fc3','#a5d5f1')}${bar('Fire',fi,t,'#f27407','#ffa45c')}${bar('2047',f47,t,'#d4213d','#ff7d8c')}${bar('Both',b,t,'#8b5cf6','#c9b6ff')}</div>`).join('')}</div>
    <div class="foot">Counted at risk if within 100 ft of a high risk area, the NJ method.</div><div class="foot">Residents are estimates: each census block's population is spread across the parcels in that block.</div>
    ${P.where?`<div class="box"><div class="bl2">${P.where.t}</div><div class="where" style="--wc:${P.where.c}">${P.where.rows.map(([a,b,m])=>`<span>${a}</span><span class="${m||''}">${b}</span>`).join('')}</div></div>`:''}
  </div>`;
}
const f47=(a,b,n)=>[[`${a} → ${b}`,"average yearly chance of burning"],[n,"properties where it at least doubles"]];
popup('pop-county',{kind:"County",name:"BOULDER COUNTY",
  ctx:`<b>131,000</b> properties · <b>19,330</b> (14.8%) at high risk of any hazard, each counted once`,
  flood:four(["4,100","3.1%"],"$6.9B","$46.2M","9,500"),
  fire:four(["15,880","12.2%"],"$12.4B","$81.0M","31,200"),
  f47:f47("0.31%","0.74%","11,240"),
  both:four(["753","0.6%"],"$1.12B","$7.4M","1,710"),
  facSum:`412 public assets · <b style="color:var(--flood-lite)">9.2%</b> flood, <b style="color:var(--fire-lite)">21.6%</b> wildfire, <b style="color:var(--both-lite)">2.4%</b> both`,
  facs:[["Fire and EMS stations",38,2,14,19,1],["Schools",121,9,22,30,2],["Dams",64,11,18,23,4],["Healthcare",57,4,6,9,0],["Police stations",19,2,3,5,0],["Wastewater plants",14,6,2,3,2],["Power plants",22,1,4,6,0],["Libraries",23,2,3,4,1],["Landfills",9,0,2,3,0]],
  where:{t:"High flood risk properties, by town",c:"var(--flood-lite)",rows:[["Boulder","2,050"],["Unincorporated","940"],["Longmont","680"],["Lyons","120"]]}});
popup('pop-town',{kind:"Town",name:"JAMESTOWN",
  ctx:`Boulder County · House 49 · Senate 15<br><b>240</b> properties · <b>215</b> at high risk of any hazard, each counted once`,
  flood:four(["28","11.7%"],"$12.9M","$88K","65"),
  fire:four(["215","89.6%"],"$104M","$710K","450"),
  f47:f47("0.42%","1.10%","198"),
  both:four(["28","11.7%"],"$12.9M","$88K","65"),
  facSum:`4 public assets · <b style="color:var(--flood-lite)">1</b> flood, <b style="color:var(--fire-lite)">4</b> wildfire, <b style="color:var(--both-lite)">1</b> both`,
  facs:[["Fire and EMS stations",1,0,1,1,0],["Schools",1,0,1,1,0],["Wastewater plants",1,1,1,1,1],["Libraries",1,0,1,1,0]]});
popup('pop-hd',{kind:"Colorado House",name:"HOUSE DISTRICT 49",
  ctx:`Rep. [name] · parts of Larimer, Boulder, Clear Creek, Gilpin<br><b>38,900</b> properties · <b>9,620</b> (24.7%) at high risk of any hazard`,
  flood:four(["1,840","4.7%"],"$1.21B","$7.9M","3,950"),
  fire:four(["8,310","21.4%"],"$5.64B","$36.2M","17,800"),
  f47:f47("0.38%","0.91%","6,420"),
  both:four(["530","1.4%"],"$0.31B","$2.0M","1,130"),
  facSum:`186 public assets · <b style="color:var(--flood-lite)">8.1%</b> flood, <b style="color:var(--fire-lite)">31.2%</b> wildfire, <b style="color:var(--both-lite)">3.8%</b> both`,
  facs:[["Fire and EMS stations",29,2,13,17,1],["Schools",34,2,9,14,1],["Dams",41,6,15,19,3],["Wastewater plants",11,4,3,5,2],["Healthcare",12,0,2,3,0],["Power plants",8,0,3,4,0]],
  maxFac:4,
  where:{t:"At high risk of any hazard, by county",c:"#fff",rows:[["Larimer (part)","5,480"],["Boulder (part)","2,310"],["Clear Creek","1,190"],["Gilpin","640"]]}});
})();
