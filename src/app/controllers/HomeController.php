<?php

class HomeController extends BaseController {
    
    /**
     * Handle root route - redirect based on authentication status
     */
    public function index() {
        if (Auth::check()) {
            $user = Auth::user();
            
            if ($user['role'] === 'SELLER') {
                $this->redirect('/dashboard');
            } else {
                $this->redirect('/dashboard'); 
            }
        } else {
            $this->redirect('/login');
        }
    }
}
