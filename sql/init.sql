-- Используем созданную базу данных
USE pipeline_db;

-- Таблица для хранения компаний
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Таблица для хранения логов изменений
CREATE TABLE company_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    action VARCHAR(50) NOT NULL,
    from_node VARCHAR(50),
    to_node VARCHAR(50),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Индекс для ускорения поиска по компаниям
CREATE INDEX idx_companies_node_status ON companies(node_id, status);
CREATE INDEX idx_companies_name ON companies(name);

-- Индекс для ускорения поиска логов
CREATE INDEX idx_company_logs_company_id ON company_logs(company_id);
CREATE INDEX idx_company_logs_action ON company_logs(action);
