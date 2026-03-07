import{f as S,u as Ce,b as Ie,a as Me,r as o,s as v,j as e,X as le,g as de,Q as c,L as Ee,h as Le,e as Te,T as De,d as $e,i as ie,A as Be,C as Pe,P as _e,k as Fe,l as ze}from"./index-e6de0890.js";import{S as U}from"./shield-3dcdff03.js";import{C as Re}from"./check-circle-2-7b95b7de.js";import{A as qe,S as Ge}from"./star-fb4ad51c.js";import{R as Ue}from"./refresh-cw-613bd761.js";import{C as Oe}from"./clock-718d78c7.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=S("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=S("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=S("Tags",[["path",{d:"M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z",key:"gt587u"}],["path",{d:"M6 9.01V9",key:"1flxpt"}],["path",{d:"m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19",key:"1cbfv1"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=S("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=S("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]),Qe=["Choir","Ushers","Youth","Children","Media","Welfare","Protocol","Evangelism"],ge=k=>{if(!Array.isArray(k))return[];const L=new Set,u=[];for(const A of k){const y=String(A||"").replace(/\s+/g," ").trim();if(!y)continue;const p=y.toLowerCase();L.has(p)||(L.add(p),u.push(y))}return u},st=({setCurrentView:k,onBack:L})=>{const{members:u,currentTable:A,attendanceData:y,availableSundayDates:p,isMonthAttendanceComplete:me,updateMember:O,calculateAttendanceRate:Y,isCollaborator:xe,dataOwnerId:he,isSupabaseConfigured:C}=Ce();Ie();const{user:f,signInWithGoogle:ue}=Me(),[j,T]=o.useState(()=>{if(localStorage.getItem("adminStayLoggedIn")==="true"){const r=localStorage.getItem("adminAuthExpiry");if(r&&new Date().getTime()<parseInt(r))return!0;localStorage.removeItem("adminStayLoggedIn"),localStorage.removeItem("adminAuthExpiry")}return sessionStorage.getItem("adminAuthenticated")==="true"}),[I,D]=o.useState(""),[V,$]=o.useState(!1),[B,W]=o.useState(!1),[P,pe]=o.useState(!1),[H,_]=o.useState(Date.now()),be=15,[Q,K]=o.useState(!1);o.useEffect(()=>{if(!j)return;const r=setInterval(()=>{if(localStorage.getItem("adminStayLoggedIn")==="true")return;Date.now()-H>be*60*1e3&&(X(),c.info("Admin session expired due to inactivity"))},6e4);return()=>clearInterval(r)},[j,H]),o.useEffect(()=>{if(!j)return;const t=()=>_(Date.now());return window.addEventListener("mousemove",t),window.addEventListener("keydown",t),window.addEventListener("click",t),()=>{window.removeEventListener("mousemove",t),window.removeEventListener("keydown",t),window.removeEventListener("click",t)}},[j]);const ye=async t=>{if(t.preventDefault(),!(!(f!=null&&f.email)||!I)){W(!0),$(!1);try{const{error:r}=await v.auth.signInWithPassword({email:f.email,password:I});if(r)$(!0),D("");else{if(T(!0),_(Date.now()),P){const a=new Date().getTime()+6048e5;localStorage.setItem("adminStayLoggedIn","true"),localStorage.setItem("adminAuthExpiry",a.toString())}else sessionStorage.setItem("adminAuthenticated","true");c.success("Admin access granted")}}catch{$(!0),D("")}finally{W(!1)}}},X=()=>{T(!1),sessionStorage.removeItem("adminAuthenticated"),localStorage.removeItem("adminStayLoggedIn"),localStorage.removeItem("adminAuthExpiry")},fe=async()=>{K(!0);try{await ue(),sessionStorage.setItem("adminAuthenticated","true"),T(!0),_(Date.now()),c.success("Admin access granted with Google")}catch(t){console.error("Google admin access failed:",t),c.error("Google sign-in failed for admin access")}finally{K(!1)}},[Z,F]=o.useState(!1),[N,J]=o.useState(null),[we,ee]=o.useState(!1),[z,ve]=o.useState(!1),b=xe?he:f==null?void 0:f.id,[w,te]=o.useState(Qe),[M,re]=o.useState(""),[E,R]=o.useState(null),[ae,q]=o.useState("");o.useMemo(()=>M.replace(/\s+/g," ").trim(),[M]).length>0,o.useEffect(()=>{if(!C()||!b)return;(async()=>{try{const{data:r,error:a}=await v.from("user_preferences").select("ministry_groups").eq("user_id",b).maybeSingle();if(a)throw a;Array.isArray(r==null?void 0:r.ministry_groups)&&r.ministry_groups.length>0&&te(ge(r.ministry_groups))}catch(r){console.error("[MINISTRY] Error loading:",r)}})()},[b,C]),o.useEffect(()=>{if(!C()||!b)return;const t=v.channel(`ministries-realtime:${b}`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"user_preferences",filter:`user_id=eq.${b}`},r=>{var a;Array.isArray((a=r==null?void 0:r.new)==null?void 0:a.ministry_groups)&&te(ge(r.new.ministry_groups))}).subscribe();return()=>{v.removeChannel(t)}},[b,C]);const se=async()=>{const t=M.trim().replace(/\s+/g," ");if(!t){c.warning("Please enter a ministry name");return}if(w.some(r=>r.toLowerCase()===t.toLowerCase())){c.info(`"${t}" already exists`);return}try{const r=[...w,t],{error:a}=await v.from("user_preferences").upsert({user_id:b,ministry_groups:r,updated_at:new Date().toISOString()});if(a)throw a;re(""),c.success(`Added "${t}"`)}catch(r){console.error("[MINISTRY] Error:",r),c.error("Failed to add: "+((r==null?void 0:r.message)||"Unknown error"))}},ke=async t=>{try{const r=w.filter(d=>d!==t),{error:a}=await v.from("user_preferences").upsert({user_id:b,ministry_groups:r,updated_at:new Date().toISOString()});if(a)throw a;c.success(`Removed "${t}"`)}catch(r){console.error("[MINISTRY] Error:",r),c.error("Failed to delete: "+((r==null?void 0:r.message)||"Unknown error"))}},je=t=>{R(t),q(t)},ne=async()=>{try{const t=ae.replace(/\s+/g," ").trim();if(!t||t===E){R(null);return}if(w.some(d=>d!==E&&d.toLowerCase()===t.toLowerCase())){c.info(`"${t}" already exists`);return}const r=w.map(d=>d===E?t:d),{error:a}=await v.from("user_preferences").upsert({user_id:b,ministry_groups:r,updated_at:new Date().toISOString()});if(a)throw a;c.success(`Updated to "${t}"`),R(null),q("")}catch(t){console.error("[MINISTRY] Error:",t),c.error("Failed to save: "+((t==null?void 0:t.message)||"Unknown error"))}},Ne=()=>{const t=(p==null?void 0:p.map(l=>{if(l instanceof Date){const s=l.getFullYear(),n=String(l.getMonth()+1).padStart(2,"0"),m=String(l.getDate()).padStart(2,"0");return`${s}-${n}-${m}`}return l}))||[],r=[...u].sort((l,s)=>{const n=(l.full_name||l["Full Name"]||"").toLowerCase(),m=(s.full_name||s["Full Name"]||"").toLowerCase();return n.localeCompare(m)}),a=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Sheet - ${G}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0; background: #f5f5f5; }
          .toolbar { 
            position: fixed; top: 0; left: 0; right: 0; 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 12px 20px; 
            display: flex; align-items: center; gap: 15px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            flex-wrap: wrap;
          }
          .toolbar label { color: #e2e8f0; font-size: 13px; font-weight: 500; }
          .toolbar select, .toolbar input[type="number"] { 
            padding: 8px 12px; border-radius: 8px; border: 1px solid #475569; 
            font-size: 13px; background: #1e293b; color: white; cursor: pointer;
          }
          .toolbar select:focus { outline: none; border-color: #f97316; }
          .toolbar button {
            padding: 10px 20px; border-radius: 8px; border: none;
            font-weight: 600; cursor: pointer; transition: all 0.2s;
          }
          .btn-print { background: #059669; color: white; }
          .btn-print:hover { background: #047857; transform: translateY(-1px); }
          .btn-close { background: #475569; color: white; margin-left: auto; }
          .btn-close:hover { background: #64748b; }
          .toolbar-group { display: flex; align-items: center; gap: 8px; }
          .toolbar-divider { width: 1px; height: 24px; background: #475569; margin: 0 8px; }
          
          .content { margin-top: 80px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { text-align: center; margin-bottom: 5px; font-size: 24px; color: #1f2937; }
          h2 { text-align: center; color: #6b7280; font-weight: normal; margin-top: 0; font-size: 16px; }
          
          .editable-title { 
            border: 2px dashed transparent; padding: 5px 10px; border-radius: 4px;
            transition: border-color 0.2s; cursor: text;
          }
          .editable-title:hover { border-color: #f97316; }
          .editable-title:focus { outline: none; border-color: #f97316; background: #fff7ed; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: center; }
          th { background: #f3f4f6; font-weight: 600; color: #374151; }
          td:nth-child(2) { text-align: left; }
          .present { background: #d1fae5; color: #065f46; font-weight: bold; }
          .absent { background: #fee2e2; color: #991b1b; font-weight: bold; }
          
          .summary { margin: 20px 0; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
          .summary-item { text-align: center; padding: 15px 25px; background: #f9fafb; border-radius: 8px; }
          .summary-value { font-size: 28px; font-weight: bold; }
          .summary-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          
          .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 11px; }
          
          @media print {
            body { background: white; padding: 10px; }
            .toolbar { display: none !important; }
            .content { margin-top: 0; box-shadow: none; padding: 0; }
            .editable-title { border: none !important; }
            table { font-size: 10px; }
            th, td { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="toolbar-group">
            <label>📝 Font:</label>
            <select id="fontSize" onchange="changeFontSize(this.value)">
              <option value="9">Tiny</option>
              <option value="10">Small</option>
              <option value="12" selected>Normal</option>
              <option value="14">Large</option>
            </select>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <label>📊 Style:</label>
            <select id="tableStyle" onchange="changeTableStyle(this.value)">
              <option value="default">Default</option>
              <option value="compact">Compact</option>
              <option value="striped">Striped</option>
              <option value="bordered">Bold Border</option>
            </select>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <label>
              <input type="checkbox" id="showSummary" checked onchange="toggleSummary(this.checked)"> 
              Summary
            </label>
          </div>
          <div class="toolbar-group">
            <label>
              <input type="checkbox" id="boldNames" onchange="toggleBoldNames(this.checked)"> 
              Bold Names
            </label>
          </div>
          <div class="toolbar-group">
            <label>
              <input type="checkbox" id="showGender" checked onchange="toggleColumn('gender', this.checked)"> 
              Gender
            </label>
          </div>
          <div class="toolbar-group">
            <label>
              <input type="checkbox" id="showLevel" checked onchange="toggleColumn('level', this.checked)"> 
              Level
            </label>
          </div>
          <div class="toolbar-divider"></div>
          <button class="btn-print" onclick="window.print()">🖨️ Print</button>
          <button class="btn-close" onclick="window.close()">✕ Close</button>
        </div>
        
        <div class="content">
          <h1 contenteditable="true" class="editable-title">Attendance Sheet</h1>
          <h2 contenteditable="true" class="editable-title">${G}</h2>
          
          <div class="summary" id="summarySection">
            <div class="summary-item">
              <div class="summary-value">${u.length}</div>
              <div class="summary-label">Total Members</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981">${g.totalPresent}</div>
              <div class="summary-label">Total Present</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #ef4444">${g.totalAbsent}</div>
              <div class="summary-label">Total Absent</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #8b5cf6">${g.attendanceRate}%</div>
              <div class="summary-label">Attendance Rate</div>
            </div>
          </div>
          
          <table id="attendanceTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Level</th>
                ${t.map(l=>`<th>${new Date(l).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</th>`).join("")}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${r.map((l,s)=>{let n=0;const m=t.map(x=>{var h;const i=(h=y[x])==null?void 0:h[l.id];return i===!0?(n++,'<td class="present">P</td>'):i===!1?'<td class="absent">A</td>':"<td>-</td>"}).join("");return`<tr>
                  <td>${s+1}</td>
                  <td class="member-name">${l.full_name||l["Full Name"]||"N/A"}</td>
                  <td>${l.Gender||"N/A"}</td>
                  <td>${l["Current Level"]||"N/A"}</td>
                  ${m}
                  <td><strong>${n}/${t.length}</strong></td>
                </tr>`}).join("")}
            </tbody>
          </table>
          
          <p class="footer" contenteditable="true">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <script>
          function changeFontSize(size) {
            document.getElementById('attendanceTable').style.fontSize = size + 'px';
          }
          function changeTableStyle(style) {
            const table = document.getElementById('attendanceTable');
            // Reset all styles first
            table.querySelectorAll('tbody tr').forEach(row => row.style.background = '');
            table.querySelectorAll('th, td').forEach(cell => {
              cell.style.padding = '';
              cell.style.borderWidth = '';
            });
            
            if (style === 'striped') {
              table.querySelectorAll('tbody tr').forEach((row, i) => {
                row.style.background = i % 2 === 0 ? '#f8fafc' : 'white';
              });
            } else if (style === 'compact') {
              table.querySelectorAll('th, td').forEach(cell => {
                cell.style.padding = '3px 5px';
              });
            } else if (style === 'bordered') {
              table.querySelectorAll('th, td').forEach(cell => {
                cell.style.borderWidth = '2px';
              });
            }
          }
          function toggleSummary(show) {
            document.getElementById('summarySection').style.display = show ? 'flex' : 'none';
          }
          function toggleBoldNames(bold) {
            document.querySelectorAll('.member-name').forEach(cell => {
              cell.style.fontWeight = bold ? 'bold' : 'normal';
            });
          }
          function toggleColumn(col, show) {
            const colIndex = col === 'gender' ? 2 : col === 'level' ? 3 : -1;
            if (colIndex === -1) return;
            document.querySelectorAll('#attendanceTable tr').forEach(row => {
              const cell = row.children[colIndex];
              if (cell) cell.style.display = show ? '' : 'none';
            });
          }
        <\/script>
      </body>
      </html>
    `,d=window.open("","_blank");d.document.write(a),d.document.close()},G=A?A.replace("_"," "):"No Month Selected",g=o.useMemo(()=>{const t=(p==null?void 0:p.map(n=>{if(n instanceof Date){const m=n.getFullYear(),x=String(n.getMonth()+1).padStart(2,"0"),i=String(n.getDate()).padStart(2,"0");return`${m}-${x}-${i}`}return n}))||[];let r=0,a=0;const d=t.map(n=>{const m=y[n]||{},x=Object.values(m).filter(h=>h===!0).length,i=Object.values(m).filter(h=>h===!1).length;return r+=x,a+=i,{date:n,present:x,absent:i,total:x+i,marked:x+i>0}}),l=u.length*t.length,s=l>0?Math.round(r/l*100):0;return{totalMembers:u.length,totalPresent:r,totalAbsent:a,attendanceRate:s,sundayStats:d,sundaysCompleted:d.filter(n=>n.marked).length,totalSundays:t.length}},[u,y,p]),oe=o.useMemo(()=>u.map(t=>{const r=Y(t);return{id:t.id,name:t.full_name||t["Full Name"]||"Unknown",rate:r,badge:t["Badge Type"]||"newcomer"}}).filter(t=>t.rate>0).sort((t,r)=>r.rate-t.rate).slice(0,5),[u,Y]),Se=async()=>{var t;F(!0),J(null);try{if(!me()){c.error("Please complete attendance for all Sundays first."),F(!1);return}const a={qualified:[],notQualified:[],totalProcessed:0},d=[...p||[]].sort((s,n)=>{const m=s instanceof Date?s:new Date(s),x=n instanceof Date?n:new Date(n);return m-x});for(const s of u){a.totalProcessed++;let n=0,m=0,x=!1;for(const h of d){const Ae=h instanceof Date?`${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}`:h;((t=y[Ae])==null?void 0:t[s.id])===!0?(n++,m++,m>=3&&(x=!0)):m=0}const i={id:s.id,name:s.full_name||s["Full Name"],presentCount:n,currentBadge:s["Badge Type"]||"newcomer"};x?(s["Badge Type"]!=="regular"&&(await O(s.id,{"Badge Type":"regular"},{silent:!0}),i.newBadge="regular",i.upgraded=!0),a.qualified.push(i)):n>=2?(s["Badge Type"]!=="member"&&s["Badge Type"]!=="regular"&&(await O(s.id,{"Badge Type":"member"},{silent:!0}),i.newBadge="member",i.upgraded=!0),a.qualified.push(i)):a.notQualified.push(i)}J(a),ee(!0);const l=a.qualified.filter(s=>s.upgraded).length;c.success(`Badge processing complete! ${l} members upgraded.`)}catch(r){console.error("Error processing badges:",r),c.error("Failed to process badges. Please try again.")}finally{F(!1)}};return j?e.jsxs("div",{className:"min-h-screen pb-24",children:[e.jsx("div",{className:"sticky top-0 z-20 w-full py-3",children:e.jsx("div",{className:"max-w-4xl mx-auto px-4",children:e.jsxs("div",{className:"bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between shadow-sm",children:[e.jsxs("div",{className:"flex items-center gap-3 sm:gap-4 flex-1 min-w-0",children:[e.jsx("div",{className:"bg-slate-100 dark:bg-slate-700/50 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 flex-shrink-0",children:e.jsx(U,{className:"w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300"})}),e.jsxs("div",{className:"min-w-0 overflow-hidden",children:[e.jsx("h1",{className:"text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate",children:"Admin Panel"}),e.jsx("p",{className:"text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate",children:G})]})]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2",children:[e.jsxs("button",{onClick:()=>{X(),c.info("Admin session ended")},className:"flex items-center gap-2 px-2.5 py-2 sm:px-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group",title:"Lock Admin Panel",children:[e.jsx(Ee,{className:"w-4 h-4 transition-transform group-hover:translate-x-0.5"}),e.jsx("span",{className:"hidden sm:inline",children:"Lock"})]}),e.jsx("div",{className:"h-6 sm:h-8 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1"}),e.jsxs("button",{onClick:()=>k("dashboard"),className:"flex items-center gap-2 px-3 py-2 sm:px-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors",title:"Back to Dashboard",children:[e.jsx(Le,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:"Back to Dashboard"}),e.jsx("span",{className:"sm:hidden",children:"Back"})]})]})]})})}),e.jsxs("div",{className:"max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6",children:[e.jsx("div",{className:"flex justify-end animate-fade-in-up",children:e.jsxs("button",{onClick:Ne,className:"flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm",children:[e.jsx(Ye,{className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium",children:"Print Attendance Sheet"})]})}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-fade-in-up transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] grid-animate",children:[e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm",children:e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("div",{className:"p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl",children:e.jsx(Te,{className:"w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xl sm:text-2xl font-bold text-gray-900 dark:text-white",children:g.totalMembers}),e.jsx("p",{className:"text-[10px] sm:text-xs text-gray-500 dark:text-gray-400",children:"Total Members"})]})]})}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm",children:e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("div",{className:"p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl",children:e.jsx(Re,{className:"w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400",children:g.totalPresent}),e.jsx("p",{className:"text-[10px] sm:text-xs text-gray-500 dark:text-gray-400",children:"Total Present"})]})]})}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm",children:e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("div",{className:"p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg sm:rounded-xl",children:e.jsx(He,{className:"w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400",children:g.totalAbsent}),e.jsx("p",{className:"text-[10px] sm:text-xs text-gray-500 dark:text-gray-400",children:"Total Absent"})]})]})}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm",children:e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("div",{className:"p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl",children:e.jsx(De,{className:"w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400"})}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400",children:[g.attendanceRate,"%"]}),e.jsx("p",{className:"text-[10px] sm:text-xs text-gray-500 dark:text-gray-400",children:"Attendance Rate"})]})]})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up",style:{animationDelay:"100ms"},children:[e.jsxs("button",{onClick:()=>ve(!z),className:"w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-gray-100 dark:bg-gray-700 rounded-xl",children:e.jsx(qe,{className:"w-5 h-5 text-gray-600 dark:text-gray-400"})}),e.jsxs("div",{className:"text-left",children:[e.jsx("h3",{className:"font-semibold text-gray-900 dark:text-white",children:"Advanced Features"}),e.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"Badge processing & automation"})]})]}),e.jsx($e,{className:`w-5 h-5 text-gray-400 transition-transform ${z?"rotate-180":""}`})]}),z&&e.jsx("div",{className:"p-4 pt-0 border-t border-gray-200 dark:border-gray-700",children:e.jsxs("div",{className:"bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl p-5 text-white mt-4",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx(ie,{className:"w-5 h-5"}),e.jsx("h4",{className:"font-bold",children:"Badge Processing"})]}),e.jsx("p",{className:"text-white/80 text-sm mb-3",children:"Auto-assign badges based on attendance"}),e.jsxs("div",{className:"space-y-1 text-xs text-white/70",children:[e.jsxs("p",{children:["• ",e.jsx("span",{className:"text-orange-200 font-medium",children:"Member"})," = 2+ Sundays"]}),e.jsxs("p",{children:["• ",e.jsx("span",{className:"text-green-200 font-medium",children:"Regular"})," = 3+ consecutive"]})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"text-2xl font-bold",children:[g.sundaysCompleted,"/",g.totalSundays]}),e.jsx("p",{className:"text-xs text-white/70",children:"Sundays"})]})]}),e.jsx("button",{onClick:Se,disabled:Z||g.sundaysCompleted<g.totalSundays,className:`w-full mt-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all text-sm ${g.sundaysCompleted<g.totalSundays?"bg-white/20 text-white/50 cursor-not-allowed":"bg-white text-orange-600 hover:bg-orange-50 shadow-lg btn-press"}`,children:Z?e.jsxs(e.Fragment,{children:[e.jsx(Ue,{className:"w-4 h-4 animate-spin"}),"Processing..."]}):g.sundaysCompleted<g.totalSundays?e.jsxs(e.Fragment,{children:[e.jsx(Be,{className:"w-4 h-4"}),"Complete All Sundays First"]}):e.jsxs(e.Fragment,{children:[e.jsx(ie,{className:"w-4 h-4"}),"Process Badges"]})})]})})]}),N&&we&&e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up",children:[e.jsxs("div",{className:"p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between",children:[e.jsxs("h3",{className:"font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[e.jsx(We,{className:"w-5 h-5 text-yellow-500"}),"Badge Results"]}),e.jsx("button",{onClick:()=>ee(!1),className:"p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors",children:e.jsx(le,{className:"w-5 h-5 text-gray-400"})})]}),e.jsxs("div",{className:"p-4 space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",children:[e.jsxs("div",{className:"bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center",children:[e.jsx("p",{className:"text-2xl font-bold text-green-600 dark:text-green-400",children:N.qualified.length}),e.jsx("p",{className:"text-sm text-green-600/70 dark:text-green-400/70",children:"Qualified"})]}),e.jsxs("div",{className:"bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center",children:[e.jsx("p",{className:"text-2xl font-bold text-gray-600 dark:text-gray-300",children:N.notQualified.length}),e.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-400",children:"Not Qualified"})]})]}),N.qualified.filter(t=>t.upgraded).length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Recently Upgraded:"}),N.qualified.filter(t=>t.upgraded).slice(0,5).map(t=>e.jsxs("div",{className:"flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2",children:[e.jsx("span",{className:"text-sm text-gray-900 dark:text-white",children:t.name}),e.jsx("span",{className:`text-xs px-2 py-1 rounded-full font-medium ${t.newBadge==="regular"?"bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300":"bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-300"}`,children:t.newBadge==="regular"?"⭐ Regular":"👤 Member"})]},t.id))]})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up",style:{animationDelay:"200ms"},children:[e.jsx("div",{className:"p-4 border-b border-gray-200 dark:border-gray-700",children:e.jsxs("h3",{className:"font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[e.jsx(Pe,{className:"w-5 h-5 text-orange-500"}),"This Month's Sundays"]})}),e.jsx("div",{className:"p-4",children:e.jsx("div",{className:"space-y-2",children:g.sundayStats.map((t,r)=>{const d=new Date(t.date).toLocaleDateString("en-US",{month:"short",day:"numeric"});return e.jsxs("div",{className:"flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${t.marked?"bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400":"bg-gray-100 dark:bg-gray-700 text-gray-400"}`,children:t.marked?e.jsx(de,{className:"w-4 h-4"}):r+1}),e.jsx("span",{className:`font-medium ${t.marked?"text-gray-900 dark:text-white":"text-gray-400"}`,children:d})]}),t.marked?e.jsxs("div",{className:"flex items-center gap-4 text-sm",children:[e.jsxs("span",{className:"text-green-600 dark:text-green-400",children:[t.present," present"]}),e.jsxs("span",{className:"text-red-500",children:[t.absent," absent"]})]}):e.jsxs("span",{className:"text-xs text-gray-400 flex items-center gap-1",children:[e.jsx(Oe,{className:"w-3 h-3"}),"Not marked"]})]},t.date)})})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up",style:{animationDelay:"300ms"},children:[e.jsxs("div",{className:"p-4 border-b border-gray-200 dark:border-gray-700",children:[e.jsxs("h3",{className:"font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[e.jsx(Ve,{className:"w-5 h-5 text-primary-500"}),"Ministry/Groups"]}),e.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 mt-1",children:"Manage ministry tags for members"})]}),e.jsxs("div",{className:"p-4",children:[e.jsxs("div",{className:"flex gap-2 mb-4",children:[e.jsx("input",{type:"text",value:M,onChange:t=>re(t.target.value),onKeyDown:t=>{t.key==="Enter"&&(t.preventDefault(),se())},placeholder:"Add new ministry...",className:"flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"}),e.jsxs("button",{type:"button",onClick:()=>se(),className:"inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm",children:[e.jsx(_e,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:"Add"})]})]}),e.jsx("div",{className:"space-y-2 max-h-48 overflow-y-auto",children:w.map(t=>e.jsxs("div",{className:"flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group",children:[E===t?e.jsx("input",{type:"text",value:ae,onChange:r=>q(r.target.value),onKeyDown:r=>r.key==="Enter"&&ne(),onBlur:ne,autoFocus:!0,className:"flex-1 px-2 py-1 text-sm border border-primary-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"}):e.jsx("span",{className:"text-sm text-gray-700 dark:text-gray-300",children:t}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>je(t),className:"p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all duration-200",title:"Edit",children:e.jsx(Fe,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>ke(t),className:"p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all duration-200",title:"Delete",children:e.jsx(ze,{className:"w-4 h-4"})})]})]},t))}),w.length===0&&e.jsx("p",{className:"text-center text-gray-400 py-4 text-sm",children:"No ministries added yet"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up",style:{animationDelay:"400ms"},children:[e.jsx("div",{className:"p-4 border-b border-gray-200 dark:border-gray-700",children:e.jsxs("h3",{className:"font-semibold text-gray-900 dark:text-white flex items-center gap-2",children:[e.jsx(Ge,{className:"w-5 h-5 text-yellow-500"}),"Top Attendees"]})}),e.jsx("div",{className:"p-4",children:oe.length===0?e.jsx("p",{className:"text-center text-gray-400 py-4",children:"No attendance data yet"}):e.jsx("div",{className:"space-y-2",children:oe.map((t,r)=>e.jsxs("div",{className:"flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${r===0?"bg-yellow-500":r===1?"bg-gray-400":r===2?"bg-amber-600":"bg-orange-500"}`,children:r+1}),e.jsxs("div",{children:[e.jsx("p",{className:"font-medium text-gray-900 dark:text-white",children:t.name}),e.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 capitalize",children:t.badge})]})]}),e.jsxs("div",{className:`text-lg font-bold ${t.rate>=90?"text-green-500":t.rate>=75?"text-orange-500":"text-yellow-500"}`,children:[t.rate,"%"]})]},t.id))})})]})]})]}):e.jsx("div",{className:"min-h-screen flex items-center justify-center p-3 sm:p-4",children:e.jsx("div",{className:"w-full max-w-2xl",children:e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden",children:[e.jsxs("div",{className:"bg-gradient-to-br from-orange-600 to-orange-800 dark:from-orange-700 dark:to-orange-900 px-4 sm:px-6 py-6 sm:py-8 text-center",children:[e.jsx("div",{className:"w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-white/20",children:e.jsx(U,{className:"w-6 h-6 sm:w-8 sm:h-8 text-white"})}),e.jsx("h1",{className:"text-xl sm:text-2xl font-bold text-white",children:"Admin Panel"}),e.jsx("p",{className:"text-orange-100 text-xs sm:text-sm mt-1",children:"Secure Access Required"})]}),e.jsxs("form",{onSubmit:ye,className:"p-4 sm:p-6 space-y-4 sm:space-y-5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:"Account Password"}),e.jsx("input",{type:"password",value:I,onChange:t=>D(t.target.value),placeholder:"Enter your account password",className:`w-full px-4 py-3 rounded-xl border ${V?"border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-900/20":"border-gray-200 dark:border-gray-600 focus:ring-orange-500 bg-gray-50 dark:bg-gray-700"} text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`,autoFocus:!0,disabled:B}),V&&e.jsxs("p",{className:"mt-2 text-sm text-red-500 flex items-center gap-1",children:[e.jsx(le,{className:"w-4 h-4"}),"Incorrect password. Please try again."]})]}),e.jsxs("label",{className:"flex items-center gap-3 cursor-pointer group",children:[e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"checkbox",checked:P,onChange:t=>pe(t.target.checked),className:"sr-only peer"}),e.jsx("div",{className:"w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:border-orange-600 peer-checked:bg-orange-600 transition-all flex items-center justify-center",children:P&&e.jsx(de,{className:"w-3 h-3 text-white"})})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Stay logged in"}),e.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400",children:"Keep admin access for 7 days"})]})]}),e.jsx("button",{type:"submit",disabled:B||!I,className:"w-full py-3 bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2",children:B?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"Verifying..."]}):e.jsxs(e.Fragment,{children:[e.jsx(U,{className:"w-4 h-4"}),"Access Admin Panel"]})}),e.jsxs("div",{className:"bg-orange-50/70 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/60 rounded-xl p-4 space-y-3",children:[e.jsxs("p",{className:"text-sm text-orange-700 dark:text-orange-200 flex items-start gap-2",children:[e.jsx(ce,{className:"w-4 h-4 mt-0.5 flex-shrink-0"}),e.jsx("span",{children:"One-tap Google SSO. We’ll verify your Google profile and unlock admin after the redirect."})]}),e.jsx("button",{type:"button",onClick:fe,disabled:Q,className:"w-full py-3 border border-orange-200 dark:border-orange-700 bg-white dark:bg-orange-900/30 text-orange-700 dark:text-orange-200 font-semibold rounded-xl transition-all shadow-sm hover:bg-orange-50 dark:hover:bg-orange-900/40 disabled:opacity-70 flex items-center justify-center gap-2",children:Q?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"}),"Connecting with Google..."]}):e.jsxs(e.Fragment,{children:[e.jsx(ce,{className:"w-4 h-4"}),"Continue with Google"]})})]}),e.jsx("button",{type:"button",onClick:()=>k("dashboard"),className:"w-full py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors",children:"← Back to Dashboard"})]})]})})})};export{st as default};
