# Tool Risk Assessment Application

## Overview
This application provides a structured method for assessing the risk associated with software tools and applications. It evaluates both inherent and residual risk based on configurable scoring logic and threat modeling.

## Features
- Multi-step assessment workflow
- Weighted probability and impact scoring
- Threat-based risk modeling
- Residual risk calculation based on control effectiveness
- Detailed explanation ("Why") for each risk
- Printable report output

## Technology Stack
- Next.js (React, TypeScript)
- Tailwind CSS
- SurveyJS
- JSON-based configuration for scoring and threats

## How It Works
Users complete a guided survey capturing:
- Tool characteristics
- Access and exposure details
- Security controls

The application then:
1. Calculates inherent risk
2. Applies control adjustments
3. Produces residual risk scores
4. Generates explanations for each threat

## Deployment
This application is deployed using Vercel and is accessible at:

https://tool-risk-assessment.vercel.app/

## Purpose
This project was developed as part of a graduate-level cybersecurity program to demonstrate risk assessment modeling and secure application design principles.
