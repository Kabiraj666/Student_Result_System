package exception;

/**
 * Custom exception thrown when a requested student cannot be found in the system.
 */
public class StudentNotFoundException extends Exception {
    private static final long serialVersionUID = 1L;

    public StudentNotFoundException(String message) {
        super(message);
    }
}
