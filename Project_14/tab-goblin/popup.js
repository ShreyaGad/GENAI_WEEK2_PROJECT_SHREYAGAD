const $=(id)=>document.getElementById(id);
const DAY=24*60*60*1000;
let tabs=[];let kept=new Set();let savedSession=null;
const notice=(text,error=false)=>{$("notice").textContent=text;$("notice").className=`notice${error?" error":""}`;};
const tabKey=(tab)=>tab.url||`tab:${tab.id}`;
function ageText(last){if(!last)return"Not used yet";const days=Math.max(0,Math.floor((Date.now()-last)/DAY));if(days===0){const hours=Math.floor((Date.now()-last)/3600000);return hours<1?"Used less than an hour ago":`Used ${hours}h ago`;}return days===1?"1 day since use":`${days} days since use`;}
function formatTime(last){if(!last)return 0;return last;}

async function loadData(){
  const data=await chrome.storage.local.get({keptUrls:[],savedSession:null});kept=new Set(data.keptUrls);savedSession=data.savedSession;
  tabs=await chrome.tabs.query({currentWindow:true});
  // Do not offer restricted browser pages for sleeping or session restoration.
  render();
}

function render(){
  const sleepCount=tabs.filter(t=>t.discarded).length;const keepCount=tabs.filter(t=>kept.has(tabKey(t))).length;
  $("totalCount").textContent=tabs.length;$("sleepCount").textContent=sleepCount;$("keepCount").textContent=`${keepCount} protected`;
  const mood=$("mood");mood.className="mood";if(tabs.length>=30){mood.textContent="Goblin is full";mood.classList.add("full");}else if(tabs.length>=12){mood.textContent="Goblin is hungry";mood.classList.add("hungry");}else mood.textContent="Goblin is calm";
  const threshold=Number($("ageFilter").value)*DAY;
  const sorted=[...tabs].sort((a,b)=>{
    const ak=kept.has(tabKey(a)),bk=kept.has(tabKey(b));if(ak!==bk)return ak?1:-1;
    return formatTime(a.lastAccessed)-formatTime(b.lastAccessed);
  });
  const host=$("tabs");host.replaceChildren();$("empty").hidden=sorted.length>0;$("visibleCount").textContent=`${sorted.length} listed`;
  for(const tab of sorted){
    const isKept=kept.has(tabKey(tab));const age=Date.now()-(tab.lastAccessed||Date.now());
    const row=document.createElement("div");row.className=`tab-row${tab.active?" active":""}`;
    const icon=document.createElement("img");icon.className="favicon";icon.alt="";icon.src=tab.favIconUrl||"";icon.onerror=()=>{icon.style.visibility="hidden";};
    const info=document.createElement("div");info.className="tab-info";const title=document.createElement("span");title.className="tab-title";title.textContent=tab.title||tab.url||"Untitled tab";title.title=tab.url||"";
    const meta=document.createElement("span");meta.className="tab-meta";meta.textContent=tab.discarded?`Asleep · ${ageText(tab.lastAccessed)}`:ageText(tab.lastAccessed);info.append(title,meta);
    const keep=document.createElement("button");keep.className=`tab-button${isKept?" keep":""}`;keep.textContent=isKept?"Keep ✓":"Keep";keep.title=isKept?"Remove from Keep list":"Protect this tab";keep.addEventListener("click",()=>toggleKeep(tab));
    const sleep=document.createElement("button");sleep.className="tab-button";sleep.textContent=tab.discarded?"Asleep":"Sleep";sleep.disabled=tab.discarded||tab.active||isKept||!/^https?:/.test(tab.url||"")||age<threshold;sleep.title=tab.active?"The active tab cannot be discarded":isKept?"Remove from Keep list before sleeping":age<threshold?`Wait until this tab has been unused for ${$("ageFilter").selectedOptions[0].text}`:"Discard this tab to free memory";sleep.addEventListener("click",()=>discard(tab));
    row.append(icon,info,keep,sleep);host.append(row);
  }
  $("sessionLabel").textContent=savedSession?`${savedSession.tabs.length} tabs · saved ${new Date(savedSession.savedAt).toLocaleString()}`:"No saved session yet";
  $("restoreSession").disabled=!savedSession?.tabs?.length;
}

async function toggleKeep(tab){
  const key=tabKey(tab);if(kept.has(key))kept.delete(key);else kept.add(key);
  await chrome.storage.local.set({keptUrls:[...kept]});await loadData();
}
async function discard(tab){
  try{await chrome.tabs.discard(tab.id);notice(`Put “${tab.title||"tab"}” to sleep.`);await loadData();}
  catch(e){notice(e.message||"This tab could not be put to sleep.",true);}
}
async function feedGoblin(){
  const threshold=Number($("ageFilter").value)*DAY;const candidates=tabs.filter(t=>!t.discarded&&!t.active&&!kept.has(tabKey(t))&&/^https?:/.test(t.url||"")&&Date.now()-(t.lastAccessed||Date.now())>=threshold);
  if(!candidates.length){notice("No eligible tabs to sleep. Your Keep list is safe.");return;}
  $("sleepAll").disabled=true;let count=0;
  for(const tab of candidates){try{await chrome.tabs.discard(tab.id);count++;}catch{}}
  notice(`Goblin put ${count} tab${count===1?"":"s"} to sleep.`);await loadData();$("sleepAll").disabled=false;
}
async function saveSession(){
  const eligible=tabs.filter(t=>/^https?:/.test(t.url||""));
  const snapshot={savedAt:new Date().toISOString(),tabs:eligible.map(t=>({url:t.url,title:t.title||"Untitled tab"})),activeIndex:Math.max(0,eligible.findIndex(t=>t.active))};
  await chrome.storage.local.set({savedSession:snapshot});savedSession=snapshot;render();notice(`Saved ${snapshot.tabs.length} tabs for later.`);
}
async function restoreSession(){
  if(!savedSession?.tabs?.length)return;
  const urls=savedSession.tabs.map(t=>t.url);
  try{const win=await chrome.windows.create({url:urls,focused:true});if(win?.tabs?.length){const active=win.tabs[Math.min(savedSession.activeIndex,win.tabs.length-1)];if(active?.id)await chrome.tabs.update(active.id,{active:true});}notice(`Restored ${urls.length} saved tabs.`);}
  catch(e){notice(e.message||"Could not restore the saved session.",true);}
}

$("ageFilter").addEventListener("change",render);
$("sleepAll").addEventListener("click",feedGoblin);
$("saveSession").addEventListener("click",saveSession);
$("restoreSession").addEventListener("click",restoreSession);
loadData().catch(e=>notice(e.message||"Could not read open tabs.",true));
