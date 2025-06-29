# Example Data for Testing Rules

## Sample Clients CSV:
```
ClientID,Name,Email,Department
CLI001,Acme Corp,acme@email.com,Technology
CLI002,TechStart,tech@email.com,Technology
CLI003,Global Inc,global@email.com,Finance
```

## Sample Workers CSV:
```
WorkerID,Name,Email,Department,Position
WRK001,John Smith,john@company.com,Technology,Developer
WRK002,Jane Doe,jane@company.com,Technology,Designer
WRK003,Bob Wilson,bob@company.com,Finance,Analyst
WRK004,Alice Brown,alice@company.com,Technology,Manager
```

## Sample Tasks CSV:
```
TaskID,Title,Description,ClientID,WorkerID,Priority,DueDate
TASK001,Website Redesign,Redesign company website,CLI001,WRK001,High,2024-02-15
TASK002,Database Migration,Migrate to new database,CLI001,WRK002,Medium,2024-02-20
TASK003,Financial Report,Prepare Q4 report,CLI003,WRK003,High,2024-02-10
TASK004,API Development,Develop new API,CLI002,WRK001,Medium,2024-02-25
TASK005,UI Testing,Test user interface,CLI002,WRK002,Low,2024-02-28
```

## How to Use This Data:
1. Save each section as a separate CSV file
2. Upload them in the Upload section
3. Then go to Rules section to create business rules 