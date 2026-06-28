package repository;

import model.Student;
import model.CourseGrade;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles persistence operations. Saves and loads student records
 * to/from a human-readable text file (CSV format).
 */
public class FileRepository {

    /**
     * Saves list of students and their grades to the specified file path.
     */
    public void save(List<Student> students, String filePath) throws IOException {
        File file = new File(filePath);
        // Ensure parent directories exist
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
            for (Student student : students) {
                // Write student header
                // Format: STUDENT,id,name,email,rollNumber,semester
                writer.write(String.format("STUDENT,%s,%s,%s,%s,%d",
                        student.getId(),
                        student.getName(),
                        student.getEmail(),
                        student.getRollNumber(),
                        student.getSemester()));
                writer.newLine();

                // Write course grades for this student
                // Format: GRADE,courseCode,courseName,credits,marks
                for (CourseGrade grade : student.getGrades()) {
                    writer.write(String.format("GRADE,%s,%s,%d,%.1f",
                            grade.getCourseCode(),
                            grade.getCourseName(),
                            grade.getCredits(),
                            grade.getMarks()));
                    writer.newLine();
                }
            }
        }
    }

    /**
     * Loads student records and their grades from the specified file path.
     */
    public List<Student> load(String filePath) throws IOException {
        List<Student> students = new ArrayList<>();
        File file = new File(filePath);

        if (!file.exists()) {
            return students; // Return empty list if file doesn't exist yet
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            Student currentStudent = null;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }

                String[] parts = line.split(",");
                String type = parts[0];

                if (type.equals("STUDENT")) {
                    String id = parts[1];
                    String name = parts[2];
                    String email = parts[3];
                    String rollNumber = parts[4];
                    int semester = Integer.parseInt(parts[5]);

                    currentStudent = new Student(id, name, email, rollNumber, semester);
                    students.add(currentStudent);
                } else if (type.equals("GRADE")) {
                    if (currentStudent != null) {
                        String courseCode = parts[1];
                        String courseName = parts[2];
                        int credits = Integer.parseInt(parts[3]);
                        double marks = Double.parseDouble(parts[4]);

                        CourseGrade grade = new CourseGrade(courseCode, courseName, credits, marks);
                        currentStudent.addGrade(grade);
                    }
                }
            }
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            throw new IOException("Corrupted database file format. Could not load records.", e);
        }

        return students;
    }
}
