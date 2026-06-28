package model;

import java.io.Serializable;

/**
 * Represents a specific course and the grade obtained by a student.
 * Encapsulates mark-to-grade and GPA calculations.
 */
public class CourseGrade implements Serializable {
    private static final long serialVersionUID = 1L;

    private String courseCode;
    private String courseName;
    private int credits;
    private double marks; // 0.0 to 100.0
    private String letterGrade;
    private double gpaPoints; // Out of 10.0

    public CourseGrade(String courseCode, String courseName, int credits, double marks) {
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.credits = credits;
        this.marks = marks;
        calculateGrade();
    }

    /**
     * Logic to calculate Letter Grade and GPA Points (10-point scale common in B.Tech).
     */
    private void calculateGrade() {
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
            gpaPoints = 0.0;
        }
    }

    // Getters and Setters
    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public double getMarks() {
        return marks;
    }

    public void setMarks(double marks) {
        this.marks = marks;
        calculateGrade(); // Recalculate grade when marks change
    }

    public String getLetterGrade() {
        return letterGrade;
    }

    public double getGpaPoints() {
        return gpaPoints;
    }

    @Override
    public String toString() {
        return String.format("%s - %s (%d credits): Marks = %.1f, Grade = %s, GPA = %.1f",
                courseCode, courseName, credits, marks, letterGrade, gpaPoints);
    }
}
