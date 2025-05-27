-- Используем созданную базу данных
USE pipeline_db;

-- Таблица для хранения компаний
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    doc_link VARCHAR(500) NULL COMMENT 'Ссылка на ТЗ в яндекс/гугл документе',
    tender_link VARCHAR(500) NULL COMMENT 'Ссылка на сайт с тендером',
    tkp_link VARCHAR(500) NULL COMMENT 'Ссылка на ТКП в яндекс диске',
    deadline_date DATE NULL COMMENT 'Конечный срок подачи коммерческого предложения',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Таблица для хранения пользователей
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);


-- Таблица для хранения файлов компаний
CREATE TABLE company_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица для хранения логов изменений
CREATE TABLE company_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    from_node VARCHAR(50),
    to_node VARCHAR(50),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Индекс для ускорения поиска по компаниям
CREATE INDEX idx_companies_node_status ON companies(node_id, status);
CREATE INDEX idx_companies_name ON companies(name);

-- Индекс для ускорения поиска логов
CREATE INDEX idx_company_logs_company_id ON company_logs(company_id);
CREATE INDEX idx_company_logs_action ON company_logs(action);
CREATE INDEX idx_company_logs_user_id ON company_logs(user_id);

-- Индекс для ускорения поиска файлов
CREATE INDEX idx_company_files_company_id ON company_files(company_id);
CREATE INDEX idx_company_files_file_type ON company_files(file_type);

-- Создаём тестового пользователя с паролем 'admin123'
INSERT INTO users (username, password, full_name, email, role) 
VALUES ('admin', '$2a$10$7RHdSdXm6rcgB8uP01ZhLuv2rfkTgmTAwfCYgT0HRfcExZ3QpwtQW', 'Администратор', 'admin@example.com', 'admin');
