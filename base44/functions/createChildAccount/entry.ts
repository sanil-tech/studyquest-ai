import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ===============================
// UTILITIES
// ===============================

const generateStudentId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'SQ-';
  for (let i = 0; i <