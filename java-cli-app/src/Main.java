import exception.InvalidGradeException;
import exception.StudentNotFoundException;
import model.CourseGrade;
import model.Student;
import service.GradeService;

import java.util.List;
import java.util.Scanner;

/**
 * Main application class. Provides the CLI interface for the Student Result System.
 * Focuses on handling user input, formatting table outputs, and handling exceptions.
 */
public class Main {
    private static final String DB_FILE_PATH = "data/students_db.txt";
    private static GradeService gradeService;
    private static Scanner scanner;

    public static void main(String[] args) {
        gradeService = new GradeService(DB_FILE_PATH);
        scanner = new Scanner(System.in);
        
        // Seed initial data if the database is empty
        seedInitialDataIfEmpty();

        System.out.println("==================================================");
        System.out.println("       STUDENT RESULT MANAGEMENT SYSTEM CLI       ");
        System.out.println("==================================================");

        boolean exit = false;
        while (!exit) {
            printMenu();
            int choice = readIntInput("Enter choice (1-10): ");
            System.out.println();

            switch (choice) {
                case 1:
                    addNewStudent();
                    break;
                case 2:
                    viewAllStudents();
                    break;
                case 3:
                    searchStudentByRollNumber();
                    break;
                case 4:
                    searchStudentsByName();
                    break;
                case 5:
                    addOrUpdateGrade();
                    break;
                case 6:
                    removeGrade();
                    break;
                case 7:
                    updateStudentDetails();
                    break;
                case 8:
                    deleteStudent();
                    break;
                case 9:
                    viewClassStatistics();
                    break;
                case 10:
                    exit = true;
                    System.out.println("Exiting Student Result System. Goodbye!");
                    break;
                default:
                    System.out.println("Invalid Choice! Please enter a number between 1 and 10.");
            }
            System.out.println();
        }
        scanner.close();
    }

    private static void printMenu() {
        System.out.println("--------------------------------------------------");
        System.out.println("1. Add New Student");
        System.out.println("2. View All Students");
        System.out.println("3. Search Student by Roll Number");
        System.out.println("4. Search Students by Name");
        System.out.println("5. Add/Update Course Grade");
        System.out.println("6. Remove Course Grade");
        System.out.println("7. Update Student Details");
        System.out.println("8. Delete Student");
        System.out.println("9. View Class Statistics");
        System.out.println("10. Exit");
        System.out.println("--------------------------------------------------");
    }

    private static void addNewStudent() {
        System.out.println("--- Add New Student ---");
        String rollNumber = readStringInput("Enter Roll Number (e.g., BT22CSE045): ").trim();
        if (rollNumber.isEmpty()) {
            System.out.println("Roll Number cannot be empty!");
            return;
        }

        String name = readStringInput("Enter Name: ").trim();
        String email = readStringInput("Enter Email: ").trim();
        int semester = readIntInput("Enter Semester (1-8): ");

        if (semester < 1 || semester > 8) {
            System.out.println("Invalid Semester! Must be between 1 and 8.");
            return;
        }

        // Generate a simple unique ID
        String id = "STU" + System.currentTimeMillis() % 100000;

        try {
            Student s = new Student(id, name, email, rollNumber, semester);
            gradeService.addStudent(s);
            System.out.println("Student added successfully! Details: " + s.getProfileSummary());
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void viewAllStudents() {
        System.out.println("--- View All Students ---");
        System.out.println("Sort options:");
        System.out.println("1. Sort by Roll Number");
        System.out.println("2. Sort by Name");
        System.out.println("3. Sort by SGPA (Highest first)");
        int sortChoice = readIntInput("Select sorting option (1-3): ");

        List<Student> list;
        switch (sortChoice) {
            case 2:
                list = gradeService.getStudentsSortedByName();
                break;
            case 3:
                list = gradeService.getStudentsSortedBySGPA();
                break;
            case 1:
            default:
                list = gradeService.getStudentsSortedByRollNumber();
                break;
        }

        if (list.isEmpty()) {
            System.out.println("No student records available.");
            return;
        }

        printStudentTable(list);
    }

    private static void searchStudentByRollNumber() {
        System.out.println("--- Search Student by Roll Number ---");
        String rollNumber = readStringInput("Enter Roll Number to search: ").trim();

        try {
            Student student = gradeService.getStudent(rollNumber);
            System.out.println("\nStudent Found:");
            System.out.println("--------------------------------------------------");
            System.out.println("ID: " + student.getId());
            System.out.println("Name: " + student.getName());
            System.out.println("Roll Number: " + student.getRollNumber());
            System.out.println("Email: " + student.getEmail());
            System.out.println("Semester: " + student.getSemester());
            System.out.println("SGPA: " + String.format("%.2f", student.calculateSGPA()));
            System.out.println("--------------------------------------------------");
            
            List<CourseGrade> grades = student.getGrades();
            if (grades.isEmpty()) {
                System.out.println("No course grades recorded for this student.");
            } else {
                System.out.println("Course Grades:");
                System.out.printf("%-12s |-25s |-8s |-6s |-6s\n", "Course Code", "Course Name", "Credits", "Marks", "Grade");
                System.out.println("--------------------------------------------------");
                for (CourseGrade g : grades) {
                    System.out.printf("%-12s |-25s |-8d |-6.1f |-6s\n",
                            g.getCourseCode(), g.getCourseName(), g.getCredits(), g.getMarks(), g.getLetterGrade());
                }
            }
        } catch (StudentNotFoundException e) {
            System.out.println(e.getMessage());
        }
    }

    private static void searchStudentsByName() {
        System.out.println("--- Search Students by Name ---");
        String query = readStringInput("Enter name keyword: ").trim();

        List<Student> results = gradeService.searchStudentsByName(query);
        if (results.isEmpty()) {
            System.out.println("No students matching '" + query + "' found.");
        } else {
            System.out.println("\nMatching Student Records:");
            printStudentTable(results);
        }
    }

    private static void addOrUpdateGrade() {
        System.out.println("--- Add/Update Course Grade ---");
        String rollNumber = readStringInput("Enter Student Roll Number: ").trim();

        try {
            // Check if student exists first
            Student s = gradeService.getStudent(rollNumber);

            String courseCode = readStringInput("Enter Course Code (e.g., CS201): ").trim().toUpperCase();
            String courseName = readStringInput("Enter Course Name: ").trim();
            int credits = readIntInput("Enter Course Credits (1-6): ");
            double marks = readDoubleInput("Enter Marks Obtained (0-100): ");

            CourseGrade grade = new CourseGrade(courseCode, courseName, credits, marks);
            gradeService.addGradeToStudent(rollNumber, grade);
            System.out.println("Grade updated successfully for " + s.getName() + " in " + courseCode + "!");
        } catch (StudentNotFoundException | InvalidGradeException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void removeGrade() {
        System.out.println("--- Remove Course Grade ---");
        String rollNumber = readStringInput("Enter Student Roll Number: ").trim();
        String courseCode = readStringInput("Enter Course Code to remove: ").trim().toUpperCase();

        try {
            gradeService.removeGradeFromStudent(rollNumber, courseCode);
            System.out.println("Course grade " + courseCode + " removed successfully!");
        } catch (StudentNotFoundException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void updateStudentDetails() {
        System.out.println("--- Update Student Details ---");
        String rollNumber = readStringInput("Enter Roll Number of student to update: ").trim();

        try {
            Student s = gradeService.getStudent(rollNumber);
            System.out.println("Current details: Name=" + s.getName() + ", Email=" + s.getEmail() + ", Sem=" + s.getSemester());

            String newName = readStringInput("Enter New Name (leave blank to keep current): ").trim();
            if (newName.isEmpty()) newName = s.getName();

            String newEmail = readStringInput("Enter New Email (leave blank to keep current): ").trim();
            if (newEmail.isEmpty()) newEmail = s.getEmail();

            int newSem = readIntInput("Enter New Semester (1-8, or 0 to keep current): ");
            if (newSem == 0) newSem = s.getSemester();

            if (newSem < 1 || newSem > 8) {
                System.out.println("Invalid semester. Update aborted.");
                return;
            }

            gradeService.updateStudent(rollNumber, newName, newEmail, newSem);
            System.out.println("Student details updated successfully!");
        } catch (StudentNotFoundException e) {
            System.out.println(e.getMessage());
        }
    }

    private static void deleteStudent() {
        System.out.println("--- Delete Student Record ---");
        String rollNumber = readStringInput("Enter Roll Number of student to delete: ").trim();

        try {
            Student student = gradeService.getStudent(rollNumber);
            String confirm = readStringInput("Are you sure you want to delete student " + student.getName() + "? (Y/N): ");
            if (confirm.equalsIgnoreCase("Y")) {
                gradeService.deleteStudent(rollNumber);
                System.out.println("Student record deleted successfully.");
            } else {
                System.out.println("Deletion cancelled.");
            }
        } catch (StudentNotFoundException e) {
            System.out.println(e.getMessage());
        }
    }

    private static void viewClassStatistics() {
        System.out.println("--- Class Statistics ---");
        List<Student> all = gradeService.getAllStudents();
        System.out.println("Total Students Enrolled: " + all.size());
        
        double classAvg = gradeService.calculateClassAverageSGPA();
        System.out.printf("Class Average SGPA: %.2f / 10.00\n", classAvg);

        if (all.isEmpty()) return;

        // Find topper
        Student topper = null;
        double maxSgpa = -1.0;
        for (Student s : all) {
            if (s.getGrades().size() > 0 && s.calculateSGPA() > maxSgpa) {
                maxSgpa = s.calculateSGPA();
                topper = s;
            }
        }

        if (topper != null) {
            System.out.printf("Class Topper: %s (%s) with SGPA: %.2f\n", topper.getName(), topper.getRollNumber(), maxSgpa);
        }
    }

    private static void printStudentTable(List<Student> list) {
        System.out.println("==========================================================================================");
        System.out.printf("%-12s |%-22s |%-25s |%-5s |%-5s |%-10s\n",
                "Roll Number", "Name", "Email", "Sem", "GPA", "No. Courses");
        System.out.println("==========================================================================================");
        for (Student s : list) {
            System.out.printf("%-12s |%-22s |%-25s |%-5d |%-5.2f |%-10d\n",
                    s.getRollNumber(),
                    s.getName().length() > 22 ? s.getName().substring(0, 19) + "..." : s.getName(),
                    s.getEmail().length() > 25 ? s.getEmail().substring(0, 22) + "..." : s.getEmail(),
                    s.getSemester(),
                    s.calculateSGPA(),
                    s.getGrades().size());
        }
        System.out.println("==========================================================================================");
    }

    // Helper input readers with formatting and robust error parsing
    private static String readStringInput(String prompt) {
        System.out.print(prompt);
        return scanner.nextLine();
    }

    private static int readIntInput(String prompt) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine();
            try {
                return Integer.parseInt(input);
            } catch (NumberFormatException e) {
                System.out.println("Invalid Input! Please enter a valid integer.");
            }
        }
    }

    private static double readDoubleInput(String prompt) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine();
            try {
                return Double.parseDouble(input);
            } catch (NumberFormatException e) {
                System.out.println("Invalid Input! Please enter a valid floating-point number.");
            }
        }
    }

    /**
     * Seeds some mock records if the text database is newly initialized.
     */
    private static void seedInitialDataIfEmpty() {
        if (!gradeService.getAllStudents().isEmpty()) {
            return;
        }

        try {
            System.out.println("[Database empty. Seeding mock student records for demo purposes...]");
            
            Student s1 = new Student("STU1", "Aditya Sharma", "aditya.sharma@btech.edu", "BT22CSE001", 4);
            s1.addGrade(new CourseGrade("CS201", "Data Structures", 4, 88.0));
            s1.addGrade(new CourseGrade("CS202", "Object Oriented Programming", 3, 94.0));
            s1.addGrade(new CourseGrade("CS203", "Discrete Mathematics", 4, 76.5));
            gradeService.addStudent(s1);

            Student s2 = new Student("STU2", "Priyanka Verma", "priyanka.v@btech.edu", "BT22CSE012", 4);
            s2.addGrade(new CourseGrade("CS201", "Data Structures", 4, 95.0));
            s2.addGrade(new CourseGrade("CS202", "Object Oriented Programming", 3, 91.0));
            s2.addGrade(new CourseGrade("CS203", "Discrete Mathematics", 4, 82.0));
            gradeService.addStudent(s2);

            Student s3 = new Student("STU3", "Rohan Das", "rohan.das@btech.edu", "BT22ECE034", 4);
            s3.addGrade(new CourseGrade("EC201", "Digital Electronics", 4, 62.0));
            s3.addGrade(new CourseGrade("EC202", "Signals and Systems", 4, 55.5));
            s3.addGrade(new CourseGrade("CS202", "Object Oriented Programming", 3, 80.0));
            gradeService.addStudent(s3);
            
            gradeService.saveToStorage();
        } catch (Exception e) {
            System.out.println("Error seeding data: " + e.getMessage());
        }
    }
}
