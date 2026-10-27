const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../core.js');

test('calibration learns all four separate maps and stays frozen during evaluation',()=>{
  const e=new K.Experiment({seed:7,rounds:80});
  assert.ok(e.trainingMSE<0.002);
  const bank=JSON.stringify(e.records);
  while(e.step());
  assert.equal(JSON.stringify(e.records),bank);
});
test('same seed reproduces full report and step does nothing after completion',()=>{
  const a=new K.Experiment({seed:123,rounds:40}),b=new K.Experiment({seed:123,rounds:40});
  while(a.step()); while(b.step());
  assert.deepEqual(a.report(),b.report());
  const r=JSON.stringify(a.report()); assert.equal(a.step(),null); assert.equal(JSON.stringify(a.report()),r);
});
test('charged loss counts exactly one unit price for each query',()=>{
  const r=K.run({seed:1,rounds:100,cost:0.02});
  for(const m of Object.values(r.metrics)){
    assert.ok(m.queries>=0&&m.queries<=100);
    assert.ok(Math.abs(m.loss-m.mse-0.02*m.queries/100)<1e-12);
    assert.equal(m.actions,100+m.queries);
  }
  assert.equal(r.metrics.passive.queries,0);
});
test('exact rotations offer equal disagreement in every unit direction',()=>{
  const maps=[[1,0,0,1],[0,-1,1,0],[-1,0,0,-1],[0,1,-1,0]],p=[.1,.2,.3,.4];
  const v=K.variance(maps,p,[1,0]);
  for(const q of K.DIRECTIONS)assert.ok(Math.abs(K.variance(maps,p,q)-v)<1e-12);
});
test('identical and expensive controls do not purchase worthless observations',()=>{
  for(const preset of ['identical','expensive']){
    const r=K.run({preset,seed:18,rounds:100});
    assert.equal(r.metrics.active.queries,0);
  }
});
test('query choice uses belief and input only; observation can change belief',()=>{
  const maps=[[1,0,0,0],[-1,0,0,0],[0,0,0,1],[0,0,0,-1]];
  const a=new K.Agent('active',maps,{noise:.1,cost:.01,hazard:.035},11);
  const q=a.choose([1,0]); assert.ok(q); assert.ok(Math.abs(Math.hypot(...q)-1)<1e-12);
  assert.deepEqual(a.p,[.25,.25,.25,.25]);
  a.observe([1,0],[1,0]); assert.ok(a.p[0]>.99);
});
test('production target is revealed only after the saved prediction',()=>{
  const e=new K.Experiment({seed:4,rounds:2,cost:100});
  const row=e.step();
  assert.deepEqual(row.agents.passive.before,[.25,.25,.25,.25]);
  const expected=K.mix(e.records,[.25,.25,.25,.25],row.x);
  assert.deepEqual(row.agents.passive.prediction,expected);
});
test('world and observations do not change when query policy price changes',()=>{
  const a=new K.Experiment({seed:3,rounds:30,cost:0}),b=new K.Experiment({seed:3,rounds:30,cost:100});
  for(let i=0;i<30;i++){
    const x=a.step(),y=b.step();
    for(const key of ['truth','x','target','observed'])assert.deepEqual(x[key],y[key]);
  }
});
test('invalid configuration is rejected instead of generating corrupt receipts',()=>{
  for(const args of [{rounds:0},{noise:-1},{cost:NaN},{seed:1.5},{preset:'missing'}]) assert.throws(()=>new K.Experiment(args),RangeError);
});
