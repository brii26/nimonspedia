<?php

class ValidationException extends Exception {
    private $errors;
    
    public function __construct($errors, $message = "Validation failed", $code = 422) {
        parent::__construct($message, $code);
        $this->errors = $errors;
    }
    
    public function getErrors() {
        return $this->errors;
    }
    
    public function hasError($field) {
        return isset($this->errors[$field]);
    }
    
    public function getError($field) {
        return $this->errors[$field] ?? null;
    }
    
    public function getErrorsAsString() {
        return implode(', ', $this->errors);
    }
}