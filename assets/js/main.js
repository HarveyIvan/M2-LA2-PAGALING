import * as THREE from '../../vendor/three/three.module.js';
import { FontLoader } from '../../vendor/three/FontLoader.js';
import { TextGeometry } from '../../vendor/three/TextGeometry.js';
import { createRain, advanceRain, paletteIndex, PALETTE } from './particles.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070c');
export const camera = new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,200);
export let renderer;
export const rain = createRain();
export const state = {elapsed:0,paused:false,colorIndex:0};
export let nameMesh;
const errorElement = document.querySelector('#error');
try {
  renderer = new THREE.WebGLRenderer({canvas:document.querySelector('#scene'),antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
} catch(error) {
  errorElement.textContent='WebGL 2 is unavailable. Please open this page in a browser with hardware acceleration enabled.';
  errorElement.hidden=false;
  throw error;
}
scene.add(rain.points);
scene.add(new THREE.HemisphereLight('#f4e5cb','#2b324c',2.5));
const keyLight = new THREE.DirectionalLight('#ffe2aa',3);
keyLight.position.set(-8,10,15);scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#bcdcff',2);
rimLight.position.set(10,0,-8);scene.add(rimLight);

function createWoodTexture() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c89554';ctx.fillRect(0,0,1024,256);
  let seed=84;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<1400;i++){
    const y=random()*256;ctx.strokeStyle=`rgba(76,40,12,${0.025+random()*0.17})`;
    ctx.lineWidth=0.4+random()*1.4;ctx.beginPath();ctx.moveTo(0,y);
    ctx.bezierCurveTo(300,y+random()*8,700,y-random()*8,1024,y);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.name='Procedural wooden grain';texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(0.15,0.65);
  return texture;
}

function fitCamera() {
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  const width=nameMesh?nameMesh.geometry.boundingBox.max.x-nameMesh.geometry.boundingBox.min.x:20;
  const distance=width/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.min(camera.aspect,1.8));
  camera.position.set(0,0,Math.max(23,distance*1.3));camera.lookAt(0,0,0);
}

export function step(deltaSeconds) {
  if(state.paused)return;
  advanceRain(rain.positions,rain.speeds,deltaSeconds);
  rain.attribute.needsUpdate=true;
  state.elapsed+=deltaSeconds;
  const nextIndex=paletteIndex(state.elapsed);
  if(nextIndex!==state.colorIndex){
    state.colorIndex=nextIndex;rain.material.color.setHex(PALETTE[nextIndex].color);
    document.querySelector('#colorLabel').textContent=`Color: ${PALETTE[nextIndex].name}`;
  }
  if(nameMesh){nameMesh.rotation.y=Math.sin(state.elapsed*0.28)*0.24;nameMesh.rotation.x=-0.09+Math.sin(state.elapsed*0.18)*0.07;}
}

export const ready = new FontLoader().loadAsync(new URL('../fonts/helvetiker_regular.typeface.json',import.meta.url).href).then(font=>{
  const geometry=new TextGeometry('HARVEY IVAN',{font,size:2.8,depth:0.65,curveSegments:8,bevelEnabled:true,bevelThickness:0.055,bevelSize:0.04,bevelSegments:3});
  geometry.center();geometry.computeBoundingBox();
  const wood=new THREE.MeshStandardMaterial({map:createWoodTexture(),roughness:0.66,metalness:0});
  nameMesh=new THREE.Mesh(geometry,wood);nameMesh.name='HARVEY IVAN';scene.add(nameMesh);fitCamera();
}).catch(error=>{errorElement.textContent='The local font could not load. Serve the project over HTTP using the README instructions.';errorElement.hidden=false;throw error;});
fitCamera();
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);fitCamera();});
document.querySelector('#pause').addEventListener('click',event=>{
  state.paused=!state.paused;event.currentTarget.textContent=state.paused?'Resume':'Pause';event.currentTarget.setAttribute('aria-pressed',String(state.paused));
});
let previousTime;
// requestAnimationFrame schedules finite work for each frame. No blocking infinite loop.
renderer.setAnimationLoop(time=>{
  if(previousTime!==undefined)step(Math.min((time-previousTime)/1000,0.1));
  previousTime=time;renderer.render(scene,camera);
});
