import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async () => {
  return Response.json({
    success: false,
    error: "TEST FUNCTION IS RUNNING"
  });
});