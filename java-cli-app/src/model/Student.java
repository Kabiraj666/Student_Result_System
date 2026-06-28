package model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a Student, extending the Person class.
 * Demonstrates Inheritance, Polymorphism, and Encapsulation.
 * Manages a dynamic ArrayList of CourseGrade records.
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
            throw new IllegalArgumentException("Student Name must contain only alphabets and spaces.");
        }
        if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            throw new IllegalArgumentException("Invalid Student Email address format.");
        }
        
        this.rollNumber = rollNumber;
        this.semester = semester;
        this.grades = new ArrayList<>();
    }

    // Add a course grade to the student's record
    public void addGrade(CourseGrade grade) {
        // If course grade already exists, update it, otherwise add new
        for (int i = 0; i < grades.size(); i++) {
            if (grades.get(i).getCourseCode().equalsIgnoreCase(grade.getCourseCode())) {
                grades.set(i, grade);
                return;
            }
        }
        grades.add(grade);
    }

    // Get the list of all grades
    public List<CourseGrade> getGrades() {
        return new ArrayList<>(grades); // Return a copy for encapsulation
    }

    // Remove a course grade
    public boolean removeGrade(String courseCode) {
        return grades.removeIf(grade -> grade.getCourseCode().equalsIgnoreCase(courseCode));
    }

    /**
     * Calculates the Semester Grade Point Average (SGPA).
     * Weighted average: Sum(GPA points * Credits) / Sum(Credits)
     */
    public double calculateSGPA() {
        if (grades.isEmpty()) {
            return 0.0;
        }

        double totalGradePoints = 0.0;
        int totalCredits = 0;

        for (CourseGrade grade : grades) {
            totalGradePoints += (grade.getGpaPoints() * grade.getCredits());
            totalCredits += grade.getCredits();
        }

        if (totalCredits == 0) {
            return 0.0;
        }

        return totalGradePoints / totalCredits;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }

    // Implementation of abstract method from Person (Polymorphism & Abstraction)
    @Override
    public String getProfileSummary() {
        return String.format("Student Profile [Roll No: %s] | Name: %s | Sem: %d | SGPA: %.2f",
                rollNumber, name, semester, calculateSGPA());
    }

    @Override
    public String toString() {
        return super.toString() + " | Roll Number: " + rollNumber + " | Sem: " + semester + " | SGPA: " + String.format("%.2f", calculateSGPA());
    }
}
