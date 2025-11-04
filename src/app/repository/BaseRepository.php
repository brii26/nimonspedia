<?php

abstract class BaseRepository {
    protected $db;
    protected $table;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Find record by ID
     */
    public function find($id) {
        $primaryKey = $this->getPrimaryKey();
        return $this->db->selectOne("SELECT * FROM {$this->table} WHERE {$primaryKey} = ?", [$id]);
    }
    
    /**
     * Find all records with optional pagination
     */
    public function findAll($limit = null, $offset = 0) {
        $sql = "SELECT * FROM {$this->table}";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        return $this->db->select($sql);
    }
    
    /**
     * Create new record
     */
    public function create($data) {
        $fields = array_keys($data);
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';
        
        $primaryKey = $this->getPrimaryKey();
        $sql = "INSERT INTO {$this->table} (" . implode(',', $fields) . ") VALUES ({$placeholders}) RETURNING {$primaryKey}";
        
        $result = $this->db->selectOne($sql, array_values($data));
        return $result ? $result[$primaryKey] : null;
    }
    
    /**
     * Update existing record
     */
    public function update($id, $data) {
        if (empty($data)) {
            return false;
        }
        
        $fields = array_keys($data);
        $setClause = implode(' = ?, ', $fields) . ' = ?';
        
        $primaryKey = $this->getPrimaryKey();
        $sql = "UPDATE {$this->table} SET {$setClause} WHERE {$primaryKey} = ?";
        
        $params = array_values($data);
        $params[] = $id;
        
        return $this->db->update($sql, $params) > 0;
    }
    
    /**
     * Delete record 
     */
    public function delete($id) {
        $primaryKey = $this->getPrimaryKey();
        
        if ($this->hasDeletedAtColumn()) {
            $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE {$primaryKey} = ?";
            return $this->db->update($sql, [$id]) > 0;
        } else {
            $sql = "DELETE FROM {$this->table} WHERE {$primaryKey} = ?";
            return $this->db->delete($sql, [$id]) > 0;
        }
    }
    
    /**
     * Count total records
     */
    public function count($where = null, $params = []) {
        $sql = "SELECT COUNT(*) as total FROM {$this->table}";
        
        if ($where) {
            $sql .= " WHERE {$where}";
        }
        
        $result = $this->db->selectOne($sql, $params);
        return $result ? (int)$result['total'] : 0;
    }
    
    /**
     * Find records with WHERE clause
     */
    public function where($condition, $params = [], $limit = null, $offset = 0) {
        $sql = "SELECT * FROM {$this->table} WHERE {$condition}";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        return $this->db->select($sql, $params);
    }
    
    /**
     * Find first record matching condition
     */
    public function whereFirst($condition, $params = []) {
        $sql = "SELECT * FROM {$this->table} WHERE {$condition} LIMIT 1";
        return $this->db->selectOne($sql, $params);
    }
    
    /**
     * Get primary key name 
     */
    protected function getPrimaryKey() {
        return $this->table . '_id';
    }
    
    /**
     * Check if table has deleted_at column for soft deletes
     */
    protected function hasDeletedAtColumn() {
        $sql = "SELECT column_name FROM information_schema.columns 
                WHERE table_name = ? AND column_name = 'deleted_at'";
        
        $result = $this->db->selectOne($sql, [$this->table]);
        return !empty($result);
    }
    
    /**
     * Get paginated results
     */
    public function paginate($page = 1, $perPage = 10, $where = null, $params = []) {
        $offset = ($page - 1) * $perPage;
        $total = $this->count($where, $params);
        $sql = "SELECT * FROM {$this->table}";
        if ($where) {
            $sql .= " WHERE {$where}";
        }
        $sql .= " LIMIT {$perPage} OFFSET {$offset}";
        
        $records = $this->db->select($sql, $params);
        
        return [
            'data' => $records,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage),
            'has_more' => ($page * $perPage) < $total
        ];
    }
}
