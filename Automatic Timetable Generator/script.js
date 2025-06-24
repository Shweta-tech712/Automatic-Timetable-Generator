// Data structures
        let subjects = [];
        let teachers = [];
        let classes = [];
        let timetables = {};

        // Add subject
        function addSubject() {
            const name = document.getElementById('subjectName').value.trim();
            const periods = parseInt(document.getElementById('periodsPerWeek').value);
            
            if (name && periods > 0) {
                subjects.push({ name, periodsPerWeek: periods });
                updateSubjectsList();
                updateTeacherSubjects();
                document.getElementById('subjectName').value = '';
                document.getElementById('periodsPerWeek').value = '';
            }
        }

        // Add teacher
        function addTeacher() {
            const name = document.getElementById('teacherName').value.trim();
            const subjectName = document.getElementById('teacherSubjects').value;
            
            if (name && subjectName) {
                teachers.push({ name, subject: subjectName });
                updateTeachersList();
                document.getElementById('teacherName').value = '';
            }
        }

        // Add class
        function addClass() {
            const name = document.getElementById('className').value.trim();
            
            if (name) {
                classes.push({ name });
                updateClassesList();
                document.getElementById('className').value = '';
            }
        }

        // Update lists
        function updateSubjectsList() {
            const container = document.getElementById('subjectsList');
            container.innerHTML = subjects.map((subject, index) => 
                `<div class="list-item">
                    <span>${subject.name} (${subject.periodsPerWeek} periods/week)</span>
                    <button class="btn-remove" onclick="removeSubject(${index})">×</button>
                </div>`
            ).join('');
        }

        function updateTeachersList() {
            const container = document.getElementById('teachersList');
            container.innerHTML = teachers.map((teacher, index) => 
                `<div class="list-item">
                    <span>${teacher.name} - ${teacher.subject}</span>
                    <button class="btn-remove" onclick="removeTeacher(${index})">×</button>
                </div>`
            ).join('');
        }

        function updateClassesList() {
            const container = document.getElementById('classesList');
            container.innerHTML = classes.map((cls, index) => 
                `<div class="list-item">
                    <span>${cls.name}</span>
                    <button class="btn-remove" onclick="removeClass(${index})">×</button>
                </div>`
            ).join('');
        }

        function updateTeacherSubjects() {
            const select = document.getElementById('teacherSubjects');
            select.innerHTML = '<option value="">Select Subject</option>' + 
                subjects.map(subject => `<option value="${subject.name}">${subject.name}</option>`).join('');
        }

        // Remove functions
        function removeSubject(index) {
            subjects.splice(index, 1);
            updateSubjectsList();
            updateTeacherSubjects();
        }

        function removeTeacher(index) {
            teachers.splice(index, 1);
            updateTeachersList();
        }

        function removeClass(index) {
            classes.splice(index, 1);
            updateClassesList();
        }

        // Main timetable generation
        function generateTimetable() {
            const resultDiv = document.getElementById('result');
            
            // Validation
            if (subjects.length === 0 || teachers.length === 0 || classes.length === 0) {
                resultDiv.innerHTML = '<div class="error">Please add at least one subject, teacher, and class.</div>';
                return;
            }

            // Check if all subjects have teachers
            const subjectNames = subjects.map(s => s.name);
            const teacherSubjects = teachers.map(t => t.subject);
            const missingTeachers = subjectNames.filter(s => !teacherSubjects.includes(s));
            
            if (missingTeachers.length > 0) {
                resultDiv.innerHTML = `<div class="error">Missing teachers for subjects: ${missingTeachers.join(', ')}</div>`;
                return;
            }

            const periodsPerDay = parseInt(document.getElementById('periodsPerDay').value);
            const workingDays = parseInt(document.getElementById('workingDays').value);
            const startTime = document.getElementById('startTime').value;
            const periodDuration = parseInt(document.getElementById('periodDuration').value);

            // Generate timetables for each class
            timetables = {};
            let allSuccessful = true;

            for (const cls of classes) {
                const timetable = generateClassTimetable(cls.name, periodsPerDay, workingDays);
                if (timetable) {
                    timetables[cls.name] = timetable;
                } else {
                    allSuccessful = false;
                    break;
                }
            }

            if (allSuccessful) {
                displayTimetables(periodsPerDay, workingDays, startTime, periodDuration);
                resultDiv.innerHTML = '<div class="success">Timetables generated successfully! 🎉</div>' + resultDiv.innerHTML;
            } else {
                resultDiv.innerHTML = '<div class="error">Failed to generate conflict-free timetable. Try adjusting periods per day or subject requirements.</div>';
            }
        }

        function generateClassTimetable(className, periodsPerDay, workingDays) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, workingDays);
            const timetable = {};
            const teacherSchedule = {}; // Track teacher availability
            
            // Initialize timetable and teacher schedule
            days.forEach(day => {
                timetable[day] = new Array(periodsPerDay).fill(null);
            });
            
            teachers.forEach(teacher => {
                teacherSchedule[teacher.name] = {};
                days.forEach(day => {
                    teacherSchedule[teacher.name][day] = new Array(periodsPerDay).fill(false);
                });
            });

            // Create subject pool with required frequency
            const subjectPool = [];
            subjects.forEach(subject => {
                for (let i = 0; i < subject.periodsPerWeek; i++) {
                    subjectPool.push(subject.name);
                }
            });

            // Shuffle for randomness
            for (let i = subjectPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [subjectPool[i], subjectPool[j]] = [subjectPool[j], subjectPool[i]];
            }

            // Assign subjects to timetable
            let attempts = 0;
            const maxAttempts = 1000;
            
            for (const subject of subjectPool) {
                let assigned = false;
                let dayAttempts = 0;
                
                while (!assigned && attempts < maxAttempts && dayAttempts < 50) {
                    const day = days[Math.floor(Math.random() * days.length)];
                    const period = Math.floor(Math.random() * periodsPerDay);
                    
                    // Find teacher for this subject
                    const availableTeachers = teachers.filter(t => 
                        t.subject === subject && !teacherSchedule[t.name][day][period]
                    );
                    
                    if (timetable[day][period] === null && availableTeachers.length > 0) {
                        const teacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
                        timetable[day][period] = {
                            subject: subject,
                            teacher: teacher.name
                        };
                        teacherSchedule[teacher.name][day][period] = true;
                        assigned = true;
                    }
                    
                    dayAttempts++;
                    attempts++;
                }
                
                if (!assigned) {
                    return null; // Failed to assign
                }
            }

            return timetable;
        }

        function displayTimetables(periodsPerDay, workingDays, startTime, periodDuration) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, workingDays);
            const resultDiv = document.getElementById('result');
            
            // Generate time slots
            const timeSlots = generateTimeSlots(startTime, periodsPerDay, periodDuration);
            
            let html = '<div class="timetable-container">';
            
            for (const className of Object.keys(timetables)) {
                html += `<h2 style="color: #333; margin: 30px 0 20px 0; text-align: center;">📋 ${className} Timetable</h2>`;
                html += '<table class="timetable">';
                
                // Header
                html += '<tr><th>Time</th>';
                days.forEach(day => html += `<th>${day}</th>`);
                html += '</tr>';
                
                // Periods
                for (let period = 0; period < periodsPerDay; period++) {
                    html += `<tr><td><strong>${timeSlots[period]}</strong></td>`;
                    
                    days.forEach(day => {
                        const slot = timetables[className][day][period];
                        if (slot) {
                            html += `<td class="subject-cell">${slot.subject}<br><small>${slot.teacher}</small></td>`;
                        } else {
                            html += '<td>Free</td>';
                        }
                    });
                    
                    html += '</tr>';
                }
                
                html += '</table>';
            }
            
            html += '</div>';
            resultDiv.innerHTML += html;
        }

        function generateTimeSlots(startTime, periodsPerDay, periodDuration) {
            const slots = [];
            const [startHour, startMinute] = startTime.split(':').map(Number);
            
            for (let i = 0; i < periodsPerDay; i++) {
                const startMinutes = startHour * 60 + startMinute + (i * periodDuration);
                const endMinutes = startMinutes + periodDuration;
                
                const formatTime = (minutes) => {
                    const h = Math.floor(minutes / 60);
                    const m = minutes % 60;
                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                };
                
                slots.push(`${formatTime(startMinutes)} - ${formatTime(endMinutes)}`);
            }
            
            return slots;
        }

        // Initialize with some sample data
        window.onload = function() {
            // Add some sample subjects
            subjects = [
                { name: 'Mathematics', periodsPerWeek: 6 },
                { name: 'English', periodsPerWeek: 5 },
                { name: 'Science', periodsPerWeek: 4 },
                { name: 'History', periodsPerWeek: 3 },
                { name: 'Physical Education', periodsPerWeek: 2 }
            ];
            
            teachers = [
                { name: 'Dr. Smith', subject: 'Mathematics' },
                { name: 'Ms. Johnson', subject: 'English' },
                { name: 'Mr. Brown', subject: 'Science' },
                { name: 'Mrs. Davis', subject: 'History' },
                { name: 'Coach Wilson', subject: 'Physical Education' }
            ];
            
            classes = [
                { name: 'Grade 10A' },
                { name: 'Grade 10B' }
            ];
            
            updateSubjectsList();
            updateTeachersList();
            updateClassesList();
            updateTeacherSubjects();
        };
    
