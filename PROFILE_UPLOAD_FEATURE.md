# Profile Data Upload Feature

## Overview

The Profile Data Upload feature allows users to upload JSON files generated from resume parsing tools to automatically populate their profile form fields. This feature streamlines the profile creation process by eliminating the need for manual data entry.

## Features

### ✅ Implemented Functionality

1. **File Upload Interface**
   - Upload button styled consistently with existing form elements
   - File type validation (JSON only)
   - File size validation (max 5MB)
   - Loading states during file processing

2. **Data Validation**
   - JSON format validation
   - Schema structure validation
   - Metadata validation
   - Comprehensive error handling

3. **Preview Modal**
   - Shows parsed data before applying
   - Displays all extracted fields in organized sections
   - Confirmation dialog before overwriting existing data
   - Cancel option to abort import

4. **Form Population**
   - Auto-populates all profile form fields
   - Handles skills array conversion
   - Preserves existing data for fields not in upload
   - Updates skills text input for editing

5. **User Experience**
   - Mobile-responsive design
   - Accessible keyboard navigation
   - Clear error messages
   - Loading indicators
   - Disabled state during form submission

## File Format Specification

### Expected JSON Structure

```json
{
  "profile_data_schema": {
    "metadata": {
      "schema_version": "1.0.0",
      "source": "resume_parser",
      "parsed_at": "2024-01-15T10:30:00Z"
    },
    "personal_information": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1 (555) 123-4567",
      "linkedin_url": "https://linkedin.com/in/johndoe"
    },
    "professional_profile": {
      "current_title": "Senior Product Manager",
      "target_title": "Product Director",
      "years_experience": 8,
      "career_level": "Senior",
      "industry_category": "Technology",
      "functional_area": "Product Management"
    },
    "skills": [
      "Product Strategy",
      "User Research",
      "Data Analysis",
      "Agile Development"
    ],
    "location": "San Francisco, CA",
    "portfolio_url": "https://johndoe-portfolio.com"
  }
}
```

### Field Mapping

| Upload Field | Form Field | Type | Required |
|--------------|------------|------|----------|
| `personal_information.first_name` | `first_name` | string | ✅ |
| `personal_information.last_name` | `last_name` | string | ✅ |
| `personal_information.linkedin_url` | `linkedin_url` | string | ❌ |
| `personal_information.phone` | `phone_number` | string | ❌ |
| `professional_profile.current_title` | `professional_title` | string | ❌ |
| `professional_profile.years_experience` | `years_experience` | number | ❌ |
| `professional_profile.career_level` | `career_level` | enum | ❌ |
| `professional_profile.industry_category` | `industry_category` | enum | ❌ |
| `skills` | `skills` | string[] | ❌ |
| `location` | `location` | string | ❌ |
| `portfolio_url` | `portfolio_url` | string | ❌ |

## Usage Instructions

### For Users

1. **Navigate to Profile Page**
   - Go to your profile page in the application
   - Click "Edit Profile" to enter edit mode

2. **Upload Profile Data**
   - Look for the "Import Profile Data" section at the top
   - Click the "Upload Profile Data" button
   - Select your JSON file from resume parsing
   - Wait for file processing

3. **Review and Confirm**
   - Preview the extracted data in the modal
   - Verify all information is correct
   - Click "Import Data" to populate the form
   - Or click "Cancel" to abort

4. **Edit and Save**
   - Review all populated fields
   - Make any necessary edits
   - Click "Save Changes" to update your profile

### For Developers

#### Component Integration

```tsx
import ProfileUpload from './components/ProfileUpload';

// In your form component
const handleDataPopulated = (uploadedData: Partial<UserProfileFormData>) => {
  setFormData(prev => ({
    ...prev,
    ...uploadedData
  }));
};

<ProfileUpload 
  onDataPopulated={handleDataPopulated} 
  disabled={loading} 
/>
```

#### Props Interface

```tsx
interface ProfileUploadProps {
  onDataPopulated: (data: Partial<UserProfileFormData>) => void;
  disabled?: boolean;
}
```

## Error Handling

### File Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Please upload a JSON file" | Non-JSON file selected | Select a .json file |
| "File size too large" | File > 5MB | Use smaller file or compress |
| "Invalid JSON format" | Malformed JSON | Check file format |
| "Missing profile_data_schema" | Wrong file structure | Use correct schema format |
| "Missing metadata" | Incomplete schema | Include metadata section |

### User Feedback

- **Error Messages**: Displayed in red error boxes
- **Loading States**: Spinner during file processing
- **Success Feedback**: Preview modal shows extracted data
- **Validation**: Real-time feedback during upload

## Testing

### Manual Testing

1. **Valid File Upload**
   - Use the provided `sample-profile-data.json`
   - Verify all fields populate correctly
   - Check skills array conversion

2. **Error Scenarios**
   - Try uploading non-JSON files
   - Test with malformed JSON
   - Test with files > 5MB
   - Test with incomplete schema

3. **User Experience**
   - Test on mobile devices
   - Verify keyboard navigation
   - Check accessibility features
   - Test cancel functionality

### Automated Testing

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- --testPathPattern=ProfileUpload
```

## Technical Implementation

### Components

- **ProfileUpload.tsx**: Main upload component
- **UserProfile.tsx**: Integration with profile form
- **Validation**: Schema validation logic
- **Modal**: Preview and confirmation dialog

### Key Features

1. **File Processing**
   - Async file reading
   - JSON parsing with error handling
   - Schema validation
   - Data transformation

2. **State Management**
   - Upload progress tracking
   - Error state handling
   - Modal visibility control
   - Form data population

3. **UI/UX**
   - Responsive design
   - Loading indicators
   - Error messaging
   - Accessibility compliance

## Future Enhancements

### Planned Features

- [ ] Drag and drop file upload
- [ ] Multiple file format support (PDF, DOCX)
- [ ] Resume parsing API integration
- [ ] Batch import functionality
- [ ] Export current profile as JSON
- [ ] Template generation for different industries

### Technical Improvements

- [ ] File compression for large uploads
- [ ] Progress bar for file processing
- [ ] Offline support with local storage
- [ ] Advanced validation rules
- [ ] Custom field mapping

## Troubleshooting

### Common Issues

1. **File Not Uploading**
   - Check file size (max 5MB)
   - Verify file is JSON format
   - Check browser console for errors

2. **Data Not Populating**
   - Verify JSON schema structure
   - Check field mapping
   - Ensure metadata is present

3. **Modal Not Showing**
   - Check for JavaScript errors
   - Verify component mounting
   - Check CSS z-index issues

### Debug Information

- Check browser console for detailed error messages
- Verify file content matches expected schema
- Test with sample data file provided
- Check network tab for upload issues

## Support

For technical support or feature requests, please refer to the project documentation or create an issue in the repository. 