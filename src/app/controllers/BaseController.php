<?php

abstract class BaseController {
    protected $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Render template with data
     */
    protected function render($template, $data = []) {
        $data = array_merge($data, [
            'user' => Auth::user(),
            'csrf_token' => Auth::csrfToken(),
            'is_authenticated' => Auth::check(),
            'is_buyer' => Auth::isBuyer(),
            'is_seller' => Auth::isSeller(),
            'current_url' => $_SERVER['REQUEST_URI']
        ]);

        if ($data['is_seller'] && $data['user']) {
            try {
                $storeRepo = new StoreRepository(); 
                $store = $storeRepo->findByUserId($data['user']['user_id']);
                $data['storeBalance'] = $store['balance'] ?? 0;
            } catch (Exception $e) {
                error_log("Failed to fetch store balance for navbar: " . $e->getMessage());
                $data['storeBalance'] = 0;
            }
        }
        
        try {
            $pageContent = View::render($template, $data);
        } catch (Exception $e) {
            error_log("Error rendering view content '{$template}': " . $e->getMessage());
            $pageContent = "<p>Error: Could not render page content. View file '{$template}' not found or invalid.</p>";
            if (!headers_sent()) {
                http_response_code(500);
            }
        }

        $data['content'] = $pageContent;

        try {
            echo View::component('layout', $data);
        } catch (Exception $e) {
            error_log("Error rendering layout 'components/layout': " . $e->getMessage());
            echo "<h1>Application Layout Error</h1>";
            echo "<p>Could not render the main application layout.</p>";
            if (!headers_sent()) {
                http_response_code(500);
            }
        }
    }
    
    /**
     * Return JSON response
     */
    protected function json($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Redirect to URL
     */
    protected function redirect($url, $status = 302) {
        http_response_code($status);
        header("Location: {$url}");
        exit;
    }

    protected function handle404(){
        http_response_code(404);
        $this->render('pages/errors/404', [
            'cssFiles' => ['/css/pages/errors.css'],
            'pageTitle' => '404 Not Found'
        ]);
        return;
    }
    
    /**
     * Require authentication
     */
    protected function requireAuth() {
        Auth::requireAuth();
    }
    
    /**
     * Require specific role
     */
    protected function requireRole($role) {
        Auth::requireRole($role);
    }
    
    /**
     * Get input data (POST/GET)
     */
    protected function getInput($key = null, $default = null) {
        $input = array_merge($_GET, $_POST);
        
        if ($key === null) {
            return $input;
        }
        
        return $input[$key] ?? $default;
    }
    
    /**
     * Get only POST data
     */
    protected function getPost($key = null, $default = null) {
        if ($key === null) {
            return $_POST;
        }
        
        return $_POST[$key] ?? $default;
    }
    
    /**
     * Get only GET data
     */
    protected function getQuery($key = null, $default = null) {
        if ($key === null) {
            return $_GET;
        }
        
        return $_GET[$key] ?? $default;
    }
    
    /**
     * Get uploaded file
     */
    protected function getFile($key) {
        return $_FILES[$key] ?? null;
    }
    
    /**
     * Validate input data
     */
    protected function validate($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            if (is_array($rule)) {
                foreach ($rule as $r) {
                    $error = $this->validateField($field, $value, $r, $data);
                    if ($error) {
                        $errors[$field] = $error;
                        break; // Stop on first error for this field
                    }
                }
            } else {
                $error = $this->validateField($field, $value, $rule, $data);
                if ($error) {
                    $errors[$field] = $error;
                }
            }
        }
        
        if (!empty($errors)) {
            throw new ValidationException($errors);
        }
        
        return true;
    }
    
    /**
     * Validate individual field
     */
	private function validateField($field, $value, $rule, $allData) {
		$fieldName = ucfirst(str_replace('_', ' ', $field));
	
		if ($rule === 'required' && (empty($value) && $value !== '0')) {
			return "{$fieldName} is required";
		}
	
		if (is_array($value) && isset($value['error'])) {
			
			if ($value['error'] !== UPLOAD_ERR_NO_FILE) {
				
				if (strpos($rule, 'mimes:') === 0) {
					$allowedMimes = explode(',', substr($rule, 6));
					$error = FileService::validateImageMime($value, $allowedMimes);
					if ($error) {
						return $error;
					}
				}
				
				if (strpos($rule, 'size:') === 0) {
					$maxSizeBytes = (int)substr($rule, 5);
					$error = FileService::validateImageSize($value, $maxSizeBytes);
					if ($error) {
						return $error;
					}
				}
				
				if ($value['error'] !== UPLOAD_ERR_OK) {
					return "{$fieldName} upload failed. Error code: " . $value['error'];
				}
			}
		}
	
		if (!empty($value)) {
			if ($rule === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
				return "{$fieldName} must be a valid email address";
			}

			if ($rule === 'array' && !is_array($value)) {
				return "{$fieldName} must be an array";
			}
	
			if (strpos($rule, 'min:') === 0) {
				$min = (int)substr($rule, 4);
				if (strlen($value) < $min) {
					return "{$fieldName} must be at least {$min} characters";
				}
			}
	
			if (strpos($rule, 'regex:') === 0) {
				$ruleContent = substr($rule, 6);
	
				$parts = explode('`', $ruleContent, 2);
				$regex = $parts[0];
				$customMessage = $parts[1] ?? null;
				if (!preg_match($regex, $value)) {
					return $customMessage ?: "{$fieldName} format is invalid.";
				}
			}
	
			if (strpos($rule, 'max:') === 0) {
				$max = (int)substr($rule, 4);
				if (strlen($value) > $max) {
					return "{$fieldName} must not exceed {$max} characters";
				}
			}
	
			if ($rule === 'numeric' && !is_numeric($value)) {
				return "{$fieldName} must be a number";
			}
	
			if (strpos($rule, 'numeric_min:') === 0) {
				$minVal = (float)substr($rule, 12); 
				if (!is_numeric($value)) {
					return "{$fieldName} must be a number";
				}
				if ((float)$value < $minVal) {
					return "{$fieldName} must be at least {$minVal}";
				}
			}
	
			if (strpos($rule, 'in:') === 0) {
				$options = explode(',', substr($rule, 3));
				if (!in_array($value, $options)) {
					return "{$fieldName} must be one of: " . implode(', ', $options);
				}
			}
		}
		
		return null;
	}
	
    
    /**
     * Verify CSRF token
     */
    protected function verifyCsrf() {
        $token = $this->getPost('csrf_token');
        
        if (!$token) {
            throw new Exception('CSRF token is required');
        }
        
        // Ensure session has CSRF token
        if (!isset($_SESSION['csrf_token'])) {
            throw new Exception('CSRF session token missing');
        }
        
        // Use simple string comparison for debugging
        $sessionToken = $_SESSION['csrf_token'];
        if ($token !== $sessionToken) {
            // Log for debugging
            error_log("CSRF Mismatch - Form: " . substr($token, 0, 8) . " Session: " . substr($sessionToken, 0, 8));
            throw new Exception('CSRF token mismatch');
        }
        
        return true;
    }
    
    /**
     * Return error response
     */
    protected function error($message, $status = 400) {
        $this->json(['error' => $message], $status);
    }
    
    /**
     * Return success response
     */
    protected function success($message, $data = null) {
        $response = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->json($response);
    }

    protected function isAjax() {
        return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    }
}

/**
 * Custom exception for validation errors
 */
class ValidationException extends Exception {
    private $errors;
    
    public function __construct($errors) {
        $this->errors = $errors;
        parent::__construct('Validation failed');
    }
    
    public function getErrors() {
        return $this->errors;
    }
    
    public function getFirstError() {
        return reset($this->errors);
    }
}
