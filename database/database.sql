-- Students Table
CREATE TABLE Students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    matricula TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    notes TEXT
);

-- Classes Table
CREATE TABLE Classes (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_name TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER,
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id)
);

-- Schedules Table
CREATE TABLE Schedules (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    day_of_week TEXT,
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);

-- Attendance Table
CREATE TABLE Attendance (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    schedule_id INTEGER,
    date DATE,
    sign_in_time TIME,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (schedule_id) REFERENCES Schedules(schedule_id)
);

-- Belt Levels Table
CREATE TABLE BeltLevels (
    belt_level_id INTEGER PRIMARY KEY AUTOINCREMENT,
    belt_name TEXT NOT NULL,
    belt_order INTEGER,
    minimum_classes INTEGER,
    description TEXT
);

-- Student Belts Table
CREATE TABLE StudentBelts (
    student_belt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    belt_level_id INTEGER,
    start_date DATE,
    exam_date DATE,
    status TEXT CHECK( status IN ('Pending', 'Approved', 'Failed')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (belt_level_id) REFERENCES BeltLevels(belt_level_id)
);

-- Instructors Table
CREATE TABLE Instructors (
    instructor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Exam Schedule Table
CREATE TABLE ExamSchedule(
    exam_schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    belt_level_id INTEGER,
    date DATE,
    time TIME,
    instructor_id INTEGER,
    FOREIGN KEY (belt_level_id) REFERENCES BeltLevels(belt_level_id),
    FOREIGN KEY (instructor_id) REFERENCES Instructors(instructor_id)
);

-- Exam Registration Table
CREATE TABLE ExamRegistration (
    exam_registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    exam_schedule_id INTEGER,
    registration_date DATE,
    payment_status TEXT CHECK (payment_status IN ('Pending', 'Payed')),
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (exam_schedule_id) REFERENCES ExamSchedule(exam_schedule_id)
);