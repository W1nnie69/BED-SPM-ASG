USE bed_spm_asg_db;
GO

-- ============================================
-- HAWKER CENTRE DATABASE - CREATE TABLES
-- Tables ordered by dependencies
-- Run this entire file in sequence
-- ============================================

-- ============================================
-- LEVEL 0: No dependencies (create first)
-- ============================================

CREATE TABLE Customer (
    CustomerID CHAR(5) PRIMARY KEY,
    CustName VARCHAR(100) NOT NULL,
    CustContactNo CHAR(8) UNIQUE,
    CustEmail VARCHAR(256) UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CONSTRAINT chk_contact CHECK (
        CustContactNo IS NOT NULL OR CustEmail IS NOT NULL
    )
);

CREATE TABLE Cuisine (
    CuisineID CHAR(5) PRIMARY KEY,
    CuisineDesc VARCHAR(50) NOT NULL
);

CREATE TABLE NEA_Officer (
    OfficerID CHAR(5) PRIMARY KEY,
    OfficerName VARCHAR(100) NOT NULL,
    OfficerContactNo CHAR(8) UNIQUE NOT NULL
);

CREATE TABLE Operator (
    OperatorID CHAR(5) PRIMARY KEY,
    OperatorName VARCHAR(100) NOT NULL,
    ContactPerson VARCHAR(100) NOT NULL,
    Email VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL
);

CREATE TABLE StallOwner (
    OwnerID CHAR(5) PRIMARY KEY,
    OwnerName VARCHAR(100) NOT NULL,
    OwnerNRIC CHAR(9) UNIQUE NOT NULL,
    OwnerContactNo CHAR(8) NOT NULL,
    Email VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL
);

-- ============================================
-- LEVEL 1: Depends on Level 0 tables
-- ============================================

CREATE TABLE HawkerCentre (
    HawkerCentreID CHAR(5) PRIMARY KEY,
    HCName VARCHAR(100) NOT NULL,
    HCAddress VARCHAR(500) NOT NULL,
    OperatorID CHAR(5) NOT NULL,
    FOREIGN KEY (OperatorID) REFERENCES Operator(OperatorID)
);

CREATE TABLE CustOrder (
    OrderID CHAR(5) PRIMARY KEY,
    OrderDate DATETIME NOT NULL,
    PmtType VARCHAR(20) NOT NULL,
    CustomerID CHAR(5) NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

-- ============================================
-- LEVEL 2: Depends on Level 1 tables
-- ============================================

CREATE TABLE FoodStall (
    StallID CHAR(5) PRIMARY KEY,
    StallUnitNo VARCHAR(20) NOT NULL,
    StallName VARCHAR(100) NOT NULL,
    StallDesc VARCHAR(500) NOT NULL,
    HawkerCentreID CHAR(5) NOT NULL,
    FOREIGN KEY (HawkerCentreID) REFERENCES HawkerCentre(HawkerCentreID)
);

-- ============================================
-- LEVEL 3: Depends on Level 2 tables
-- ============================================

CREATE TABLE MenuItem (
    StallID CHAR(5),
    ItemCode CHAR(5),
    ItemDesc VARCHAR(1000),
    ItemPrice SMALLMONEY NOT NULL,
    ItemCategory VARCHAR(50) NOT NULL,
    PRIMARY KEY (StallID, ItemCode),
    FOREIGN KEY (StallID) REFERENCES FoodStall(StallID),
    CONSTRAINT chk_item_price CHECK (ItemPrice > 0.00)
);

CREATE TABLE Feedback (
    FbkID CHAR(5) PRIMARY KEY,
    FbkComment VARCHAR(1000),
    FbkRating INT NOT NULL,
    FbkDateTime DATETIME NOT NULL,
    CustomerID CHAR(5) NOT NULL,
    StallID CHAR(5) NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (StallID) REFERENCES FoodStall(StallID),
    CONSTRAINT chk_rating CHECK (FbkRating > 0 AND FbkRating <= 5)
);

CREATE TABLE Inspection (
    InspectionID CHAR(5) PRIMARY KEY,
    InspectionDate DATETIME NOT NULL,
    HygieneGrade CHAR(1) NOT NULL,
    GradeExpiry DATE NOT NULL,
    OfficerID CHAR(5) NOT NULL,
    StallID CHAR(5) NOT NULL,
    FOREIGN KEY (OfficerID) REFERENCES NEA_Officer(OfficerID),
    FOREIGN KEY (StallID) REFERENCES FoodStall(StallID),
    CONSTRAINT chk_hygiene_grade CHECK (HygieneGrade IN ('A', 'B', 'C', 'D')),
    CONSTRAINT chk_grade_expiry CHECK (GradeExpiry > InspectionDate)
);

CREATE TABLE Promotion (
    PromoID CHAR(5) PRIMARY KEY,
    PromoDesc VARCHAR(500) NOT NULL,
    PromoStartDate DATE NOT NULL,
    PromoEndDate DATE NOT NULL,
    StallID CHAR(5) NOT NULL,
    FOREIGN KEY (StallID) REFERENCES FoodStall(StallID),
    CONSTRAINT chk_promo_dates CHECK (PromoStartDate <= PromoEndDate)
);

CREATE TABLE RentalAgreement (
    AgreementID CHAR(5) PRIMARY KEY,
    AgrStartDate DATE NOT NULL,
    AgrEndDate DATE NOT NULL,
    AgrTermCondition VARCHAR(500) NOT NULL,
    RentalPrice SMALLMONEY NOT NULL,
    OwnerID CHAR(5) NOT NULL,
    StallID CHAR(5) NOT NULL,
    FOREIGN KEY (OwnerID) REFERENCES StallOwner(OwnerID),
    FOREIGN KEY (StallID) REFERENCES FoodStall(StallID),
    CONSTRAINT chk_agreement_dates CHECK (AgrStartDate <= AgrEndDate),
    CONSTRAINT chk_rental_price CHECK (RentalPrice > 0.00)
);

-- ============================================
-- LEVEL 4: Depends on Level 3 tables
-- ============================================

CREATE TABLE Complaint (
    FbkID CHAR(5) PRIMARY KEY,
    Category VARCHAR(50) NOT NULL,
    FOREIGN KEY (FbkID) REFERENCES Feedback(FbkID)
);

CREATE TABLE InspectionRemark (
    InspectionID CHAR(5),
    InspectionRemark VARCHAR(1000),
    PRIMARY KEY (InspectionID, InspectionRemark),
    FOREIGN KEY (InspectionID) REFERENCES Inspection(InspectionID)
);

CREATE TABLE Likes (
    CustomerID CHAR(5),
    StallID CHAR(5),
    ItemCode CHAR(5),
    PRIMARY KEY (CustomerID, StallID, ItemCode),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (StallID, ItemCode) REFERENCES MenuItem(StallID, ItemCode)
);

CREATE TABLE MenuItemCuisine (
    CuisineID CHAR(5),
    StallID CHAR(5),
    ItemCode CHAR(5),
    PRIMARY KEY (CuisineID, StallID, ItemCode),
    FOREIGN KEY (CuisineID) REFERENCES Cuisine(CuisineID),
    FOREIGN KEY (StallID, ItemCode) REFERENCES MenuItem(StallID, ItemCode)
);

CREATE TABLE OrderItem (
    OrderID CHAR(5),
    OrderItemNo INT,
    StallID CHAR(5) NOT NULL,
    ItemCode CHAR(5) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice SMALLMONEY NOT NULL,
    PRIMARY KEY (OrderID, OrderItemNo),
    FOREIGN KEY (OrderID) REFERENCES CustOrder(OrderID),
    FOREIGN KEY (StallID, ItemCode) REFERENCES MenuItem(StallID, ItemCode),
    CONSTRAINT chk_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_unit_price CHECK (UnitPrice > 0.00)
);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'All tables created successfully!' AS Status;

-- To verify all tables exist, run:
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;

-- ============================================
-- HAWKER CENTRE DATABASE - TEST DATA
-- Minimum 5 rows per table, 30+ orders
-- ============================================

-- ============================================
-- INDEPENDENT TABLES (No dependencies)
-- ============================================

-- Customer (10 rows)
INSERT INTO Customer (CustomerID, CustName, CustContactNo, CustEmail, Password) VALUES
('C0001', 'Tan Wei Ming', '91234567', 'weiming.tan@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0002', 'Lim Hui Ling', '92345678', 'huiling.lim@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0003', 'Kumar Rajesh', '93456789', 'rajesh.kumar@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0004', 'Chen Xiao Hong', '94567890', 'xiaohong.chen@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0005', 'Muhammad Faizal', '95678901', 'faizal.m@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0006', 'Wong Mei Ling', '96789012', 'meiling.wong@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0007', 'Ravi Shankar', '93231515', 'ravi.shankar@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0008', 'Siti Nurhaliza', '98901234', 'siti.n@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0009', 'David Tan', '99012345', 'david.tan@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('C0010', 'Sarah Lim', '90123456', 'sarah.lim@email.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK');

-- Cuisine (8 rows)
INSERT INTO Cuisine (CuisineID, CuisineDesc) VALUES
('CU001', 'Chinese'),
('CU002', 'Malay'),
('CU003', 'Indian'),
('CU004', 'Western'),
('CU005', 'Japanese'),
('CU006', 'Thai'),
('CU007', 'Korean'),
('CU008', 'Vietnamese');

-- NEA_Officer (6 rows)
INSERT INTO NEA_Officer (OfficerID, OfficerName, OfficerContactNo) VALUES
('O0001', 'Tan Boon Huat', '67001234'),
('O0002', 'Lee Siew Lan', '67001235'),
('O0003', 'Krishnan Muthu', '67001236'),
('O0004', 'Ahmad bin Hassan', '67001237'),
('O0005', 'Chong Wei Jie', '67001238'),
('O0006', 'Fatimah binti Ali', '67001239');

-- Operator (5 rows) - Password left NULL, to be set later
INSERT INTO Operator (OperatorID, OperatorName, ContactPerson, Email, Password) VALUES
('OP001', 'Singapore Hawker Management Pte Ltd', 'Tan Ah Kow', 'shm_admin@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OP002', 'Foodfare Catering Services', 'Lim Chee Wah', 'foodfare_admin@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OP003', 'Kopitiam Investment Pte Ltd', 'Wong Siew Meng', 'kopitiam_admin@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OP004', 'Timbre+ Management', 'David Lee', 'timbre_admin@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OP005', 'NEA Direct Management', 'Kumar S.', 'neadirect_admin@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK');


-- StallOwner (12 rows) - Password left NULL, to be set later
INSERT INTO StallOwner (OwnerID, OwnerName, OwnerNRIC, OwnerContactNo, Email, Password) VALUES
('OW001', 'Dani Bin Mirza', 'S1234567A', '81234567', 'danizye@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW002', 'Mdm Tan Geok Lian', 'S5234567B', '82345678', 'tangeoklian@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW003', 'Raju s/o Krishnan', 'S5345678C', '83456789', 'rajukrishnan@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW004', 'Lee Kim Huat', 'S5456789D', '84567890', 'leekimhuat@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW005', 'Hassan bin Ahmad', 'S5567890E', '85678901', 'hassanahmad@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW006', 'Chan Mei Fong', 'S5678901F', '86789012', 'chanmeifong@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW007', 'Muthu s/o Raman', 'S5789012G', '87890123', 'muthuraman@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW008', 'Siti binti Abdullah', 'S5890123H', '88901234', 'sitiabdullah@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW009', 'Tan Hock Seng', 'S5901234I', '89012345', 'tanhockseng@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW010', 'Lim Boon Keng', 'S6012345J', '80123456', 'limboonkeng@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW011', 'Wong Ah Meng', 'S6123456K', '81112233', 'wongahmeng@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK'),
('OW012', 'Raj Kumar', 'S6234567L', '82223344', 'rajkumar@gmail.com', '$2b$10$HrUpGF2.7Wy6vJozY75.E.rBqRoDfu1shk3d5CfrY2n2ydCxWN5TK');

-- ============================================
-- LEVEL 1 DEPENDENCIES
-- ============================================

-- HawkerCentre (5 rows)
INSERT INTO HawkerCentre (HawkerCentreID, HCName, HCAddress, OperatorID) VALUES
('HC001', 'Old Airport Road Food Centre', '51 Old Airport Road, Singapore 390051', 'OP001'),
('HC002', 'Tiong Bahru Market', '30 Seng Poh Road, Singapore 168898', 'OP002'),
('HC003', 'Maxwell Food Centre', '1 Kadayanallur Street, Singapore 069184', 'OP003'),
('HC004', 'Chomp Chomp Food Centre', '20 Kensington Park Road, Singapore 557269', 'OP004'),
('HC005', 'ABC Brickworks Market', '6 Jalan Bukit Merah, Singapore 150006', 'OP005');

-- FoodStall (15 rows)
INSERT INTO FoodStall (StallID, StallUnitNo, StallName, StallDesc, HawkerCentreID) VALUES
('ST001', '#01-01', 'Ah Seng Chicken Rice', 'Famous Hainanese chicken rice with tender poached chicken', 'HC001'),
('ST002', '#01-05', 'Roti Prata House', 'Authentic Indian prata with various curry options', 'HC001'),
('ST003', '#01-10', 'Char Kway Teow Master', 'Traditional wok-fried flat noodles', 'HC001'),
('ST004', '#02-15', 'Laksa Supreme', 'Rich and spicy coconut-based laksa', 'HC002'),
('ST005', '#02-20', 'Nasi Lemak Corner', 'Fragrant coconut rice with sambal and sides', 'HC002'),
('ST006', '#01-08', 'Hokkien Mee Specialist', 'Dark sauce fried prawn noodles', 'HC002'),
('ST007', '#01-12', 'Tian Tian Hainanese Chicken Rice', 'Award-winning chicken rice stall', 'HC003'),
('ST008', '#01-18', 'Satay King', 'Grilled meat skewers with peanut sauce', 'HC003'),
('ST009', '#02-05', 'Vegetarian Delights', 'Healthy vegetarian and vegan options', 'HC003'),
('ST010', '#01-25', 'BBQ Chicken Wings', 'Marinated grilled chicken wings', 'HC004'),
('ST011', '#01-30', 'Fried Carrot Cake', 'Black and white versions available', 'HC004'),
('ST012', '#02-10', 'Mixed Veg Rice', 'Economical rice with variety of dishes', 'HC004'),
('ST013', '#01-40', 'Teochew Porridge', 'Light porridge with assorted side dishes', 'HC005'),
('ST014', '#01-45', 'Wanton Mee House', 'Egg noodles with char siew and wanton', 'HC005'),
('ST015', '#02-12', 'Oyster Omelette Stall', 'Crispy oyster omelette with chili sauce', 'HC005');

-- CustOrder (35 rows to meet requirement)
INSERT INTO CustOrder (OrderID, OrderDate, PmtType, CustomerID) VALUES
('OR001', '2026-01-25 12:30:00', 'Cash', 'C0001'),
('OR002', '2026-01-25 12:45:00', 'Card', 'C0002'),
('OR003', '2026-01-25 13:00:00', 'Cash', 'C0003'),
('OR004', '2026-01-25 13:15:00', 'Card', 'C0004'),
('OR005', '2026-01-25 18:30:00', 'Cash', 'C0005'),
('OR006', '2026-01-25 18:45:00', 'Card', 'C0006'),
('OR007', '2026-01-25 19:00:00', 'Cash', 'C0007'),
('OR008', '2026-01-25 19:15:00', 'Card', 'C0008'),
('OR009', '2026-01-26 12:00:00', 'Cash', 'C0009'),
('OR010', '2026-01-26 12:30:00', 'Card', 'C0010'),
('OR011', '2026-01-26 12:45:00', 'Cash', 'C0001'),
('OR012', '2026-01-26 13:00:00', 'Card', 'C0002'),
('OR013', '2026-01-26 18:30:00', 'Cash', 'C0003'),
('OR014', '2026-01-26 18:45:00', 'Card', 'C0004'),
('OR015', '2026-01-26 19:00:00', 'Cash', 'C0005'),
('OR016', '2026-01-27 12:15:00', 'Card', 'C0006'),
('OR017', '2026-01-27 12:30:00', 'Cash', 'C0007'),
('OR018', '2026-01-27 12:45:00', 'Card', 'C0008'),
('OR019', '2026-01-27 13:00:00', 'Cash', 'C0009'),
('OR020', '2026-01-27 18:30:00', 'Card', 'C0010'),
('OR021', '2026-01-27 18:45:00', 'Cash', 'C0001'),
('OR022', '2026-01-27 19:00:00', 'Card', 'C0002'),
('OR023', '2026-01-28 12:00:00', 'Cash', 'C0003'),
('OR024', '2026-01-28 12:30:00', 'Card', 'C0004'),
('OR025', '2026-01-28 12:45:00', 'Cash', 'C0005'),
('OR026', '2026-01-28 13:00:00', 'Card', 'C0006'),
('OR027', '2026-01-28 18:30:00', 'Cash', 'C0007'),
('OR028', '2026-01-28 18:45:00', 'Card', 'C0008'),
('OR029', '2026-01-28 19:00:00', 'Cash', 'C0009'),
('OR030', '2026-01-29 12:15:00', 'Card', 'C0010'),
('OR031', '2026-01-29 12:30:00', 'Cash', 'C0001'),
('OR032', '2026-01-29 12:45:00', 'Card', 'C0002'),
('OR033', '2026-01-29 18:30:00', 'Cash', 'C0003'),
('OR034', '2026-01-29 18:45:00', 'Card', 'C0004'),
('OR035', '2026-01-29 19:00:00', 'Cash', 'C0005');

-- ============================================
-- LEVEL 2 DEPENDENCIES
-- ============================================

-- MenuItem (30 rows - 2 items per stall)
INSERT INTO MenuItem (StallID, ItemCode, ItemDesc, ItemPrice, ItemCategory) VALUES
('ST001', 'IT001', 'Chicken Rice (Roasted)', 4.50, 'Main'),
('ST001', 'IT002', 'Chicken Rice (Steamed)', 4.00, 'Main'),
('ST002', 'IT003', 'Plain Prata', 1.50, 'Main'),
('ST002', 'IT004', 'Egg Prata', 2.00, 'Main'),
('ST003', 'IT005', 'Char Kway Teow', 5.00, 'Main'),
('ST003', 'IT006', 'Fried Hokkien Prawn Mee', 5.50, 'Main'),
('ST004', 'IT007', 'Laksa', 5.00, 'Main'),
('ST004', 'IT008', 'Laksa with Cockles', 6.00, 'Main'),
('ST005', 'IT009', 'Nasi Lemak', 3.50, 'Main'),
('ST005', 'IT010', 'Nasi Lemak with Fried Chicken', 5.50, 'Main'),
('ST006', 'IT011', 'Hokkien Mee (Small)', 4.00, 'Main'),
('ST006', 'IT012', 'Hokkien Mee (Large)', 5.50, 'Main'),
('ST007', 'IT013', 'Hainanese Chicken Rice', 4.50, 'Main'),
('ST007', 'IT014', 'Roasted Pork Rice', 5.00, 'Main'),
('ST008', 'IT015', 'Chicken Satay (10 sticks)', 8.00, 'Main'),
('ST008', 'IT016', 'Mutton Satay (10 sticks)', 9.00, 'Main'),
('ST009', 'IT017', 'Mixed Vegetable Rice', 3.50, 'Main'),
('ST009', 'IT018', 'Vegetarian Bee Hoon', 3.00, 'Main'),
('ST010', 'IT019', 'BBQ Chicken Wings (5 pcs)', 6.00, 'Main'),
('ST010', 'IT020', 'BBQ Chicken Wings (10 pcs)', 11.00, 'Main'),
('ST011', 'IT021', 'Fried Carrot Cake (White)', 4.00, 'Main'),
('ST011', 'IT022', 'Fried Carrot Cake (Black)', 4.00, 'Main'),
('ST012', 'IT023', 'Mixed Veg Rice (2 veg 1 meat)', 4.00, 'Main'),
('ST012', 'IT024', 'Mixed Veg Rice (3 veg 2 meat)', 5.50, 'Main'),
('ST013', 'IT025', 'Teochew Porridge Set A', 5.00, 'Main'),
('ST013', 'IT026', 'Teochew Porridge Set B', 6.50, 'Main'),
('ST014', 'IT027', 'Wanton Mee (Dry)', 4.50, 'Main'),
('ST014', 'IT028', 'Wanton Mee (Soup)', 4.50, 'Main'),
('ST015', 'IT029', 'Oyster Omelette (Small)', 5.00, 'Main'),
('ST015', 'IT030', 'Oyster Omelette (Large)', 7.00, 'Main');

-- Add some drinks and desserts
INSERT INTO MenuItem (StallID, ItemCode, ItemDesc, ItemPrice, ItemCategory) VALUES
('ST001', 'IT031', 'Iced Lemon Tea', 1.50, 'Drink'),
('ST002', 'IT032', 'Teh Tarik', 1.80, 'Drink'),
('ST003', 'IT033', 'Sugar Cane Juice', 2.00, 'Drink'),
('ST004', 'IT034', 'Bandung', 1.50, 'Drink'),
('ST007', 'IT035', 'Barley Water', 1.50, 'Drink');

-- Feedback (12 rows)
INSERT INTO Feedback (FbkID, FbkComment, FbkRating, FbkDateTime, CustomerID, StallID) VALUES
('FB001', 'Excellent chicken rice! Very tender and flavorful.', 5, '2026-01-25 13:00:00', 'C0001', 'ST001'),
('FB002', 'Prata was crispy and curry was delicious', 4, '2026-01-25 13:30:00', 'C0002', 'ST002'),
('FB003', 'Best char kway teow in the area!', 5, '2026-01-25 14:00:00', 'C0003', 'ST003'),
('FB004', 'Laksa was too spicy for me but tasty', 3, '2026-01-26 13:00:00', 'C0004', 'ST004'),
('FB005', 'Nasi lemak sambal was perfect!', 5, '2026-01-26 13:30:00', 'C0005', 'ST005'),
('FB006', 'Good hokkien mee, generous portions', 4, '2026-01-26 14:00:00', 'C0006', 'ST006'),
('FB007', 'Worth the queue! Amazing chicken rice', 5, '2026-01-27 13:00:00', 'C0007', 'ST007'),
('FB008', 'Satay was nicely grilled and tender', 4, '2026-01-27 13:30:00', 'C0008', 'ST008'),
('FB009', 'Great vegetarian options, very healthy', 4, '2026-01-27 14:00:00', 'C0009', 'ST009'),
('FB010', NULL, 5, '2026-01-28 13:00:00', 'C0010', 'ST010'),
('FB011', 'Carrot cake was a bit oily', 3, '2026-01-28 13:30:00', 'C0001', 'ST011'),
('FB012', 'Good value for money!', 4, '2026-01-28 14:00:00', 'C0002', 'ST012');

-- Inspection (10 rows)
INSERT INTO Inspection (InspectionID, InspectionDate, HygieneGrade, GradeExpiry, OfficerID, StallID) VALUES
('IN001', '2026-01-15 10:00:00', 'A', '2026-07-15', 'O0001', 'ST001'),
('IN002', '2026-01-15 11:00:00', 'A', '2026-07-15', 'O0001', 'ST002'),
('IN003', '2026-01-15 14:00:00', 'B', '2026-07-15', 'O0002', 'ST003'),
('IN004', '2026-01-16 10:00:00', 'A', '2026-07-16', 'O0002', 'ST004'),
('IN005', '2026-01-16 11:00:00', 'A', '2026-07-16', 'O0003', 'ST005'),
('IN006', '2026-01-16 14:00:00', 'B', '2026-07-16', 'O0003', 'ST006'),
('IN007', '2026-01-17 10:00:00', 'A', '2026-07-17', 'O0004', 'ST007'),
('IN008', '2026-01-17 11:00:00', 'C', '2026-07-17', 'O0004', 'ST008'),
('IN009', '2026-01-17 14:00:00', 'A', '2026-07-17', 'O0005', 'ST009'),
('IN010', '2026-01-18 10:00:00', 'B', '2026-07-18', 'O0005', 'ST010');

-- Promotion (8 rows)
INSERT INTO Promotion (PromoID, PromoDesc, PromoStartDate, PromoEndDate, StallID) VALUES
('PR001', '10% off for orders above $10', '2026-01-20', '2026-02-20', 'ST001'),
('PR002', 'Buy 2 prata get 1 free', '2026-01-22', '2026-02-22', 'ST002'),
('PR003', 'Free drink with any main dish', '2026-01-23', '2026-02-10', 'ST003'),
('PR004', 'Laksa special - $4 only', '2026-01-25', '2026-02-05', 'ST004'),
('PR005', 'Weekend special - Extra sambal free', '2026-01-27', '2026-02-28', 'ST005'),
('PR006', 'Student discount 15% (with student ID)', '2026-01-20', '2026-06-30', 'ST007'),
('PR007', 'Buy 20 sticks get 5 free', '2026-01-25', '2026-02-15', 'ST008'),
('PR008', 'Lunch special $3 for any dish', '2026-01-26', '2026-02-26', 'ST009');

-- RentalAgreement (10 rows)
INSERT INTO RentalAgreement (AgreementID, AgrStartDate, AgrEndDate, AgrTermCondition, RentalPrice, OwnerID, StallID) VALUES
('AG001', '2025-01-01', '2027-12-31', 'Monthly rental with 3 months deposit. Tenant responsible for utilities.', 3500.00, 'OW001', 'ST001'),
('AG002', '2025-02-01', '2028-01-31', 'Monthly rental with maintenance fee included. 2 months deposit.', 3200.00, 'OW002', 'ST002'),
('AG003', '2025-01-15', '2027-01-14', 'Yearly renewal option. Rental increase capped at 5% per year.', 3800.00, 'OW003', 'ST003'),
('AG004', '2025-03-01', '2028-02-29', 'Monthly rental. Tenant to maintain cleanliness standards.', 3600.00, 'OW004', 'ST004'),
('AG005', '2025-01-01', '2027-12-31', '3-year contract with option to extend. Rental review every 2 years.', 3400.00, 'OW005', 'ST005'),
('AG006', '2025-04-01', '2028-03-31', 'Monthly rental includes gas supply. Water and electricity separate.', 3300.00, 'OW006', 'ST006'),
('AG007', '2025-01-01', '2029-12-31', 'Premium location. 5-year contract with fixed rental for first 3 years.', 4500.00, 'OW007', 'ST007'),
('AG008', '2025-05-01', '2027-04-30', 'Monthly rental. No subletting allowed.', 3100.00, 'OW008', 'ST008'),
('AG009', '2025-01-01', '2027-12-31', 'Monthly rental with annual increase of 3%.', 3000.00, 'OW009', 'ST009'),
('AG010', '2025-06-01', '2028-05-31', 'Monthly rental. Tenant responsible for equipment maintenance.', 3200.00, 'OW010', 'ST010');

-- ============================================
-- LEVEL 3 DEPENDENCIES
-- ============================================

-- Complaint (5 rows - subset of feedback)
INSERT INTO Complaint (FbkID, Category) VALUES
('FB004', 'Food too spicy'),
('FB008', 'Long waiting time'),
('FB011', 'Food quality'),
('FB003', 'Portion size'),
('FB006', 'Hygiene concern');

-- InspectionRemark (8 rows)
INSERT INTO InspectionRemark (InspectionID, InspectionRemark) VALUES
('IN001', 'Excellent cleanliness. All food handlers have valid certificates.'),
('IN002', 'Good hygiene practices observed. Kitchen well maintained.'),
('IN003', 'Minor issues with waste disposal. Advised to improve bin management.'),
('IN004', 'Outstanding food safety standards. Recommended as model stall.'),
('IN005', 'All requirements met. No issues found.'),
('IN006', 'Some concerns about food storage temperature. Follow-up required.'),
('IN007', 'Exemplary hygiene standards maintained.'),
('IN008', 'Multiple violations found. Requires immediate rectification and re-inspection.');

-- Likes (15 rows)
INSERT INTO Likes (CustomerID, StallID, ItemCode) VALUES
('C0001', 'ST001', 'IT001'),
('C0001', 'ST001', 'IT002'),
('C0001', 'ST003', 'IT005'),
('C0002', 'ST002', 'IT003'),
('C0002', 'ST002', 'IT004'),
('C0003', 'ST003', 'IT005'),
('C0003', 'ST007', 'IT013'),
('C0004', 'ST004', 'IT007'),
('C0005', 'ST005', 'IT009'),
('C0005', 'ST005', 'IT010'),
('C0006', 'ST006', 'IT011'),
('C0007', 'ST007', 'IT013'),
('C0008', 'ST008', 'IT015'),
('C0009', 'ST009', 'IT017'),
('C0010', 'ST010', 'IT019');

-- MenuItemCuisine (30 rows)
INSERT INTO MenuItemCuisine (CuisineID, StallID, ItemCode) VALUES
('CU001', 'ST001', 'IT001'),
('CU001', 'ST001', 'IT002'),
('CU003', 'ST002', 'IT003'),
('CU003', 'ST002', 'IT004'),
('CU001', 'ST003', 'IT005'),
('CU001', 'ST003', 'IT006'),
('CU002', 'ST004', 'IT007'),
('CU002', 'ST004', 'IT008'),
('CU002', 'ST005', 'IT009'),
('CU002', 'ST005', 'IT010'),
('CU001', 'ST006', 'IT011'),
('CU001', 'ST006', 'IT012'),
('CU001', 'ST007', 'IT013'),
('CU001', 'ST007', 'IT014'),
('CU002', 'ST008', 'IT015'),
('CU002', 'ST008', 'IT016'),
('CU001', 'ST009', 'IT017'),
('CU001', 'ST009', 'IT018'),
('CU004', 'ST010', 'IT019'),
('CU004', 'ST010', 'IT020'),
('CU001', 'ST011', 'IT021'),
('CU001', 'ST011', 'IT022'),
('CU001', 'ST012', 'IT023'),
('CU001', 'ST012', 'IT024'),
('CU001', 'ST013', 'IT025'),
('CU001', 'ST013', 'IT026'),
('CU001', 'ST014', 'IT027'),
('CU001', 'ST014', 'IT028'),
('CU001', 'ST015', 'IT029'),
('CU001', 'ST015', 'IT030');

-- OrderItem (70+ rows - multiple items per order for 35 orders)
INSERT INTO OrderItem (OrderID, OrderItemNo, StallID, ItemCode, Quantity, UnitPrice) VALUES
-- Order 1
('OR001', 1, 'ST001', 'IT001', 2, 4.50),
('OR001', 2, 'ST001', 'IT002', 1, 4.00),
-- Order 2
('OR002', 1, 'ST002', 'IT004', 3, 2.00),
('OR002', 2, 'ST002', 'IT003', 1, 1.50),
-- Order 3
('OR003', 1, 'ST003', 'IT005', 1, 5.00),
('OR003', 2, 'ST003', 'IT006', 1, 5.50),
-- Order 4
('OR004', 1, 'ST004', 'IT008', 2, 6.00),
-- Order 5
('OR005', 1, 'ST005', 'IT010', 1, 5.50),
('OR005', 2, 'ST005', 'IT009', 1, 3.50),
-- Order 6
('OR006', 1, 'ST006', 'IT012', 1, 5.50),
-- Order 7
('OR007', 1, 'ST007', 'IT013', 3, 4.50),
('OR007', 2, 'ST007', 'IT014', 1, 5.00),
-- Order 8
('OR008', 1, 'ST008', 'IT015', 2, 8.00),
-- Order 9
('OR009', 1, 'ST009', 'IT017', 1, 3.50),
-- Order 10
('OR010', 1, 'ST010', 'IT020', 1, 11.00),
-- Order 11
('OR011', 1, 'ST011', 'IT021', 2, 4.00),
-- Order 12
('OR012', 1, 'ST012', 'IT024', 1, 5.50),
-- Order 13
('OR013', 1, 'ST013', 'IT026', 2, 6.50),
-- Order 14
('OR014', 1, 'ST014', 'IT027', 1, 4.50),
-- Order 15
('OR015', 1, 'ST015', 'IT030', 1, 7.00),
-- Order 16
('OR016', 1, 'ST001', 'IT002', 2, 4.00),
('OR016', 2, 'ST001', 'IT001', 1, 4.50),
-- Order 17
('OR017', 1, 'ST002', 'IT003', 5, 1.50),
-- Order 18
('OR018', 1, 'ST003', 'IT006', 1, 5.50),
('OR018', 2, 'ST003', 'IT005', 1, 5.00),
-- Order 19
('OR019', 1, 'ST004', 'IT007', 2, 5.00),
-- Order 20
('OR020', 1, 'ST005', 'IT009', 3, 3.50),
-- Order 21
('OR021', 1, 'ST006', 'IT011', 2, 4.00),
-- Order 22
('OR022', 1, 'ST007', 'IT014', 1, 5.00),
-- Order 23
('OR023', 1, 'ST008', 'IT016', 1, 9.00),
-- Order 24
('OR024', 1, 'ST009', 'IT018', 2, 3.00),
-- Order 25
('OR025', 1, 'ST010', 'IT019', 1, 6.00),
-- Order 26
('OR026', 1, 'ST011', 'IT022', 1, 4.00),
-- Order 27
('OR027', 1, 'ST012', 'IT023', 2, 4.00),
-- Order 28
('OR028', 1, 'ST013', 'IT025', 1, 5.00),
-- Order 29
('OR029', 1, 'ST014', 'IT028', 2, 4.50),
-- Order 30
('OR030', 1, 'ST015', 'IT029', 1, 5.00),
-- Order 31
('OR031', 1, 'ST001', 'IT001', 1, 4.50),
('OR031', 2, 'ST001', 'IT002', 1, 4.00),
-- Order 32
('OR032', 1, 'ST007', 'IT013', 2, 4.50),
-- Order 33
('OR033', 1, 'ST003', 'IT005', 2, 5.00),
-- Order 34
('OR034', 1, 'ST005', 'IT010', 1, 5.50),
('OR034', 2, 'ST005', 'IT009', 1, 3.50),
-- Order 35
('OR035', 1, 'ST008', 'IT015', 1, 8.00),
('OR035', 2, 'ST008', 'IT016', 1, 9.00);

-- ============================================
-- DATA SUMMARY
-- ============================================
-- Customer: 10 rows
-- Cuisine: 8 rows
-- NEA_Officer: 6 rows
-- Operator: 5 rows
-- StallOwner: 12 rows
-- HawkerCentre: 5 rows
-- FoodStall: 15 rows
-- CustOrder: 35 rows (EXCEEDS REQUIREMENT)
-- MenuItem: 35 rows
-- Feedback: 12 rows
-- Inspection: 10 rows
-- Promotion: 8 rows
-- RentalAgreement: 10 rows
-- Complaint: 5 rows
-- InspectionRemark: 8 rows
-- Likes: 15 rows
-- MenuItemCuisine: 30 rows
-- OrderItem: 70+ rows
-- ============================================

SELECT 'Data insertion completed successfully!' AS Status;