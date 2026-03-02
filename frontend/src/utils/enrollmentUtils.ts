// Utility for matching enrollments to courses/lessons
// Ensures purchased courses are always recognized correctly
export function isEnrolled(enrollment, subject, grade, term) {
  // Normalize and compare grades
  const enrollmentGrade = String(enrollment.grade).trim().toLowerCase();
  const courseGrade = String(grade).trim().toLowerCase();
  const gradeMatch = enrollmentGrade === courseGrade || 
                     (enrollmentGrade === 'common entrance' && courseGrade === 'common entrance') ||
                     (enrollmentGrade.replace(/\s/g, '') === courseGrade.replace(/\s/g, ''));
  
  // Normalize and compare subjects (case-insensitive, trim spaces)
  const enrollmentSubject = (enrollment.subject || '').toLowerCase().trim();
  const courseSubject = (subject || '').toLowerCase().trim();
  const subjectMatch = enrollmentSubject === courseSubject;
  
  // Normalize and compare terms (handle null/undefined/empty)
  const enrollmentTerm = (enrollment.term || '').toLowerCase().trim();
  const courseTerm = (term || '').toLowerCase().trim();
  
  // Terms match if:
  // 1. Both are empty/null/undefined (no term specified)
  // 2. Both terms are exactly the same (case-insensitive)
  const termMatch = (!enrollmentTerm && !courseTerm) || (enrollmentTerm === courseTerm);
  
  const isMatch = gradeMatch && subjectMatch && termMatch;
  
  // Debug logging for troubleshooting
  if (isMatch) {
    console.log(`✅ Enrollment match: ${courseSubject} (Grade ${courseGrade}, Term: ${courseTerm || 'N/A'})`);
  }
  
  return isMatch;
}

