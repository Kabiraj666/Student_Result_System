/* ==========================================================================
   STUDENT RESULT MANAGEMENT SYSTEM - JAVASCRIPT ENGINE (app.js)
   ========================================================================== */

// --- 1. CORE DATA MODELS & STATE MANAGEMENT ---

// Local in-memory state
let students = [];

// Active editing tracking
let activeStudentRoll = null;

// Log system actions
function addSystemLog(action, status = "info") {
    const logsContainer = document.getElementById("system-logs-container");
    if (!logsContainer) return;
    const timestamp = new Date().toLocaleTimeString();
    
    let statusClass = "log-info";
    let statusLabel = "[INFO]";
    if (status === "success") {
        statusClass = "log-success";
        statusLabel = "[FILE IO]";
    } else if (status === "error") {
        statusClass = "log-error";
        statusLabel = "[ERROR]";
    }
    
    const logItem = document.createElement("div");
    logItem.className = "log-item";
    logItem.innerHTML = `<span class="log-time">${timestamp}</span> <span class="${statusClass}">${statusLabel}</span> ${action}`;
    
    logsContainer.appendChild(logItem);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Compute Grade and GPA Points from numeric score (replicates Java class CourseGrade.java)
function computeGradeDetails(marks) {
    let letterGrade = "F";
    let gpaPoints = 0.0;
    
    if (marks >= 90) {
        letterGrade = "O";
        gpaPoints = 10.0;
    } else if (marks >= 80) {
        letterGrade = "E";
        gpaPoints = 9.0;
    } else if (marks >= 70) {
        letterGrade = "A";
        gpaPoints = 8.0;
    } else if (marks >= 60) {
        letterGrade = "B";
        gpaPoints = 7.0;
    } else if (marks >= 50) {
        letterGrade = "C";
        gpaPoints = 6.0;
    } else if (marks >= 40) {
        letterGrade = "D";
        gpaPoints = 5.0;
    } else {
        letterGrade = "F";
        gpaPoints = 2.0;
    }
    
    return { letterGrade, gpaPoints };
}

// Calculate Student SGPA (replicates Java Student.java calculateSGPA())
function calculateStudentSGPA(student) {
    if (!student.grades || student.grades.length === 0) {
        return 0.0;
    }
    let totalPoints = 0;
    let totalCredits = 0;
    student.grades.forEach(g => {
        totalPoints += (g.gpaPoints * g.credits);
        totalCredits += g.credits;
    });
    return totalCredits === 0 ? 0.0 : totalPoints / totalCredits;
}

// Save mock file writing trigger
function triggerDatabaseFlush() {
    addSystemLog("Flushing list collections to storage stream...", "info");
    setTimeout(() => {
        addSystemLog("Successfully committed changes to data/students_db.txt", "success");
    }, 100);
}

// Determine if we are hosted by our Node server or opened as a static file://
const IS_SERVER_ACTIVE = window.location.protocol.startsWith('http');

// Synchronize state with Node server backend (with automatic localStorage fallback)
async function syncStateWithBackend(actionType, payload = {}) {
    if (!IS_SERVER_ACTIVE) {
        return syncStateLocalOnly(actionType, payload);
    }
    
    try {
        switch (actionType) {
            case 'LOAD':
                const res = await fetch('/api/students');
                if (!res.ok) throw new Error("API load failed");
                students = await res.json();
                break;
            case 'ADD_STUDENT':
                const addRes = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!addRes.ok) {
                    const errObj = await addRes.json();
                    throw new Error(errObj.error || "API add failed");
                }
                break;
            case 'UPDATE_STUDENT':
                const updRes = await fetch(`/api/students/${payload.rollNumber}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!updRes.ok) throw new Error("API update failed");
                break;
            case 'DELETE_STUDENT':
                const delRes = await fetch(`/api/students/${payload.rollNumber}`, {
                    method: 'DELETE'
                });
                if (!delRes.ok) throw new Error("API delete failed");
                break;
            case 'ADD_GRADE':
                const gradeRes = await fetch(`/api/students/${payload.rollNumber}/grades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload.grade)
                });
                if (!gradeRes.ok) throw new Error("API add grade failed");
                break;
            case 'DELETE_GRADE':
                const delGRes = await fetch(`/api/students/${payload.rollNumber}/grades/${payload.courseCode}`, {
                    method: 'DELETE'
                });
                if (!delGRes.ok) throw new Error("API delete grade failed");
                break;
        }
        
        // Reload fresh copy from database
        const freshRes = await fetch('/api/students');
        students = await freshRes.json();
        addSystemLog(`Server DB Sync: Action ${actionType} persisted successfully.`, "success");
        
    } catch (err) {
        addSystemLog(`Server sync unavailable: ${err.message}. Falling back to Browser LocalStorage.`, "error");
        return syncStateLocalOnly(actionType, payload);
    }
}

// Fallback LocalStorage Syncing
function syncStateLocalOnly(actionType, payload) {
    let localData = localStorage.getItem('students_db');
    if (localData) {
        students = JSON.parse(localData);
    } else {
        // Seed default records if empty
        students = [
            {
                id: "STU1",
                name: "Aditya Sharma",
                email: "aditya.sharma@btech.edu",
                rollNumber: "BT22CSE001",
                semester: 4,
                grades: [
                    { courseCode: "CS201", courseName: "Data Structures", credits: 4, marks: 88.0, letterGrade: "E", gpaPoints: 9.0 },
                    { courseCode: "CS202", courseName: "Object Oriented Programming", credits: 3, marks: 94.0, letterGrade: "O", gpaPoints: 10.0 },
                    { courseCode: "CS203", courseName: "Discrete Mathematics", credits: 4, marks: 76.5, letterGrade: "A", gpaPoints: 8.0 }
                ]
            },
            {
                id: "STU2",
                name: "Priyanka Verma",
                email: "priyanka.v@btech.edu",
                rollNumber: "BT22CSE012",
                semester: 4,
                grades: [
                    { courseCode: "CS201", courseName: "Data Structures", credits: 4, marks: 95.0, letterGrade: "O", gpaPoints: 10.0 },
                    { courseCode: "CS202", courseName: "Object Oriented Programming", credits: 3, marks: 91.0, letterGrade: "O", gpaPoints: 10.0 },
                    { courseCode: "CS203", courseName: "Discrete Mathematics", credits: 4, marks: 82.0, letterGrade: "E", gpaPoints: 9.0 }
                ]
            },
            {
                id: "STU3",
                name: "Rohan Das",
                email: "rohan.das@btech.edu",
                rollNumber: "BT22ECE034",
                semester: 4,
                grades: [
                    { courseCode: "EC201", courseName: "Digital Electronics", credits: 4, marks: 62.0, letterGrade: "B", gpaPoints: 7.0 },
                    { courseCode: "EC202", courseName: "Signals and Systems", credits: 4, marks: 55.5, letterGrade: "C", gpaPoints: 6.0 },
                    { courseCode: "CS202", courseName: "Object Oriented Programming", credits: 3, marks: 80.0, letterGrade: "E", gpaPoints: 9.0 }
                ]
            }
        ];
    }
    
    switch (actionType) {
        case 'LOAD':
            if (!localData) {
                localStorage.setItem('students_db', JSON.stringify(students));
            }
            break;
        case 'ADD_STUDENT':
            if (students.some(s => s.rollNumber.equalsIgnoreCase(payload.rollNumber))) {
                throw new Error("Student Roll Number already exists!");
            }
            students.push(payload);
            localStorage.setItem('students_db', JSON.stringify(students));
            break;
        case 'UPDATE_STUDENT':
            const stu = students.find(s => s.rollNumber.equalsIgnoreCase(payload.rollNumber));
            if (stu) {
                stu.name = payload.name;
                stu.email = payload.email;
                stu.semester = payload.semester;
            }
            localStorage.setItem('students_db', JSON.stringify(students));
            break;
        case 'DELETE_STUDENT':
            students = students.filter(s => !s.rollNumber.equalsIgnoreCase(payload.rollNumber));
            localStorage.setItem('students_db', JSON.stringify(students));
            break;
        case 'ADD_GRADE':
            const gStu = students.find(s => s.rollNumber.equalsIgnoreCase(payload.rollNumber));
            if (gStu) {
                const existingIdx = gStu.grades.findIndex(g => g.courseCode.equalsIgnoreCase(payload.grade.courseCode));
                if (existingIdx !== -1) {
                    gStu.grades[existingIdx] = payload.grade;
                } else {
                    gStu.grades.push(payload.grade);
                }
            }
            localStorage.setItem('students_db', JSON.stringify(students));
            break;
        case 'DELETE_GRADE':
            const dgStu = students.find(s => s.rollNumber.equalsIgnoreCase(payload.rollNumber));
            if (dgStu) {
                dgStu.grades = dgStu.grades.filter(g => !g.courseCode.equalsIgnoreCase(payload.courseCode));
            }
            localStorage.setItem('students_db', JSON.stringify(students));
            break;
    }
    addSystemLog(`Local Database Sync: ${actionType} saved to browser storage.`, "info");
}

// --- 2. DASHBOARD SYNCHRONIZATION ---

function updateDashboardUI() {
    const tableBody = document.getElementById("students-table-body");
    tableBody.innerHTML = "";
    
    let totalStudents = students.length;
    let sumSgpa = 0.0;
    let gradedCount = 0;
    let classTopper = null;
    let topperSgpa = -1.0;
    
    // Distribution counters
    let distribution = { "O": 0, "E": 0, "A": 0, "B": 0, "C": 0, "D": 0, "F": 0, "I": 0 };
    let uniqueCourses = new Set();
    
    students.forEach(student => {
        const sgpa = calculateStudentSGPA(student);
        sumSgpa += sgpa;
        if (student.grades.length > 0) {
            gradedCount++;
            if (sgpa > topperSgpa) {
                topperSgpa = sgpa;
                classTopper = student;
            }
        }
        
        // Count grade frequencies across all recorded courses
        student.grades.forEach(g => {
            if (distribution[g.letterGrade] !== undefined) {
                distribution[g.letterGrade]++;
            }
            uniqueCourses.add(g.courseCode);
        });
        
        // Render Row
        const row = document.createElement("tr");
        
        let gpaClass = "low";
        if (sgpa >= 8.5) gpaClass = "high";
        else if (sgpa >= 7.0) gpaClass = "mid";
        
        row.innerHTML = `
            <td><strong>${student.rollNumber}</strong></td>
            <td>${student.name}</td>
            <td><span style="font-size: 0.8rem; color: var(--text-muted);">${student.email}</span></td>
            <td><span class="badge badge-sem">Sem ${student.semester}</span></td>
            <td><span class="badge-gpa ${gpaClass}">${sgpa.toFixed(2)}</span></td>
            <td><strong>${student.grades.length}</strong> courses</td>
            <td class="action-cell">
                <button class="btn-icon grade-icon" onclick="openGradesModal('${student.rollNumber}')" title="Manage Grades">
                    <i class="fa-solid fa-graduation-cap"></i>
                </button>
                <button class="btn-icon edit-icon" onclick="openEditStudentModal('${student.rollNumber}')" title="Edit Student">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon delete-icon" onclick="deleteStudentState('${student.rollNumber}')" title="Delete Student">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        
        row.addEventListener('click', (e) => {
            if (e.target.closest('.action-cell')) {
                return;
            }
            openStudentDrawer(student.rollNumber);
        });
        
        tableBody.appendChild(row);
    });
    
    // Update KPI Card values
    document.getElementById("kpi-total-students").innerText = totalStudents;
    const avgSgpa = gradedCount === 0 ? 0.00 : sumSgpa / gradedCount;
    document.getElementById("kpi-avg-sgpa").innerText = avgSgpa.toFixed(2);
    document.getElementById("kpi-total-courses").innerText = uniqueCourses.size;
    
    if (classTopper) {
        document.getElementById("kpi-topper-name").innerText = classTopper.name;
        document.getElementById("kpi-topper-sgpa").innerText = `Roll: ${classTopper.rollNumber} | SGPA: ${topperSgpa.toFixed(2)}`;
    } else {
        document.getElementById("kpi-topper-name").innerText = "None";
        document.getElementById("kpi-topper-sgpa").innerText = "SGPA: 0.00";
    }
    
    // Update Distribution bar charts
    const distContainer = document.getElementById("grade-distribution-container");
    distContainer.innerHTML = "";
    
    let maxCount = Math.max(...Object.values(distribution), 1);
    
    const gradesSorted = ["O", "E", "A", "B", "C", "D", "F", "I"];
    gradesSorted.forEach(gradeKey => {
        const count = distribution[gradeKey] || 0;
        const pct = (count / maxCount) * 100;
        
        let fillClass = "muted";
        if (gradeKey === "O" || gradeKey === "E") fillClass = "primary";
        else if (gradeKey === "A" || gradeKey === "B") fillClass = "orange";
        
        const barRow = document.createElement("div");
        barRow.className = "grade-bar-row";
        barRow.innerHTML = `
            <span class="grade-label">${gradeKey}</span>
            <div class="grade-progress-bg">
                <div class="grade-progress-fill ${fillClass}" style="width: ${pct}%"></div>
            </div>
            <span class="grade-count">${count}</span>
        `;
        distContainer.appendChild(barRow);
    });
}

// Helper validation function (replicates validations inside Java CLI)
function validateStudentInputs(name, email) {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
        throw new Error("Name must contain only letters and spaces!");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address!");
    }
}

// Add student operation
async function addStudentState(rollNumber, name, email, semester) {
    try {
        validateStudentInputs(name, email);
    } catch (err) {
        addSystemLog(`Validation failed: ${err.message}`, "error");
        throw err;
    }
    
    const newStudent = {
        id: "STU" + Math.floor(Math.random() * 90000 + 10000),
        name: name,
        email: email,
        rollNumber: rollNumber.toUpperCase(),
        semester: parseInt(semester),
        grades: []
    };
    
    await syncStateWithBackend('ADD_STUDENT', newStudent);
    updateDashboardUI();
}

// Edit student details
async function updateStudentState(rollNumber, name, email, semester) {
    try {
        validateStudentInputs(name, email);
    } catch (err) {
        addSystemLog(`Validation failed: ${err.message}`, "error");
        throw err;
    }
    
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (!student) {
        addSystemLog(`Update failed. Roll ${rollNumber} not found.`, "error");
        throw new Error("Student not found.");
    }
    
    const updatedData = {
        rollNumber: rollNumber,
        name: name,
        email: email,
        semester: parseInt(semester)
    };
    
    await syncStateWithBackend('UPDATE_STUDENT', updatedData);
    updateDashboardUI();
}

// Delete student operation
async function deleteStudentState(rollNumber) {
    const idx = students.findIndex(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (idx === -1) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${students[idx].name} (${rollNumber})?`);
    if (confirmDelete) {
        await syncStateWithBackend('DELETE_STUDENT', { rollNumber: rollNumber });
        updateDashboardUI();
    }
}

// Case insensitive comparison helper
String.prototype.equalsIgnoreCase = function (other) {
    return this.toLowerCase() === other.toLowerCase();
};

// --- 3. MODALS EVENT HANDLERS ---

const addStudentModal = document.getElementById("add-student-modal");
const manageGradesModal = document.getElementById("manage-grades-modal");
const addStudentForm = document.getElementById("add-student-form");
const addGradeForm = document.getElementById("add-grade-form");

// Open Student Add Modal
document.getElementById("btn-open-add-modal").addEventListener("click", () => {
    addStudentForm.reset();
    document.getElementById("student-roll").disabled = false; // Enable roll number input
    activeStudentRoll = null; // Adding mode
    addStudentModal.classList.add("active");
});

// Close Modals & Drawers
document.getElementById("btn-close-modal").addEventListener("click", () => addStudentModal.classList.remove("active"));
document.getElementById("btn-cancel-modal").addEventListener("click", () => addStudentModal.classList.remove("active"));
document.getElementById("btn-close-grade-modal").addEventListener("click", () => manageGradesModal.classList.remove("active"));
document.getElementById("btn-close-drawer").addEventListener("click", () => document.getElementById("student-drawer").classList.remove("active"));
document.getElementById("student-drawer").addEventListener("click", (e) => {
    if (e.target.id === 'student-drawer') {
        document.getElementById("student-drawer").classList.remove("active");
    }
});
document.getElementById("btn-drawer-manage-grades").addEventListener("click", () => {
    document.getElementById("student-drawer").classList.remove("active");
    openGradesModal(activeStudentRoll);
});

// Edit Student Modal trigger
function openEditStudentModal(rollNumber) {
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (!student) return;
    
    document.getElementById("student-roll").value = student.rollNumber;
    document.getElementById("student-roll").disabled = true; // Lock roll number
    document.getElementById("student-name").value = student.name;
    document.getElementById("student-email").value = student.email;
    document.getElementById("student-semester").value = student.semester;
    
    activeStudentRoll = rollNumber; // Edit mode flag
    addStudentModal.classList.add("active");
}

// Submit Add/Edit Student Form
addStudentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const roll = document.getElementById("student-roll").value.trim();
    const name = document.getElementById("student-name").value.trim();
    const email = document.getElementById("student-email").value.trim();
    const sem = document.getElementById("student-semester").value;
    
    try {
        if (activeStudentRoll) {
            // Edit Mode
            await updateStudentState(activeStudentRoll, name, email, sem);
        } else {
            // Add Mode
            await addStudentState(roll, name, email, sem);
        }
        addStudentModal.classList.remove("active");
    } catch (err) {
        alert(err.message);
    }
});

// Open Grades Management Modal
function openGradesModal(rollNumber) {
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (!student) return;
    
    activeStudentRoll = rollNumber;
    document.getElementById("grade-modal-title").innerText = `Manage Grades: ${student.name} (${rollNumber})`;
    addGradeForm.reset();
    
    renderGradesTable(student);
    manageGradesModal.classList.add("active");
}

// Open Detailed Slide-out Student Profile Drawer (Polished KPI Visualizer)
function openStudentDrawer(rollNumber) {
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (!student) return;
    
    activeStudentRoll = rollNumber;
    
    document.getElementById("drawer-student-name").innerText = student.name;
    document.getElementById("drawer-student-roll").innerText = student.rollNumber;
    document.getElementById("drawer-student-sem").innerText = student.semester;
    document.getElementById("drawer-student-email").innerText = student.email;
    
    const sgpa = calculateStudentSGPA(student);
    document.getElementById("drawer-student-sgpa").innerText = sgpa.toFixed(2);
    
    // Academic Standing Ranking logic
    let rank = "No Grades Yet";
    if (student.grades.length > 0) {
        if (sgpa >= 9.0) rank = "Topper (Distinction)";
        else if (sgpa >= 7.5) rank = "First Class";
        else if (sgpa >= 6.0) rank = "Second Class";
        else if (sgpa >= 4.0) rank = "Pass Class";
        else rank = "Failing";
    }
    document.getElementById("drawer-student-rank").innerText = rank;
    
    // Circular GPA Ring SVG gauge math
    const ringFill = document.getElementById("drawer-gpa-ring-fill");
    const ringTextVal = document.getElementById("drawer-gpa-ring-text-val");
    
    ringTextVal.innerText = sgpa.toFixed(2);
    
    const circumference = 314.159; // 2 * pi * r (r=50)
    const dashOffset = circumference - (sgpa / 10.0) * circumference;
    
    ringFill.style.strokeDashoffset = dashOffset;
    
    // Colorize ring adaptively based on GPA performance
    if (sgpa >= 8.5) {
        ringFill.style.stroke = "var(--primary)"; // Crimson Neon glow
    } else if (sgpa >= 7.0) {
        ringFill.style.stroke = "var(--color-orange)"; // Orange alert
    } else if (sgpa >= 4.0) {
        ringFill.style.stroke = "var(--color-blue)"; // Blue safe
    } else {
        ringFill.style.stroke = "var(--color-red)"; // Red failing
    }
    
    // Populate Scorecard list inside Drawer
    const listContainer = document.getElementById("drawer-courses-list");
    listContainer.innerHTML = "";
    
    if (student.grades.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin: 1.5rem 0;">No courses graded yet.</div>`;
    } else {
        student.grades.forEach(g => {
            let gradeBadgeClass = "c";
            if (g.letterGrade === "O") gradeBadgeClass = "aplus";
            else if (g.letterGrade === "E") gradeBadgeClass = "a";
            else if (g.letterGrade === "A" || g.letterGrade === "B") gradeBadgeClass = "b";
            else if (g.letterGrade === "F") gradeBadgeClass = "f";
            
            const card = document.createElement("div");
            card.className = "drawer-course-card";
            card.innerHTML = `
                <div>
                    <span class="d-course-code">${g.courseCode}</span>
                    <span class="d-course-name">${g.courseName}</span>
                    <span class="d-course-credits">${g.credits} Credits</span>
                </div>
                <div class="d-course-grade-block">
                    <span class="d-course-marks">${g.marks.toFixed(1)}</span>
                    <span class="badge badge-grade ${gradeBadgeClass} d-course-badge">${g.letterGrade}</span>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }
    
    document.getElementById("student-drawer").classList.add("active");
}

// Render grades list inside modal
function renderGradesTable(student) {
    const body = document.getElementById("student-grades-list-body");
    body.innerHTML = "";
    
    if (student.grades.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No courses recorded yet.</td></tr>`;
        return;
    }
    
    student.grades.forEach(g => {
        const row = document.createElement("tr");
        
        let gradeBadgeClass = "c";
        if (g.letterGrade === "O") gradeBadgeClass = "aplus";
        else if (g.letterGrade === "E") gradeBadgeClass = "a";
        else if (g.letterGrade === "A" || g.letterGrade === "B") gradeBadgeClass = "b";
        else if (g.letterGrade === "F") gradeBadgeClass = "f";
        
        row.innerHTML = `
            <td><strong>${g.courseCode}</strong></td>
            <td>${g.courseName}</td>
            <td>${g.credits}</td>
            <td>${g.marks.toFixed(1)}</td>
            <td><span class="badge badge-grade ${gradeBadgeClass}">${g.letterGrade}</span></td>
            <td class="action-cell">
                <button class="btn-icon edit-icon" onclick="editGradeInForm('${g.courseCode}', '${g.courseName.replace(/'/g, "\\'")}', ${g.credits}, ${g.marks})" title="Edit Score">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon delete-icon" onclick="deleteGradeState('${student.rollNumber}', '${g.courseCode}')" title="Delete Course">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        body.appendChild(row);
    });
}

// Populate the left-side score card form for grade updates
function editGradeInForm(code, name, credits, marks) {
    document.getElementById("course-code").value = code;
    document.getElementById("course-name").value = name;
    document.getElementById("course-credits").value = credits;
    document.getElementById("course-marks").value = marks;
    
    // Focus cursor directly into the marks text box for immediate correction
    document.getElementById("course-marks").focus();
}

// Add course grade submit
addGradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(activeStudentRoll));
    if (!student) return;
    
    const code = document.getElementById("course-code").value.trim().toUpperCase();
    const name = document.getElementById("course-name").value.trim();
    const credits = parseInt(document.getElementById("course-credits").value);
    const marks = parseFloat(document.getElementById("course-marks").value);
    
    if (marks < 0 || marks > 100) {
        alert("Invalid marks! Marks must be between 0 and 100.");
        return;
    }
    if (credits < 1 || credits > 6) {
        alert("Invalid credits! Credits must be between 1 and 6.");
        return;
    }
    
    const gradeDetails = computeGradeDetails(marks);
    const newGrade = {
        courseCode: code,
        courseName: name,
        credits: credits,
        marks: marks,
        letterGrade: gradeDetails.letterGrade,
        gpaPoints: gradeDetails.gpaPoints
    };
    
    await syncStateWithBackend('ADD_GRADE', { rollNumber: activeStudentRoll, grade: newGrade });
    
    const updatedStudent = students.find(s => s.rollNumber.equalsIgnoreCase(activeStudentRoll));
    renderGradesTable(updatedStudent);
    updateDashboardUI();
    addGradeForm.reset();
});

// Delete course grade
async function deleteGradeState(rollNumber, courseCode) {
    const student = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    if (!student) return;
    
    await syncStateWithBackend('DELETE_GRADE', { rollNumber: rollNumber, courseCode: courseCode });
    
    const updatedStudent = students.find(s => s.rollNumber.equalsIgnoreCase(rollNumber));
    renderGradesTable(updatedStudent);
    updateDashboardUI();
}

// Search Filter
document.getElementById("student-search-input").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll("#students-table-body tr");
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

// --- 4. JAVA CLI TERMINAL SIMULATOR ENGINE ---

const terminalScreen = document.getElementById("terminal-screen");
const terminalInput = document.getElementById("terminal-input");

// Simulator State Engine
let cliState = "MENU";
let cliTempData = {};

function printCLI(text, cssClass = "") {
    const line = document.createElement("div");
    line.className = `terminal-line ${cssClass}`;
    line.innerText = text;
    terminalScreen.appendChild(line);
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
}

// Clear terminal screen
function clearCLIScreen() {
    terminalScreen.innerHTML = "";
}

// Reset/Initialize Terminal
function initCLI() {
    clearCLIScreen();
    printCLI("==================================================", "output-title");
    printCLI("       STUDENT RESULT MANAGEMENT SYSTEM CLI       ", "output-title");
    printCLI("==================================================", "output-title");
    printCLIMenu();
}

function printCLIMenu() {
    printCLI("--------------------------------------------------", "output-menu");
    printCLI("1. Add New Student", "output-menu");
    printCLI("2. View All Students", "output-menu");
    printCLI("3. Search Student by Roll Number", "output-menu");
    printCLI("4. Search Students by Name", "output-menu");
    printCLI("5. Add/Update Course Grade", "output-menu");
    printCLI("6. Remove Course Grade", "output-menu");
    printCLI("7. Update Student Details", "output-menu");
    printCLI("8. Delete Student", "output-menu");
    printCLI("9. View Class Statistics", "output-menu");
    printCLI("10. Exit", "output-menu");
    printCLI("--------------------------------------------------", "output-menu");
    printCLI("Enter choice (1-10): ");
    cliState = "MENU";
}

// Handle Terminal Inputs
terminalInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        const input = terminalInput.value;
        terminalInput.value = "";
        
        // Print echo command
        printCLI("> " + input, "user-input-line");
        await processCLIInput(input.trim());
    }
});

async function processCLIInput(input) {
    if (cliState === "MENU") {
        switch (input) {
            case "1":
                printCLI("--- Add New Student ---");
                printCLI("Enter Roll Number (e.g., BT22CSE045): ");
                cliState = "ADD_STUDENT_ROLL";
                break;
            case "2":
                printCLI("--- View All Students ---");
                printCLI("Sort options:\n1. Sort by Roll Number\n2. Sort by Name\n3. Sort by SGPA (Highest first)");
                printCLI("Select sorting option (1-3): ");
                cliState = "VIEW_STUDENTS_SORT";
                break;
            case "3":
                printCLI("--- Search Student by Roll Number ---");
                printCLI("Enter Roll Number to search: ");
                cliState = "SEARCH_ROLL";
                break;
            case "4":
                printCLI("--- Search Students by Name ---");
                printCLI("Enter name keyword: ");
                cliState = "SEARCH_NAME";
                break;
            case "5":
                printCLI("--- Add/Update Course Grade ---");
                printCLI("Enter Student Roll Number: ");
                cliState = "ADD_GRADE_ROLL";
                break;
            case "6":
                printCLI("--- Remove Course Grade ---");
                printCLI("Enter Student Roll Number: ");
                cliState = "REMOVE_GRADE_ROLL";
                break;
            case "7":
                printCLI("--- Update Student Details ---");
                printCLI("Enter Roll Number of student to update: ");
                cliState = "UPDATE_STUDENT_ROLL";
                break;
            case "8":
                printCLI("--- Delete Student Record ---");
                printCLI("Enter Roll Number of student to delete: ");
                cliState = "DELETE_ROLL";
                break;
            case "9":
                viewCLIClassStats();
                printCLIMenu();
                break;
            case "10":
                printCLI("Exiting Student Result System. Goodbye!", "output-title");
                setTimeout(() => {
                    initCLI();
                }, 2000);
                break;
            default:
                printCLI("Invalid Choice! Please enter a number between 1 and 10.", "output-error");
                printCLIMenu();
        }
    } else {
        // Nested CLI Input state handlers (sequential prompts)
        await handleStateFlow(input);
    }
}

async function handleStateFlow(input) {
    switch (cliState) {
        
        // --- ADD STUDENT STATE MACHINE ---
        case "ADD_STUDENT_ROLL":
            if (!input) {
                printCLI("Roll Number cannot be empty! Enter Roll Number: ", "output-error");
                return;
            }
            // Duplication check simulation
            const dup = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (dup) {
                printCLI(`Error: Student with Roll Number ${input.toUpperCase()} already exists!`, "output-error");
                printCLIMenu();
                return;
            }
            cliTempData.rollNumber = input;
            printCLI("Enter Name: ");
            cliState = "ADD_STUDENT_NAME";
            break;
            
        case "ADD_STUDENT_NAME":
            if (!input) {
                printCLI("Name cannot be empty! Enter Name: ", "output-error");
                return;
            }
            cliTempData.name = input;
            printCLI("Enter Email: ");
            cliState = "ADD_STUDENT_EMAIL";
            break;
            
        case "ADD_STUDENT_EMAIL":
            cliTempData.email = input || "unknown@btech.edu";
            printCLI("Enter Semester (1-8): ");
            cliState = "ADD_STUDENT_SEM";
            break;
            
        case "ADD_STUDENT_SEM":
            const sem = parseInt(input);
            if (isNaN(sem) || sem < 1 || sem > 8) {
                printCLI("Invalid Semester! Must be a number between 1 and 8. Enter Semester (1-8): ", "output-error");
                return;
            }
            cliTempData.semester = sem;
            
            // Invoke State insertion (matches Java backend)
            await addStudentState(cliTempData.rollNumber, cliTempData.name, cliTempData.email, cliTempData.semester);
            printCLI(`Student added successfully! Details: Student Profile [Roll No: ${cliTempData.rollNumber.toUpperCase()}] | Name: ${cliTempData.name} | Sem: ${cliTempData.semester} | SGPA: 0.00`, "output-success");
            
            cliTempData = {};
            printCLIMenu();
            break;

        // --- VIEW STUDENTS SORT ---
        case "VIEW_STUDENTS_SORT":
            let sorted = [...students];
            if (input === "2") {
                sorted.sort((a,b) => a.name.localeCompare(b.name));
                printCLI("[Sorted by Name]");
            } else if (input === "3") {
                sorted.sort((a,b) => calculateStudentSGPA(b) - calculateStudentSGPA(a));
                printCLI("[Sorted by SGPA Descending]");
            } else {
                sorted.sort((a,b) => a.rollNumber.localeCompare(b.rollNumber));
                printCLI("[Sorted by Roll Number]");
            }
            printCLIStudentTable(sorted);
            printCLIMenu();
            break;

        // --- SEARCH ROLL ---
        case "SEARCH_ROLL":
            const foundStu = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (!foundStu) {
                printCLI(`StudentNotFoundException: Student with Roll Number '${input}' was not found.`, "output-error");
            } else {
                printCLISingleStudentDetails(foundStu);
            }
            printCLIMenu();
            break;

        // --- SEARCH NAME ---
        case "SEARCH_NAME":
            const matches = students.filter(s => s.name.toLowerCase().includes(input.toLowerCase()));
            if (matches.length === 0) {
                printCLI(`No students matching '${input}' found.`);
            } else {
                printCLIStudentTable(matches);
            }
            printCLIMenu();
            break;

        // --- ADD/UPDATE GRADE STATE MACHINE ---
        case "ADD_GRADE_ROLL":
            const gStu = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (!gStu) {
                printCLI(`StudentNotFoundException: Student with Roll Number '${input}' was not found.`, "output-error");
                printCLIMenu();
                return;
            }
            cliTempData.rollNumber = input;
            printCLI("Enter Course Code (e.g., CS201): ");
            cliState = "ADD_GRADE_CODE";
            break;
            
        case "ADD_GRADE_CODE":
            if (!input) {
                printCLI("Course Code cannot be empty! Enter Course Code: ", "output-error");
                return;
            }
            cliTempData.courseCode = input.toUpperCase();
            printCLI("Enter Course Name: ");
            cliState = "ADD_GRADE_NAME";
            break;
            
        case "ADD_GRADE_NAME":
            cliTempData.courseName = input || "General Course";
            printCLI("Enter Course Credits (1-6): ");
            cliState = "ADD_GRADE_CREDITS";
            break;
            
        case "ADD_GRADE_CREDITS":
            const credits = parseInt(input);
            if (isNaN(credits) || credits < 1 || credits > 6) {
                printCLI("InvalidGradeException: Invalid Credits: " + input + ". Course credits must be between 1 and 6. Enter Course Credits (1-6): ", "output-error");
                return;
            }
            cliTempData.credits = credits;
            printCLI("Enter Marks Obtained (0-100): ");
            cliState = "ADD_GRADE_MARKS";
            break;
            
        case "ADD_GRADE_MARKS":
            const marks = parseFloat(input);
            if (isNaN(marks) || marks < 0 || marks > 100) {
                printCLI("InvalidGradeException: Invalid Marks: " + input + ". Marks must be between 0 and 100. Enter Marks Obtained (0-100): ", "output-error");
                return;
            }
            cliTempData.marks = marks;
            
            // Add grade logic
            const student = students.find(s => s.rollNumber.equalsIgnoreCase(cliTempData.rollNumber));
            const gradeDetails = computeGradeDetails(cliTempData.marks);
            const newGrade = {
                courseCode: cliTempData.courseCode,
                courseName: cliTempData.courseName,
                credits: cliTempData.credits,
                marks: cliTempData.marks,
                letterGrade: gradeDetails.letterGrade,
                gpaPoints: gradeDetails.gpaPoints
            };
            
            await syncStateWithBackend('ADD_GRADE', { rollNumber: cliTempData.rollNumber, grade: newGrade });
            
            printCLI(`Grade updated successfully for ${student.name} in ${cliTempData.courseCode}!`, "output-success");
            updateDashboardUI();
            
            cliTempData = {};
            printCLIMenu();
            break;

        // --- REMOVE GRADE ---
        case "REMOVE_GRADE_ROLL":
            const remStu = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (!remStu) {
                printCLI(`StudentNotFoundException: Student with Roll Number '${input}' was not found.`, "output-error");
                printCLIMenu();
                return;
            }
            cliTempData.rollNumber = input;
            printCLI("Enter Course Code to remove: ");
            cliState = "REMOVE_GRADE_CODE";
            break;
            
        case "REMOVE_GRADE_CODE":
            const tgtStudent = students.find(s => s.rollNumber.equalsIgnoreCase(cliTempData.rollNumber));
            const gIdx = tgtStudent.grades.findIndex(g => g.courseCode.equalsIgnoreCase(input));
            if (gIdx === -1) {
                printCLI(`StudentNotFoundException: Course '${input.toUpperCase()}' was not found for Student '${cliTempData.rollNumber.toUpperCase()}'.`, "output-error");
            } else {
                await syncStateWithBackend('DELETE_GRADE', { rollNumber: cliTempData.rollNumber, courseCode: input });
                printCLI(`Course grade ${input.toUpperCase()} removed successfully!`, "output-success");
                updateDashboardUI();
            }
            cliTempData = {};
            printCLIMenu();
            break;

        // --- UPDATE STUDENT ---
        case "UPDATE_STUDENT_ROLL":
            const upStu = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (!upStu) {
                printCLI(`StudentNotFoundException: Student with Roll Number '${input}' was not found.`, "output-error");
                printCLIMenu();
                return;
            }
            cliTempData.rollNumber = input;
            cliTempData.oldName = upStu.name;
            cliTempData.oldEmail = upStu.email;
            cliTempData.oldSemester = upStu.semester;
            
            printCLI(`Current details: Name=${upStu.name}, Email=${upStu.email}, Sem=${upStu.semester}`);
            printCLI("Enter New Name (leave blank to keep current): ");
            cliState = "UPDATE_STUDENT_NAME";
            break;
            
        case "UPDATE_STUDENT_NAME":
            cliTempData.name = input.trim() ? input.trim() : cliTempData.oldName;
            printCLI("Enter New Email (leave blank to keep current): ");
            cliState = "UPDATE_STUDENT_EMAIL";
            break;
            
        case "UPDATE_STUDENT_EMAIL":
            cliTempData.email = input.trim() ? input.trim() : cliTempData.oldEmail;
            printCLI("Enter New Semester (1-8, or 0 to keep current): ");
            cliState = "UPDATE_STUDENT_SEM";
            break;
            
        case "UPDATE_STUDENT_SEM":
            let semNum = parseInt(input);
            if (isNaN(semNum) || semNum === 0) semNum = cliTempData.oldSemester;
            
            if (semNum < 1 || semNum > 8) {
                printCLI("Invalid semester. Update aborted.", "output-error");
            } else {
                await updateStudentState(cliTempData.rollNumber, cliTempData.name, cliTempData.email, semNum);
                printCLI("Student details updated successfully!", "output-success");
            }
            cliTempData = {};
            printCLIMenu();
            break;

        // --- DELETE STUDENT ---
        case "DELETE_ROLL":
            const delStu = students.find(s => s.rollNumber.equalsIgnoreCase(input));
            if (!delStu) {
                printCLI(`StudentNotFoundException: Student with Roll Number '${input}' was not found.`, "output-error");
                printCLIMenu();
                return;
            }
            cliTempData.rollNumber = input;
            printCLI(`Are you sure you want to delete student ${delStu.name}? (Y/N): `);
            cliState = "DELETE_CONFIRM";
            break;
            
        case "DELETE_CONFIRM":
            if (input.equalsIgnoreCase("Y")) {
                await syncStateWithBackend('DELETE_STUDENT', { rollNumber: cliTempData.rollNumber });
                printCLI("Student record deleted successfully.", "output-success");
                updateDashboardUI();
            } else {
                printCLI("Deletion cancelled.");
            }
            cliTempData = {};
            printCLIMenu();
            break;
    }
}

// Helper: print formatted class statistics in CLI
function viewCLIClassStats() {
    printCLI("--- Class Statistics ---");
    printCLI("Total Students Enrolled: " + students.length);
    
    let sumSgpa = 0.0;
    let gradedCount = 0;
    let topper = null;
    let topperSgpa = -1.0;
    
    students.forEach(s => {
        const sgpa = calculateStudentSGPA(s);
        if (s.grades.length > 0) {
            sumSgpa += sgpa;
            gradedCount++;
            if (sgpa > topperSgpa) {
                topperSgpa = sgpa;
                topper = s;
            }
        }
    });
    
    const avg = gradedCount === 0 ? 0.00 : sumSgpa / gradedCount;
    printCLI(`Class Average SGPA: ${avg.toFixed(2)} / 10.00`);
    
    if (topper) {
        printCLI(`Class Topper: ${topper.name} (${topper.rollNumber}) with SGPA: ${topperSgpa.toFixed(2)}`);
    }
}

// Helper: print student list as a ASCII table in CLI
function printCLIStudentTable(list) {
    printCLI("==========================================================================================");
    printCLI("Roll Number  |Name                   |Email                     |Sem   |GPA   |No. Courses");
    printCLI("==========================================================================================");
    list.forEach(s => {
        let roll = s.rollNumber.padEnd(12);
        let name = (s.name.length > 21 ? s.name.substring(0, 18) + "..." : s.name).padEnd(22);
        let email = (s.email.length > 24 ? s.email.substring(0, 21) + "..." : s.email).padEnd(25);
        let sem = s.semester.toString().padEnd(5);
        let gpa = calculateStudentSGPA(s).toFixed(2).padEnd(5);
        let numCourses = s.grades.length.toString().padEnd(10);
        
        printCLI(`${roll} |${name} |${email} |${sem} |${gpa} |${numCourses}`);
    });
    printCLI("==========================================================================================");
}

// Helper: print single student details in CLI
function printCLISingleStudentDetails(student) {
    printCLI("ID: " + student.id);
    printCLI("Name: " + student.name);
    printCLI("Roll Number: " + student.rollNumber);
    printCLI("Email: " + student.email);
    printCLI("Semester: " + student.semester);
    printCLI("SGPA: " + calculateStudentSGPA(student).toFixed(2));
    printCLI("--------------------------------------------------");
    
    if (student.grades.length === 0) {
        printCLI("No course grades recorded for this student.");
    } else {
        printCLI("Course Grades:");
        printCLI("Course Code  |Course Name               |Credits  |Marks  |Grade");
        printCLI("--------------------------------------------------");
        student.grades.forEach(g => {
            let code = g.courseCode.padEnd(12);
            let name = (g.courseName.length > 24 ? g.courseName.substring(0, 21) + "..." : g.courseName).padEnd(25);
            let cred = g.credits.toString().padEnd(8);
            let marks = g.marks.toFixed(1).padEnd(6);
            let grade = g.letterGrade.padEnd(6);
            printCLI(`${code} |${name} |${cred} |${marks} |${grade}`);
        });
    }
}

// --- 5. CODE EXPLORER SOURCE FILES DATABASE ---

const javaSourceFiles = {
    "Person.java": {
        concept: "Abstraction & Base Structure",
        explanation: "Person.java uses the <code>abstract</code> keyword to define a generic template representing a human profile. In university settings, this demonstrates <strong>Abstraction</strong> (hiding implementation details) and serves as a parent base for <strong>Inheritance</strong>, allowing reusable variables (id, name, email) and constructors.",
        code: `package model;

import java.io.Serializable;

/**
 * Abstract class representing a general Person.
 * Showcases the OOP concept of Abstraction and Inheritance.
 */
public abstract class Person implements Serializable {
    private static final long serialVersionUID = 1L;
    
    protected String id;
    protected String name;
    protected String email;

    public Person(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // Getters and Setters (Encapsulation)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // Abstract method (Abstraction)
    public abstract String getProfileSummary();

    @Override
    public String toString() {
        return "ID: " + id + " | Name: " + name + " | Email: " + email;
    }
}`
    },
    
    "Student.java": {
        concept: "Inheritance & Polymorphism",
        explanation: "Student.java <code>extends</code> Person. This showcases <strong>Inheritance</strong> (re-using ID, Name, and Email attributes from the parent class) and <strong>Polymorphism</strong> by implementing the abstract method <code>getProfileSummary()</code>. It also encapsulates an <code>ArrayList&lt;CourseGrade&gt;</code> to manage dynamic academic grade lists.",
        code: `package model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a Student, extending the Person class.
 * Demonstrates Inheritance, Polymorphism, and Encapsulation.
 */
public class Student extends Person {
    private static final long serialVersionUID = 1L;

    private String rollNumber;
    private int semester;
    private List<CourseGrade> grades;

    public Student(String id, String name, String email, String rollNumber, int semester) {
        super(id, name, email); // Invokes the constructor of the parent Person class
        
        // Input validation checks
        if (name == null || !name.matches("^[A-Za-z\\s]+$")) {
            throw new IllegalArgumentException("Student Name must contain only alphabets.");
        }
        if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            throw new IllegalArgumentException("Invalid Student Email address format.");
        }
        
        this.rollNumber = rollNumber;
        this.semester = semester;
        this.grades = new ArrayList<>(); // Collection Data Structure
    }

    public void addGrade(CourseGrade grade) {
        for (int i = 0; i < grades.size(); i++) {
            if (grades.get(i).getCourseCode().equalsIgnoreCase(grade.getCourseCode())) {
                grades.set(i, grade); // Update if course exists
                return;
            }
        }
        grades.add(grade);
    }

    public List<CourseGrade> getGrades() {
        return new ArrayList<>(grades); // Return copy for Encapsulation
    }

    public boolean removeGrade(String courseCode) {
        return grades.removeIf(grade -> grade.getCourseCode().equalsIgnoreCase(courseCode));
    }

    /**
     * Calculates the Semester Grade Point Average (SGPA)
     * Weighted: Sum(GPA points * Credits) / Sum(Credits)
     */
    public double calculateSGPA() {
        if (grades.isEmpty()) return 0.0;

        double totalGradePoints = 0.0;
        int totalCredits = 0;

        for (CourseGrade grade : grades) {
            totalGradePoints += (grade.getGpaPoints() * grade.getCredits());
            totalCredits += grade.getCredits();
        }

        return totalCredits == 0 ? 0.0 : totalGradePoints / totalCredits;
    }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    // Polymorphic implementation
    @Override
    public String getProfileSummary() {
        return String.format("Student Profile [Roll No: %s] | Name: %s | Sem: %d | SGPA: %.2f",
                rollNumber, name, semester, calculateSGPA());
    }
}`
    },

    "CourseGrade.java": {
        concept: "Encapsulation & Calculation Domain",
        explanation: "CourseGrade.java represents a course model. It encapsulates score validations and hosts private fields. It implements local rules to automatically convert numeric grades into letter grades (e.g. A+, A, F) and 10-point GPA values when <code>marks</code> are modified, protecting state integrity.",
        code: `package model;

import java.io.Serializable;

/**
 * Represents a specific course and the grade obtained.
 * Encapsulates mark-to-grade and GPA calculations.
 */
public class CourseGrade implements Serializable {
    private static final long serialVersionUID = 1L;

    private String courseCode;
    private String courseName;
    private int credits;
    private double marks;
    private String letterGrade;
    private double gpaPoints;

    public CourseGrade(String courseCode, String courseName, int credits, double marks) {
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.credits = credits;
        this.marks = marks;
        calculateGrade();
    }

    private void calculateGrade() {
        if (marks >= 90) {
            letterGrade = "A+";
            gpaPoints = 10.0;
        } else if (marks >= 80) {
            letterGrade = "A";
            gpaPoints = 9.0;
        } else if (marks >= 70) {
            letterGrade = "B";
            gpaPoints = 8.0;
        } else if (marks >= 60) {
            letterGrade = "C";
            gpaPoints = 7.0;
        } else if (marks >= 50) {
            letterGrade = "D";
            gpaPoints = 6.0;
        } else if (marks >= 40) {
            letterGrade = "E";
            gpaPoints = 5.0;
        } else {
            letterGrade = "F";
            gpaPoints = 0.0;
        }
    }

    // Getters and Setters (Encapsulation)
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }

    public double getMarks() { return marks; }
    public void setMarks(double marks) {
        this.marks = marks;
        calculateGrade(); // Recalculated reactively
    }

    public String getLetterGrade() { return letterGrade; }
    public double getGpaPoints() { return gpaPoints; }
}`
    },

    "InvalidGradeException.java": {
        concept: "Custom Exception Framework",
        explanation: "By extending Java's base <code>Exception</code> class, we create custom domain exceptions. If a user tries to enter a score of 120 or credits of -5, the system raises this exception. This is critical for showing recruiters you understand how to write enterprise-safe error-handling.",
        code: `package exception;

/**
 * Custom exception thrown when invalid course credits or marks are supplied.
 */
public class InvalidGradeException extends Exception {
    private static final long serialVersionUID = 1L;

    public InvalidGradeException(String message) {
        super(message);
    }
}`
    },

    "FileRepository.java": {
        concept: "File Input / Output Stream Persistence",
        explanation: "Demonstrates data persistence by streaming student records directly to disk. It reads and writes custom text database formats using <code>BufferedReader</code>, <code>BufferedWriter</code>, and <code>FileReader</code> / <code>FileWriter</code>, parsing CSV blocks safely.",
        code: `package repository;

import model.Student;
import model.CourseGrade;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Saves and loads student records to/from a CSV-formatted text file.
 */
public class FileRepository {

    public void save(List<Student> students, String filePath) throws IOException {
        File file = new File(filePath);
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
            for (Student student : students) {
                // STUDENT,id,name,email,rollNumber,semester
                writer.write(String.format("STUDENT,%s,%s,%s,%s,%d",
                        student.getId(), student.getName(), student.getEmail(),
                        student.getRollNumber(), student.getSemester()));
                writer.newLine();

                for (CourseGrade grade : student.getGrades()) {
                    // GRADE,courseCode,courseName,credits,marks
                    writer.write(String.format("GRADE,%s,%s,%d,%.1f",
                            grade.getCourseCode(), grade.getCourseName(),
                            grade.getCredits(), grade.getMarks()));
                    writer.newLine();
                }
            }
        }
    }

    public List<Student> load(String filePath) throws IOException {
        List<Student> students = new ArrayList<>();
        File file = new File(filePath);
        if (!file.exists()) return students;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            Student currentStudent = null;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                String type = parts[0];

                if (type.equals("STUDENT")) {
                    currentStudent = new Student(parts[1], parts[2], parts[3], parts[4], Integer.parseInt(parts[5]));
                    students.add(currentStudent);
                } else if (type.equals("GRADE") && currentStudent != null) {
                    currentStudent.addGrade(new CourseGrade(parts[1], parts[2],
                            Integer.parseInt(parts[3]), Double.parseDouble(parts[4])));
                }
            }
        }
        return students;
    }
}`
    },

    "GradeService.java": {
        concept: "Collection Sorters & Search Algorithms",
        explanation: "GradeService.java serves as the controller. It demonstrates the use of Java collections API. It provides searching (partial string matching) and sorting algorithms using <code>Comparator.comparing()</code>, lambda expressions, and custom comparators to sort students by GPA or names.",
        code: `package service;

import exception.InvalidGradeException;
import exception.StudentNotFoundException;
import model.CourseGrade;
import model.Student;
import repository.FileRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service layer coordinating collections and storage persistence.
 */
public class GradeService {
    private List<Student> students;
    private final FileRepository repository;
    private final String dbPath;

    public GradeService(String dbPath) {
        this.repository = new FileRepository();
        this.dbPath = dbPath;
        loadFromStorage();
    }

    private void loadFromStorage() {
        try {
            this.students = repository.load(dbPath);
        } catch (IOException e) {
            this.students = new ArrayList<>();
        }
    }

    public void saveToStorage() {
        try { repository.save(students, dbPath); } catch (IOException e) {}
    }

    public void addStudent(Student student) {
        // Business logic validation
        students.add(student);
        saveToStorage();
    }

    public Student getStudent(String rollNumber) throws StudentNotFoundException {
        for (Student s : students) {
            if (s.getRollNumber().equalsIgnoreCase(rollNumber)) return s;
        }
        throw new StudentNotFoundException("Student with Roll Number '" + rollNumber + "' was not found.");
    }

    // SEARCH by name (Case-insensitive partial match)
    public List<Student> searchStudentsByName(String query) {
        List<Student> results = new ArrayList<>();
        for (Student s : students) {
            if (s.getName().toLowerCase().contains(query.toLowerCase())) results.add(s);
        }
        return results;
    }

    // SORTING - Demonstrates Comparators and Lambdas
    public List<Student> getStudentsSortedBySGPA() {
        List<Student> sortedList = new ArrayList<>(students);
        sortedList.sort((s1, s2) -> Double.compare(s2.calculateSGPA(), s1.calculateSGPA()));
        return sortedList;
    }
}`
    },

    "Main.java": {
        concept: "CLI Execution Loop & User Input Handling",
        explanation: "Main.java is the application entry point. It initiates a <code>while</code> loop with a <code>Scanner</code> scanner, parsing console text options, invoking service methods, printing reports as tables, and formatting numerical values properly while preventing crashes on type mismatches.",
        code: `import exception.InvalidGradeException;
import exception.StudentNotFoundException;
import model.CourseGrade;
import model.Student;
import service.GradeService;
import java.util.Scanner;

public class Main {
    private static final String DB_FILE_PATH = "data/students_db.txt";
    private static GradeService gradeService;
    private static Scanner scanner;

    public static void main(String[] args) {
        gradeService = new GradeService(DB_FILE_PATH);
        scanner = new Scanner(System.in);
        
        boolean exit = false;
        while (!exit) {
            printMenu();
            int choice = readIntInput("Enter choice (1-10): ");
            
            switch (choice) {
                case 1: addNewStudent(); break;
                case 2: viewAllStudents(); break;
                // Other options matching the console CLI
                case 10: exit = true; break;
            }
        }
    }

    private static int readIntInput(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                return Integer.parseInt(scanner.nextLine());
            } catch (NumberFormatException e) {
                System.out.println("Invalid Input! Enter a valid integer.");
            }
        }
    }
}`
    }
};

// Simple custom syntax highlighting engine (converts plain text to styled html)
function syntaxHighlightJava(codeText) {
    // Escape HTML special chars first
    let escaped = codeText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // Keywords regex
    const keywords = ["package", "import", "public", "private", "protected", "class", "abstract", "extends", "implements", "interface", "void", "int", "double", "float", "boolean", "char", "long", "return", "if", "else", "switch", "case", "default", "while", "for", "new", "try", "catch", "throw", "throws", "super", "this", "final", "static", "instanceof", "break", "continue"];
    
    // Replace keywords
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, "g");
        escaped = escaped.replace(regex, `<span class="j-keyword">${kw}</span>`);
    });
    
    // Annotations (e.g. @Override)
    escaped = escaped.replace(/(@[A-Za-z0-9_]+)/g, '<span class="j-annotation">$1</span>');
    
    // Strings in double quotes
    escaped = escaped.replace(/(&quot;[^&]*&quot;)/g, '<span class="j-string">$1</span>');
    escaped = escaped.replace(/("[^"]*")/g, '<span class="j-string">$1</span>');
    
    // Comments
    escaped = escaped.replace(/(\/\*([\s\S]*?)\*\/)/g, '<span class="j-comment">$1</span>');
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="j-comment">$1</span>');
    
    return escaped;
}

// Render selected Java file in viewer
function selectJavaFile(fileName) {
    const fileData = javaSourceFiles[fileName];
    if (!fileData) return;
    
    // Update active tree visual
    document.querySelectorAll(".file-item").forEach(item => {
        if (item.getAttribute("data-file") === fileName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
    
    document.getElementById("active-filename").innerText = fileName;
    document.getElementById("code-content").innerHTML = syntaxHighlightJava(fileData.code);
    document.getElementById("code-explanation").innerHTML = fileData.explanation;
}

// Copy to Clipboard feature
document.getElementById("btn-copy-code").addEventListener("click", () => {
    const activeFile = document.getElementById("active-filename").innerText;
    const rawCode = javaSourceFiles[activeFile].code;
    
    navigator.clipboard.writeText(rawCode).then(() => {
        const copyBtn = document.getElementById("btn-copy-code");
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
        }, 1500);
    }).catch(err => {
        console.error("Clipboard copy failed: ", err);
    });
});

// Setup sidebar tree listeners
document.querySelectorAll(".file-item").forEach(item => {
    item.addEventListener("click", () => {
        const filename = item.getAttribute("data-file");
        selectJavaFile(filename);
    });
});

// --- 6. TAB NAVIGATION LOGIC ---

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // Toggle Nav Buttons
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // Show/Hide Tab Contents
        const targetTab = btn.getAttribute("data-tab");
        document.querySelectorAll(".tab-content").forEach(tc => {
            if (tc.id === targetTab) {
                tc.classList.add("active");
            } else {
                tc.classList.remove("active");
            }
        });
        
        // Custom actions when switching to terminal
        if (targetTab === "terminal") {
            setTimeout(() => {
                terminalInput.focus();
            }, 100);
        }
    });
});

// --- 7. APP INITIALIZATION & AUTHENTICATION ENGINE ---

// Core boot helper
async function bootAcademicPortal() {
    // 0. Fetch initial database state from backend (or fallback)
    await syncStateWithBackend('LOAD');

    // 1. Render Dashboard
    updateDashboardUI();
    addSystemLog("Grade collections mapped successfully from persistent stream repository.", "success");
    
    // 2. Init CLI Simulator
    initCLI();
    
    // 3. Init Code Explorer with Person.java
    selectJavaFile("Person.java");
}

// Check session authentication on startup
window.addEventListener("DOMContentLoaded", async () => {
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error-msg");
    const logoutBtn = document.getElementById("btn-logout");

    // Dynamic GitHub URL injector
    const githubLink = document.getElementById("github-repo-link");
    githubLink.addEventListener("click", (e) => {
        console.log("GitHub repository clicked. Create a git repo of this folder to push it.");
    });

    // Handle password visibility toggle
    const togglePassword = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("login-password");
    togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });

    if (sessionStorage.getItem('authenticated') === 'true') {
        const authUser = sessionStorage.getItem('auth_user') || 'admin';
        document.getElementById("user-profile-tag").innerHTML = `<i class="fa-solid fa-user-shield"></i> ${authUser}`;
        loginOverlay.classList.add("hidden");
        await bootAcademicPortal();
    } else {
        // Show status log
        addSystemLog("Security gate active. Authenticate administrative session...", "info");
    }

    // Handle authentication form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userVal = document.getElementById("login-username").value.trim();
        const passVal = document.getElementById("login-password").value.trim();

        if (!userVal) {
            loginError.innerText = "Username or Email cannot be empty!";
            return;
        }
        if (passVal.length < 4) {
            loginError.innerText = "Password must be at least 4 characters!";
            return;
        }

        loginError.innerText = "";
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('auth_user', userVal);
        
        document.getElementById("user-profile-tag").innerHTML = `<i class="fa-solid fa-user-shield"></i> ${userVal}`;
        loginOverlay.classList.add("hidden");
        
        await bootAcademicPortal();
        addSystemLog(`User session '${userVal}' authenticated.`, "success");
    });

    // Handle authentication logout click
    logoutBtn.addEventListener("click", () => {
        const confirmLogout = confirm("Are you sure you want to sign out of the academic portal?");
        if (confirmLogout) {
            sessionStorage.removeItem('authenticated');
            window.location.reload(); // Perform clean reload to lock workspace
        }
    });
});
