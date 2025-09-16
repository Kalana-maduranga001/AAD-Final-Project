package com.springproject.hospitalitymanagnet.backend.exception;


import com.springproject.hospitalitymanagnet.backend.util.APIResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
     @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse> handlerGenericException(Exception ex) {
        return new ResponseEntity<>(new APIResponse(500 , ex.getMessage()
                ,"sever error"), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse> handlerResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(new APIResponse(404 , ex.getMessage()
                ,"Not found"), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<APIResponse> handlerResourceAlreadyExistsException(ResourceAlreadyExistsException ex) {
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
    }
}
