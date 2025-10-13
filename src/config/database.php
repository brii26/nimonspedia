<?php

return [
    'host' => $_ENV['POSTGRES_HOST'] ?? 'db',
    'dbname' => $_ENV['POSTGRES_DB'] ?? 'nimonspedia',
    'username' => $_ENV['POSTGRES_USER'] ?? 'nimonspedia_user',
    'password' => $_ENV['POSTGRES_PASSWORD'] ?? 'nimonspedia_pass',
    'port' => 5432
];