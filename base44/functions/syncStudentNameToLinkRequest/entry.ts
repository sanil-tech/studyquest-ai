import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access (automation runs with service role)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the payload (passed by automation)
    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get the updated user
    const updatedUser = await base44.entities.User.get(userId);
    if (!updatedUser || updatedUser.app_role !== 'student') {
      return Response.json({ success: true, message: 'Not a student or user not found' });
    }

    // Find all approved LinkRequests for this student
    const linkRequests = await base44.entities.LinkRequest.filter({
      student_id: userId,
      status: 'approved'
    });

    // Update each LinkRequest with the new student name
    for (const linkRequest of linkRequests) {
      await base44.entities.LinkRequest.update(linkRequest.id, {
        student_name: updatedUser.full_name || updatedUser.email
      });
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${linkRequests.length} LinkRequest(s) for ${updatedUser.full_name || updatedUser.email}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});