const $ = (id) => document.getElementById(id);
let currentKit = null;
const setMessage = (text, kind = "") => { $("message").textContent = text; $("message").className = `message ${kind}`; };
const tidyColor = (value) => value.replace(/\s+/g, " ").trim();

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function scanPage() {
  $("scanButton").disabled = true;
  setMessage("Inspecting visible elements…");
  try {
    const tab = await activeTab();
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw new Error("Open a regular website tab to scan it.");
    $("pageHost").textContent = new URL(tab.url).hostname;
    const [{ result }] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:() => {
      const colorMap = new Map(); const fontMap = new Map();
      const visible = (el) => { const r=el.getBoundingClientRect(), s=getComputedStyle(el); return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)>0; };
      const normalize = (s) => s.replace(/\s+/g," ").trim();
      const all = [...document.querySelectorAll("body *")].filter(visible).slice(0,5000);
      const addColor=(value,kind)=>{const v=normalize(value);if(!v||v==="transparent"||v.endsWith(", 0)"))return;const key=v.toLowerCase();const item=colorMap.get(key)||{value:v,count:0,kinds:new Set()};item.count++;item.kinds.add(kind);colorMap.set(key,item);};
      for(const el of all){const s=getComputedStyle(el);addColor(s.color,"text");addColor(s.backgroundColor,"background");addColor(s.borderTopColor,"border");const family=s.fontFamily.split(",")[0].replace(/["']/g,"").trim();const key=[family,s.fontWeight,s.fontSize].join("|");const item=fontMap.get(key)||{family,weight:s.fontWeight,size:s.fontSize,count:0};item.count++;fontMap.set(key,item);}
      const colors=[...colorMap.values()].sort((a,b)=>b.count-a.count).slice(0,16).map(x=>({...x,kinds:[...x.kinds]}));
      const fonts=[...fontMap.values()].sort((a,b)=>b.count-a.count).slice(0,12);
      return {title:document.title,url:location.href,colors,fonts,scannedAt:new Date().toISOString()};
    }});
    currentKit = result;
    renderKit(result);
    $("saveButton").disabled = false; $("exportButton").disabled = false;
    setMessage(`Found ${result.colors.length} colors and ${result.fonts.length} font styles.`, "success");
  } catch (error) { setMessage(error.message || "Could not scan this page.", "error"); }
  finally { $("scanButton").disabled = false; }
}

function renderKit(kit) {
  $("colorCount").textContent = kit.colors.length; $("fontCount").textContent = kit.fonts.length;
  const colors=$("colors"); colors.className="swatches"; colors.replaceChildren();
  kit.colors.forEach((item) => {const b=document.createElement("button");b.className="swatch";b.style.background=item.value;b.title=`${item.value} · used ${item.count} times · click to copy`;const label=document.createElement("span");label.textContent=item.value;b.append(label);b.addEventListener("click",()=>copyText(item.value,"Color copied."));colors.append(b);});
  const fonts=$("fonts"); fonts.className="font-list"; fonts.replaceChildren();
  kit.fonts.forEach((item)=>{const b=document.createElement("button");b.className="font-row";b.title="Click to copy font CSS";b.style.fontFamily=`${JSON.stringify(item.family)}, sans-serif`;const name=document.createElement("span");name.className="font-name";name.textContent=item.family;const meta=document.createElement("span");meta.className="font-meta";meta.textContent=`${item.weight} · ${item.size}`;b.append(name,meta);b.addEventListener("click",()=>copyText(`font-family: ${JSON.stringify(item.family)}; font-weight: ${item.weight}; font-size: ${item.size};`,"Font style copied."));fonts.append(b);});
}

async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); setMessage(message,"success"); }
  catch { setMessage("Clipboard access failed. Try again from the popup.","error"); }
}

function toCss(kit) {
  const slug=(s)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"style";
  const out=[`/* Style Spy kit: ${kit.name || kit.title || "Untitled"} */`,":root {"]; 
  kit.colors.forEach((c,i)=>out.push(`  --color-${slug(c.kinds[0]||"brand")}-${i+1}: ${c.value};`));
  kit.fonts.slice(0,8).forEach((f,i)=>{out.push(`  --font-family-${i+1}: ${JSON.stringify(f.family)};`);out.push(`  --font-weight-${i+1}: ${f.weight};`);out.push(`  --font-size-${i+1}: ${f.size};`);});
  out.push("}"); return out.join("\n");
}

async function loadSaved() {
  const {kits=[]} = await chrome.storage.local.get({kits:[]});
  $("savedCount").textContent=kits.length; const host=$("savedKits");host.replaceChildren();host.className=kits.length?"saved-list":"saved-list empty";
  if(!kits.length){host.textContent="Your saved kits stay on this device.";return;}
  kits.forEach((kit,index)=>{const row=document.createElement("div");row.className="kit-row";const info=document.createElement("div");info.className="kit-info";const title=document.createElement("strong");title.textContent=kit.name;const sub=document.createElement("small");sub.textContent=new URL(kit.url).hostname;info.append(title,sub);const chips=document.createElement("div");chips.className="mini-colors";kit.colors.slice(0,5).forEach(c=>{const chip=document.createElement("i");chip.className="mini-color";chip.style.background=c.value;chips.append(chip);});const exportBtn=document.createElement("button");exportBtn.className="kit-action";exportBtn.textContent="CSS";exportBtn.addEventListener("click",()=>copyText(toCss(kit),"Saved kit CSS copied."));const del=document.createElement("button");del.className="kit-action delete";del.textContent="Remove";del.addEventListener("click",async()=>{const latest=await chrome.storage.local.get({kits:[]});latest.kits.splice(index,1);await chrome.storage.local.set({kits:latest.kits});loadSaved();});row.append(info,chips,exportBtn,del);host.append(row);});
}

$("scanButton").addEventListener("click",scanPage);
$("saveButton").addEventListener("click",async()=>{if(!currentKit)return;const name=$("kitName").value.trim()||currentKit.title||"Untitled style kit";const {kits=[]}=await chrome.storage.local.get({kits:[]});kits.unshift({...currentKit,name});await chrome.storage.local.set({kits:kits.slice(0,30)});$("kitName").value="";setMessage(`Saved “${name}” on this device.`,"success");loadSaved();});
$("exportButton").addEventListener("click",()=>{if(currentKit)copyText(toCss(currentKit),"CSS variables copied.");});
(async()=>{await loadSaved();const tab=await activeTab().catch(()=>null);if(tab?.url){try{$("pageHost").textContent=new URL(tab.url).hostname;}catch{}}})();
