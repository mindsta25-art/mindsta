# MINDSTA APP - Feature Guide

## 🎓 For Students

### Suggesting New Content
Students can now suggest topics they'd like to learn:

1. **From the Dashboard**: Look for the "Suggest Content" card in the sidebar
2. **Fill in the form**:
   - Topic/Content name (required)
   - Grade level (optional)
   - Subject area (optional)
   - Additional details (optional)
3. **Submit**: Your suggestion goes directly to the admin team
4. **Track Status**: View your suggestions and their approval status

### Navigation Updates
- **Removed**: "Find My Grade" from main navigation (still accessible via direct link if needed)
- **Quick Actions**: Browse Courses, My Learning, All Subjects
- **Streamlined Menu**: Cleaner, more focused student experience

### New Dashboard Features
- **Welcome Banner**: Personalized greeting with your school and grade
- **Quick Stats**: See your enrolled courses, completed lessons, and progress at a glance
- **Continue Learning**: Pick up where you left off with recent lessons
- **Learning Tips**: Helpful suggestions to improve your study habits
- **Grade Browser**: Quick access to lessons for each grade level

---

## 👨‍💼 For Admins

### Managing Content Suggestions

#### Accessing Suggestions
1. Login to admin panel at `/admin-auth`
2. Click "Suggestions" in the sidebar (with lightbulb icon)

#### Viewing Suggestions
- **Filter by**:
  - Status (Pending, Reviewed, Approved, Rejected)
  - Grade level
- **Stats Dashboard**: See total, pending, approved, and rejected counts
- **Sort by date**: Most recent first

#### Processing Suggestions
1. **Click "View"** on any suggestion
2. **Review Details**:
   - Topic name
   - Student's description
   - Suggested grade and subject
   - Student information
3. **Add Admin Notes**: Leave internal comments
4. **Update Status**:
   - Mark as "Reviewed" (acknowledged but not yet decided)
   - "Approve" (will create this content)
   - "Reject" (not suitable for platform)
5. **Delete**: Remove irrelevant or duplicate suggestions

#### Creating Content from Suggestions
1. Review approved suggestions
2. Navigate to **Content Management** (`/admin/content`)
3. Click "Create New Lesson"
4. Use the suggestion details to create relevant content
5. Update the suggestion status to mark it complete

### Managing Subjects

#### Adding New Subjects
1. Go to **Subject Management** (`/admin/subjects`)
2. Click "Add Subject"
3. Fill in:
   - Subject name
   - Category (Core, Science, Social, etc.)
   - Description
   - Icon (visual representation)
   - Color theme
   - Display order
4. Save and activate

#### Managing Existing Subjects
- **Edit**: Update subject details
- **Activate/Deactivate**: Control visibility to students
- **Reorder**: Change display sequence
- **Delete**: Remove unused subjects

### Creating Content/Lessons

#### Lesson Creation
1. Go to **Content Management** (`/admin/content`)
2. Click "Create Lesson" or use the `?create=lesson` parameter
3. **Basic Information**:
   - Title and subtitle
   - Description
   - Subject (choose from your created subjects)
   - Grade level
   - Term
   - Difficulty level
4. **Content**:
   - Rich text description
   - Video URL
   - Image/thumbnail
   - Duration and price
5. **Curriculum** (Advanced):
   - Add sections (e.g., "Introduction", "Main Content", "Practice")
   - Add lectures within sections
   - Include videos, resources, quizzes
6. **Learning Outcomes**:
   - What students will learn
   - Prerequisites
   - Target audience
7. **Save Draft**: Auto-saves progress
8. **Publish**: Make live for students

#### Quiz Creation
1. From Content Management, click "Create Quiz"
2. Select associated lesson
3. Add 10 multiple-choice questions
4. Set correct answers and explanations
5. Configure passing score and time limit
6. Publish

---

## 🔧 Admin Quick Actions

### Daily Workflow
1. **Check Suggestions**: Review new student requests
2. **Monitor Analytics**: View engagement and enrollment stats
3. **Review Reports**: Track student progress and performance
4. **Manage Notifications**: Send updates to students
5. **Process Referrals**: Approve referral partners and payouts

### Content Strategy
1. **Review Approved Suggestions**: Prioritize high-demand topics
2. **Check Subject Coverage**: Ensure all grades have content
3. **Analyze Performance**: Use analytics to improve content
4. **Update Existing Lessons**: Keep content fresh and relevant

---

## 🚀 Best Practices

### For Students
- **Be Specific**: When suggesting content, provide details about what you want to learn
- **Check Existing Content**: Browse available courses before suggesting
- **Provide Context**: Explain why this topic would be helpful
- **Track Your Progress**: Use the dashboard to monitor your learning journey

### For Admins
- **Respond Promptly**: Review suggestions regularly
- **Leave Clear Notes**: Help other admins understand decisions
- **Batch Process**: Handle similar suggestions together
- **Quality Over Quantity**: Create well-structured content
- **Use Subjects Wisely**: Organize content with proper categorization
- **Test Before Publishing**: Preview lessons before making them live

---

## 📱 Navigation Guide

### Student Routes
- `/home` or `/dashboard` - Main dashboard
- `/browse` - Browse all courses
- `/my-learning` - Your enrolled courses
- `/all-grades` - Browse by grade
- `/all-subjects` - Browse by subject
- `/cart` - Shopping cart
- `/wishlist` - Saved courses
- `/profile` - Your profile
- `/settings` - Account settings

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/content` - Create/edit content
- `/admin/lessons` - Lesson management
- `/admin/subjects` - Subject management
- `/admin/suggestions` - Content suggestions (NEW)
- `/admin/notifications` - Send notifications
- `/admin/referrals` - Referral management
- `/admin/analytics` - Platform analytics
- `/admin/reports` - Detailed reports
- `/admin/settings` - System settings

---

## 🎨 Design System

### Brand Colors
- **Primary**: Indigo (#6366f1)
- **Secondary**: Cyan (#06b6d4)
- **Accent Gradients**: Indigo to Cyan
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red

### Component Styles
- **Cards**: Clean white/dark with subtle shadows
- **Buttons**: Gradient primary, outline secondary
- **Icons**: Lucide React icon set
- **Typography**: Clear hierarchy, readable fonts
- **Spacing**: Consistent padding and margins

---

## 🔐 Security Features

### Authentication
- JWT-based secure authentication
- Role-based access control (Student, Admin, Referral)
- Protected routes with automatic redirects
- Secure password storage with bcrypt

### Data Protection
- Input validation and sanitization
- CORS protection
- Rate limiting on API endpoints
- Secure headers with Helmet.js

---

## 📊 Monitoring & Analytics

### For Admins
- Track student enrollments
- Monitor lesson completions
- View popular subjects and topics
- Analyze suggestion trends
- Review referral performance
- Generate custom reports

### For Students
- View your progress statistics
- Track completed vs enrolled courses
- See your learning streaks
- Monitor grade performance

---

## 🆘 Troubleshooting

### Common Issues

**Suggestion not submitting?**
- Ensure topic field is filled (minimum 3 characters)
- Check internet connection
- Verify you're logged in

**Can't access admin panel?**
- Confirm you have admin role
- Check you're using `/admin-auth` for login
- Verify JWT token is valid

**Lessons not loading?**
- Check backend server is running
- Verify MongoDB connection
- Clear browser cache and reload

**Authentication errors?**
- Clear localStorage and re-login
- Check token expiration
- Verify API URL configuration

---

## 📞 Support

For technical issues or questions:
- Check the [UPDATES_SUMMARY.md](./UPDATES_SUMMARY.md) file
- Review API documentation in backend routes
- Contact support at support@mindsta.com

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready ✅
