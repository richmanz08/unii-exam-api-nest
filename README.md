# UNII Exam API - Stock Management System

NestJS TypeScript API สำหรับจัดการข้อมูลสต็อกสินค้า

## � Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start Docker Services (Redis + PostgreSQL)

```bash
docker-compose up -d
```

**ตรวจสอบว่า services กำลัง running:**

```bash
docker-compose ps
```

### 3. Run Development Server

```bash
yarn start:dev
```

Server จะเริ่ม at `http://localhost:3000`

## 📚 API Endpoints

### Stock Summary Report

```
GET /report/stock-summary
```

**Parameters (Optional):**

- `startOrderFinishDate`: YYYY-MM-DD
- `endOrderFinishDate`: YYYY-MM-DD
- `categoryId`: comma-separated (e.g., "01,05")
- `subCategoryId`: comma-separated (e.g., "0101,0501")
- `orderId`: single value
- `priceMin`: number
- `priceMax`: number
- `grade`: comma-separated (e.g., "A,B,C")

**Example:**

### Category List

```
GET /category/list
```

```
POST /category/sync
```

### Distinct Grades

```
GET /order/grades
```

```
GET /order/sync
```

## 📦 Available Commands

```bash
# Development
yarn start:dev

yarn start


---

## 🔧 Technology Stack

- **NestJS** 9.x - Backend Framework
- **TypeScript** - Type Safety
- **Redis** 7.x - Caching
- **PostgreSQL** 15.x - Database
- **Yarn** - Package Manager
```
