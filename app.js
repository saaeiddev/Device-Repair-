import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    roomEyebrow:'COZY ELECTRONICS WORKSHOP', roomTitle:'What would you like to explore?', roomCopy:'Choose a device on the repair bench. Rotate the room, then click a device to inspect what is inside.',
    assistant:'Choose a device to explore its hardware.', explorerEyebrow:'HARDWARE EXPLORER', explode:'Explode Device', assemble:'Assemble', reset:'Reset View', labelsOn:'Labels: On', labelsOff:'Labels: Off', relations:'How Parts Work Together', cooling:'Cooling Demo',
    gesture:'Drag to rotate • Scroll / pinch to zoom • Click a component to learn', component:'COMPONENT', role:'Role', found:'Found in', works:'Works with', focus:'Focus Component', clear:'Show all components',
    loading:'Preparing the Repair Bench…', devicesTitle:'Choose a device', devicesCopy:'Each device opens in a real-time 3D inspection mode with clickable internal components.',
    learnTitle:'Hardware quick lessons', aboutTitle:'About DEVICE REPAIR', aboutCopy:'DEVICE REPAIR is an interactive bilingual 3D learning lab. It visualizes how phones, tablets, laptops and desktop PCs are assembled, where major components live, and how those components cooperate.',
    relationCopy:'Animated relationship lines show how major parts exchange data or power.', coolingCopy:'Cooling demo: heat moves from CPU/GPU to the heat sink and exits through airflow.',
    back:'Back to room', noCooling:'Cooling visualization is available on laptops and desktop PCs.'
  },
  fa: {
    brandSub:'آزمایشگاه سه‌بعدی سخت‌افزار', home:'خانه', devices:'دستگاه‌ها', explorer:'بررسی سخت‌افزار', learn:'آموزش', about:'درباره',
    roomEyebrow:'کارگاه گرم و صمیمی تعمیرات', roomTitle:'دوست داری داخل کدام دستگاه را ببینی؟', roomCopy:'یک دستگاه را روی میز تعمیر انتخاب کن. محیط را بچرخان و روی دستگاه کلیک کن تا اجزای داخلی آن را بررسی کنیم.',
    assistant:'یک دستگاه را انتخاب کن تا سخت‌افزار داخل آن را بررسی کنیم.', explorerEyebrow:'بررسی سخت‌افزار', explode:'باز کردن اجزای دستگاه', assemble:'مونتاژ مجدد', reset:'بازنشانی نما', labelsOn:'لیبل‌ها: روشن', labelsOff:'لیبل‌ها: خاموش', relations:'اجزا چگونه با هم کار می‌کنند', cooling:'نمایش سیستم خنک‌کننده',
    gesture:'برای چرخش بکش • برای زوم اسکرول/پینچ کن • روی قطعه کلیک کن', component:'قطعه', role:'وظیفه', found:'در چه دستگاه‌هایی', works:'همکاری با', focus:'تمرکز روی قطعه', clear:'نمایش همه قطعات',
    loading:'در حال آماده‌سازی میز تعمیر…', devicesTitle:'یک دستگاه انتخاب کن', devicesCopy:'هر دستگاه در حالت بررسی سه‌بعدی باز می‌شود و اجزای داخلی آن قابل انتخاب هستند.',
    learnTitle:'آموزش سریع سخت‌افزار', aboutTitle:'درباره DEVICE REPAIR', aboutCopy:'DEVICE REPAIR یک آزمایشگاه سه‌بعدی و دو‌زبانه برای یادگیری سخت‌افزار است؛ جای قطعات مهم در موبایل، تبلت، لپ‌تاپ و کامپیوتر رومیزی و ارتباط آن‌ها با یکدیگر را نشان می‌دهد.',
    relationCopy:'خطوط متحرک آموزشی نشان می‌دهند قطعات اصلی چگونه داده یا توان را با هم مبادله می‌کنند.', coolingCopy:'نمایش خنک‌کاری: گرما از CPU/GPU به هیت‌سینک می‌رسد و با جریان هوا از دستگاه خارج می‌شود.',
    back:'بازگشت به کارگاه', noCooling:'نمایش خنک‌کاری برای لپ‌تاپ و کامپیوتر رومیزی فعال است.'
  }
};

const names = {
  smartphone:{en:'Smartphone',fa:'گوشی هوشمند'}, tablet:{en:'Tablet',fa:'تبلت'}, laptop:{en:'Laptop',fa:'لپ‌تاپ'}, desktop:{en:'Desktop PC',fa:'کامپیوتر رومیزی'}
};

const componentData = {
  cpu:{en:'CPU / Processor',fa:'پردازنده مرکزی (CPU)',roleEn:'Executes instructions and performs the primary calculations required by the operating system and applications.',roleFa:'دستورها را اجرا می‌کند و بخش بزرگی از محاسبات اصلی سیستم‌عامل و برنامه‌ها را انجام می‌دهد.',foundEn:'Phones, tablets, laptops, desktop PCs',foundFa:'موبایل، تبلت، لپ‌تاپ و کامپیوتر رومیزی',worksEn:'RAM, storage, GPU, motherboard',worksFa:'RAM، حافظه، GPU و مادربرد'},
  gpu:{en:'GPU',fa:'پردازنده گرافیکی (GPU)',roleEn:'Processes graphics, parallel workloads and visual output. In mobile devices it is usually integrated into the SoC.',roleFa:'پردازش گرافیک، محاسبات موازی و خروجی تصویری را انجام می‌دهد و در موبایل معمولاً داخل SoC یکپارچه است.',foundEn:'Phones, tablets, laptops, desktop PCs',foundFa:'موبایل، تبلت، لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, RAM/VRAM, display',worksFa:'CPU، RAM/VRAM و نمایشگر'},
  ram:{en:'RAM',fa:'حافظه RAM',roleEn:'Fast working memory that temporarily holds data and instructions the processor needs right now.',roleFa:'حافظه کاری سریع که داده‌ها و دستورهای موردنیاز پردازنده را به‌صورت موقت نگه می‌دارد.',foundEn:'All modern devices',foundFa:'همه دستگاه‌های مدرن',worksEn:'CPU, GPU, storage',worksFa:'CPU، GPU و حافظه ذخیره‌سازی'},
  motherboard:{en:'Motherboard / Logic Board',fa:'مادربرد / برد اصلی',roleEn:'The main circuit board that physically and electrically connects processors, memory, ports, sensors and power circuitry.',roleFa:'برد اصلی مدار که پردازنده، حافظه، پورت‌ها، حسگرها و مدارهای توان را به‌صورت فیزیکی و الکتریکی به هم متصل می‌کند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'Almost every internal component',worksFa:'تقریباً تمام قطعات داخلی'},
  storage:{en:'Storage / SSD',fa:'حافظه ذخیره‌سازی / SSD',roleEn:'Stores the operating system, apps and user files even when power is off.',roleFa:'سیستم‌عامل، برنامه‌ها و فایل‌های کاربر را حتی بعد از خاموش‌شدن دستگاه نگه می‌دارد.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'CPU, RAM, motherboard',worksFa:'CPU، RAM و مادربرد'},
  battery:{en:'Battery',fa:'باتری',roleEn:'Stores electrical energy and supplies regulated power to mobile hardware through the power-management circuitry.',roleFa:'انرژی الکتریکی را ذخیره می‌کند و از طریق مدار مدیریت توان، برق موردنیاز قطعات را تأمین می‌کند.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'Power circuitry, motherboard, charging port',worksFa:'مدار توان، مادربرد و درگاه شارژ'},
  display:{en:'Display Assembly',fa:'مجموعه نمایشگر',roleEn:'Converts graphics output into visible pixels; touch-enabled devices also include a digitizer that senses finger input.',roleFa:'خروجی گرافیکی را به پیکسل‌های قابل مشاهده تبدیل می‌کند؛ در دستگاه‌های لمسی، دیجیتایزر لمس را نیز تشخیص می‌دهد.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'GPU, display controller, touch controller',worksFa:'GPU، کنترلر نمایشگر و کنترلر لمس'},
  camera:{en:'Camera Module',fa:'ماژول دوربین',roleEn:'Combines lens, image sensor and supporting electronics to capture photos and video.',roleFa:'لنز، حسگر تصویر و الکترونیک لازم را برای ثبت عکس و ویدیو ترکیب می‌کند.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'SoC/CPU, image processor, storage',worksFa:'SoC/CPU، پردازنده تصویر و حافظه'},
  cooling:{en:'Cooling System',fa:'سیستم خنک‌کننده',roleEn:'Moves heat away from high-power chips using heat spreaders, heat pipes, heat sinks and fans.',roleFa:'گرما را با کمک پخش‌کننده حرارتی، هیت‌پایپ، هیت‌سینک و فن از تراشه‌های پرمصرف دور می‌کند.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, GPU, chassis airflow',worksFa:'CPU، GPU و جریان هوای بدنه'},
  fan:{en:'Cooling Fan',fa:'فن خنک‌کننده',roleEn:'Forces air across heat sinks so thermal energy can leave the device.',roleFa:'هوا را از روی هیت‌سینک عبور می‌دهد تا گرما از دستگاه خارج شود.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'Heat sink, CPU/GPU, vents',worksFa:'هیت‌سینک، CPU/GPU و دریچه‌ها'},
  heatsink:{en:'Heat Sink / Heat Pipe',fa:'هیت‌سینک / هیت‌پایپ',roleEn:'Conducts and spreads heat from processors into a larger surface area where airflow can remove it.',roleFa:'گرما را از پردازنده‌ها می‌گیرد و روی سطح بزرگ‌تری پخش می‌کند تا جریان هوا آن را دفع کند.',foundEn:'Laptops and desktop PCs',foundFa:'لپ‌تاپ و کامپیوتر رومیزی',worksEn:'CPU, GPU, fan',worksFa:'CPU، GPU و فن'},
  psu:{en:'Power Supply (PSU)',fa:'منبع تغذیه (PSU)',roleEn:'Converts AC wall power into regulated DC rails used by desktop PC components.',roleFa:'برق AC شهری را به ولتاژهای DC تنظیم‌شده موردنیاز قطعات کامپیوتر تبدیل می‌کند.',foundEn:'Desktop PCs',foundFa:'کامپیوتر رومیزی',worksEn:'Motherboard, GPU, storage, fans',worksFa:'مادربرد، GPU، حافظه و فن‌ها'},
  speaker:{en:'Speaker',fa:'بلندگو',roleEn:'Converts electrical audio signals into sound through a miniature driver.',roleFa:'سیگنال الکتریکی صوت را با یک درایور کوچک به صدا تبدیل می‌کند.',foundEn:'Phones, tablets, laptops',foundFa:'موبایل، تبلت و لپ‌تاپ',worksEn:'Audio codec, motherboard',worksFa:'کدک صوتی و مادربرد'},
  wifi:{en:'Wi‑Fi / Bluetooth Module',fa:'ماژول Wi‑Fi / Bluetooth',roleEn:'Provides short-range wireless communication and network connectivity.',roleFa:'ارتباط بی‌سیم کوتاه‌برد و اتصال شبکه را فراهم می‌کند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'Antennas, motherboard, CPU',worksFa:'آنتن‌ها، مادربرد و CPU'},
  port:{en:'Charging / I/O Port',fa:'درگاه شارژ / ورودی‌خروجی',roleEn:'Creates the physical electrical connection for charging, data transfer or peripherals.',roleFa:'اتصال فیزیکی الکتریکی برای شارژ، انتقال داده یا لوازم جانبی را فراهم می‌کند.',foundEn:'All devices',foundFa:'همه دستگاه‌ها',worksEn:'Power circuitry, motherboard',worksFa:'مدار توان و مادربرد'}
};

let lang = localStorage.getItem('deviceRepairLang') || 'en';
let soundOn = true;
let scene, camera, renderer, controls, raycaster, pointer, clock;
let roomGroup, explorerGroup, activeDevice = null, mode = 'room';
let clickableDevices = [], clickableComponents = [], labelNodes = new Map();
let hoverObject = null, selectedPart = null, labelsOn = true, relationsOn = false, coolingOn = false;
let explodeTarget = 0, explodeProgress = 0;
let relationLines = new THREE.Group(), coolingFX = new THREE.Group();
let targetCamera = null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const mats = {
  metal:()=>new THREE.MeshStandardMaterial({color:0x8d9297,metalness:.75,roughness:.28}),
  dark:()=>new THREE.MeshStandardMaterial({color:0x1b2025,metalness:.35,roughness:.42}),
  black:()=>new THREE.MeshStandardMaterial({color:0x07090b,metalness:.2,roughness:.35}),
  glass:()=>new THREE.MeshPhysicalMaterial({color:0x121a21,metalness:.05,roughness:.12,transmission:.18,transparent:true,opacity:.88}),
  pcb:()=>new THREE.MeshStandardMaterial({color:0x174d36,metalness:.15,roughness:.55}),
  copper:()=>new THREE.MeshStandardMaterial({color:0xb96a31,metalness:.82,roughness:.28}),
  battery:()=>new THREE.MeshStandardMaterial({color:0x24262a,metalness:.05,roughness:.7}),
  silicon:()=>new THREE.MeshStandardMaterial({color:0x30343a,metalness:.55,roughness:.3}),
  blue:()=>new THREE.MeshStandardMaterial({color:0x2c77aa,metalness:.25,roughness:.38}),
  red:()=>new THREE.MeshStandardMaterial({color:0x9d382b,metalness:.2,roughness:.45}),
  cream:()=>new THREE.MeshStandardMaterial({color:0xd7c5ae,metalness:.05,roughness:.72})
};

function box(w,h,d,mat,position=[0,0,0],radius=0){
  const geo = new THREE.BoxGeometry(w,h,d, radius ? 2 : 1, radius ? 2 : 1, radius ? 2 : 1);
  const m = new THREE.Mesh(geo,mat); m.position.set(...position); m.castShadow=true; m.receiveShadow=true; return m;
}
function cyl(r,h,mat,position=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mat);m.position.set(...position);m.rotation.set(...rot);m.castShadow=true;return m;}
function addPart(group,key,obj,explode=[0,0,0]){obj.userData.partKey=key;obj.userData.base=obj.position.clone();obj.userData.explode=new THREE.Vector3(...explode);obj.traverse(o=>{if(o.isMesh){o.userData.partRoot=obj;o.userData.partKey=key;}});group.add(obj);clickableComponents.push(obj);return obj;}
function addChip(parent,key,pos,explode,scale=[.36,.06,.36]){const chip=box(...scale,mats.silicon(),pos);return addPart(parent,key,chip,explode)}

function init(){
  try{
    scene=new THREE.Scene();scene.background=new THREE.Color(0x120d0a);scene.fog=new THREE.FogExp2(0x120d0a,.032);
    camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,120);camera.position.set(8,6.4,11);
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.075;controls.target.set(0,1.5,0);controls.minDistance=4;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.48;
    raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();clock=new THREE.Clock();
    buildLights();buildRoom();explorerGroup=new THREE.Group();scene.add(explorerGroup);scene.add(relationLines);scene.add(coolingFX);
    bindUI();applyLanguage();animateLoader();animate();
  }catch(err){console.error(err);loader.classList.add('done');$('#fallback').classList.remove('hidden');}
}

function buildLights(){
  scene.add(new THREE.HemisphereLight(0xffe2c4,0x2d3a44,1.6));
  const key=new THREE.DirectionalLight(0xffd1a4,3.0);key.position.set(4,8,5);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;scene.add(key);
  const blue=new THREE.PointLight(0x68bfff,18,16,2);blue.position.set(-5,3,-3);scene.add(blue);
  const warm=new THREE.PointLight(0xff8f4f,24,12,2);warm.position.set(3.6,3.1,1.5);scene.add(warm);
}

function buildRoom(){
  roomGroup=new THREE.Group();scene.add(roomGroup);
  const floor=box(24,.2,20,new THREE.MeshStandardMaterial({color:0x3a2a20,roughness:.9}),[0,-.15,0]);roomGroup.add(floor);
  const back=box(24,10,.25,new THREE.MeshStandardMaterial({color:0x503c31,roughness:.96}),[0,4.8,-8]);roomGroup.add(back);
  const left=box(.25,10,20,new THREE.MeshStandardMaterial({color:0x44342c,roughness:.96}),[-12,4.8,0]);roomGroup.add(left);
  roomGroup.add(box(10,.45,4,new THREE.MeshStandardMaterial({color:0x7b4d2c,roughness:.64}),[0,1.85,0]));
  for(const x of [-4.4,4.4]){roomGroup.add(box(.34,2,.34,mats.dark(),[x,.85,-1.45]));roomGroup.add(box(.34,2,.34,mats.dark(),[x,.85,1.45]));}
  roomGroup.add(box(8.2,.05,2.8,new THREE.MeshStandardMaterial({color:0x234b48,roughness:.75}),[0,2.1,0]));
  roomGroup.add(box(7,.18,1,new THREE.MeshStandardMaterial({color:0x67442e,roughness:.76}),[-2.5,5.4,-7.3]));
  for(let i=0;i<5;i++){roomGroup.add(box(.9,.65,.75,new THREE.MeshStandardMaterial({color:[0x7f4b3b,0x465d62,0x776044][i%3],roughness:.65}),[-5.1+i*1.25,5.85,-7.1]));}
  const board=box(4.6,2.4,.12,new THREE.MeshStandardMaterial({color:0x2e3130,roughness:.82}),[5.7,4.2,-7.55]);roomGroup.add(board);
  for(let i=0;i<7;i++){roomGroup.add(box(.12,.8,.08,new THREE.MeshStandardMaterial({color:0xb98a58,metalness:.4,roughness:.35}),[4.1+i*.52,4.35+(i%2)*.25,-7.39]));}
  const monitor=box(2.7,1.55,.12,mats.black(),[-6.2,3.45,-2.2]);roomGroup.add(monitor);roomGroup.add(box(2.42,1.28,.03,new THREE.MeshBasicMaterial({color:0x1c5170}),[-6.2,3.45,-2.12]));roomGroup.add(box(.12,1,.12,mats.dark(),[-6.2,2.55,-2.2]));
  roomGroup.add(cyl(.16,1.7,mats.metal(),[4.8,3.05,1.1],[0,0,-.3]));roomGroup.add(new THREE.Mesh(new THREE.ConeGeometry(.62,.72,32,1,true),new THREE.MeshStandardMaterial({color:0x2a2927,side:THREE.DoubleSide,roughness:.55})));roomGroup.children.at(-1).position.set(5.05,4,1.1);roomGroup.children.at(-1).rotation.x=Math.PI/2;
  roomGroup.add(box(.8,.22,.5,mats.red(),[-4.2,2.38,1]));roomGroup.add(box(.9,.18,.7,mats.dark(),[-3.1,2.35,1.15]));
  for(let i=0;i<6;i++)roomGroup.add(cyl(.045,.65,new THREE.MeshStandardMaterial({color:0xb9b9b2,metalness:.75,roughness:.25}),[-1.4+i*.24,2.45,1.25],[0,0,Math.PI/2]));
  roomGroup.add(cyl(.32,.5,new THREE.MeshStandardMaterial({color:0x9f6941,roughness:.8}),[7.8,2.35,-5.9]));
  for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),new THREE.MeshStandardMaterial({color:0x4b744e,roughness:.8}));leaf.scale.set(.7,1.8,.6);leaf.position.set(7.8+Math.sin(i)*.35,2.85+(i%3)*.14,-5.9+Math.cos(i)*.35);roomGroup.add(leaf);}
  buildRoomDevices();
}

function buildRoomDevices(){
  const phone=new THREE.Group();phone.add(box(1.12,.12,2.05,mats.metal()));phone.add(box(1.02,.035,1.92,mats.glass(),[0,.08,0]));phone.position.set(-3.1,2.34,.1);phone.rotation.z=-.16;registerDevice(phone,'smartphone');
  const tablet=new THREE.Group();tablet.add(box(2,.14,2.75,mats.metal()));tablet.add(box(1.85,.035,2.55,mats.glass(),[0,.09,0]));tablet.position.set(-.8,2.34,.05);tablet.rotation.z=.09;registerDevice(tablet,'tablet');
  const laptop=new THREE.Group();laptop.add(box(2.8,.15,1.85,mats.metal()));const screen=box(2.8,1.75,.12,mats.black(),[0,1.02,-.88]);screen.rotation.x=-.08;laptop.add(screen);laptop.position.set(2.2,2.35,.25);laptop.scale.set(.78,.78,.78);registerDevice(laptop,'laptop');
  const pc=new THREE.Group();pc.add(box(1.65,2.35,1.55,new THREE.MeshStandardMaterial({color:0x22262b,metalness:.5,roughness:.36})));pc.add(box(1.45,2.1,.03,new THREE.MeshPhysicalMaterial({color:0x50646d,transparent:true,opacity:.24,transmission:.3,roughness:.08}),[0,0,.79]));pc.position.set(5.4,3.15,-.15);pc.scale.set(.72,.72,.72);registerDevice(pc,'desktop');
}
function registerDevice(group,type){group.userData.deviceType=type;group.traverse(o=>{if(o.isMesh)o.userData.deviceRoot=group});roomGroup.add(group);clickableDevices.push(group);}

function clearExplorer(){
  clickableComponents=[];selectedPart=null;labelsLayer.innerHTML='';labelNodes.clear();
  while(explorerGroup.children.length)explorerGroup.remove(explorerGroup.children[0]);
  relationLines.clear();coolingFX.clear();
}

function buildDevice(type){
  clearExplorer();activeDevice=type;
  const g=new THREE.Group();g.rotation.x=-.12;explorerGroup.add(g);
  if(type==='smartphone') buildPhone(g);
  if(type==='tablet') buildTablet(g);
  if(type==='laptop') buildLaptop(g);
  if(type==='desktop') buildDesktop(g);
  createLabels();buildRelations();
  explodeProgress=0;explodeTarget=0;
  g.scale.setScalar(type==='desktop'?.92:type==='laptop'?1.08:1.2);
  return g;
}

function buildPhone(g){
  addPart(g,'display',box(2.25,.09,4.35,mats.glass(),[0,.42,0]),[0,1.25,0]);
  const frame=box(2.38,.16,4.5,mats.metal(),[0,.22,0]);addPart(g,'motherboard',frame,[0,0,0]);
  const board=box(1.85,.06,1.28,mats.pcb(),[0,.02,-1.35]);addPart(g,'motherboard',board,[-1.4,.2,-.7]);
  addChip(g,'cpu',[-.25,.10,-1.4],[-2.2,.4,-1]);addChip(g,'ram',[.35,.10,-1.42],[2,.45,-1]);
  addChip(g,'storage',[.68,.10,-1.0],[2.2,.2,-.3],[.28,.055,.42]);
  addPart(g,'battery',box(1.82,.16,2.35,mats.battery(),[0,.03,.5]),[0,-.8,.65]);
  const cam=new THREE.Group();for(let i=0;i<3;i++)cam.add(cyl(.18,.12,mats.black(),[-.3+i*.31,0,0],[Math.PI/2,0,0]));cam.position.set(-.58,.12,-1.72);addPart(g,'camera',cam,[-1.8,.75,-1.3]);
  addPart(g,'speaker',box(1,.08,.24,mats.dark(),[0,.1,1.78]),[0,.45,1.3]);
  addPart(g,'wifi',box(.4,.05,.46,mats.blue(),[-.72,.1,-.8]),[-1.8,.1,.2]);
  addPart(g,'port',box(.55,.08,.18,mats.metal(),[0,.05,2.09]),[0,-.35,1.6]);
}
function buildTablet(g){
  addPart(g,'display',box(3.8,.09,5.15,mats.glass(),[0,.43,0]),[0,1.4,0]);
  addPart(g,'motherboard',box(3.95,.16,5.3,mats.metal(),[0,.22,0]),[0,0,0]);
  addPart(g,'motherboard',box(3.1,.06,1.05,mats.pcb(),[0,.03,-1.75]),[0,.35,-1.35]);
  addChip(g,'cpu',[-.4,.11,-1.76],[-1.8,.5,-1.2]);addChip(g,'gpu',[.35,.11,-1.75],[1.6,.5,-1.2]);addChip(g,'storage',[1.05,.11,-1.72],[2.4,.15,-.5],[.34,.055,.42]);
  addPart(g,'battery',box(3.1,.14,3.1,mats.battery(),[0,.02,.55]),[0,-.75,.7]);
  addPart(g,'camera',cyl(.18,.14,mats.black(),[0,.12,-2.28],[Math.PI/2,0,0]),[0,.7,-1.8]);
  addPart(g,'speaker',box(2.2,.07,.22,mats.dark(),[0,.08,2.2]),[0,.3,1.3]);
  addPart(g,'wifi',box(.5,.05,.5,mats.blue(),[-1.35,.11,-1.55]),[-2.1,.2,-.3]);
  addPart(g,'port',box(.62,.08,.2,mats.metal(),[0,.05,2.5]),[0,-.3,1.5]);
}
function buildLaptop(g){
  const base=box(5,.22,3.4,mats.metal(),[0,0,0]);addPart(g,'motherboard',base,[0,0,0]);
  const display=box(5,3.05,.16,mats.black(),[0,1.65,-1.66]);display.rotation.x=-.08;addPart(g,'display',display,[0,.4,-1.15]);
  addPart(g,'motherboard',box(3.65,.08,1.5,mats.pcb(),[0,.2,-.6]),[0,.25,-1]);
  addChip(g,'cpu',[-.52,.31,-.7],[-1.7,.75,-.65]);addChip(g,'gpu',[.45,.31,-.7],[1.7,.75,-.65]);
  addPart(g,'ram',box(.95,.07,.3,new THREE.MeshStandardMaterial({color:0x1c613e,roughness:.5}),[-.6,.3,.05]),[-1.7,.6,.45]);
  addPart(g,'storage',box(.82,.08,.28,mats.blue(),[.6,.3,.15]),[1.7,.45,.5]);
  addPart(g,'battery',box(3.8,.18,.88,mats.battery(),[0,.14,1.05]),[0,-.7,1.35]);
  for(const x of [-1.45,1.45]) addPart(g,'fan',cyl(.48,.1,mats.dark(),[x,.28,-.98],[Math.PI/2,0,0]),[x>0?1.7:-1.7,.5,-1.1]);
  const pipe=new THREE.Group();pipe.add(box(3.2,.07,.12,mats.copper(),[0,0,0]));pipe.add(box(.12,.07,.8,mats.copper(),[-1.2,0,.35]));addPart(g,'heatsink',pipe,[0,.9,-.25]);
  addPart(g,'wifi',box(.45,.07,.35,mats.blue(),[-1.65,.28,.15]),[-2.2,.3,.4]);
  addPart(g,'speaker',box(1.15,.12,.25,mats.dark(),[-1.7,.15,1.3]),[-2.1,.05,1.5]);
  addPart(g,'camera',cyl(.09,.08,mats.black(),[0,1.73,-1.49],[Math.PI/2,0,0]),[0,.5,-1.5]);
  addPart(g,'port',box(.7,.11,.14,mats.dark(),[2.3,.05,.18]),[1.7,-.25,.5]);
}
function buildDesktop(g){
  const caseFrame=new THREE.Group();
  caseFrame.add(box(4.4,.12,3.2,mats.dark(),[0,-2.5,0]));caseFrame.add(box(4.4,.12,3.2,mats.dark(),[0,2.5,0]));caseFrame.add(box(.12,5,3.2,mats.dark(),[-2.15,0,0]));caseFrame.add(box(.12,5,3.2,mats.dark(),[2.15,0,0]));
  addPart(g,'motherboard',caseFrame,[0,0,0]);
  const mb=box(3.25,.09,3.8,mats.pcb(),[-.22,0,-.55]);mb.rotation.x=Math.PI/2;addPart(g,'motherboard',mb,[-1.35,0,-.5]);
  addChip(g,'cpu',[-.2,.15,-.6],[-.3,1.5,-.7],[.55,.12,.55]);
  addPart(g,'ram',box(.22,1.4,.12,new THREE.MeshStandardMaterial({color:0x1f6840,roughness:.5}),[.72,.2,-.55]),[1.1,1.2,-.6]);
  addPart(g,'gpu',box(2.35,.45,.62,mats.dark(),[.15,-.55,.05]),[1.7,-.55,.9]);
  addPart(g,'storage',box(1.05,.18,.72,mats.blue(),[1.25,-1.55,.25]),[1.7,-1.5,.9]);
  addPart(g,'psu',box(1.75,1.25,1.45,new THREE.MeshStandardMaterial({color:0x24282c,metalness:.6,roughness:.42}),[1.05,-1.7,-.9]),[1.8,-1.4,-1.2]);
  addPart(g,'heatsink',cyl(.66,.55,mats.metal(),[-.2,.2,-.1],[Math.PI/2,0,0]),[-.3,1.8,.4]);
  for(const y of [-1.2,0,1.2])addPart(g,'fan',cyl(.55,.14,mats.dark(),[-1.95,y,.85],[0,0,Math.PI/2]),[-1.1,y*1.15,1.5]);
  addPart(g,'wifi',box(.65,.15,.36,mats.blue(),[-.2,-1.32,-.05]),[-.8,-1.4,.75]);
  addPart(g,'port',box(.85,.65,.12,mats.metal(),[-.1,1.6,-.52]),[0,1.35,-1.2]);
}

function createLabels(){
  labelsLayer.innerHTML='';labelNodes.clear();
  const seen=new Set();
  for(const root of clickableComponents){const key=root.userData.partKey;if(seen.has(key))continue;seen.add(key);const el=document.createElement('div');el.className='part-label';el.dataset.key=key;labelsLayer.appendChild(el);labelNodes.set(key,{el,root});}
  refreshLabelText();
}
function refreshLabelText(){for(const [key,o] of labelNodes){const d=componentData[key];o.el.textContent=d?(lang==='fa'?d.fa:d.en):key;}}

function buildRelations(){
  relationLines.clear();
  const pairs = activeDevice==='desktop' ? [['cpu','ram'],['cpu','gpu'],['psu','motherboard'],['motherboard','storage']] : [['cpu','ram'],['cpu','storage'],['motherboard','display'],['motherboard','wifi']];
  for(const [a,b] of pairs){const A=getPart(a),B=getPart(b);if(!A||!B)continue;const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const mat=new THREE.LineBasicMaterial({color:0x73c8ff,transparent:true,opacity:.0});const line=new THREE.Line(geo,mat);line.userData.ends=[A,B];relationLines.add(line);}
}
function getPart(key){return clickableComponents.find(o=>o.userData.partKey===key)}

function enterDevice(type){
  clickSound();mode='explorer';ui.roomHud.classList.add('hidden');ui.explorer.classList.remove('hidden');ui.info.classList.add('hidden');roomGroup.visible=false;explorerGroup.visible=true;buildDevice(type);ui.deviceTitle.textContent=names[type][lang];
  $('#cooling-btn').classList.toggle('hidden',!['laptop','desktop'].includes(type));
  camera.position.set(type==='desktop'?8:7,5.3,type==='desktop'?9:8);controls.target.set(0,0,0);controls.minDistance=3;controls.maxDistance=14;controls.maxPolarAngle=Math.PI*.85;controls.update();
  ui.assistant.textContent=lang==='fa'?'روی هر قطعه کلیک کن تا وظیفه‌اش را ببینی.':'Click any highlighted component to learn what it does.';
}
function exitToRoom(){
  clickSound();mode='room';activeDevice=null;roomGroup.visible=true;explorerGroup.visible=false;ui.roomHud.classList.remove('hidden');ui.explorer.classList.add('hidden');ui.info.classList.add('hidden');labelsLayer.innerHTML='';labelNodes.clear();relationsOn=false;coolingOn=false;relationLines.visible=false;coolingFX.clear();camera.position.set(8,6.4,11);controls.target.set(0,1.5,0);controls.minDistance=4;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.48;controls.update();ui.assistant.textContent=T[lang].assistant;
}

function selectPart(root){
  selectedPart=root;const key=root.userData.partKey;const d=componentData[key];if(!d)return;clickSound();ui.info.classList.remove('hidden');$('#info-name').textContent=lang==='fa'?d.fa:d.en;$('#info-role').textContent=lang==='fa'?d.roleFa:d.roleEn;$('#info-found').textContent=lang==='fa'?d.foundFa:d.foundEn;$('#info-works').textContent=lang==='fa'?d.worksFa:d.worksEn;
  clickableComponents.forEach(p=>{p.traverse(o=>{if(o.isMesh&&o.material){if(o.material.userData._savedOpacity===undefined){o.material.userData._savedOpacity=o.material.opacity;o.material.userData._savedTransparent=o.material.transparent;}if(p!==root){o.material.transparent=true;o.material.opacity=.34;}else{o.material.opacity=1;}}})});
}
function clearFocus(){selectedPart=null;ui.info.classList.add('hidden');clickableComponents.forEach(p=>p.traverse(o=>{if(o.isMesh&&o.material){const u=o.material.userData;if(u._savedOpacity!==undefined){o.material.opacity=u._savedOpacity;o.material.transparent=u._savedTransparent;delete u._savedOpacity;delete u._savedTransparent;}}}));targetCamera=null;}
function focusSelected(){if(!selectedPart)return;const p=new THREE.Vector3();selectedPart.getWorldPosition(p);controls.target.copy(p);const dir=camera.position.clone().sub(p).normalize();targetCamera=p.clone().add(dir.multiplyScalar(4.2));}

function toggleCooling(){
  if(!['laptop','desktop'].includes(activeDevice)){ui.assistant.textContent=T[lang].noCooling;return;}
  coolingOn=!coolingOn;$('#cooling-btn').setAttribute('aria-pressed',String(coolingOn));coolingFX.clear();if(!coolingOn)return;
  const cpu=getPart('cpu'), sink=getPart('heatsink')||getPart('fan'); if(!cpu||!sink)return;
  for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:i<9?0xff6f3d:0x73c8ff,transparent:true,opacity:.8}));m.userData.t=i/18;m.userData.cpu=cpu;m.userData.sink=sink;coolingFX.add(m);}ui.assistant.textContent=T[lang].coolingCopy;
}

function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);controls.update();
  const speed=reduceMotion?10:3.8;explodeProgress=THREE.MathUtils.lerp(explodeProgress,explodeTarget,1-Math.exp(-speed*dt));
  if(mode==='explorer'){
    for(const root of clickableComponents){if(!root.userData.base)continue;root.position.copy(root.userData.base).addScaledVector(root.userData.explode,explodeProgress);}
    updateLabels();updateRelations();updateCooling();
  }
  if(targetCamera){camera.position.lerp(targetCamera,1-Math.exp(-4*dt));if(camera.position.distanceTo(targetCamera)<.03)targetCamera=null;}
  if(mode==='room'){const t=clock.elapsedTime;clickableDevices.forEach((d,i)=>{d.position.y+=Math.sin(t*1.1+i)*.00025;});}
  renderer.render(scene,camera);
}
function updateLabels(){
  if(!labelsOn){labelsLayer.style.display='none';return}labelsLayer.style.display='block';
  const w=innerWidth,h=innerHeight;for(const {el,root} of labelNodes.values()){const v=new THREE.Vector3();root.getWorldPosition(v);v.project(camera);const visible=v.z>-1&&v.z<1;el.style.display=visible?'block':'none';if(!visible)continue;const x=(v.x*.5+.5)*w,y=(-v.y*.5+.5)*h;el.style.left=`${Math.max(45,Math.min(w-45,x))}px`;el.style.top=`${Math.max(96,Math.min(h-58,y))}px`;el.classList.toggle('behind',v.z>.9);}
}
function updateRelations(){relationLines.visible=relationsOn;if(!relationsOn)return;for(const line of relationLines.children){const [A,B]=line.userData.ends;const a=new THREE.Vector3(),b=new THREE.Vector3();A.getWorldPosition(a);B.getWorldPosition(b);line.geometry.setFromPoints([a,b]);line.material.opacity=.52+.22*Math.sin(clock.elapsedTime*3+line.id);}}
function updateCooling(){if(!coolingOn)return;for(const m of coolingFX.children){m.userData.t=(m.userData.t+.004)%1;const a=new THREE.Vector3(),b=new THREE.Vector3();m.userData.cpu.getWorldPosition(a);m.userData.sink.getWorldPosition(b);if(m.userData.t<.62){const t=m.userData.t/.62;m.position.lerpVectors(a,b,t);m.position.y+=Math.sin(t*Math.PI)*.28;}else{const t=(m.userData.t-.62)/.38;m.position.copy(b).add(new THREE.Vector3((Math.sin(m.id)*.3),t*2.2,Math.cos(m.id)*.3));}}}

function onPointerMove(e){
  const rect=canvas.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
  const objects=mode==='room'?clickableDevices.flatMap(g=>g.children):explorerGroup.children.flatMap(g=>g.children).flatMap(o=>o.isGroup?o.children:o);
  const hits=raycaster.intersectObjects(objects,true);hoverObject=hits.length?hits[0].object:null;
  let label='';if(hoverObject){if(mode==='room'){const root=hoverObject.userData.deviceRoot;label=root?names[root.userData.deviceType][lang]:'';}else{const root=hoverObject.userData.partRoot||hoverObject;const key=root.userData.partKey||hoverObject.userData.partKey;label=componentData[key]?(lang==='fa'?componentData[key].fa:componentData[key].en):'';}}
  hoverLabel.textContent=label;hoverLabel.style.left=e.clientX+'px';hoverLabel.style.top=e.clientY+'px';hoverLabel.classList.toggle('hidden',!label);canvas.style.cursor=label?'pointer':'grab';
}
function onClick(){if(!hoverObject)return;if(mode==='room'){const root=hoverObject.userData.deviceRoot;if(root)enterDevice(root.userData.deviceType);}else{const root=hoverObject.userData.partRoot||hoverObject;if(root.userData.partKey)selectPart(root);}}

function bindUI(){
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.45:1.8));});
  canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('click',onClick);
  $('#home-btn').onclick=exitToRoom;$('#back-btn').onclick=exitToRoom;
  $('#explode-btn').onclick=()=>{explodeTarget=1;clickSound()};$('#assemble-btn').onclick=()=>{explodeTarget=0;clickSound()};
  $('#reset-btn').onclick=()=>{if(mode==='explorer'){camera.position.set(activeDevice==='desktop'?8:7,5.3,activeDevice==='desktop'?9:8);controls.target.set(0,0,0)}else{camera.position.set(8,6.4,11);controls.target.set(0,1.5,0)}controls.update();clickSound()};
  $('#labels-btn').onclick=()=>{labelsOn=!labelsOn;applyLanguage();clickSound()};
  $('#relations-btn').onclick=()=>{relationsOn=!relationsOn;$('#relations-btn').setAttribute('aria-pressed',String(relationsOn));ui.assistant.textContent=relationsOn?T[lang].relationCopy:(mode==='explorer'?(lang==='fa'?'روی هر قطعه کلیک کن تا وظیفه‌اش را ببینی.':'Click any highlighted component to learn what it does.'):T[lang].assistant);clickSound()};
  $('#cooling-btn').onclick=()=>{toggleCooling();clickSound()};
  $('#focus-btn').onclick=focusSelected;$('#clear-focus-btn').onclick=clearFocus;$('#close-info').onclick=clearFocus;
  $('#drawer-close').onclick=()=>ui.drawer.classList.add('hidden');
  ui.lang.onclick=()=>{lang=lang==='en'?'fa':'en';localStorage.setItem('deviceRepairLang',lang);applyLanguage()};
  ui.sound.onclick=()=>{soundOn=!soundOn;ui.sound.setAttribute('aria-pressed',String(soundOn));ui.sound.textContent=soundOn?'🔊':'🔇';if(soundOn)clickSound()};
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>handleNav(b.dataset.nav));
}
function handleNav(nav){
  if(nav==='home')return exitToRoom();if(nav==='explorer'){if(activeDevice)return;openDevices();return}if(nav==='devices')return openDevices();if(nav==='learn')return openLearn();if(nav==='about')return openAbout();
}
function openDevices(){
  ui.drawer.classList.remove('hidden');$('#drawer-title').textContent=T[lang].devicesTitle;$('#drawer-kicker').textContent=lang==='fa'?'دستگاه‌ها':'DEVICES';$('#drawer-content').innerHTML=`<p>${T[lang].devicesCopy}</p><div class="device-menu">${Object.keys(names).map(k=>`<button data-device="${k}"><b>${names[k][lang]}</b><br><span>${lang==='fa'?'باز کردن در نمای سه‌بعدی':'Open in 3D inspection mode'}</span></button>`).join('')}</div>`;$('#drawer-content').querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>{ui.drawer.classList.add('hidden');enterDevice(b.dataset.device)});
}
function openLearn(){
  ui.drawer.classList.remove('hidden');$('#drawer-title').textContent=T[lang].learnTitle;$('#drawer-kicker').textContent=lang==='fa'?'آموزش':'LEARN';$('#drawer-content').innerHTML=`<div class="drawer-grid">${Object.values(componentData).slice(0,12).map(d=>`<div class="lesson"><b>${lang==='fa'?d.fa:d.en}</b><span>${lang==='fa'?d.roleFa:d.roleEn}</span></div>`).join('')}</div>`;
}
function openAbout(){ui.drawer.classList.remove('hidden');$('#drawer-title').textContent=T[lang].aboutTitle;$('#drawer-kicker').textContent='DEVICE REPAIR';$('#drawer-content').innerHTML=`<p>${T[lang].aboutCopy}</p><p class="cooling-note">${lang==='fa'?'این تجربه روی WebGL اجرا می‌شود و برای موبایل نیز کنترل لمسی، زوم و انتخاب قطعه دارد.':'The experience runs in real-time WebGL and includes touch rotation, pinch zoom and component selection on mobile.'}</p>`;}

function applyLanguage(){
  const t=T[lang];document.documentElement.lang=lang==='fa'?'fa':'en';document.documentElement.dir=lang==='fa'?'rtl':'ltr';ui.lang.textContent=lang==='fa'?'EN':'فارسی';
  const map={brandSub:'brand-sub',roomEyebrow:'room-eyebrow',roomTitle:'room-title',roomCopy:'room-copy',explorerEyebrow:'explorer-eyebrow',gesture:'gesture-tip',component:'info-kicker',role:'role-label',found:'found-label',works:'works-label'};for(const [k,id] of Object.entries(map))$('#'+id).textContent=t[k];
  $('#nav-home').textContent=t.home;$('#nav-devices').textContent=t.devices;$('#nav-explorer').textContent=t.explorer;$('#nav-learn').textContent=t.learn;$('#nav-about').textContent=t.about;$('#explode-btn').textContent=t.explode;$('#assemble-btn').textContent=t.assemble;$('#reset-btn').textContent=t.reset;$('#labels-btn').textContent=labelsOn?t.labelsOn:t.labelsOff;$('#labels-btn').setAttribute('aria-pressed',String(labelsOn));$('#relations-btn').textContent=t.relations;$('#cooling-btn').textContent=t.cooling;$('#focus-btn').textContent=t.focus;$('#clear-focus-btn').textContent=t.clear;$('#loader-copy').textContent=t.loading;ui.assistant.textContent=mode==='room'?t.assistant:(lang==='fa'?'روی هر قطعه کلیک کن تا وظیفه‌اش را ببینی.':'Click any highlighted component to learn what it does.');
  if(activeDevice)ui.deviceTitle.textContent=names[activeDevice][lang];
  const pills=$('#device-pills');pills.innerHTML=Object.keys(names).map(k=>`<button data-device="${k}">${names[k][lang]}</button>`).join('');pills.querySelectorAll('button').forEach(b=>b.onclick=()=>enterDevice(b.dataset.device));refreshLabelText();if(selectedPart)selectPart(selectedPart);
}

function animateLoader(){let p=0;const id=setInterval(()=>{p=Math.min(92,p+Math.ceil(Math.random()*10));progressBar.style.width=p+'%';progressText.textContent=p+'%';if(p>=92){clearInterval(id);setTimeout(()=>{progressBar.style.width='100%';progressText.textContent='100%';setTimeout(()=>loader.classList.add('done'),260)},260)}},100)}
function clickSound(){if(!soundOn)return;try{const C=window.AudioContext||window.webkitAudioContext;const ctx=clickSound.ctx||(clickSound.ctx=new C());const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(280,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(180,ctx.currentTime+.045);g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.06);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.065)}catch{}}

init();
