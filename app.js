/* UI only. Every observation, choice and score comes from core.js. */
(()=>{
  'use strict';
  const K=window.BigKahuna,$=id=>document.getElementById(id);
  const COLORS={passive:'#748982',fixed:'#c77a47',random:'#9276b3',active:'#087c70'};
  const LETTERS=['A','B','C','D'];
  let experiment,playing=false,finishing=false,token=0,lastTime=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('records').innerHTML=LETTERS.map((v,i)=>`<div class="record" id="record-${i}"><canvas id="disc-${i}" role="img" aria-label="Learned record ${v}"></canvas><div class="record-name"><span>RECORD ${v}</span><strong id="belief-${i}">25%</strong></div><div class="belief-track"><div class="belief-fill" id="fill-${i}"></div></div></div>`).join('');
  $('legend').innerHTML=K.NAMES.map(n=>`<span><i class="key" style="background:${COLORS[n]}"></i>${K.LABELS[n]}</span>`).join('');
  function setupCanvas(id){const c=$(id),r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(!r.width||!r.height)return null;c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);const ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{ctx,w:r.width,h:r.height};}
  function reset(){
    token++;playing=false;finishing=false;
    if(!$('seed').checkValidity()||$('seed').value===''){$('seed').value='42';}
    experiment=new K.Experiment({preset:$('preset').value,seed:Number($('seed').value),noise:Number($('noise').value),cost:Number($('cost').value)});
    $('noise-value').textContent=experiment.config.noise.toFixed(2);$('cost-value').textContent=experiment.config.cost.toFixed(3);
    render();
  }
  function disc(id,index,p,selected,truth){
    const o=setupCanvas(id);if(!o)return;const{ctx:c,w,h}=o;
    const x=w/2,y=h/2,r=Math.min(w,h)*.43;
    c.fillStyle='rgba(24,44,38,.08)';c.beginPath();c.ellipse(x,y+r*.85,r*.94,r*.15,0,0,7);c.fill();
    c.fillStyle=selected?'#183d34':'#293d35';c.beginPath();c.arc(x,y,r,0,7);c.fill();
    for(let k=0;k<12;k++){c.beginPath();c.arc(x,y,r*(.38+k*.049),0,7);c.strokeStyle=k%3===0?'#65786a':'#425a4b';c.lineWidth=.7;c.stroke();}
    c.beginPath();c.arc(x,y,r+4,-Math.PI/2,-Math.PI/2+Math.PI*2*p);c.strokeStyle='#087c70';c.lineWidth=3;c.stroke();
    // The curve is W applied to a unit circle: the actual learned matrix.
    c.beginPath();for(let k=0;k<=80;k++){const a=k/80*Math.PI*2,v=K.apply(experiment.records[index],[Math.cos(a),Math.sin(a)]);const xx=x+v[0]*r*.72,yy=y-v[1]*r*.72;if(!k)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.strokeStyle='#a7c9a2';c.lineWidth=1.3;c.stroke();
    c.fillStyle='#e0e6ca';c.beginPath();c.arc(x,y,r*.26,0,7);c.fill();c.fillStyle='#29443a';c.font=`600 ${Math.max(12,r*.25)}px system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillText(LETTERS[index],x,y-1);
    if(truth){c.fillStyle='#cc6b35';c.beginPath();c.arc(x+r*.78,y-r*.78,5,0,7);c.fill();}
    if(selected){c.strokeStyle='#74877b';c.lineWidth=3;c.beginPath();c.moveTo(x+r*.95,y-r*.95);c.lineTo(x+r*.53,y+r*.1);c.lineTo(x+r*.18,y+r*.45);c.stroke();c.fillStyle='#e4a05d';c.fillRect(x+r*.18-3,y+r*.45-2,6,8);}
    $(id).setAttribute('aria-label',`Record ${LETTERS[index]}: ${(p*100).toFixed(1)}% belief${selected?', selected':''}${truth?', actual world rule (display only)':''}`);
  }
  function arrow(c,x,y,dx,dy,color){const endX=x+dx,endY=y+dy,a=Math.atan2(dy,dx);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();c.beginPath();c.moveTo(endX,endY);c.lineTo(endX-7*Math.cos(a-.45),endY-7*Math.sin(a-.45));c.lineTo(endX-7*Math.cos(a+.45),endY-7*Math.sin(a+.45));c.fill();}
  function probeView(){const o=setupCanvas('probe-canvas');if(!o)return;const{ctx:c,w,h}=o,x=w/2,y=h/2,r=Math.min(w,h)*.37;
    c.strokeStyle='#3c5a4a';c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,7);c.moveTo(x-r-10,y);c.lineTo(x+r+10,y);c.moveTo(x,y-r-10);c.lineTo(x,y+r+10);c.stroke();
    for(const q of K.DIRECTIONS){c.fillStyle='#6b8674';c.beginPath();c.arc(x+q[0]*r,y-q[1]*r,2,0,7);c.fill();}
    const row=experiment.last;if(row){arrow(c,x,y,row.x[0]*r,-row.x[1]*r,'#9cae9f');const q=row.agents.active.probe;if(q)arrow(c,x,y,q[0]*r,-q[1]*r,'#80dfb2');}
    else{c.fillStyle='#9eb9a7';c.font='10px ui-monospace,monospace';c.textAlign='center';c.fillText('16 possible directions',x,y+r+21);}
  }
  function chart(){const o=setupCanvas('chart');if(!o)return;const{ctx:c,w,h}=o,L=40,R=12,T=10,B=27,iw=w-L-R,ih=h-T-B;
    const hist=experiment.history,max=Math.max(.04,...hist.flatMap(row=>K.NAMES.map(n=>row.loss[n])))*1.12;
    c.font='10px ui-monospace,monospace';c.fillStyle='#7c887e';c.lineWidth=1;
    for(let i=0;i<4;i++){const y=T+ih*i/3;c.beginPath();c.moveTo(L,y);c.lineTo(w-R,y);c.strokeStyle='#e1e6da';c.stroke();c.textAlign='right';c.fillText((max*(1-i/3)).toFixed(2),L-7,y+3);}
    c.textAlign='center';for(const n of [0,150,300,450,600])c.fillText(String(n),L+iw*n/600,h-6);
    for(const row of hist){if(row.switched){const x=L+iw*row.t/600;c.fillStyle='#cc6b3518';c.fillRect(x,T,1,ih);}}
    for(const name of K.NAMES){c.beginPath();hist.forEach((row,i)=>{const x=L+iw*row.t/600,y=T+ih*(1-row.loss[name]/max);if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.strokeStyle=COLORS[name];c.lineWidth=name==='active'?2.6:1.4;c.stroke();}
    if(!hist.length){c.textAlign='center';c.fillStyle='#8a958b';c.fillText('Cumulative charged loss will appear here',L+iw/2,T+ih/2);}
  }
  function render(){
    const r=experiment.report(),row=experiment.last,a=row?.agents.active,p=a?.belief??[.25,.25,.25,.25],done=r.complete;
    $('run').textContent=playing?'Ⅱ Pause':done?'↺ Run again':'▶ Run experiment';$('run').disabled=finishing;
    $('step').disabled=playing||finishing||done;$('finish').disabled=finishing||done;
    $('progress').value=experiment.t;
    const state=done?'Complete':finishing?'Finishing':playing?'Running':row?'Paused':'Ready';
    // Live-region text is limited to avoid announcing every animation frame.
    const text=state+' · '+experiment.t+' / 600 predictions';
    if(done||!playing||experiment.t%25===0)$('status').textContent=text;
    $('truth').textContent=row?'World: '+LETTERS[row.truth]+(row.switched?' · switched':''):'World: hidden';
    $('truth').title='Evaluator display only. Selectors never receive this identity.';
    LETTERS.forEach((_,i)=>{$('belief-'+i).textContent=(p[i]*100).toFixed(0)+'%';$('fill-'+i).style.width=(p[i]*100)+'%';$('record-'+i).classList.toggle('active',a?.route===i);disc('disc-'+i,i,p[i],a?.route===i,row?.truth===i);});
    $('training').textContent='Calibration MSE '+r.trainingMSE.toExponential(1)+' · weights frozen';
    $('questions').textContent=r.metrics.active.queries;$('switches').textContent=r.switches;
    $('decision-title').textContent=!row?'Ready to listen.':a.probe?'Ask, then choose.':'Use what we know.';
    $('decision-copy').textContent=!row?'Four records learned separately. During evaluation, the cue gives no clue to the active rule.':a.probe?`A diagnostic direction was chosen from the current belief. Its noisy answer informed this prediction. Price: ${r.config.cost.toFixed(3)}.`:'Predicted output uncertainty did not exceed the price. Predict now, then use ordinary feedback for the next round.';
    const ranked=[...K.NAMES].sort((x,y)=>r.metrics[x].loss-r.metrics[y].loss),best=r.metrics[ranked[0]].loss;
    $('scores').innerHTML=K.NAMES.map(n=>{const m=r.metrics[n];return`<tr class="${n==='active'?'active-row ':''}${row&&Math.abs(m.loss-best)<1e-12?'best':''}"><td><i class="key" style="background:${COLORS[n]}"></i>${K.LABELS[n]}</td><td>${row?m.mse.toFixed(4):'—'}</td><td>${m.queries}</td><td>${row?m.loss.toFixed(4):'—'}</td></tr>`;}).join('');
    if(row){const base=r.metrics.passive.loss,active=r.metrics.active.loss,diff=active-base;const tied=Math.abs(diff)<1e-9;
      $('verdict').textContent=(done?'This run: ':'So far: ')+(tied?'the needle ties feedback-only tracking.':diff<0?`the needle costs ${(100*(-diff)/Math.max(base,1e-12)).toFixed(1)}% less than feedback-only tracking.`:`the needle costs ${(100*diff/Math.max(base,1e-12)).toFixed(1)}% more than feedback-only tracking.`)+' '+(tied?'':`Lowest charged loss: ${K.LABELS[ranked[0]]}. `)+(done?'One seed is not the full benchmark.':'The ordering can change.');
    }else $('verdict').textContent='Press Run to compare all four selectors on the same world.';
    probeView();chart();
  }
  function tick(time){if(playing&&!finishing&&time-lastTime>(reduced?180:80)){lastTime=time;experiment.step();if(experiment.t===experiment.config.rounds)playing=false;render();}requestAnimationFrame(tick);}
  $('run').addEventListener('click',()=>{if(experiment.report().complete)reset();playing=!playing;lastTime=performance.now();render();});
  $('step').addEventListener('click',()=>{experiment.step();render();});
  $('finish').addEventListener('click',()=>{playing=false;finishing=true;const job=++token;render();function chunk(){if(job!==token)return;for(let i=0;i<75;i++)if(!experiment.step())break;render();if(experiment.report().complete){finishing=false;render();}else setTimeout(chunk,0);}setTimeout(chunk,0);});
  $('reset').addEventListener('click',reset);
  $('preset').addEventListener('change',()=>{$('cost').value=K.PRESETS[$('preset').value].cost;$('noise').value=.12;reset();});
  for(const id of ['noise','cost'])$(id).addEventListener('input',reset);
  $('seed').addEventListener('change',reset);
  $('export').addEventListener('click',()=>{const r=experiment.report();const blob=new Blob([JSON.stringify(r,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`bigkahuna-${r.config.preset}-${r.config.seed}-${r.rounds}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  const benchmark=window.BIGKAHUNA_BENCHMARK;
  if(benchmark){$('benchmark-note').textContent=`Directional advantage gate: ${benchmark.directionalGate}. The predeclared gate requires at least 5% lower mean charged loss than every baseline, with at least 15 paired wins out of 20 against each.`;$('benchmark-rows').innerHTML=Object.entries(benchmark.worlds).map(([preset,v])=>`<tr><td>${K.PRESETS[preset].title}</td>${K.NAMES.map(n=>`<td>${v.summary[n].loss.toFixed(4)}</td>`).join('')}</tr>`).join('');}
  else $('benchmark-note').textContent='The benchmark summary is unavailable. Live experiments still work; see the repository receipts.';
  new ResizeObserver(()=>{if(experiment)render();}).observe(document.querySelector('.instrument-grid'));
  reset();requestAnimationFrame(tick);
})();
