package service;

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
 * Service layer providing the business logic for the Student Result System.
 * Operates on ArrayLists in memory and coordinates with FileRepository for persistence.
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
            System.err.println("Warning: Could not load data. Starting with an empty database. Error: " + e.getMessage());
            this.students = new ArrayList<>();
        }
    }

    public void saveToStorage() {
        try {
            repository.save(students, dbPath);
        } catch (IOException e) {
            System.err.println("Error: Failed to save data to storage. " + e.getMessage());
        }
    }

    // CREATE Student
    public void addStudent(Student student) throws IllegalArgumentException {
        for (Student s : students) {
            if (s.getRollNumber().equalsIgnoreCase(student.getRollNumber())) {
                throw new IllegalArgumentException("Student with Roll Number " + student.getRollNumber() + " already exists!");
            }
            if (s.getId().equalsIgnoreCase(student.getId())) {
                throw new IllegalArgumentException("Student with ID " + student.getId() + " already exists!");
            }
        }
        students.add(student);
        saveToStorage();
    }

    // READ Student
    public Student getStudent(String rollNumber) throws StudentNotFoundException {
        for (Student s : students) {
            if (s.getRollNumber().equalsIgnoreCase(rollNumber)) {
                return s;
            }
        }
        throw new StudentNotFoundException("Student with Roll Number '" + rollNumber + "' was not found.");
    }

    public List<Student> getAllStudents() {
        return new ArrayList<>(students); // Encapsulated copy
    }

    // UPDATE Student
    public void updateStudent(String rollNumber, String name, String email, int semester) throws StudentNotFoundException {
        Student s = getStudent(rollNumber);
        s.setName(name);
        s.setEmail(email);
        s.setSemester(semester);
        saveToStorage();
    }

    // DELETE Student
    public void deleteStudent(String rollNumber) throws StudentNotFoundException {
        Student s = getStudent(rollNumber);
        students.remove(s);
        saveToStorage();
    }

    // ADD / UPDATE Grade
    public void addGradeToStudent(String rollNumber, CourseGrade grade) throws StudentNotFoundException, InvalidGradeException {
        if (grade.getMarks() < 0 || grade.getMarks() > 100) {
            throw new InvalidGradeException("Invalid Marks: " + grade.getMarks() + ". Marks must be between 0 and 100.");
        }
        if (grade.getCredits() <= 0 || grade.getCredits() > 6) {
            throw new InvalidGradeException("Invalid Credits: " + grade.getCredits() + ". Course credits must be between 1 and 6.");
        }

        Student student = getStudent(rollNumber);
        student.addGrade(grade);
        saveToStorage();
    }

    // REMOVE Grade
    public void removeGradeFromStudent(String rollNumber, String courseCode) throws StudentNotFoundException {
        Student student = getStudent(rollNumber);
        boolean removed = student.removeGrade(courseCode);
        if (!removed) {
            throw new StudentNotFoundException("Course '" + courseCode + "' was not found for Student '" + rollNumber + "'.");
        }
        saveToStorage();
    }

    // SEARCH by name (Case-insensitive partial match)
    public List<Student> searchStudentsByName(String query) {
        List<Student> results = new ArrayList<>();
        for (Student s : students) {
            if (s.getName().toLowerCase().contains(query.toLowerCase())) {
                results.add(s);
            }
        }
        return results;
    }

    // SORTING - Demonstrates polymorphism, Comparator, and Lambda expressions
    public List<Student> getStudentsSortedByRollNumber() {
        List<Student> sortedList = new ArrayList<>(students);
        sortedList.sort(Comparator.comparing(Student::getRollNumber));
        return sortedList;
    }

    public List<Student> getStudentsSortedByName() {
        List<Student> sortedList = new ArrayList<>(students);
        sortedList.sort(Comparator.comparing(Student::getName, String.CASE_INSENSITIVE_ORDER));
        return sortedList;
    }

    public List<Student> getStudentsSortedBySGPA() {
        List<Student> sortedList = new ArrayList<>(students);
        // Descending order of SGPA
        sortedList.sort((s1, s2) -> Double.compare(s2.calculateSGPA(), s1.calculateSGPA()));
        return sortedList;
    }

    // STATS
    public double calculateClassAverageSGPA() {
        if (students.isEmpty()) return 0.0;
        double sum = 0.0;
        int count = 0;
        for (Student s : students) {
            double sgpa = s.calculateSGPA();
            if (s.getGrades().size() > 0) { // Only average students who have grades
                sum += sgpa;
                count++;
            }
        }
        return count == 0 ? 0.0 : sum / count;
    }
}
