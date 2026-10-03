// Renders a few space-looking placeholder images for the UI test (the real app loads publishers' images).
const { chromium, launchOptions } = require('./browser');
(async () => {
  const b = await chromium.launch(launchOptions());
  const p = await b.newPage({ viewport: { width: 1200, height: 700 } }); p.on('pageerror', e => console.log('ERR', e.message));
  const kinds = ['nebula','galaxy','planet','moon','rocket','aurora','cluster','sun'];
  for (const [i, k] of kinds.entries()) {
    await p.setContent(`<canvas id=c width=1200 height=700></canvas><script>{
      const c=document.getElementById('c').getContext('2d');let s=${i*97+7};const r=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
      const k='${k}';const bg=c.createLinearGradient(0,0,1200,700);bg.addColorStop(0,'#05060f');bg.addColorStop(1,k==='aurora'?'#04201a':'#0d0a24');c.fillStyle=bg;c.fillRect(0,0,1200,700);
      for(let j=0;j<900;j++){c.fillStyle='rgba(255,255,255,'+r()*0.8+')';c.beginPath();c.arc(r()*1200,r()*700,r()*1.3,0,7);c.fill();}
      const blob=(x,y,rad,col)=>{const g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1200,700);};
      if(k==='nebula'){blob(500,330,420,'rgba(220,90,140,.55)');blob(760,300,360,'rgba(90,120,255,.5)');blob(620,420,260,'rgba(255,190,110,.45)');}
      if(k==='galaxy'){c.save();c.translate(600,350);c.rotate(-.4);for(let j=0;j<6000;j++){const a=r()*12,d=a*22+r()*40;c.fillStyle='rgba(200,210,255,'+r()*.5+')';c.fillRect(Math.cos(a+ (j%2)*Math.PI)*d,Math.sin(a+(j%2)*Math.PI)*d*.45,1.4,1.4);}c.restore();blob(600,350,120,'rgba(255,230,180,.9)');}
      if(k==='planet'){blob(600,350,380,'rgba(255,140,80,.12)');const g=c.createRadialGradient(540,300,20,600,350,230);g.addColorStop(0,'#f0b27a');g.addColorStop(.7,'#b4552a');g.addColorStop(1,'#3a1409');c.fillStyle=g;c.beginPath();c.arc(600,350,230,0,7);c.fill();}
      if(k==='moon'){const g=c.createRadialGradient(560,310,20,600,350,240);g.addColorStop(0,'#f4efe0');g.addColorStop(1,'#8f8a7c');c.fillStyle=g;c.beginPath();c.arc(600,350,240,0,7);c.fill();for(let j=0;j<40;j++){c.fillStyle='rgba(90,85,75,'+r()*.35+')';c.beginPath();c.arc(420+r()*360,170+r()*360,r()*30,0,7);c.fill();}}
      if(k==='rocket'){blob(600,640,500,'rgba(255,160,60,.6)');c.fillStyle='#e8e8ee';c.fillRect(575,120,50,420);c.beginPath();c.moveTo(575,120);c.lineTo(600,50);c.lineTo(625,120);c.fill();blob(600,580,90,'rgba(255,250,220,1)');}
      if(k==='aurora'){for(let j=0;j<5;j++)blob(200+j*220,260+r()*80,300,'rgba(60,255,160,.25)');c.fillStyle='#020605';c.beginPath();c.moveTo(0,700);for(let x=0;x<=1200;x+=40)c.lineTo(x,560+r()*60);c.lineTo(1200,700);c.fill();}
      if(k==='cluster'){for(let j=0;j<2500;j++){const a=r()*7,d=Math.pow(r(),2)*300;c.fillStyle='rgba(255,'+(200+r()*55|0)+',200,'+r()+')';c.beginPath();c.arc(600+Math.cos(a)*d,350+Math.sin(a)*d,r()*1.6,0,7);c.fill();}blob(600,350,200,'rgba(255,220,170,.35)');}
      if(k==='sun'){blob(600,350,420,'rgba(255,120,30,.5)');const g=c.createRadialGradient(600,350,10,600,350,220);g.addColorStop(0,'#fff6c8');g.addColorStop(.6,'#ffb13b');g.addColorStop(1,'#d9480f');c.fillStyle=g;c.beginPath();c.arc(600,350,220,0,7);c.fill();}
    }</script>`);
    await p.locator('#c').screenshot({ path: `img/${k}.png` });
  }
  await b.close();
})();
