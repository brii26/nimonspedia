<?php

class Cache {
    private static $instance = null;
    private $redis = null;

    private function __construct() {
        try {
            if (class_exists('Redis')) {
                $this->redis = new Redis();
                $host = getenv('REDIS_HOST') ?: 'redis';
                $port = getenv('REDIS_PORT') ?: 6379;
                
                // Connect with a short timeout (1s) to avoid hanging the PHP process
                if (!@$this->redis->connect($host, $port, 1)) {
                    $this->redis = null;
                }
            }
        } catch (Exception $e) {
            $this->redis = null;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get a value from the cache.
     * @param string $key
     * @return mixed|null Returns the cached value (unserialized) or null on miss/error.
     */
    public static function get($key) {
        $instance = self::getInstance();
        if (!$instance->redis) {
            error_log("Cache::get failed: Redis not connected for key $key"); // DEBUG LOG
            return null;
        }

        try {
            $value = $instance->redis->get($key);
            if ($value === false) {
                // Key not found or error, can't distinguish, so log it.
                // error_log("Cache::get miss or error for key $key"); // Too verbose, disable for now.
            }
            return $value !== false ? json_decode($value, true) : null;
        } catch (Exception $e) {
            error_log("Cache::get exception for key $key: " . $e->getMessage()); // DEBUG LOG
            return null;
        }
    }

    /**
     * Set a value in the cache.
     * @param string $key
     * @param mixed $value Data to cache (will be JSON encoded)
     * @param int $ttl Time to live in seconds (default 60s)
     * @return bool True on success, false on failure.
     */
    public static function set($key, $value, $ttl = 60) {
        $instance = self::getInstance();
        if (!$instance->redis) {
            error_log("Cache::set failed: Redis not connected for key $key"); // DEBUG LOG
            return false;
        }

        try {
            $result = $instance->redis->setex($key, $ttl, json_encode($value));
            if (!$result) {
                error_log("Cache::set failed to store key $key. Redis error: " . $instance->redis->getLastError()); // DEBUG LOG
            }
            return $result;
        } catch (Exception $e) {
            error_log("Cache::set exception for key $key: " . $e->getMessage()); // DEBUG LOG
            return false;
        }
    }
    
    /**
     * Delete a value from the cache.
     * @param string $key
     * @return bool True on success, false on failure.
     */
    public static function del($key) {
        $instance = self::getInstance();
        if (!$instance->redis) {
            error_log("Cache::del failed: Redis not connected for key $key"); // DEBUG LOG
            return false;
        }

        try {
            return (bool)$instance->redis->del($key);
        } catch (Exception $e) {
            error_log("Cache::del exception for key $key: " . $e->getMessage()); // DEBUG LOG
            return false;
        }
    }
}
