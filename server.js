const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, 'java-cli-app', 'data', 'students_db.txt');

// Helper to compute grade attributes matching Java CourseGrade.java
function computeGradeDetails(marks) {
    let letterGrade = "F";
    let gpaPoints = 2.0;
    if (marks >= 90) { letterGrade = "O"; gpaPoints = 10.0; }
    else if (marks >= 80) { letterGrade = "E"; gpaPoints = 9.0; }
    else if (marks >= 70) { letterGrade = "A"; gpaPoints = 8.0; }
    else if (marks >= 60) { letterGrade = "B"; gpaPoints = 7.0; }
    else if (marks >= 50) { letterGrade = "C"; gpaPoints = 6.0; }
    else if (marks >= 40) { letterGrade = "D"; gpaPoints = 5.0; }
    return { letterGrade, gpaPoints };
}

// Loads and parses the custom CSV-like text database (Syncs with Java FileRepository.java)
function loadStudents() {
    if (!fs.existsSync(DB_PATH)) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Write default initial mock records matching Java Main.java seed
        const defaultCsv = 
`STUDENT,STU1,Aditya Sharma,aditya.sharma@btech.edu,BT22CSE001,4
GRADE,CS201,Data Structures,4,88.0
GRADE,CS202,Object Oriented Programming,3,94.0
GRADE,CS203,Discrete Mathematics,4,76.5
STUDENT,STU2,Priyanka Verma,priyanka.v@btech.edu,BT22CSE012,4
GRADE,CS201,Data Structures,4,95.0
GRADE,CS202,Object Oriented Programming,3,91.0
GRADE,CS203,Discrete Mathematics,4,82.0
STUDENT,STU3,Rohan Das,rohan.das@btech.edu,BT22ECE034,4
GRADE,EC201,Digital Electronics,4,62.0
GRADE,EC202,Signals and Systems,4,55.5
GRADE,CS202,Object Oriented Programming,3,80.0
`;
        fs.writeFileSync(DB_PATH, defaultCsv, 'utf8');
    }

    const data = fs.readFileSync(DB_PATH, 'utf8');
    const lines = data.split('\n');
    const students = [];
    let currentStudent = null;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const parts = line.split(',');
        const type = parts[0];

        if (type === 'STUDENT') {
            currentStudent = {
                id: parts[1],
                name: parts[2],
                email: parts[3],
                rollNumber: parts[4],
                semester: parseInt(parts[5]),
                grades: []
            };
            students.push(currentStudent);
        } else if (type === 'GRADE' && currentStudent) {
            const marksVal = parseFloat(parts[4]);
            const gradeAttrs = computeGradeDetails(marksVal);
            currentStudent.grades.push({
                courseCode: parts[1],
                courseName: parts[2],
                credits: parseInt(parts[3]),
                marks: marksVal,
                letterGrade: gradeAttrs.letterGrade,
                gpaPoints: gradeAttrs.gpaPoints
            });
        }
    }
    return students;
}

// Serializes the state back to text file database
function saveStudents(students) {
    let csv = '';
    for (const student of students) {
        csv += `STUDENT,${student.id},${student.name},${student.email},${student.rollNumber},${student.semester}\n`;
        for (const grade of student.grades) {
            csv += `GRADE,${grade.courseCode},${grade.courseName},${grade.credits},${grade.marks.toFixed(1)}\n`;
        }
    }
    fs.writeFileSync(DB_PATH, csv, 'utf8');
}

const server = http.createServer((req, res) => {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTES ---

    // 1. GET & POST Students
    if (pathname === '/api/students') {
        if (req.method === 'GET') {
            try {
                const studentsList = loadStudents();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(studentsList));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        } 
        
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const newStudent = JSON.parse(body);
                    const studentsList = loadStudents();
                    
                    const exists = studentsList.some(s => s.rollNumber.toLowerCase() === newStudent.rollNumber.toLowerCase());
                    if (exists) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Roll number already exists.' }));
                        return;
                    }
                    
                    studentsList.push(newStudent);
                    saveStudents(studentsList);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(newStudent));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }
    }

    // 2. POST (Update Details) & DELETE Student (by Roll)
    const studentMatch = pathname.match(/^\/api\/students\/([A-Za-z0-9_]+)$/);
    if (studentMatch) {
        const rollNumber = studentMatch[1];
        
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const updateData = JSON.parse(body);
                    const studentsList = loadStudents();
                    const student = studentsList.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
                    if (!student) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Student not found.' }));
                        return;
                    }
                    student.name = updateData.name;
                    student.email = updateData.email;
                    student.semester = parseInt(updateData.semester);
                    
                    saveStudents(studentsList);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(student));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        if (req.method === 'DELETE') {
            try {
                const studentsList = loadStudents();
                const idx = studentsList.findIndex(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Student not found.' }));
                    return;
                }
                const deleted = studentsList.splice(idx, 1)[0];
                saveStudents(studentsList);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(deleted));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }
    }

    // 3. POST Grade (Add/Update Grade)
    const gradeMatch = pathname.match(/^\/api\/students\/([A-Za-z0-9_]+)\/grades$/);
    if (gradeMatch && req.method === 'POST') {
        const rollNumber = gradeMatch[1];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newGrade = JSON.parse(body);
                const studentsList = loadStudents();
                const student = studentsList.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
                if (!student) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Student not found.' }));
                    return;
                }
                
                const existingIdx = student.grades.findIndex(g => g.courseCode.toLowerCase() === newGrade.courseCode.toLowerCase());
                if (existingIdx !== -1) {
                    student.grades[existingIdx] = newGrade;
                } else {
                    student.grades.push(newGrade);
                }
                
                saveStudents(studentsList);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(student));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 4. DELETE Grade
    const deleteGradeMatch = pathname.match(/^\/api\/students\/([A-Za-z0-9_]+)\/grades\/([A-Za-z0-9_]+)$/);
    if (deleteGradeMatch && req.method === 'DELETE') {
        const rollNumber = deleteGradeMatch[1];
        const courseCode = deleteGradeMatch[2];
        try {
            const studentsList = loadStudents();
            const student = studentsList.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase());
            if (!student) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Student not found.' }));
                return;
            }
            const gIdx = student.grades.findIndex(g => g.courseCode.toLowerCase() === courseCode.toLowerCase());
            if (gIdx === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Course grade not found.' }));
                return;
            }
            student.grades.splice(gIdx, 1);
            saveStudents(studentsList);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(student));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // --- STATIC FILES SERVING ---
    let filePath = pathname === '/' ? './index.html' : '.' + pathname;
    filePath = path.resolve(__dirname, filePath);
    
    // Directory traversal security guard
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Node HTTP Server listening on port ${PORT}`);
});
