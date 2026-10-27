/* BigKahuna: shared browser/Node engine. No browser state or network access. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BigKahuna=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.0.0';
  const NAMES=['passive','fixed','random','active'];
  const LABELS={passive:'Feedback only',fixed:'Fixed probe',random:'Random probe',active:'Questioning needle'};
  const PRESETS={
    directional:{title:'Different directions',family:'directional',hazard:.035,cost:.025},
    rotations:{title:'Rotation control',family:'rotations',hazard:.035,cost:.025},
    identical:{title:'Identical records',family:'identical',hazard:.035,cost:.025},
    rapid:{title:'Fast-changing world',family:'directional',hazard:.30,cost:.025},
    expensive:{title:'Expensive questions',family:'directional',hazard:.035,cost:.5}
  };
  const DIRECTIONS=Object.freeze(Array.from({length:16},(_,i)=>Object.freeze([Math.cos(i*Math.PI/16),Math.sin(i*Math.PI/16)])));
  function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function normal(r){return Math.sqrt(-2*Math.log(Math.max(1e-12,r())))*Math.cos(2*Math.PI*r());}
  const apply=(w,x)=>[w[0]*x[0]+w[1]*x[1],w[2]*x[0]+w[3]*x[1]];
  const mse=(a,b)=>((a[0]-b[0])**2+(a[1]-b[1])**2)/2;
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  function mix(maps,p,x){const out=[0,0];maps.forEach((w,i)=>{const y=apply(w,x);out[0]+=p[i]*y[0];out[1]+=p[i]*y[1];});return out;}
  function variance(maps,p,x){const y=mix(maps,p,x);return maps.reduce((s,w,i)=>s+p[i]*mse(apply(w,x),y),0);}
  function rotation(a){return[Math.cos(a),-Math.sin(a),Math.sin(a),Math.cos(a)];}
  function multiply(a,b){return[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3]];}
  function makeWorld(family,r){
    let maps;
    if(family==='rotations')maps=[0,Math.PI/2,Math.PI,-Math.PI/2].map(rotation);
    else if(family==='identical')maps=Array.from({length:4},()=>[.7,.1,-.1,.7]);
    else maps=[[.9,.2,.1,.25],[-.9,.2,.1,.25],[.2,.1,.2,.9],[.2,.1,.2,-.9]];
    const left=rotation(r()*2*Math.PI),right=rotation(r()*2*Math.PI);
    return maps.map(w=>multiply(multiply(left,w),right));
  }
  function trainRecords(maps,seed){
    const r=rng(seed),records=maps.map(w=>{
      const learned=[0,0,0,0];
      for(let i=0;i<512;i++){
        const x=[r()*2-1,r()*2-1],y=apply(w,x).map(v=>v+.02*normal(r)),p=apply(learned,x);
        const gain=.15/(.25+x[0]**2+x[1]**2);
        for(let j=0;j<2;j++)for(let k=0;k<2;k++)learned[j*2+k]+=gain*(y[j]-p[j])*x[k];
      }
      return Object.freeze(learned);
    });
    const v=rng(seed^0xAA1133),errors=[];
    for(let i=0;i<128;i++){const x=[v()*2-1,v()*2-1];maps.forEach((w,j)=>errors.push(mse(apply(w,x),apply(records[j],x))));}
    return {records:Object.freeze(records),error:mean(errors)};
  }
  function bestDirection(maps,p){
    let score=-1,best=DIRECTIONS[0];
    for(const q of DIRECTIONS){const s=variance(maps,p,q);if(s>score+1e-12){score=s;best=q;}}
    return best;
  }
  class Agent{
    constructor(kind,records,config,seed){
      this.kind=kind;this.records=records;this.config=config;this.p=[.25,.25,.25,.25];this.random=rng(seed);
      this.fixed=bestDirection(records,this.p);this.candidates=kind==='fixed'?16:0;
      this.error=0;this.queries=0;this.correct=0;
    }
    advance(){const h=this.config.hazard;this.p=this.p.map(v=>(1-h)*v+h*(1-v)/3);}
    choose(x){
      if(this.kind==='passive'||variance(this.records,this.p,x)<=this.config.cost)return null;
      if(this.kind==='fixed')return this.fixed;
      if(this.kind==='random')return DIRECTIONS[Math.floor(this.random()*DIRECTIONS.length)];
      this.candidates+=16;return bestDirection(this.records,this.p);
    }
    observe(x,y){
      // Calibration error requires a small likelihood floor even at zero observation noise.
      const sigma2=Math.max(.025**2,this.config.noise**2);
      const log=this.records.map((w,i)=>Math.log(Math.max(1e-300,this.p[i]))-mse(apply(w,x),y)/sigma2);
      const max=Math.max(...log),p=log.map(v=>Math.exp(v-max)),sum=p.reduce((a,b)=>a+b,0);
      this.p=p.map(v=>v/sum);
    }
    predict(x){return mix(this.records,this.p,x);}
  }
  function config(options){
    const preset=options.preset??'directional';
    if(!Object.hasOwn(PRESETS,preset))throw new RangeError('Unknown preset');
    const c={preset,seed:42,rounds:600,noise:.12,...PRESETS[preset],...options};
    if(!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>4294967295)throw new RangeError('Seed must be a uint32');
    if(!Number.isSafeInteger(c.rounds)||c.rounds<1||c.rounds>100000)throw new RangeError('Rounds must be 1–100000');
    for(const [k,max] of [['noise',2],['cost',100],['hazard',1]])if(!Number.isFinite(c[k])||c[k]<0||c[k]>max)throw new RangeError('Invalid '+k);
    if(!['directional','rotations','identical'].includes(c.family))throw new RangeError('Unknown family');
    return Object.freeze(c);
  }
  class Experiment{
    constructor(options={}){
      this.config=config(options);const s=this.config.seed;
      this.maps=makeWorld(this.config.family,rng(s^0x341755));
      const trained=trainRecords(this.maps,s^0x9211);this.records=trained.records;this.trainingMSE=trained.error;
      this.world=rng(s^0xA189);this.noise=rng(s^0xBB13);this.truth=Math.floor(this.world()*4);
      this.agents=Object.fromEntries(NAMES.map((n,i)=>[n,new Agent(n,this.records,this.config,s^((i+1)*7919))]));
      this.t=0;this.switches=0;this.history=[];this.last=null;
    }
    step(){
      if(this.t>=this.config.rounds)return null;
      const {hazard,noise,cost}=this.config;let switched=false;
      if(this.t>0&&this.world()<hazard){this.truth=(this.truth+1+Math.floor(this.world()*3))%4;this.switches++;switched=true;}
      const x=[this.world()*2-1,this.world()*2-1],target=apply(this.maps[this.truth],x);
      const ordinaryNoise=[normal(this.noise)*noise,normal(this.noise)*noise],probeNoise=[normal(this.noise)*noise,normal(this.noise)*noise];
      const observed=target.map((v,i)=>v+ordinaryNoise[i]);
      const row={t:this.t+1,truth:this.truth,switched,x,target,observed,agents:{}};
      for(const name of NAMES){
        const a=this.agents[name];a.advance();const before=[...a.p],probe=a.choose(x);let response=null;
        if(probe){response=apply(this.maps[this.truth],probe).map((v,i)=>v+probeNoise[i]);a.observe(probe,response);a.queries++;}
        const belief=[...a.p],prediction=a.predict(x),route=belief.indexOf(Math.max(...belief));
        const error=mse(prediction,target);a.error+=error;if(route===this.truth)a.correct++;
        // Save the decision before ordinary target feedback can affect the next round.
        row.agents[name]={before,belief,prediction,route,probe:probe?[...probe]:null,response,error,loss:error+(probe?cost:0)};
        a.observe(x,observed);
      }
      this.t++;this.last=row;
      this.history.push({t:this.t,truth:this.truth,switched,loss:Object.fromEntries(NAMES.map(n=>[n,(this.agents[n].error+cost*this.agents[n].queries)/this.t]))});
      return row;
    }
    report(){
      const n=this.t;
      return {version:VERSION,config:this.config,complete:n===this.config.rounds,rounds:n,switches:this.switches,
        trainingMSE:this.trainingMSE,records:this.records,metrics:Object.fromEntries(NAMES.map(k=>{
          const a=this.agents[k];return[k,{mse:n?a.error/n:0,loss:n?(a.error+this.config.cost*a.queries)/n:0,
            queries:a.queries,actions:n+a.queries,routeAccuracy:n?a.correct/n:0,candidateEvaluations:a.candidates}];
        })),history:this.history};
    }
  }
  function run(options){const e=new Experiment(options);while(e.step());return e.report();}
  return {VERSION,NAMES,LABELS,PRESETS,DIRECTIONS,rng,apply,mse,mix,variance,trainRecords,Agent,Experiment,run};
});
