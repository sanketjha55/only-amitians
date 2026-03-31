import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://erpugsanonwocuockbfl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycHVnc2Fub253b2N1b2NrYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjc1NTEsImV4cCI6MjA4MzY0MzU1MX0.QDftsH8dPVYQN0rsTbJqpMyh3KQwlQzJ7VM0VLElGX0";
const SEM4_DRIVE_LINK = "https://drive.google.com/drive/folders/1gUwjzRV33DCBd_Eq-Fo2rpO0qm9nebGU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);

let currentFlow = { step: 'dept', dept: '', course: '', sem: '', cat: '' };

const showLoader = () => $("loadingOverlay").style.display = "flex";
const hideLoader = () => $("loadingOverlay").style.display = "none";
const cleanName = (n) => n.replace(/[^a-zA-Z0-9.]/g, '_').replace(/_{2,}/g, '_');
const asList = (data) => Array.isArray(data) ? data : [];

// --- STUDENT NAVIGATION ---
async function renderGrid() {
    const grid = $("mainGrid");
    const title = $("viewTitle");
    const back = $("backBtn");
    const news = $("newsWrapper");
    grid.innerHTML = "";
    showLoader();

    try {
        back.classList.remove('hidden');
        if(currentFlow.step === 'dept') {
            news.classList.remove('hidden');
            title.innerText = "Select Department";
            const { data, error } = await supabase.from("departments").select("*");
            if (error) throw error;
            const departments = asList(data);
            const sem4Card = `<div class="portal-item" onclick="window.open('${SEM4_DRIVE_LINK}', '_blank')"><div class="pi-ico">📚</div><div class="pi-title">BTech CSE Sem 4 Drive</div></div>`;
            const deptCards = departments.map(d => `<div class="portal-item" onclick="selD('${d.code}')"><div class="pi-ico">🏫</div><div class="pi-title">${d.code}</div></div>`).join("");
            grid.innerHTML = sem4Card + deptCards;
        } else {
            back.classList.remove('hidden'); news.classList.add('hidden');
            if(currentFlow.step === 'course') {
                title.innerText = `Courses in ${currentFlow.dept}`;
                const { data, error } = await supabase.from("courses").select("*").eq("dept_code", currentFlow.dept);
                if (error) throw error;
                const courses = asList(data);
                grid.innerHTML = courses.map(c => `<div class="portal-item" onclick="selC('${c.name}')"><div class="pi-ico">🎓</div><div class="pi-title">${c.name}</div></div>`).join("") || "No courses found.";
            } else if(currentFlow.step === 'sem') {
                title.innerText = "Select Semester";
                grid.innerHTML = [1,2,3,4,5,6,7,8].map(s => `<div class="portal-item" onclick="selS('${s}')"><div class="pi-ico">📅</div><div class="pi-title">Sem ${s}</div></div>`).join("");
            } else if(currentFlow.step === 'cat') {
                title.innerText = "Choose Category";
                grid.innerHTML = ["Notes", "PYQs", "PPTs", "Practicals"].map(c => `<div class="portal-item" onclick="selCat('${c}')"><div class="pi-ico">📂</div><div class="pi-title">${c}</div></div>`).join("");
            } else if(currentFlow.step === 'files') {
                title.innerText = "Available Files";
                const { data, error } = await supabase.from("documents").select("*").eq("department", currentFlow.dept).eq("course", currentFlow.course).eq("semester", currentFlow.sem).eq("category", currentFlow.cat);
                if (error) throw error;
                const files = asList(data);
                grid.innerHTML = files.map(f => `<div class="portal-item" onclick="window.open('${f.file_url}')"><div class="pi-ico">📄</div><div class="pi-title">${f.title}</div></div>`).join("") || "No files found.";
            }
        }
    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div class="portal-item"><div class="pi-title">Data load issue. Please try again.</div></div>`;
    }
    hideLoader();
}

window.selD = (c) => { currentFlow.dept = c; currentFlow.step = 'course'; renderGrid(); };
window.selC = (n) => { currentFlow.course = n; currentFlow.step = 'sem'; renderGrid(); };
window.selS = (s) => { currentFlow.sem = s; currentFlow.step = 'cat'; renderGrid(); };
window.selCat = (c) => { currentFlow.cat = c; currentFlow.step = 'files'; renderGrid(); };
window.handleBack = () => {
    const steps = ['dept', 'course', 'sem', 'cat', 'files'];
    const currentIndex = steps.indexOf(currentFlow.step);
    if (currentIndex <= 0) {
        goLogin();
        return;
    }
    currentFlow.step = steps[currentIndex - 1];
    renderGrid();
};

// --- ADMIN FUNCTIONS (FIXED) ---
async function syncAdmin() {
    const { data: depts } = await supabase.from("departments").select("*");
    const { data: courses } = await supabase.from("courses").select("*");
    const { data: docs } = await supabase.from("documents").select("*");
    const { data: news } = await supabase.from("news").select("*");
    const { data: tips } = await supabase.from("tips").select("*");

    const deptList = asList(depts);
    const courseList = asList(courses);
    const docList = asList(docs);
    const newsList = asList(news);
    const tipList = asList(tips);

    const opt = deptList.map(d => `<option value="${d.code}">${d.name}</option>`).join("");
    $("courseDeptSelect").innerHTML = `<option value="">Select Department</option>` + opt;
    $("selDept").innerHTML = `<option value="">Select Department</option>` + opt;

    $("adminDeptList").innerHTML = deptList.map(d => `<div class="admin-row"><span>${d.name} (${d.code})</span><div class="action-btns"><i class="fas fa-edit" onclick="editItem('departments', ${d.id}, 'name', '${d.name}')"></i><i class="fas fa-trash" onclick="delItem('departments', ${d.id})"></i></div></div>`).join("");
    $("adminCourseList").innerHTML = courseList.map(c => `<div class="admin-row"><span>${c.name} (${c.dept_code})</span><i class="fas fa-trash" onclick="delItem('courses', ${c.id})"></i></div>`).join("");
    $("adminDocList").innerHTML = docList.map(o => `<div class="admin-row"><span>${o.title} (${o.category})</span><i class="fas fa-trash" onclick="delItem('documents', ${o.id})"></i></div>`).join("");
    $("adminNewsList").innerHTML = newsList.map(n => `<div class="admin-row"><span>${n.title}</span><i class="fas fa-trash" onclick="delItem('news', ${n.id})"></i></div>`).join("");
    $("adminTipList").innerHTML = tipList.map(t => `<div class="admin-row"><span>${t.content}</span><i class="fas fa-trash" onclick="delItem('tips', ${t.id})"></i></div>`).join("");
}

window.addD = async () => {
    const { error } = await supabase.from("departments").insert([{ code:$("dCode").value, name:$("dName").value }]);
    if (error) return alert(`Department add failed: ${error.message}`);
    syncAdmin();
};
window.addCourse = async () => {
    const { error } = await supabase.from("courses").insert([{ dept_code:$("courseDeptSelect").value, name:$("courseName").value }]);
    if (error) return alert(`Course add failed: ${error.message}`);
    syncAdmin();
};
window.addNews = async () => {
    const { error } = await supabase.from("news").insert([{ title:$("newsT").value, description:$("newsD").value }]);
    if (error) return alert(`News add failed: ${error.message}`);
    syncAdmin();
};
window.addTip = async () => {
    const { error } = await supabase.from("tips").insert([{ content:$("tipIn").value }]);
    if (error) return alert(`Tip add failed: ${error.message}`);
    syncAdmin();
};
 
// --- DOCUMENT UPLOAD ---
window.upDoc = async () => {
    const f = $("fInput").files[0];
    if (!f) return alert("Select File!");

    showLoader();

    try {
        const sName = `${Date.now()}_${cleanName(f.name)}`;

        // Upload file to bucket
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from("documents")
            .upload(sName, f, { upsert: true }); // allow overwrite

        if (uploadError) throw uploadError; // stop if upload fails
        console.log("File uploaded to bucket:", uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(sName);
        console.log("Public URL:", urlData.publicUrl);

        // Insert record into database
        const { error: insertError } = await supabase.from("documents").insert([{
            title: $("docT").value,
            department: $("selDept").value,
            course: $("selCourse").value,
            semester: parseInt($("selSem").value),
            category: $("selCat").value,
            file_url: urlData.publicUrl,
            created_at: new Date().toISOString()
        }]);

        if (insertError) throw insertError;

        alert("Success! File uploaded to bucket and DB.");
        syncAdmin();

    } catch (err) {
        console.error("Upload failed:", err);
        alert("Error uploading file: " + err.message);
    } finally {
        hideLoader();
    }
};


// --- EDIT & DELETE ---
window.editItem = async (table, id, col, oldVal) => {
    const newVal = prompt("Enter new value:", oldVal);
    if(newVal) { await supabase.from(table).update({ [col]: newVal }).eq("id", id); syncAdmin(); }
};

window.delItem = async (table, id) => {
    if(confirm("Confirm Delete?")) { await supabase.from(table).delete().eq("id", id); syncAdmin(); }
};

window.loadAdminCourses = async () => {
    const { data } = await supabase.from("courses").select("*").eq("dept_code", $("selDept").value);
    const courses = asList(data);
    $("selCourse").innerHTML = courses.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
};

// --- GLOBAL SEARCH & SYNC ---
window.liveSearch = async (val) => {
    const box = $("searchRes");
    if(val.length < 2) { box.style.display = "none"; return; }
    const { data } = await supabase.from("documents").select("*").ilike("title", `%${val}%`);
    const docs = asList(data);
    box.innerHTML = docs.map(o => `<div class="search-item" onclick="window.open('${o.file_url}')">📄 ${o.title} (${o.category})</div>`).join("");
    box.style.display = "block";
};

async function syncHome() {
    const { data: t } = await supabase.from("tips").select("*");
    if(t) $("tipMarquee").innerText = t.map(x => x.content).join("  •  🚀  •  ");
    const { data: n } = await supabase.from("news").select("*").order('created_at',{ascending:false});
    if(n) $("newsSection").innerHTML = n.map(x => `<div class="news-card"><h4>${x.title}</h4><p>${x.description}</p></div>`).join("");
}

window.openStudent = () => {
    document.body.style.alignItems = "flex-start";
    $("loginPage").style.display="none";
    $("studentPage").style.display="block";
    renderGrid();
    syncHome();
};
window.openAdmin = () => $("adminBox").style.display="block";
window.adminLogin = () => { if($("adminPassword").value==="10062006") { $("loginPage").style.display="none"; $("adminPage").style.display="flex"; syncAdmin(); } };
window.goLogin = () => location.reload();
window.showForm = id => { document.querySelectorAll(".admin-form").forEach(f => f.style.display="none"); $(id).style.display="block"; };

document.addEventListener("DOMContentLoaded", syncHome);