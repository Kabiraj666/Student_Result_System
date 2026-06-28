# Student Result Management System (Core Java CLI)

This is the Core Java implementation of the Student Result Management System, designed to showcase strong software engineering foundations for B.Tech portfolios.

## Key Features

1. **Object-Oriented Programming (OOP) Design**:
   - **Abstraction**: Base class `Person` defines common properties and abstract behaviors (`getProfileSummary()`).
   - **Inheritance**: `Student` inherits `Person` and extends it with academic data.
   - **Encapsulation**: Enforces validation on student records, marks (0–100), and course credits (1–6) using strict getters and setters.
   - **Polymorphism**: Overridden `toString()` methods and dynamic runtime binding for profile generation.
2. **Data Structures**:
   - Uses `ArrayList` for dynamic records and managing collections of grades.
   - Uses sorting algorithms (Comparators and Lambdas) to sort students by Roll Number, Name, or SGPA.
3. **Exception Handling**:
   - Custom exception definitions (`StudentNotFoundException`, `InvalidGradeException`) to handle business rule violations.
   - Robust CLI inputs (catch mismatch errors when letters are typed instead of numbers).
4. **File I/O Data Persistence**:
   - Saves and loads database records automatically from a custom CSV-like text format (`data/students_db.txt`).

---

## Folder Structure

```text
src/
├── model/
│   ├── Person.java          # Abstract Person class (Abstraction/Inheritance)
│   ├── Student.java         # Student record model (Inherits Person)
│   └── CourseGrade.java     # Individual Course grade details & GPA calculations
├── exception/
│   ├── InvalidGradeException.java
│   └── StudentNotFoundException.java
├── repository/
│   └── FileRepository.java  # Persistent I/O file handlers
├── service/
│   └── GradeService.java    # Core backend controller, searches, and sorters
└── Main.java                # Command-line main menu interface loop
```

---

## How to Compile & Run

### Prerequisites
- Java Development Kit (JDK) 8 or higher installed on your system.
- Check version by running `java -version` in your terminal.

### Compilation
Open your terminal/command prompt, navigate to the `java-cli-app` directory, and run:

```bash
# 1. Create a build directory
mkdir bin

# 2. Compile all source files into the bin folder
javac -d bin src/model/*.java src/exception/*.java src/repository/*.java src/service/*.java src/Main.java
```

### Running the App
Once compiled successfully, run the application from the `java-cli-app` directory:

```bash
# Run the compiled bytecode
java -cp bin Main
```

---

## How to Verify Persistence
When you run the application and add students or update grades, a text file is created at `data/students_db.txt`. You can open this file in any text editor to see how the state is saved in CSV format!
