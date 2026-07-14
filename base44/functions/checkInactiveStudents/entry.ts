import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access using consistent unified schema keys
    const user = await base44.auth.me();
    if (!user || user.app_role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const threeDaysAgo = moment().subtract(3, 'days').startOf('day');
    
    // FIX: Filtering dynamically using 'app_role' as defined in architecture document
    const allStudents = await base44.entities.User.filter({ app_role: 'student' });
    
    let notificationsSent = 0;
    
    for (const student of allStudents) {
      // Fetch academic progress logs to evaluate performance history
      const progresses = await base44.entities.Progress.filter({ student_id: student.id });
      const progress = progresses[0];
      
      if (!progress) continue;
      
      const lastStudyDate = progress.last_study_date ? moment(progress.last_study_date) : null;
      
      // Evaluate if student engagement metrics have lapsed past the 3-day window
      if (!lastStudyDate || lastStudyDate.isBefore(threeDaysAgo)) {
        
        // FIX: Extract active links from ParentChildRelationship instead of LinkRequest
        const activeBonds = await base44.entities.ParentChildRelationship.filter({
          child_id: student.id,
          status: 'active'
        });
        
        for (const bond of activeBonds) {
          // FIX: Query the PARENT's direct inbox for past notifications concerning this child
          const recentNotifications = await base44.entities.Notification.filter({
            user_id: bond.parent_id,
            type: 'inactive_student',
            reference_id: student.id
          });
          
          const lastNotification = recentNotifications.length > 0 
            ? moment(recentNotifications[recentNotifications.length - 1].created_date)
            : null;
          
          // Enforce 48-hour cooling-off window to prevent alert fatigue
          if (!lastNotification || lastNotification.isBefore(moment().subtract(2, 'days'))) {
            
            await base44.entities.Notification.create({
              user_id: bond.parent_id,
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
    
    return Response.json({ 
      success: true, 
      message: `Checked ${allStudents.length} students, dispatched ${notificationsSent} notifications to parents.` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
