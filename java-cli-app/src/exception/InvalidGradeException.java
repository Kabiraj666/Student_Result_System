package exception;

/**
 * Custom exception thrown when invalid course credits or marks are supplied.
 */
public class InvalidGradeException extends Exception {
    private static final long serialVersionUID = 1L;

    public InvalidGradeException(String message) {
        super(message);
    }
}
