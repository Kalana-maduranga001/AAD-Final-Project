package com.springproject.hospitalitymanagnet.backend.exception;

<<<<<<< HEAD

import com.springproject.hospitalitymanagnet.backend.util.APIResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
=======
import com.springproject.hospitalitymanagnet.backend.util.APIResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;
>>>>>>> 0eb3d42 (commit 1)
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

<<<<<<< HEAD
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
     @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse> handlerGenericException(Exception ex) {
        return new ResponseEntity<>(new APIResponse(500 , ex.getMessage()
                ,"sever error"), HttpStatus.INTERNAL_SERVER_ERROR);
=======
import jakarta.persistence.RollbackException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Generic handler that now unwraps the root cause and maps business IllegalStateException
     * (and its wrapped forms) to HTTP 409 so the front-end receives the correct status + message.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse> handlerGenericException(Exception ex) {
        logger.error("Unhandled exception caught by generic handler (will attempt to unwrap):", ex);

        // Unwrap to the root cause
        Throwable root = unwrapRootCause(ex);

        // If the root cause is an IllegalStateException (business rule), return 409 with that message
        if (root instanceof IllegalStateException) {
            String msg = root.getMessage() != null ? root.getMessage() : "Business rule violated";
            logger.warn("Business rule violation unwrapped: {}", msg);
            return new ResponseEntity<>(new APIResponse(409, msg, null), HttpStatus.CONFLICT);
        }

        // If root cause indicates a DB constraint (often wrapped), handle as DataIntegrityViolation fallback
        if (root instanceof DataIntegrityViolationException || containsDataIntegrityMessage(root)) {
            String detail = root.getMessage() != null ? root.getMessage() : ex.getMessage();
            String msg = "Database constraint prevented the operation. " + detail;
            logger.warn("Data integrity violation unwrapped: {}", detail);
            return new ResponseEntity<>(new APIResponse(409, msg, null), HttpStatus.CONFLICT);
        }

        // Otherwise return 500 with the root message for debugging
        String message = root.getMessage() != null ? root.getMessage() : ex.getMessage();
        return new ResponseEntity<>(new APIResponse(500, message, "server error"), HttpStatus.INTERNAL_SERVER_ERROR);
>>>>>>> 0eb3d42 (commit 1)
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse> handlerResourceNotFoundException(ResourceNotFoundException ex) {
<<<<<<< HEAD
        return new ResponseEntity<>(new APIResponse(404 , ex.getMessage()
                ,"Not found"), HttpStatus.NOT_FOUND);
=======
        logger.info("Resource not found: {}", ex.getMessage());
        return new ResponseEntity<>(new APIResponse(404, ex.getMessage(), "Not found"), HttpStatus.NOT_FOUND);
>>>>>>> 0eb3d42 (commit 1)
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<APIResponse> handlerResourceAlreadyExistsException(ResourceAlreadyExistsException ex) {
<<<<<<< HEAD
         return new ResponseEntity<>(new APIResponse(409 , ex.getMessage() , "Resource Already Exists") , HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AllReadyFoundException.class)
    public ResponseEntity<APIResponse> handleAllReadyFoundException(AllReadyFoundException e){
        return new ResponseEntity(new APIResponse(400,e.getMessage(),null)
                , HttpStatus.NOT_FOUND);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse> handleMethodArgumentNotValidException
            (MethodArgumentNotValidException e){
        Map<String,String> errors=new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fieldError ->{
            errors.put(fieldError.getField(),fieldError.getDefaultMessage());
        });
        return new ResponseEntity(new APIResponse(400,"Validation Failed",errors)
                , HttpStatus.BAD_REQUEST);
=======
        logger.info("Resource already exists: {}", ex.getMessage());
        return new ResponseEntity<>(new APIResponse(409, ex.getMessage(), "Resource Already Exists"), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AllReadyFoundException.class)
    public ResponseEntity<APIResponse> handleAllReadyFoundException(AllReadyFoundException e) {
        logger.info("AllReadyFoundException: {}", e.getMessage());
        return new ResponseEntity<>(new APIResponse(400, e.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fieldError -> {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        });
        logger.info("Validation failed: {}", errors);
        return new ResponseEntity<>(new APIResponse(400, "Validation Failed", errors), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<APIResponse> handleIllegalStateException(IllegalStateException ex) {
        logger.warn("IllegalStateException: {}", ex.getMessage());
        return new ResponseEntity<>(new APIResponse(409, ex.getMessage(), null), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<APIResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        String detailed = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String msg = "Database constraint prevented the operation. " + detailed;
        logger.warn("DataIntegrityViolationException: {}", detailed);
        return new ResponseEntity<>(new APIResponse(409, msg, null), HttpStatus.CONFLICT);
    }

    /**
     * Catch common transaction/persistence wrappers and map them according to their root cause.
     * This prevents wrapped exceptions from escaping as 500 with opaque messages.
     */
    @ExceptionHandler({ TransactionSystemException.class, RollbackException.class })
    public ResponseEntity<APIResponse> handleTransactionWrappers(Exception ex) {
        logger.warn("Transaction wrapper exception caught: {}", ex.getClass().getSimpleName(), ex);
        Throwable root = unwrapRootCause(ex);

        if (root instanceof IllegalStateException) {
            String msg = root.getMessage() != null ? root.getMessage() : "Business rule violated";
            return new ResponseEntity<>(new APIResponse(409, msg, null), HttpStatus.CONFLICT);
        }

        if (root instanceof DataIntegrityViolationException || containsDataIntegrityMessage(root)) {
            String detail = root.getMessage() != null ? root.getMessage() : ex.getMessage();
            return new ResponseEntity<>(new APIResponse(409, "Database constraint prevented the operation. " + detail, null), HttpStatus.CONFLICT);
        }

        String message = root.getMessage() != null ? root.getMessage() : ex.getMessage();
        return new ResponseEntity<>(new APIResponse(500, message, "server error"), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // -----------------------
    // Utility helpers
    // -----------------------

    private static Throwable unwrapRootCause(Throwable t) {
        Throwable root = t;
        while (root.getCause() != null && root != root.getCause()) {
            root = root.getCause();
        }
        return root;
    }

    /**
     * Heuristic: sometimes the root cause is a generic persistence exception whose message mentions "Integrity constraint"
     * or "foreign key" etc. Detect those to treat as a DataIntegrityViolation.
     */
    private static boolean containsDataIntegrityMessage(Throwable t) {
        if (t == null || t.getMessage() == null) return false;
        String m = t.getMessage().toLowerCase();
        return m.contains("constraint") || m.contains("foreign key") || m.contains("integrity") || m.contains("cannot delete or update a parent row");
>>>>>>> 0eb3d42 (commit 1)
    }
}
