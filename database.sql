-- ==========================================
-- TOURNAMENT APP - MYSQL DATABASE SCHEMA
-- Imported to cPanel/PhpMyAdmin
-- ==========================================

-- This will create the tables in your database.
-- Before importing this file into phpMyAdmin, make sure you have selected you database (yaarwinn_kff2)

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) UNIQUE NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    username VARCHAR(100) UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    displayName VARCHAR(200),
    password_hash VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0.00,
    totalEarned DECIMAL(10,2) DEFAULT 0.00,
    winMoney DECIMAL(10,2) DEFAULT 0.00,
    premiumType VARCHAR(20) DEFAULT NULL,
    premiumExpiry BIGINT DEFAULT NULL,
    joinedAt BIGINT NOT NULL,
    isBlocked BOOLEAN DEFAULT FALSE,
    referralCode VARCHAR(20) UNIQUE,
    referredBy VARCHAR(50) DEFAULT NULL,
    referralCount INT DEFAULT 0,
    referralEarned DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    created_at BIGINT NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(50) PRIMARY KEY,
    gameId VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    imageUrl TEXT,
    entry_fee DECIMAL(10,2) DEFAULT 0.00,
    prize_pool DECIMAL(10,2) DEFAULT 0.00,
    date_time DATETIME,
    totalPlayers INT DEFAULT 0,
    totalSeats INT DEFAULT 0,
    winningRules TEXT,
    rules TEXT,
    instructions TEXT,
    roomId VARCHAR(100),
    roomPassword VARCHAR(100),
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at BIGINT NOT NULL,
    updated_at BIGINT
);

-- ADD OTHER IMPORTANT TABLES HERE...

CREATE TABLE IF NOT EXISTS tournament_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id VARCHAR(50) NOT NULL,
    uid VARCHAR(50) NOT NULL,
    gameName VARCHAR(100),
    gameId VARCHAR(100),
    seatNumber INT,
    joined_at BIGINT NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    UNIQUE(tournament_id, uid)
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    username VARCHAR(100),
    email VARCHAR(150),
    amount DECIMAL(10,2) NOT NULL,
    upi_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at BIGINT NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS add_money_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    username VARCHAR(100),
    email VARCHAR(150),
    amount DECIMAL(10,2) NOT NULL,
    payApp VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at BIGINT NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value JSON
);

CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imageUrl TEXT NOT NULL,
    linkUrl TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    imageUrl TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    imageUrl TEXT,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrerId VARCHAR(50) NOT NULL,
    newUserId VARCHAR(50) NOT NULL,
    newUserName VARCHAR(100),
    code VARCHAR(30),
    bonusPaid DECIMAL(10,2) DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (referrerId) REFERENCES users(uid),
    FOREIGN KEY (newUserId) REFERENCES users(uid)
);

CREATE TABLE IF NOT EXISTS used_promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    reward DECIMAL(10,2) DEFAULT 0.00,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid)
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    reward DECIMAL(10,2) DEFAULT 0.00,
    description VARCHAR(255),
    usedCount INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id VARCHAR(50) NOT NULL,
    userId VARCHAR(50) NOT NULL,
    rankPlace INT NOT NULL,
    amount DECIMAL(10,2),
    created_at BIGINT NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (userId) REFERENCES users(uid)
);
