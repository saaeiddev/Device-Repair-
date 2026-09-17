import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const loader = $('#loader');
const progressBar = $('#progress-bar');
const progressText = $('#progress-text');
const labelsLayer = $('#labels-layer');
const hoverLabel = $('#hover-label');

const ui = {
  roomHud: $('#room-hud'), explorer: $('#explorer-controls'), info: $('#info-panel'), drawer: $('#drawer'),
  deviceTitle: $('#device-title'), assistant: $('#assistant-copy'), lang: $('#lang-btn'), sound: $('#sound-btn')
};

const T = {
  en: {
    brandSub:'3D Hardware Lab', home:'Home', devices:'Devices', explorer:'Hardware Explorer', learn:'Learn', about:'About',
    roomEyebrow:'COZY ELECTRONICS WORKSHOP', roomTitle:'What would you like to explore?', roomCopy:'Choose a device on the repair bench. Click it to inspect realistic internal hardware.',
    assistant:'Choose a device to explore its hardware.', explorerEyebrow:'HARDWARE EXPLORER', explode:'Explode Device', assemble:'Assemble', reset:'Reset View', labelsOn:'Labels: On', labelsOff:'Labels: Off', relations:'How Parts Work Together', cooling:'Cooling Demo',
    gesture:'Drag to rotate • Scroll / pinch to zoom • Click a component to learn', component:'COMPONENT', role:'Role', found:'Found in', works:'Works with', focus:'Focus Component', clear:'Show all components',
    loading:'Building realistic hardware…', devicesTitle:'Choose a device', devicesCopy:'Each device opens as a detailed 3D assembly with physically recognizable parts.',
    learnTitle:'Hardware quick lessons', aboutTitle:'About DEVICE REPAIR', aboutCopy:'DEVICE REPAIR is an interactive bilingual 3D hardware lab with detailed, physically recognizable components rather than placeholder blocks.',
    relationCopy:'Animated relationship lines show how major parts exchange data or power.', coolingCopy:'Cooling demo: heat moves from CPU/GPU through copper heat pipes and heat sinks toward the fans.',
    back:'Back to room', noCooling:'Cooling visualization is available on laptops and desktop PCs.'
  },
  fa: {
    brandSub:'آزمایشگاه سه‌بعدی سخت‌افزار', home:'خانه', devices:'دستگاه‌ها', explorer:'بررسی سخت‌افزار', learn:'آموزش', about:'درباره',
    roomEyebrow:'کارگاه گرم و صمیمی تعمیرات', roomTitle:'دوست داری داخل کدام دستگاه را ببینی؟', roomCopy:'یک دستگاه را روی میز انتخاب کن تا سخت‌افزار داخلی آن را با جزئیات سه‌بعدی بررسی کنیم.',
    assistant:'یک دستگاه را انتخاب کن تا سخت‌افزار داخل آن را بررسی کنیم.', explorerEyebrow:'بررسی سخت‌افزار', explode:'باز کردن اجزای دستگاه', assemble:'مونتاژ مجدد', reset:'بازنشانی نما', labelsOn:'لیبل‌ها: روشن', labelsOff:'لیبل‌ها: خاموش', relations:'اجزا چگونه با هم کار می‌کنند', cooling:'نمایش سیستم خنک‌کننده',
    gesture:'برای چرخش بکش • برای زوم اسکرول/پینچ کن • روی قطعه کلیک کن', component:'قطعه', role:'وظیفه', found:'در چه دستگاه‌هایی', works:'همکاری با', focus:'تمرکز روی قطعه', clear:'نمایش همه قطعات',
    loading:'در حال ساخت سخت‌افزار واقع‌گرایانه…', devicesTitle:'یک دستگاه انتخاب کن', devicesCopy:'هر دستگاه با قطعات سه‌بعدی قابل‌تشخیص و جزئیات فیزیکی باز می‌شود.',
    learnTitle:'آموزش سریع سخت‌افزار', aboutTitle:'درباره DEVICE REPAIR', aboutCopy:'DEVICE REPAIR یک آزمایشگاه سه‌بعدی و دو‌زبانه سخت‌افزار است که به‌جای مکعب‌های ساده، قطعات با فرم فیزیکی قابل‌تشخیص نمایش می‌دهد.',
    relationCopy:'خطوط متحرک آموزشی نشان می‌دهند قطعات اصلی چگونه داده یا توان را با هم مبادله می‌کنند.', coolingCopy:'نمایش خنک‌کاری: گرما از CPU/GPU وارد هیت‌پایپ‌های مسی می‌شود و از طریق هیت‌سینک و فن‌ها دفع می‌شود.',
    back:'بازگشت به کارگاه', noCooling:'نمایش خنک‌کاری برای لپ‌تاپ و کامپیوتر رومیزی فعال است.'
  }
};

const names = {
  smartphone:{en:'Smartphone',fa:'گوشی هوشمند'}, tablet:{en:'Tablet',fa:'تبلت'}, laptop:{en:'Laptop',fa:'لپ‌تاپ'}, desktop:{en:'Desktop PC',fa:'کامپیوتر رومیزی'}
};

const componentData = {
  cpu:{en:'CPU / Processor',fa:'پردازنده مرکزی (CPU)',roleEn:'Executes instructions and performs the primary calculations required by the operating system and applications.',roleFa:'دستورها را اجرا می‌کند و بخش بزرگی از محاسبات اصلی سیستم‌عامل و برنامه‌ها را انجام می‌دهد.',foundEn:'Phones, tablets, laptops, desktop PCs',foundFa:'موبایل، تبلت، لپ‌تاپ و کامپیوتر رومیزی',worksEn:'RAM, storage, GPU, motherboard',worksFa:'RAM، حافظه، GPU و مادربرد'},
  gpu:{en:'GPU / Graphics',fa:'پردازنده گرافیکی (GPU)',roleEn:'Processes graphics and parallel workloads. In phones and tablets it is integrated into the SoC; in PCs it can be a large discrete graphics card.',roleFa:'گرافیک و پردازش‌های موازی را انجام می‌دهد. در موبایل و تبلت معمولاً داخل SoC است و در PC می‌تواند یک کارت گرافیک مجزا و بزرگ باشد.',foundEn:'Phones, tablets, laptops, desktop PCs',foundFa:'موبایل، تبلت، لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, RAM/VRAM, display',worksFa:'CPU، RAM/VRAM و نمایشگر'},
  ram:{en:'RAM',fa:'حافظه RAM',roleEn:'Fast working memory that temporarily holds data and instructions needed by the processor.',roleFa:'حافظه کاری سریع که داده‌ها و دستورهای موردنیاز پردازنده را موقتاً نگه می‌دارد.',foundEn:'All modern devices',foundFa:'همه دستگاه‌های مدرن',worksEn:'CPU, GPU, storage',worksFa:'CPU، GPU و حافظه ذخیره‌سازی'},
  motherboard:{en:'Motherboard / Logic Board',fa:'مادربرد / برد اصلی',roleEn:'The main PCB carrying sockets, traces, VRMs, controllers, ports and connectors that tie the entire device together.',roleFa:'برد مدار چاپی اصلی شامل سوکت‌ها، مسیرهای مسی، VRM، کنترلرها، پورت‌ها و کانکتورهاست که کل دستگاه را به هم متصل می‌کند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'Almost every internal component',worksFa:'تقریباً تمام قطعات داخلی'},
  storage:{en:'Storage / SSD',fa:'حافظه ذخیره‌سازی / SSD',roleEn:'Stores the operating system, apps and user files. Modern laptops and desktops commonly use compact M.2 NVMe SSDs.',roleFa:'سیستم‌عامل، برنامه‌ها و فایل‌ها را ذخیره می‌کند. لپ‌تاپ‌ها و PCهای جدید معمولاً از SSDهای M.2 NVMe استفاده می‌کنند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'CPU, RAM, motherboard',worksFa:'CPU، RAM و مادربرد'},
  battery:{en:'Battery',fa:'باتری',roleEn:'Stores electrical energy and supplies regulated power through battery-management and power-delivery circuitry.',roleFa:'انرژی الکتریکی را ذخیره می‌کند و از طریق مدار مدیریت باتری و توان، برق قطعات را تأمین می‌کند.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'Power circuitry, motherboard, charging port',worksFa:'مدار توان، مادربرد و درگاه شارژ'},
  display:{en:'Display Assembly',fa:'مجموعه نمایشگر',roleEn:'A layered assembly containing cover glass, touch digitizer and LCD/OLED panel.',roleFa:'مجموعه‌ای چندلایه شامل شیشه محافظ، دیجیتایزر لمس و پنل LCD/OLED است.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'GPU, display controller, touch controller',worksFa:'GPU، کنترلر نمایشگر و کنترلر لمس'},
  camera:{en:'Camera Module',fa:'ماژول دوربین',roleEn:'Contains lens elements, autofocus hardware, image sensor and a small flex/PCB assembly.',roleFa:'شامل مجموعه لنز، مکانیزم فوکوس، حسگر تصویر و برد/فلت کوچک است.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'SoC/CPU, image processor, storage',worksFa:'SoC/CPU، پردازنده تصویر و حافظه'},
  cooling:{en:'Cooling System',fa:'سیستم خنک‌کننده',roleEn:'Moves heat away from high-power chips using cold plates, heat pipes, fin stacks and fans.',roleFa:'گرما را با صفحه تماس، هیت‌پایپ، پره‌های هیت‌سینک و فن از تراشه‌ها دور می‌کند.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, GPU, chassis airflow',worksFa:'CPU، GPU و جریان هوای بدنه'},
  fan:{en:'Cooling Fan',fa:'فن خنک‌کننده',roleEn:'A bladed impeller that forces air through heat-sink fins and chassis vents.',roleFa:'پروانه‌ای چندپره که هوا را از میان پره‌های هیت‌سینک و دریچه‌های بدنه عبور می‌دهد.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'Heat sink, CPU/GPU, vents',worksFa:'هیت‌سینک، CPU/GPU و دریچه‌ها'},
  heatsink:{en:'Heat Sink / Heat Pipe',fa:'هیت‌سینک / هیت‌پایپ',roleEn:'Copper pipes transport heat into a dense stack of metal fins, increasing surface area for cooling.',roleFa:'لوله‌های مسی گرما را به مجموعه متراکم پره‌های فلزی منتقل می‌کنند تا سطح دفع گرما افزایش یابد.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, GPU, fan',worksFa:'CPU، GPU و فن'},
  psu:{en:'Power Supply (PSU)',fa:'منبع تغذیه (PSU)',roleEn:'Converts AC wall power into regulated DC voltages for desktop components.',roleFa:'برق AC شهری را به ولتاژهای DC تنظیم‌شده برای قطعات کامپیوتر تبدیل می‌کند.',foundEn:'Desktop PCs',foundFa:'کامپیوتر رومیزی',worksEn:'Motherboard, GPU, storage, fans',worksFa:'مادربرد، GPU، حافظه و فن‌ها'},
  speaker:{en:'Speaker',fa:'بلندگو',roleEn:'A compact enclosure with a miniature driver that converts electrical audio signals into sound.',roleFa:'محفظه‌ای کوچک با درایور مینیاتوری که سیگنال الکتریکی صدا را به صوت تبدیل می‌کند.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'Audio codec, motherboard',worksFa:'کدک صوتی و مادربرد'},
  wifi:{en:'Wi‑Fi / Bluetooth Module',fa:'ماژول Wi‑Fi / Bluetooth',roleEn:'A small radio module with shielded chips and antenna connectors for wireless networking.',roleFa:'ماژول رادیویی کوچک با تراشه‌های شیلدشده و کانکتور آنتن برای ارتباط بی‌سیم است.',foundEn:'All modern devices',foundFa:'همه دستگاه‌های مدرن',worksEn:'CPU, antennas, motherboard',worksFa:'CPU، آنتن‌ها و مادربرد'},
  port:{en:'I/O / Charging Port',fa:'درگاه ورودی/خروجی و شارژ',roleEn:'Provides a mechanically reinforced electrical connection for charging, data or peripherals.',roleFa:'اتصال الکتریکی مقاوم برای شارژ، انتقال داده یا اتصال لوازم جانبی ایجاد می‌کند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'Motherboard, power controller',worksFa:'مادربرد و کنترلر توان'}
};

let lang = 'en';
let soundOn = true;
let scene, camera, renderer, controls, roomGroup, inspectionGroup, currentDevice = null;
let clickableRoots = [];
let clickableMeshes = [];
let hoveredRoot = null;
let selectedRoot = null;
let labelNodes = new Map();
let labelVisible = true;
let explodedTarget = 0;
let exploded = 0;
let relationMode = false;
let relationLines = [];
let coolingMode = false;
let heatParticles = [];
let clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const MAT = {
  pcbGreen: () => new THREE.MeshStandardMaterial({color:0x174a35, roughness:.58, metalness:.08}),
  pcbBlack: () => new THREE.MeshStandardMaterial({color:0x101512, roughness:.48, metalness:.16}),
  pcbBlue: () => new THREE.MeshStandardMaterial({color:0x164c76, roughness:.48, metalness:.12}),
  chip: () => new THREE.MeshStandardMaterial({color:0x101214, roughness:.28, metalness:.22}),
  metal: () => new THREE.MeshStandardMaterial({color:0xaeb4ba, roughness:.26, metalness:.84}),
  darkMetal: () => new THREE.MeshStandardMaterial({color:0x2a2c2f, roughness:.32, metalness:.72}),
  aluminum: () => new THREE.MeshStandardMaterial({color:0xb9bec2, roughness:.25, metalness:.88}),
  copper: () => new THREE.MeshStandardMaterial({color:0xb96935, roughness:.22, metalness:.92}),
  gold: () => new THREE.MeshStandardMaterial({color:0xd9ae46, roughness:.28, metalness:.9}),
  black: () => new THREE.MeshStandardMaterial({color:0x111316, roughness:.38, metalness:.28}),
  battery: () => new THREE.MeshStandardMaterial({color:0x3a3d42, roughness:.48, metalness:.44}),
  glass: () => new THREE.MeshPhysicalMaterial({color:0x16202a, roughness:.08, metalness:.05, transmission:.14, transparent:true, opacity:.58, clearcoat:1, clearcoatRoughness:.08}),
  screen: () => new THREE.MeshPhysicalMaterial({color:0x06111c, emissive:0x0d2945, emissiveIntensity:.7, roughness:.1, metalness:.05, clearcoat:1}),
  blue: () => new THREE.MeshStandardMaterial({color:0x4ea9dc, roughness:.42, metalness:.32}),
  wood: () => new THREE.MeshStandardMaterial({color:0x6e4024, roughness:.62, metalness:.03}),
  warmWood: () => new THREE.MeshStandardMaterial({color:0x8f5630, roughness:.58, metalness:.03})
};

function rbox(w,h,d,r,mat,pos=[0,0,0]){
  const geo = new RoundedBoxGeometry(w,h,d,4,Math.min(r,Math.min(w,h,d)*.35));
  const m = new THREE.Mesh(geo,mat); m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; return m;
}
function box(w,h,d,mat,pos=[0,0,0]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;return m;}
function cyl(r,h,mat,pos=[0,0,0],rot=[0,0,0],segments=36){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;return m;}
function tube(points,radius,mat,segments=40){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const geo=new THREE.TubeGeometry(curve,segments,radius,10,false);const m=new THREE.Mesh(geo,mat);m.castShadow=true;return m;}
function partCenter(root){const b=new THREE.Box3().setFromObject(root);const c=new THREE.Vector3();b.getCenter(c);return c;}
function setShadows(root){root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;}
function registerPart(parent,key,obj,explode=[0,0,0],interactive=true){
  obj.userData.partKey=key;obj.userData.base=obj.position.clone();obj.userData.explode=new THREE.Vector3(...explode);
  obj.traverse(o=>{if(o.isMesh){o.userData.partRoot=obj;o.userData.partKey=key;clickableMeshes.push(o);}});
  parent.add(obj);if(interactive)clickableRoots.push(obj);return obj;
}
function addScrews(parent,positions,r=.035,h=.02){for(const p of positions){parent.add(cyl(r,h,MAT.darkMetal(),p,[Math.PI/2,0,0],20));}}
function addPCBTraces(parent,w,d,y=.045,count=9){
  const mat=MAT.gold();
  for(let i=0;i<count;i++){
    const z=-d*.36+(i/(count-1))*d*.72;
    const len=w*(.25+.55*((i*37)%10)/10);
    const x=(i%2?-1:1)*w*.08;
    parent.add(box(len,.006,.012,mat,[x,y,z]));
  }
  for(let i=0;i<Math.max(4,Math.floor(count*.6));i++){
    const x=-w*.35+(i/(Math.max(3,Math.floor(count*.6))-1))*w*.7;
    const len=d*(.18+.35*((i*13)%7)/7);
    parent.add(box(.012,.006,len,mat,[x,y,-d*.08]));
  }
}
function makePCB(w,d,color='green',th=.055){
  const g=new THREE.Group();
  const mat=color==='black'?MAT.pcbBlack():color==='blue'?MAT.pcbBlue():MAT.pcbGreen();
  g.add(rbox(w,th,d,.05,mat,[0,0,0]));
  addPCBTraces(g,w,d,th*.56,Math.max(7,Math.floor(w*2.2)));
  const viaMat=MAT.gold();
  for(let ix=-2;ix<=2;ix++)for(let iz=-2;iz<=2;iz++)if((ix+iz)%2===0)g.add(cyl(.018,.009,viaMat,[ix*w*.16,th*.6,iz*d*.15],[0,0,0],14));
  addScrews(g,[[-w*.42,th*.65,-d*.42],[w*.42,th*.65,-d*.42],[-w*.42,th*.65,d*.42],[w*.42,th*.65,d*.42]],.027,.012);
  return g;
}
function makeIC(w=.36,d=.36,h=.055){
  const g=new THREE.Group();
  g.add(rbox(w,h,d,.025,MAT.chip(),[0,0,0]));
  const pinMat=MAT.metal();
  for(let i=0;i<6;i++){
    const t=-d*.4+(i/5)*d*.8;
    g.add(box(.035,.014,.018,pinMat,[-w*.54,-h*.15,t]));g.add(box(.035,.014,.018,pinMat,[w*.54,-h*.15,t]));
  }
  return g;
}
function makeCPU(scale=1,mobile=false){
  const g=new THREE.Group();
  if(mobile){
    g.add(rbox(.62*scale,.055*scale,.62*scale,.035,MAT.chip(),[0,.03,0]));
    g.add(rbox(.47*scale,.015*scale,.47*scale,.02,new THREE.MeshStandardMaterial({color:0x2b3035,roughness:.18,metalness:.5}),[0,.066*scale,0]));
    for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)g.add(cyl(.012*scale,.006*scale,MAT.gold(),[x*.09*scale,-.004,z*.09*scale]));
  }else{
    g.add(rbox(.92*scale,.07*scale,.92*scale,.04,new THREE.MeshStandardMaterial({color:0x2e704f,roughness:.5,metalness:.12}),[0,0,0]));
    g.add(rbox(.72*scale,.075*scale,.72*scale,.045,MAT.metal(),[0,.075*scale,0]));
    for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if((x+z)%2===0)g.add(cyl(.011*scale,.007*scale,MAT.gold(),[x*.095*scale,-.043*scale,z*.095*scale]));
  }
  return setShadows(g);
}
function makeRAMModule(length=1.45,height=.43,th=.055,chips=8){
  const g=new THREE.Group();
  g.add(rbox(length,height,th,.025,MAT.pcbGreen(),[0,0,0]));
  const chipW=length/(chips+1)*.62;
  for(let i=0;i<chips;i++){
    const x=-length*.4+i*(length*.8/(chips-1));
    g.add(rbox(chipW,height*.42,.035,.015,MAT.chip(),[x,.03,th*.62]));
  }
  for(let i=0;i<22;i++){
    const x=-length*.44+i*(length*.88/21);
    if(Math.abs(x)<.055)continue;
    g.add(box(.024,.09,.012,MAT.gold(),[x,-height*.43,th*.58]));
  }
  return setShadows(g);
}
function makeM2SSD(length=1.15,width=.34){
  const g=new THREE.Group();
  g.add(rbox(length,.045,width,.02,MAT.pcbBlue(),[0,0,0]));addPCBTraces(g,length,width,.028,7);
  const xvals=[-.35,-.08,.2,.42];
  xvals.forEach((x,i)=>{const ic=makeIC(i===0?.22:.24,width*.56,.05);ic.position.set(x,.055,0);g.add(ic);});
  for(let i=0;i<12;i++)g.add(box(.018,.012,.08,MAT.gold(),[-length*.48+i*.022,-.028,-width*.22]));
  g.add(cyl(.045,.052,MAT.darkMetal(),[length*.45,.01,0]));
  return setShadows(g);
}
function makeFan(radius=.48,depth=.10,blades=9){
  const g=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.84,radius*.095,10,44),MAT.darkMetal());ring.rotation.x=Math.PI/2;g.add(ring);
  g.add(cyl(radius*.17,depth*1.3,MAT.darkMetal(),[0,0,0],[Math.PI/2,0,0],32));
  const bladeMat=new THREE.MeshStandardMaterial({color:0x25292c,roughness:.42,metalness:.36});
  for(let i=0;i<blades;i++){
    const a=i*Math.PI*2/blades;
    const shape=new THREE.Shape();shape.moveTo(-.035,-.04);shape.quadraticCurveTo(radius*.44,-.03,radius*.62,.12);shape.quadraticCurveTo(radius*.35,.2,.035,.07);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:depth*.32,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1});
    const blade=new THREE.Mesh(geo,bladeMat);blade.rotation.x=Math.PI/2;blade.rotation.z=a;blade.position.z=-depth*.16;g.add(blade);
  }
  return setShadows(g);
}
function makeHeatsink(width=1.1,length=.8,height=.34,fins=18){
  const g=new THREE.Group();g.add(rbox(width,.08,length,.025,MAT.aluminum(),[0,-height*.45,0]));
  for(let i=0;i<fins;i++){const x=-width*.45+i*(width*.9/(fins-1));g.add(box(.018,height,length*.92,MAT.aluminum(),[x,0,0]));}
  return setShadows(g);
}
function makeCameraArray(count=3,small=false){
  const g=new THREE.Group();const lensMat=new THREE.MeshPhysicalMaterial({color:0x07101a,roughness:.04,metalness:.18,clearcoat:1});
  for(let i=0;i<count;i++){
    const m=new THREE.Group();m.add(rbox(small?.22:.32,.12,small?.22:.32,.035,MAT.darkMetal(),[0,0,0]));
    m.add(cyl(small?.075:.11,.10,lensMat,[0,.085,0],[0,0,0],36));m.add(cyl(small?.045:.065,.102,new THREE.MeshStandardMaterial({color:0x30577a,roughness:.08,metalness:.2}),[0,.095,0],[0,0,0],36));
    m.position.set((i-(count-1)/2)*(small?.26:.39),0,0);g.add(m);
  }
  return setShadows(g);
}
function makeBatteryPack(w=1.8,d=2.2,cells=1){
  const g=new THREE.Group();const cellW=w/cells*.92;
  for(let i=0;i<cells;i++){
    const c=rbox(cellW,.16,d,.08,MAT.battery(),[-w*.5+cellW*.55+i*(w/cells),0,0]);g.add(c);
    g.add(box(cellW*.72,.005,.22,new THREE.MeshStandardMaterial({color:0x797e84,roughness:.5,metalness:.45}),[c.position.x,.084,0]));
  }
  g.add(box(.26,.025,.44,new THREE.MeshStandardMaterial({color:0xc47a2b,roughness:.45,metalness:.35}),[w*.35,.11,-d*.36]));
  return setShadows(g);
}
function makeSpeaker(w=.75,d=.22){
  const g=new THREE.Group();g.add(rbox(w,.12,d,.055,MAT.black(),[0,0,0]));for(let i=0;i<9;i++)g.add(cyl(.018,.125,MAT.darkMetal(),[-w*.36+i*w*.09,.07,0],[Math.PI/2,0,0],12));return setShadows(g);
}
function makeWifiModule(){
  const g=makePCB(.52,.38,'green',.045);g.add(rbox(.25,.055,.2,.015,MAT.metal(),[0,.055,0]));
  for(const x of [-.18,.18]){const jack=new THREE.Mesh(new THREE.TorusGeometry(.032,.009,8,20),MAT.gold());jack.rotation.x=Math.PI/2;jack.position.set(x,.064,.11);g.add(jack);}return setShadows(g);
}
function makePort(kind='usb',scale=1){
  const g=new THREE.Group();g.add(rbox(.44*scale,.16*scale,.26*scale,.025,MAT.metal(),[0,0,0]));
  g.add(rbox(.30*scale,.075*scale,.275*scale,.018,MAT.black(),[0,.01,.03*scale]));
  g.add(box(.2*scale,.025*scale,.16*scale,new THREE.MeshStandardMaterial({color:kind==='usb-c'?0x20252b:0x1b5d8e,roughness:.45}),[0,-.01,.06*scale]));return setShadows(g);
}
function makeVRMCluster(){
  const g=new THREE.Group();
  for(let i=0;i<5;i++)g.add(rbox(.18,.12,.18,.025,new THREE.MeshStandardMaterial({color:0x45484b,roughness:.38,metalness:.56}),[-.42+i*.21,0,0]));
  for(let i=0;i<8;i++)g.add(cyl(.035,.13,new THREE.MeshStandardMaterial({color:0x29303a,roughness:.34,metalness:.6}),[-.52+i*.15,.04,.22],[0,0,0],20));return setShadows(g);
}
function makeMotherboardLaptop(){
  const g=makePCB(3.65,1.45,'green',.065);const vrm=makeVRMCluster();vrm.position.set(-.55,.12,-.35);g.add(vrm);
  for(const z of [.22,.48])g.add(rbox(1.2,.08,.08,.012,MAT.black(),[.45,.10,z]));
  for(let i=0;i<6;i++){const ic=makeIC(.18,.16,.045);ic.position.set(-1.3+i*.45,.10,.5);g.add(ic);}return setShadows(g);
}
function makeMotherboardDesktop(){
  const g=makePCB(3.3,3.65,'black',.075);g.add(rbox(.9,.08,.9,.04,MAT.darkMetal(),[-.65,.10,-.65]));
  const vrm=makeVRMCluster();vrm.position.set(-.6,.14,-1.45);g.add(vrm);
  for(let i=0;i<4;i++)g.add(rbox(.08,.11,1.4,.014,MAT.black(),[.55+i*.18,.11,-.55]));
  for(let i=0;i<3;i++)g.add(rbox(1.9,.11,.09,.014,MAT.black(),[.35,.11,.45+i*.28]));
  for(let i=0;i<8;i++)g.add(cyl(.04,.15,new THREE.MeshStandardMaterial({color:0x2e3540,roughness:.32,metalness:.66}),[-1.35+i*.34,.10,1.42],[0,0,0],20));return setShadows(g);
}
function makeDiscreteGPU(){
  const g=new THREE.Group();const pcb=makePCB(2.5,.75,'black',.07);pcb.rotation.x=Math.PI/2;g.add(pcb);
  const hs=makeHeatsink(2.25,.62,.25,24);hs.rotation.x=Math.PI/2;hs.position.set(0,0,.16);g.add(hs);
  g.add(rbox(2.65,.58,.78,.08,new THREE.MeshStandardMaterial({color:0x202326,roughness:.31,metalness:.58}),[0,0,.35]));
  for(const x of [-.68,.68]){const fan=makeFan(.32,.08,9);fan.rotation.x=Math.PI/2;fan.position.set(x,.32,.66);g.add(fan);}
  g.add(box(.12,.86,.82,MAT.metal(),[-1.33,0,.18]));for(let i=0;i<26;i++)g.add(box(.025,.012,.12,MAT.gold(),[-1.0+i*.075,-.33,-.08]));return setShadows(g);
}
function makePSU(){
  const g=new THREE.Group();g.add(rbox(1.75,1.28,1.48,.08,new THREE.MeshStandardMaterial({color:0x25282b,roughness:.34,metalness:.76}),[0,0,0]));
  const fan=makeFan(.46,.09,9);fan.rotation.x=Math.PI/2;fan.position.set(0,.65,0);g.add(fan);
  const grille=new THREE.Mesh(new THREE.TorusGeometry(.52,.018,8,48),MAT.metal());grille.rotation.x=Math.PI/2;grille.position.y=.7;g.add(grille);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)g.add(rbox(.14,.05,.12,.015,MAT.black(),[-.46+i*.3,-.05,.75+j*.02]));return setShadows(g);
}
function makeDisplayAssembly(w,h,th=.12){
  const g=new THREE.Group();g.add(rbox(w,th,h,.10,MAT.darkMetal(),[0,0,0]));g.add(rbox(w*.965,th*.18,h*.965,.07,MAT.screen(),[0,th*.53,0]));
  g.add(rbox(w*.91,.004,h*.91,.06,new THREE.MeshBasicMaterial({color:0x16334b,transparent:true,opacity:.16}),[0,th*.64,0]));return setShadows(g);
}
function makePhoneLogicBoard(w=1.5,d=1.25){
  const g=makePCB(w,d,'green',.055);for(let i=0;i<5;i++){const ic=makeIC(.20,.18,.045);ic.position.set(-w*.32+i*w*.16,.075,d*.18);g.add(ic);}g.add(rbox(.58,.055,.48,.03,MAT.metal(),[-.35,.08,-.2]));return setShadows(g);
}
function makeLaptopCooling(){
  const g=new THREE.Group();const fanL=makeFan(.43,.095,9);fanL.position.set(-1.42,.08,-.55);g.add(fanL);const fanR=makeFan(.43,.095,9);fanR.position.set(1.42,.08,-.55);g.add(fanR);
  g.add(tube([[-.55,.14,-.25],[-.75,.16,-.48],[-1.18,.15,-.62]],.045,MAT.copper(),36));g.add(tube([[.42,.14,-.25],[.68,.16,-.48],[1.18,.15,-.62]],.045,MAT.copper(),36));g.add(tube([[-.5,.16,-.18],[0,.18,-.2],[.5,.16,-.18]],.038,MAT.copper(),28));
  const h1=makeHeatsink(.66,.35,.22,16);h1.position.set(-1.42,.12,-1.02);g.add(h1);const h2=makeHeatsink(.66,.35,.22,16);h2.position.set(1.42,.12,-1.02);g.add(h2);return setShadows(g);
}

function init(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x120d0a);scene.fog=new THREE.FogExp2(0x120d0a,.028);
  camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.08,120);camera.position.set(8,6.5,11);
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=4;controls.maxDistance=18;controls.target.set(0,1,0);controls.maxPolarAngle=Math.PI*.48;
  addLights();buildRoom();bindUI();updateLanguage();setProgress(35);setTimeout(()=>setProgress(78),180);setTimeout(()=>{setProgress(100);loader?.classList.add('done');setTimeout(()=>loader?.remove(),700)},520);animate();
}
function addLights(){
  scene.add(new THREE.HemisphereLight(0xffe3c4,0x151923,1.45));
  const key=new THREE.SpotLight(0xffba78,75,28,Math.PI*.32,.45,1.2);key.position.set(-4,8,4);key.target.position.set(0,0,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key,key.target);
  const fill=new THREE.PointLight(0x6ebdff,14,16,2);fill.position.set(4,4,-3);scene.add(fill);const warm=new THREE.PointLight(0xff8c4a,16,11,2);warm.position.set(-5,3,0);scene.add(warm);
}
function setProgress(n){if(progressBar)progressBar.style.width=n+'%';if(progressText)progressText.textContent=n+'%';}
function buildRoom(){
  roomGroup=new THREE.Group();scene.add(roomGroup);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,22),new THREE.MeshStandardMaterial({color:0x2b211a,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;roomGroup.add(floor);
  roomGroup.add(box(18,8,.25,new THREE.MeshStandardMaterial({color:0x33271f,roughness:.84}),[0,4,-5.8]));roomGroup.add(box(.25,8,12,new THREE.MeshStandardMaterial({color:0x2d241e,roughness:.86}),[-9,4,0]));
  roomGroup.add(box(10,.4,3.9,MAT.warmWood(),[0,1.4,0]));for(const x of [-4.4,4.4])roomGroup.add(box(.38,2.8,.38,MAT.darkMetal(),[x,0,0]));
  roomGroup.add(box(6.4,.18,.65,MAT.wood(),[2,4.1,-5.45]));roomGroup.add(box(6.4,.18,.65,MAT.wood(),[-2,5.55,-5.45]));
  for(let i=0;i<7;i++)roomGroup.add(rbox(.45,.75,.45,.05,new THREE.MeshStandardMaterial({color:0x6b5547+(i*0x050505),roughness:.7}),[-4.6+i*1.45,4.55+(i%2)*1.45,-5.05]));
  roomGroup.add(cyl(.4,.12,MAT.darkMetal(),[-3.8,1.72,-1.1]));roomGroup.add(cyl(.07,1.35,MAT.darkMetal(),[-3.8,2.35,-1.1]));const lampShade=new THREE.Mesh(new THREE.ConeGeometry(.48,.55,30,1,true),MAT.darkMetal());lampShade.position.set(-3.8,3.05,-1.1);lampShade.rotation.x=Math.PI;roomGroup.add(lampShade);const bulb=new THREE.PointLight(0xffbd77,13,7,2);bulb.position.set(-3.8,2.85,-1.1);roomGroup.add(bulb);
  roomGroup.add(rbox(7.3,.045,2.7,.12,new THREE.MeshStandardMaterial({color:0x22313a,roughness:.75}),[.3,1.63,.05]));
  for(let i=0;i<6;i++)roomGroup.add(cyl(.06,.58,new THREE.MeshStandardMaterial({color:i%2?0x3479a7:0xd96a38,roughness:.46}),[-2.8+i*.24,1.89,1.15],[Math.PI/2,0,0],20));
  roomGroup.add(rbox(1.0,.52,.8,.08,new THREE.MeshStandardMaterial({color:0x202326,roughness:.4,metalness:.35}),[3.85,1.95,-1.1]));roomGroup.add(rbox(.52,.28,.015,.025,MAT.screen(),[3.85,2.03,-.69]));roomGroup.add(rbox(.65,.18,1.05,.09,new THREE.MeshStandardMaterial({color:0xe6ad32,roughness:.5}),[4.0,1.78,.95]));roomGroup.add(rbox(.38,.02,.27,.03,MAT.screen(),[4.0,1.89,.72]));addRoomDevices();
}
function addRoomDevices(){
  const phone=new THREE.Group();phone.add(rbox(1.08,.10,2.0,.14,MAT.darkMetal(),[0,0,0]));phone.add(rbox(.98,.02,1.86,.12,MAT.screen(),[0,.06,0]));phone.rotation.x=-.08;phone.position.set(-2.1,1.83,.15);tagRoomDevice(phone,'smartphone');roomGroup.add(phone);
  const tablet=new THREE.Group();tablet.add(rbox(1.65,.10,2.25,.16,MAT.aluminum(),[0,0,0]));tablet.add(rbox(1.53,.02,2.10,.13,MAT.screen(),[0,.06,0]));tablet.rotation.y=-.15;tablet.position.set(-.5,1.83,.1);tagRoomDevice(tablet,'tablet');roomGroup.add(tablet);
  const laptop=new THREE.Group();laptop.add(rbox(2.65,.12,1.65,.10,MAT.aluminum(),[0,0,0]));const lid=makeDisplayAssembly(2.65,1.62,.10);lid.rotation.x=-1.08;lid.position.set(0,.78,-.72);laptop.add(lid);laptop.position.set(1.65,1.82,.05);laptop.rotation.y=.10;tagRoomDevice(laptop,'laptop');roomGroup.add(laptop);
  const pc=new THREE.Group();pc.add(rbox(1.28,2.45,1.45,.10,MAT.darkMetal(),[0,0,0]));const glass=rbox(1.12,2.18,.025,.04,MAT.glass(),[.66,0,0]);glass.rotation.y=Math.PI/2;pc.add(glass);const fan=makeFan(.38,.08,9);fan.position.set(0,.55,.74);pc.add(fan);pc.position.set(3.95,2.82,-.15);pc.scale.setScalar(.85);tagRoomDevice(pc,'desktop');roomGroup.add(pc);
}
function tagRoomDevice(root,type){root.userData.deviceType=type;root.traverse(o=>{if(o.isMesh)o.userData.deviceRoot=root;});}
function openDevice(type){
  closeDrawer();currentDevice=type;selectedRoot=null;relationMode=false;coolingMode=false;clearRelations();clearHeat();ui.roomHud.classList.add('hidden');ui.explorer.classList.remove('hidden');ui.info.classList.add('hidden');roomGroup.visible=false;controls.maxPolarAngle=Math.PI*.88;controls.minDistance=3.2;controls.maxDistance=12;camera.position.set(type==='desktop'?7.2:6.7,type==='desktop'?4.4:5.0,type==='desktop'?8.2:7.9);controls.target.set(0,.5,0);buildInspection(type);ui.deviceTitle.textContent=names[type][lang];$('#cooling-btn').classList.toggle('hidden',!(type==='laptop'||type==='desktop'));ui.assistant.textContent=T[lang].gesture;
}
function backToRoom(){
  if(inspectionGroup){scene.remove(inspectionGroup);inspectionGroup=null;}clearRelations();clearHeat();labelsLayer.innerHTML='';labelNodes.clear();clickableRoots=[];clickableMeshes=[];currentDevice=null;selectedRoot=null;roomGroup.visible=true;ui.roomHud.classList.remove('hidden');ui.explorer.classList.add('hidden');ui.info.classList.add('hidden');controls.minDistance=4;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.48;camera.position.set(8,6.5,11);controls.target.set(0,1,0);exploded=explodedTarget=0;
}
function buildInspection(type){
  if(inspectionGroup)scene.remove(inspectionGroup);clickableRoots=[];clickableMeshes=[];inspectionGroup=new THREE.Group();scene.add(inspectionGroup);inspectionGroup.add(rbox(7.8,.25,5.7,.18,new THREE.MeshStandardMaterial({color:0x1f2428,roughness:.35,metalness:.68}),[0,-1.25,0]));const glow=new THREE.Mesh(new THREE.RingGeometry(2.7,3.2,64),new THREE.MeshBasicMaterial({color:0x5eadd8,transparent:true,opacity:.10,side:THREE.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=-1.11;inspectionGroup.add(glow);
  if(type==='smartphone')buildSmartphone();if(type==='tablet')buildTablet();if(type==='laptop')buildLaptop();if(type==='desktop')buildDesktop();inspectionGroup.scale.setScalar(type==='desktop'?.90:type==='laptop'?1.05:1.15);createLabels();
}
function buildSmartphone(){
  const g=inspectionGroup;const chassis=new THREE.Group();chassis.add(rbox(2.32,.18,4.42,.22,MAT.darkMetal(),[0,0,0]));chassis.add(rbox(2.08,.12,4.18,.18,new THREE.MeshStandardMaterial({color:0x24272b,roughness:.55,metalness:.48}),[0,.10,0]));registerPart(g,'motherboard',chassis,[0,-.12,0],false);
  const display=makeDisplayAssembly(2.22,4.30,.095);display.position.set(0,.39,0);registerPart(g,'display',display,[0,1.35,0]);const board=makePhoneLogicBoard(1.55,1.45);board.position.set(0,.18,-1.25);registerPart(g,'motherboard',board,[-1.55,.35,-.9]);const cpu=makeCPU(.72,true);cpu.position.set(-.28,.29,-1.36);registerPart(g,'cpu',cpu,[-2.2,.55,-1.1]);const ram=makeIC(.34,.30,.06);ram.position.set(.25,.29,-1.34);registerPart(g,'ram',ram,[1.9,.55,-1.1]);const storage=makeIC(.30,.42,.055);storage.position.set(.60,.29,-.92);registerPart(g,'storage',storage,[2.15,.35,-.25]);const battery=makeBatteryPack(1.72,2.15,1);battery.position.set(0,.17,.58);registerPart(g,'battery',battery,[0,-.82,.72]);const cam=makeCameraArray(3,false);cam.rotation.z=Math.PI/2;cam.position.set(-.62,.28,-1.80);registerPart(g,'camera',cam,[-1.9,.75,-1.45]);const speaker=makeSpeaker(1.0,.24);speaker.position.set(0,.19,1.75);registerPart(g,'speaker',speaker,[0,.4,1.3]);const wifi=makeWifiModule();wifi.scale.setScalar(.78);wifi.position.set(-.68,.26,-.68);registerPart(g,'wifi',wifi,[-1.7,.3,.2]);const port=makePort('usb-c',.72);port.rotation.x=Math.PI/2;port.position.set(0,.10,2.08);registerPart(g,'port',port,[0,-.35,1.55]);
}
function buildTablet(){
  const g=inspectionGroup;

  // Keep the original tablet chassis, but make the internal layout much clearer.
  const chassis=new THREE.Group();
  chassis.add(rbox(3.96,.16,5.25,.24,MAT.aluminum(),[0,0,0]));
  chassis.add(rbox(3.70,.07,4.98,.20,new THREE.MeshStandardMaterial({color:0x252a2f,roughness:.58,metalness:.42}),[0,.11,0]));
  registerPart(g,'motherboard',chassis,[0,-.10,0],false);

  // Display lifts much farther away in exploded view so it no longer hides internals.
  const display=makeDisplayAssembly(3.82,5.10,.10);
  display.position.set(0,.42,0);
  registerPart(g,'display',display,[0,2.05,.20]);

  // Large, clearly readable logic-board area with visible PCB traces and shielding.
  const board=new THREE.Group();
  const mainPCB=makePCB(3.18,1.34,'green',.065);
  board.add(mainPCB);

  const shieldA=rbox(.72,.075,.58,.035,MAT.metal(),[-1.02,.105,-.18]);
  const shieldB=rbox(.62,.075,.50,.035,MAT.metal(),[1.05,.105,-.16]);
  board.add(shieldA,shieldB);

  const vrm=makeVRMCluster();
  vrm.scale.setScalar(.58);
  vrm.position.set(0,.12,.38);
  board.add(vrm);

  // Small board connectors and visible gold contact areas.
  for(const x of [-1.30,-.96,-.62,.72,1.06,1.40]){
    board.add(rbox(.22,.045,.10,.012,MAT.gold(),[x,.075,.55]));
  }
  for(const x of [-1.18,-.80,.82,1.20]){
    board.add(cyl(.038,.11,new THREE.MeshStandardMaterial({color:0x2d343b,roughness:.35,metalness:.62}),[x,.10,-.48],[0,0,0],18));
  }

  board.position.set(0,.23,-1.76);
  registerPart(g,'motherboard',board,[0,.72,-1.62]);

  // CPU / SoC: deliberately separated visually from nearby chips.
  const cpu=makeCPU(.94,true);
  cpu.position.set(-.82,.39,-1.92);
  registerPart(g,'cpu',cpu,[-2.20,1.05,-1.48]);

  // GPU teaching representation: separate highlighted package for clarity.
  const gpu=makeCPU(.78,true);
  gpu.scale.set(.86,1,.86);
  gpu.position.set(.05,.385,-1.88);
  registerPart(g,'gpu',gpu,[0,1.16,-1.72]);

  // RAM was previously not represented as a distinct clickable part.
  const ram=new THREE.Group();
  const ramChip1=makeIC(.42,.34,.065);ramChip1.position.set(-.25,0,0);ram.add(ramChip1);
  const ramChip2=makeIC(.42,.34,.065);ramChip2.position.set(.25,0,0);ram.add(ramChip2);
  ram.position.set(.86,.38,-1.91);
  registerPart(g,'ram',ram,[1.95,1.02,-1.42]);

  // NAND storage shown as two recognizable packages rather than one tiny block.
  const storage=new THREE.Group();
  const nand1=makeIC(.38,.46,.060);nand1.position.set(-.23,0,0);storage.add(nand1);
  const nand2=makeIC(.38,.46,.060);nand2.position.set(.23,0,0);storage.add(nand2);
  storage.position.set(1.38,.36,-1.45);
  registerPart(g,'storage',storage,[2.38,.72,-.42]);

  // Three large battery cells make the power section instantly recognizable.
  const battery=makeBatteryPack(3.20,2.72,3);
  battery.position.set(0,.19,.66);
  registerPart(g,'battery',battery,[0,-1.02,.92]);

  // Add visible flex/ribbon cables for realistic internal tablet anatomy.
  const flexMat=new THREE.MeshStandardMaterial({color:0xc77a2b,roughness:.42,metalness:.30});
  const flex=new THREE.Group();
  flex.add(rbox(.22,.018,1.18,.025,flexMat,[-1.40,.30,-.55]));
  flex.add(rbox(.22,.018,.90,.025,flexMat,[1.38,.30,-.72]));
  flex.add(rbox(1.30,.018,.18,.025,flexMat,[.55,.30,.12]));
  flex.add(rbox(.48,.028,.22,.025,MAT.gold(),[-1.40,.315,.02]));
  flex.add(rbox(.48,.028,.22,.025,MAT.gold(),[1.38,.315,-.25]));
  g.add(flex);

  // More obvious rear camera module.
  const cam=makeCameraArray(2,false);
  cam.scale.setScalar(.78);
  cam.position.set(-1.24,.38,-2.34);
  registerPart(g,'camera',cam,[-1.86,1.08,-1.86]);

  // Speakers remain left/right but explode outward farther for readability.
  const speakerL=makeSpeaker(1.10,.24);
  speakerL.position.set(-1.30,.22,2.22);
  registerPart(g,'speaker',speakerL,[-1.95,.42,1.48]);

  const speakerR=makeSpeaker(1.10,.24);
  speakerR.position.set(1.30,.22,2.22);
  registerPart(g,'speaker',speakerR,[1.95,.42,1.48]);

  // Wi-Fi module scaled up slightly so its shield and antenna connectors are visible.
  const wifi=makeWifiModule();
  wifi.scale.setScalar(1.10);
  wifi.position.set(-1.48,.34,-1.26);
  registerPart(g,'wifi',wifi,[-2.22,.56,-.22]);

  // USB-C port stays physically aligned with the tablet body.
  const port=makePort('usb-c',.94);
  port.rotation.x=Math.PI/2;
  port.position.set(0,.12,2.51);
  registerPart(g,'port',port,[0,-.42,1.72]);
}
function buildLaptop(){
  const g=inspectionGroup;const base=new THREE.Group();base.add(rbox(5.05,.20,3.42,.16,MAT.aluminum(),[0,0,0]));base.add(rbox(4.72,.10,3.10,.13,new THREE.MeshStandardMaterial({color:0x2a2e32,roughness:.55,metalness:.48}),[0,.13,0]));registerPart(g,'motherboard',base,[0,-.12,0],false);const display=makeDisplayAssembly(5.0,3.02,.12);display.rotation.x=-1.48;display.position.set(0,1.55,-1.72);registerPart(g,'display',display,[0,.45,-1.1]);const mb=makeMotherboardLaptop();mb.position.set(0,.26,-.60);registerPart(g,'motherboard',mb,[0,.28,-1.02]);const cpu=makeCPU(.58,false);cpu.position.set(-.55,.42,-.67);registerPart(g,'cpu',cpu,[-1.7,.78,-.65]);const gpu=makeCPU(.48,false);gpu.position.set(.38,.40,-.66);gpu.scale.set(.80,.75,.80);registerPart(g,'gpu',gpu,[1.7,.78,-.65]);const ram1=makeRAMModule(1.24,.34,.045,6);ram1.rotation.x=Math.PI/2;ram1.position.set(-.62,.40,.08);registerPart(g,'ram',ram1,[-1.65,.62,.5]);const ram2=makeRAMModule(1.24,.34,.045,6);ram2.rotation.x=Math.PI/2;ram2.position.set(.62,.40,.08);registerPart(g,'ram',ram2,[1.65,.62,.5]);const ssd=makeM2SSD(1.18,.34);ssd.position.set(.72,.40,.55);registerPart(g,'storage',ssd,[1.75,.50,.72]);const battery=makeBatteryPack(3.7,.78,4);battery.position.set(0,.22,1.15);registerPart(g,'battery',battery,[0,-.70,1.30]);const cooling=makeLaptopCooling();cooling.position.set(0,.38,-.18);registerPart(g,'heatsink',cooling,[0,.90,-.28]);for(const x of [-1.42,1.42]){const fan=makeFan(.43,.095,9);fan.position.set(x,.48,-.73);registerPart(g,'fan',fan,[x>0?1.75:-1.75,.52,-1.12]);}const wifi=makeWifiModule();wifi.scale.setScalar(.82);wifi.position.set(-1.72,.38,.42);registerPart(g,'wifi',wifi,[-2.25,.3,.48]);const spL=makeSpeaker(1.18,.25);spL.position.set(-1.75,.23,1.35);registerPart(g,'speaker',spL,[-2.05,.05,1.55]);const spR=makeSpeaker(1.18,.25);spR.position.set(1.75,.23,1.35);registerPart(g,'speaker',spR,[2.05,.05,1.55]);const cam=makeCameraArray(1,true);cam.scale.setScalar(.52);cam.rotation.x=Math.PI/2;cam.position.set(0,1.63,-1.58);registerPart(g,'camera',cam,[0,.55,-1.5]);const port=makePort('usb-c',.82);port.rotation.z=Math.PI/2;port.position.set(2.36,.15,.2);registerPart(g,'port',port,[1.7,-.25,.5]);
}
function buildDesktop(){
  const g=inspectionGroup;const frame=new THREE.Group();frame.add(rbox(4.4,.16,3.25,.08,MAT.darkMetal(),[0,-2.5,0]));frame.add(rbox(4.4,.16,3.25,.08,MAT.darkMetal(),[0,2.5,0]));frame.add(rbox(.16,5.0,3.25,.08,MAT.darkMetal(),[-2.14,0,0]));frame.add(rbox(.16,5.0,3.25,.08,MAT.darkMetal(),[2.14,0,0]));frame.add(rbox(4.10,4.65,.025,.04,MAT.glass(),[0,0,1.61]));registerPart(g,'motherboard',frame,[0,0,0],false);const mb=makeMotherboardDesktop();mb.rotation.x=Math.PI/2;mb.position.set(-.15,.05,-.63);registerPart(g,'motherboard',mb,[-1.35,0,-.55]);const cpu=makeCPU(.70,false);cpu.rotation.x=Math.PI/2;cpu.position.set(-.65,.52,-.44);registerPart(g,'cpu',cpu,[-.5,1.55,-.7]);for(let i=0;i<4;i++){const ram=makeRAMModule(1.35,.35,.05,8);ram.rotation.set(Math.PI/2,0,Math.PI/2);ram.position.set(.38+i*.18,.42,-.42);registerPart(g,'ram',ram,[1.0+i*.15,1.20,-.55]);}const gpu=makeDiscreteGPU();gpu.position.set(.15,-.48,.10);registerPart(g,'gpu',gpu,[1.75,-.55,.95]);const ssd=makeM2SSD(1.18,.34);ssd.rotation.x=Math.PI/2;ssd.position.set(1.12,-1.43,-.35);registerPart(g,'storage',ssd,[1.75,-1.48,.9]);const psu=makePSU();psu.position.set(1.05,-1.70,-.85);registerPart(g,'psu',psu,[1.85,-1.35,-1.25]);const towerCool=new THREE.Group();const hs=makeHeatsink(1.0,.75,.72,24);hs.rotation.x=Math.PI/2;towerCool.add(hs);const fan=makeFan(.58,.11,9);fan.rotation.x=Math.PI/2;fan.position.set(0,.43,.18);towerCool.add(fan);towerCool.position.set(-.62,.45,-.02);registerPart(g,'heatsink',towerCool,[-.35,1.85,.42]);for(const y of [-1.25,0,1.25]){const fanF=makeFan(.52,.10,9);fanF.rotation.z=Math.PI/2;fanF.position.set(-1.98,y,.86);registerPart(g,'fan',fanF,[-1.15,y*1.15,1.55]);}const wifi=makeWifiModule();wifi.rotation.x=Math.PI/2;wifi.position.set(-.25,-1.30,-.15);registerPart(g,'wifi',wifi,[-.85,-1.4,.75]);const io=new THREE.Group();for(let i=0;i<3;i++){const p=makePort(i===0?'usb-c':'usb',.65);p.position.set(-.22+i*.28,0,0);io.add(p);}io.rotation.x=Math.PI/2;io.position.set(-.10,1.62,-.48);registerPart(g,'port',io,[0,1.35,-1.18]);
}
function createLabels(){labelsLayer.innerHTML='';labelNodes.clear();const seen=new Set();for(const root of clickableRoots){const key=root.userData.partKey;if(seen.has(key))continue;seen.add(key);const el=document.createElement('div');el.className='part-label';el.dataset.key=key;labelsLayer.appendChild(el);labelNodes.set(key,{el,root});}refreshLabelText();}
function refreshLabelText(){for(const [key,v] of labelNodes){const d=componentData[key];if(d)v.el.textContent=lang==='fa'?d.fa:d.en;}}
function updateLabels(){if(!currentDevice)return;const w=innerWidth,h=innerHeight;for(const [,v] of labelNodes){const el=v.el;if(!labelVisible){el.style.display='none';continue;}el.style.display='block';const p=partCenter(v.root).project(camera);const visible=p.z<1&&p.z>-1;el.classList.toggle('behind',!visible);el.style.left=`${Math.max(46,Math.min(w-46,(p.x*.5+.5)*w))}px`;el.style.top=`${Math.max(92,Math.min(h-50,(-p.y*.5+.5)*h))}px`;}}
function showInfo(root){selectedRoot=root;const d=componentData[root.userData.partKey];if(!d)return;ui.info.classList.remove('hidden');$('#info-kicker').textContent=T[lang].component;$('#info-name').textContent=lang==='fa'?d.fa:d.en;$('#role-label').textContent=T[lang].role;$('#found-label').textContent=T[lang].found;$('#works-label').textContent=T[lang].works;$('#info-role').textContent=lang==='fa'?d.roleFa:d.roleEn;$('#info-found').textContent=lang==='fa'?d.foundFa:d.foundEn;$('#info-works').textContent=lang==='fa'?d.worksFa:d.worksEn;highlightRoot(root);}
function highlightRoot(root){for(const r of clickableRoots)r.traverse(o=>{if(o.isMesh&&o.material?.emissive){o.material.emissive.set(0x000000);o.material.emissiveIntensity=0;}});if(root)root.traverse(o=>{if(o.isMesh&&o.material?.emissive){o.material.emissive.set(0x17495f);o.material.emissiveIntensity=.75;}});}
function focusSelected(){if(!selectedRoot)return;const c=partCenter(selectedRoot);controls.target.copy(c);camera.position.copy(c).add(new THREE.Vector3(1.6,1.25,1.8).normalize().multiplyScalar(currentDevice==='desktop'?4.2:3.0));for(const r of clickableRoots){if(r===selectedRoot)continue;r.traverse(o=>{if(o.isMesh&&o.material&&!o.material.transparent){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.18;}});}}
function clearFocus(){selectedRoot=null;highlightRoot(null);for(const r of clickableRoots)r.traverse(o=>{if(o.isMesh&&o.material)o.material.opacity=1;});resetView();ui.info.classList.add('hidden');}
function resetView(){controls.target.set(0,.5,0);camera.position.set(currentDevice==='desktop'?7.2:6.7,currentDevice==='desktop'?4.4:5.0,currentDevice==='desktop'?8.2:7.9);}
function updateExplode(dt){exploded+=(explodedTarget-exploded)*Math.min(1,dt*5.5);for(const r of clickableRoots){const base=r.userData.base,ex=r.userData.explode;if(base&&ex)r.position.copy(base).addScaledVector(ex,exploded);}}
function makeRelations(){clearRelations();const byKey={};for(const r of clickableRoots)if(!byKey[r.userData.partKey])byKey[r.userData.partKey]=r;for(const [a,b] of [['cpu','ram'],['cpu','gpu'],['cpu','storage'],['motherboard','battery'],['motherboard','display'],['motherboard','camera'],['motherboard','wifi']]){if(!byKey[a]||!byKey[b])continue;const geo=new THREE.BufferGeometry().setFromPoints([partCenter(byKey[a]),partCenter(byKey[b])]);const mat=new THREE.LineDashedMaterial({color:0x74c9ff,dashSize:.16,gapSize:.10,transparent:true,opacity:.62});const line=new THREE.Line(geo,mat);line.computeLineDistances();inspectionGroup.add(line);relationLines.push({line,a:byKey[a],b:byKey[b]});}}
function clearRelations(){for(const x of relationLines)x.line.parent?.remove(x.line);relationLines=[];}
function updateRelations(){for(const x of relationLines){x.line.geometry.setFromPoints([partCenter(x.a),partCenter(x.b)]);x.line.computeLineDistances();x.line.material.dashOffset-=.01;}}
function makeCoolingDemo(){clearHeat();if(!(currentDevice==='laptop'||currentDevice==='desktop'))return;const starts=[];for(const k of ['cpu','gpu']){const r=clickableRoots.find(x=>x.userData.partKey===k);if(r)starts.push(partCenter(r));}const fans=clickableRoots.filter(x=>x.userData.partKey==='fan').slice(0,2).map(partCenter);if(!starts.length||!fans.length)return;for(let i=0;i<26;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.035,10,10),new THREE.MeshBasicMaterial({color:i%3===0?0xffe27a:0xff6c2f,transparent:true,opacity:.82}));inspectionGroup.add(mesh);heatParticles.push({mesh,t:Math.random(),speed:.10+Math.random()*.09,start:starts[i%starts.length].clone(),end:fans[i%fans.length].clone()});}}
function clearHeat(){for(const h of heatParticles)h.mesh.parent?.remove(h.mesh);heatParticles=[];}
function updateHeat(dt){for(const h of heatParticles){h.t=(h.t+h.speed*dt)%1;const p=h.start.clone().lerp(h.end,h.t);p.y+=Math.sin(h.t*Math.PI)*.32;h.mesh.position.copy(p);h.mesh.material.opacity=.32+.65*Math.sin(h.t*Math.PI);}}
function bindUI(){
  addEventListener('resize',onResize);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerdown',onPointerDown);$('#home-btn').onclick=()=>currentDevice?backToRoom():resetRoomView();$('#back-btn').onclick=backToRoom;$('#explode-btn').onclick=()=>{explodedTarget=1;playClick(220)};$('#assemble-btn').onclick=()=>{explodedTarget=0;playClick(180)};$('#reset-btn').onclick=resetView;$('#labels-btn').onclick=()=>{labelVisible=!labelVisible;$('#labels-btn').setAttribute('aria-pressed',labelVisible);updateLanguage();};$('#relations-btn').onclick=()=>{relationMode=!relationMode;$('#relations-btn').setAttribute('aria-pressed',relationMode);relationMode?makeRelations():clearRelations();};$('#cooling-btn').onclick=()=>{coolingMode=!coolingMode;$('#cooling-btn').setAttribute('aria-pressed',coolingMode);coolingMode?makeCoolingDemo():clearHeat();};$('#close-info').onclick=()=>ui.info.classList.add('hidden');$('#focus-btn').onclick=focusSelected;$('#clear-focus-btn').onclick=clearFocus;$('#lang-btn').onclick=()=>{lang=lang==='en'?'fa':'en';updateLanguage();};$('#sound-btn').onclick=()=>{soundOn=!soundOn;ui.sound.textContent=soundOn?'🔊':'🔇';ui.sound.setAttribute('aria-pressed',soundOn)};$('#drawer-close').onclick=closeDrawer;document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>openNav(b.dataset.nav));
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));}
function eventToPointer(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;}
function onPointerMove(e){eventToPointer(e);raycaster.setFromCamera(pointer,camera);if(currentDevice){const hit=raycaster.intersectObjects(clickableMeshes,false)[0];const root=hit?.object?.userData?.partRoot||null;hoveredRoot=root;hoverLabel.classList.toggle('hidden',!root);if(root){const d=componentData[root.userData.partKey];hoverLabel.textContent=lang==='fa'?d?.fa:d?.en;hoverLabel.style.left=e.clientX+'px';hoverLabel.style.top=e.clientY+'px';canvas.style.cursor='pointer';}else canvas.style.cursor='grab';}else{const hits=raycaster.intersectObjects(roomGroup.children,true);const root=hits.map(h=>h.object.userData.deviceRoot).find(Boolean);hoverLabel.classList.toggle('hidden',!root);if(root){hoverLabel.textContent=names[root.userData.deviceType][lang];hoverLabel.style.left=e.clientX+'px';hoverLabel.style.top=e.clientY+'px';canvas.style.cursor='pointer';}else canvas.style.cursor='grab';}}
function onPointerDown(e){if(e.button!==0)return;eventToPointer(e);raycaster.setFromCamera(pointer,camera);if(currentDevice){const hit=raycaster.intersectObjects(clickableMeshes,false)[0];const root=hit?.object?.userData?.partRoot;if(root){showInfo(root);playClick(300);}}else{const hits=raycaster.intersectObjects(roomGroup.children,true);const root=hits.map(h=>h.object.userData.deviceRoot).find(Boolean);if(root){openDevice(root.userData.deviceType);playClick(260);}}}
function playClick(freq=250){if(!soundOn)return;try{const C=window.AudioContext||window.webkitAudioContext;const ctx=new C();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.frequency.value=freq;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.08);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.085);}catch{}}
function updateLanguage(){
  document.documentElement.lang=lang==='fa'?'fa':'en';document.documentElement.dir=lang==='fa'?'rtl':'ltr';const t=T[lang];$('#brand-sub').textContent=t.brandSub;$('#nav-home').textContent=t.home;$('#nav-devices').textContent=t.devices;$('#nav-explorer').textContent=t.explorer;$('#nav-learn').textContent=t.learn;$('#nav-about').textContent=t.about;$('#room-eyebrow').textContent=t.roomEyebrow;$('#room-title').textContent=t.roomTitle;$('#room-copy').textContent=t.roomCopy;ui.assistant.textContent=currentDevice?t.gesture:t.assistant;$('#explorer-eyebrow').textContent=t.explorerEyebrow;$('#explode-btn').textContent=t.explode;$('#assemble-btn').textContent=t.assemble;$('#reset-btn').textContent=t.reset;$('#labels-btn').textContent=labelVisible?t.labelsOn:t.labelsOff;$('#relations-btn').textContent=t.relations;$('#cooling-btn').textContent=t.cooling;$('#gesture-tip').textContent=t.gesture;$('#focus-btn').textContent=t.focus;$('#clear-focus-btn').textContent=t.clear;ui.lang.textContent=lang==='en'?'فارسی':'EN';if(currentDevice)ui.deviceTitle.textContent=names[currentDevice][lang];refreshLabelText();buildDevicePills();if(selectedRoot)showInfo(selectedRoot);
}
function buildDevicePills(){const wrap=$('#device-pills');wrap.innerHTML='';for(const type of Object.keys(names)){const b=document.createElement('button');b.textContent=names[type][lang];b.onclick=()=>openDevice(type);wrap.appendChild(b);}}
function resetRoomView(){camera.position.set(8,6.5,11);controls.target.set(0,1,0);}
function openNav(which){if(which==='home'){if(currentDevice)backToRoom();return;}if(which==='explorer'){if(currentDevice)return;openNav('devices');return;}const t=T[lang];ui.drawer.classList.remove('hidden');$('#drawer-kicker').textContent='DEVICE REPAIR';if(which==='devices'){ $('#drawer-title').textContent=t.devicesTitle;$('#drawer-content').innerHTML=`<p>${t.devicesCopy}</p><div class="device-menu">${Object.keys(names).map(k=>`<button data-open="${k}"><b>${names[k][lang]}</b></button>`).join('')}</div>`;document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{closeDrawer();openDevice(b.dataset.open)});}else if(which==='learn'){ $('#drawer-title').textContent=t.learnTitle;$('#drawer-content').innerHTML=`<div class="drawer-grid">${['cpu','gpu','ram','motherboard','storage','battery','display','camera','cooling','fan','heatsink','psu'].map(k=>{const d=componentData[k];return `<div class="lesson"><b>${lang==='fa'?d.fa:d.en}</b><span>${lang==='fa'?d.roleFa:d.roleEn}</span></div>`}).join('')}</div>`;}else{$('#drawer-title').textContent=t.aboutTitle;$('#drawer-content').innerHTML=`<p>${t.aboutCopy}</p>`;}}
function closeDrawer(){ui.drawer.classList.add('hidden');}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);controls.update();if(currentDevice){updateExplode(dt);updateLabels();if(relationMode)updateRelations();if(coolingMode)updateHeat(dt);}renderer.render(scene,camera);}
try{init();}catch(err){console.error('DEVICE REPAIR init failed',err);loader?.classList.add('done');$('#fallback')?.classList.remove('hidden');}
