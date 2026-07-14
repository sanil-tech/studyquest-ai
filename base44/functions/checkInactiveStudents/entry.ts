import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = moment().startOf('day');
    const threeDaysAgo = moment().subtract(3, 'days').startOf('day');
    
    // Get all students
    const allUsers = await base44.entities.User.filter({ role: 'student' });
    
    let notificationsSent = 0;
    
    for (const student of allUsers) {
      // Get student's progress to check last study date
      const progresses = await base44.entities.Progress.filter({ student_id: student.id });
      const progress = progresses[0];
      
      if (!progress) continue;
      
      const lastStudyDate = progress.last_study_date ? moment(progress.last_study_date) : null;
      
      // Check if student hasn't studied for 3+ days
      if (!lastStudyDate || lastStudyDate.isBefore(threeDaysAgo)) {
        // Check if we already sent a notification recently (within last 2 days)
        const recentNotifications = await base44.entities.Notification.filter({
          user_id: student.id,
          type: 'inactive_student'
        });
        
        const lastNotification = recentNotifications.length > 0 
          ? moment(recentNotifications[recentNotifications.length - 1].created_date)
          : null;
        
        // Only send if no notification in the last 2 days
        if (!lastNotification || lastNotification.isBefore(moment().subtract(2, 'days'))) {
          // Find parent of this student
          const linkRequests = await base44.entities.LinkRequest.filter({
            student_id: student.id,
            status: 'approved'
          });
          
          for (const linkRequest of linkRequests) {
            // Get parent user details
            const parentUsers = await base44.entities.User.filter({ id: linkRequest.parent_id });
            const parent = parentUsers[0];
            
            if (parent) {
              // Create notification for parent
              await base44.entities.Notification.create({
                user_id: parent.id,
                title: `${student.full_name || 'Your child'} hasn't studied in 3 days`,
                message: `${student.full_name || 'Your child'} last studied on ${lastStudyDate ? lastStudyDate.format('DD MMM YYYY') : 'never'}. Encourage them to log in and continue learning!`,
                type: 'inactive_student',
                reference_id: student.id
              });
              
              notificationsSent++;
            }
          }
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Checked ${allUsers.length} students, sent ${notificationsSent} notifications` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});