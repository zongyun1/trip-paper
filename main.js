// Load and play clips while they are in view.
(function(){
  const vids=document.querySelectorAll('video[data-src]');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const load=v=>{if(!v.getAttribute('src'))v.src=v.dataset.src};
  if(!('IntersectionObserver' in window)){vids.forEach(load);return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;
    if(e.isIntersecting){load(v);if(!reduce)v.play().catch(()=>{})}else v.pause()}),{threshold:.35});
  vids.forEach(v=>io.observe(v));
})();

// Mark best / second best within a group of values.
function rank(vs){
  const u=[...new Set(vs)].sort((a,b)=>b-a);
  return vs.map(v=>v===u[0]?'best':(v===u[1]?'second':''));
}
const td=(v,cls)=>`<td class="${cls||''}">${v.toFixed(1)}</td>`;

// Summary: success and safety per policy, three methods.
(function(){
  const P=['GR00T','REKI-2B','PatchWAM','XR'], M=['Policy alone','Agentic','TRIP'];
  const S={GR00T:[6.0,15.5,10.1],'REKI-2B':[13.7,15.5,22.6],PatchWAM:[18.5,18.5,24.4],XR:[20.8,31.0,38.7]};
  const F={GR00T:[47.9,66.2,77.5],'REKI-2B':[44.8,58.4,74.4],PatchWAM:[56.5,66.1,80.6],XR:[46.0,61.3,81.3]};
  let h=`<thead><tr class="span"><th></th><th colspan="3">Success &uarr; <small>%</small></th><th colspan="3" class="sep">Safety &uarr; <small>%</small></th></tr><tr><th>Policy</th>${M.map(m=>`<th>${m}</th>`).join('')}${M.map((m,i)=>`<th${i?'':' class="sep"'}>${m}</th>`).join('')}</tr></thead><tbody>`;
  for(const p of P){
    const rs=rank(S[p]), rf=rank(F[p]);
    h+=`<tr><td>${p}</td>${S[p].map((v,i)=>td(v,rs[i])).join('')}${F[p].map((v,i)=>td(v,rf[i]+(i?'':' sep'))).join('')}</tr>`;
  }
  document.getElementById('summary').innerHTML=h+'</tbody>';
})();

// Shared tooltip.
const tip=document.createElement('div');tip.className='tip';document.body.appendChild(tip);
function bindTips(root){root.querySelectorAll('[data-tip]').forEach(el=>{
  el.addEventListener('mouseenter',()=>{tip.innerHTML=el.dataset.tip;tip.classList.add('on')});
  el.addEventListener('mousemove',e=>{tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY+14)+'px'});
  el.addEventListener('mouseleave',()=>tip.classList.remove('on'))})}
const NS='http://www.w3.org/2000/svg';
const MC=['var(--m-base)','var(--m-ag)','var(--m-trip)'], MN=['Policy alone','Agentic','TRIP'];

// Dumbbell: one row per policy, three methods on one axis.
function dumbbell(id,data,lo,hi,step){
  const svg=document.getElementById(id), P=Object.keys(data), L=78, R=520, top=26, rh=48, H=top+rh*P.length+22;
  svg.setAttribute('viewBox',`0 0 540 ${H}`);
  const x=v=>L+(v-lo)/(hi-lo)*(R-L); let h='';
  for(let t=lo;t<=hi+1e-9;t+=step) h+=`<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${top-8}" y2="${H-22}"/><text x="${x(t)}" y="${H-6}" text-anchor="middle">${t}</text>`;
  P.forEach((p,i)=>{const y=top+rh*i+rh/2, v=data[p], mn=Math.min(...v), mx=Math.max(...v);
    h+=`<text class="lab" x="0" y="${y+4}">${p}</text><line class="rail" x1="${x(mn)}" x2="${x(mx)}" y1="${y}" y2="${y}"/>`;
    [0,1,2].forEach(j=>{const d=(v[2]-v[1]).toFixed(1);
      const tipTxt=`<b>${p}</b> · ${MN[j]}: <b>${v[j].toFixed(1)}%</b>`+(j==2?`<br>${d>0?'+':''}${d} vs Agentic`:'');
      h+=`<g data-tip="${tipTxt.replace(/"/g,'&quot;')}"><circle class="hit" cx="${x(v[j])}" cy="${y}" r="13"/><circle class="dot" cx="${x(v[j])}" cy="${y}" r="${j==2?7.5:6}" style="fill:${MC[j]}"/></g>`});
    const d=v[2]-v[1];
    h+=`<text class="val" x="${x(v[2])}" y="${y-13}" text-anchor="middle">${v[2].toFixed(1)}</text>`;
    h+=`<text class="delta" x="${x(v[2])}" y="${y+22}" text-anchor="middle">${d>=0?'+':'−'}${Math.abs(d).toFixed(1)}</text>`;
  });
  svg.innerHTML=h; bindTips(svg);
}
dumbbell('ch-succ',{GR00T:[6.0,15.5,10.1],'REKI-2B':[13.7,15.5,22.6],PatchWAM:[18.5,18.5,24.4],XR:[20.8,31.0,38.7]},0,45,10);
dumbbell('ch-safe',{GR00T:[47.9,66.2,77.5],'REKI-2B':[44.8,58.4,74.4],PatchWAM:[56.5,66.1,80.6],XR:[46.0,61.3,81.3]},40,90,10);

// Table 2 as a heat table.
(function(){
  const D={GR00T:[[9.5,4.8,0.0,9.5,6.0,16.7],[14.3,11.9,4.8,31.0,15.5,24.4],[9.5,7.1,9.5,14.3,10.1,26.2]],
    'REKI-2B':[[9.5,11.9,14.3,19.0,13.7,37.5],[21.4,9.5,11.9,19.0,15.5,51.2],[31.0,23.8,14.3,21.4,22.6,53.6]],
    PatchWAM:[[16.7,11.9,21.4,23.8,18.5,39.9],[21.4,16.7,16.7,19.0,18.5,53.0],[31.0,16.7,26.2,23.8,24.4,56.5]],
    XR:[[33.3,7.1,19.0,23.8,20.8,61.9],[33.3,23.8,28.6,38.1,31.0,73.8],[50.0,26.2,40.5,38.1,38.7,73.2]]};
  const C=['Spatial','Object state','Task state','Perceptual','All'];
  let h=`<colgroup><col class="rl">${C.map(()=>"<col>").join("")}<col style="width:12px"><col></colgroup><thead><tr><th class="rl"></th>${C.map(c=>`<th>${c}</th>`).join('')}<th class="gap"></th><th>No person</th></tr></thead><tbody>`;
  const cell=(v,col,top,p,m)=>{const a=Math.round(6+v/75*84);
    return `<td class="c${a>52?' hi':''}${top?' top':''}" style="background:color-mix(in srgb,var(--m-trip) ${a}%,var(--panel))" data-tip="<b>${p}</b> · ${m}<br>${col}: <b>${v.toFixed(1)}%</b>">${v.toFixed(1)}</td>`};
  for(const [p,rows] of Object.entries(D)){
    h+=`<tr><td class="pol" colspan="8">${p}</td></tr>`;
    rows.forEach((x,i)=>{h+=`<tr${i==2?' class="trip"':''}><td class="rl"><i style="background:${MC[i]}"></i>${MN[i]}</td>`;
      x.forEach((v,j)=>{const top=v===Math.max(...rows.map(r=>r[j]))&&v>0; if(j==5)h+='<td class="gap"></td>';
        h+=cell(v,j==5?'Without the person':C[j],top,p,MN[i])});h+='</tr>'});
  }
  const t=document.getElementById('percat'); t.innerHTML=h+'</tbody>'; bindTips(t);
})();

// Ablation: success vs safety.
(function(){
  const svg=document.getElementById('ch-abl'), W=520, H=330, L=46, R=W-16, T=16, B=H-40;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const x=v=>L+v/45*(R-L), y=v=>B-(v-50)/40*(B-T); let h='';
  for(let t=0;t<=45;t+=10) h+=`<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${B}"/><text x="${x(t)}" y="${B+18}" text-anchor="middle">${t}</text>`;
  for(let t=50;t<=90;t+=10) h+=`<line class="grid" x1="${L}" x2="${R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end">${t}</text>`;
  h+=`<text x="${(L+R)/2}" y="${H-4}" text-anchor="middle">Success %</text><text transform="translate(12 ${(T+B)/2}) rotate(-90)" text-anchor="middle">Safety %</text>`;
  h+=`<text x="${R-4}" y="${T+12}" text-anchor="end">better &#8599;</text>`;
  const pts=[[38.7,81.3,'TRIP (rewritten each turn)','var(--m-trip)',9,'end',-14,5],[38.1,73.8,'TRIP, GPT-6 Astra agent','var(--m-trip)',6.5,'end',-12,5],
    [33.3,61.3,'Set once by the agent','var(--ink-2)',6.5,'end',-12,5],[16.1,86.0,'Pre-defined (hold within 0.6 m)','var(--ink-2)',6.5,'start',12,5]];
  for(const [s,f,n,c,r,an,dx,dy] of pts)
    h+=`<g data-tip="<b>${n}</b><br>success ${s}% · safety ${f}%"><circle class="hit" cx="${x(s)}" cy="${y(f)}" r="14"/><circle class="dot" cx="${x(s)}" cy="${y(f)}" r="${r}" style="fill:${c}"/><text class="lab" x="${x(s)+dx}" y="${y(f)+dy}" text-anchor="${an}">${n}</text></g>`;
  svg.innerHTML=h; bindTips(svg);
})();

// Agent turns: paired bars.
(function(){
  const rows=[['Agent turns per minute',19.4,30.3],['Looks per episode',10.1,28.7]];
  document.getElementById('ch-turns').innerHTML=rows.map(([t,a,b])=>`<div class="pair"><div class="t">${t}</div>
    <div class="row"><span>TRIP</span><div class="bar" style="width:${a/b*100}%;background:var(--m-trip)">${a}</div></div>
    <div class="row"><span>Agentic</span><div class="bar" style="width:100%;background:var(--m-ag)">${b}</div></div></div>`).join('');
})();

// Click a clip to pause / resume (the HUD carries its own timeline).
document.querySelectorAll('video').forEach(v=>v.addEventListener('click',()=>{if(!v.getAttribute('src'))v.src=v.dataset.src;v.paused?v.play():v.pause()}));
