# AI-Powered Workforce Analytics & Talent Intelligence Dashboard

##  Project Statement

The **AI-Powered Workforce Analytics & Talent Intelligence Dashboard** is an enterprise-scale analytics platform built on **Amazon Web Services (AWS)**. It enables organizations to gain actionable insights into workforce performance, employee engagement, talent development, diversity, recruitment effectiveness, attrition risk, and overall organizational health.

The platform leverages **Amazon Bedrock (LLMs)**, **Retrieval-Augmented Generation (RAG)**, **Amazon SageMaker**, and predictive analytics to transform workforce data into strategic business intelligence. By automating real-time analytics and conversational AI, the solution empowers HR leaders to make informed, data-driven decisions.

---

#  Project Outcomes

- Workforce performance and organizational health monitoring
- Employee attrition prediction with proactive retention strategies
- Skill gap identification and learning recommendations
- Diversity, Equity & Inclusion (DEI) analytics
- Recruitment performance analysis
- AI-powered workforce planning recommendations
- Natural language interaction through an AI assistant

---

#  Solution Architecture
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/a0654d77-264c-4462-9cfd-5bac972fe4bd" />



#  Workflow

## Step 1 – Data Ingestion

Collect workforce data from multiple enterprise sources.

### Tasks

- Export Snowflake data into Amazon S3
- Extract Oracle HCM data using AWS Glue
- Fetch external APIs using AWS Lambda
- Store raw datasets in Amazon S3

### Technologies

- Snowflake
- Oracle HCM
- Amazon S3
- AWS Glue
- AWS Lambda
- Amazon EventBridge

---

## Step 2 – Workflow Orchestration

Automate the ETL pipeline using Apache Airflow.

### Responsibilities

- Schedule workflows
- Execute ETL jobs
- Refresh AI models
- Retry failed workflows
- Monitor pipeline execution

### Technology

- Amazon MWAA (Apache Airflow)

---

## Step 3 – Data Storage & Transformation

Create an analytics-ready Data Lake.

### Tasks

- Store raw datasets
- Bronze, Silver & Gold architecture
- Data cleansing
- Validation
- Feature engineering
- SQL transformations

### Technologies

- Amazon S3
- AWS Glue ETL
- AWS Glue Data Catalog

---

## Step 4 – AI & Analytics

Generate workforce intelligence using AI.

### AI Models

- Employee Attrition Prediction
- Skill Gap Analysis
- Workforce Health Score
- Recruitment Analytics
- Diversity Metrics
- Learning Recommendations

### AI Pipeline

- Generate embeddings using Amazon Titan Embeddings
- Store vectors in OpenSearch
- Query through Amazon Bedrock
- Retrieval-Augmented Generation (RAG)

### Technologies

- Amazon SageMaker
- Amazon Bedrock
- Amazon Titan Embeddings
- Amazon OpenSearch Vector Engine
- RAG

---

## Step 5 – Frontend

Provide interactive workforce dashboards.

### Dashboard Modules

- Attrition Analytics
- Recruitment Analytics
- Diversity Dashboard
- Workforce Health
- Learning Analytics
- AI Chat Assistant

### Technologies

- React.js / Next.js
- Amazon API Gateway
- AWS Lambda
- Amazon Bedrock APIs

---

## Step 6 – Security & Governance

Secure enterprise HR data.

### Features

- User Authentication
- Role-Based Access Control
- Secrets Management
- Data Encryption
- Audit Logging
- Metadata Management

### Technologies

- AWS IAM
- AWS Secrets Manager
- AWS Lake Formation
- AWS Glue Data Catalog
- Amazon CloudWatch
- AWS CloudTrail
- AWS KMS

---

## Step 7 – End Users

The platform is designed for:

- HR Managers
- Business Leaders
- Executives

Users can:

- Monitor workforce KPIs
- Query the AI assistant
- Analyze organizational trends
- Receive AI-generated recommendations
- Support strategic workforce planning

---

#  Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Cloud Platform** | Amazon Web Services (AWS) |
| **Programming Language** | Python |
| **Frontend** | React.js / Next.js |
| **Data Sources** | Snowflake, Oracle HCM, External APIs |
| **Data Lake** | Amazon S3 |
| **Workflow Orchestration** | Amazon MWAA (Apache Airflow) |
| **ETL** | AWS Glue |
| **AI / ML** | Amazon SageMaker |
| **LLM** | Amazon Bedrock |
| **Embeddings** | Amazon Titan Embeddings |
| **Vector Database** | Amazon OpenSearch Serverless |
| **AI Framework** | Retrieval-Augmented Generation (RAG) |
| **Security** | IAM, KMS, Secrets Manager, Lake Formation |
| **Monitoring** | CloudWatch, CloudTrail |

---

#  Key Features

- AI-powered Workforce Analytics
- Predictive Attrition Analysis
- Skill Gap Detection
- Workforce Health Score
- Diversity & Inclusion Analytics
- Recruitment Insights
- Enterprise Data Lake
- Conversational AI Assistant
- Secure AWS Architecture
- Real-time Dashboard

---

#  License

This project was developed for educational and learning purposes.
