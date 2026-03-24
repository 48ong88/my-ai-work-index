import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis,
} from "recharts";

const T = {
  cream:"#faf6ef",paper:"#f3ece0",green:"#0d3d2b",greenMid:"#1a5c3f",greenLt:"#d4ede3",
  red:"#c41e3a",redLt:"#fce8eb",amber:"#d4860a",amberLt:"#fdf3dc",
  ink:"#1c1810",muted:"#7a6e5f",border:"#ddd5c5",sideW:260,
};
const RISK_PALETTE={"Very Low":"#0d3d2b","Low":"#2d7a4f","Moderate":"#d4860a","High":"#c05a1a","Very High":"#c41e3a"};
const IMPACT_PALETTE={"At Risk":"#c41e3a","Augmented":"#0d3d2b","Stable":"#2d7a4f","Mixed":"#d4860a"};

const STATE_REGIONS=[
  {region:"Peninsular Malaysia",states:[
    {id:"johor",    name:"Johor",          short:"JHR",gdp:"RM 180B",topSectors:["Manufacturing","Logistics","Agriculture","Tourism"],    medianSalary:2800,unemployment:3.1,highlight:"Gateway to Singapore — manufacturing & logistics corridor"},
    {id:"kedah",    name:"Kedah",           short:"KDH",gdp:"RM 42B", topSectors:["Agriculture","Manufacturing","Education"],              medianSalary:2100,unemployment:3.8,highlight:"Rice bowl of Malaysia — paddy farming & light manufacturing"},
    {id:"kelantan", name:"Kelantan",        short:"KTN",gdp:"RM 28B", topSectors:["Agriculture","Government","Retail"],                   medianSalary:1900,unemployment:4.2,highlight:"Agriculture-heavy economy with strong public sector"},
    {id:"melaka",   name:"Melaka",          short:"MLK",gdp:"RM 48B", topSectors:["Tourism","Manufacturing","Retail"],                    medianSalary:2500,unemployment:2.9,highlight:"Historic UNESCO city — tourism & light manufacturing"},
    {id:"nsembilan",name:"Negeri Sembilan", short:"NSN",gdp:"RM 56B", topSectors:["Manufacturing","Agriculture","Services"],              medianSalary:2700,unemployment:3.0,highlight:"Automotive & industrial manufacturing hub"},
    {id:"pahang",   name:"Pahang",          short:"PHG",gdp:"RM 58B", topSectors:["Agriculture","Tourism","Mining"],                     medianSalary:2200,unemployment:3.5,highlight:"Largest peninsular state — forests, mining & eco-tourism"},
    {id:"penang",   name:"Pulau Pinang",    short:"PNG",gdp:"RM 140B",topSectors:["Electronics","ICT","Tourism","Services"],              medianSalary:3400,unemployment:2.4,highlight:"Silicon Valley of the East — semiconductor & tech manufacturing"},
    {id:"perak",    name:"Perak",           short:"PRK",gdp:"RM 70B", topSectors:["Manufacturing","Mining","Agriculture"],                medianSalary:2400,unemployment:3.3,highlight:"Mining heritage transitioning to manufacturing & tourism"},
    {id:"perlis",   name:"Perlis",          short:"PLS",gdp:"RM 12B", topSectors:["Agriculture","Education","Services"],                  medianSalary:1950,unemployment:3.7,highlight:"Smallest state — sugarcane agriculture & border trade"},
    {id:"selangor", name:"Selangor",        short:"SGR",gdp:"RM 340B",topSectors:["Manufacturing","ICT","Logistics","Finance"],           medianSalary:3800,unemployment:2.6,highlight:"Economic powerhouse — largest GDP, ICT & industrial corridor"},
    {id:"terengganu",name:"Terengganu",     short:"TRG",gdp:"RM 52B", topSectors:["Oil & Gas","Fishing","Tourism"],                      medianSalary:2300,unemployment:3.6,highlight:"Oil & gas heartland with growing tourism"},
  ]},
  {region:"East Malaysia",states:[
    {id:"sabah",  name:"Sabah",   short:"SBH",gdp:"RM 98B", topSectors:["Agriculture","Tourism","Government","Fishing"],       medianSalary:2100,unemployment:5.1,highlight:"Biodiversity & palm oil agriculture — growing eco-tourism"},
    {id:"sarawak",name:"Sarawak", short:"SWK",gdp:"RM 155B",topSectors:["Oil & Gas","Agriculture","Government","Construction"],medianSalary:2600,unemployment:3.8,highlight:"Resource-rich — LNG, timber & expanding digital economy"},
  ]},
  {region:"Federal Territories",states:[
    {id:"kl",       name:"Kuala Lumpur",short:"KUL",gdp:"RM 280B",topSectors:["Finance","ICT","Professional Services","Retail"],medianSalary:5200,unemployment:2.8,highlight:"Financial & business capital — highest concentration of PMETs"},
    {id:"putrajaya",name:"Putrajaya",   short:"PJY",gdp:"RM 18B", topSectors:["Government","Administration","Services"],       medianSalary:4100,unemployment:2.1,highlight:"Federal administrative centre — government-dominated economy"},
    {id:"labuan",   name:"Labuan",      short:"LBN",gdp:"RM 22B", topSectors:["Finance","Oil & Gas","Tourism"],                medianSalary:3100,unemployment:3.2,highlight:"International offshore financial centre & oil services hub"},
  ]},
];
const ALL_STATES=STATE_REGIONS.flatMap(r=>r.states);

const OCC_SECTORS={
  1:["Government","Services","Finance"],2:["Services","Finance","ICT"],3:["Finance","Services"],
  4:["Services","Retail","Logistics"],5:["Finance","Government"],6:["Logistics","Oil & Gas"],
  7:["Finance","Government"],8:["Manufacturing","Agriculture"],9:["Manufacturing","Electronics"],
  10:["Services","Retail"],11:["Finance","Professional Services"],12:["Services","Retail","ICT"],
  13:["ICT","Services","Education"],14:["Finance","ICT"],15:["Finance","Professional Services","Government"],
  16:["ICT","Services"],17:["Services","Government"],18:["Government","Services"],
  19:["Finance","Oil & Gas"],20:["ICT","Electronics"],21:["ICT","Electronics"],
  22:["ICT","Services"],23:["Agriculture","Oil & Gas","Construction"],24:["Construction","Government"],
  25:["Construction","Oil & Gas","Government"],26:["Oil & Gas","Agriculture"],27:["Finance","Government"],
  28:["Finance","Services"],29:["Electronics","Manufacturing","Oil & Gas"],30:["Government","Services"],
  31:["Government","Services"],32:["Government","Education"],33:["Construction","Manufacturing"],
  34:["Government","Services"],35:["Government","Services"],36:["Government","Services"],
  37:["Agriculture"],38:["Oil & Gas","Logistics"],39:["ICT","Finance"],40:["ICT","Finance"],
  41:["ICT","Electronics"],42:["Professional Services","Finance"],43:["Construction","Government"],
  44:["Construction","Manufacturing"],45:["Government","Services"],46:["Government","Logistics"],
  47:["Tourism","Services"],48:["Government","Finance"],
};

function getRelevance(id,sectors){
  if(!sectors)return"all";
  const hits=(OCC_SECTORS[id]||[]).filter(s=>sectors.includes(s)).length;
  return hits>=2?"primary":hits===1?"secondary":"other";
}

const OCCUPATIONS=[
  {id:1,code:"4110",title:"General Office Clerk",group:"Clerical Support",risk:78,salary:2100,impact:"At Risk",demand:false,myscol:false,workers:280000},
  {id:2,code:"4312",title:"Data Entry Clerk",group:"Clerical Support",risk:82,salary:1800,impact:"At Risk",demand:false,myscol:false,workers:95000},
  {id:3,code:"4313",title:"Accounting & Bookkeeping Clerk",group:"Clerical Support",risk:75,salary:2400,impact:"At Risk",demand:false,myscol:false,workers:110000},
  {id:4,code:"4229",title:"Customer Service Clerk",group:"Clerical Support",risk:71,salary:2200,impact:"At Risk",demand:false,myscol:false,workers:145000},
  {id:5,code:"4321",title:"Payroll Clerk",group:"Clerical Support",risk:74,salary:2600,impact:"At Risk",demand:false,myscol:false,workers:42000},
  {id:6,code:"3322",title:"Shipping & Customs Agent",group:"Assoc. Professionals",risk:69,salary:3100,impact:"At Risk",demand:false,myscol:false,workers:38000},
  {id:7,code:"4311",title:"Statistical & Finance Clerk",group:"Clerical Support",risk:72,salary:2500,impact:"At Risk",demand:false,myscol:false,workers:55000},
  {id:8,code:"9411",title:"Food Processing Worker",group:"Elem. Occupations",risk:66,salary:1700,impact:"At Risk",demand:false,myscol:false,workers:310000},
  {id:9,code:"8122",title:"Production Line Operator",group:"Plant & Machine Ops",risk:63,salary:1900,impact:"At Risk",demand:false,myscol:false,workers:520000},
  {id:10,code:"4225",title:"Call Centre Agent",group:"Clerical Support",risk:68,salary:2300,impact:"At Risk",demand:false,myscol:false,workers:88000},
  {id:11,code:"2411",title:"Accountant",group:"Professionals",risk:54,salary:5800,impact:"At Risk",demand:false,myscol:false,workers:95000},
  {id:12,code:"2431",title:"Marketing Professional",group:"Professionals",risk:49,salary:5200,impact:"Augmented",demand:false,myscol:false,workers:62000},
  {id:13,code:"2641",title:"Author / Content Writer",group:"Professionals",risk:52,salary:4100,impact:"Augmented",demand:false,myscol:false,workers:28000},
  {id:14,code:"2413",title:"Financial Analyst",group:"Professionals",risk:58,salary:7200,impact:"At Risk",demand:true,myscol:true,workers:44000},
  {id:15,code:"2424",title:"HR Executive / Manager",group:"Professionals",risk:44,salary:6100,impact:"Augmented",demand:false,myscol:false,workers:58000},
  {id:16,code:"2166",title:"Graphic Designer",group:"Professionals",risk:50,salary:4500,impact:"Augmented",demand:false,myscol:false,workers:35000},
  {id:17,code:"2642",title:"Journalist / Reporter",group:"Professionals",risk:48,salary:4200,impact:"Augmented",demand:false,myscol:false,workers:18000},
  {id:18,code:"3341",title:"Administrative Officer",group:"Assoc. Professionals",risk:55,salary:3800,impact:"At Risk",demand:false,myscol:false,workers:175000},
  {id:19,code:"2412",title:"Insurance Analyst",group:"Professionals",risk:56,salary:5600,impact:"At Risk",demand:false,myscol:false,workers:31000},
  {id:20,code:"2512",title:"Software Developer",group:"Professionals",risk:38,salary:6800,impact:"Augmented",demand:true,myscol:true,workers:82000},
  {id:21,code:"2514",title:"Application Programmer",group:"Professionals",risk:42,salary:6200,impact:"Augmented",demand:true,myscol:true,workers:55000},
  {id:22,code:"3521",title:"ICT Operations Technician",group:"Assoc. Professionals",risk:35,salary:4100,impact:"Augmented",demand:true,myscol:false,workers:42000},
  {id:23,code:"2149",title:"Drone / UAV Pilot & Operator",group:"Professionals",risk:33,salary:4800,impact:"Augmented",demand:true,myscol:false,workers:4200},
  {id:24,code:"3118",title:"Civil Engineering Technician",group:"Assoc. Professionals",risk:29,salary:3600,impact:"Augmented",demand:false,myscol:false,workers:68000},
  {id:25,code:"2142",title:"Civil Engineer",group:"Professionals",risk:24,salary:6500,impact:"Stable",demand:true,myscol:true,workers:72000},
  {id:26,code:"2131",title:"Biologist / Life Scientist",group:"Professionals",risk:30,salary:5800,impact:"Augmented",demand:true,myscol:false,workers:22000},
  {id:27,code:"2633",title:"Economist",group:"Professionals",risk:36,salary:6400,impact:"Augmented",demand:false,myscol:false,workers:12000},
  {id:28,code:"4311",title:"Accounting Technician",group:"Assoc. Professionals",risk:45,salary:3400,impact:"At Risk",demand:false,myscol:false,workers:65000},
  {id:29,code:"2153",title:"Electrical Engineer",group:"Professionals",risk:26,salary:6900,impact:"Stable",demand:true,myscol:true,workers:48000},
  {id:30,code:"2211",title:"General Medical Practitioner",group:"Professionals",risk:7,salary:12000,impact:"Stable",demand:true,myscol:true,workers:35000},
  {id:31,code:"2221",title:"Registered Nurse",group:"Professionals",risk:9,salary:4500,impact:"Stable",demand:true,myscol:true,workers:125000},
  {id:32,code:"2310",title:"Secondary School Teacher",group:"Professionals",risk:27,salary:5100,impact:"Stable",demand:false,myscol:false,workers:185000},
  {id:33,code:"7411",title:"Electrician",group:"Craftsmen & Trades",risk:19,salary:2900,impact:"Stable",demand:true,myscol:false,workers:132000},
  {id:34,code:"2635",title:"Social Worker",group:"Professionals",risk:11,salary:3800,impact:"Stable",demand:false,myscol:false,workers:29000},
  {id:35,code:"2212",title:"Specialist Physician",group:"Professionals",risk:4,salary:18000,impact:"Stable",demand:true,myscol:true,workers:18000},
  {id:36,code:"2213",title:"Dentist",group:"Professionals",risk:5,salary:10000,impact:"Stable",demand:true,myscol:true,workers:14000},
  {id:37,code:"6111",title:"Paddy / Crop Farmer",group:"Agriculture & Fishery",risk:39,salary:1800,impact:"Mixed",demand:false,myscol:false,workers:340000},
  {id:38,code:"3152",title:"Ship / Marine Officer",group:"Assoc. Professionals",risk:15,salary:7200,impact:"Stable",demand:true,myscol:true,workers:22000},
  {id:39,code:"2513",title:"Cybersecurity Analyst",group:"Professionals",risk:22,salary:8500,impact:"Augmented",demand:true,myscol:true,workers:18000},
  {id:40,code:"2521",title:"Data Scientist / AI Engineer",group:"Professionals",risk:18,salary:9200,impact:"Augmented",demand:true,myscol:true,workers:12000},
  {id:41,code:"2522",title:"Cloud & DevOps Engineer",group:"Professionals",risk:25,salary:8800,impact:"Augmented",demand:true,myscol:true,workers:9500},
  {id:42,code:"2611",title:"Lawyer / Legal Counsel",group:"Professionals",risk:31,salary:9500,impact:"Augmented",demand:false,myscol:false,workers:31000},
  {id:43,code:"3123",title:"Construction Site Supervisor",group:"Assoc. Professionals",risk:21,salary:4200,impact:"Stable",demand:false,myscol:false,workers:94000},
  {id:44,code:"7412",title:"Plumber & Pipefitter",group:"Craftsmen & Trades",risk:16,salary:2700,impact:"Stable",demand:false,myscol:false,workers:78000},
  {id:45,code:"3258",title:"Community Health Worker",group:"Assoc. Professionals",risk:14,salary:3100,impact:"Stable",demand:false,myscol:false,workers:45000},
  {id:46,code:"3331",title:"Customs & Border Officer",group:"Assoc. Professionals",risk:28,salary:4100,impact:"Stable",demand:false,myscol:false,workers:32000},
  {id:47,code:"3433",title:"Gallery & Museum Technician",group:"Assoc. Professionals",risk:47,salary:3200,impact:"Augmented",demand:false,myscol:false,workers:9000},
  {id:48,code:"3314",title:"Statistical Technician",group:"Assoc. Professionals",risk:32,salary:3800,impact:"Augmented",demand:false,myscol:false,workers:18000},
];

const ALL_GROUPS=[...new Set(OCCUPATIONS.map(o=>o.group))];
const ALL_IMPACTS=["At Risk","Augmented","Stable","Mixed"];
const ALL_BANDS=["Very Low","Low","Moderate","High","Very High"];

function getRiskBand(r){return r<=15?"Very Low":r<=30?"Low":r<=55?"Moderate":r<=70?"High":"Very High";}
function fmtRM(n){return`RM ${n.toLocaleString()}`;}

function RiskGauge({value,size=72}){
  const band=getRiskBand(value),color=RISK_PALETTE[band],r=(size/2)-8,circ=2*Math.PI*r,arc=(value/100)*circ*0.75;
  return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth="5.5" strokeDasharray={`${circ*.75} ${circ*.25}`} strokeLinecap="round" transform={`rotate(-225 ${size/2} ${size/2})`}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5.5" strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" transform={`rotate(-225 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray .5s ease"}}/>
    <text x={size/2} y={size/2+2} textAnchor="middle" dominantBaseline="middle" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:size*.22,fontWeight:700,fill:color}}>{value}%</text>
  </svg>);
}

function OccCard({occ,onClick,selected,relevance}){
  const band=getRiskBand(occ.risk),color=RISK_PALETTE[band],[hov,setHov]=useState(false),dimmed=relevance==="other";
  return(<div onClick={()=>onClick(occ)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:selected?T.greenLt:hov?"#f0ebe1":"#fff",border:selected?`2px solid ${T.green}`:relevance==="primary"?`2px solid ${T.amber}`:`1.5px solid ${T.border}`,borderRadius:8,padding:"1rem",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .18s ease",transform:hov&&!selected?"translateY(-2px)":"none",boxShadow:selected?`0 0 0 3px ${T.greenLt}`:hov?"0 4px 16px rgba(13,61,43,.1)":"none",opacity:dimmed?.4:1}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
    {relevance==="primary"&&<div style={{position:"absolute",top:6,right:8,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",color:T.amber,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>◆ Featured</div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
      <div style={{flex:1}}>
        <p style={{fontSize:9,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",margin:"0 0 4px",fontFamily:"'DM Sans',sans-serif"}}>{occ.group} · MASCO {occ.code}</p>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:700,margin:"0 0 6px",color:T.ink,lineHeight:1.2}}>{occ.title}</h3>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:color+"18",color,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>{band}</span>
          <span style={{fontSize:9,color:IMPACT_PALETTE[occ.impact],fontFamily:"'DM Sans',sans-serif"}}>● {occ.impact}</span>
          {occ.myscol&&<span style={{fontSize:9,color:T.amber,fontFamily:"'DM Sans',sans-serif"}}>★ MyCOL</span>}
        </div>
      </div>
      <RiskGauge value={occ.risk} size={62}/>
    </div>
    <div style={{marginTop:"0.65rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:700,color:T.green}}>{fmtRM(occ.salary)}<span style={{fontSize:10,fontWeight:400,color:T.muted}}>/mo</span></span>
      <span style={{fontSize:9,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>~{occ.workers>=100000?(occ.workers/1000).toFixed(0)+"K":occ.workers.toLocaleString()} workers</span>
    </div>
  </div>);
}

function OccTable({items,onClick,selectedId}){
  return(
    <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,overflow:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}>
        <thead>
          <tr style={{background:T.cream}}>
            {["Occupation","Group","AI Risk","Impact","Median Salary","Workers"].map(h=>(
              <th key={h} style={{textAlign:h==="Occupation"?"left":"right",padding:"11px 12px",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,fontFamily:"'DM Sans',sans-serif",borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(occ=>{
            const selected=selectedId===occ.id;
            const band=getRiskBand(occ.risk);
            return(
              <tr key={occ.id} onClick={()=>onClick(occ)} style={{cursor:"pointer",background:selected?T.greenLt:"#fff"}}>
                <td style={{padding:"11px 12px",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink,fontFamily:"'DM Sans',sans-serif"}}>{occ.title}</div>
                  <div style={{fontSize:10,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>MASCO {occ.code}</div>
                </td>
                <td style={{padding:"11px 12px",textAlign:"right",fontSize:11,color:T.muted,fontFamily:"'DM Sans',sans-serif",borderBottom:`1px solid ${T.border}`}}>{occ.group}</td>
                <td style={{padding:"11px 12px",textAlign:"right",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:11,fontWeight:700,color:RISK_PALETTE[band],fontFamily:"'DM Sans',sans-serif"}}>{occ.risk}%</span>
                </td>
                <td style={{padding:"11px 12px",textAlign:"right",fontSize:11,color:IMPACT_PALETTE[occ.impact],fontFamily:"'DM Sans',sans-serif",borderBottom:`1px solid ${T.border}`}}>{occ.impact}</td>
                <td style={{padding:"11px 12px",textAlign:"right",fontSize:12,fontWeight:600,color:T.green,fontFamily:"'DM Sans',sans-serif",borderBottom:`1px solid ${T.border}`}}>{fmtRM(occ.salary)}</td>
                <td style={{padding:"11px 12px",textAlign:"right",fontSize:11,color:T.muted,fontFamily:"'DM Sans',sans-serif",borderBottom:`1px solid ${T.border}`}}>{occ.workers.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailDrawer({occ,onClose,isMobile}){
  if(!occ)return null;
  const band=getRiskBand(occ.risk),color=RISK_PALETTE[band];
  const rd=[{subject:"AI Exposure",A:occ.risk},{subject:"Salary Resilience",A:Math.min(100,Math.round(occ.salary/180))},{subject:"Labour Demand",A:occ.demand?72:35},{subject:"Human Bottleneck",A:Math.max(5,100-occ.risk-8)},{subject:"MyCOL Priority",A:occ.myscol?85:20}];
  return(<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(13,61,43,.25)",zIndex:299,backdropFilter:"blur(2px)",WebkitBackdropFilter:"blur(2px)"}}/>
    <div style={{position:"fixed",right:0,top:0,bottom:0,width:isMobile?"100%":390,background:"#fff",borderLeft:isMobile?"none":`1px solid ${T.border}`,zIndex:300,overflowY:"auto",boxShadow:isMobile?"none":"-8px 0 32px rgba(13,61,43,.12)",display:"flex",flexDirection:"column"}}>
      <div style={{background:T.green,padding:isMobile?"1rem":"1.25rem 1.5rem",position:"sticky",top:0,zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontSize:9,letterSpacing:"0.14em",color:"rgba(255,255,255,.6)",margin:"0 0 4px",textTransform:"uppercase",fontFamily:"'DM Sans',sans-serif"}}>{occ.group} · MASCO {occ.code}</p>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#fff",margin:0,lineHeight:1.2}}>{occ.title}</h2>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>
      <div style={{padding:isMobile?"1rem":"1.5rem",flex:1}}>
        <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row",gap:isMobile?12:20,marginBottom:"1.5rem",padding:"1rem",background:T.cream,borderRadius:8,border:`1px solid ${T.border}`}}>
          <RiskGauge value={occ.risk} size={90}/>
          <div>
            <p style={{fontSize:9,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",margin:"0 0 4px",fontFamily:"'DM Sans',sans-serif"}}>AI Pressure Score</p>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color}}>{band} Risk</div>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <span style={{fontSize:10,color:IMPACT_PALETTE[occ.impact],fontFamily:"'DM Sans',sans-serif"}}>● {occ.impact}</span>
              {occ.myscol&&<span style={{fontSize:10,color:T.amber,fontFamily:"'DM Sans',sans-serif"}}>★ MyCOL 2024/25</span>}
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:"1.5rem"}}>
          {[{label:"Median Salary",val:fmtRM(occ.salary)+"/mo",bg:T.greenLt,tc:T.green},{label:"Est. Workers",val:occ.workers>=100000?(occ.workers/1000).toFixed(0)+"K":occ.workers.toLocaleString(),bg:T.amberLt,tc:T.amber}].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:6,padding:"0.85rem"}}>
              <p style={{fontSize:9,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",margin:"0 0 4px",fontFamily:"'DM Sans',sans-serif"}}>{s.label}</p>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:s.tc}}>{s.val}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:9,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Structural Profile</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={rd} margin={{top:10,right:20,bottom:10,left:20}}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="subject" tick={{fill:T.muted,fontSize:9,fontFamily:"'DM Sans',sans-serif"}}/>
            <Radar dataKey="A" stroke={T.green} fill={T.green} fillOpacity={0.18} strokeWidth={1.5}/>
          </RadarChart>
        </ResponsiveContainer>
        <div style={{background:T.cream,borderRadius:6,padding:"1rem",border:`1px solid ${T.border}`,marginTop:8}}>
          <p style={{fontSize:9,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif"}}>AI Pressure Context</p>
          <p style={{fontSize:12,color:T.ink,lineHeight:1.75,margin:0,fontFamily:"'DM Sans',sans-serif"}}>
            {occ.risk>=65?`${occ.title} faces very high structural AI pressure. Routine data processing, rule-based decisions, and repetitive communication overlap heavily with current LLM and automation capabilities. Reskilling towards supervisory or advisory roles is recommended.`:occ.risk>=45?`${occ.title} faces moderate AI exposure. Some tasks will be augmented or partially automated, but domain expertise and client relationships remain important. Adopting AI tools within this profession will be key.`:occ.risk>=25?`${occ.title} shows low-to-moderate AI pressure. Physical presence, professional responsibility, or creative judgment creates a meaningful human bottleneck. AI will augment rather than replace in the near term.`:`${occ.title} has strong structural resilience to AI displacement. High-stakes judgment, physical dexterity, regulatory accountability, or human empathy protect this role well into the decade.`}
          </p>
        </div>
      </div>
    </div>
  </>);
}

function StateSidebar({selectedState,onSelect,isMobile}){
  if(isMobile){
    return(
      <section style={{borderBottom:`1px solid ${T.border}`,background:"#fff",padding:"0.85rem 0.9rem"}}>
        <p style={{fontSize:9,letterSpacing:"0.16em",color:T.muted,textTransform:"uppercase",margin:"0 0 0.55rem",fontFamily:"'DM Sans',sans-serif"}}>Filter by State</p>
        <select
          value={selectedState?.id??"all"}
          onChange={(e)=>onSelect(ALL_STATES.find(st=>st.id===e.target.value)??null)}
          style={{width:"100%",border:`1.5px solid ${T.border}`,background:T.cream,color:T.ink,padding:"10px 12px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none"}}
        >
          <option value="all">🇲🇾 All Malaysia</option>
          {STATE_REGIONS.map(rg=>(
            <optgroup key={rg.region} label={rg.region}>
              {rg.states.map(st=><option key={st.id} value={st.id}>{st.short} · {st.name}</option>)}
            </optgroup>
          ))}
        </select>
      </section>
    );
  }
  return(
    <aside style={{width:T.sideW,flexShrink:0,position:"sticky",top:60,height:"calc(100vh - 60px)",overflowY:"auto",borderRight:`1px solid ${T.border}`,background:"#fff",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"1rem 1.1rem 0.8rem",borderBottom:`1px solid ${T.border}`,background:T.cream}}>
        <p style={{fontSize:9,letterSpacing:"0.18em",color:T.muted,textTransform:"uppercase",margin:"0 0 4px",fontFamily:"'DM Sans',sans-serif"}}>Filter by State</p>
        <p style={{fontSize:11,color:T.muted,margin:0,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>Select a state to recontextualise results.</p>
      </div>
      <div style={{padding:"0.65rem 0.85rem",borderBottom:`1px solid ${T.border}`}}>
        <button onClick={()=>onSelect(null)} style={{width:"100%",textAlign:"left",border:"none",cursor:"pointer",padding:"8px 12px",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,transition:"all .14s",background:!selectedState?T.green:T.cream,color:!selectedState?"#fff":T.ink,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:15}}>🇲🇾</span>All Malaysia{!selectedState&&<span style={{marginLeft:"auto",fontSize:11,opacity:.8}}>✓</span>}
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {STATE_REGIONS.map(rg=>(
          <div key={rg.region}>
            <div style={{padding:"0.8rem 1.1rem 0.35rem",display:"flex",alignItems:"center",gap:6}}>
              <div style={{flex:1,height:1,background:T.border}}/>
              <span style={{fontSize:8,letterSpacing:"0.16em",color:T.muted,textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>{rg.region}</span>
              <div style={{flex:1,height:1,background:T.border}}/>
            </div>
            <div style={{padding:"0 0.7rem 0.4rem"}}>
              {rg.states.map(st=>{
                const active=selectedState?.id===st.id;
                return(<button key={st.id} onClick={()=>onSelect(st)} style={{width:"100%",textAlign:"left",border:"none",cursor:"pointer",padding:"7px 10px",borderRadius:7,marginBottom:2,fontFamily:"'DM Sans',sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:9,transition:"all .13s",background:active?T.greenLt:"transparent",color:active?T.green:T.ink,fontWeight:active?600:400}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.paper;}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
                  <span style={{fontSize:9,padding:"2px 5px",borderRadius:3,letterSpacing:"0.06em",fontWeight:700,minWidth:30,textAlign:"center",background:active?T.green:T.paper,color:active?"#fff":T.muted,fontFamily:"'DM Sans',sans-serif",transition:"all .13s"}}>{st.short}</span>
                  <span style={{flex:1}}>{st.name}</span>
                  {active&&<span style={{fontSize:12,color:T.greenMid}}>›</span>}
                </button>);
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"0.75rem 1.1rem",borderTop:`1px solid ${T.border}`,background:T.cream}}>
        <p style={{fontSize:9,color:T.muted,lineHeight:1.6,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Economic profiles: DOSM & TalentCorp 2024/25. Sector relevance is indicative.</p>
      </div>
    </aside>
  );
}

function StateBanner({state,onClear,isMobile}){
  if(!state)return null;
  return(
    <div style={{background:T.green,borderRadius:10,padding:isMobile?"1rem":"1.25rem 1.5rem",marginBottom:"1.5rem",display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",right:0,top:0,bottom:0,width:180,opacity:.06}} viewBox="0 0 180 120" preserveAspectRatio="xMidYMid slice">
        {[80,60,40,20].map((r,i)=><circle key={i} cx="180" cy="60" r={r} fill="none" stroke="#fff" strokeWidth="30"/>)}
      </svg>
      <div style={{flex:1}}>
        <p style={{fontSize:9,letterSpacing:"0.18em",color:"rgba(255,255,255,.5)",textTransform:"uppercase",margin:"0 0 3px",fontFamily:"'DM Sans',sans-serif"}}>Viewing · {STATE_REGIONS.find(r=>r.states.find(s=>s.id===state.id))?.region}</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"#fff",margin:"0 0 5px",lineHeight:1.1}}>{state.name}</h2>
        <p style={{fontSize:12,color:"rgba(255,255,255,.65)",margin:"0 0 12px",fontFamily:"'DM Sans',sans-serif",maxWidth:460}}>{state.highlight}</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {state.topSectors.map(s=><span key={s} style={{fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,.15)",color:"rgba(255,255,255,.85)",border:"1px solid rgba(255,255,255,.2)",fontFamily:"'DM Sans',sans-serif"}}>{s}</span>)}
        </div>
      </div>
      <div style={{display:"flex",gap:isMobile?14:22,flexShrink:0,flexWrap:"wrap"}}>
        {[{label:"State GDP",val:state.gdp},{label:"Median Salary",val:fmtRM(state.medianSalary)+"/mo"},{label:"Unemployment",val:state.unemployment+"%"}].map(s=>(
          <div key={s.label}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.45)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}>{s.label}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:"#fff"}}>{s.val}</div>
          </div>
        ))}
      </div>
      <button onClick={onClear} style={{position:"absolute",top:10,right:12,background:"rgba(255,255,255,.15)",border:"none",color:"rgba(255,255,255,.7)",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
    </div>
  );
}

export default function MalaysiaAIWorkIndex(){
  const getIsMobile=()=>typeof window!=="undefined"&&window.matchMedia("(max-width: 1100px)").matches;
  const [tab,setTab]=useState("explore");
  const [search,setSearch]=useState("");
  const [filterGroup,setFilterGroup]=useState("All");
  const [filterBand,setFilterBand]=useState("All");
  const [filterImpact,setFilterImpact]=useState("All");
  const [selected,setSelected]=useState(null);
  const [activeState,setActiveState]=useState(null);
  const [mounted,setMounted]=useState(false);
  const [isMobile,setIsMobile]=useState(getIsMobile);
  const [viewMode,setViewMode]=useState("table");

  useEffect(()=>{setTimeout(()=>setMounted(true),80);},[]);
  useEffect(()=>{
    const onResize=()=>setIsMobile(getIsMobile());
    onResize();
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  const effectiveViewMode=isMobile?"cards":viewMode;

  const annotated=useMemo(()=>OCCUPATIONS.map(o=>({...o,relevance:getRelevance(o.id,activeState?.topSectors??null)})),[activeState]);
  const filtered=useMemo(()=>annotated.filter(o=>{const s=search.toLowerCase();return(o.title.toLowerCase().includes(s)||o.group.toLowerCase().includes(s))&&(filterGroup==="All"||o.group===filterGroup)&&(filterBand==="All"||getRiskBand(o.risk)===filterBand)&&(filterImpact==="All"||o.impact===filterImpact);}).sort((a,b)=>{const ord={primary:0,secondary:1,other:2,all:0};const d=ord[a.relevance]-ord[b.relevance];return d!==0?d:b.risk-a.risk;}),[annotated,search,filterGroup,filterBand,filterImpact]);

  const bandData=ALL_BANDS.map(band=>({band,count:OCCUPATIONS.filter(o=>getRiskBand(o.risk)===band).length}));
  const groupData=ALL_GROUPS.map(g=>{const list=OCCUPATIONS.filter(o=>o.group===g);return{group:g,avg:Math.round(list.reduce((s,o)=>s+o.risk,0)/list.length)};}).sort((a,b)=>b.avg-a.avg);
  const groupSummary=ALL_GROUPS.map(group=>{
    const list=OCCUPATIONS.filter(o=>o.group===group);
    const workers=list.reduce((s,o)=>s+o.workers,0);
    const avgRisk=Math.round(list.reduce((s,o)=>s+o.risk,0)/list.length);
    const avgSalary=Math.round(list.reduce((s,o)=>s+o.salary,0)/list.length);
    return{group,workers,avgRisk,avgSalary,count:list.length};
  }).sort((a,b)=>b.workers-a.workers);
  const scatterData=OCCUPATIONS.map(o=>({x:o.risk,y:o.salary,z:Math.max(8,Math.round(o.workers/12000)),impact:o.impact}));
  const topRisk=[...OCCUPATIONS].sort((a,b)=>b.risk-a.risk).slice(0,5);
  const topSafe=[...OCCUPATIONS].sort((a,b)=>a.risk-b.risk).slice(0,5);
  const topDemand=OCCUPATIONS.filter(o=>o.demand).sort((a,b)=>b.salary-a.salary).slice(0,5);

  const css=`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;scrollbar-width:thin;scrollbar-color:${T.green}44 ${T.paper};}body{background:${T.cream};}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:${T.paper};}::-webkit-scrollbar-thumb{background:${T.green}44;border-radius:3px;}input::placeholder{color:${T.muted};}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes floatSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 rgba(255,255,255,0)}50%{box-shadow:0 0 24px rgba(255,255,255,.1)}}.ci{animation:fadeUp .38s ease both;}.heroOrb{transform-origin:100% 50%;animation:orbit 30s linear infinite;}.heroCard{animation:fadeUp .5s ease both;}.statTile{animation:floatSlow 5s ease-in-out infinite,pulseGlow 4s ease-in-out infinite;}@media (prefers-reduced-motion:reduce){.ci,.heroOrb,.heroCard,.statTile{animation:none !important;}}`;

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.cream,minHeight:"100vh",width:"100%",overflowX:"hidden"}}>
      <style>{css}</style>

      <header style={{position:"sticky",top:0,zIndex:150,background:"rgba(250,246,239,.94)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,padding:isMobile?"0 0.8rem":"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:isMobile?70:60,gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:T.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:T.amber,fontSize:13}}>☽</span></div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:T.green,lineHeight:1}}>MY AI Work Index</div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase"}}>Malaysia · Beta 2026</div>
          </div>
          {!isMobile&&<div style={{display:"flex",gap:4,marginLeft:12}}>
            {["Find","Browse","Compare","Methodology"].map(l=><span key={l} style={{fontSize:11,padding:"4px 8px",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>{l}</span>)}
          </div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {activeState&&<div style={{display:"flex",alignItems:"center",gap:6,background:T.greenLt,border:`1px solid ${T.green}33`,borderRadius:20,padding:"4px 12px"}}><span style={{fontSize:10,fontWeight:600,color:T.green,fontFamily:"'DM Sans',sans-serif"}}>{activeState.name}</span><button onClick={()=>setActiveState(null)} style={{background:"none",border:"none",color:T.green,cursor:"pointer",fontSize:11,lineHeight:1}}>✕</button></div>}
          <nav style={{display:"flex",gap:3,overflowX:isMobile?"auto":"visible",maxWidth:isMobile?"62vw":"none"}}>
            {["explore","visualise","rankings"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.green:"transparent",color:tab===t?"#fff":T.muted,border:"none",cursor:"pointer",padding:isMobile?"6px 10px":"6px 14px",borderRadius:20,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,textTransform:"capitalize",transition:"all .14s",whiteSpace:"nowrap"}}>{t}</button>)}
          </nav>
        </div>
      </header>

      <div style={{background:T.green,padding:isMobile?"2rem 1rem 1.5rem":"3.5rem 2rem 2.5rem",position:"relative",overflow:"hidden"}}>
        <svg className="heroOrb" style={{position:"absolute",right:0,top:0,bottom:0,width:"38%",opacity:.05}} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">{[180,150,120,90,60].map((r,i)=><circle key={i} cx="400" cy="150" r={r} fill="none" stroke="#fff" strokeWidth="40"/>)}</svg>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:5,background:`repeating-linear-gradient(90deg,${T.red} 0,${T.red} 48%,transparent 48%,transparent 52%,${T.amber} 52%,${T.amber} 100%)`}}/>
        <div style={{maxWidth:820,opacity:mounted?1:0,transform:mounted?"none":"translateY(18px)",transition:"all .55s ease"}}>
          <p style={{fontSize:10,letterSpacing:"0.22em",color:"rgba(255,255,255,.5)",textTransform:"uppercase",marginBottom:14}}>DOSM MASCO 2020 · TalentCorp MyCOL 2024/25 · Structural AI Scores</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.2rem,5vw,4rem)",fontWeight:900,color:"#fff",lineHeight:1.05,letterSpacing:"-0.02em",marginBottom:"1rem"}}>How will AI reshape<br/><span style={{color:T.amber}}>work in Malaysia?</span></h1>
          <p style={{fontSize:12,color:"rgba(255,255,255,.6)",maxWidth:460,lineHeight:1.75,marginBottom:"2rem"}}>Explore AI displacement pressure across 48 Malaysian occupations. Select any state on the left to see which roles face the most pressure in that economy.</p>
          <div style={{display:"flex",gap:0,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,.14)",paddingTop:"1.4rem"}}>
            {[{val:"620K",label:"Jobs at high displacement risk",note:"TalentCorp 2024"},{val:"RM 4,300",label:"Median monthly salary at AI overlap",note:"DOSM LFS Q4 2024"},{val:"16",label:"States & territories covered",note:"All Malaysia"},{val:"15%",label:"High-risk automation by 2030",note:"World Bank"}].map((s,i)=>(
              <div key={s.val} className="heroCard statTile" style={{animationDelay:`${i*0.12}s`,paddingRight:isMobile?"0.5rem":"2rem",marginRight:isMobile?"0.5rem":"2rem",borderRight:!isMobile&&i<3?"1px solid rgba(255,255,255,.12)":"none",marginBottom:"0.75rem",width:isMobile?"50%":"auto"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:"#fff",lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:4,maxWidth:130,lineHeight:1.5}}>{s.label}</div>
                <div style={{fontSize:9,color:T.amber,marginTop:3,opacity:.7}}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:isMobile?"column":"row"}}>
        <StateSidebar selectedState={activeState} onSelect={setActiveState} isMobile={isMobile}/>
        <main style={{flex:1,padding:isMobile?"1rem 0.8rem 2rem":"1.75rem 1.75rem 4rem",minWidth:0}}>
          <StateBanner state={activeState} onClear={()=>setActiveState(null)} isMobile={isMobile}/>

          {tab==="explore"&&(<>
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1rem 1.25rem",marginBottom:"1.25rem",display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end",boxShadow:"0 2px 10px rgba(13,61,43,.05)"}}>
              <div style={{flex:"1 1 200px"}}>
                <label style={{fontSize:9,letterSpacing:"0.14em",color:T.muted,textTransform:"uppercase",display:"block",marginBottom:5,fontFamily:"'DM Sans',sans-serif"}}>Search</label>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. software developer, nurse…" style={{width:"100%",border:`1.5px solid ${T.border}`,background:T.cream,color:T.ink,padding:"8px 12px",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none"}} onFocus={e=>e.target.style.border=`1.5px solid ${T.green}`} onBlur={e=>e.target.style.border=`1.5px solid ${T.border}`}/>
              </div>
              {[{label:"Group",val:filterGroup,set:setFilterGroup,opts:["All",...ALL_GROUPS]},{label:"Band",val:filterBand,set:setFilterBand,opts:["All",...ALL_BANDS]},{label:"Impact",val:filterImpact,set:setFilterImpact,opts:["All",...ALL_IMPACTS]}].map(f=>(
                <div key={f.label} style={{flex:"1 1 130px"}}>
                  <label style={{fontSize:9,letterSpacing:"0.14em",color:T.muted,textTransform:"uppercase",display:"block",marginBottom:5,fontFamily:"'DM Sans',sans-serif"}}>{f.label}</label>
                  <select value={f.val} onChange={e=>f.set(e.target.value)} style={{width:"100%",border:`1.5px solid ${T.border}`,background:T.cream,color:T.ink,padding:"8px 12px",borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:12,outline:"none",cursor:"pointer"}}>{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                </div>
              ))}
            </div>
            {activeState&&<div style={{display:"flex",gap:16,alignItems:"center",marginBottom:12,fontSize:11,color:T.muted,fontFamily:"'DM Sans',sans-serif",flexWrap:"wrap"}}><span><span style={{color:T.amber,marginRight:4}}>◆ Featured</span>— primary sector match for {activeState.name}</span><span style={{opacity:.5}}>· Dimmed = low relevance to this state</span></div>}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:6}}>
              <p style={{fontSize:12,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontWeight:600,color:T.ink}}>{filtered.length}</span> occupation{filtered.length!==1?"s":""} shown{activeState&&<span style={{color:T.amber,marginLeft:6}}>· {activeState.name}</span>}</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {!isMobile&&<div style={{display:"flex",background:T.cream,border:`1px solid ${T.border}`,borderRadius:99,padding:2}}>
                  {["table","cards"].map(m=><button key={m} onClick={()=>setViewMode(m)} style={{border:"none",cursor:"pointer",fontSize:11,padding:"4px 9px",borderRadius:99,background:effectiveViewMode===m?T.green:"transparent",color:effectiveViewMode===m?"#fff":T.muted,fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"}}>{m}</button>)}
                </div>}
                <p style={{fontSize:11,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>Click row/card for details</p>
              </div>
            </div>
            {(effectiveViewMode==="table"&&!isMobile)
              ?<OccTable items={filtered} onClick={setSelected} selectedId={selected?.id}/>
              :<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                {filtered.map((o,i)=><div key={o.id} className="ci" style={{animationDelay:`${i*.025}s`}}><OccCard occ={o} onClick={setSelected} selected={selected?.id===o.id} relevance={o.relevance}/></div>)}
              </div>}
          </>)}

          {tab==="visualise"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"1.5rem"}}>
                <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1.5rem"}}>
                  <p style={{fontSize:9,letterSpacing:"0.15em",color:T.muted,textTransform:"uppercase",marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Risk Band Distribution</p>
                  <ResponsiveContainer width="100%" height={200}><BarChart data={bandData} margin={{top:0,right:0,bottom:0,left:-20}}><CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/><XAxis dataKey="band" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:12}}/><Bar dataKey="count" radius={[4,4,0,0]}>{bandData.map(e=><Cell key={e.band} fill={RISK_PALETTE[e.band]}/>)}</Bar></BarChart></ResponsiveContainer>
                </div>
                <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1.5rem"}}>
                  <p style={{fontSize:9,letterSpacing:"0.15em",color:T.muted,textTransform:"uppercase",marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Impact Type Breakdown</p>
                  <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
                    {ALL_IMPACTS.map(imp=>{const count=OCCUPATIONS.filter(o=>o.impact===imp).length,pct=Math.round((count/OCCUPATIONS.length)*100);return(<div key={imp}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,fontWeight:500,color:IMPACT_PALETTE[imp],fontFamily:"'DM Sans',sans-serif"}}>● {imp}</span><span style={{fontSize:12,color:T.muted,fontFamily:"'DM Sans',sans-serif"}}>{count} roles ({pct}%)</span></div><div style={{height:8,background:T.paper,borderRadius:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:IMPACT_PALETTE[imp],borderRadius:4}}/></div></div>);})}
                  </div>
                </div>
              </div>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1.5rem"}}>
                <p style={{fontSize:9,letterSpacing:"0.15em",color:T.muted,textTransform:"uppercase",marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Average AI Risk by Occupation Group</p>
                <ResponsiveContainer width="100%" height={isMobile?380:240}><BarChart layout="vertical" data={groupData} margin={{top:0,right:isMobile?20:50,bottom:0,left:isMobile?120:170}}><CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false}/><XAxis type="number" domain={[0,100]} tick={{fill:T.muted,fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="group" tick={{fill:T.ink,fontSize:11,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false} width={isMobile?118:165}/><Tooltip contentStyle={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:12}} formatter={v=>[`${v}%`,"Avg Risk"]}/><Bar dataKey="avg" radius={[0,4,4,0]} label={{position:"right",fill:T.muted,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{groupData.map(e=><Cell key={e.group} fill={e.avg>=65?T.red:e.avg>=45?"#c05a1a":e.avg>=30?T.amber:T.greenMid}/>)}</Bar></BarChart></ResponsiveContainer>
              </div>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1.5rem"}}>
                <p style={{fontSize:9,letterSpacing:"0.15em",color:T.muted,textTransform:"uppercase",marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Risk vs Salary Distribution</p>
                <ResponsiveContainer width="100%" height={isMobile?300:280}>
                  <ScatterChart margin={{top:8,right:10,bottom:8,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis type="number" dataKey="x" name="Risk" unit="%" tick={{fill:T.muted,fontSize:10}} domain={[0,100]}/>
                    <YAxis type="number" dataKey="y" name="Salary" tick={{fill:T.muted,fontSize:10}} tickFormatter={(v)=>`RM ${Math.round(v/1000)}k`}/>
                    <ZAxis type="number" dataKey="z" range={[36,260]}/>
                    <Tooltip cursor={{strokeDasharray:"3 3"}} contentStyle={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:6,fontFamily:"'DM Sans',sans-serif",fontSize:12}} formatter={(v,n)=>n==="Salary"?fmtRM(v):`${v}${n==="Risk"?"%":""}`} labelFormatter={()=>""}/>
                    {ALL_IMPACTS.map(imp=>(
                      <Scatter key={imp} name={imp} data={scatterData.filter(d=>d.impact===imp)} fill={IMPACT_PALETTE[imp]} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"1.25rem"}}>
                <p style={{fontSize:9,letterSpacing:"0.15em",color:T.muted,textTransform:"uppercase",marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>Occupation Group Summary</p>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
                    <thead>
                      <tr>
                        {["Group","Roles","Avg Risk","Avg Salary","Estimated Workers"].map(h=><th key={h} style={{textAlign:h==="Group"?"left":"right",padding:"8px 10px",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {groupSummary.map(row=>(
                        <tr key={row.group}>
                          <td style={{padding:"9px 10px",borderBottom:`1px solid ${T.border}`,fontSize:12,color:T.ink}}>{row.group}</td>
                          <td style={{padding:"9px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"right",fontSize:12,color:T.muted}}>{row.count}</td>
                          <td style={{padding:"9px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"right",fontSize:12,fontWeight:600,color:row.avgRisk>=65?T.red:row.avgRisk>=45?T.amber:T.green}}>{row.avgRisk}%</td>
                          <td style={{padding:"9px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"right",fontSize:12,color:T.green,fontWeight:600}}>{fmtRM(row.avgSalary)}</td>
                          <td style={{padding:"9px 10px",borderBottom:`1px solid ${T.border}`,textAlign:"right",fontSize:12,color:T.muted}}>{row.workers.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{background:T.green,borderRadius:10,padding:"1.5rem"}}>
                <p style={{fontSize:9,letterSpacing:"0.15em",color:"rgba(255,255,255,.5)",textTransform:"uppercase",marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>State Median Salary — click to explore</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {ALL_STATES.sort((a,b)=>b.medianSalary-a.medianSalary).map(st=><button key={st.id} onClick={()=>{setActiveState(st);setTab("explore");}} style={{background:activeState?.id===st.id?T.amber:"rgba(255,255,255,.12)",border:`1px solid ${activeState?.id===st.id?T.amber:"rgba(255,255,255,.2)"}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",color:activeState?.id===st.id?T.ink:"rgba(255,255,255,.85)",fontFamily:"'DM Sans',sans-serif",transition:"all .14s"}} onMouseEnter={e=>{if(activeState?.id!==st.id)e.currentTarget.style.background="rgba(255,255,255,.22)";}} onMouseLeave={e=>{if(activeState?.id!==st.id)e.currentTarget.style.background="rgba(255,255,255,.12)";}}>
                    <div style={{fontSize:12,fontWeight:600}}>{st.name}</div><div style={{fontSize:10,opacity:.7,marginTop:2}}>{fmtRM(st.medianSalary)}/mo</div>
                  </button>)}
                </div>
              </div>
            </div>
          )}

          {tab==="rankings"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"1.5rem"}}>
              {[{title:"Highest AI Pressure",sub:"Most exposed to displacement",icon:"▲",data:topRisk,color:T.red,bg:T.redLt,valFn:o=>`${o.risk}%`},{title:"Most Resilient",sub:"Lowest AI displacement risk",icon:"◆",data:topSafe,color:T.greenMid,bg:T.greenLt,valFn:o=>`${o.risk}% risk`},{title:"MyCOL In-Demand",sub:"Critical shortage, top salary",icon:"★",data:topDemand,color:T.amber,bg:T.amberLt,valFn:o=>fmtRM(o.salary)+"/mo"}].map(sec=>(
                <div key={sec.title} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",boxShadow:"0 2px 10px rgba(13,61,43,.05)"}}>
                  <div style={{background:sec.bg,padding:"1rem 1.4rem",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:16,color:sec.color}}>{sec.icon}</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:T.ink}}>{sec.title}</span></div>
                    <p style={{fontSize:11,color:T.muted,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{sec.sub}</p>
                  </div>
                  {sec.data.map((o,i)=><div key={o.id} onClick={()=>{setSelected(o);setTab("explore");}} style={{padding:"11px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=T.cream} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:T.border,width:22,textAlign:"center"}}>{i+1}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:T.ink,fontFamily:"'DM Sans',sans-serif"}}>{o.title}</div><div style={{fontSize:10,color:T.muted,marginTop:1,fontFamily:"'DM Sans',sans-serif"}}>{o.group}</div></div>
                    <span style={{fontSize:13,fontWeight:600,color:sec.color,fontFamily:"'DM Sans',sans-serif"}}>{sec.valFn(o)}</span>
                  </div>)}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer style={{background:T.green,padding:"2rem",borderTop:`4px solid ${T.red}`}}>
        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#fff",marginBottom:8}}>MY AI Work Index</div>
            <p style={{fontSize:11,color:"rgba(255,255,255,.5)",lineHeight:1.8,maxWidth:460,fontFamily:"'DM Sans',sans-serif"}}>Structural AI exposure scores — not employment predictions. Formula: net_risk = exposure × (1 − human_bottleneck) × market_modifier. Sources: DOSM MASCO 2020 · LFS Q4 2024 · TalentCorp MyCOL 2024/25 · O*NET · World Bank · ILO.</p>
          </div>
          <p style={{fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"right",fontFamily:"'DM Sans',sans-serif"}}>Beta v1.1 · Malaysia · 2026<br/>State selector inspired by Google Language Explorer</p>
        </div>
      </footer>

      {selected&&<DetailDrawer occ={selected} onClose={()=>setSelected(null)} isMobile={isMobile}/>}
    </div>
  );
}
