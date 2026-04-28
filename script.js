// ─── HERO PARTICLE CANVAS ───
(function(){
  const c = document.getElementById('hero-canvas');
  const ctx = c.getContext('2d');
  let W, H, nodes=[], edges=[];

  function resize(){
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
  }
  resize(); window.addEventListener('resize', resize);

  for(let i=0;i<60;i++) nodes.push({
    x: Math.random()*1600, y: Math.random()*900,
    vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
    r: Math.random()*2+1
  });

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(8,12,20,.95)';
    ctx.fillRect(0,0,W,H);

    nodes.forEach(n=>{ n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
    });

    for(let i=0;i<nodes.length;i++)
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<160){
          ctx.beginPath();
          ctx.strokeStyle=`rgba(0,229,255,${.35*(1-d/160)})`;
          ctx.lineWidth=.5;
          ctx.moveTo(nodes[i].x,nodes[i].y);
          ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.stroke();
        }
      }

    nodes.forEach(n=>{
      ctx.beginPath();
      ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle='rgba(0,229,255,.8)';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── FADE IN ON SCROLL ───
const obs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:.12});
document.querySelectorAll('.fade-in').forEach(el=>obs.observe(el));

// ─── ACTIVE NAV ───
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll',()=>{
  let cur='';
  sections.forEach(s=>{ if(window.scrollY>=s.offsetTop-80) cur=s.id; });
  navLinks.forEach(a=>{ a.classList.toggle('active', a.getAttribute('href')==='#'+cur); });
});

// ─── 3D MODEL (Three.js) ───
(function(){
  const canvas = document.getElementById('model-canvas');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth/canvas.clientHeight, .1, 100);
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0,0,0);

  scene.add(new THREE.AmbientLight(0x223344, 2));
  const dLight = new THREE.DirectionalLight(0x00e5ff, 2);
  dLight.position.set(5,5,5); scene.add(dLight);
  const pLight = new THREE.PointLight(0x7b61ff, 1.5, 10);
  pLight.position.set(-3,2,-2); scene.add(pLight);

  let currentMesh = null;
  const descs = {
    router: 'El Router opera en Capa 3 (OSI). Determina la mejor ruta para los paquetes entre redes distintas usando direcciones IP. Puede incluir funciones de firewall, NAT y control de tráfico.',
    switch: 'El Switch opera en Capa 2 (OSI). Envía datos únicamente al dispositivo destino basándose en la dirección MAC. Es el dispositivo estándar en redes locales actuales.',
    hub: 'El Hub opera en Capa 1 (OSI). Replica los datos a todos los puertos sin distinguir destinatario. Genera colisiones y baja eficiencia. Actualmente obsoleto.',
    repeater: 'El Repetidor opera en Capa 1 (OSI). Regenera y retransmite señales debilitadas para extender el alcance de la red, tanto en entornos cableados como inalámbricos.'
  };

  function buildHub() {
    // El Hub en la imagen es un rack de 48 puertos, largo y delgado.
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.4, 1.8), 
      new THREE.MeshPhongMaterial({color: 0x333333, shininess: 100})
    );
    g.add(body);

    // Rejilla de puertos (dos filas de 24)
    const portG = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const portMat = new THREE.MeshPhongMaterial({color: 0x000000});
    for(let row = 0; row < 2; row++) {
      for(let i = 0; i < 24; i++) {
        const p = new THREE.Mesh(portG, portMat);
        p.position.set(-1.8 + (i * 0.15), 0.08 - (row * 0.15), 0.91);
        g.add(p);
      }
    }
    // Logo lateral
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshBasicMaterial({color: 0xaaaaaa}));
    logo.position.set(-1.6, 0, 0.92);
    g.add(logo);
    return g;
  }

  function buildSwitch() {
    // El Switch es un modelo de escritorio de 8 puertos, más compacto y negro mate.
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.5, 1.5), 
      new THREE.MeshPhongMaterial({color: 0x111111})
    );
    g.add(body);

    // Puertos frontales (estilo RJ45)
    for(let i = 0; i < 8; i++) {
      const portFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.15, 0.1), 
        new THREE.MeshPhongMaterial({color: 0x444444})
      );
      portFrame.position.set(-1 + (i * 0.28), -0.05, 0.75);
      g.add(portFrame);
      
      // Detalle de "hueco" del puerto
      const hole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.02), new THREE.MeshBasicMaterial({color: 0x000000}));
      hole.position.set(-1 + (i * 0.28), -0.05, 0.81);
      g.add(hole);
    }
    return g;
  }

  function buildRouter() {
    // Basado en el router Linksys de la imagen (negro, plano, con 2 antenas traseras)
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.35, 1.8), 
      new THREE.MeshPhongMaterial({color: 0x222222})
    );
    g.add(body);

    // 2 Antenas traseras rectangulares (como las del Linksys)
    const antGeo = new THREE.BoxGeometry(0.15, 1.2, 0.08);
    const antMat = new THREE.MeshPhongMaterial({color: 0x111111});
    
    const antL = new THREE.Mesh(antGeo, antMat);
    antL.position.set(-1.2, 0.6, -0.7);
    g.add(antL);

    const antR = new THREE.Mesh(antGeo, antMat);
    antR.position.set(1.2, 0.6, -0.7);
    g.add(antR);

    // Panel frontal (esa línea divisoria)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 0.1), new THREE.MeshBasicMaterial({color: 0x000000}));
    panel.position.set(0, 0, 0.86);
    g.add(panel);
    
    return g;
  }

  function buildRepeater() {
    // Repetidor de pared: cuerpo vertical con 3 antenas finas arriba
    const g = new THREE.Group();
    
    // Cuerpo principal (enchufe)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.5), 
      new THREE.MeshPhongMaterial({color: 0x222222})
    );
    g.add(body);

    // Las 3 antenas finas
    const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
    const antMat = new THREE.MeshPhongMaterial({color: 0x333333});
    
    for(let i = -1; i <= 1; i++) {
      const a = new THREE.Mesh(antGeo, antMat);
      a.position.set(i * 0.15, 0.8, 0);
      g.add(a);
    }

    // Indicador LED circular verde
    const led = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 16), 
      new THREE.MeshBasicMaterial({color: 0x00ff00})
    );
    led.position.set(0, 0, 0.26);
    g.add(led);

    return g;
  }

  const builders = {router:buildRouter, switch:buildSwitch, hub:buildHub, repeater:buildRepeater};

  window.setModel = function(type){
    document.querySelectorAll('.model-btn').forEach(b=>b.classList.remove('active'));
    event.target.classList.add('active');
    if(currentMesh) scene.remove(currentMesh);
    currentMesh = builders[type]();
    scene.add(currentMesh);
    document.getElementById('model-desc').textContent = descs[type];
  };

  setModel = window.setModel;
  // init
  currentMesh = buildRouter(); scene.add(currentMesh);
  document.getElementById('model-desc').textContent = descs.router;

  // Mouse drag
  let drag=false, lastX=0, lastY=0;
  canvas.addEventListener('mousedown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;});
  window.addEventListener('mouseup',()=>drag=false);
  window.addEventListener('mousemove',e=>{
    if(drag && currentMesh){
      currentMesh.rotation.y+=(e.clientX-lastX)*.01;
      currentMesh.rotation.x+=(e.clientY-lastY)*.01;
      lastX=e.clientX; lastY=e.clientY;
    }
  });

  let t=0;
  function animate(){
    requestAnimationFrame(animate);
    t+=.005;
    if(currentMesh){ currentMesh.rotation.y+=.006; }
    renderer.render(scene,camera);
  }
  animate();

  window.addEventListener('resize',()=>{
    const w=canvas.clientWidth, h=canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  });
})();

// ─── TOPOLOGY CANVAS ───
const topoInfo = {
  bus: 'Todos los dispositivos están conectados a un único cable principal. La información viaja en ambas direcciones y todos los equipos la reciben, pero solo el destinatario la procesa. Económica pero ineficiente en redes grandes — si falla el cable principal, cae toda la red.',
  star: 'Todos los dispositivos se conectan a un nodo central (hub o switch). Es la topología más utilizada actualmente: fácil de administrar y ampliar. Si falla un nodo no afecta al resto, pero si falla el dispositivo central la red queda inoperativa.',
  ring: 'Los dispositivos forman un circuito cerrado. Los datos circulan en una dirección y cada nodo actúa como repetidor. Puede ser eficiente, pero una falla en cualquier punto puede afectar toda la red.',
  mesh: 'Cada dispositivo está conectado con varios o todos los demás nodos. Alta redundancia y confiabilidad: si un enlace falla, existen rutas alternativas. Es la topología más robusta pero también la más costosa y compleja de implementar.',
  tree: 'Combinación de topologías en estrella organizadas jerárquicamente. Muy utilizada en redes empresariales: permite segmentar y organizar la red. Depende de los nodos superiores — si falla uno afecta a su subárbol.'
};

function showTopo(type, btn){
  document.querySelectorAll('.topo-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('topo-info').textContent = topoInfo[type];
  drawTopo(type);
}

function drawTopo(type){
  const canvas = document.getElementById('topo-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  const accent = '#00e5ff', accent2='#7b61ff', node_fill='#0e1622';
  const NR = 16; // node radius

  function drawNode(x,y,label,color='#00e5ff'){
    ctx.beginPath(); ctx.arc(x,y,NR,0,Math.PI*2);
    ctx.fillStyle=node_fill; ctx.fill();
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke();
    if(label){
      ctx.fillStyle=color; ctx.font='bold 10px Space Mono, monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label,x,y);
    }
  }
  function drawLine(x1,y1,x2,y2,color='rgba(0,229,255,.4)'){
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  }

  if(type==='bus'){
    const y=H/2, x0=80, x1=W-80;
    ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y);
    ctx.strokeStyle='rgba(0,229,255,.5)'; ctx.lineWidth=3; ctx.stroke();
    // terminator caps
    ctx.beginPath(); ctx.arc(x0,y,6,0,Math.PI*2); ctx.fillStyle='#00e5ff'; ctx.fill();
    ctx.beginPath(); ctx.arc(x1,y,6,0,Math.PI*2); ctx.fillStyle='#00e5ff'; ctx.fill();
    const xs=[130,220,310,400,490,580]; const lbs=['A','B','C','D','E','F'];
    xs.forEach((x,i)=>{ drawLine(x,y,x,y-70); drawNode(x,y-90,lbs[i]); });
  }

  if(type==='star'){
    const cx=W/2, cy=H/2;
    drawNode(cx,cy,'SW','#7b61ff');
    const n=6, r=110;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2 - Math.PI/2;
      const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r;
      drawLine(cx,cy,x,y); drawNode(x,y,String.fromCharCode(65+i));
    }
  }

  if(type==='ring'){
    const cx=W/2, cy=H/2, r=100, n=6;
    const pts=[];
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2 - Math.PI/2;
      pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]);
    }
    for(let i=0;i<n;i++){
      const ni=(i+1)%n; drawLine(pts[i][0],pts[i][1],pts[ni][0],pts[ni][1],'rgba(0,255,148,.5)');
    }
    pts.forEach(([x,y],i)=>drawNode(x,y,String.fromCharCode(65+i),'#00ff94'));
  }

  if(type==='mesh'){
    const pts=[[W/2,50],[W-80,130],[W-80,H-60],[W/2,H-30],[80,H-60],[80,130]];
    for(let i=0;i<pts.length;i++)
      for(let j=i+1;j<pts.length;j++){
        ctx.beginPath(); ctx.setLineDash([4,4]);
        ctx.moveTo(pts[i][0],pts[i][1]); ctx.lineTo(pts[j][0],pts[j][1]);
        ctx.strokeStyle='rgba(123,97,255,.35)'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.setLineDash([]);
      }
    pts.forEach(([x,y],i)=>drawNode(x,y,String.fromCharCode(65+i),'#a78bfa'));
  }

  if(type==='tree'){
    // root
    drawNode(W/2,40,'R','#ffd43b');
    // level 1
    const l1=[[W/4,130],[W*3/4,130]];
    l1.forEach(([x,y])=>{ drawLine(W/2,56,x,y-16,'rgba(255,212,59,.5)'); drawNode(x,y,'S','#ffd43b'); });
    // level 2
    const l2=[[100,220],[W/4,220],[W/2,220],[W*3/4,220],[W-100,220]];
    const parents=[0,0,1,1,1];
    l2.forEach(([x,y],i)=>{ const [px,py]=l1[parents[i]]; drawLine(px,py+16,x,y-16,'rgba(0,229,255,.4)'); drawNode(x,y,String.fromCharCode(65+i)); });
  }
}

// init topology
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('topo-info').textContent = topoInfo.bus;
  drawTopo('bus');
});
setTimeout(()=>{ drawTopo('bus'); document.getElementById('topo-info').textContent=topoInfo.bus; },200);