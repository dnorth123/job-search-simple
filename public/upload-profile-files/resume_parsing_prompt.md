# Resume Parsing Instructions for Profile Data Population

## OBJECTIVE
Parse the uploaded resume and populate the profile-data schema with extracted information. Focus on accuracy, professional context, and strategic career intelligence.

## PARSING INSTRUCTIONS

### 1. PERSONAL INFORMATION EXTRACTION
- Extract name, contact details, location from resume header
- Identify LinkedIn, portfolio, GitHub URLs from contact section
- Determine remote work preference from location context or explicit statements

### 2. PROFESSIONAL PROFILE ANALYSIS
- **Current Title**: Extract most recent job title
- **Target Title**: Infer from resume positioning or stated objectives
- **Professional Summary**: Extract or synthesize from summary/objective sections
- **Years Experience**: Calculate from employment history
- **Career Level**: Determine based on titles and responsibilities (entry, mid, senior, director, vp, c-suite)
- **Industry Category**: Identify primary industry from experience pattern
- **Functional Area**: Determine core function (engineering, marketing, operations, strategy, etc.)

### 3. EXPERIENCE PARSING
For each role, extract:
- Company name, job title, dates (start/end)
- Location and current role status
- Detailed descriptions and key achievements
- Technologies, tools, or methodologies mentioned
- Team size or budget managed (if mentioned)
- Quantified accomplishments and impact metrics

### 4. EDUCATION & CREDENTIALS
- Institution names, degrees, fields of study
- Graduation years, GPA (if listed), honors/distinctions
- Relevant coursework, projects, or academic achievements

### 5. SKILLS CATEGORIZATION
Organize skills into:
- **Technical Skills**: Programming languages, software, tools, platforms
- **Soft Skills**: Communication, leadership, problem-solving, etc.
- **Leadership Skills**: Management, strategic planning, team development
- **Domain Expertise**: Industry-specific knowledge and specializations
- **Certifications**: Professional credentials, licenses, continuing education
- **Languages**: Spoken languages and proficiency levels

### 6. STRATEGIC COMPETENCY ASSESSMENT
Based on resume content, estimate (1-100 scale):
- **Strategic Leadership**: Evidence of vision, planning, strategic thinking
- **Domain Expertise**: Depth of industry/functional knowledge
- **Execution Impact**: Track record of delivery and results
- **Market Positioning**: Industry recognition, thought leadership indicators

### 7. COMPENSATION & PREFERENCES INFERENCE
- **Current Salary**: Do not estimate unless explicitly stated
- **Target Range**: Only if mentioned in objective or cover letter
- **Company Size Preference**: Infer from employment history pattern
- **Industry Preferences**: Based on career trajectory
- **Remote Policy**: Infer from recent roles or location flexibility

## OUTPUT REQUIREMENTS

1. **Create a new file named**: `profile-data-[first-name]-[last-name].json`
2. **Populate all applicable fields** from the profile-data schema
3. **Set null for unparseable fields** rather than guessing
4. **Include confidence scores** in metadata section
5. **Document parsing assumptions** in comments

## QUALITY STANDARDS

- **Accuracy**: Only populate fields with high confidence (80%+)
- **Professional Context**: Maintain executive-level sophistication
- **No Assumptions**: Mark uncertain extractions as null
- **Preserve Details**: Maintain original language for achievements and descriptions
- **Strategic Focus**: Emphasize leadership, impact, and career advancement indicators

## EXAMPLE OUTPUT FORMAT

```json
{
  "profile_data_schema": {
    "metadata": {
      "schema_version": "1.0",
      "created_date": "2024-07-27",
      "parsing_confidence": 85,
      "source_document": "resume-john-doe.pdf",
      "parsing_notes": "High confidence on experience and skills, moderate on preferences"
    },
    "personal_information": {
      "first_name": "John",
      "last_name": "Doe",
      // ... rest of populated fields
    }
    // ... continue with all applicable sections
  }
}
```

## INSTRUCTIONS FOR USE
1. Upload your resume file and this profile-data schema
2. Request: "Parse this resume using the profile-data schema and output a completed profile-data-[firstname]-[lastname].json file"
3. Review the output for accuracy and completeness
4. Save the generated file for import into your job search platform